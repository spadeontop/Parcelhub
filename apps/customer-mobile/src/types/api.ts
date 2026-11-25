/**
 * ParcelHub Customer Mobile v1 TypeScript Contracts & Types
 * Re-exports shared contracts from @parcelhub/contracts plus customer-mobile UI extensions.
 */

import type { OrderStatus as ContractOrderStatus } from "@parcelhub/contracts";

export * from "@parcelhub/contracts";

// Customer-mobile UI supports displaying legacy REFUNDED status alongside v1 statuses
export type OrderStatus = ContractOrderStatus | "REFUNDED";

export type TransactionFilter =
  | "ALL"
  | "READY_TO_CLAIM"
  | "AWAITING_PARCEL"
  | "PAYMENT_REQUIRED"
  | "CLAIMED"
  | "CANCELLED"
  | "REFUNDED";

/**
 * Customer Mobile UI Outward Calling Routes
 * Grouped and commented per customer UI screen
 */
export type CustomerApiRoutes =
  // Screen: RegisterScreen & MpinCreateScreen (Account Registration)
  | readonly ["POST", "/api/v1/customer/register"]

  // Screen: LoginScreen (Email/Password Verification)
  | readonly ["POST", "/api/v1/customer/login"]

  // Screen: MpinCreateScreen (4-Digit MPIN Initialization)
  | readonly ["POST", "/api/v1/customer/create-mpin"]

  // Screen: MpinLoginScreen (4-Digit MPIN Authorization)
  | readonly ["POST", "/api/v1/customer/mpin"]

  // Screen: PasswordRecoveryScreen (Forgot Password OTP & Reset)
  | readonly ["POST", "/api/v1/customer/forgot-password"]
  | readonly ["POST", "/api/v1/customer/forgot-password/verify"]
  | readonly ["POST", "/api/v1/customer/forgot-password/reset"]

  // Screen: MpinRecoveryScreen (Forgot MPIN OTP & Reset)
  | readonly ["POST", "/api/v1/customer/forgot-mpin"]
  | readonly ["POST", "/api/v1/customer/forgot-mpin/verify"]
  | readonly ["POST", "/api/v1/customer/forgot-mpin/reset"]

  // App Lifecycle / Session Resume (Silent MPIN Token Renewal)
  | readonly ["POST", "/api/v1/customer/refresh"]

  // Screen: ProfileScreen & App Header (Customer Profile Overview)
  | readonly ["GET", "/api/v1/customer/profile"]

  // Screen: HomeScreen & TransactionsScreen (List Orders & Filter Tabs)
  | readonly ["GET", "/api/v1/customer/orders"]

  // Screen: CreateOrderScreen (Upload Receipt Image / Link -> Initializes Order & Generates Ticket)
  | readonly ["POST", "/api/v1/customer/orders/initialize"]

  // Screen: ConfirmOrderScreen (Finalize Complete Order Details via PUT)
  | readonly ["PUT", `/api/v1/customer/orders/${string}`]

  // Screen: OrderDetailsScreen (Live Polling & Timeline Tracking)
  | readonly ["GET", `/api/v1/customer/orders/${string}`]

  // Screen: OrderDetailsScreen & ProofOfDeliveryModal (On-Demand Receipt / Proof Photo)
  | readonly ["GET", `/api/v1/customer/orders/${string}/photo`]

  // Screen: OrderDetailsScreen (Unlock Counter Pickup Pass)
  | readonly ["POST", `/api/v1/customer/orders/${string}/claim`]

  // Screen: OrderDetailsScreen (Cancel Unpaid Order & Initiate Awaiting Refund Pass)
  | readonly ["POST", `/api/v1/customer/orders/${string}/cancel`]
  | readonly ["POST", `/api/v1/customer/orders/${string}/refund`]

  // Push Notifications Registration & Deregistration
  | readonly ["POST", "/api/v1/notification/upload-token"]
  | readonly ["DELETE", "/api/v1/notification/token"]

  // Realtime Broadcast Token Minting
  | readonly ["POST", "/api/v1/realtime/token"];
