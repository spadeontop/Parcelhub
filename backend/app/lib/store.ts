import {
  AdminOcrConfigAction,
  AdminOcrConfigTarget,
  CustomerId,
  ISO8601Timestamp,
  MPIN,
  OrderId,
  OrderStatus,
  StaffId,
  StaffProfile,
  StatusTimelineEntry,
} from "@/app/types/api";

export interface StoredOrder {
  id: OrderId;
  trackingId: string;
  productName: string;
  recipientName: string;
  price: number;
  change: number;
  amountReceived?: number;
  status: OrderStatus;
  statusTimeline: StatusTimelineEntry[];
  qrImageUrl: string;
  imageUrl?: string;
  proofImageUrl?: string;
  customerId: CustomerId;
  modifiedBy: StaffId | CustomerId | "SYSTEM";
  timestamp: ISO8601Timestamp;
  claimRequested?: boolean;
  claimInitiatedAt?: ISO8601Timestamp;
  claimExpiresAt?: ISO8601Timestamp;
  courierPaid?: boolean;
  courierPaidBy?: StaffId;
  courierPaidAt?: ISO8601Timestamp;
}

export interface StoredCustomer {
  id: CustomerId;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  middleInitial?: string;
  phoneNumber: string;
  mpin?: MPIN;
  blacklisted: boolean;
  blacklistReason?: string;
}

export interface StoredStaff {
  id: StaffId;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  middleInitial?: string;
  phoneNumber: string;
}

export function getClientRetrieveTimerMinutes(): number {
  const envVal = process.env.CLIENT_RETRIEVE_TIMER;
  const parsed = envVal ? Number(envVal) : 5;
  return isNaN(parsed) || parsed <= 0 ? 5 : parsed;
}

class InMemoryStore {
  public orders: Map<OrderId, StoredOrder> = new Map();
  public customers: Map<CustomerId, StoredCustomer> = new Map();
  public customersByEmail: Map<string, CustomerId> = new Map();
  public staff: Map<StaffId, StoredStaff> = new Map();
  public staffByEmail: Map<string, StaffId> = new Map();
  public fcmTokens: Set<string> = new Set();
  public ocrConfig: Record<AdminOcrConfigTarget, boolean> = {
    staff: true,
    customer: true,
  };

  private orderSeq = 500;
  private staffSeq = 2;
  private customerSeq = 2;

  constructor() {
    this.seed();
  }

