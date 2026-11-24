import { useRouter } from 'expo-router';
import { Keyboard } from 'react-native';
import { PasswordRecoveryScreen } from '../components/screens/PasswordRecoveryScreen';
import { useNavigationUi } from '../context/NavigationAndUiContext';

export default function ForgotPasswordRoute() {
  const router = useRouter();
  const { navigateTo } = useNavigationUi();

  return (
    <PasswordRecoveryScreen
      onSignIn={() => {
        Keyboard.dismiss();
        navigateTo('login');
        router.dismissTo('/');
      }}
    />
  );
}
