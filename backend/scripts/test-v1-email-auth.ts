import fs from "fs";
import path from "path";

if (!process.env.JWT_SECRET) {
  const envPath = path.resolve(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [k, ...vParts] = trimmed.split("=");
      if (k && vParts.length > 0 && !process.env[k.trim()]) {
        process.env[k.trim()] = vParts.join("=").trim();
      }
    }
  }
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "186f119c25ef504b47594fb1747672fd13542abc4b0c0a1767dd3b34745c3f2f";
}
process.env.EMAIL_ENABLED = "false";
process.env.EMAIL_TEST_SINK = "true";
process.env.EMAIL_OTP_RESEND_COOLDOWN_SEC = "60";
process.env.EMAIL_OTP_MAX_ATTEMPTS = "5";

import assert from "node:assert";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { customers, emailVerificationCodes } from "../db/schema";
import { clearCapturedTestEmails, getCapturedTestEmails } from "../app/lib/v1/email";

import { POST as registerCustomer } from "../app/api/v1/customer/register/route";
import { POST as loginCustomer } from "../app/api/v1/customer/login/route";
import { POST as sendEmailVerification } from "../app/api/v1/customer/email/send-verification/route";
import { POST as verifyCustomerEmail } from "../app/api/v1/customer/email/verify/route";
import { POST as createMpin } from "../app/api/v1/customer/create-mpin/route";
import { POST as verifyMpin } from "../app/api/v1/customer/mpin/route";
import { POST as refreshAuthToken } from "../app/api/v1/customer/refresh/route";
import { GET as getCustomerProfile } from "../app/api/v1/customer/profile/route";
import { POST as forgotPassword } from "../app/api/v1/customer/forgot-password/route";
import { POST as verifyForgotPasswordOtp } from "../app/api/v1/customer/forgot-password/verify/route";
import { POST as resetPassword } from "../app/api/v1/customer/forgot-password/reset/route";
import { POST as forgotMpin } from "../app/api/v1/customer/forgot-mpin/route";
import { POST as verifyForgotMpinOtp } from "../app/api/v1/customer/forgot-mpin/verify/route";
import { POST as resetMpin } from "../app/api/v1/customer/forgot-mpin/reset/route";

