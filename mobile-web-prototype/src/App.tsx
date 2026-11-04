import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { StudioControlBar } from './components/layout/StudioControlBar';
import { DeviceFrame } from './components/layout/DeviceFrame';
import { HomeScreen } from './components/screens/HomeScreen';
import { CreateOrderScreen } from './components/screens/CreateOrderScreen';
import { ConfirmOrderScreen } from './components/screens/ConfirmOrderScreen';
import { PaymentVerificationScreen } from './components/screens/PaymentVerificationScreen';
import { QrScreen } from './components/screens/QrScreen';
import { OrderDetailsScreen } from './components/screens/OrderDetailsScreen';
import { TransactionsScreen } from './components/screens/TransactionsScreen';
import { NotificationsScreen } from './components/screens/NotificationsScreen';
import { StaffTerminalScreen } from './components/screens/StaffTerminalScreen';
import { LoginScreen } from './components/screens/LoginScreen';
import { RegisterScreen } from './components/screens/RegisterScreen';
import { MpinLoginScreen } from './components/screens/MpinLoginScreen';
import { MpinCreateScreen } from './components/screens/MpinCreateScreen';
import { FaqScreen } from './components/screens/FaqScreen';
import { MpinModal } from './components/modals/MpinModal';
import { ProofOfDeliveryModal } from './components/modals/ProofOfDeliveryModal';
import { EscrowPolicyModal } from './components/modals/EscrowPolicyModal';
import { NotificationsModal } from './components/modals/NotificationsModal';
import { Toast } from './components/common/Toast';

const ScreenContent: React.FC = () => {
  const { activeScreen, navigateTo } = useApp();

  switch (activeScreen) {
    case 'home':
      return <HomeScreen />;
    case 'faq':
      return <FaqScreen onBack={() => navigateTo('home')} />;
    case 'create_order':
      return <CreateOrderScreen />;
    case 'confirm_order':
      return <ConfirmOrderScreen />;
    case 'payment_verification':
      return <PaymentVerificationScreen />;
    case 'qr_screen':
      return <QrScreen />;
    case 'order_details':
      return <OrderDetailsScreen />;
    case 'transactions':
      return <TransactionsScreen />;
    case 'staff_ui':
      return <StaffTerminalScreen />;
    case 'login':
      return <LoginScreen />;
    case 'register':
      return <RegisterScreen />;
    case 'mpin_login':
      return <MpinLoginScreen />;
    case 'mpin_create':
      return <MpinCreateScreen />;
    default:
      return <HomeScreen />;
  }
};

const AppMain: React.FC = () => {
  const { toast } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 font-sans antialiased">
      {/* Top Review & Studio Control Bar */}
      <StudioControlBar />

      {/* Mobile Device Mockup / Fullscreen Frame */}
      <DeviceFrame>
        <ScreenContent />
      </DeviceFrame>

      {/* Global Interactive Modals & Drawers */}
      <MpinModal />
      <ProofOfDeliveryModal />
      <EscrowPolicyModal />
      <NotificationsModal />

      {/* Global Animated Toast Notification Pill */}
      <Toast isOpen={toast.show} message={toast.message} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppMain />
    </AppProvider>
  );
};

export default App;
