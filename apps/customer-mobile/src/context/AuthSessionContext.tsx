import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  CustomerRegisterReq,
  CustomerRegisterRes,
  CustomerLoginReq,
  CustomerLoginRes,
  CustomerCreateMpinRes,
  CustomerProfile,
  JWTToken,
} from '../types/api';
import { setUnauthorizedHandler } from '../services/apiClient';
import { authApi } from '../services/authApi';
import { customerApi } from '../services/customerApi';
import { notificationApi } from '../services/notificationApi';
import { customerQueryKeys } from '../query/queryClient';
import { useCustomerProfileQuery } from '../query/useCustomerQueries';
import { v1Storage } from '../utils/storage';
import { isJwtExpired } from '../utils/jwt';
import { useToast } from './ToastContext';
import { useNavigationUi } from './NavigationAndUiContext';
import { useOrderDraft } from './OrderDraftContext';

export type SessionStatus = 'booting' | 'unauthenticated' | 'locked_mpin' | 'authenticated';

export type AuthSessionContextType = {
  readonly sessionStatus: SessionStatus;
  readonly preAuthToken: JWTToken | null;
  readonly authToken: JWTToken | null;
  readonly customer: Partial<CustomerProfile> | null;
  readonly registerCustomer: (payload: CustomerRegisterReq) => Promise<CustomerRegisterRes>;
  readonly loginCustomer: (payload: CustomerLoginReq) => Promise<CustomerLoginRes>;
  readonly createCustomerMpin: (mpin: string) => Promise<CustomerCreateMpinRes>;
  readonly verifyCustomerMpin: (mpin: string) => Promise<void>;
  readonly refetchProfile: () => Promise<void>;
  readonly switchAccount: () => Promise<void>;
  readonly signOutCustomer: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextType | undefined>(undefined);

/**
 * Manages customer authentication tokens, cold-boot JWT expiry checks, centralized 401 handling, and profile state.
 */
export const AuthSessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('booting');
  const [preAuthToken, setPreAuthToken] = useState<JWTToken | null>(null);
  const [authToken, setAuthToken] = useState<JWTToken | null>(null);
  const [customer, setCustomer] = useState<Partial<CustomerProfile> | null>(null);

  const queryClient = useQueryClient();
  const isHandlingUnauthorizedRef = useRef<boolean>(false);

  const { showToast } = useToast();
  const { setActiveScreen, resetNavigationTo, resetNavigationState } = useNavigationUi();
  const { clearOrderDraft } = useOrderDraft();

  const profileQuery = useCustomerProfileQuery(authToken);

  useEffect(() => {
    if (profileQuery.data) {
      setCustomer(profileQuery.data);
    }
  }, [profileQuery.data]);

  const handleUnauthorized = useCallback(async () => {
    if (isHandlingUnauthorizedRef.current) return;
    isHandlingUnauthorizedRef.current = true;
    try {
      await v1Storage.clearAuthToken();
      setAuthToken(null);
      const refresh = await v1Storage.getRefreshToken();
      if (refresh) {
        setSessionStatus('locked_mpin');
        showToast('Session expired. Enter MPIN to resume.');
        resetNavigationTo('mpin_login');
      } else {
        queryClient.clear();
        setCustomer(null);
        setSessionStatus('unauthenticated');
        resetNavigationTo('login');
      }
    } finally {
      isHandlingUnauthorizedRef.current = false;
    }
  }, [queryClient, showToast, resetNavigationTo]);

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
    return () => {
      setUnauthorizedHandler(null);
    };
  }, [handleUnauthorized]);

  useEffect(() => {
    const initStorage = async () => {
      try {
        const [storedPreAuth, storedAuth, storedRefresh, storedProfile] = await Promise.all([
          v1Storage.getPreAuthToken(),
          v1Storage.getAuthToken(),
          v1Storage.getRefreshToken(),
          v1Storage.getCustomerProfile(),
        ]);
        if (storedPreAuth) setPreAuthToken(storedPreAuth);
        if (storedProfile) setCustomer(storedProfile);

        if (storedAuth) {
          if (!isJwtExpired(storedAuth, 30)) {
            setAuthToken(storedAuth);
            setSessionStatus('authenticated');
            resetNavigationTo('home');
          } else {
            await v1Storage.clearAuthToken();
            if (storedRefresh) {
              setSessionStatus('locked_mpin');
              resetNavigationTo('mpin_login');
            } else {
              setSessionStatus('unauthenticated');
            }
          }
        } else if (storedRefresh) {
          setSessionStatus('locked_mpin');
          resetNavigationTo('mpin_login');
        } else {
          setSessionStatus('unauthenticated');
        }
      } catch {
        setSessionStatus('unauthenticated');
      }
    };
    initStorage();
  }, [resetNavigationTo]);

  const refetchProfile = useCallback(async (): Promise<void> => {
    const token = authToken || (await v1Storage.getAuthToken());
    if (!token) return;

    try {
      await queryClient.fetchQuery({
        queryKey: customerQueryKeys.profile(),
        queryFn: async () => {
          const res = await customerApi.getProfile(token);
          return res.customer;
        },
        staleTime: 0,
      });
    } catch {
      // 401 is handled centrally by apiClient unauthorizedHandler
    }
  }, [authToken, queryClient]);

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
    [showToast, setActiveScreen]
  );

  const loginCustomer = useCallback(
    async (payload: CustomerLoginReq): Promise<CustomerLoginRes> => {
      const res = await authApi.login(payload);

      setPreAuthToken(res.preAuthToken);
      setCustomer((prev) => ({
        ...prev,
        email: payload.email.trim().toLowerCase(),
      }));

      showToast(res.statusMessage || 'Credentials verified. Please enter your MPIN.');
      setActiveScreen('mpin_login');
      return res;
    },
    [showToast, setActiveScreen]
  );

  const createCustomerMpin = useCallback(
    async (mpin: string): Promise<CustomerCreateMpinRes> => {
      let activePreAuth = preAuthToken;
      if (!activePreAuth) {
        activePreAuth = await v1Storage.getPreAuthToken();
      }

      if (!activePreAuth) {
        showToast('Session expired. Please log in again.');
        setActiveScreen('login');
        throw new Error('Pre-auth token missing. Please log in again.');
      }

      const res = await authApi.createMpin({
        preAuthToken: activePreAuth,
        mpin: mpin as any,
      });

      setAuthToken(res.authToken);
      setSessionStatus('authenticated');
      if (res.customer) {
        setCustomer(res.customer);
      }
      setPreAuthToken(null);

      showToast(res.statusMessage || 'MPIN created successfully!');
      setActiveScreen('home');
      return res;
    },
    [preAuthToken, showToast, setActiveScreen]
  );

  const verifyCustomerMpin = useCallback(
    async (mpin: string): Promise<void> => {
      let activePreAuth = preAuthToken;
      if (!activePreAuth) {
        activePreAuth = await v1Storage.getPreAuthToken();
      }

      if (activePreAuth) {
        const res = await authApi.verifyMpin({
          preAuthToken: activePreAuth,
          mpin: mpin as any,
        });

        setAuthToken(res.authToken);
        setSessionStatus('authenticated');
        if (res.customer) {
          setCustomer(res.customer);
        }
        setPreAuthToken(null);

        showToast(res.statusMessage || 'Access granted');
        setActiveScreen('home');
        return;
      }

      const storedRefresh = await v1Storage.getRefreshToken();
      if (storedRefresh) {
        const res = await authApi.refreshToken({
          refreshToken: storedRefresh,
          mpin: mpin as any,
        });

        setAuthToken(res.authToken);
        setSessionStatus('authenticated');
        showToast(res.statusMessage || 'Session renewed');
        setActiveScreen('home');
        return;
      }

      showToast('Session expired. Please log in again.');
      setSessionStatus('unauthenticated');
      setActiveScreen('login');
      throw new Error('Please log in again');
    },
    [preAuthToken, showToast, setActiveScreen]
  );

  const resetSessionState = useCallback(async () => {
    if (authToken) {
      try {
        await notificationApi.deleteToken(authToken);
      } catch (e) {
        console.warn('[FCM] Token cleanup warning:', e);
      }
    }
    await v1Storage.clearAllTokens();
    queryClient.clear();
    setPreAuthToken(null);
    setAuthToken(null);
    setCustomer(null);
    setSessionStatus('unauthenticated');
    clearOrderDraft();
    resetNavigationState();
  }, [authToken, queryClient, clearOrderDraft, resetNavigationState]);

  const switchAccount = useCallback(async () => {
    await resetSessionState();
  }, [resetSessionState]);

  const signOutCustomer = useCallback(async () => {
    await resetSessionState();
    showToast('Signed out successfully');
  }, [resetSessionState, showToast]);

  const value = useMemo<AuthSessionContextType>(
    () => ({
      sessionStatus,
      preAuthToken,
      authToken,
      customer,
      registerCustomer,
      loginCustomer,
      createCustomerMpin,
      verifyCustomerMpin,
      refetchProfile,
      switchAccount,
      signOutCustomer,
    }),
    [
      sessionStatus,
      preAuthToken,
      authToken,
      customer,
      registerCustomer,
      loginCustomer,
      createCustomerMpin,
      verifyCustomerMpin,
      refetchProfile,
      switchAccount,
      signOutCustomer,
    ]
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
};

export const useAuthSession = (): AuthSessionContextType => {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error('useAuthSession must be used within an AuthSessionProvider');
  }
  return context;
};
