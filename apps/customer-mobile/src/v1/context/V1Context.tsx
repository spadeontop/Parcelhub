import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from 'react';
import {
  CustomerRegisterReq,
  CustomerRegisterRes,
  CustomerProfile,
  JWTToken,
} from '../types/api';
import { authApi } from '../services/authApi';
import { v1Storage } from '../utils/storage';

export type ScreenId =
  | 'register'
  | 'login'
  | 'mpin_create'
  | 'mpin_login'
  | 'home'
  | 'create_order'
  | 'confirm_order'
  | 'payment_verification'
  | 'qr_screen'
  | 'order_details'
  | 'transactions'
  | 'notifications'
  | 'profile'
  | 'faq';

export type RegistrationDraft = {
  readonly currentStep: 1 | 2;
  readonly firstName: string;
  readonly lastName: string;
  readonly middleInitial: string;
  readonly email: string;
  readonly phone: string;
  readonly password: string;
  readonly confirmPassword: string;
  readonly emailError?: string;
};

const DEFAULT_REGISTRATION_DRAFT: RegistrationDraft = {
  currentStep: 1,
  firstName: '',
  lastName: '',
  middleInitial: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  emailError: '',
};

export type ToastState = {
  readonly show: boolean;
  readonly message: string;
};

export type V1ContextType = {
  readonly activeScreen: ScreenId;
  readonly navigateTo: (screen: ScreenId) => void;
  readonly toast: ToastState;
  readonly showToast: (message: string) => void;
  readonly preAuthToken: JWTToken | null;
  readonly authToken: JWTToken | null;
  readonly customer: Partial<CustomerProfile> | null;
  readonly registrationDraft: RegistrationDraft;
  readonly updateRegistrationDraft: (partial: Partial<RegistrationDraft>) => void;
  readonly clearRegistrationDraft: () => void;
  readonly registerCustomer: (payload: CustomerRegisterReq) => Promise<CustomerRegisterRes>;
};

const V1Context = createContext<V1ContextType | undefined>(undefined);

export const V1Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Screen #1 testing default: start on 'register'
  const [activeScreen, setActiveScreen] = useState<ScreenId>('register');
  const [preAuthToken, setPreAuthToken] = useState<JWTToken | null>(null);
  const [authToken, setAuthToken] = useState<JWTToken | null>(null);
  const [customer, setCustomer] = useState<Partial<CustomerProfile> | null>(null);
  const [registrationDraft, setRegistrationDraft] = useState<RegistrationDraft>(
    DEFAULT_REGISTRATION_DRAFT
  );

  // Toast notification state
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ show: true, message });
    toastTimerRef.current = setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 3200);
  }, []);

  const navigateTo = useCallback((screen: ScreenId) => {
    setActiveScreen(screen);
  }, []);

  const updateRegistrationDraft = useCallback(
    (partial: Partial<RegistrationDraft>) => {
      setRegistrationDraft((prev) => ({ ...prev, ...partial }));
    },
    []
  );

  const clearRegistrationDraft = useCallback(() => {
    setRegistrationDraft(DEFAULT_REGISTRATION_DRAFT);
  }, []);

  // Initialize stored tokens
  useEffect(() => {
    const initStorage = async () => {
      try {
        const [storedPreAuth, storedAuth, storedProfile] = await Promise.all([
          v1Storage.getPreAuthToken(),
          v1Storage.getAuthToken(),
          v1Storage.getCustomerProfile(),
        ]);
        if (storedPreAuth) setPreAuthToken(storedPreAuth);
        if (storedAuth) setAuthToken(storedAuth);
        if (storedProfile) setCustomer(storedProfile);
      } catch {}
    };
    initStorage();
  }, []);

  // V1 Register Customer Action
  const registerCustomer = useCallback(
    async (payload: CustomerRegisterReq): Promise<CustomerRegisterRes> => {
      const res = await authApi.register(payload);

      setPreAuthToken(res.preAuthToken);
      setCustomer({
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        middleInitial: payload.middleInitial,
        phoneNumber: payload.phoneNumber,
      });

      showToast(res.statusMessage || 'Registration successful');
      setActiveScreen('mpin_create');
      return res;
    },
    [showToast]
  );

  const value: V1ContextType = {
    activeScreen,
    navigateTo,
    toast,
    showToast,
    preAuthToken,
    authToken,
    customer,
    registrationDraft,
    updateRegistrationDraft,
    clearRegistrationDraft,
    registerCustomer,
  };

  return <V1Context.Provider value={value}>{children}</V1Context.Provider>;
};

export const useV1 = (): V1ContextType => {
  const context = useContext(V1Context);
  if (!context) {
    throw new Error('useV1 must be used within a V1Provider');
  }
  return context;
};
