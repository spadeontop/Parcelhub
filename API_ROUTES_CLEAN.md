# ParcelHub Clean API Routes

## Customer (`/api/customer`)

### `POST /api/customer/register`
- **Request**:
```json
{
  "email": "user@example.com",
  "password": "string",
  "firstName": "John",
  "lastName": "Doe",
  "middleInitial": "D",
  "phoneNumber": "+639123456789"
}
```
- **Response**:
```json
{
  "statusMessage": "Registration successful",
  "preAuthToken": "string"
}
```

### `POST /api/customer/login`
- **Request**:
```json
{
  "email": "user@example.com",
  "password": "string"
}
```
- **Response**:
```json
{
  "statusMessage": "Credentials verified",
  "preAuthToken": "string"
}
```

### `POST /api/customer/create-mpin`
- **Request**:
```json
{
  "preAuthToken": "string",
  "mpin": "1234"
}
```
- **Response**:
```json
{
  "statusMessage": "MPIN created successfully",
  "authToken": "string",
  "refreshToken": "string"
}
```

### `POST /api/customer/mpin`
- **Request**:
```json
{
  "preAuthToken": "string",
  "mpin": "1234"
}
```
- **Response**:
```json
{
  "statusMessage": "MPIN verified",
  "authToken": "string",
  "refreshToken": "string"
}
```

### `GET /api/customer/orders`
- **Headers**: `Authorization: Bearer <authToken>`
- **Query**: `type` (optional string), `limit` (optional integer)
- **Response**:
```json
{
  "statusMessage": "Orders retrieved",
  "orders": [
    {
      "id": "ORD-402",
      "trackingId": "PH2696153366792H",
      "productName": "VXE R1 Nearlink",
      "status": "READY_TO_CLAIM",
      "timestamp": "2026-10-17T16:32:00Z"
    }
  ]
}
```

### `GET /api/customer/orders/{id}`
- **Headers**: `Authorization: Bearer <authToken>`
- **Response**:
```json
{
  "statusMessage": "Order details retrieved",
  "order": {
    "id": "ORD-402",
    "trackingId": "PH2696153366792H",
    "productName": "VXE R1 Nearlink",
    "recipientName": "John Doe",
    "price": 480,
    "change": 20,
    "status": "READY_TO_CLAIM",
    "statusTimeline": [
      {
        "status": "READY_TO_CLAIM",
        "timestamp": "2026-10-17T22:32:00Z"
      }
    ],
    "qrImageUrl": "https://storage.parcelhub.com/qr/ORD-402.png"
  }
}
```

### `POST /api/customer/orders/initialize`
- **Headers**: `Authorization: Bearer <authToken>`
- **Request**:
```json
{
  "imageUrl": "https://storage.parcelhub.com/receipts/temp-img.jpg"
}
```
- **Response**:
```json
{
  "orderId": "ORD-403",
  "statusMessage": "Order initialized successfully"
}
```

### `PUT /api/customer/orders/{id}`
- **Headers**: `Authorization: Bearer <authToken>`
- **Request**:
```json
{
  "order": {
    "trackingId": "PH2696153366792H",
    "productName": "VXE R1 Nearlink",
    "recipientName": "John Doe",
    "price": 480
  }
}
```
- **Response**:
```json
{
  "statusMessage": "Order updated successfully"
}
```

### `DELETE /api/customer/orders/{id}`
- **Headers**: `Authorization: Bearer <authToken>`
- **Response**:
```json
{
  "statusMessage": "Order cancelled successfully"
}
```

### `POST /api/customer/orders/{id}/claim`
- **Headers**: `Authorization: Bearer <authToken>`
- **Request**: `{}`
- **Response**:
```json
{
  "statusMessage": "Order claim initiated"
}
```

---

## Staff (`/api/staff`)

### `POST /api/staff/login`
- **Request**:
```json
{
  "email": "staff@parcelhub.com",
  "password": "string"
}
```
- **Response**:
```json
{
  "statusMessage": "Staff login successful",
  "authToken": "string",
  "refreshToken": "string"
}
```

### `GET /api/staff/orders`
- **Headers**: `Authorization: Bearer <authToken>`
- **Query**: `status` (optional string), `limit` (optional integer)
- **Response**:
```json
{
  "orders": [
    {
      "id": "ORD-402",
      "trackingId": "PH2696153366792H",
      "customer": "John Doe",
      "amountReceived": 500,
      "change": 20,
      "timestamp": "2026-10-17T18:32:00Z",
      "status": "AWAITING_PARCEL",
      "statusMessage": "Awaiting parcel arrival"
    }
  ]
}
```

### `GET /api/staff/orders/{id}`
- **Headers**: `Authorization: Bearer <authToken>`
- **Response**:
```json
{
  "orderId": "ORD-402",
  "trackingId": "PH2696153366792H",
  "customer": "John Doe",
  "amountToPay": 480,
  "timestamp": "2026-10-17T18:32:00Z",
  "status": "PAYMENT_REQUIRED",
  "statusMessage": "Ready for staff verification"
}
```

### `POST /api/staff/orders/{id}/activate`
- **Headers**: `Authorization: Bearer <authToken>`
- **Request**:
```json
{
  "amountReceived": 500
}
```
- **Response**:
```json
{
  "statusMessage": "Order activated and awaiting parcel delivery",
  "change": 20
}
```

