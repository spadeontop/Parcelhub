import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import { MpinModal } from '../components/modals/MpinModal';
import { AppProvider, useApp } from '../context/AppContext';

const MpinTestOpener = () => {
  const { openMpinModal } = useApp();
  return <button onClick={openMpinModal}>Open MPIN Modal</button>;
};

describe('Edge cases and boundary handling', () => {
  it('handles MPIN modal physical keyboard events (0-9, Backspace, Escape)', () => {
    render(
      <AppProvider>
        <MpinTestOpener />
        <MpinModal />
      </AppProvider>
    );

    fireEvent.click(screen.getByText('Open MPIN Modal'));
    expect(screen.getByText('Authorize Release')).toBeInTheDocument();

    // Type via window keyboard
    fireEvent.keyDown(window, { key: '1' });
    fireEvent.keyDown(window, { key: '2' });
    fireEvent.keyDown(window, { key: 'Backspace' }); // deletes '2'
    fireEvent.keyDown(window, { key: 'Escape' }); // closes modal

    expect(screen.queryByText('Authorize Release')).not.toBeInTheDocument();
  });

  it('prevents initiating claim when confirmation checkbox is unchecked', () => {
    render(<App />);

    const scenarioSelect = screen.getByLabelText('Select Figma Screen Scenario');
    fireEvent.change(scenarioSelect, { target: { value: 'figma-9' } });

    // Ensure checkbox is unchecked
    const confirmCheckbox = screen.getByLabelText(/I confirm that I want to claim the order/i);
    if ((confirmCheckbox as HTMLInputElement).checked) {
      fireEvent.click(confirmCheckbox);
    }

    // Attempt initiate claim
    fireEvent.click(screen.getByRole('button', { name: 'Initiate Claim' }));

    // Modal should not open
    expect(screen.queryByText('Authorize Release')).not.toBeInTheDocument();
    // Toast should show warning
    expect(screen.getByText(/Please check the confirmation box before initiating claim/i)).toBeInTheDocument();
  });

  it('disables claim initiation when hub is closed (Scenario 11)', () => {
    render(<App />);

    const scenarioSelect = screen.getByLabelText('Select Figma Screen Scenario');
    fireEvent.change(scenarioSelect, { target: { value: 'figma-11' } });

    expect(screen.getByText(/Cannot initiate claim when the hub is closed/i)).toBeInTheDocument();
    const disabledBtn = screen.getByRole('button', { name: /Cannot initiate claim when the hub is closed/i });
    expect(disabledBtn).toBeDisabled();
  });

  it('filters transactions with empty results gracefully', () => {
    render(<App />);

    // Navigate to transactions
    fireEvent.click(screen.getByRole('button', { name: 'Transactions' }));

    // Click filter for Awaiting Parcel
    fireEvent.click(screen.getByRole('button', { name: 'Awaiting Parcel' }));
    expect(screen.getByText('Poco X6 Pro')).toBeInTheDocument();

    // Click filter for All Orders
    fireEvent.click(screen.getByRole('button', { name: 'All Orders' }));
    expect(screen.getByText('VXE R1 Nearlink')).toBeInTheDocument();
    expect(screen.getByText('Keychron K2 Pro Mechanical Keyboard')).toBeInTheDocument();
  });

  it('copies tracking number or key to clipboard with fallback', async () => {
    render(<App />);

    // Select Scenario 6 (QR Screen)
    const scenarioSelect = screen.getByLabelText('Select Figma Screen Scenario');
    fireEvent.change(scenarioSelect, { target: { value: 'figma-6' } });

    const copyBtn = screen.getByTitle('Copy Key');
    fireEvent.click(copyBtn);

    // Toast indicates copied
    expect(await screen.findByText(/Counter Key copied to clipboard/i)).toBeInTheDocument();
  });

  it('toggles Fullscreen Mode and Device Frame Mode', () => {
    render(<App />);

    const viewToggleBtn = screen.getByRole('button', { name: /Fullscreen Mode/i });
    fireEvent.click(viewToggleBtn);

    expect(screen.getByRole('button', { name: /Device Frame Mode/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Device Frame Mode/i }));
    expect(screen.getByRole('button', { name: /Fullscreen Mode/i })).toBeInTheDocument();
  });

  it('handles Scenario 10 checkbox synchronization without snapping back to Scenario 9', () => {
    render(<App />);

    const scenarioSelect = screen.getByLabelText('Select Figma Screen Scenario') as HTMLSelectElement;

    // Switch to Scenario 10
    fireEvent.change(scenarioSelect, { target: { value: 'figma-10' } });

    // Must remain on figma-10
    expect(scenarioSelect.value).toBe('figma-10');

    // Checkbox must be checked
    const checkbox = screen.getByLabelText(/I confirm that I want to claim the order/i) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);

    // Unchecking the checkbox transitions scenario value to figma-9
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
    expect(scenarioSelect.value).toBe('figma-9');
  });

  it('auto-switches to matching tab on Staff Terminal barcode scan', () => {
    render(<App />);

    // Go to Staff Terminal
    const staffBtn = screen.getByRole('button', { name: 'Staff Counter' });
    fireEvent.click(staffBtn);

    // Initial tab is Active (Awaiting Parcel)
    // Click Scan Barcode for current order (ORD-402, Ready to Claim)
    const scanBtn = screen.getByRole('button', { name: 'Scan Barcode' });
    fireEvent.click(scanBtn);

    // It should automatically switch to Ready tab and display the matched order
    expect(screen.getByText(/PH-402-5544/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Release/i })).toBeInTheDocument();
  });

  it('advances order lifecycle stages via simulateStaffFlow (Step Flow button)', () => {
    render(<App />);

    const scenarioSelect = screen.getByLabelText('Select Figma Screen Scenario');
    // Start at Payment Required (Scenario 7)
    fireEvent.change(scenarioSelect, { target: { value: 'figma-7' } });
    expect(screen.getByText('Payment Required')).toBeInTheDocument();

    const stepFlowBtn = screen.getByRole('button', { name: '⚡ Step Flow' });

    // Step 1: Cash deposit confirmed -> Awaiting Parcel
    fireEvent.click(stepFlowBtn);
    expect(screen.getAllByText('Awaiting Parcel').length).toBeGreaterThanOrEqual(1);

    // Step 2: Courier arrival -> Ready to Claim
    fireEvent.click(stepFlowBtn);
    expect(screen.getAllByText(/Ready to Claim/i).length).toBeGreaterThanOrEqual(1);

    // Step 3: Initiate claim window
    fireEvent.click(stepFlowBtn);
    expect(screen.getByText(/Claim Window Active:/i)).toBeInTheDocument();
  });

  it('marks all notifications as read and removes red badge from bell button', () => {
    render(<App />);

    // Initially unread notifications exist
    const bellBtn = screen.getByLabelText('View notifications');
    expect(bellBtn.querySelector('.bg-\\[\\#ef4444\\]')).toBeInTheDocument();

    // Open notifications
    fireEvent.click(bellBtn);
    expect(screen.getByText('4 New')).toBeInTheDocument();

    // Click Dismiss (which marks as read)
    const dismissBtn = screen.getByText('Dismiss');
    fireEvent.click(dismissBtn);

    // Bell red badge should now be gone
    expect(bellBtn.querySelector('.bg-\\[\\#ef4444\\]')).not.toBeInTheDocument();
  });

  it('verifies counter hold timer is removed from Payment Verification screen', () => {
    render(<App />);

    const scenarioSelect = screen.getByLabelText('Select Figma Screen Scenario');
    fireEvent.change(scenarioSelect, { target: { value: 'figma-5' } });

    expect(screen.getByText('Awaiting Payment')).toBeInTheDocument();
    expect(screen.queryByText('Counter Hold Timer:')).not.toBeInTheDocument();
  });
});
