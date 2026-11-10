import { db } from "./index";
import { runMigrations } from "./migrate";
import { appConfig, customers, orders, staff } from "./schema";
import { originalSeedOrders } from "./seed-data";

export async function seedDatabase() {
  console.log("🌱 Running migrations on database...");
  await runMigrations();

  console.log("🌱 Seeding database...");

  // Seed default customer
  const customerId = "CST-001";
  await db
    .insert(customers)
    .values({
      id: customerId,
      email: "user@example.com",
      passwordHash: "password",
      firstName: "John",
      lastName: "Doe",
      middleInitial: "D",
      phoneNumber: "+639123456789",
      mpin: "1234",
      blacklisted: false,
    })
    .onConflictDoNothing();

  // Seed default staff
  const staffId = "STF-001";
  await db
    .insert(staff)
    .values({
      id: staffId,
      email: "staff@parcelhub.com",
      passwordHash: "string",
      firstName: "Jane",
      lastName: "Smith",
      middleInitial: "A",
      phoneNumber: "+639987654321",
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

  // Seed all original seed orders
  for (const o of (originalSeedOrders as any[])) {
    await db
      .insert(orders)
      .values({
        id: o.id,
        trackingId: o.trackingId,
        productName: o.productName,
        recipientName: o.recipientName,
        price: o.price,
        change: o.change,
        amountReceived: o.amountReceived,
        status: o.status,
        statusTimeline: o.statusTimeline,
        qrImageUrl: o.qrImageUrl,
        imageUrl: o.imageUrl,
        proofImageUrl: o.proofImageUrl,
        customerId: o.customerId,
        modifiedBy: o.modifiedBy,
        claimRequested: o.claimRequested ?? false,
        claimInitiatedAt: o.claimInitiatedAt ? new Date(o.claimInitiatedAt) : undefined,
        claimExpiresAt: o.claimExpiresAt ? new Date(o.claimExpiresAt) : undefined,
        courierPaid: o.courierPaid ?? false,
        courierPaidBy: o.courierPaidBy,
        courierPaidAt: o.courierPaidAt ? new Date(o.courierPaidAt) : undefined,
        timestamp: new Date(o.timestamp),
      })
      .onConflictDoNothing();
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
