# Customer Mobile Screens & Outward V1 API Calls

This document maps every customer mobile screen in `apps/customer-mobile/src/components/screens` and modals in `apps/customer-mobile/src/components/modals` to its independent outward V1 backend API calls.

---

## 1. RegisterScreen (`register`)
- **File**: `apps/customer-mobile/src/components/screens/RegisterScreen.tsx`
- **UI Purpose**: Two-step account creation form collecting name, contact info, email, and password.
- **Independent API Call**:
  - *Trigger*: On completion of Step 2, user proceeds to MPIN setup (`MpinCreateScreen`). The actual registration network dispatch occurs when MPIN is confirmed.
  - **Method / Route**: `POST /api/v1/customer/register`
  - **Headers**: `Content-Type: application/json`
  - **Request Body**:
    ```json
    {
      "email": "user@example.com",
      "password": "Password123!",
      "firstName": "John",
      "lastName": "Doe",
      "middleInitial": "V",
      "phoneNumber": "+639123456789"
    }
    ```
  - **Response**:
    ```json
    {
      "statusMessage": "Registration successful",
      "preAuthToken": "eyJhbGciOi..."
    }
    ```

---

## 2. LoginScreen (`login`)
- **File**: `apps/customer-mobile/src/components/screens/LoginScreen.tsx`
- **UI Purpose**: Authenticates customer credentials using email and password.
- **Independent API Call**:
  - *Trigger*: User taps **Log In**.
  - **Method / Route**: `POST /api/v1/customer/login`
  - **Headers**: `Content-Type: application/json`
  - **Request Body**:
    ```json
    {
      "email": "user@example.com",
      "password": "Password123!"
    }
    ```
  - **Response**:
    ```json
    {
      "statusMessage": "Credentials verified",
      "preAuthToken": "eyJhbGciOi..."
    }
    ```

---

## 3. MpinCreateScreen (`mpin_create`)
- **File**: `apps/customer-mobile/src/components/screens/MpinCreateScreen.tsx`
- **UI Purpose**: Two-step MPIN setup screen (Enter 4 digits $\to$ Confirm 4 digits) for newly registered accounts.
- **Independent API Calls**:
  - *Step 1*: Submits pending registration data (if not already submitted) via `POST /api/v1/customer/register` to acquire `preAuthToken`.
  - *Step 2 (MPIN Creation)*:
    - *Trigger*: User confirms 4 matching digits.
    - **Method / Route**: `POST /api/v1/customer/create-mpin`
    - **Headers**: `Content-Type: application/json`
    - **Request Body**:
      ```json
      {
        "preAuthToken": "eyJhbGciOi...",
        "mpin": "1234"
      }
      ```
    - **Response**:
      ```json
      {
        "statusMessage": "MPIN created successfully",
        "authToken": "eyJhbGciOi...",
        "refreshToken": "eyJhbGciOi...",
        "customer": {
          "id": "CST-xxx",
          "email": "user@example.com",
          "firstName": "John",
          "lastName": "Doe",
          "phoneNumber": "+639123456789"
        }
      }
      ```

---

## 4. MpinLoginScreen (`mpin_login`)
- **File**: `apps/customer-mobile/src/components/screens/MpinLoginScreen.tsx`
- **UI Purpose**: Keypad screen where customer inputs their 4-digit MPIN to authorize their active session.
- **Independent API Calls**:
  - **Primary (Session Verification with `preAuthToken`)**:
    - *Trigger*: 4 digits completed after email/password login.
    - **Method / Route**: `POST /api/v1/customer/mpin`
    - **Headers**: `Content-Type: application/json`
    - **Request Body**:
      ```json
      {
        "preAuthToken": "eyJhbGciOi...",
        "mpin": "1234"
      }
      ```
    - **Response**:
      ```json
      {
        "statusMessage": "Access granted",
        "authToken": "eyJhbGciOi...",
        "refreshToken": "eyJhbGciOi...",
        "customer": { "id": "CST-xxx", "email": "..." }
      }
      ```
  - **Secondary (Silent Session Unlock via `refreshToken`)**:
    - *Trigger*: Returning user opening app with cached `refreshToken`.
    - **Method / Route**: `POST /api/v1/customer/refresh`
    - **Headers**: `Content-Type: application/json`
    - **Request Body**:
      ```json
      {
        "refreshToken": "eyJhbGciOi...",
        "mpin": "1234"
      }
      ```
    - **Response**:
      ```json
      {
        "statusMessage": "Session renewed",
        "authToken": "eyJhbGciOi..."
      }
      ```

