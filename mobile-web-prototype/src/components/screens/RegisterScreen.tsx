import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const RegisterScreen: React.FC = () => {
  const { navigateTo, registerCustomer, showToast } = useApp();
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Form states matching CustomerRegisterRequest
  const [firstName, setFirstName] = useState('John Vince');
  const [lastName, setLastName] = useState('Dumaguit');
  const [middleInitial, setMiddleInitial] = useState('');
  const [email, setEmail] = useState('johnvincekeyedu@gmail.com');
  const [phone, setPhone] = useState('0917 123 4567');
  const [password, setPassword] = useState('••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleNextStep = () => {
    if (!firstName.trim()) {
      showToast('Please enter your first name.');
      return;
    }
    if (!lastName.trim()) {
      showToast('Please enter your last name.');
      return;
    }
    setCurrentStep(2);
  };

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      showToast('Please enter your email.');
      return;
    }
    if (!phone.trim()) {
      showToast('Please enter your phone number.');
      return;
    }
    if (!password.trim()) {
      showToast('Please enter a password.');
      return;
    }

    setIsLoading(true);
    try {
      await registerCustomer({
        password,
        email: email.trim(),
        firstname: firstName.trim(),
        lastname: lastName.trim(),
        middleinitial: middleInitial.trim() || undefined,
        phonenumber: phone.trim(),
      });
    } catch (err: any) {
      showToast(err?.message || 'Registration failed. Please check your information.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center min-h-[720px] bg-white px-6 py-8 relative select-none animate-fadeIn">
      {/* Centered Logo */}
      <div className="flex flex-col items-center justify-center gap-2 mb-2 mt-1">
        <svg
          className="w-[58px] h-[58px] drop-shadow-xs"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M50 10L86 31V73L50 94L14 73V31L50 10Z" fill="#215CD4" />
          <path d="M50 10L86 31L50 52L14 31L50 10Z" fill="#3B82F6" />
          <path d="M14 31L50 52V94L14 73V31Z" fill="#1D4ED8" />
          <path d="M86 31L50 52V94L86 73V31Z" fill="#1E40AF" />
          <path
            d="M50 20L75 34.5V64.5L50 79L25 64.5V34.5L50 20Z"
            stroke="#FFFFFF"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M50 20V79M25 34.5L50 49L75 34.5"
            stroke="#FFFFFF"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="text-[20px] font-extrabold tracking-tight leading-none">
          <span className="text-[#215cd4]">Parcel</span>
          <span className="text-[#111827]">Hub</span>
        </div>
      </div>

      {/* Screen Subtitle */}
      <div className="text-[17px] font-semibold text-gray-700 text-center mb-4">Register</div>

      {/* Minimal Stepper Bar Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-[11.5px] font-bold text-[#215cd4] bg-[#e8eefb] px-2.5 py-1 rounded-full">
          Step {currentStep} of 2
        </span>
        <div className="flex gap-1.5 w-20 h-1">
          <div className="flex-1 rounded-full bg-[#215cd4]" />
          <div
            className={`flex-1 rounded-full transition-colors ${
              currentStep === 2 ? 'bg-[#215cd4]' : 'bg-gray-200'
            }`}
          />
        </div>
      </div>

      {currentStep === 1 ? (
        /* STEP 1: Personal */
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleNextStep();
          }}
          className="space-y-3.5 animate-fadeIn"
        >
          {/* First Name */}
          <div className="relative">
            <label
              htmlFor="reg-first"
              className="absolute -top-2 left-3 bg-white px-1.5 text-[11px] font-semibold text-gray-600 z-10 pointer-events-none tracking-tight"
            >
              First name
            </label>
            <input
              type="text"
              id="reg-first"
              aria-label="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full h-11 border border-gray-300 rounded-lg px-3.5 text-[13.5px] font-medium text-gray-900 bg-white outline-none focus:border-[#215cd4] focus:ring-2 focus:ring-[#215cd4]/15 transition-all"
            />
          </div>

          {/* Last Name */}
          <div className="relative">
            <label
              htmlFor="reg-last"
              className="absolute -top-2 left-3 bg-white px-1.5 text-[11px] font-semibold text-gray-600 z-10 pointer-events-none tracking-tight"
            >
              Last name
            </label>
            <input
              type="text"
              id="reg-last"
              aria-label="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full h-11 border border-gray-300 rounded-lg px-3.5 text-[13.5px] font-medium text-gray-900 bg-white outline-none focus:border-[#215cd4] focus:ring-2 focus:ring-[#215cd4]/15 transition-all"
            />
          </div>

          {/* Middle Initial (Optional) */}
          <div className="relative">
            <label
              htmlFor="reg-mi"
              className="absolute -top-2 left-3 bg-white px-1.5 text-[11px] font-semibold text-gray-600 z-10 pointer-events-none tracking-tight"
            >
              Middle initial (optional)
            </label>
            <input
              type="text"
              id="reg-mi"
              aria-label="Middle initial"
              maxLength={4}
              value={middleInitial}
              onChange={(e) => setMiddleInitial(e.target.value)}
              placeholder="e.g. D."
              className="w-full h-11 border border-gray-300 rounded-lg px-3.5 text-[13.5px] font-medium text-gray-900 bg-white outline-none focus:border-[#215cd4] focus:ring-2 focus:ring-[#215cd4]/15 transition-all"
            />
          </div>

          {/* Primary Action Button: Next */}
          <button
            type="submit"
            className="w-full h-11 bg-[#215cd4] hover:bg-[#194cb5] text-white rounded-lg font-semibold text-[14.5px] shadow-xs transition-all flex items-center justify-center cursor-pointer mt-4 active:scale-[0.99]"
          >
            Next
          </button>

          {/* Secondary Action: Back to login */}
          <button
            type="button"
            onClick={() => navigateTo('login')}
            className="w-full h-10 bg-[#e8eefb] hover:bg-[#dbe5f9] text-[#1e3a8a] rounded-lg font-semibold text-[13px] transition-all flex items-center justify-center cursor-pointer mt-2.5"
          >
            Back to login
          </button>
        </form>
      ) : (
        /* STEP 2: Account */
        <form onSubmit={handleRegister} className="space-y-3.5 animate-fadeIn">
          {/* Email */}
          <div className="relative">
            <label
              htmlFor="reg-email"
              className="absolute -top-2 left-3 bg-white px-1.5 text-[11px] font-semibold text-gray-600 z-10 pointer-events-none tracking-tight"
            >
              Email
            </label>
            <input
              type="email"
              id="reg-email"
              aria-label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 border border-gray-300 rounded-lg px-3.5 text-[13.5px] font-medium text-gray-900 bg-white outline-none focus:border-[#215cd4] focus:ring-2 focus:ring-[#215cd4]/15 transition-all"
            />
          </div>

          {/* Phone Number */}
          <div className="relative">
            <label
              htmlFor="reg-phone"
              className="absolute -top-2 left-3 bg-white px-1.5 text-[11px] font-semibold text-gray-600 z-10 pointer-events-none tracking-tight"
            >
              Phone number
            </label>
            <input
              type="tel"
              id="reg-phone"
              aria-label="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-11 border border-gray-300 rounded-lg px-3.5 text-[13.5px] font-medium text-gray-900 bg-white outline-none focus:border-[#215cd4] focus:ring-2 focus:ring-[#215cd4]/15 transition-all"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <label
              htmlFor="reg-pass"
              className="absolute -top-2 left-3 bg-white px-1.5 text-[11px] font-semibold text-gray-600 z-10 pointer-events-none tracking-tight"
            >
              Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="reg-pass"
              aria-label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 border border-gray-300 rounded-lg pl-3.5 pr-10 text-[13.5px] font-medium text-gray-900 bg-white outline-none focus:border-[#215cd4] focus:ring-2 focus:ring-[#215cd4]/15 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1 focus-visible:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                  />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3" strokeWidth="2" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Primary Action Button: Register */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-[#215cd4] hover:bg-[#194cb5] text-white rounded-lg font-semibold text-[14.5px] shadow-xs transition-all flex items-center justify-center cursor-pointer mt-4 active:scale-[0.99] disabled:opacity-60"
          >
            {isLoading ? 'Creating Account...' : 'Register'}
          </button>

          {/* Secondary Action: Back */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="w-full h-10 bg-[#e8eefb] hover:bg-[#dbe5f9] text-[#1e3a8a] rounded-lg font-semibold text-[13px] transition-all flex items-center justify-center cursor-pointer mt-2.5"
          >
            Back
          </button>
        </form>
      )}
    </div>
  );
};
export default RegisterScreen;
