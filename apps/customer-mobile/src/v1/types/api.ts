export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type RouteDefinition = readonly [method: HttpMethod, path: string];

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

  // App Lifecycle / Session Resume (Silent MPIN Token Renewal)
  | readonly ["POST", "/api/v1/customer/refresh"]

  // Screen: ProfileScreen & App Header (Customer Profile Overview)
  | readonly ["GET", "/api/v1/customer/profile"]

  // Screen: HomeScreen & TransactionsScreen (List Orders & Filter Tabs)
  | readonly ["GET", "/api/v1/customer/orders"]

  // Screen: CreateOrderScreen -> ConfirmOrderScreen (Upload Receipt Image)
  | readonly ["POST", "/api/v1/customer/orders/initialize"]

  // Screen: ConfirmOrderScreen (Finalize Tracking & Package Details)
  | readonly ["PUT", `/api/v1/customer/orders/${string}`]

  // Screen: OrderDetailsScreen (Live Polling & Timeline Tracking)
  | readonly ["GET", `/api/v1/customer/orders/${string}`]

  // Screen: OrderDetailsScreen & ProofOfDeliveryModal (On-Demand Receipt / Proof Photo)
  | readonly ["GET", `/api/v1/customer/orders/${string}/photo`]

  // Screen: OrderDetailsScreen (Unlock Counter Pickup Pass)
  | readonly ["POST", `/api/v1/customer/orders/${string}/claim`]

  // Screen: OrderDetailsScreen (Cancel Unpaid Order)
  | readonly ["DELETE", `/api/v1/customer/orders/${string}`]

  // App Lifecycle: Device Push Notification Registration
  | readonly ["POST", "/api/v1/notification/upload-token"]

  // App Lifecycle / Support: Push Notification Trigger
  | readonly ["POST", "/api/v1/notification/send-notification"];
