import { eq, sql } from "drizzle-orm";
import { db as drizzleDb, pglite } from "@/db/index";
import { seedDatabase } from "@/db/seed";
import { appConfig, customers, fcmTokens, orders, staff } from "@/db/schema";
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
  ticketCode?: string | null;
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

let initPromise: Promise<void> | null = null;

async function ensureDatabaseInitialized(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await seedDatabase();
    } catch (err) {
      console.error("Database initialization check error:", err);
    }
  })();

  return initPromise;
}

export class DatabaseStore {
  // Helper to map DB row to StoredCustomer
  private toStoredCustomer(row: any): StoredCustomer {
    return {
      id: row.id as CustomerId,
      email: row.email,
      passwordHash: row.passwordHash,
      firstName: row.firstName,
      lastName: row.lastName,
      middleInitial: row.middleInitial ?? undefined,
      phoneNumber: row.phoneNumber,
      mpin: (row.mpin as MPIN) ?? undefined,
      blacklisted: row.blacklisted,
      blacklistReason: row.blacklistReason ?? undefined,
    };
  }

  // Helper to map DB row to StoredStaff
  private toStoredStaff(row: any): StoredStaff {
    return {
      id: row.id as StaffId,
      email: row.email,
      passwordHash: row.passwordHash,
      firstName: row.firstName,
      lastName: row.lastName,
      middleInitial: row.middleInitial ?? undefined,
      phoneNumber: row.phoneNumber,
    };
  }

  // Helper to map DB row to StoredOrder
  private toStoredOrder(row: any): StoredOrder {
    return {
      id: row.id as OrderId,
      ticketCode: row.ticketCode,
      trackingId: row.trackingId,
      productName: row.productName,
      recipientName: row.recipientName,
      price: Number(row.price),
      change: Number(row.change),
      amountReceived: row.amountReceived !== null ? Number(row.amountReceived) : undefined,
      status: row.status as OrderStatus,
      statusTimeline: (row.statusTimeline as StatusTimelineEntry[]) || [],
      qrImageUrl: row.qrImageUrl,
      imageUrl: row.imageUrl ?? undefined,
      proofImageUrl: row.proofImageUrl ?? undefined,
      customerId: row.customerId as CustomerId,
      modifiedBy: row.modifiedBy as StaffId | CustomerId | "SYSTEM",
      timestamp: row.timestamp instanceof Date ? row.timestamp.toISOString() : String(row.timestamp),
      claimRequested: row.claimRequested,
      claimInitiatedAt: row.claimInitiatedAt ? (row.claimInitiatedAt instanceof Date ? row.claimInitiatedAt.toISOString() : String(row.claimInitiatedAt)) : undefined,
      claimExpiresAt: row.claimExpiresAt ? (row.claimExpiresAt instanceof Date ? row.claimExpiresAt.toISOString() : String(row.claimExpiresAt)) : undefined,
      courierPaid: row.courierPaid,
      courierPaidBy: (row.courierPaidBy as StaffId) ?? undefined,
      courierPaidAt: row.courierPaidAt ? (row.courierPaidAt instanceof Date ? row.courierPaidAt.toISOString() : String(row.courierPaidAt)) : undefined,
    };
  }

  // --- Customers ---
  public async getCustomerByEmail(email: string): Promise<StoredCustomer | undefined> {
    await ensureDatabaseInitialized();
    const rows = await drizzleDb
      .select()
      .from(customers)
      .where(sql`LOWER(${customers.email}) = LOWER(${email.trim()})`)
      .limit(1);
    return rows[0] ? this.toStoredCustomer(rows[0]) : undefined;
  }

  public async getCustomerById(id: CustomerId): Promise<StoredCustomer | undefined> {
    await ensureDatabaseInitialized();
    const rows = await drizzleDb.select().from(customers).where(eq(customers.id, id)).limit(1);
    return rows[0] ? this.toStoredCustomer(rows[0]) : undefined;
  }

  public async registerCustomer(data: Omit<StoredCustomer, "id" | "blacklisted">): Promise<StoredCustomer> {
    await ensureDatabaseInitialized();
    // Count existing to preserve CST-xxx convention if desired
    const countRes = await drizzleDb.select({ count: sql<number>`count(*)` }).from(customers);
    const seq = (countRes[0]?.count ?? 0) + 1;
    const id: CustomerId = `CST-${String(seq).padStart(3, "0")}`;

    const inserted = await drizzleDb
      .insert(customers)
      .values({
        id,
        email: data.email.trim(),
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        middleInitial: data.middleInitial,
        phoneNumber: data.phoneNumber,
        mpin: data.mpin,
        blacklisted: false,
      })
      .returning();

    return this.toStoredCustomer(inserted[0]);
  }

