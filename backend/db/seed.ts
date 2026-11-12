import bcrypt from "bcryptjs";
import { db } from "./index";
import { runMigrations } from "./migrate";
import { appConfig, customers, orders, staff } from "./schema";

export async function seedDatabase() {
  console.log("🌱 Running migrations on database...");
  await runMigrations();

  console.log("🌱 Seeding database...");

  const customerPasswordHash = await bcrypt.hash("password", 10);
  const customerMpinHash = await bcrypt.hash("1234", 10);
  const staffPasswordHash = await bcrypt.hash("string", 10);

  // -------------------------------------------------------------
  // 1. Seed 2 Customers
  // -------------------------------------------------------------
  const customer1Id = "CST-001";
  const customer2Id = "CST-002";

  await db
    .insert(customers)
    .values([
      {
        id: customer1Id,
        email: "user@example.com",
        passwordHash: customerPasswordHash,
        firstName: "John",
        lastName: "Doe",
        middleInitial: "D",
        phoneNumber: "+639123456789",
        mpin: customerMpinHash,
        blacklisted: false,
      },
      {
        id: customer2Id,
        email: "maria@example.com",
        passwordHash: customerPasswordHash,
        firstName: "Maria",
        lastName: "Santos",
        middleInitial: "C",
        phoneNumber: "+639987654321",
        mpin: customerMpinHash,
        blacklisted: false,
      },
    ])
    .onConflictDoNothing();

  // -------------------------------------------------------------
  // 2. Seed Default Staff
  // -------------------------------------------------------------
  const staffId = "STF-001";
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

  // -------------------------------------------------------------
  // 3. Seed Default OCR App Config
  // -------------------------------------------------------------
  await db
    .insert(appConfig)
    .values({
      key: "ocrConfig",
      value: { staff: true, customer: true },
    })
    .onConflictDoNothing();

  // -------------------------------------------------------------
  // 4. Seed Orders: 2 orders per status per customer (no CANCELLED)
  //    Statuses: PENDING_INITIALIZATION (2), PAYMENT_REQUIRED (2),
  //              AWAITING_PARCEL (2), READY_TO_CLAIM (2), CLAIMED (2)
  //    Total: 10 per customer = 20 orders total
  // -------------------------------------------------------------
  const seedOrders = [
    // ==========================================
    // CUSTOMER 1 (John Doe)
    // ==========================================
    // 1. PENDING_INITIALIZATION
    {
      id: "ORD-C1-PEND-01",
      ticketCode: "101-111",
      trackingId: "PH-C1-001",
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
      imageUrl: "https://storage.parcelhub.com/init/ORD-C1-PEND-01.jpg",
      customerId: customer1Id,
      modifiedBy: customer1Id,
      timestamp: new Date("2026-10-18T08:00:00Z"),
    },
    {
      id: "ORD-C1-PEND-02",
      ticketCode: "101-112",
      trackingId: "PH-C1-002",
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
      imageUrl: "https://storage.parcelhub.com/init/ORD-C1-PEND-02.jpg",
      customerId: customer1Id,
      modifiedBy: customer1Id,
      timestamp: new Date("2026-10-18T08:30:00Z"),
    },

    // 2. PAYMENT_REQUIRED
    {
      id: "ORD-C1-PAY-01",
      ticketCode: "101-201",
      trackingId: "PH-C1-003",
      productName: "VXE R1 Wireless Mouse",
      recipientName: "John Doe",
      price: 480,
      change: 0,
      amountReceived: 0,
      status: "PAYMENT_REQUIRED" as const,
      statusTimeline: [
        { status: "PENDING_INITIALIZATION" as const, timestamp: "2026-10-18T08:30:00Z" },
        { status: "PAYMENT_REQUIRED" as const, timestamp: "2026-10-18T09:00:00Z" },
      ],
      customerId: customer1Id,
      modifiedBy: staffId,
      timestamp: new Date("2026-10-18T09:00:00Z"),
      courierPaid: false,
    },
    {
      id: "ORD-C1-PAY-02",
      ticketCode: "101-202",
      trackingId: "PH-C1-004",
      productName: "Baseus Magnetic Power Bank 10000mAh",
      recipientName: "John Doe",
      price: 1250,
      change: 0,
      amountReceived: 0,
      status: "PAYMENT_REQUIRED" as const,
      statusTimeline: [
        { status: "PENDING_INITIALIZATION" as const, timestamp: "2026-10-18T09:15:00Z" },
        { status: "PAYMENT_REQUIRED" as const, timestamp: "2026-10-18T09:45:00Z" },
      ],
      customerId: customer1Id,
      modifiedBy: staffId,
      timestamp: new Date("2026-10-18T09:45:00Z"),
      courierPaid: false,
    },

    // 3. AWAITING_PARCEL (1 courier unpaid, 1 courier paid)
    {
      id: "ORD-C1-AWT-01",
      ticketCode: "101-301",
      trackingId: "PH-C1-005",
      productName: "UGREEN Nexode 100W Desktop Charger",
      recipientName: "John Doe",
      price: 2400,
      change: 100,
      amountReceived: 2500,
      status: "AWAITING_PARCEL" as const,
      statusTimeline: [
        { status: "PENDING_INITIALIZATION" as const, timestamp: "2026-10-18T08:00:00Z" },
        { status: "PAYMENT_REQUIRED" as const, timestamp: "2026-10-18T08:30:00Z" },
        { status: "AWAITING_PARCEL" as const, timestamp: "2026-10-18T09:00:00Z" },
      ],
      customerId: customer1Id,
      modifiedBy: staffId,
      timestamp: new Date("2026-10-18T09:00:00Z"),
      courierPaid: false,
    },
    {
      id: "ORD-C1-AWT-02",
      ticketCode: "101-302",
      trackingId: "PH-C1-006",
      productName: "Edifier W820NB Plus Headphones",
      recipientName: "John Doe",
      price: 2890,
      change: 110,
      amountReceived: 3000,
      status: "AWAITING_PARCEL" as const,
      statusTimeline: [
        { status: "PENDING_INITIALIZATION" as const, timestamp: "2026-10-18T08:15:00Z" },
        { status: "PAYMENT_REQUIRED" as const, timestamp: "2026-10-18T08:45:00Z" },
        { status: "AWAITING_PARCEL" as const, timestamp: "2026-10-18T09:15:00Z" },
      ],
      customerId: customer1Id,
      modifiedBy: staffId,
      timestamp: new Date("2026-10-18T09:15:00Z"),
      courierPaid: true,
      courierPaidBy: staffId,
      courierPaidAt: new Date("2026-10-18T09:20:00Z"),
    },

    // 4. READY_TO_CLAIM (Ready for customer pickup; claimRequested: false for manual testing)
    {
      id: "ORD-C1-RDY-01",
      ticketCode: "101-401",
      trackingId: "PH-C1-007",
      productName: "Sony WH-1000XM5 Wireless Headphones",
      recipientName: "John Doe",
      price: 18990,
      change: 10,
      amountReceived: 19000,
      status: "READY_TO_CLAIM" as const,
      statusTimeline: [
        { status: "PENDING_INITIALIZATION" as const, timestamp: "2026-10-17T08:00:00Z" },
        { status: "PAYMENT_REQUIRED" as const, timestamp: "2026-10-17T09:00:00Z" },
        { status: "AWAITING_PARCEL" as const, timestamp: "2026-10-17T10:00:00Z" },
        { status: "READY_TO_CLAIM" as const, timestamp: "2026-10-17T11:00:00Z" },
      ],
      imageUrl: "https://storage.parcelhub.com/init/ORD-C1-RDY-01.jpg",
      proofImageUrl: "https://storage.parcelhub.com/proof/ORD-C1-RDY-01.jpg",
      customerId: customer1Id,
      modifiedBy: staffId,
      courierPaid: true,
      courierPaidBy: staffId,
      courierPaidAt: new Date("2026-10-17T10:30:00Z"),
      claimRequested: false,
      timestamp: new Date("2026-10-17T11:00:00Z"),
    },
    {
      id: "ORD-C1-RDY-02",
      ticketCode: "101-402",
      trackingId: "PH-C1-008",
      productName: "Kindle Paperwhite 11th Gen",
      recipientName: "John Doe",
      price: 7990,
      change: 10,
      amountReceived: 8000,
      status: "READY_TO_CLAIM" as const,
      statusTimeline: [
        { status: "PENDING_INITIALIZATION" as const, timestamp: "2026-10-17T08:30:00Z" },
        { status: "PAYMENT_REQUIRED" as const, timestamp: "2026-10-17T09:30:00Z" },
        { status: "AWAITING_PARCEL" as const, timestamp: "2026-10-17T10:30:00Z" },
        { status: "READY_TO_CLAIM" as const, timestamp: "2026-10-17T11:30:00Z" },
      ],
      imageUrl: "https://storage.parcelhub.com/init/ORD-C1-RDY-02.jpg",
      proofImageUrl: "https://storage.parcelhub.com/proof/ORD-C1-RDY-02.jpg",
      customerId: customer1Id,
      modifiedBy: staffId,
      courierPaid: true,
      courierPaidBy: staffId,
      courierPaidAt: new Date("2026-10-17T10:45:00Z"),
      claimRequested: false,
      timestamp: new Date("2026-10-17T11:30:00Z"),
    },

    // 5. CLAIMED
    {
      id: "ORD-C1-CLM-01",
      ticketCode: "101-501",
      trackingId: "PH-C1-009",
      productName: "Keychron K2 Pro Mechanical Keyboard",
      recipientName: "John Doe",
      price: 4200,
      change: 0,
      amountReceived: 4200,
      status: "CLAIMED" as const,
      statusTimeline: [
        { status: "PAYMENT_REQUIRED" as const, timestamp: "2026-10-16T10:00:00Z" },
        { status: "AWAITING_PARCEL" as const, timestamp: "2026-10-16T14:00:00Z" },
        { status: "READY_TO_CLAIM" as const, timestamp: "2026-10-16T18:00:00Z" },
        { status: "CLAIMED" as const, timestamp: "2026-10-17T09:15:00Z" },
      ],
      imageUrl: "https://storage.parcelhub.com/init/ORD-C1-CLM-01.jpg",
      proofImageUrl: "https://storage.parcelhub.com/proof/ORD-C1-CLM-01.jpg",
      customerId: customer1Id,
      modifiedBy: staffId,
      timestamp: new Date("2026-10-17T09:15:00Z"),
      courierPaid: true,
      courierPaidBy: staffId,
      courierPaidAt: new Date("2026-10-16T15:00:00Z"),
      claimRequested: false,
    },
    {
      id: "ORD-C1-CLM-02",
      ticketCode: "101-502",
      trackingId: "PH-C1-010",
      productName: "SanDisk 1TB Extreme Portable SSD",
      recipientName: "John Doe",
      price: 5400,
      change: 100,
      amountReceived: 5500,
      status: "CLAIMED" as const,
      statusTimeline: [
        { status: "PAYMENT_REQUIRED" as const, timestamp: "2026-10-16T11:00:00Z" },
        { status: "AWAITING_PARCEL" as const, timestamp: "2026-10-16T15:00:00Z" },
        { status: "READY_TO_CLAIM" as const, timestamp: "2026-10-16T19:00:00Z" },
        { status: "CLAIMED" as const, timestamp: "2026-10-17T11:30:00Z" },
      ],
      imageUrl: "https://storage.parcelhub.com/init/ORD-C1-CLM-02.jpg",
      proofImageUrl: "https://storage.parcelhub.com/proof/ORD-C1-CLM-02.jpg",
      customerId: customer1Id,
      modifiedBy: staffId,
      timestamp: new Date("2026-10-17T11:30:00Z"),
      courierPaid: true,
      courierPaidBy: staffId,
      courierPaidAt: new Date("2026-10-16T16:00:00Z"),
      claimRequested: false,
    },

    // ==========================================
    // CUSTOMER 2 (Maria Santos)
    // ==========================================
    // 1. PENDING_INITIALIZATION
    {
      id: "ORD-C2-PEND-01",
      ticketCode: "202-101",
      trackingId: "PH-C2-001",
      productName: "Apple 20W USB-C Power Adapter",
      recipientName: "Maria Santos",
      price: 0,
      change: 0,
      status: "PENDING_INITIALIZATION" as const,
      statusTimeline: [
        { status: "PENDING_INITIALIZATION" as const, timestamp: "2026-10-18T08:00:00Z" },
      ],
      imageUrl: "https://storage.parcelhub.com/init/ORD-C2-PEND-01.jpg",
      customerId: customer2Id,
      modifiedBy: customer2Id,
      timestamp: new Date("2026-10-18T08:00:00Z"),
    },
    {
      id: "ORD-C2-PEND-02",
      ticketCode: "202-102",
      trackingId: "PH-C2-002",
      productName: "Logitech K380 Multi-Device Bluetooth Keyboard",
      recipientName: "Maria Santos",
      price: 0,
      change: 0,
      status: "PENDING_INITIALIZATION" as const,
      statusTimeline: [
        { status: "PENDING_INITIALIZATION" as const, timestamp: "2026-10-18T08:30:00Z" },
      ],
      imageUrl: "https://storage.parcelhub.com/init/ORD-C2-PEND-02.jpg",
      customerId: customer2Id,
      modifiedBy: customer2Id,
      timestamp: new Date("2026-10-18T08:30:00Z"),
    },

    // 2. PAYMENT_REQUIRED
    {
      id: "ORD-C2-PAY-01",
      ticketCode: "202-201",
      trackingId: "PH-C2-003",
      productName: "Xiaomi Smart Band 8 Active",
      recipientName: "Maria Santos",
      price: 990,
      change: 0,
      amountReceived: 0,
      status: "PAYMENT_REQUIRED" as const,
      statusTimeline: [
        { status: "PENDING_INITIALIZATION" as const, timestamp: "2026-10-18T09:00:00Z" },
        { status: "PAYMENT_REQUIRED" as const, timestamp: "2026-10-18T09:30:00Z" },
      ],
      customerId: customer2Id,
      modifiedBy: staffId,
      timestamp: new Date("2026-10-18T09:30:00Z"),
      courierPaid: false,
    },
    {
      id: "ORD-C2-PAY-02",
      ticketCode: "202-202",
      trackingId: "PH-C2-004",
      productName: "JBL Go 3 Portable Bluetooth Speaker",
      recipientName: "Maria Santos",
      price: 1899,
      change: 0,
      amountReceived: 0,
      status: "PAYMENT_REQUIRED" as const,
      statusTimeline: [
        { status: "PENDING_INITIALIZATION" as const, timestamp: "2026-10-18T09:15:00Z" },
        { status: "PAYMENT_REQUIRED" as const, timestamp: "2026-10-18T09:45:00Z" },
      ],
      customerId: customer2Id,
      modifiedBy: staffId,
      timestamp: new Date("2026-10-18T09:45:00Z"),
      courierPaid: false,
    },

    // 3. AWAITING_PARCEL (1 courier unpaid, 1 courier paid)
    {
      id: "ORD-C2-AWT-01",
      ticketCode: "202-301",
      trackingId: "PH-C2-005",
      productName: "Philips Hue Smart Bulb E27",
      recipientName: "Maria Santos",
      price: 1690,
      change: 10,
      amountReceived: 1700,
      status: "AWAITING_PARCEL" as const,
      statusTimeline: [
        { status: "PENDING_INITIALIZATION" as const, timestamp: "2026-10-18T08:00:00Z" },
        { status: "PAYMENT_REQUIRED" as const, timestamp: "2026-10-18T08:30:00Z" },
        { status: "AWAITING_PARCEL" as const, timestamp: "2026-10-18T09:00:00Z" },
      ],
      customerId: customer2Id,
      modifiedBy: staffId,
      timestamp: new Date("2026-10-18T09:00:00Z"),
      courierPaid: false,
    },
    {
      id: "ORD-C2-AWT-02",
      ticketCode: "202-302",
      trackingId: "PH-C2-006",
      productName: "Cosori Air Fryer Pro LE 4.7L",
      recipientName: "Maria Santos",
      price: 5290,
      change: 10,
      amountReceived: 5300,
      status: "AWAITING_PARCEL" as const,
      statusTimeline: [
        { status: "PENDING_INITIALIZATION" as const, timestamp: "2026-10-18T08:15:00Z" },
        { status: "PAYMENT_REQUIRED" as const, timestamp: "2026-10-18T08:45:00Z" },
        { status: "AWAITING_PARCEL" as const, timestamp: "2026-10-18T09:15:00Z" },
      ],
      customerId: customer2Id,
      modifiedBy: staffId,
      timestamp: new Date("2026-10-18T09:15:00Z"),
      courierPaid: true,
      courierPaidBy: staffId,
      courierPaidAt: new Date("2026-10-18T09:20:00Z"),
    },

    // 4. READY_TO_CLAIM (claimRequested: false for manual testing)
    {
      id: "ORD-C2-RDY-01",
      ticketCode: "202-401",
      trackingId: "PH-C2-007",
      productName: "Oral-B Pro 2000 Electric Toothbrush",
      recipientName: "Maria Santos",
      price: 2490,
      change: 10,
      amountReceived: 2500,
      status: "READY_TO_CLAIM" as const,
      statusTimeline: [
        { status: "PENDING_INITIALIZATION" as const, timestamp: "2026-10-17T08:00:00Z" },
        { status: "PAYMENT_REQUIRED" as const, timestamp: "2026-10-17T09:00:00Z" },
        { status: "AWAITING_PARCEL" as const, timestamp: "2026-10-17T10:00:00Z" },
        { status: "READY_TO_CLAIM" as const, timestamp: "2026-10-17T11:00:00Z" },
      ],
      imageUrl: "https://storage.parcelhub.com/init/ORD-C2-RDY-01.jpg",
      proofImageUrl: "https://storage.parcelhub.com/proof/ORD-C2-RDY-01.jpg",
      customerId: customer2Id,
      modifiedBy: staffId,
      courierPaid: true,
      courierPaidBy: staffId,
      courierPaidAt: new Date("2026-10-17T10:30:00Z"),
      claimRequested: false,
      timestamp: new Date("2026-10-17T11:00:00Z"),
    },
    {
      id: "ORD-C2-RDY-02",
      ticketCode: "202-402",
      trackingId: "PH-C2-008",
      productName: "Fujifilm Instax Mini 12",
      recipientName: "Maria Santos",
      price: 3990,
      change: 10,
      amountReceived: 4000,
      status: "READY_TO_CLAIM" as const,
      statusTimeline: [
        { status: "PENDING_INITIALIZATION" as const, timestamp: "2026-10-17T08:30:00Z" },
        { status: "PAYMENT_REQUIRED" as const, timestamp: "2026-10-17T09:30:00Z" },
        { status: "AWAITING_PARCEL" as const, timestamp: "2026-10-17T10:30:00Z" },
        { status: "READY_TO_CLAIM" as const, timestamp: "2026-10-17T11:30:00Z" },
      ],
      imageUrl: "https://storage.parcelhub.com/init/ORD-C2-RDY-02.jpg",
      proofImageUrl: "https://storage.parcelhub.com/proof/ORD-C2-RDY-02.jpg",
      customerId: customer2Id,
      modifiedBy: staffId,
      courierPaid: true,
      courierPaidBy: staffId,
      courierPaidAt: new Date("2026-10-17T10:45:00Z"),
      claimRequested: false,
      timestamp: new Date("2026-10-17T11:30:00Z"),
    },

    // 5. CLAIMED
    {
      id: "ORD-C2-CLM-01",
      ticketCode: "202-501",
      trackingId: "PH-C2-009",
      productName: "Nespresso Essenza Mini Coffee Machine",
      recipientName: "Maria Santos",
      price: 8990,
      change: 10,
      amountReceived: 9000,
      status: "CLAIMED" as const,
      statusTimeline: [
        { status: "PAYMENT_REQUIRED" as const, timestamp: "2026-10-16T10:00:00Z" },
        { status: "AWAITING_PARCEL" as const, timestamp: "2026-10-16T14:00:00Z" },
        { status: "READY_TO_CLAIM" as const, timestamp: "2026-10-16T18:00:00Z" },
        { status: "CLAIMED" as const, timestamp: "2026-10-17T09:15:00Z" },
      ],
      imageUrl: "https://storage.parcelhub.com/init/ORD-C2-CLM-01.jpg",
      proofImageUrl: "https://storage.parcelhub.com/proof/ORD-C2-CLM-01.jpg",
      customerId: customer2Id,
      modifiedBy: staffId,
      timestamp: new Date("2026-10-17T09:15:00Z"),
      courierPaid: true,
      courierPaidBy: staffId,
      courierPaidAt: new Date("2026-10-16T15:00:00Z"),
      claimRequested: false,
    },
    {
      id: "ORD-C2-CLM-02",
      ticketCode: "202-502",
      trackingId: "PH-C2-010",
      productName: "Instant Pot Duo 7-in-1 5.7L",
      recipientName: "Maria Santos",
      price: 6490,
      change: 10,
      amountReceived: 6500,
      status: "CLAIMED" as const,
      statusTimeline: [
        { status: "PAYMENT_REQUIRED" as const, timestamp: "2026-10-16T11:00:00Z" },
        { status: "AWAITING_PARCEL" as const, timestamp: "2026-10-16T15:00:00Z" },
        { status: "READY_TO_CLAIM" as const, timestamp: "2026-10-16T19:00:00Z" },
        { status: "CLAIMED" as const, timestamp: "2026-10-17T11:30:00Z" },
      ],
      imageUrl: "https://storage.parcelhub.com/init/ORD-C2-CLM-02.jpg",
      proofImageUrl: "https://storage.parcelhub.com/proof/ORD-C2-CLM-02.jpg",
      customerId: customer2Id,
      modifiedBy: staffId,
      timestamp: new Date("2026-10-17T11:30:00Z"),
      courierPaid: true,
      courierPaidBy: staffId,
      courierPaidAt: new Date("2026-10-16T16:00:00Z"),
      claimRequested: false,
    },
  ];

  for (const o of seedOrders) {
    await db.insert(orders).values(o).onConflictDoNothing();
  }

  console.log("✅ Database seeded successfully with 2 customers and 20 orders!");
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Seed failed:", err);
      process.exit(1);
    });
}
