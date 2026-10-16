#### 1. Solvency Invariant (Zero-Credit Escrow)

- The hub **NEVER** fronts money.
- Condition: Staff **cannot** accept or disburse cash for a delivery unless:
  `cash_deposited >= courier_cod_amount`

#### 2. State Progression Invariant (Monotonic Flow)

- Status only moves forward: `STAGED -> FUNDED -> RECEIVED_LOGGED -> CLAIMED`
- No skipping states (e.g., cannot receive an unfunded parcel).

#### 3. Release Invariant (Atomic Handshake)

- A package status can NEVER update to `CLAIMED` without:
  1.  Valid, unexpired User Dynamic Token (MPIN-generated).
  2.  Active Staff Session ID.
  3.  Visual logging record created.
- Manual handover release can NEVER be prompted unless the client prompted the release.
- A package status can NEVER update to `CLAIMED` without:
  1. Active Staff Session ID.
  2. Visual logging record created.

#### 4. Identity Decoupling Invariant

- Couriers only see: Waybill tracking number + exact cash amount.
- Internal student identity/MPIN is strictly zero-knowledge to couriers.


