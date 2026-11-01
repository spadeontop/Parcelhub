# ParcelHub API Routes Specification

Authoritative documentation for the ParcelHub REST API, compiled from the API specification routes.

---

## Table of Contents
1. [Overview & Authentication Conventions](#overview--authentication-conventions)
2. [Customer Routes (`/api/customer`)](#1-customer-routes-apicustomer)
   - [Authentication & Account](#authentication--account)
   - [Order Management](#order-management)
3. [Staff Routes (`/api/staff`)](#2-staff-routes-apistaff)
   - [Authentication](#authentication)
   - [Order Operations](#order-operations)
4. [Administrator Routes (`/admin`)](#3-administrator-routes-admin)
   - [Staff Management](#staff-management)
   - [Audit & Customer Control](#audit--customer-control)
   - [System AI OCR Configuration](#system-ai-ocr-configuration)
5. [Push Notification Routes (`/api/notification`)](#4-push-notification-routes-apinotification)

---

## Overview & Authentication Conventions

- **Base URL**: `/api` (and `/admin` for management portal endpoints)
- **Token Types**:
  - `refreshToken`: Long-lived token returned after successful registration or initial credential login; used to exchange for or verify MPIN.
  - `authToken`: Bearer/session token returned after MPIN verification or admin login; passed in authorized requests.

---

## 1. Customer Routes (`/api/customer`)

### Authentication & Account

#### `POST /api/customer/register`
Registers a new customer account.

- **Request Body (JSON):**
  ```json
  {
    "password": "string",
    "email": "user@example.com",
    "firstname": "John",
    "lastname": "Doe",
    "middleinitial": "D",
    "phonenumber": "+639123456789"
  }
  ```
- **Response (JSON):**
  ```json
  {
    "statusMessage": "Registration successful",
    "refreshToken": "string"
  }
  ```

---

#### `POST /api/customer/login`
Authenticates customer credentials with email and password.

- **Request Body (JSON):**
  ```json
  {
    "email": "user@example.com",
    "password": "string"
  }
  ```
- **Response (JSON):**
  ```json
  {
    "statusMessage": "Credentials verified",
    "refreshToken": "string"
  }
  ```

---

#### `POST /api/customer/create-mpin`
Sets up the initial secure 4-digit MPIN for customer account activation.

- **Request Body (JSON):**
  ```json
  {
    "refreshToken": "string",
    "mpin": "1234"
  }
  ```
- **Response (JSON):**
  ```json
  {
    "statusMessage": "MPIN created successfully",
    "authToken": "string"
  }
  ```

---

#### `POST /api/customer/mpin`
Verifies customer MPIN to grant a session `authToken`.

- **Request Body (JSON):**
  ```json
  {
    "refreshToken": "string",
    "mpin": "1234"
  }
  ```
- **Response (JSON):**
  ```json
  {
    "statusMessage": "MPIN verified",
    "authToken": "string"
  }
  ```

---

### Order Management

#### `GET /api/customer/orders`
Lists orders associated with the authenticated customer.

- **Request Headers / Parameters:**
  - `authToken` (Header / Bearer or Query)
  - `type` (Query, e.g. status filter)
  - `limit` (Query, integer)
- **Response (JSON):**
  ```json
  {
    "statusMessage": "Orders retrieved",
    "order": [
      {
        "productName": "VXE R1 Nearlink",
        "status": "READY_TO_CLAIM",
        "timestamp": "2026-10-17T16:32:00Z"
      }
    ]
  }
  ```

---

#### `GET /api/customer/orders/{id}`
Fetches full order details including pricing, change, timeline, and QR pickup code.

- **Request Headers / Parameters:**
  - `authToken`
  - `{id}` (URL Path Parameter)
- **Response (JSON):**
  ```json
  {
    "statusMessage": "Order details retrieved",
    "order": {
      "id": "ORD-402",
      "trackingId": "PH2696153366792H",
      "productName": "VXE R1 Nearlink",
      "recepientName": "John Doe",
      "price": 480,
      "change": 20,
      "statusMessage": [
        {
          "status": "READY_TO_CLAIM",
          "timestamp": "2026-10-17T22:32:00Z"
        }
      ],
      "qr-image": "https://storage.parcelhub.com/qr/ORD-402.png"
    }
  }
  ```

---

#### `POST /api/customer/orders/initialize`
Creates and initializes a new incoming parcel order with uploaded receipt/label photo.

- **Request Body (JSON):**
  ```json
  {
    "authToken": "string",
    "imageUrl": "https://storage.parcelhub.com/receipts/temp-img.jpg"
  }
  ```
- **Response (JSON):**
  ```json
  {
    "orderId": "ORD-403",
    "statusMessage": "Order initialized successfully"
  }
  ```

---

#### `PUT /api/customer/orders/{id}`
Updates details of an order (e.g. tracking number, product name, recipient, declared price).

- **Request Body (JSON):**
  ```json
  {
    "authToken": "string",
    "order": {
      "trackingId": "PH2696153366792H",
      "productName": "VXE R1 Nearlink",
      "recepientName": "John Doe",
      "price": 480
    }
  }
  ```
- **Response (JSON):**
  ```json
  {
    "statusMessage": "Order updated successfully"
  }
  ```

---

#### `DELETE /api/customer/orders/{id}`
Cancels or deletes a pending order.

- **Request Headers / Parameters:**
  - `authToken`
  - `{id}` (URL Path Parameter)
- **Response (JSON):**
  ```json
  {
    "statusMessage": "Order cancelled successfully"
  }
  ```

---

#### `POST /api/customer/orders/{id}/claim`
Initiates customer parcel claim / handoff countdown at the hub.

- **Request Body (JSON):**
  ```json
  {
    "authToken": "string"
  }
  ```
- **Response (JSON):**
  ```json
  {
    "statusMessage": "Order claim initiated"
  }
  ```

---

## 2. Staff Routes (`/api/staff`)

### Authentication

#### `POST /api/staff/login`
Authenticates hub staff credentials.

- **Request Body (JSON):**
  ```json
  {
    "email": "staff@parcelhub.com",
    "password": "string"
  }
  ```
- **Response (JSON):**
  ```json
  {
    "statusMessage": "Staff login successful",
    "refreshToken": "string"
  }
  ```

---

### Order Operations

#### `GET /api/staff/orders`
Lists all incoming and active orders assigned to the staff hub for queue processing.

- **Request Headers / Parameters:**
  - `authToken`
  - `statusMessage` (Optional filter)
  - `limit` (Optional integer)
- **Response (JSON):**
  ```json
  {
    "orders": [
      {
        "trackingId": "PH2696153366792H",
        "customer": "John Doe",
        "amountReceived": 500,
        "change": 20,
        "timeStamp": "2026-10-17T18:32:00Z",
        "statusMessage": "Awaiting parcel arrival"
      }
    ]
  }
  ```

---

#### `GET /api/staff/orders/{id}`
Fetches verification order details before activation or payment.

- **Request Headers / Parameters:**
  - `authToken`
  - `{id}` (URL Path Parameter)
- **Response (JSON):**
  ```json
  {
    "orderId": "ORD-402",
    "trackingId": "PH2696153366792H",
    "customer": "John Doe",
    "amountToPay": 480,
    "timeStamp": "2026-10-17T18:32:00Z",
    "statusMessage": "Ready for staff verification"
  }
  ```

---

#### `POST /api/staff/orders/{id}/activate`
Staff logs cash deposit received from customer to activate the order and place it into `AWAITING_PARCEL`.

- **Request Body (JSON):**
  ```json
  {
    "authToken": "string",
    "amountReceived": 500
  }
  ```
- **Response (JSON):**
  ```json
  {
    "statusMessage": "Order activated and awaiting parcel delivery",
    "change": 20
  }
  ```

---

#### `POST /api/staff/orders/{id}/make-claimable/pay`
Logs that hub staff has disbursed cash payment to the courier upon parcel arrival.

- **Request Body (JSON):**
  ```json
  {
    "authToken": "string"
  }
  ```
- **Response (JSON):**
  ```json
  {
    "statusMessage": "Courier payment recorded"
  }
  ```

---

#### `POST /api/staff/orders/{id}/make-claimable/attach-photo`
Uploads proof of received parcel photo and marks order as `READY_TO_CLAIM`.

- **Request Body (JSON):**
  ```json
  {
    "authToken": "string",
    "imageUrl": "https://storage.parcelhub.com/proof/ORD-402.jpg"
  }
  ```
- **Response (JSON):**
  ```json
  {
    "statusMessage": "Proof photo attached. Order is now claimable.",
    "imageUrl": "https://storage.parcelhub.com/proof/ORD-402.jpg"
  }
  ```

---

#### `POST /api/staff/orders/{id}/claim`
Completes order handover on behalf of customer upon QR verification or physical counter claim.

- **Request Body (JSON):**
  ```json
  {
    "authToken": "string"
  }
  ```
- **Response (JSON):**
  ```json
  {
    "statusMessage": "Order successfully claimed"
  }
  ```

---

## 3. Administrator Routes (`/admin`)

### Staff Management

#### `POST /admin/create-staff`
Creates a new staff member account.

- **Request Body (JSON):**
  ```json
  {
    "authToken": "string",
    "password": "string",
    "email": "staff1@parcelhub.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "middleInitial": "A",
    "phoneNumber": "+639987654321"
  }
  ```
- **Response (JSON):**
  ```json
  {
    "statusMessage": "Staff account created",
    "refreshToken": "string"
  }
  ```

---

#### `GET /admin/staffs`
Retrieves a list of all staff accounts.

- **Request Headers / Parameters:**
  - `authToken`
- **Response (JSON):**
  ```json
  {
    "statusMessage": "Staff accounts retrieved",
    "staffs": [
      {
        "id": "STF-001",
        "firstName": "Jane",
        "lastName": "Smith",
        "number": "+639987654321",
        "email": "staff1@parcelhub.com"
      }
    ]
  }
  ```

---

#### `PUT /admin/staffs/{id}`
Updates existing staff account credentials or profile info.

- **Request Body (JSON):**
  ```json
  {
    "authToken": "string",
    "staff": {
      "password": "newPassword123",
      "email": "staff1@parcelhub.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "middleInitial": "A",
      "phoneNumber": "+639987654321"
    }
  }
  ```
- **Response (JSON):**
  ```json
  {
    "statusMessage": "Staff profile updated"
  }
  ```

---

#### `DELETE /admin/staffs/{id}`
Revokes or deletes a staff account.

- **Request Body (JSON):**
  ```json
  {
    "authToken": "string",
    "reason": "Staff member resigned"
  }
  ```
- **Response (JSON):**
  ```json
  {
    "statusMessage": "Staff account deleted successfully"
  }
  ```

---

### Audit & Customer Control

#### `GET /admin/orders`
Audit query to list all platform orders across all hubs.

- **Request Headers / Parameters:**
  - `authToken`
  - `type` (Query filter)
  - `limit` (Query limit)
- **Response (JSON):**
  ```json
  {
    "statusMessage": "Audit orders retrieved",
    "order": [
      {
        "productName": "VXE R1 Nearlink",
        "statusMessage": "CLAIMED",
        "timestamp": "2026-10-17T22:32:00Z"
      }
    ]
  }
  ```

---

#### `GET /admin/orders/{id}`
Fetches in-depth version history and audit trail for an order.

- **Request Headers / Parameters:**
  - `authToken`
  - `{id}` (URL Path Parameter)
- **Response (JSON):**
  ```json
  {
    "statusMessage": "Order audit retrieved",
    "orderVersions": {
      "id": "ORD-402",
      "trackingId": "PH2696153366792H",
      "productName": "VXE R1 Nearlink",
      "recepientName": "John Doe",
      "price": 480,
      "change": 20,
      "status": [
        {
          "status": "PAYMENT_REQUIRED",
          "timestamp": "2026-10-17T16:32:00Z"
        },
        {
          "status": "AWAITING_PARCEL",
          "timestamp": "2026-10-17T18:32:00Z"
        },
        {
          "status": "READY_TO_CLAIM",
          "timestamp": "2026-10-17T22:32:00Z"
        }
      ],
      "modifiedBy": "STF-001",
      "timestamp": "2026-10-17T22:35:00Z"
    }
  }
  ```

---

#### `POST /admin/blacklist/customer/{id}`
Blacklists a customer account due to fraudulent or abusive activity.

- **Request Body (JSON):**
  ```json
  {
    "authToken": "string",
    "reason": "Repeated unclaimed fraudulent parcels"
  }
  ```
- **Response (JSON):**
  ```json
  {
    "statusMessage": "Customer successfully blacklisted"
  }
  ```

---

### System AI OCR Configuration

Endpoints for enabling/disabling automated AI OCR parsing on receipt/shipping label uploads:

* `POST /admin/config/staff/ai-ocr-verify/enable`
* `POST /admin/config/staff/ai-ocr-verify/disable`
* `POST /admin/config/customer/ai-ocr-verify/enable`
* `POST /admin/config/customer/ai-ocr-verify/disable`

- **Request Body (JSON):**
  ```json
  {
    "authToken": "string"
  }
  ```
- **Response (JSON):**
  ```json
  {
    "statusMessage": "OCR verification setting updated successfully"
  }
  ```

---

## 4. Push Notification Routes (`/api/notification`)

#### `POST /api/notification/upload-token`
Uploads Firebase Cloud Messaging (FCM) registration token from the client device (Mobile Web / Native).

- **Request Body (JSON):**
  ```json
  {
    "authToken": "string",
    "fcmToken": "fcm_token_device_string"
  }
  ```
- **Response (JSON):**
  ```json
  {
    "statusMessage": "FCM token saved successfully"
  }
  ```

---

#### `POST /api/notification/send-notification`
Backend trigger to deliver a push notification to a target device via FCM.

- **Request Body (JSON):**
  ```json
  {
    "notificationBody": "Your package VXE R1 Nearlink has arrived at the hub and is ready for pickup!",
    "fcmToken": "fcm_token_device_string"
  }
  ```
- **Response (JSON):**
  ```json
  {
    "statusMessage": "Notification sent successfully"
  }
  ```