---

## 5. HomeScreen (`home`)
- **File**: `apps/customer-mobile/src/components/screens/HomeScreen.tsx`
- **UI Purpose**: Dashboard displaying customer status badges (Ready, In Transit, Unpaid), quick action to create orders, and the recent orders list.
- **Independent API Calls**:
  - *Trigger*: Screen mount and Pull-to-refresh (`onRefresh`).
  - **Call A (Fetch Orders List)**:
    - **Method / Route**: `GET /api/v1/customer/orders`
    - **Headers**: `Authorization: Bearer <authToken>`
    - **Response**:
      ```json
      {
        "statusMessage": "Orders retrieved",
        "orders": [
          {
            "id": "ORD-0001",
            "ticketCode": "A1B2C3",
            "trackingId": "SPX12345678",
            "productName": "Wireless Mouse",
            "status": "READY_TO_CLAIM",
            "timestamp": "2026-11-16T08:00:00.000Z",
            "isClaimActive": false
          }
        ]
      }
      ```
  - **Call B (Profile Data Refresh)**:
    - **Method / Route**: `GET /api/v1/customer/profile`
    - **Headers**: `Authorization: Bearer <authToken>`
    - **Response**:
      ```json
      {
        "statusMessage": "Profile retrieved",
        "customer": {
          "id": "CST-0001",
          "email": "user@example.com",
          "firstName": "John",
          "lastName": "Doe",
          "phoneNumber": "+639123456789"
        }
      }
      ```

---

## 6. CreateOrderScreen (`create_order`)
- **File**: `apps/customer-mobile/src/components/screens/CreateOrderScreen.tsx`
- **UI Purpose**: Dropzone card to pick a receipt screenshot or enter image URL/link (debugging state / sample receipt).
- **Independent API Call**:
  - *Trigger*: User inputs receipt image or link and taps **Next**.
  - *Logic*: Tapping **Next** directly triggers `POST /api/v1/customer/orders/initialize`. The backend returns `orderId` and `ticketCode`, which are appended to the draft/order state and carried forward to `ConfirmOrderScreen`.
  - **Method / Route**: `POST /api/v1/customer/orders/initialize`
  - **Headers**: `Authorization: Bearer <authToken>`, `Content-Type: application/json`
  - **Request Body**:
    ```json
    {
      "imageUrl": "data:image/webp;base64,... (or image URL / link)"
    }
    ```
  - **Response**:
    ```json
    {
      "statusMessage": "Order initialized",
      "orderId": "ORD-1234",
      "ticketCode": "TK-8899"
    }
    ```

---

## 7. ConfirmOrderScreen (`confirm_order`)
- **File**: `apps/customer-mobile/src/components/screens/ConfirmOrderScreen.tsx`
- **UI Purpose**: Form where customer reviews and sets complete parcel details (product name, recipient name, COD price, tracking ID) associated with the initialized `orderId` and `ticketCode`.
- **Independent API Call**:
  - *Trigger*: User checks confirmation checkbox and clicks **Confirm & Submit**.
  - *Logic*: With the `orderId` already initialized from the previous screen, this screen independently dispatches the one-shot `PUT /api/v1/customer/orders/{id}` to complete the order details and transition status from `PENDING_INITIALIZATION` to `PAYMENT_REQUIRED`.
  - **Method / Route**: `PUT /api/v1/customer/orders/{orderId}`
  - **Headers**: `Authorization: Bearer <authToken>`, `Content-Type: application/json`
  - **Request Body**:
    ```json
    {
      "order": {
        "trackingId": "SPX987654321",
        "productName": "Wireless Mouse",
        "recipientName": "John Doe",
        "price": 450
      }
    }
    ```
  - **Response**:
    ```json
    {
      "statusMessage": "Order details confirmed"
    }
    ```