  private seed() {
    // Seed default customer
    const customerId: CustomerId = "CST-001";
    const customer: StoredCustomer = {
      id: customerId,
      email: "user@example.com",
      passwordHash: "password",
      firstName: "John",
      lastName: "Doe",
      middleInitial: "D",
      phoneNumber: "+639123456789",
      mpin: "1234",
      blacklisted: false,
    };
    this.customers.set(customerId, customer);
    this.customersByEmail.set(customer.email.toLowerCase(), customerId);

    // Seed default staff
    const staffId: StaffId = "STF-001";
    const staffMember: StoredStaff = {
      id: staffId,
      email: "staff@parcelhub.com",
      passwordHash: "string",
      firstName: "Jane",
      lastName: "Smith",
      middleInitial: "A",
      phoneNumber: "+639987654321",
    };
    this.staff.set(staffId, staffMember);
    this.staffByEmail.set(staffMember.email.toLowerCase(), staffId);

    // Seed 2x orders for each state of order
    const seedOrders: StoredOrder[] = [
      // 1. PENDING_INITIALIZATION
      {
        id: "ORD-101",
        trackingId: "PH-PEND-001",
        productName: "Logitech MX Master 3S",
        recipientName: "John Doe",
        price: 0,
        change: 0,
        status: "PENDING_INITIALIZATION",
        statusTimeline: [
          {
            status: "PENDING_INITIALIZATION",
            timestamp: "2026-10-18T08:00:00Z",
          },
        ],
        qrImageUrl: "https://storage.parcelhub.com/qr/ORD-101.png",
        imageUrl: "https://storage.parcelhub.com/init/ORD-101.jpg",
        customerId,
        modifiedBy: customerId,
        timestamp: "2026-10-18T08:00:00Z",
      },
      {
        id: "ORD-102",
        trackingId: "PH-PEND-002",
        productName: "Anker 65W GaN Charger",
        recipientName: "John Doe",
        price: 0,
        change: 0,
        status: "PENDING_INITIALIZATION",
        statusTimeline: [
          {
            status: "PENDING_INITIALIZATION",
            timestamp: "2026-10-18T08:30:00Z",
          },
        ],
        qrImageUrl: "https://storage.parcelhub.com/qr/ORD-102.png",
        imageUrl: "https://storage.parcelhub.com/init/ORD-102.jpg",
        customerId,
        modifiedBy: customerId,
        timestamp: "2026-10-18T08:30:00Z",
      },

      // 2. PAYMENT_REQUIRED
      {
        id: "ORD-201",
        trackingId: "PH883904421101N",
        productName: "VXE R1 Wireless Mouse",
        recipientName: "John Doe",
        price: 480,
        change: 20,
        amountReceived: 0,
        status: "PAYMENT_REQUIRED",
        statusTimeline: [
          {
            status: "PENDING_INITIALIZATION",
            timestamp: "2026-10-18T08:30:00Z",
          },
          {
            status: "PAYMENT_REQUIRED",
            timestamp: "2026-10-18T09:00:00Z",
          },
        ],
        qrImageUrl: "https://storage.parcelhub.com/qr/ORD-201.png",
        customerId,
        modifiedBy: staffId,
        timestamp: "2026-10-18T09:00:00Z",
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
        status: "PAYMENT_REQUIRED",
        statusTimeline: [
          {
            status: "PENDING_INITIALIZATION",
            timestamp: "2026-10-18T09:15:00Z",
          },
          {
            status: "PAYMENT_REQUIRED",
            timestamp: "2026-10-18T09:45:00Z",
          },
        ],
        qrImageUrl: "https://storage.parcelhub.com/qr/ORD-202.png",
        customerId,
        modifiedBy: staffId,
        timestamp: "2026-10-18T09:45:00Z",
        courierPaid: false,
      },

      // 3. AWAITING_PARCEL
      {
        id: "ORD-301",
        trackingId: "PH90823411293K",
        productName: "Poco X6 Pro",
        recipientName: "John Doe",
        price: 12450,
        change: 50,
        amountReceived: 12500,
        status: "AWAITING_PARCEL",
        statusTimeline: [
          {
            status: "PAYMENT_REQUIRED",
            timestamp: "2026-10-17T07:41:00Z",
          },
          {
            status: "AWAITING_PARCEL",
            timestamp: "2026-10-17T12:15:00Z",
          },
        ],
        qrImageUrl: "https://storage.parcelhub.com/qr/ORD-301.png",
        customerId,
        modifiedBy: staffId,
        timestamp: "2026-10-17T12:15:00Z",
        courierPaid: false,
      },
      {
        id: "ORD-302",
        trackingId: "PH719445588312S",
        productName: "Sony WH-1000XM5 Headphones",
        recipientName: "Maria Santos",
        price: 15800,
        change: 200,
        amountReceived: 16000,
        status: "AWAITING_PARCEL",
        statusTimeline: [
          {
            status: "PAYMENT_REQUIRED",
            timestamp: "2026-10-17T08:00:00Z",
          },
          {
            status: "AWAITING_PARCEL",
            timestamp: "2026-10-17T14:00:00Z",
          },
        ],
        qrImageUrl: "https://storage.parcelhub.com/qr/ORD-302.png",
        customerId,
        modifiedBy: staffId,
        timestamp: "2026-10-17T14:00:00Z",
        courierPaid: true,
        courierPaidBy: staffId,
        courierPaidAt: "2026-10-17T14:00:00Z",
      },

      // 4. READY_TO_CLAIM
      {
        id: "ORD-401",
        trackingId: "PH2696153366791H",
        productName: "Ugreen Revodok USB-C Hub",
        recipientName: "John Doe",
        price: 850,
        change: 50,
        amountReceived: 900,
        status: "READY_TO_CLAIM",
        statusTimeline: [
          {
            status: "PAYMENT_REQUIRED",
            timestamp: "2026-10-17T14:00:00Z",
          },
          {
            status: "AWAITING_PARCEL",
            timestamp: "2026-10-17T16:00:00Z",
          },
          {
            status: "READY_TO_CLAIM",
            timestamp: "2026-10-17T20:00:00Z",
          },
        ],
        qrImageUrl: "https://storage.parcelhub.com/qr/ORD-401.png",
        proofImageUrl: "https://storage.parcelhub.com/proof/ORD-401.jpg",
        customerId,
        modifiedBy: staffId,
        timestamp: "2026-10-17T20:00:00Z",
        courierPaid: true,
      },
      {
        id: "ORD-402",
        trackingId: "PH2696153366792H",
        productName: "VXE R1 Nearlink",
        recipientName: "John Doe",
        price: 480,
        change: 20,
        amountReceived: 500,
        status: "READY_TO_CLAIM",
        statusTimeline: [
          {
            status: "PAYMENT_REQUIRED",
            timestamp: "2026-10-17T16:32:00Z",
          },
          {
            status: "AWAITING_PARCEL",
            timestamp: "2026-10-17T18:32:00Z",
          },
          {
            status: "READY_TO_CLAIM",
            timestamp: "2026-10-17T22:32:00Z",
          },
        ],
        qrImageUrl: "https://storage.parcelhub.com/qr/ORD-402.png",
        proofImageUrl: "https://storage.parcelhub.com/proof/ORD-402.jpg",
        customerId,
        modifiedBy: staffId,
        timestamp: "2026-10-17T22:32:00Z",
        courierPaid: true,
      },

      // 5. CLAIMED
      {
        id: "ORD-501",
        trackingId: "PH44219902341L",
        productName: "Keychron K2 Pro Keyboard",
        recipientName: "John Doe",
        price: 4200,
        change: 0,
        amountReceived: 4200,
        status: "CLAIMED",
        statusTimeline: [
          {
            status: "PAYMENT_REQUIRED",
            timestamp: "2026-10-16T10:00:00Z",
          },
          {
            status: "AWAITING_PARCEL",
            timestamp: "2026-10-16T14:00:00Z",
          },
          {
            status: "READY_TO_CLAIM",
            timestamp: "2026-10-16T18:00:00Z",
          },
          {
            status: "CLAIMED",
            timestamp: "2026-10-17T09:15:00Z",
          },
        ],
        qrImageUrl: "https://storage.parcelhub.com/qr/ORD-501.png",
        proofImageUrl: "https://storage.parcelhub.com/proof/ORD-501.jpg",
        customerId,
        modifiedBy: staffId,
        timestamp: "2026-10-17T09:15:00Z",
        courierPaid: true,
      },
      {
        id: "ORD-502",
        trackingId: "PH388112299000K",
        productName: "SanDisk 1TB Extreme Portable SSD",
        recipientName: "John Doe",
        price: 5400,
        change: 100,
        amountReceived: 5500,
        status: "CLAIMED",
        statusTimeline: [
          {
            status: "PAYMENT_REQUIRED",
            timestamp: "2026-10-16T11:00:00Z",
          },
          {
            status: "AWAITING_PARCEL",
            timestamp: "2026-10-16T15:00:00Z",
          },
          {
            status: "READY_TO_CLAIM",
            timestamp: "2026-10-16T19:00:00Z",
          },
          {
            status: "CLAIMED",
            timestamp: "2026-10-17T11:30:00Z",
          },
        ],
        qrImageUrl: "https://storage.parcelhub.com/qr/ORD-502.png",
        proofImageUrl: "https://storage.parcelhub.com/proof/ORD-502.jpg",
        customerId,
        modifiedBy: staffId,
        timestamp: "2026-10-17T11:30:00Z",
        courierPaid: true,
      },

      // 6. CANCELLED
      {
        id: "ORD-601",
        trackingId: "PH-CANC-001",
        productName: "Logitech G304 Lightspeed",
        recipientName: "John Doe",
        price: 1500,
        change: 0,
        amountReceived: 0,
        status: "CANCELLED",
        statusTimeline: [
          {
            status: "PAYMENT_REQUIRED",
            timestamp: "2026-10-15T09:00:00Z",
          },
          {
            status: "CANCELLED",
            timestamp: "2026-10-15T15:00:00Z",
          },
        ],
        qrImageUrl: "https://storage.parcelhub.com/qr/ORD-601.png",
        customerId,
        modifiedBy: customerId,
        timestamp: "2026-10-15T15:00:00Z",
      },
      {
        id: "ORD-602",
        trackingId: "PH-CANC-002",
        productName: "Samsung T7 Shield 1TB",
        recipientName: "John Doe",
        price: 6200,
        change: 0,
        amountReceived: 0,
        status: "CANCELLED",
        statusTimeline: [
          {
            status: "PAYMENT_REQUIRED",
            timestamp: "2026-10-15T10:00:00Z",
          },
          {
            status: "CANCELLED",
            timestamp: "2026-10-15T17:30:00Z",
          },
        ],
        qrImageUrl: "https://storage.parcelhub.com/qr/ORD-602.png",
        customerId,
        modifiedBy: staffId,
        timestamp: "2026-10-15T17:30:00Z",
      },
    ];

    for (const order of seedOrders) {
      this.orders.set(order.id, order);
    }
  }

