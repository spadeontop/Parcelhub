import React from 'react';
import { View } from 'react-native';
import { useApp } from '../context/AppContext';
import { HomeScreen } from '../components/screens/HomeScreen';
import { CreateOrderScreen } from '../components/screens/CreateOrderScreen';
import { ConfirmOrderScreen } from '../components/screens/ConfirmOrderScreen';
import { PaymentVerificationScreen } from '../components/screens/PaymentVerificationScreen';
import { QrScreen } from '../components/screens/QrScreen';
import { OrderDetailsScreen } from '../components/screens/OrderDetailsScreen';
import { TransactionsScreen } from '../components/screens/TransactionsScreen';
import { LoginScreen } from '../components/screens/LoginScreen';
import { RegisterScreen } from '../components/screens/RegisterScreen';
import { MpinLoginScreen } from '../components/screens/MpinLoginScreen';
import { MpinCreateScreen } from '../components/screens/MpinCreateScreen';
import { ProfileScreen } from '../components/screens/ProfileScreen';
import { FaqScreen } from '../components/screens/FaqScreen';

export default function IndexPage() {
  const { activeScreen } = useApp();

  switch (activeScreen) {
    case 'home':
      return <HomeScreen />;
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
    case 'login':
      return <LoginScreen />;
    case 'register':
      return <RegisterScreen />;
    case 'mpin_login':
      return <MpinLoginScreen />;
    case 'mpin_create':
      return <MpinCreateScreen />;
    case 'profile':
      return <ProfileScreen />;
    case 'faq':
      return <FaqScreen />;
    default:
      return <HomeScreen />;
  }
}
