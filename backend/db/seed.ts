import bcrypt from "bcryptjs";
import { db } from "./index";
import { runMigrations } from "./migrate";
import { appConfig, customers, orders, staff } from "./schema";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  console.log("🌱 Running migrations on database...");
  await runMigrations();

  console.log("🌱 Seeding database...");

  // Seed default customer
  const customerId = "CST-001";
  const customerPasswordHash = await bcrypt.hash("password", 10);
  const customerMpinHash = await bcrypt.hash("1234", 10);

  await db
    .insert(customers)
    .values({
      id: customerId,
      email: "user@example.com",
      passwordHash: customerPasswordHash,
      firstName: "John",
      lastName: "Doe",
      middleInitial: "D",
      phoneNumber: "+639123456789",
      mpin: customerMpinHash,
      blacklisted: false,
    })
    .onConflictDoNothing();

  // Seed default staff
  const staffId = "STF-001";
  const staffPasswordHash = await bcrypt.hash("string", 10);

  await db
    .insert(staff)
    .values({
      id: staffId,
      username: "staff",
      passwordHash: staffPasswordHash,
      firstName: "Jane",
      lastName: "Smith",
      middleInitial: "A",
    })
    .onConflictDoNothing();

  // Seed default OCR app config
  await db
    .insert(appConfig)
    .values({
      key: "ocrConfig",
      value: { staff: true, customer: true },
    })
    .onConflictDoNothing();

  // Seed sample orders
  const seedOrders = [
    {
      id: "ORD-101",
      trackingId: "PH-PEND-001",
      productName: "Logitech MX Master 3S",
      recipientName: "John Doe",
      price: 0,
      change: 0,
      status: "PENDING_INITIALIZATION" as const,
      statusTimeline: [
        {
          status: "PENDING_INITIALIZATION" as const,
          timestamp: "2026-10-18T08:00:00Z",
        },
      ],
      imageUrl: "https://storage.parcelhub.com/init/ORD-101.jpg",
      customerId,
      modifiedBy: customerId,
      timestamp: new Date("2026-10-18T08:00:00Z"),
    },
    {
      id: "ORD-102",
      trackingId: "PH-PEND-002",
      productName: "Anker 65W GaN Charger",
      recipientName: "John Doe",
      price: 0,
      change: 0,
      status: "PENDING_INITIALIZATION" as const,
      statusTimeline: [
        {
          status: "PENDING_INITIALIZATION" as const,
          timestamp: "2026-10-18T08:30:00Z",
        },
      ],
      imageUrl: "https://storage.parcelhub.com/init/ORD-102.jpg",
      customerId,
      modifiedBy: customerId,
      timestamp: new Date("2026-10-18T08:30:00Z"),
    },
    {
      id: "ORD-201",
      trackingId: "PH883904421101N",
      productName: "VXE R1 Wireless Mouse",
      recipientName: "John Doe",
      price: 480,
      change: 20,
      amountReceived: 0,
      status: "PAYMENT_REQUIRED" as const,
      statusTimeline: [
        {
          status: "PENDING_INITIALIZATION" as const,
          timestamp: "2026-10-18T08:30:00Z",
        },
        {
          status: "PAYMENT_REQUIRED" as const,
          timestamp: "2026-10-18T09:00:00Z",
        },
      ],
      customerId,
      modifiedBy: staffId,
      timestamp: new Date("2026-10-18T09:00:00Z"),
      courierPaid: false,
    },
    {
      id: "ORD-202",
      trackingId: "PH883904421102N",
      productName: "Baseus Magnetic Power Bank 10000mAh",
      recipientName: "John Doe",
      price: 1250,
      change: 50,
      amountReceived: 0,
      status: "PAYMENT_REQUIRED" as const,
      statusTimeline: [
        {
          status: "PENDING_INITIALIZATION" as const,
          timestamp: "2026-10-18T09:15:00Z",
        },
        {
          status: "PAYMENT_REQUIRED" as const,
          timestamp: "2026-10-18T09:45:00Z",
        },
      ],
      customerId,
      modifiedBy: staffId,
      timestamp: new Date("2026-10-18T09:45:00Z"),
      courierPaid: false,
    },
  ];

  for (const o of seedOrders) {
    await db.insert(orders).values(o).onConflictDoNothing();
  }

  console.log("✅ Database seeded successfully!");
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Seed failed:", err);
      process.exit(1);
    });
}