### `POST /api/staff/orders/{id}/make-claimable/pay`
- **Headers**: `Authorization: Bearer <authToken>`
- **Request**: `{}`
- **Response**:
```json
{
  "statusMessage": "Courier payment recorded"
}
```

### `POST /api/staff/orders/{id}/make-claimable/attach-photo`
- **Headers**: `Authorization: Bearer <authToken>`
- **Request**:
```json
{
  "imageUrl": "https://storage.parcelhub.com/proof/ORD-402.jpg"
}
```
- **Response**:
```json
{
  "statusMessage": "Proof photo attached. Order is now claimable.",
  "imageUrl": "https://storage.parcelhub.com/proof/ORD-402.jpg"
}
```

### `POST /api/staff/orders/{id}/claim`
- **Headers**: `Authorization: Bearer <authToken>`
- **Request**: `{}`
- **Response**:
```json
{
  "statusMessage": "Order successfully claimed"
}
```

---

## Admin (`/api/admin`)

### `POST /api/admin/create-staff`
- **Headers**: `Authorization: Bearer <authToken>`
- **Request**:
```json
{
  "email": "staff1@parcelhub.com",
  "password": "string",
  "firstName": "Jane",
  "lastName": "Smith",
  "middleInitial": "A",
  "phoneNumber": "+639987654321"
}
```
- **Response**:
```json
{
  "statusMessage": "Staff account created",
  "staffId": "STF-001"
}
```

### `GET /api/admin/staffs`
- **Headers**: `Authorization: Bearer <authToken>`
- **Response**:
```json
{
  "statusMessage": "Staff accounts retrieved",
  "staffs": [
    {
      "id": "STF-001",
      "firstName": "Jane",
      "lastName": "Smith",
      "middleInitial": "A",
      "phoneNumber": "+639987654321",
      "email": "staff1@parcelhub.com"
    }
  ]
}
```

### `PUT /api/admin/staffs/{id}`
- **Headers**: `Authorization: Bearer <authToken>`
- **Request**:
```json
{
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
- **Response**:
```json
{
  "statusMessage": "Staff profile updated"
}
```

### `DELETE /api/admin/staffs/{id}`
- **Headers**: `Authorization: Bearer <authToken>`
- **Request**:
```json
{
  "reason": "Staff member resigned"
}
```
- **Response**:
```json
{
  "statusMessage": "Staff account deleted successfully"
}
```

### `GET /api/admin/orders`
- **Headers**: `Authorization: Bearer <authToken>`
- **Query**: `type` (optional string), `limit` (optional integer)
- **Response**:
```json
{
  "statusMessage": "Audit orders retrieved",
  "orders": [
    {
      "id": "ORD-402",
      "productName": "VXE R1 Nearlink",
      "status": "CLAIMED",
      "statusMessage": "CLAIMED",
      "timestamp": "2026-10-17T22:32:00Z"
    }
  ]
}
```

### `GET /api/admin/orders/{id}`
- **Headers**: `Authorization: Bearer <authToken>`
- **Response**:
```json
{
  "statusMessage": "Order audit retrieved",
  "orderVersions": {
    "id": "ORD-402",
    "trackingId": "PH2696153366792H",
    "productName": "VXE R1 Nearlink",
    "recipientName": "John Doe",
    "price": 480,
    "change": 20,
    "statusTimeline": [
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

### `POST /api/admin/blacklist/customer/{id}`
- **Headers**: `Authorization: Bearer <authToken>`
- **Request**:
```json
{
  "reason": "Repeated unclaimed fraudulent parcels"
}
```
- **Response**:
```json
{
  "statusMessage": "Customer successfully blacklisted"
}
```

### `POST /api/admin/config/staff/ai-ocr-verify/enable`
- **Headers**: `Authorization: Bearer <authToken>`
- **Request**: `{}`
- **Response**:
```json
{
  "statusMessage": "OCR verification setting updated successfully"
}
```

### `POST /api/admin/config/staff/ai-ocr-verify/disable`
- **Headers**: `Authorization: Bearer <authToken>`
- **Request**: `{}`
- **Response**:
```json
{
  "statusMessage": "OCR verification setting updated successfully"
}
```

### `POST /api/admin/config/customer/ai-ocr-verify/enable`
- **Headers**: `Authorization: Bearer <authToken>`
- **Request**: `{}`
- **Response**:
```json
{
  "statusMessage": "OCR verification setting updated successfully"
}
```

### `POST /api/admin/config/customer/ai-ocr-verify/disable`
- **Headers**: `Authorization: Bearer <authToken>`
- **Request**: `{}`
- **Response**:
```json
{
  "statusMessage": "OCR verification setting updated successfully"
}
```

---

## Notifications (`/api/notification`)

### `POST /api/notification/upload-token`
- **Headers**: `Authorization: Bearer <authToken>`
- **Request**:
```json
{
  "fcmToken": "fcm_token_device_string"
}
```
- **Response**:
```json
{
  "statusMessage": "FCM token saved successfully"
}
```

### `POST /api/notification/send-notification`
- **Headers**: `Authorization: Bearer <authToken>`
- **Request**:
```json
{
  "notificationBody": "Your package VXE R1 Nearlink has arrived at the hub and is ready for pickup!",
  "fcmToken": "fcm_token_device_string"
}
```
- **Response**:
```json
{
  "statusMessage": "Notification sent successfully"
}
```