---

## 8. PaymentVerificationScreen (`payment_verification`)
- **File**: `apps/customer-mobile/src/components/screens/PaymentVerificationScreen.tsx`
- **UI Purpose**: Post-submission confirmation explaining cash payment at Lily's Catering Hub counter.
- **Independent API Call**:
  - *API Dependency*: Pure informative / routing screen. Navigates to `qr_screen` (Pass) or returns to `home`.

---

## 9. QrScreen (`qr_screen`)
- **File**: `apps/customer-mobile/src/components/screens/QrScreen.tsx`
- **UI Purpose**: High-contrast QR pass presentation used at counter for parcel verification and tracking.
- **Independent API Call**:
  - *API Dependency*: Renders QR encoded with `order.id` and `order.ticketCode` obtained during order initialization.

---

## 10. OrderDetailsScreen (`order_details`)
- **File**: `apps/customer-mobile/src/components/screens/OrderDetailsScreen.tsx`
- **UI Purpose**: Real-time order inspection, delivery timeline, claim countdown timer, and claim pass triggering.
- **Independent API Calls**:
  - **Call A (Live Polling / Single Order Fetch)**:
    - *Trigger*: Screen mount and recurring interval timer.
    - **Method / Route**: `GET /api/v1/customer/orders/{id}`
    - **Headers**: `Authorization: Bearer <authToken>`
    - **Response**:
      ```json
      {
        "statusMessage": "Order retrieved",
        "order": {
          "id": "ORD-1234",
          "ticketCode": "TK-8899",
          "trackingId": "SPX987654321",
          "productName": "Wireless Mouse",
          "recipientName": "John Doe",
          "price": 450,
          "change": 50,
          "status": "READY_TO_CLAIM",
          "statusTimeline": [
            { "status": "PENDING_INITIALIZATION", "timestamp": "2026-11-16T08:00:00Z" },
            { "status": "PAYMENT_REQUIRED", "timestamp": "2026-11-16T08:05:00Z" },
            { "status": "AWAITING_PARCEL", "timestamp": "2026-11-16T08:30:00Z" },
            { "status": "READY_TO_CLAIM", "timestamp": "2026-11-16T09:15:00Z" }
          ],
          "claimInitiatedAt": null,
          "claimExpiresAt": null,
          "isClaimActive": false,
          "claimRemainingSeconds": 0
        }
      }
      ```
  - **Call B (Claim Pickup Pass)**:
    - *Trigger*: When order status is `READY_TO_CLAIM`, user checks confirmation box and taps **Initiate Claim**.
    - **Method / Route**: `POST /api/v1/customer/orders/{id}/claim`
    - **Headers**: `Authorization: Bearer <authToken>`, `Content-Type: application/json`
    - **Request Body**: `{}`
    - **Response**:
      ```json
      {
        "statusMessage": "Claim initiated",
        "claimInitiatedAt": "2026-11-16T09:20:00.000Z",
        "claimExpiresAt": "2026-11-16T09:35:00.000Z",
        "durationMinutes": 15
      }
      ```
  - **Call C (Cancel Order)**:
    - *Trigger*: User clicks **Cancel Order** (only permitted while order is unpaid).
    - **Method / Route**: `DELETE /api/v1/customer/orders/{id}`
    - **Headers**: `Authorization: Bearer <authToken>`
    - **Response**:
      ```json
      {
        "statusMessage": "Order cancelled successfully"
      }
      ```

---