function makeReq(
  url: string,
  options: { method?: string; body?: unknown; token?: string } = {}
) {
  const { method = "POST", body, token } = options;
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function extractLatestOtpFor(email: string): string {
  const matches = getCapturedTestEmails().filter((m) => m.to === email);
  const latest = matches[matches.length - 1];
  assert.ok(latest, `Expected captured email for ${email}`);
  const match = latest.text.match(/Your verification code:\s*(\d{6})/);
  assert.ok(match, `Expected 6-digit OTP in email for ${email}`);
  return match[1];
}

async function runEmailAuthTests() {
  console.log("🚀 Starting V1 Email Verification & Account Recovery Tests...\n");

  const ts = Date.now();
  const primaryEmail = `email_auth_${ts}@example.com`;
  const noMpinEmail = `email_auth_nompin_${ts}@example.com`;
  const nonExistentEmail = `nonexistent_${ts}@example.com`;
  const initialPassword = "Password123!";
  const updatedPassword = "NewPassword456!";
  const initialMpin = "1234";
  const updatedMpin = "5678";

  try {
    // 1. Hard-locked registration
    console.log("1. Testing hard-locked registration (no preAuthToken before verification)...");
    clearCapturedTestEmails();
    const regRes = await registerCustomer(
      makeReq("http://localhost:3000/api/v1/customer/register", {
        body: {
          email: primaryEmail,
          password: initialPassword,
          firstName: "Email",
          lastName: "Tester",
          phoneNumber: "+639991112222",
        },
      })
    );
    const regJson = await regRes.json();
    assert.strictEqual(regRes.status, 201);
    assert.strictEqual(regJson.emailVerificationRequired, true);
    assert.strictEqual(regJson.verificationEmailSent, true);
    assert.strictEqual(regJson.preAuthToken, undefined);
    const initialOtp = extractLatestOtpFor(primaryEmail);

    // Re-registering unverified email -> 409 EmailPendingVerification
    const dupUnverifiedRes = await registerCustomer(
      makeReq("http://localhost:3000/api/v1/customer/register", {
        body: {
          email: primaryEmail,
          password: initialPassword,
          firstName: "Email",
          lastName: "Tester",
          phoneNumber: "+639991112222",
        },
      })
    );
    const dupUnverifiedJson = await dupUnverifiedRes.json();
    assert.strictEqual(dupUnverifiedRes.status, 409);
    assert.strictEqual(dupUnverifiedJson.error, "EmailPendingVerification");
    console.log("   ✅ Hard-locked registration & pending-verification conflict verified.");

    // 2. Anti-enumeration on login + EmailNotVerified gate
    console.log("2. Testing anti-enumeration login & EmailNotVerified gate...");
    const unknownLoginRes = await loginCustomer(
      makeReq("http://localhost:3000/api/v1/customer/login", {
        body: { email: nonExistentEmail, password: "wrong" },
      })
    );
    const unknownLoginJson = await unknownLoginRes.json();
    assert.strictEqual(unknownLoginRes.status, 401);
    assert.strictEqual(unknownLoginJson.message, "Invalid email or password");

    const wrongPwLoginRes = await loginCustomer(
      makeReq("http://localhost:3000/api/v1/customer/login", {
        body: { email: primaryEmail, password: "WrongPassword!" },
      })
    );
    const wrongPwLoginJson = await wrongPwLoginRes.json();
    assert.strictEqual(wrongPwLoginRes.status, 401);
    assert.strictEqual(wrongPwLoginJson.message, "Invalid email or password");

    const unverifiedLoginRes = await loginCustomer(
      makeReq("http://localhost:3000/api/v1/customer/login", {
        body: { email: primaryEmail, password: initialPassword },
      })
    );
    const unverifiedLoginJson = await unverifiedLoginRes.json();
    assert.strictEqual(unverifiedLoginRes.status, 403);
    assert.strictEqual(unverifiedLoginJson.error, "EmailNotVerified");
    console.log("   ✅ Anti-enum login & unverified gate verified.");

    // 3. Cooldown, anti-enum resend, and 5-attempt OTP lockout
    console.log("3. Testing OTP cooldown, anti-enum resend, and 5-attempt lockout...");
    const unknownResendRes = await sendEmailVerification(
      makeReq("http://localhost:3000/api/v1/customer/email/send-verification", {
        body: { email: nonExistentEmail },
      })
    );
    assert.strictEqual(unknownResendRes.status, 200);

    const cooldownRes = await sendEmailVerification(
      makeReq("http://localhost:3000/api/v1/customer/email/send-verification", {
        body: { email: primaryEmail },
      })
    );
    const cooldownJson = await cooldownRes.json();
    assert.strictEqual(cooldownRes.status, 429);
    assert.strictEqual(cooldownJson.error, "OtpCooldownActive");

    // 5 wrong attempts lock out initialOtp
    const wrongCode = initialOtp === "000000" ? "000001" : "000000";
    for (let i = 0; i < 5; i++) {
      const badVerifyRes = await verifyCustomerEmail(
        makeReq("http://localhost:3000/api/v1/customer/email/verify", {
          body: { email: primaryEmail, code: wrongCode },
        })
      );
      assert.strictEqual(badVerifyRes.status, 400);
    }

    // Real initialOtp must now fail due to lockout
    const lockedRes = await verifyCustomerEmail(
      makeReq("http://localhost:3000/api/v1/customer/email/verify", {
        body: { email: primaryEmail, code: initialOtp },
      })
    );
    assert.strictEqual(lockedRes.status, 400);

    // Backdate createdAt to simulate cooldown elapsed, resend, and verify
    await db
      .update(emailVerificationCodes)
      .set({ createdAt: new Date(Date.now() - 120_000) })
      .where(eq(emailVerificationCodes.email, primaryEmail));

    const resendRes = await sendEmailVerification(
      makeReq("http://localhost:3000/api/v1/customer/email/send-verification", {
        body: { email: primaryEmail },
      })
    );
    assert.strictEqual(resendRes.status, 200);
    const freshVerifyOtp = extractLatestOtpFor(primaryEmail);

    const verifyRes = await verifyCustomerEmail(
      makeReq("http://localhost:3000/api/v1/customer/email/verify", {
        body: { email: primaryEmail, code: freshVerifyOtp },
      })
    );
    const verifyJson = await verifyRes.json();
    assert.strictEqual(verifyRes.status, 200);
    assert.strictEqual(verifyJson.emailVerified, true);
    assert.strictEqual(verifyJson.hasMpin, false);
    assert.ok(verifyJson.preAuthToken);
    console.log("   ✅ Cooldown, 5-attempt lockout, resend, and verify->preAuthToken verified.");

    // 4. Create MPIN -> full session tokens
    console.log("4. Testing create-mpin after email verification...");
    const createMpinRes = await createMpin(
      makeReq("http://localhost:3000/api/v1/customer/create-mpin", {
        body: { preAuthToken: verifyJson.preAuthToken, mpin: initialMpin },
      })
    );
    const createMpinJson = await createMpinRes.json();
    assert.strictEqual(createMpinRes.status, 200);
    assert.strictEqual(createMpinJson.customer.emailVerified, true);
    const oldAuthToken = createMpinJson.authToken as string;
    const oldRefreshToken = createMpinJson.refreshToken as string;
    console.log("   ✅ MPIN created & session tokens issued.");

    // 5. Forgot Password -> Verify -> Reset (Auto-Login + tokenVersion revocation + replay rejection)
    console.log("5. Testing forgot-password (anti-enum + auto-login + tokenVersion revocation)...");
    const fpUnknownRes = await forgotPassword(
      makeReq("http://localhost:3000/api/v1/customer/forgot-password", {
        body: { email: nonExistentEmail },
      })
    );
    assert.strictEqual(fpUnknownRes.status, 200);

    const fpRes = await forgotPassword(
      makeReq("http://localhost:3000/api/v1/customer/forgot-password", {
        body: { email: primaryEmail },
      })
    );
    assert.strictEqual(fpRes.status, 200);
    const fpOtp = extractLatestOtpFor(primaryEmail);

    const fpVerifyRes = await verifyForgotPasswordOtp(
      makeReq("http://localhost:3000/api/v1/customer/forgot-password/verify", {
        body: { email: primaryEmail, code: fpOtp },
      })
    );
    const fpVerifyJson = await fpVerifyRes.json();
    assert.strictEqual(fpVerifyRes.status, 200);
    assert.ok(fpVerifyJson.resetToken);

    const fpResetRes = await resetPassword(
      makeReq("http://localhost:3000/api/v1/customer/forgot-password/reset", {
        body: { resetToken: fpVerifyJson.resetToken, newPassword: updatedPassword },
      })
    );
    const fpResetJson = await fpResetRes.json();
    assert.strictEqual(fpResetRes.status, 200);
    assert.strictEqual(fpResetJson.requiresMpinCreation, false);
    assert.ok(fpResetJson.authToken, "Auto-login authToken must be returned");
    assert.ok(fpResetJson.refreshToken, "Auto-login refreshToken must be returned");

    // Replaying resetToken must fail (tokenVersion bumped)
    const fpReplayRes = await resetPassword(
      makeReq("http://localhost:3000/api/v1/customer/forgot-password/reset", {
        body: { resetToken: fpVerifyJson.resetToken, newPassword: "AnotherPassword1!" },
      })
    );
    assert.strictEqual(fpReplayRes.status, 401);

    // Old authToken & old refreshToken must be revoked
    const oldProfileRes = await getCustomerProfile(
      makeReq("http://localhost:3000/api/v1/customer/profile", {
        method: "GET",
        token: oldAuthToken,
      })
    );
    assert.strictEqual(oldProfileRes.status, 401);

    const oldRefreshRes = await refreshAuthToken(
      makeReq("http://localhost:3000/api/v1/customer/refresh", {
        body: { refreshToken: oldRefreshToken, mpin: initialMpin },
      })
    );
    assert.strictEqual(oldRefreshRes.status, 401);

    // New authToken works
    const newProfileRes = await getCustomerProfile(
      makeReq("http://localhost:3000/api/v1/customer/profile", {
        method: "GET",
        token: fpResetJson.authToken,
      })
    );
    assert.strictEqual(newProfileRes.status, 200);
    console.log("   ✅ Forgot-password auto-login, replay protection, and tokenVersion revocation verified.");

    // 6. Forgot MPIN -> Verify -> Reset (Auto-Login + tokenVersion revocation + new MPIN login)
    console.log("6. Testing forgot-mpin (anti-enum + auto-login + tokenVersion revocation)...");
    const fmUnknownRes = await forgotMpin(
      makeReq("http://localhost:3000/api/v1/customer/forgot-mpin", {
        body: { email: nonExistentEmail },
      })
    );
    assert.strictEqual(fmUnknownRes.status, 200);

    const fmRes = await forgotMpin(
      makeReq("http://localhost:3000/api/v1/customer/forgot-mpin", {
        body: { email: primaryEmail },
      })
    );
    assert.strictEqual(fmRes.status, 200);
    const fmOtp = extractLatestOtpFor(primaryEmail);

    const fmVerifyRes = await verifyForgotMpinOtp(
      makeReq("http://localhost:3000/api/v1/customer/forgot-mpin/verify", {
        body: { email: primaryEmail, code: fmOtp },
      })
    );
    const fmVerifyJson = await fmVerifyRes.json();
    assert.strictEqual(fmVerifyRes.status, 200);
    assert.ok(fmVerifyJson.resetToken);

    const fmResetRes = await resetMpin(
      makeReq("http://localhost:3000/api/v1/customer/forgot-mpin/reset", {
        body: { resetToken: fmVerifyJson.resetToken, newMpin: updatedMpin },
      })
    );
    const fmResetJson = await fmResetRes.json();
    assert.strictEqual(fmResetRes.status, 200);
    assert.ok(fmResetJson.authToken);
    assert.ok(fmResetJson.refreshToken);

    // Prior authToken from password reset is now revoked too
    const revokedAfterMpinRes = await getCustomerProfile(
      makeReq("http://localhost:3000/api/v1/customer/profile", {
        method: "GET",
        token: fpResetJson.authToken,
      })
    );
    assert.strictEqual(revokedAfterMpinRes.status, 401);

    // Replay resetToken fails
    const fmReplayRes = await resetMpin(
      makeReq("http://localhost:3000/api/v1/customer/forgot-mpin/reset", {
        body: { resetToken: fmVerifyJson.resetToken, newMpin: "9999" },
      })
    );
    assert.strictEqual(fmReplayRes.status, 401);

    // Login with updated password + updated MPIN works
    const loginRes = await loginCustomer(
      makeReq("http://localhost:3000/api/v1/customer/login", {
        body: { email: primaryEmail, password: updatedPassword },
      })
    );
    const loginJson = await loginRes.json();
    assert.strictEqual(loginRes.status, 200);
    assert.strictEqual(loginJson.hasMpin, true);

    const mpinLoginRes = await verifyMpin(
      makeReq("http://localhost:3000/api/v1/customer/mpin", {
        body: { preAuthToken: loginJson.preAuthToken, mpin: updatedMpin },
      })
    );
    assert.strictEqual(mpinLoginRes.status, 200);
    console.log("   ✅ Forgot-mpin auto-login, revocation, and login with updated credentials verified.");

    // 7. Forgot-password edge case: user verified email but has NOT created MPIN yet
    console.log("7. Testing forgot-password when customer has no MPIN yet...");
    await registerCustomer(
      makeReq("http://localhost:3000/api/v1/customer/register", {
        body: {
          email: noMpinEmail,
          password: initialPassword,
          firstName: "NoMpin",
          lastName: "Tester",
          phoneNumber: "+639991113333",
        },
      })
    );
    const noMpinVerifyOtp = extractLatestOtpFor(noMpinEmail);
    const noMpinVerifyEmailRes = await verifyCustomerEmail(
      makeReq("http://localhost:3000/api/v1/customer/email/verify", {
        body: { email: noMpinEmail, code: noMpinVerifyOtp },
      })
    );
    assert.strictEqual(noMpinVerifyEmailRes.status, 200);

    await forgotPassword(
      makeReq("http://localhost:3000/api/v1/customer/forgot-password", {
        body: { email: noMpinEmail },
      })
    );
    const noMpinResetOtp = extractLatestOtpFor(noMpinEmail);
    const noMpinFpVerifyRes = await verifyForgotPasswordOtp(
      makeReq("http://localhost:3000/api/v1/customer/forgot-password/verify", {
        body: { email: noMpinEmail, code: noMpinResetOtp },
      })
    );
    const noMpinFpVerifyJson = await noMpinFpVerifyRes.json();
    const noMpinResetRes = await resetPassword(
      makeReq("http://localhost:3000/api/v1/customer/forgot-password/reset", {
        body: { resetToken: noMpinFpVerifyJson.resetToken, newPassword: updatedPassword },
      })
    );
    const noMpinResetJson = await noMpinResetRes.json();
    assert.strictEqual(noMpinResetRes.status, 200);
    assert.strictEqual(noMpinResetJson.requiresMpinCreation, true);
    assert.ok(noMpinResetJson.preAuthToken);
    assert.strictEqual(noMpinResetJson.authToken, undefined);
    console.log("   ✅ Password reset without MPIN returns preAuthToken + requiresMpinCreation=true.");

    console.log("\n🎉 ALL EMAIL VERIFICATION & RECOVERY TESTS PASSED!");
  } finally {
    await db.delete(customers).where(eq(customers.email, primaryEmail)).catch(() => undefined);
    await db.delete(customers).where(eq(customers.email, noMpinEmail)).catch(() => undefined);
  }
}

runEmailAuthTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Email Auth Tests Failed:", err);
    process.exit(1);
  });