  // --- Customers ---
  public getCustomerByEmail(email: string): StoredCustomer | undefined {
    const id = this.customersByEmail.get(email.toLowerCase());
    return id ? this.customers.get(id) : undefined;
  }

  public getCustomerById(id: CustomerId): StoredCustomer | undefined {
    return this.customers.get(id);
  }

  public registerCustomer(data: Omit<StoredCustomer, "id" | "blacklisted">): StoredCustomer {
    const id: CustomerId = `CST-${String(this.customerSeq++).padStart(3, "0")}`;
    const newCustomer: StoredCustomer = {
      ...data,
      id,
      blacklisted: false,
    };
    this.customers.set(id, newCustomer);
    this.customersByEmail.set(data.email.toLowerCase(), id);
    return newCustomer;
  }

  public setCustomerMpin(id: CustomerId, mpin: MPIN): boolean {
    const customer = this.customers.get(id);
    if (!customer) return false;
    customer.mpin = mpin;
    return true;
  }

  public blacklistCustomer(id: CustomerId, reason: string): boolean {
    const customer = this.customers.get(id);
    if (!customer) return false;
    customer.blacklisted = true;
    customer.blacklistReason = reason;
    return true;
  }

  // --- Staff ---
  public getStaffByEmail(email: string): StoredStaff | undefined {
    const id = this.staffByEmail.get(email.toLowerCase());
    return id ? this.staff.get(id) : undefined;
  }