## 11. TransactionsScreen (`transactions`)
- **File**: `apps/customer-mobile/src/components/screens/TransactionsScreen.tsx`
- **UI Purpose**: Filterable order history list (`ALL`, `READY_TO_CLAIM`, `AWAITING_PARCEL`, `PAYMENT_REQUIRED`, `CLAIMED`).
- **Independent API Call**:
  - *Trigger*: Tab filter switch and pull-to-refresh.
  - **Method / Route**: `GET /api/v1/customer/orders?type={status}`
  - **Headers**: `Authorization: Bearer <authToken>`
  - **Response**:
    ```json
    {
      "statusMessage": "Orders retrieved",
      "orders": [
        {
          "id": "ORD-1234",
          "ticketCode": "TK-8899",
          "trackingId": "SPX987654321",
          "productName": "Wireless Mouse",
          "status": "READY_TO_CLAIM",
          "timestamp": "2026-11-16T08:00:00Z",
          "isClaimActive": false
        }
      ]
    }
    ```

---

## 12. NotificationsScreen (`notifications`)
- **File**: `apps/customer-mobile/src/components/screens/NotificationsScreen.tsx`
- **UI Purpose**: Displays delivered push updates and order activity inbox with unread counts.
- **Independent API Call**:
  - *API Dependency*: Native push notifications are received from FCM via device token uploaded by `POST /api/v1/notification/upload-token`.

---

## 13. ProfileScreen (`profile`)
- **File**: `apps/customer-mobile/src/components/screens/ProfileScreen.tsx`
- **UI Purpose**: Displays customer account information (name, masked email, masked phone) and modal triggers for account actions.
- **Independent API Call**:
  - *Trigger*: Screen mount.
  - **Method / Route**: `GET /api/v1/customer/profile`
  - **Headers**: `Authorization: Bearer <authToken>`
  - **Response**:
    ```json
    {
      "statusMessage": "Profile retrieved",
      "customer": {
        "id": "CST-0001",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "middleInitial": "V",
        "phoneNumber": "+639123456789"
      }
    }
    ```

---

## 14. FaqScreen (`faq`)
- **File**: `apps/customer-mobile/src/components/screens/FaqScreen.tsx`
- **UI Purpose**: Static hub policy reference, operating hours, counter pickup instructions, and terms.
- **Independent API Call**:
  - *API Dependency*: Pure static reference content.

---

## 15. Modals & Dedicated Overlays

### A. ProofOfDeliveryModal
- **File**: `apps/customer-mobile/src/components/modals/ProofOfDeliveryModal.tsx`
- **UI Purpose**: Modal opened from `OrderDetailsScreen` to view staff-uploaded parcel proof or receipt screenshot.
- **Independent API Call**:
  - *Trigger*: User taps **View Proof of Delivery** or **View Screenshot**.
  - **Method / Route**: `GET /api/v1/customer/orders/{id}/photo?type=proof` (or `?type=screenshot`)
  - **Headers**: `Authorization: Bearer <authToken>`
  - **Response**:
    ```json
    {
      "statusMessage": "Photo retrieved",
      "orderId": "ORD-1234",
      "imageUrl": "https://storage.example.com/receipt.jpg",
      "proofImageUrl": "https://storage.example.com/proof.jpg"
    }
    ```

### B. SignOutModal
- **File**: `apps/customer-mobile/src/components/modals/SignOutModal.tsx`
- **UI Purpose**: Confirmation to log out.
- **Independent API Call**:
  - *Action*: Pure client-side token wipe (`SecureStore.deleteItemAsync`) clearing tokens and resetting authentication state.

---

## 16. Background Services & App Lifecycle

### A. FCM Push Token Registration
- **Trigger**: App initial boot after obtaining FCM permission.
- **Method / Route**: `POST /api/v1/notification/upload-token`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "fcmToken": "eX_token_123456789...",
    "userId": "CST-0001"
  }
  ```
- **Response**:
  ```json
  {
    "statusMessage": "FCM token registered"
  }
  ```
