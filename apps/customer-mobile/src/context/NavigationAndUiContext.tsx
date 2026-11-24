import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useMemo,
  ReactNode,
} from 'react';
import { TransactionFilter } from '../types/api';

export type ScreenId =
  | 'register'
  | 'login'
  | 'forgot_password'
  | 'mpin_create'
  | 'mpin_login'
  | 'mpin_recovery'
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

export type NavigationStackEntry = {
  readonly screen: ScreenId;
  readonly orderId?: string | null;
  readonly ticketCode?: string | null;
  readonly filter?: TransactionFilter;
};

const TOP_LEVEL_SCREENS: readonly ScreenId[] = [
  'home',
  'transactions',
  'notifications',
  'profile',
];

export type NavigationAndUiContextType = {
  readonly activeScreen: ScreenId;
  readonly setActiveScreen: (screen: ScreenId) => void;
  readonly navigateTo: (
    screen: ScreenId,
    params?: {
      orderId?: string | null;
      ticketCode?: string | null;
      filter?: TransactionFilter;
    }
  ) => void;
  readonly goBack: () => void;
  readonly resetNavigationTo: (screen: ScreenId) => void;
  readonly resetNavigationState: () => void;
  readonly transactionFilter: TransactionFilter;
  readonly setTransactionFilter: (filter: TransactionFilter) => void;
  readonly selectedOrderId: string | null;
  readonly setSelectedOrderId: (id: string | null) => void;
  readonly selectedOrderTicketCode: string | null;
  readonly setSelectedOrderTicketCode: (code: string | null) => void;
  readonly isPodModalOpen: boolean;
  readonly openPodModal: () => void;
  readonly closePodModal: () => void;
};

const NavigationAndUiContext = createContext<NavigationAndUiContextType | undefined>(undefined);

/**
 * Provides screen routing stack, active order selection, transaction filter, and global Proof-of-Delivery modal state.
 */
export const NavigationAndUiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('login');
  const [navigationHistory, setNavigationHistory] = useState<readonly NavigationStackEntry[]>([]);
  const navigationHistoryRef = useRef<readonly NavigationStackEntry[]>(navigationHistory);
  navigationHistoryRef.current = navigationHistory;

  const [transactionFilter, setTransactionFilter] = useState<TransactionFilter>('ALL');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrderTicketCode, setSelectedOrderTicketCode] = useState<string | null>(null);
  const [isPodModalOpen, setIsPodModalOpen] = useState<boolean>(false);

  const activeScreenRef = useRef<ScreenId>(activeScreen);
  activeScreenRef.current = activeScreen;

  const selectedOrderIdRef = useRef<string | null>(selectedOrderId);
  selectedOrderIdRef.current = selectedOrderId;

  const selectedOrderTicketCodeRef = useRef<string | null>(selectedOrderTicketCode);
  selectedOrderTicketCodeRef.current = selectedOrderTicketCode;

  const transactionFilterRef = useRef<TransactionFilter>(transactionFilter);
  transactionFilterRef.current = transactionFilter;

  const navigateTo = useCallback(
    (
      screen: ScreenId,
      params?: {
        orderId?: string | null;
        ticketCode?: string | null;
        filter?: TransactionFilter;
      }
    ) => {
      const currentScreen = activeScreenRef.current;
      const currentOrderId = selectedOrderIdRef.current;
      const currentTicketCode = selectedOrderTicketCodeRef.current;
      const currentFilter = transactionFilterRef.current;

      if (screen === currentScreen) {
        if (params?.orderId !== undefined) {
          setSelectedOrderId(params.orderId);
        }
        if (params?.ticketCode !== undefined) {
          setSelectedOrderTicketCode(params.ticketCode);
        }
        if (params?.filter !== undefined) {
          setTransactionFilter(params.filter);
        }
        return;
      }

      if (TOP_LEVEL_SCREENS.includes(screen)) {
        setNavigationHistory([]);
      } else {
        setNavigationHistory((prev) => [
          ...prev,
          {
            screen: currentScreen,
            orderId: currentOrderId,
            ticketCode: currentTicketCode,
            filter: currentFilter,
          },
        ]);
      }

      setActiveScreen(screen);
      if (params?.orderId !== undefined) {
        setSelectedOrderId(params.orderId);
      }
      if (params?.ticketCode !== undefined) {
        setSelectedOrderTicketCode(params.ticketCode);
      }
      if (params?.filter !== undefined) {
        setTransactionFilter(params.filter);
      }
    },
    []
  );

  const goBack = useCallback(() => {
    const history = navigationHistoryRef.current;
    if (history.length === 0) {
      setActiveScreen('home');
      setSelectedOrderId(null);
      setSelectedOrderTicketCode(null);
      return;
    }

    const nextHistory = [...history];
    const target = nextHistory.pop()!;

    setNavigationHistory(nextHistory);
    setActiveScreen(target.screen);
    if (target.orderId !== undefined) {
      setSelectedOrderId(target.orderId);
    }
    if (target.ticketCode !== undefined) {
      setSelectedOrderTicketCode(target.ticketCode);
    }
    if (target.filter !== undefined) {
      setTransactionFilter(target.filter);
    }
  }, []);

  const resetNavigationTo = useCallback((screen: ScreenId) => {
    setNavigationHistory([]);
    setActiveScreen(screen);
  }, []);

  const resetNavigationState = useCallback(() => {
    setSelectedOrderId(null);
    setSelectedOrderTicketCode(null);
    setNavigationHistory([]);
    setTransactionFilter('ALL');
    setIsPodModalOpen(false);
    setActiveScreen('login');
  }, []);

  const openPodModal = useCallback(() => setIsPodModalOpen(true), []);
  const closePodModal = useCallback(() => setIsPodModalOpen(false), []);

  const value = useMemo<NavigationAndUiContextType>(
    () => ({
      activeScreen,
      setActiveScreen,
      navigateTo,
      goBack,
      resetNavigationTo,
      resetNavigationState,
      transactionFilter,
      setTransactionFilter,
      selectedOrderId,
      setSelectedOrderId,
      selectedOrderTicketCode,
      setSelectedOrderTicketCode,
      isPodModalOpen,
      openPodModal,
      closePodModal,
    }),
    [
      activeScreen,
      navigateTo,
      goBack,
      resetNavigationTo,
      resetNavigationState,
      transactionFilter,
      selectedOrderId,
      selectedOrderTicketCode,
      isPodModalOpen,
      openPodModal,
      closePodModal,
    ]
  );

  return (
    <NavigationAndUiContext.Provider value={value}>{children}</NavigationAndUiContext.Provider>
  );
};

export const useNavigationUi = (): NavigationAndUiContextType => {
  const context = useContext(NavigationAndUiContext);
  if (!context) {
    throw new Error('useNavigationUi must be used within a NavigationAndUiProvider');
  }
  return context;
};
