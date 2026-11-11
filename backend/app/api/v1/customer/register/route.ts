import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { signPreAuthToken } from "@/app/lib/v1/jwt";
import { jsonError, jsonSuccess } from "@/app/lib/response";
import { CustomerRegisterReq, CustomerRegisterRes } from "@/app/types/v1/api";

export async function POST(request: NextRequest) {
  try {
    // ---------------------------------------------------------
    // 1. Auth Validation: None (Public registration route)
    // ---------------------------------------------------------

    // ---------------------------------------------------------
    // 2. Request Validation: Parse and validate required fields
    // ---------------------------------------------------------
    const body = (await request.json()) as CustomerRegisterReq;

    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const phoneNumber = body.phoneNumber?.trim();
    const middleInitial = body.middleInitial?.trim() || null;

    if (!email || !password || !firstName || !lastName || !phoneNumber) {
      return jsonError("Missing required registration fields", 400);
    }

    // ---------------------------------------------------------
    // 3. Logic:
    //    a. Check if email already registered in DB
    //    b. Hash password using bcrypt (cost 10)
    //    c. Insert new record into customers table
    // ---------------------------------------------------------
    const existing = await db.query.customers.findFirst({
      where: eq(customers.email, email),
    });

    if (existing) {
      return jsonError("Customer with this email already exists", 409, "Conflict");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [newCustomer] = await db
      .insert(customers)
      .values({
        email,
        passwordHash,
        firstName,
        lastName,
        middleInitial,
        phoneNumber,
      })
      .returning();

    // ---------------------------------------------------------
    // 4. Response:
    //    Generate real signed pre-auth token (5m TTL) & return 201
    // ---------------------------------------------------------
    const preAuthToken = await signPreAuthToken({
      userId: newCustomer.id,
      role: "CUSTOMER",
      email: newCustomer.email,
    });

    const response: CustomerRegisterRes = {
      statusMessage: "Registration successful",
      preAuthToken,
    };

    return jsonSuccess(response, 201);
  } catch {
    return jsonError("Invalid request body", 400);
  }
}
