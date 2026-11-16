# Customer Mobile V1 Required Features & Implementation Roadmap

This document outlines all new capabilities, logic adjustments, and architectural requirements needed in `apps/customer-mobile` to fully adopt the V1 backend contract defined in [`backend/app/types/v1/api.ts`](file:///c:/Users/JV/Desktop/Parcelhub-spade/Parcelhub/backend/app/types/v1/api.ts).

---

## 1. Silent Session Refresh via MPIN (`POST /api/v1/customer/refresh`)

### Background
In the legacy mobile app, session expiration required full re-authentication with email and password. In V1, the backend introduces a dedicated refresh endpoint that exchanges a stored `refreshToken` + 4-digit MPIN for a fresh `authToken`.

### Core Logic
**Any API call or background polling that returns HTTP 401 Unauthorized with a stored `refreshToken` present and not expired immediately redirects the user to the MPIN area (`MpinLoginScreen`).**

### Implementation Requirements
- **Endpoint**: `POST /api/v1/customer/refresh`
- **Request**: `{ refreshToken: JWTToken, mpin: MPIN }`
- **Response**: `{ statusMessage: string, authToken: JWTToken }`
- **Client Flow**:
  1. Global Network Interceptor: When any request (polling, order fetch, profile fetch) receives `HTTP 401`:
     - Check `SecureStore` for `refreshToken`.
     - If `refreshToken` is present and valid, immediately navigate to `MpinLoginScreen` with an active prompt.
  2. The user inputs their 4-digit MPIN on `MpinLoginScreen`.
  3. Client dispatches `POST /api/v1/customer/refresh`.
  4. On success, store the renewed `authToken` and seamlessly resume / return to the previous screen (or `HomeScreen`).
  5. If `refreshToken` is absent or the refresh call itself is rejected (e.g. revoked/expired token), clear stored tokens and redirect to `LoginScreen`.

---

## 2. Server-Generated Ticket Code Integration (`ticketCode`)

### Background
The legacy mobile app synthesized mock reference codes locally (e.g. `0001-0001-5555`). In V1, the backend generates an official `ticketCode` during order initialization and returns it across summaries and details.

### Implementation Requirements
- **Endpoints**:
  - `POST /api/v1/customer/orders/initialize` $\to$ returns `{ orderId, ticketCode }`
  - `GET /api/v1/customer/orders` $\to$ items contain `ticketCode?: string | null`
  - `GET /api/v1/customer/orders/{id}` $\to$ contains `ticketCode?: string | null`
- **Client Flow**:
  1. Replace client-side synthetic `refCode` generators with the server-supplied `ticketCode`.
  2. In `QrScreen`: encode `ticketCode` (or `orderId:ticketCode`) into the QR payload.
  3. In `PaymentVerificationScreen` & `OrderDetailsScreen`: display the official ticket code badge for counter staff verification.

---

## 3. Dedicated On-Demand Photo Fetching (`GET /api/v1/customer/orders/{id}/photo`)

### Background
In the legacy app, heavy image payloads (`imageUrl`, `qrImageUrl`) were embedded directly in order detail responses. In V1, the backend strips all images from `CustomerOrderDetail` and `CustomerOrderSummary` to keep list and polling requests under 1KB.

### Implementation Requirements
- **Endpoint**: `GET /api/v1/customer/orders/{id}/photo?type=screenshot|proof|all`
- **Response**: `{ orderId: OrderId, imageUrl: string | null, proofImageUrl: string | null }`
- **Client Flow**:
  1. **Order Polling**: Polling `GET /api/v1/customer/orders/{id}` no longer returns image URLs. Polling remains fast and bandwidth-efficient.
  2. **Receipt Inspection**: When the customer opens the receipt preview modal, dispatch `GET .../photo?type=screenshot`.
  3. **Proof of Delivery**: When opening `ProofOfDeliveryModal`, dispatch `GET .../photo?type=proof` to display the actual hub counter camera photo uploaded by staff.
  4. Implement memory caching for fetched photos so each photo is fetched only once per session.

---

## 4. Client-Side Image Size Guard & Compression (<110KB Limit)

### Background & Plan
The V1 backend enforces a strict upload payload limit on `POST /api/v1/customer/orders/initialize`: images larger than **110KB** are rejected with HTTP 400 (`error: "ImagePayloadTooLarge"`).

See the complete technical plan in [`IMAGE_COMPRESSION.md`](file:///c:/Users/JV/Desktop/Parcelhub-spade/Parcelhub/apps/customer-mobile/src/v1/IMAGE_COMPRESSION.md).

### Customer Screenshot Compression Rules
- **Format**: Convert strictly to **WebP** (`image/webp`).
- **Dimension Check**: Check image width and height. If either exceeds **800px**, scale down so the maximum dimension is $\le$ **800px** (maintaining aspect ratio).
- **Lossy Compression**: Apply **50% lossy compression** (`quality: 0.5`).
- **Result**: Drops receipt screenshot size to ~30KB–60KB, guaranteeing it fits safely within the 110KB backend ceiling while preserving crisp text readability.

*(Note: For the Staff App proof image, the rules specify max dimension $\le$ 800px, WebP format, and **80% lossy compression** to preserve parcel label and pouch condition details).*

---

## 5. Decoupled Two-Step Order Creation Flow & Autofill

### Background
Legacy order creation ran `initializeOrder` and `updateOrder` back-to-back inside a single submit handler on `ConfirmOrderScreen`. V1 requires decoupling the flow cleanly across the two screens.

### Implementation Requirements
- **Step 1 (`CreateOrderScreen`)**:
  - Customer picks receipt screenshot or provides URL (debug mode) and clicks **Next**.
  - Client compresses image to WebP ($\le$ 800px, 50% lossy) and dispatches `POST /api/v1/customer/orders/initialize`.
  - Backend creates order in `PENDING_INITIALIZATION` state and returns `{ orderId, ticketCode }`.
  - Store `orderId` and `ticketCode` in app draft state and transition navigation to `ConfirmOrderScreen`.
- **Step 2 (`ConfirmOrderScreen`)**:
  - **Recipient Name Autofill**: The recipient's name is **automatically pre-filled based on the customer account profile full name** (`${customer.firstName} ${customer.lastName}`).
  - Customer reviews/inputs remaining details (`trackingId`, `productName`, `price`).
  - Customer taps **Confirm & Submit**.
  - Client dispatches one-shot `PUT /api/v1/customer/orders/{orderId}`.
  - Backend transitions order status to `PAYMENT_REQUIRED`.
  - Navigate to `PaymentVerificationScreen`.

---

## 6. Strict One-Shot PUT & Duplicate Tracking ID Handling

### Background
In V1:
- `PUT /api/v1/customer/orders/{id}` can only be executed **once** while the order is in `PENDING_INITIALIZATION`. Calling PUT again returns HTTP 400.
- If the `trackingId` is already bound to another **paid** order (`AWAITING_PARCEL`, `READY_TO_CLAIM`, `CLAIMED`), the backend rejects it with **HTTP 409 Conflict**.
- Unpaid (`PAYMENT_REQUIRED`) and `CANCELLED` orders do **not** lock the tracking number.

### Implementation Requirements
- **Client Flow**:
  1. The client must never mask or overwrite backend error messages.
  2. If the backend returns `409 Conflict`, display the exact backend error message directly to the user (e.g. *"This tracking ID is already in use by another paid order"*).
  3. Disable subsequent edit/submit calls once the order has successfully transitioned to `PAYMENT_REQUIRED`.

---

## 7. Customer Blacklist State & Graceful UI Degradation

### Background
`CustomerProfile` in V1 includes `blacklisted?: boolean` and `blacklistReason?: string | null`. 
- Blacklisted customers are forbidden from initializing new orders (`POST .../orders/initialize` returns **HTTP 403 Forbidden**).
- Blacklisted customers **can still view** existing orders and claim ready orders to prevent package hijacking.

### Implementation Requirements
- **Client Flow**:
  1. On fetching profile (`GET /api/v1/customer/profile`), check `customer.blacklisted`.
  2. If `blacklisted === true`:
     - In `HomeScreen`: disable the **Create an Order** button and display an informative banner.
     - If customer attempts to access `CreateOrderScreen`, display an alert showing `blacklistReason`.
     - Allow normal access to `TransactionsScreen` and `OrderDetailsScreen` so the customer can pick up already paid/arrived packages.

---

## 8. Dynamic Server-Driven Claim Remaining Time

### Background
In the legacy mobile app, the client computed remaining time using client-side estimations and hardcoded fallbacks (`ENV.HANDOFF_CUTOFF_TIME_MINS * 60`). In V1, the claim countdown is **authoritative and dynamic from the backend**.

### Core Logic
**The remaining claim time must always come from the backend. When the backend responds with `claimRemainingSeconds`, only then does the client countdown tick down. The client must not "expect", synthesize, or fall back to local constants.**

### Implementation Requirements
- **Endpoints**:
  - `POST /api/v1/customer/orders/{id}/claim` $\to$ returns `{ claimInitiatedAt, claimExpiresAt, durationMinutes }`
  - `GET /api/v1/customer/orders/{id}` $\to$ returns `{ isClaimActive, claimExpiresAt, claimRemainingSeconds }`
- **Client Flow**:
  1. When claim is triggered in `OrderDetailsScreen`, read `claimRemainingSeconds` (and `claimExpiresAt`) directly from the backend response.
  2. The local interval only begins decrementing from the server-supplied `claimRemainingSeconds`.
  3. Subsequent order polling refreshes `claimRemainingSeconds` from the server, dynamically correcting any client clock drift.
  4. If `claimRemainingSeconds === 0` or missing, the claim is expired/inactive. No synthetic fallback constant is allowed.

---

## 9. Backend-Authoritative Error Response Handling

### Background
The V1 backend returns a standardized JSON error envelope:
```typescript
export type ApiErrorResponse = {
  readonly success: false;
  readonly error: string;
  readonly message: string;
  readonly statusCode: number;
};
```

### Core Logic
**Besides explicit network or device-offline issues (e.g. `AbortError`, device offline, no internet connection), the error message displayed to the user must originate strictly from the backend response itself (`message` / `error`). The client must not invent or substitute synthetic error strings.**

### Implementation Requirements
- **Client Flow**:
  1. Parse backend error response JSON.
  2. If response contains `data.message` or `data.error`, display that exact message via UI Toast or error text.
  3. Only fallback to a generic message (e.g. *"Network error: Unable to reach server"*) if there is an explicit network failure where no response was received from the server.

---

## Implementation Summary Checklist

| Feature | Target Screens / Components | Priority |
| :--- | :--- | :---: |
| **1. Session Refresh via MPIN on 401** | `AppContext`, `MpinLoginScreen` | High |
| **2. Server Ticket Code** | `QrScreen`, `OrderDetailsScreen`, `PaymentVerificationScreen` | High |
| **3. On-Demand Photo Retrieval** | `ProofOfDeliveryModal`, `OrderDetailsScreen` | High |
| **4. WebP Image Compression (<800px, 50%)** | `CreateOrderScreen`, `IMAGE_COMPRESSION.md` | High |
| **5. Decoupled Order Creation & Recipient Autofill** | `CreateOrderScreen`, `ConfirmOrderScreen` | High |
| **6. Duplicate Tracking ID (409) Handling** | `ConfirmOrderScreen` | Medium |
| **7. Customer Blacklist State Handling** | `HomeScreen`, `ProfileScreen`, `CreateOrderScreen` | Medium |
| **8. Dynamic Server-Driven Claim Countdown** | `OrderDetailsScreen`, `AppContext` | High |
| **9. Backend-Authoritative Error Handling** | All API services & UI Toasts | High |
