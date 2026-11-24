import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { Keyboard } from 'react-native';
import { PasswordRecoveryScreen } from '../components/screens/PasswordRecoveryScreen';
import { useNavigationUi } from '../context/NavigationAndUiContext';

const fonts = {
  'RecoveryInter-Regular': require('../../assets/password-recovery/Inter-Regular.ttf'),
  'RecoveryInter-Bold': require('../../assets/password-recovery/Inter-Bold.ttf'),
};

export default function ForgotPasswordRoute() {
  const router = useRouter();
  const { navigateTo } = useNavigationUi();
  const [loaded, error] = useFonts(fonts);

  if (!loaded && !error) return null;

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