  public async setCustomerMpin(id: CustomerId, mpin: MPIN): Promise<boolean> {
    await ensureDatabaseInitialized();
    const result = await drizzleDb
      .update(customers)
      .set({ mpin, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return result.length > 0;
  }

  public async blacklistCustomer(id: CustomerId, reason: string): Promise<boolean> {
    await ensureDatabaseInitialized();
    const result = await drizzleDb
      .update(customers)
      .set({ blacklisted: true, blacklistReason: reason, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return result.length > 0;
  }

  // --- Staff ---
  public async getStaffByEmail(email: string): Promise<StoredStaff | undefined> {
    await ensureDatabaseInitialized();
    const rows = await drizzleDb
      .select()
      .from(staff)
      .where(sql`LOWER(${staff.email}) = LOWER(${email.trim()})`)
      .limit(1);
    return rows[0] ? this.toStoredStaff(rows[0]) : undefined;
  }

  public async getStaffById(id: StaffId): Promise<StoredStaff | undefined> {
    await ensureDatabaseInitialized();
    const rows = await drizzleDb.select().from(staff).where(eq(staff.id, id)).limit(1);
    return rows[0] ? this.toStoredStaff(rows[0]) : undefined;
  }

  public async createStaff(data: Omit<StoredStaff, "id">): Promise<StoredStaff> {
    await ensureDatabaseInitialized();
    const countRes = await drizzleDb.select({ count: sql<number>`count(*)` }).from(staff);
    const seq = (countRes[0]?.count ?? 0) + 1;
    const id: StaffId = `STF-${String(seq).padStart(3, "0")}`;

    const inserted = await drizzleDb
      .insert(staff)
      .values({
        id,
        email: data.email.trim(),
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        middleInitial: data.middleInitial,
        phoneNumber: data.phoneNumber,
      })
      .returning();

    return this.toStoredStaff(inserted[0]);
  }

  public async listStaff(): Promise<StaffProfile[]> {
    await ensureDatabaseInitialized();
    const rows = await drizzleDb.select().from(staff);
    return rows.map((s: any) => ({
      id: s.id as StaffId,
      firstName: s.firstName,
      lastName: s.lastName,
      middleInitial: s.middleInitial ?? undefined,
      phoneNumber: s.phoneNumber,
      email: s.email,
    }));
  }

  public async updateStaff(id: StaffId, updates: Partial<Omit<StoredStaff, "id">>): Promise<boolean> {
    await ensureDatabaseInitialized();
    const updatePayload: Record<string, any> = { updatedAt: new Date() };
    if (updates.email) updatePayload.email = updates.email.trim();
    if (updates.firstName) updatePayload.firstName = updates.firstName;
    if (updates.lastName) updatePayload.lastName = updates.lastName;
    if (updates.middleInitial !== undefined) updatePayload.middleInitial = updates.middleInitial;
    if (updates.phoneNumber) updatePayload.phoneNumber = updates.phoneNumber;
    if (updates.passwordHash) updatePayload.passwordHash = updates.passwordHash;

    const result = await drizzleDb.update(staff).set(updatePayload).where(eq(staff.id, id)).returning();
    return result.length > 0;
  }

  public async deleteStaff(id: StaffId): Promise<boolean> {
    await ensureDatabaseInitialized();
    const result = await drizzleDb.delete(staff).where(eq(staff.id, id)).returning();
    return result.length > 0;
  }

  // --- Orders ---
  public async listOrders(): Promise<StoredOrder[]> {
    await ensureDatabaseInitialized();
    const rows = await drizzleDb.select().from(orders);
    return rows.map((r: any) => this.toStoredOrder(r));
  }

  public async getOrder(id: OrderId): Promise<StoredOrder | undefined> {
    await ensureDatabaseInitialized();
    const rows = await drizzleDb.select().from(orders).where(eq(orders.id, id)).limit(1);
    return rows[0] ? this.toStoredOrder(rows[0]) : undefined;
  }

  public async getActiveOrderByTrackingId(trackingId: string, excludeOrderId?: OrderId): Promise<StoredOrder | undefined> {
    await ensureDatabaseInitialized();
    const normalized = trackingId.trim().toUpperCase();
    if (!normalized) return undefined;

    const all = await drizzleDb.select().from(orders);
    const found = all.find((order: any) => {
      if (excludeOrderId && order.id === excludeOrderId) return false;
      const isSameTracking = order.trackingId.trim().toUpperCase() === normalized;
      const isActive = order.status !== "CLAIMED" && order.status !== "CANCELLED";
      return isSameTracking && isActive;
    });

    return found ? this.toStoredOrder(found) : undefined;
  }

  public async initializeOrder(customerId: CustomerId, imageUrl: string, trackingId?: string): Promise<StoredOrder> {
    await ensureDatabaseInitialized();
    const countRes = await drizzleDb.select({ count: sql<number>`count(*)` }).from(orders);
    const seq = 500 + (countRes[0]?.count ?? 0);
    const id: OrderId = `ORD-${seq}`;
    const now = new Date();
    const assignedTrackingId = trackingId?.trim() || `PH${Math.floor(1000000000000 + Math.random() * 9000000000000)}H`;

    const inserted = await drizzleDb
      .insert(orders)
      .values({
        id,
        trackingId: assignedTrackingId,
        productName: "Initialized Order",
        recipientName: "Customer",
        price: 0,
        change: 0,
        status: "PENDING_INITIALIZATION",
        statusTimeline: [{ status: "PENDING_INITIALIZATION", timestamp: now.toISOString() }],
        qrImageUrl: `https://storage.parcelhub.com/qr/${id}.png`,
        imageUrl,
        customerId,
        modifiedBy: customerId,
        timestamp: now,
      })
      .returning();

    return this.toStoredOrder(inserted[0]);
  }

  public async updateOrder(
    id: OrderId,
    updates: {
      trackingId?: string;
      productName?: string;
      recipientName?: string;
      price?: number;
    },
    modifiedBy: StaffId | CustomerId
  ): Promise<StoredOrder | null> {
    await ensureDatabaseInitialized();
    const existing = await this.getOrder(id);
    if (!existing) return null;

    if (existing.status !== "PENDING_INITIALIZATION" && existing.status !== "PAYMENT_REQUIRED") {
      return null;
    }

    const newTimeline = [...existing.statusTimeline];
    let newStatus = existing.status;

    if (updates.price !== undefined && existing.status === "PENDING_INITIALIZATION") {
      newStatus = "PAYMENT_REQUIRED";
      newTimeline.push({
        status: "PAYMENT_REQUIRED",
        timestamp: new Date().toISOString(),
      });
    }

    const updatePayload: Record<string, any> = {
      modifiedBy,
      timestamp: new Date(),
      status: newStatus,
      statusTimeline: newTimeline,
    };

    if (updates.trackingId) updatePayload.trackingId = updates.trackingId.trim();
    if (updates.productName) updatePayload.productName = updates.productName;
    if (updates.recipientName) updatePayload.recipientName = updates.recipientName;
    if (updates.price !== undefined) updatePayload.price = updates.price;

    const result = await drizzleDb.update(orders).set(updatePayload).where(eq(orders.id, id)).returning();
    return result[0] ? this.toStoredOrder(result[0]) : null;
  }

  public async cancelOrder(id: OrderId, modifiedBy: StaffId | CustomerId): Promise<StoredOrder | null> {
    await ensureDatabaseInitialized();
    const existing = await this.getOrder(id);
    if (!existing) return null;

    const timeline = [
      ...existing.statusTimeline,
      { status: "CANCELLED" as OrderStatus, timestamp: new Date().toISOString() },
    ];

    const result = await drizzleDb
      .update(orders)
      .set({
        status: "CANCELLED",
        statusTimeline: timeline,
        modifiedBy,
        timestamp: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    return result[0] ? this.toStoredOrder(result[0]) : null;
  }

  public async claimByCustomer(id: OrderId): Promise<{ order: StoredOrder; durationMinutes: number } | null> {
    await ensureDatabaseInitialized();
    const existing = await this.getOrder(id);
    if (!existing) return null;

    const durationMinutes = getClientRetrieveTimerMinutes();
    const initiatedAt = new Date();
    const expiresAt = new Date(initiatedAt.getTime() + durationMinutes * 60 * 1000);

    const result = await drizzleDb
      .update(orders)
      .set({
        claimRequested: true,
        claimInitiatedAt: initiatedAt,
        claimExpiresAt: expiresAt,
        timestamp: initiatedAt,
      })
      .where(eq(orders.id, id))
      .returning();

    return result[0] ? { order: this.toStoredOrder(result[0]), durationMinutes } : null;
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

  public async activateOrder(
    id: OrderId,
    amountReceived: number,
    staffId: StaffId
  ): Promise<{ order: StoredOrder; change: number } | null> {
    await ensureDatabaseInitialized();
    const existing = await this.getOrder(id);
    if (!existing) return null;

    const change = Math.max(0, amountReceived - existing.price);
    const timeline = [
      ...existing.statusTimeline,
      { status: "AWAITING_PARCEL" as OrderStatus, timestamp: new Date().toISOString() },
    ];

    const result = await drizzleDb
      .update(orders)
      .set({
        amountReceived,
        change,
        status: "AWAITING_PARCEL",
        statusTimeline: timeline,
        modifiedBy: staffId,
        timestamp: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    return result[0] ? { order: this.toStoredOrder(result[0]), change } : null;
  }

  public async recordCourierPayment(id: OrderId, staffId: StaffId): Promise<StoredOrder | null> {
    await ensureDatabaseInitialized();
    const result = await drizzleDb
      .update(orders)
      .set({
        courierPaid: true,
        courierPaidBy: staffId,
        courierPaidAt: new Date(),
        modifiedBy: staffId,
        timestamp: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    return result[0] ? this.toStoredOrder(result[0]) : null;
  }

  public async attachProofPhoto(id: OrderId, imageUrl: string, staffId: StaffId): Promise<StoredOrder | null> {
    await ensureDatabaseInitialized();
    const existing = await this.getOrder(id);
    if (!existing || !existing.courierPaid) return null;

    const timeline = [
      ...existing.statusTimeline,
      { status: "READY_TO_CLAIM" as OrderStatus, timestamp: new Date().toISOString() },
    ];

    const result = await drizzleDb
      .update(orders)
      .set({
        proofImageUrl: imageUrl,
        status: "READY_TO_CLAIM",
        statusTimeline: timeline,
        modifiedBy: staffId,
        timestamp: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    return result[0] ? this.toStoredOrder(result[0]) : null;
  }

  public async claimByStaff(id: OrderId, staffId: StaffId): Promise<StoredOrder | null> {
    await ensureDatabaseInitialized();
    const existing = await this.getOrder(id);
    if (!existing) return null;

    const timeline = [
      ...existing.statusTimeline,
      { status: "CLAIMED" as OrderStatus, timestamp: new Date().toISOString() },
    ];

    const result = await drizzleDb
      .update(orders)
      .set({
        status: "CLAIMED",
        claimRequested: false,
        statusTimeline: timeline,
        modifiedBy: staffId,
        timestamp: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    return result[0] ? this.toStoredOrder(result[0]) : null;
  }

  // --- OCR Config ---
  public async setOcrConfig(target: AdminOcrConfigTarget, action: AdminOcrConfigAction): Promise<void> {
    await ensureDatabaseInitialized();
    const current = await this.getOcrConfig();
    current[target] = action === "enable";
    await drizzleDb
      .insert(appConfig)
      .values({ key: "ocrConfig", value: current, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: appConfig.key,
        set: { value: current, updatedAt: new Date() },
      });
  }

  public async getOcrConfig(): Promise<Record<AdminOcrConfigTarget, boolean>> {
    await ensureDatabaseInitialized();
    const rows = await drizzleDb.select().from(appConfig).where(eq(appConfig.key, "ocrConfig")).limit(1);
    if (rows[0] && rows[0].value) {
      return rows[0].value as Record<AdminOcrConfigTarget, boolean>;
    }
    return { staff: true, customer: true };
  }

  // --- FCM Tokens ---
  public async addFcmToken(token: string): Promise<void> {
    await ensureDatabaseInitialized();
    await drizzleDb
      .insert(fcmTokens)
      .values({ token, createdAt: new Date() })
      .onConflictDoNothing();
  }
}

// Global singleton instance
const globalForStore = globalThis as unknown as { storeInstance?: DatabaseStore };
export const db = globalForStore.storeInstance ?? new DatabaseStore();
if (process.env.NODE_ENV !== "production") globalForStore.storeInstance = db;
