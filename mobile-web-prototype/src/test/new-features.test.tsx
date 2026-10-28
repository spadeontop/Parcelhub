import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import { orderApi, getStatedFee, isClaimUnlocked } from '../services/orderApi';
import { ENV } from '../config/env';
import { Order } from '../types';

describe('New Feature Requirements 1-6', () => {
  it('Req 1: verifies #5 payment verification (awaiting payment) has no counter hold timer', () => {
    render(<App />);

    const scenarioSelect = screen.getByLabelText('Select Figma Screen Scenario');
    fireEvent.change(scenarioSelect, { target: { value: 'figma-5' } });

    // Header and core info must be present
    expect(screen.getByText('Awaiting Payment')).toBeInTheDocument();
    expect(screen.getByText('Order created successfully!')).toBeInTheDocument();
    expect(screen.getByText('Generate QR')).toBeInTheDocument();

    // The counter hold timer ticker and renew button must be completely removed
    expect(screen.queryByText(/Counter Hold Timer:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/00:00 \(Expired\)/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Renew/i })).not.toBeInTheDocument();
  });

  it('Req 2: staff on Unpaid Cash Activate must manually type amount received >= stated fee', () => {
    render(<App />);

    // Go to staff terminal
    fireEvent.click(screen.getByRole('button', { name: 'Staff Counter' }));

    // Switch to Unpaid (inactive) tab
    fireEvent.click(screen.getByRole('button', { name: 'Unpaid' }));

    // ORD-408 has stated fee ₱12,500 (or draft order)
    // First, let's create an unpaid order to test exact interaction
    const exitBtn = screen.getByRole('button', { name: 'Exit to App' });
    fireEvent.click(exitBtn);

    // Switch scenario to Figma 7 (Payment Required for ORD-402, stated fee ₱500, COD ₱480)
    const scenarioSelect = screen.getByLabelText('Select Figma Screen Scenario');
    fireEvent.change(scenarioSelect, { target: { value: 'figma-7' } });

    // Go to Staff terminal Unpaid tab
    fireEvent.click(screen.getByRole('button', { name: 'Staff Counter' }));
    fireEvent.click(screen.getByRole('button', { name: 'Unpaid' }));

    expect(screen.getByText('Stated Fee:')).toBeInTheDocument();
    const amountInput = screen.getByLabelText('Amount Received for ORD-402') as HTMLInputElement;
    const activateBtn = screen.getByRole('button', { name: 'Receive Cash & Activate' });

    // Initially empty: button disabled
    expect(activateBtn).toBeDisabled();

    // Type amount less than stated fee (e.g. 400 < 500)
    fireEvent.change(amountInput, { target: { value: '400' } });
    expect(activateBtn).toBeDisabled();
    expect(screen.getByText(/Amount received must be ≥ ₱500/i)).toBeInTheDocument();

    // Type valid amount >= stated fee (e.g. 600 >= 500)
    fireEvent.change(amountInput, { target: { value: '600' } });
    expect(activateBtn).not.toBeDisabled();

    // Activate the order
    fireEvent.click(activateBtn);

    // Order should now be in Active (Awaiting Parcel) tab
    fireEvent.click(screen.getByRole('button', { name: 'Active' }));
    expect(screen.getByText('VXE R1 Nearlink')).toBeInTheDocument();
  });

  it('Req 3: active orders log courier arrivals in 2 steps: 1. pay courier, 2. attach photo & verify to make ready to claim', () => {
    render(<App />);

    // Switch to Staff Terminal Active tab
    fireEvent.click(screen.getByRole('button', { name: 'Staff Counter' }));
    fireEvent.click(screen.getByRole('button', { name: 'Active' }));

    // ORD-408 is active with courierPaid = false
    expect(screen.getByText('Poco X6 Pro')).toBeInTheDocument();
    expect(screen.getByText(/Step 1: Pay courier COD/i)).toBeInTheDocument();

    // Step 1: Staff clicks "Pay Courier"
    const payBtn = screen.getByRole('button', { name: /Pay Courier \(₱12,450\)/i });
    fireEvent.click(payBtn);

    // Step 1 is done, Step 2 appears
    expect(screen.getByText(/✔ Courier Paid \(₱12,450\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 2: Attach Parcel Photo/i)).toBeInTheDocument();

    // Step 2: Staff attaches parcel photo
    const sampleBtn = screen.getByRole('button', { name: 'Sample Photo' });
    fireEvent.click(sampleBtn);

    // Verify Photo button is now shown
    const verifyBtn = screen.getByRole('button', { name: 'Verify Photo & Make Ready' });
    fireEvent.click(verifyBtn);

    // Now moved to Ready tab!
    fireEvent.click(screen.getByRole('button', { name: 'Ready' }));
    expect(screen.getByText('Poco X6 Pro')).toBeInTheDocument();
  });

  it('Req 4 & 6: ready to claim is locked until customer initiates claim, then staff manually presses Release', () => {
    render(<App />);

    // In Staff Terminal Ready tab, ORD-402 has not been initiated by user yet
    fireEvent.click(screen.getByRole('button', { name: 'Staff Counter' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ready' }));

    // It should be locked and untouchable
    expect(screen.getAllByText(/🔒 Locked \(Awaiting Customer Prompt\)/i).length).toBeGreaterThanOrEqual(1);
    const releaseButtons = screen.getAllByRole('button', { name: 'Release' });
    expect(releaseButtons[0]).toBeDisabled();

    // Exit to customer app and go to Scenario 9
    const exitBtn = screen.getByRole('button', { name: 'Exit to App' });
    fireEvent.click(exitBtn);

    const scenarioSelect = screen.getByLabelText('Select Figma Screen Scenario');
    fireEvent.change(scenarioSelect, { target: { value: 'figma-9' } });

    // Customer checks confirm checkbox
    const confirmCheck = screen.getByLabelText(/I confirm that I want to claim the order/i);
    fireEvent.click(confirmCheck);

    // Customer clicks Initiate Claim
    const initiateBtn = screen.getByRole('button', { name: 'Initiate Claim' });
    fireEvent.click(initiateBtn);

    // Customer sees active window banner
    expect(screen.getByText(/Claim Window Active:/i)).toBeInTheDocument();

    // Customer goes to counter: Staff terminal is now UNLOCKED!
    fireEvent.click(screen.getByRole('button', { name: 'Staff Counter' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ready' }));

    expect(screen.getByText(/Claim Active/i)).toBeInTheDocument();
    const activeReleaseBtn = screen.getAllByRole('button', { name: 'Release' })[0];
    expect(activeReleaseBtn).not.toBeDisabled();

    // Staff manually presses Release
    fireEvent.click(activeReleaseBtn);

    // Now order is in Claimed tab
    fireEvent.click(screen.getByRole('button', { name: 'Claimed' }));
    expect(screen.getByText('VXE R1 Nearlink')).toBeInTheDocument();
  });

  it('Req 5: global configuration HANDOFF_CUTOFF_TIME_MINS exists and determines cutoff window', () => {
    expect(ENV.HANDOFF_CUTOFF_TIME_MINS).toBeDefined();
    expect(typeof ENV.HANDOFF_CUTOFF_TIME_MINS).toBe('number');
    expect(ENV.HANDOFF_CUTOFF_TIME_MINS).toBe(5);

    const sampleOrder: Order = {
      id: 'TEST-1',
      product: 'Test Item',
      recipient: 'Tester',
      paidAmount: '₱500',
      codAmount: '₱480',
      change: '₱20',
      trackingNumber: 'PH123456789',
      refCode: '0001-1234-5678',
      alphanumericKey: 'PH-1-1234',
      envelopeNumber: 'ENV-1',
      status: 'READY_TO_CLAIM',
      orderPlacedTime: 'Just now',
      awaitingParcelTime: 'Just now',
      readyToClaimTime: 'Just now',
      claimedTime: null,
      dateLabel: 'Today',
      carrier: 'SPX',
      hubLocation: 'Lily Hub',
      claimInitiatedAt: Date.now() - 4 * 60 * 1000, // 4 mins ago (within 5 mins)
    };

    // Unlocked within 5 mins
    expect(isClaimUnlocked(sampleOrder)).toBe(true);

    // Expired after 5 mins (e.g. 6 mins ago)
    const expiredOrder: Order = {
      ...sampleOrder,
      claimInitiatedAt: Date.now() - 6 * 60 * 1000,
    };
    expect(isClaimUnlocked(expiredOrder)).toBe(false);
  });

  it('verifies orderApi routes and contract validations', () => {
    const testOrder: Order = {
      id: 'ORD-999',
      product: 'Test Gadget',
      recipient: 'Alice',
      paidAmount: '₱1,000',
      codAmount: '₱950',
      change: '₱50',
      trackingNumber: 'PH999',
      refCode: 'REF-999',
      alphanumericKey: 'KEY-999',
      envelopeNumber: 'ENV-999',
      status: 'PAYMENT_REQUIRED',
      orderPlacedTime: 'Now',
      awaitingParcelTime: null,
      readyToClaimTime: null,
      claimedTime: null,
      dateLabel: 'Today',
      carrier: 'SPX',
      hubLocation: 'Hub',
    };

    expect(getStatedFee(testOrder)).toBe(1000);

    // 1. Activate route validation
    const failActivate = orderApi.staffActivate(testOrder, 800);
    expect(failActivate.success).toBe(false);
    expect(failActivate.error).toBe('INSUFFICIENT_AMOUNT');

    // NaN / zero / negative rejection
    const nanActivate = orderApi.staffActivate(testOrder, NaN);
    expect(nanActivate.success).toBe(false);
    expect(nanActivate.error).toBe('INVALID_AMOUNT');

    const negActivate = orderApi.staffActivate(testOrder, -50);
    expect(negActivate.success).toBe(false);
    expect(negActivate.error).toBe('INVALID_AMOUNT');

    const passActivate = orderApi.staffActivate(testOrder, 1000);
    expect(passActivate.success).toBe(true);
    expect(passActivate.data?.status).toBe('AWAITING_PARCEL');

    // Cannot activate already active order
    const reActivate = orderApi.staffActivate(passActivate.data!, 1000);
    expect(reActivate.success).toBe(false);
    expect(reActivate.error).toBe('INVALID_STATUS');

    // Cannot attach photo before courier paid
    const earlyPhoto = orderApi.staffAttachPhoto(passActivate.data!, 'photo.jpg');
    expect(earlyPhoto.success).toBe(false);
    expect(earlyPhoto.error).toBe('PAYMENT_PENDING');

    // 2. Pay route
    const paid = orderApi.staffPayCourier(passActivate.data!);
    expect(paid.success).toBe(true);
    expect(paid.data?.courierPaid).toBe(true);

    // Empty photo rejection
    const emptyPhoto = orderApi.staffAttachPhoto(paid.data!, '');
    expect(emptyPhoto.success).toBe(false);
    expect(emptyPhoto.error).toBe('INVALID_IMAGE');

    const wsPhoto = orderApi.staffAttachPhoto(paid.data!, '   ');
    expect(wsPhoto.success).toBe(false);
    expect(wsPhoto.error).toBe('INVALID_IMAGE');

    // 3. Attach photo route
    const attached = orderApi.staffAttachPhoto(paid.data!, 'photo.jpg');
    expect(attached.success).toBe(true);
    expect(attached.data?.status).toBe('READY_TO_CLAIM');

    // Cannot release before customer initiates claim
    const earlyRelease = orderApi.staffRelease(attached.data!);
    expect(earlyRelease.success).toBe(false);
    expect(earlyRelease.error).toBe('CLAIM_NOT_UNLOCKED');

    // 4. Customer claim initiate route
    const initiated = orderApi.customerInitiateClaim(attached.data!);
    expect(initiated.success).toBe(true);
    expect(initiated.data?.claimInitiatedAt).toBeDefined();

    // 5. Staff claim release route
    const released = orderApi.staffRelease(initiated.data!);
    expect(released.success).toBe(true);
    expect(released.data?.status).toBe('CLAIMED');
  });

  it('verifies handleRoute dispatcher matching the user API specification', () => {
    let orderPool: Order[] = [
      {
        id: 'ORD-SPEC-1',
        product: 'Wireless Keyboard',
        recipient: 'Bob',
        paidAmount: '₱600',
        codAmount: '₱550',
        change: '₱50',
        trackingNumber: 'PHSPEC1',
        refCode: 'REF-1',
        alphanumericKey: 'KEY-1',
        envelopeNumber: 'ENV-1',
        status: 'PAYMENT_REQUIRED',
        orderPlacedTime: 'Now',
        awaitingParcelTime: null,
        readyToClaimTime: null,
        claimedTime: null,
        dateLabel: 'Today',
        carrier: 'SPX',
        hubLocation: 'Lily Hub',
      },
    ];

    // Staff: POST /orders/{id}/activate
    const actRes = orderApi.handleRoute('staff', 'POST', '/orders/ORD-SPEC-1/activate', orderPool, {
      amountReceived: 600,
    });
    expect(actRes.success).toBe(true);
    expect(actRes.data?.status).toBe('AWAITING_PARCEL');
    orderPool[0] = actRes.data!;

    // Staff: POST /orders/{id}/make-claimable/pay
    const payRes = orderApi.handleRoute('staff', 'POST', '/orders/ORD-SPEC-1/make-claimable/pay', orderPool);
    expect(payRes.success).toBe(true);
    expect(payRes.data?.courierPaid).toBe(true);
    orderPool[0] = payRes.data!;

    // Staff: POST /orders/{id}/make-claimable/attach-photo
    const photoRes = orderApi.handleRoute(
      'staff',
      'POST',
      '/orders/ORD-SPEC-1/make-claimable/attach-photo',
      orderPool,
      { imageUrl: 'https://cdn.example.com/pouch.jpg' }
    );
    expect(photoRes.success).toBe(true);
    expect(photoRes.data?.status).toBe('READY_TO_CLAIM');
    orderPool[0] = photoRes.data!;

    // Customer: POST /orders/{id}/claim
    const custClaimRes = orderApi.handleRoute('customer', 'POST', '/orders/ORD-SPEC-1/claim', orderPool);
    expect(custClaimRes.success).toBe(true);
    expect(custClaimRes.data?.claimInitiatedAt).toBeDefined();
    orderPool[0] = custClaimRes.data!;

    // Staff: POST /orders/{id}/claim
    const staffClaimRes = orderApi.handleRoute('staff', 'POST', '/orders/ORD-SPEC-1/claim', orderPool);
    expect(staffClaimRes.success).toBe(true);
    expect(staffClaimRes.data?.status).toBe('CLAIMED');
  });

  it('active claim window consumes tracking progress area with dumbproof zero-jargon text and minimal essentials', async () => {
    render(<App />);

    // Navigate to Scenario 9 (Ready to Claim)
    const scenarioSelect = screen.getByLabelText('Select Figma Screen Scenario');
    fireEvent.change(scenarioSelect, { target: { value: 'figma-9' } });

    // When claim is NOT active: Tracking Progress stepper and checkbox are visible
    expect(screen.getByText('TRACKING PROGRESS')).toBeInTheDocument();
    expect(screen.getByText('Order Placed')).toBeInTheDocument();
    expect(screen.getByLabelText(/I confirm that I want to claim the order/i)).toBeInTheDocument();

    // Check confirmation and initiate claim
    fireEvent.click(screen.getByLabelText(/I confirm that I want to claim the order/i));
    fireEvent.click(screen.getByRole('button', { name: 'Initiate Claim' }));

    // Now claim is active:
    // 1. Long tracking progress stepper and checkbox are consumed/replaced
    expect(screen.queryByText('TRACKING PROGRESS')).not.toBeInTheDocument();
    expect(screen.queryByText('Order Placed')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/I confirm that I want to claim the order/i)).not.toBeInTheDocument();

    // 2. Countdown timer is prominently visible
    expect(screen.getByText(/Claim Window Active:/i)).toBeInTheDocument();

    // 3. Dumbproof zero-jargon text explaining staff interaction and valid claiming
    expect(screen.getByText('Staff counter unlocked!')).toBeInTheDocument();
    expect(
      screen.getByText(/Claiming is now valid\. Staff can now interact with your order and release your package\./i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Present this pass or your pickup key to the counter staff\./i)
    ).toBeInTheDocument();

    // 4. Essential minimal info: Cash Change, Pickup Key, Product Title, View QR Code button, Return to Home
    expect(screen.getAllByText('₱20').length).toBe(1); // exactly 1 instance, eliminating prior duplicate
    expect(screen.getByText('VXE R1 Nearlink')).toBeInTheDocument();
    expect(screen.getByText('PH-402-5544')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /View QR Code/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Return to Home/i })).toBeInTheDocument();

    // 5. Redundant elements are removed to ensure zero-scroll 'one look' layout
    expect(screen.queryByText('ORDER OVERVIEW')).not.toBeInTheDocument();
    expect(screen.queryByText('PICK-UP HUB LOCATION')).not.toBeInTheDocument();

    // 6. Copy button works for Pickup Key
    const copyKeyBtn = screen.getByRole('button', { name: /Copy Pickup Key/i });
    fireEvent.click(copyKeyBtn);
    expect(await screen.findByText(/Pickup Key copied to clipboard/i)).toBeInTheDocument();

    // 7. Navigation: View QR Code navigates to qr_screen
    fireEvent.click(screen.getByRole('button', { name: /View QR Code/i }));
    expect(screen.getByAltText('Parcelhub QR Code')).toBeInTheDocument();
  });
});

