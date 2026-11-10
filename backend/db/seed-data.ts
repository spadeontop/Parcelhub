const customerId = "CST-001";
const staffId = "STF-001";

export const originalSeedOrders = [
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
      },];
