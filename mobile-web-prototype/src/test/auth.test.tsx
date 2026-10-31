import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { customerApi } from '../services/customerApi';

describe('Customer Auth API Routes & Screens (/api/customer)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('Customer API Service Contract', () => {
    it('POST /api/customer/register contract conforms to spec', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          statusMessage: 'Custom Registration Success',
          refreshToken: 'rt_test_token_123',
        }),
      });
      globalThis.fetch = mockFetch;

      const payload = {
        password: 'Password123!',
        email: 'john@example.com',
        firstname: 'John',
        lastname: 'Doe',
        middleinitial: 'K.',
        phonenumber: '09171234567',
      };

      const res = await customerApi.register(payload);

      expect(mockFetch).toHaveBeenCalledWith('/api/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      expect(res.statusMessage).toBe('Custom Registration Success');
      expect(res.refreshToken).toBe('rt_test_token_123');
    });

    it('POST /api/customer/login contract conforms to spec', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          statusMessage: 'Custom Login Success',
          refreshToken: 'rt_login_token_456',
        }),
      });
      globalThis.fetch = mockFetch;

      const payload = {
        email: 'john@example.com',
        password: 'Password123!',
      };

      const res = await customerApi.login(payload);

      expect(mockFetch).toHaveBeenCalledWith('/api/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      expect(res.statusMessage).toBe('Custom Login Success');
      expect(res.refreshToken).toBe('rt_login_token_456');
    });

    it('POST /api/customer/create-mpin contract conforms to spec', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          statusMessage: 'Custom Create MPIN Success',
          authToken: 'at_auth_token_789',
        }),
      });
      globalThis.fetch = mockFetch;

      const payload = {
        refreshToken: 'rt_login_token_456',
        mpin: '1234',
      };

      const res = await customerApi.createMpin(payload);

      expect(mockFetch).toHaveBeenCalledWith('/api/customer/create-mpin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      expect(res.statusMessage).toBe('Custom Create MPIN Success');
      expect(res.authToken).toBe('at_auth_token_789');
    });

    it('POST /api/customer/mpin contract conforms to spec', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          statusMessage: 'Custom Verify MPIN Success',
          authToken: 'at_auth_token_999',
        }),
      });
      globalThis.fetch = mockFetch;

      const payload = {
        refreshToken: 'rt_login_token_456',
        mpin: '1234',
      };

      const res = await customerApi.verifyMpin(payload);

      expect(mockFetch).toHaveBeenCalledWith('/api/customer/mpin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      expect(res.statusMessage).toBe('Custom Verify MPIN Success');
      expect(res.authToken).toBe('at_auth_token_999');
    });

    it('throws server error messages on 4xx/5xx responses rather than fake success', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          statusMessage: 'Invalid email or password credentials',
        }),
      });
      globalThis.fetch = mockFetch;

      await expect(
        customerApi.login({ email: 'wrong@example.com', password: 'bad' })
      ).rejects.toThrow('Invalid email or password credentials');
    });

    it('throws server error on register 409 conflict', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          statusMessage: 'Email address already exists in system',
        }),
      });
      globalThis.fetch = mockFetch;

      await expect(
        customerApi.register({
          email: 'exists@example.com',
          password: 'pass',
          firstname: 'A',
          lastname: 'B',
          phonenumber: '123',
        })
      ).rejects.toThrow('Email address already exists in system');
    });

    it('falls back to safe simulated success for HTML testing when offline or 404', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
      globalThis.fetch = mockFetch;

      const regRes = await customerApi.register({
        email: 'offline@example.com',
        password: 'pass',
        firstname: 'Demo',
        lastname: 'User',
        phonenumber: '09170000000',
      });
      expect(regRes.refreshToken).toBeDefined();

      const loginRes = await customerApi.login({ email: 'offline@example.com', password: 'pass' });
      expect(loginRes.refreshToken).toBeDefined();

      const mpinCreateRes = await customerApi.createMpin({ refreshToken: 'tok', mpin: '1234' });
      expect(mpinCreateRes.authToken).toBeDefined();

      const mpinVerifyRes = await customerApi.verifyMpin({ refreshToken: 'tok', mpin: '1234' });
      expect(mpinVerifyRes.authToken).toBeDefined();
    });

    it('falls back to simulated success on 502/500 backend unavailable and 405 static server', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => ({ error: 'Bad Gateway', message: 'Failed to connect to backend' }),
      });
      globalThis.fetch = mockFetch;

      const loginRes = await customerApi.login({ email: 'john@example.com', password: 'pass' });
      expect(loginRes.refreshToken).toBeDefined();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 405,
        json: async () => ({ error: 'Method Not Allowed' }),
      });
      const regRes = await customerApi.register({
        email: 'john@example.com',
        password: 'pass',
        firstname: 'John',
        lastname: 'Doe',
        phonenumber: '09171234567',
      });
      expect(regRes.refreshToken).toBeDefined();
    });
  });

  describe('UI Layout & Minimal 2-Step Flow Requirements', () => {
    it('ensures BrandHeader and dark hero cards are removed from Auth screens', () => {
      render(<App />);

      const scenarioSelect = screen.getByLabelText('Select Figma Screen Scenario');

      // Check Login screen
      fireEvent.change(scenarioSelect, { target: { value: 'figma-login' } });
      expect(screen.queryByText('CUSTOMER AUTHENTICATION')).not.toBeInTheDocument();
      expect(screen.queryByText('Alerts On')).not.toBeInTheDocument();
      expect(screen.queryByText('Welcome Back!')).not.toBeInTheDocument();

      // Check Register screen
      fireEvent.change(scenarioSelect, { target: { value: 'figma-register' } });
      expect(screen.queryByText('REGISTER ACCOUNT')).not.toBeInTheDocument();
      expect(screen.queryByText('Alerts On')).not.toBeInTheDocument();
      expect(screen.queryByText('Create an Account')).not.toBeInTheDocument();
      // Ensure verbose texts removed
      expect(screen.queryByText(/Enter your name as it appears/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Secure your account with contact info/i)).not.toBeInTheDocument();

      // Check MPIN screens
      fireEvent.change(scenarioSelect, { target: { value: 'figma-mpin-login' } });
      expect(screen.queryByText('CUSTOMER LOGIN')).not.toBeInTheDocument();
      expect(screen.queryByText('Alerts On')).not.toBeInTheDocument();

      fireEvent.change(scenarioSelect, { target: { value: 'figma-mpin-create' } });
      expect(screen.queryByText('SECURITY MPIN SETUP')).not.toBeInTheDocument();
      expect(screen.queryByText('Alerts On')).not.toBeInTheDocument();
    });

    it('strictly executes the minimal 2-step registration flow without clutter', async () => {
      render(<App />);

      const scenarioSelect = screen.getByLabelText('Select Figma Screen Scenario');
      fireEvent.change(scenarioSelect, { target: { value: 'figma-register' } });

      // Step 1: minimal indicator
      expect(screen.getByText(/Step 1 of 2/i)).toBeInTheDocument();
      expect(screen.getByLabelText('First name')).toBeInTheDocument();
      expect(screen.getByLabelText('Last name')).toBeInTheDocument();
      expect(screen.getByLabelText(/Middle initial/i)).toBeInTheDocument();

      // Ensure no layout toggles or verbose clutter
      expect(screen.queryByText('Organized View')).not.toBeInTheDocument();

      // Enter First and Last Name
      fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Maria' } });
      fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Santos' } });
      fireEvent.change(screen.getByLabelText(/Middle initial/i), { target: { value: 'C.' } });

      // Click Next to proceed to Step 2
      const nextBtn = screen.getByText('Next');
      fireEvent.click(nextBtn);

      // Step 2 is active
      expect(screen.getByText(/Step 2 of 2/i)).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Phone number')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();

      // Test Back to Step 1
      const backBtn = screen.getByRole('button', { name: /^Back$/i });
      fireEvent.click(backBtn);
      expect(screen.getByText(/Step 1 of 2/i)).toBeInTheDocument();
      expect(screen.getByLabelText('First name')).toHaveValue('Maria');

      // Go back to Step 2
      fireEvent.click(screen.getByText('Next'));

      // Fill Step 2 fields
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'maria.santos@gmail.com' } });
      fireEvent.change(screen.getByLabelText('Phone number'), { target: { value: '0918 765 4321' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'SuperSecret123!' } });
      fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'SuperSecret123!' } });

      // Submit registration
      const registerBtn = screen.getByRole('button', { name: /^Register$/i });
      fireEvent.click(registerBtn);

      // Should transition to MPIN Create screen
      await waitFor(() => {
        expect(screen.getByText(/1\. Enter MPIN/i)).toBeInTheDocument();
      });
    });
  });

  describe('MPIN Creation & Confirmation Redesign', () => {
    it('guides user through Step 1 and Step 2 confirmation with error handling on mismatch', async () => {
      render(<App />);

      const scenarioSelect = screen.getByLabelText('Select Figma Screen Scenario');
      fireEvent.change(scenarioSelect, { target: { value: 'figma-mpin-create' } });

      expect(screen.getByText(/1\. Enter MPIN/i)).toBeInTheDocument();
      expect(screen.getByText(/2\. Confirm MPIN/i)).toBeInTheDocument();

      // Step 1: Button is Create MPIN and is disabled/not clickable
      const createMpinBtn = screen.getByRole('button', { name: 'Create MPIN' });
      expect(createMpinBtn).toBeDisabled();

      // Enter 4 digits on keypad: 5 8 2 0
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      fireEvent.click(screen.getByRole('button', { name: '8' }));
      fireEvent.click(screen.getByRole('button', { name: '2' }));
      expect(createMpinBtn).toBeDisabled();
      fireEvent.click(screen.getByRole('button', { name: '0' }));

      // Button is still Create MPIN and becomes clickable
      expect(createMpinBtn).not.toBeDisabled();
      expect(createMpinBtn).toHaveTextContent('Create MPIN');

      // Click Create MPIN to advance to Step 2
      fireEvent.click(createMpinBtn);

      // In Step 2: Button should be Confirm MPIN and disabled until match
      expect(screen.getByText(/Re-enter MPIN to Confirm/i)).toBeInTheDocument();
      const confirmMpinBtn = screen.getByRole('button', { name: 'Confirm MPIN' });
      expect(confirmMpinBtn).toBeDisabled();

      // Enter mismatched digits: 5 8 2 1
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      fireEvent.click(screen.getByRole('button', { name: '8' }));
      fireEvent.click(screen.getByRole('button', { name: '2' }));
      fireEvent.click(screen.getByRole('button', { name: '1' }));

      // Mismatch message appears, Confirm MPIN should NOT be clickable
      expect(screen.getByText(/Digits do not match/i)).toBeInTheDocument();
      expect(confirmMpinBtn).toBeDisabled();

      // Clear pin2 and enter matching digits: 5 8 2 0
      fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      fireEvent.click(screen.getByRole('button', { name: '8' }));
      fireEvent.click(screen.getByRole('button', { name: '2' }));
      fireEvent.click(screen.getByRole('button', { name: '0' }));

      // Should indicate match and Confirm MPIN becomes clickable
      expect(screen.getByText(/MPIN verified & ready!/i)).toBeInTheDocument();
      expect(confirmMpinBtn).not.toBeDisabled();

      // Submit MPIN confirmation
      fireEvent.click(confirmMpinBtn);

      // Should navigate to Home
      await waitFor(() => {
        expect(screen.getByText(/Welcome Nyeowsz!/i)).toBeInTheDocument();
      });
    });

    it('recovers from mismatch immediately when typing a new digit without keypad freeze', async () => {
      render(<App />);

      const scenarioSelect = screen.getByLabelText('Select Figma Screen Scenario');
      fireEvent.change(scenarioSelect, { target: { value: 'figma-mpin-create' } });

      // Step 1: 1 1 1 1
      fireEvent.click(screen.getByRole('button', { name: '1' }));
      fireEvent.click(screen.getByRole('button', { name: '1' }));
      fireEvent.click(screen.getByRole('button', { name: '1' }));
      fireEvent.click(screen.getByRole('button', { name: '1' }));

      // Advance to Step 2
      fireEvent.click(screen.getByRole('button', { name: 'Create MPIN' }));
      expect(screen.getByText(/Re-enter MPIN to Confirm/i)).toBeInTheDocument();

      // Step 2: enter mismatch 2 2 2 2
      fireEvent.click(screen.getByRole('button', { name: '2' }));
      fireEvent.click(screen.getByRole('button', { name: '2' }));
      fireEvent.click(screen.getByRole('button', { name: '2' }));
      fireEvent.click(screen.getByRole('button', { name: '2' }));

      expect(screen.getByText(/Digits do not match/i)).toBeInTheDocument();

      // Typing next digit '1' should immediately reset pin2 and start fresh without freezing
      fireEvent.click(screen.getByRole('button', { name: '1' }));
      expect(screen.queryByText(/Digits do not match/i)).not.toBeInTheDocument();

      // Type the remaining 1s: 1 1 1 -> matches!
      fireEvent.click(screen.getByRole('button', { name: '1' }));
      fireEvent.click(screen.getByRole('button', { name: '1' }));
      fireEvent.click(screen.getByRole('button', { name: '1' }));

      expect(screen.getByText(/MPIN verified & ready!/i)).toBeInTheDocument();
      const confirmMpinBtn = screen.getByRole('button', { name: 'Confirm MPIN' });
      expect(confirmMpinBtn).not.toBeDisabled();

      // Verify Change Step 1 MPIN button is removed per spec
      expect(screen.queryByRole('button', { name: /Change Step 1 MPIN/i })).not.toBeInTheDocument();

      // Clicking Step 1 container returns to Step 1
      fireEvent.click(screen.getByText(/1\. Enter MPIN/i));
      const step1Btn = screen.getByRole('button', { name: 'Create MPIN' });
      expect(step1Btn).toBeInTheDocument();
      expect(step1Btn).not.toBeDisabled();
    });

    it('disables Create MPIN button when digits are incomplete or backspaced', async () => {
      render(<App />);

      const scenarioSelect = screen.getByLabelText('Select Figma Screen Scenario');
      fireEvent.change(scenarioSelect, { target: { value: 'figma-mpin-create' } });

      const createBtn = screen.getByRole('button', { name: 'Create MPIN' });
      expect(createBtn).toBeDisabled();

      // Enter digits
      fireEvent.click(screen.getByRole('button', { name: '9' }));
      fireEvent.click(screen.getByRole('button', { name: '8' }));
      fireEvent.click(screen.getByRole('button', { name: '7' }));
      expect(createBtn).toBeDisabled();

      fireEvent.click(screen.getByRole('button', { name: '6' }));
      expect(createBtn).not.toBeDisabled();

      // Backspace disables it again
      fireEvent.click(screen.getByLabelText('Backspace'));
      expect(createBtn).toBeDisabled();
    });
  });

  describe('Login & MPIN Login Flow', () => {
    it('executes customer login and transitions to MPIN verification and Home', async () => {
      render(<App />);

      const scenarioSelect = screen.getByLabelText('Select Figma Screen Scenario');
      fireEvent.change(scenarioSelect, { target: { value: 'figma-login' } });

      const emailInput = screen.getByLabelText('Email');
      const passInput = screen.getByLabelText('Password');

      fireEvent.change(emailInput, { target: { value: 'testuser@parcelhub.com' } });
      fireEvent.change(passInput, { target: { value: 'MySecret123' } });

      const loginBtn = screen.getByRole('button', { name: 'Login' });
      fireEvent.click(loginBtn);

      // Navigates to MPIN login screen
      await waitFor(() => {
        expect(screen.getByText('Enter MPIN')).toBeInTheDocument();
      });

      // Enter MPIN: 1 2 3 4
      fireEvent.click(screen.getByRole('button', { name: '1' }));
      fireEvent.click(screen.getByRole('button', { name: '2' }));
      fireEvent.click(screen.getByRole('button', { name: '3' }));
      fireEvent.click(screen.getByRole('button', { name: '4' }));

      // Verify Sign in with MPIN button is removed per spec
      expect(screen.queryByRole('button', { name: /Sign in with MPIN/i })).not.toBeInTheDocument();

      // Automatically logs in and navigates to Home without manual button click
      await waitFor(() => {
        expect(screen.getByText(/Welcome Nyeowsz!/i)).toBeInTheDocument();
      });
    });

    it('cancels auto-submit timer when pressing backspace on MPIN login', async () => {
      render(<App />);

      const scenarioSelect = screen.getByLabelText('Select Figma Screen Scenario');
      fireEvent.change(scenarioSelect, { target: { value: 'figma-mpin-login' } });

      // Enter 4 digits
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      fireEvent.click(screen.getByRole('button', { name: '5' }));
      fireEvent.click(screen.getByRole('button', { name: '5' }));

      // Immediately backspace
      fireEvent.click(screen.getByLabelText('Backspace'));

      // Wait 350ms
      await new Promise((resolve) => setTimeout(resolve, 350));

      // Should not have auto-submitted to Home
      expect(screen.queryByText(/Welcome Nyeowsz!/i)).not.toBeInTheDocument();
      expect(screen.getByText('Enter MPIN')).toBeInTheDocument();
    });
  });
});