  public getStaffById(id: StaffId): StoredStaff | undefined {
    return this.staff.get(id);
  }

  public createStaff(data: Omit<StoredStaff, "id">): StoredStaff {
    const id: StaffId = `STF-${String(this.staffSeq++).padStart(3, "0")}`;
    const newStaff: StoredStaff = {
      ...data,
      id,
    };
    this.staff.set(id, newStaff);
    this.staffByEmail.set(data.email.toLowerCase(), id);
    return newStaff;
  }

  public listStaff(): StaffProfile[] {
    return Array.from(this.staff.values()).map((s) => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      middleInitial: s.middleInitial,
      phoneNumber: s.phoneNumber,
      email: s.email,
    }));
  }

  public updateStaff(id: StaffId, updates: Partial<Omit<StoredStaff, "id">>): boolean {
    const s = this.staff.get(id);
    if (!s) return false;
    if (updates.email && updates.email !== s.email) {
      this.staffByEmail.delete(s.email.toLowerCase());
      this.staffByEmail.set(updates.email.toLowerCase(), id);
      s.email = updates.email;
    }
    if (updates.firstName) s.firstName = updates.firstName;
    if (updates.lastName) s.lastName = updates.lastName;
    if (updates.middleInitial !== undefined) s.middleInitial = updates.middleInitial;
    if (updates.phoneNumber) s.phoneNumber = updates.phoneNumber;
    if (updates.passwordHash) s.passwordHash = updates.passwordHash;
    return true;
  }

  public deleteStaff(id: StaffId): boolean {
    const s = this.staff.get(id);
    if (!s) return false;
    this.staffByEmail.delete(s.email.toLowerCase());
    return this.staff.delete(id);
  }

  // --- Orders ---
  public listOrders(): StoredOrder[] {
    return Array.from(this.orders.values());
  }

  public getOrder(id: OrderId): StoredOrder | undefined {
    return this.orders.get(id);
  }

  public initializeOrder(customerId: CustomerId, imageUrl: string): StoredOrder {
    const id: OrderId = `ORD-${this.orderSeq++}`;
    const now: ISO8601Timestamp = new Date().toISOString();
    const newOrder: StoredOrder = {
      id,
      trackingId: `PH${Math.floor(1000000000000 + Math.random() * 9000000000000)}H`,
      productName: "Initialized Order",
      recipientName: "Customer",
      price: 0,
      change: 0,
      status: "PENDING_INITIALIZATION",
      statusTimeline: [{ status: "PENDING_INITIALIZATION", timestamp: now }],
      qrImageUrl: `https://storage.parcelhub.com/qr/${id}.png`,
      imageUrl,
      customerId,
      modifiedBy: customerId,
      timestamp: now,
    };
    this.orders.set(id, newOrder);
    return newOrder;
  }

  public updateOrder(
    id: OrderId,
    updates: {
      trackingId?: string;
      productName?: string;
      recipientName?: string;
      price?: number;
    },
    modifiedBy: StaffId | CustomerId
  ): StoredOrder | null {
    const order = this.orders.get(id);
    if (!order) return null;

    if (updates.trackingId) order.trackingId = updates.trackingId;
    if (updates.productName) order.productName = updates.productName;
    if (updates.recipientName) order.recipientName = updates.recipientName;
    if (updates.price !== undefined) {
      order.price = updates.price;
      if (order.status === "PENDING_INITIALIZATION") {
        order.status = "PAYMENT_REQUIRED";
        order.statusTimeline.push({
          status: "PAYMENT_REQUIRED",
          timestamp: new Date().toISOString(),
        });
      }
    }
    order.modifiedBy = modifiedBy;
    order.timestamp = new Date().toISOString();
    return order;
  }

  public cancelOrder(id: OrderId, modifiedBy: StaffId | CustomerId): StoredOrder | null {
    const order = this.orders.get(id);
    if (!order) return null;
    order.status = "CANCELLED";
    order.statusTimeline.push({
      status: "CANCELLED",
      timestamp: new Date().toISOString(),
    });
    order.modifiedBy = modifiedBy;
    order.timestamp = new Date().toISOString();
    return order;
  }

  public claimByCustomer(id: OrderId): { order: StoredOrder; durationMinutes: number } | null {
    const order = this.orders.get(id);
    if (!order) return null;
    const durationMinutes = getClientRetrieveTimerMinutes();
    const initiatedAt = new Date();
    const expiresAt = new Date(initiatedAt.getTime() + durationMinutes * 60 * 1000);

    order.claimRequested = true;
    order.claimInitiatedAt = initiatedAt.toISOString();
    order.claimExpiresAt = expiresAt.toISOString();
    order.timestamp = initiatedAt.toISOString();
    return { order, durationMinutes };
  }

  public isClaimActive(order: StoredOrder): boolean {
    if (!order.claimRequested || !order.claimExpiresAt) return false;
    const now = Date.now();
    const expiry = new Date(order.claimExpiresAt).getTime();
    return now <= expiry;
  }

  public getClaimRemainingSeconds(order: StoredOrder): number {
    if (!order.claimRequested || !order.claimExpiresAt) return 0;
    const diffMs = new Date(order.claimExpiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diffMs / 1000));
  }

  public activateOrder(id: OrderId, amountReceived: number, staffId: StaffId): { order: StoredOrder; change: number } | null {
    const order = this.orders.get(id);
    if (!order) return null;

    const change = Math.max(0, amountReceived - order.price);
    order.amountReceived = amountReceived;
    order.change = change;
    order.status = "AWAITING_PARCEL";
    order.statusTimeline.push({
      status: "AWAITING_PARCEL",
      timestamp: new Date().toISOString(),
    });
    order.modifiedBy = staffId;
    order.timestamp = new Date().toISOString();
    return { order, change };
  }

  public recordCourierPayment(id: OrderId, staffId: StaffId): StoredOrder | null {
    const order = this.orders.get(id);
    if (!order) return null;
    const now = new Date().toISOString();
    order.courierPaid = true;
    order.courierPaidBy = staffId;
    order.courierPaidAt = now;
    order.modifiedBy = staffId;
    order.timestamp = now;
    return order;
  }

  public attachProofPhoto(id: OrderId, imageUrl: string, staffId: StaffId): StoredOrder | null {
    const order = this.orders.get(id);
    if (!order) return null;
    order.proofImageUrl = imageUrl;
    order.status = "READY_TO_CLAIM";
    order.statusTimeline.push({
      status: "READY_TO_CLAIM",
      timestamp: new Date().toISOString(),
    });
    order.modifiedBy = staffId;
    order.timestamp = new Date().toISOString();
    return order;
  }

  public claimByStaff(id: OrderId, staffId: StaffId): StoredOrder | null {
    const order = this.orders.get(id);
    if (!order) return null;
    order.status = "CLAIMED";
    order.claimRequested = false;
    order.statusTimeline.push({
      status: "CLAIMED",
      timestamp: new Date().toISOString(),
    });
    order.modifiedBy = staffId;
    order.timestamp = new Date().toISOString();
    return order;
  }

  // --- OCR Config ---
  public setOcrConfig(target: AdminOcrConfigTarget, action: AdminOcrConfigAction): void {
    this.ocrConfig[target] = action === "enable";
  }

  // --- FCM Tokens ---
  public addFcmToken(token: string): void {
    this.fcmTokens.add(token);
  }
}

// Global singleton instance
const globalForStore = globalThis as unknown as { storeInstance?: InMemoryStore };
export const db = globalForStore.storeInstance ?? new InMemoryStore();
if (process.env.NODE_ENV !== "production") globalForStore.storeInstance = db;
