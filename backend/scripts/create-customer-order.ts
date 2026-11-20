/**
 * Auto-Create Customer Order Tool (Staff Testing Helper)
 *
 * Automatically logs in / registers the test customer (gian@gwapo.com),
 * initializes customer order(s), and confirms them with a guaranteed
 * unique tracking ID so they immediately transition to PAYMENT_REQUIRED
 * and show up in the Staff dashboard.
 *
 * Usage:
 *   npx tsx scripts/create-customer-order.ts [count] [--url=http://localhost:3000]
 *   npm run order:create
 *   npm run order:create -- 3
 *   npm run order:create -- --count=5 --price=450 --product="Gaming Mouse"
 */

interface CreatedOrderResult {
  orderId: string;
  ticketCode: string;
  trackingId: string;
  productName: string;
  recipientName: string;
  price: number;
  status: string;
}

const SAMPLE_PRODUCTS = [
  "Keychron K2 Wireless Keyboard",
  "Logitech G Pro X Superlight Mouse",
  "Sony WH-1000XM5 Headphones",
  "Baseus 65W GaN Fast Charger",
  "Kindle Paperwhite 16GB",
  "Stainless Steel Tumbler 900ml",
  "Ergonomic Memory Foam Cushion",
  "USB-C Braided Cable 2M Pack",
];

