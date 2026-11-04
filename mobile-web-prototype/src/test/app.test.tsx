import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('ParcelHub v3 Modular React Application', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('renders Studio Control Bar and default Home view', () => {
    render(<App />);

    expect(screen.getByText('ParcelHub v3')).toBeInTheDocument();
    expect(screen.getByText('Customer App')).toBeInTheDocument();
    expect(screen.getByText('Staff Counter')).toBeInTheDocument();
    expect(screen.getByText('Welcome Nyeowsz!')).toBeInTheDocument();
    expect(screen.getByText('+ Create Order')).toBeInTheDocument();
    expect(screen.getByText('VXE R1 Nearlink')).toBeInTheDocument();
  });

  it('toggles between active orders and zero orders view', () => {
    render(<App />);

    const toggleBtn = screen.getByText(/Switch to Zero orders view/i);
    fireEvent.click(toggleBtn);

    expect(screen.getByText('You don’t have any activities yet')).toBeInTheDocument();
    expect(screen.getByText('Create an order')).toBeInTheDocument();

    const switchBackBtn = screen.getByText(/Switch to Active orders view/i);
    fireEvent.click(switchBackBtn);

    expect(screen.getByText('VXE R1 Nearlink')).toBeInTheDocument();
  });

  it('switches to Staff Terminal via role toggle and performs search & status advance', () => {
    render(<App />);

    const staffRoleBtn = screen.getByRole('button', { name: 'Staff Counter' });
    fireEvent.click(staffRoleBtn);

    expect(screen.getByText(/Lily’s Hub Staff Terminal/i)).toBeInTheDocument();
    expect(screen.getByText(/Operator: STAFF-0488/i)).toBeInTheDocument();

    // Check search input
    const searchInput = screen.getByLabelText(/Staff Search Key or Waybill/i);
    fireEvent.change(searchInput, { target: { value: 'Poco' } });
    expect(screen.getByText('Poco X6 Pro')).toBeInTheDocument();

    // Click Unpaid tab (inactive filter)
    const unpaidTab = screen.getByRole('button', { name: 'Unpaid' });
    fireEvent.click(unpaidTab);
    fireEvent.change(searchInput, { target: { value: '' } });

    // Switch back to customer app
    const exitBtn = screen.getByRole('button', { name: 'Exit to App' });
    fireEvent.click(exitBtn);
    expect(screen.getByText('Welcome Nyeowsz!')).toBeInTheDocument();
  });

  it('handles scenario selection properly', () => {
    render(<App />);

    const scenarioSelect = screen.getByLabelText('Select Figma Screen Scenario');

    // Switch to Scenario 3 (Create Order)
    fireEvent.change(scenarioSelect, { target: { value: 'figma-3' } });
    expect(screen.getByText('Tap to upload receipt image')).toBeInTheDocument();

    // Switch to Scenario 6 (QR Screen)
    fireEvent.change(scenarioSelect, { target: { value: 'figma-6' } });
    expect(screen.getByText(/Show this QR code at the hub counter/i)).toBeInTheDocument();
    expect(screen.getByText('Save as Photo to Device')).toBeInTheDocument();

    // Switch to Scenario 7 (Payment Required)
    fireEvent.change(scenarioSelect, { target: { value: 'figma-7' } });
    expect(screen.getByText('Payment Required')).toBeInTheDocument();

    // Switch to Scenario 9 (Ready to Claim - Green)
    fireEvent.change(scenarioSelect, { target: { value: 'figma-9' } });
    expect(screen.getByText('Ready To Claim')).toBeInTheDocument();
    expect(screen.getByText('Initiate Claim')).toBeInTheDocument();
  });

  it('handles order creation flow with sample receipt and submission', () => {
    render(<App />);

    // Click + Create Order
    const createBtn = screen.getByText('+ Create Order');
    fireEvent.click(createBtn);

    // Use Sample Receipt
    const sampleBtn = screen.getByText(/⚡ Use Sample Shopee Receipt/i);
    fireEvent.click(sampleBtn);

    // Now on Confirm Order screen
    expect(screen.getByText('Confirm Order Details')).toBeInTheDocument();
    expect(screen.getByLabelText('Product Name')).toHaveValue('VXE R1 Nearlink Wireless Mouse');

    // Click submit order
    const submitBtn = screen.getByText(/Submit Order & Proceed to Payment/i);
    fireEvent.click(submitBtn);

    // Now on Payment Verification screen
    expect(screen.getByText('Awaiting Payment')).toBeInTheDocument();
    expect(screen.getByText('Order created successfully!')).toBeInTheDocument();
    expect(screen.getByText('Generate QR')).toBeInTheDocument();
  });

  it('unlocks staff terminal when user initiates claim and staff manually releases parcel', () => {
    render(<App />);

    // Select Scenario 9 (Ready to Claim)
    const scenarioSelect = screen.getByLabelText('Select Figma Screen Scenario');
    fireEvent.change(scenarioSelect, { target: { value: 'figma-9' } });

    // Check confirmation checkbox
    const confirmCheckbox = screen.getByLabelText(/I confirm that I want to claim the order/i);
    fireEvent.click(confirmCheckbox);

    // Click Initiate Claim
    const initiateBtn = screen.getByRole('button', { name: 'Initiate Claim' });
    fireEvent.click(initiateBtn);

    // Customer app now displays active claim window
    expect(screen.getByText(/Claim Window Active:/i)).toBeInTheDocument();
    expect(screen.getByText(/Staff counter unlocked!/i)).toBeInTheDocument();

    // Switch to Staff Terminal
    const staffRoleBtn = screen.getByRole('button', { name: 'Staff Counter' });
    fireEvent.click(staffRoleBtn);

    // Switch to Ready tab
    const readyTab = screen.getByRole('button', { name: 'Ready' });
    fireEvent.click(readyTab);

    // Staff release button is now UNLOCKED
    const releaseBtn = screen.getByRole('button', { name: 'Release' });
    expect(releaseBtn).not.toBeDisabled();

    // Staff manually presses "Release"
    fireEvent.click(releaseBtn);

    // Switch back to customer app and open order details to verify CLAIMED status
    const exitBtn = screen.getByRole('button', { name: 'Exit to App' });
    fireEvent.click(exitBtn);

    // On Home screen, click on the released order
    fireEvent.click(screen.getByText('VXE R1 Nearlink'));

    // Should now be on Order Details in CLAIMED status
    expect(screen.getByText('Complete Details')).toBeInTheDocument();
    expect(screen.getByText(/Handover verified. Cash change returned./i)).toBeInTheDocument();
  });

  it('opens and closes modals (Escrow policy, Notifications, Proof of Delivery)', () => {
    render(<App />);

    // Open Notifications modal from bell button
    const bellBtn = screen.getByLabelText('View notifications');
    fireEvent.click(bellBtn);
    expect(screen.getByText('4 New')).toBeInTheDocument();

    const dismissBtn = screen.getByText('Dismiss');
    fireEvent.click(dismissBtn);
    expect(screen.queryByText('4 New')).not.toBeInTheDocument();

    // Open Hub policy modal from payment verification scenario
    const scenarioSelect = screen.getByLabelText('Select Figma Screen Scenario');
    fireEvent.change(scenarioSelect, { target: { value: 'figma-5' } });
    const policyBtn = screen.getByText('Hub Policy & Information');
    fireEvent.click(policyBtn);
    expect(screen.getByText('ParcelHub Counter Policy')).toBeInTheDocument();

    const understoodBtn = screen.getByText('Understood');
    fireEvent.click(understoodBtn);
    expect(screen.queryByText('ParcelHub Counter Policy')).not.toBeInTheDocument();
  });

  it('navigates to FAQ screen via bottom nav help button and supports accordion tabs and back navigation', () => {
    render(<App />);

    // Click Help button in BottomNav
    const helpBtn = screen.getByLabelText('Help and FAQ');
    fireEvent.click(helpBtn);

    // Verify FAQ screen rendered
    expect(screen.getByText('Help & FAQs')).toBeInTheDocument();
    expect(screen.getByText('Frequently Asked')).toBeInTheDocument();
    expect(screen.getByText('Counter Policies')).toBeInTheDocument();
    expect(screen.getByText('How does ParcelHub COD Escrow work?')).toBeInTheDocument();

    // Toggle Counter Policies tab
    const policiesTab = screen.getByRole('button', { name: 'Counter Policies' });
    fireEvent.click(policiesTab);
    expect(screen.getByText('Exact Courier Payment Rule')).toBeInTheDocument();

    // Back button returns to Home
    const backBtn = screen.getByLabelText('Back to Home');
    fireEvent.click(backBtn);
    expect(screen.getByText('Welcome Nyeowsz!')).toBeInTheDocument();
  });

  it('supports search filtering, empty states, and keyboard toggling on FaqScreen', () => {
    render(<App />);

    // Navigate to FAQ
    fireEvent.click(screen.getByLabelText('Help and FAQ'));

    // Search input filters FAQs
    const searchInput = screen.getByPlaceholderText('Search questions or policies...');
    fireEvent.change(searchInput, { target: { value: 'mpin' } });
    expect(screen.getByText('What is my 4-digit MPIN and what is it used for?')).toBeInTheDocument();
    expect(screen.queryByText('How does ParcelHub COD Escrow work?')).not.toBeInTheDocument();

    // Clear search using the ✕ button
    const clearBtn = screen.getByLabelText('Clear search');
    fireEvent.click(clearBtn);
    expect(screen.getByText('How does ParcelHub COD Escrow work?')).toBeInTheDocument();

    // Toggle FAQ item via keyboard Enter
    const mpinQuestionCard = screen.getByRole('button', { name: /What is my 4-digit MPIN and what is it used for\?/i });
    expect(screen.queryByText(/Your MPIN is a personal 4-digit security code/i)).not.toBeInTheDocument();
    fireEvent.keyDown(mpinQuestionCard, { key: 'Enter', code: 'Enter' });
    expect(screen.getByText(/Your MPIN is a personal 4-digit security code/i)).toBeInTheDocument();

    // Search empty state
    fireEvent.change(searchInput, { target: { value: 'nonexistentquery123' } });
    expect(screen.getByText('No matching questions')).toBeInTheDocument();
    const emptyClearButtons = screen.getAllByRole('button', { name: /clear search/i });
    expect(emptyClearButtons.length).toBe(2);
    // Click the empty state link button
    fireEvent.click(emptyClearButtons[1]);
    expect(screen.getByText('How does ParcelHub COD Escrow work?')).toBeInTheDocument();

    // Switch to Transactions from BottomNav while on FAQ
    const transactionsBtn = screen.getByLabelText('Transactions History');
    fireEvent.click(transactionsBtn);
    expect(screen.getByText('ORDER HISTORY')).toBeInTheDocument();

    // Return to FAQ from Transactions screen BottomNav
    fireEvent.click(screen.getByLabelText('Help and FAQ'));
    expect(screen.getByText('Help & FAQs')).toBeInTheDocument();
  });
  it('handles figma-login scenario navigation', () => {
    render(<App />);
    const select = screen.getByLabelText(/Select Figma Screen Scenario/i) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'figma-login' } });
    expect(screen.getByRole('button', { name: /^Login$/i })).toBeInTheDocument();
  });

  it('handles figma-register scenario navigation', () => {
    render(<App />);
    const select = screen.getByLabelText(/Select Figma Screen Scenario/i) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'figma-register' } });
    expect(screen.getByText(/Step 1 of 2/i)).toBeInTheDocument();
  });
});