async function main() {
  const args = process.argv.slice(2);

  // Parse count (positional number or --count=N)
  const countArg =
    args.find((a) => !a.startsWith("--") && !isNaN(Number(a))) ||
    args.find((a) => a.startsWith("--count="))?.split("=")[1];
  const count = countArg ? Math.max(1, parseInt(countArg, 10)) : 1;

  // Base URL
  const urlArg =
    args.find((a) => a.startsWith("http")) ||
    args.find((a) => a.startsWith("--url="))?.split("=")[1];
  const baseUrl = (urlArg || process.env.API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

  // Custom overrides
  const productArg = args.find((a) => a.startsWith("--product="))?.split("=")[1];
  const priceArg = args.find((a) => a.startsWith("--price="))?.split("=")[1];
  const recipientArg = args.find((a) => a.startsWith("--recipient="))?.split("=")[1];

  const email = process.env.TEST_CUSTOMER_EMAIL || "gian@gwapo.com";
  const password = process.env.TEST_CUSTOMER_PASSWORD || "Hello@123";
  const mpin = process.env.TEST_CUSTOMER_MPIN || "1234";

  console.log("===============================================================");
  console.log("        PARCELHUB CUSTOMER TEST ORDER GENERATOR                ");
  console.log("===============================================================");
  console.log(`🎯 Target API URL:   ${baseUrl}`);
  console.log(`👤 Customer Email:   ${email}`);
  console.log(`🔢 MPIN:             ${mpin}`);
  console.log(`📦 Orders to Create: ${count}`);
  console.log("===============================================================\n");

  // Step 1: Authentication / Auto-registration
  console.log(`[1/3] Authenticating as '${email}'...`);
  let authToken = "";

  try {
    // 1a. Try login
    const loginRes = await fetch(`${baseUrl}/api/v1/customer/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    let preAuthToken = "";

    if (loginRes.ok) {
      const loginJson = (await loginRes.json()) as { preAuthToken?: string };
      preAuthToken = loginJson.preAuthToken || "";
      console.log("   ✅ Login credentials verified.");
    } else if (loginRes.status === 404) {
      // User does not exist, auto-register
      console.log("   ⚠️ Customer not found. Auto-registering new account...");
      const regRes = await fetch(`${baseUrl}/api/v1/customer/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          firstName: "Gian",
          lastName: "Gwapo",
          phoneNumber: "+639123456789",
        }),
      });

      if (!regRes.ok) {
        const errText = await regRes.text();
        throw new Error(`Registration failed (${regRes.status}): ${errText}`);
      }

      const regJson = (await regRes.json()) as { preAuthToken?: string };
      preAuthToken = regJson.preAuthToken || "";
      console.log("   ✅ Registration successful.");

      // Setup MPIN
      console.log(`   🔐 Setting initial MPIN '${mpin}'...`);
      const createMpinRes = await fetch(`${baseUrl}/api/v1/customer/create-mpin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preAuthToken, mpin }),
      });

      if (!createMpinRes.ok) {
        const errText = await createMpinRes.text();
        throw new Error(`MPIN creation failed (${createMpinRes.status}): ${errText}`);
      }

      const createMpinJson = (await createMpinRes.json()) as { authToken?: string };
      authToken = createMpinJson.authToken || "";
      console.log("   ✅ Initial MPIN set and auth token acquired.");
    } else {
      const errText = await loginRes.text();
      throw new Error(`Login rejected with HTTP ${loginRes.status}: ${errText}`);
    }

    // 1b. If not registered in this run, verify MPIN to get authToken
    if (!authToken && preAuthToken) {
      console.log(`   🔐 Verifying MPIN '${mpin}'...`);
      const mpinRes = await fetch(`${baseUrl}/api/v1/customer/mpin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preAuthToken, mpin }),
      });

      if (mpinRes.status === 400) {
        // Maybe MPIN was never initialized
        const mpinErr = await mpinRes.json().catch(() => ({}));
        if (typeof mpinErr?.message === "string" && mpinErr.message.includes("set up")) {
          console.log("   ⚠️ MPIN not yet set up. Creating MPIN...");
          const createMpinRes = await fetch(`${baseUrl}/api/v1/customer/create-mpin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ preAuthToken, mpin }),
          });
          const createMpinJson = (await createMpinRes.json()) as { authToken?: string };
          authToken = createMpinJson.authToken || "";
        } else {
          throw new Error(`MPIN verification failed: ${JSON.stringify(mpinErr)}`);
        }
      } else if (!mpinRes.ok) {
        const errText = await mpinRes.text();
        throw new Error(`MPIN verification failed (${mpinRes.status}): ${errText}`);
      } else {
        const mpinJson = (await mpinRes.json()) as { authToken?: string };
        authToken = mpinJson.authToken || "";
      }
    }

    if (!authToken) {
      throw new Error("Unable to obtain JWT authToken.");
    }

    console.log("✅ Authenticated successfully! AuthToken acquired.\n");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`❌ Authentication error: ${msg}`);
    console.error("   Ensure the server is running on http://localhost:3000 or pass --url=<URL>");
    process.exit(1);
  }

  // Step 2: Create orders
  console.log(`[2/3] Generating ${count} order(s)...`);
  const createdOrders: CreatedOrderResult[] = [];

  for (let i = 1; i <= count; i++) {
    try {
      // Step 2a: Initialize order
      const initRes = await fetch(`${baseUrl}/api/v1/customer/orders/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          imageUrl: "https://placehold.co/400x300.jpg",
        }),
      });

      if (!initRes.ok) {
        const errText = await initRes.text();
        throw new Error(`Order initialize failed (${initRes.status}): ${errText}`);
      }

      const initJson = (await initRes.json()) as {
        orderId?: string;
        ticketCode?: string;
      };

      if (!initJson.orderId || !initJson.ticketCode) {
        throw new Error(`Malformed initialize response: ${JSON.stringify(initJson)}`);
      }

      const orderId = initJson.orderId;
      const ticketCode = initJson.ticketCode;

      // Step 2b: Generate unique tracking number and metadata
      // Guaranteed unique: "PH" + Date.now() + 4 random digits + index
      const trackingId = `PH${Date.now()}${Math.floor(1000 + Math.random() * 9000)}${i}`;
      const productName =
        productArg ||
        SAMPLE_PRODUCTS[(i - 1) % SAMPLE_PRODUCTS.length] ||
        `Parcel Item #${i}`;
      const recipientName = recipientArg || "Gian Gwapo";
      const price = priceArg ? parseFloat(priceArg) : 150 + (i * 75) % 600;

      // Step 2c: Confirm / update order (PENDING_INITIALIZATION -> PAYMENT_REQUIRED)
      const putRes = await fetch(`${baseUrl}/api/v1/customer/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          order: {
            trackingId,
            productName,
            recipientName,
            price,
          },
        }),
      });

      if (!putRes.ok) {
        const errText = await putRes.text();
        throw new Error(`Order confirmation failed (${putRes.status}): ${errText}`);
      }

      createdOrders.push({
        orderId,
        ticketCode,
        trackingId,
        productName,
        recipientName,
        price,
        status: "PAYMENT_REQUIRED",
      });

      console.log(
        `   📦 [${i}/${count}] Created: Ticket [${ticketCode}] | Tracking: ${trackingId} | ₱${price} | ${productName}`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`   ❌ Failed to create order #${i}: ${msg}`);
    }
  }

  // Step 3: Print summary table
  console.log("\n===============================================================");
  console.log("                 ORDER CREATION SUMMARY                        ");
  console.log("===============================================================");
  if (createdOrders.length === 0) {
    console.log("❌ No orders were created.");
  } else {
    console.table(
      createdOrders.map((o) => ({
        "Ticket Code": o.ticketCode,
        "Tracking ID": o.trackingId,
        "Product Name": o.productName,
        "Price (PHP)": `₱${o.price.toFixed(2)}`,
        Status: o.status,
      }))
    );
    console.log(
      `🎉 Successfully created ${createdOrders.length} order(s) ready for staff processing!`
    );
    console.log(
      "💡 Staff can now search these Ticket Codes or Tracking Numbers in the Staff UI.\n"
    );
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
