import type { ReactNode } from 'react';
import { Image } from 'expo-image';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BackButton } from '../common/BackButton';

interface PasswordRecoveryLayoutProps {
  children: ReactNode;
  onBack?: () => void;
}

export function PasswordRecoveryLayout({ children, onBack }: PasswordRecoveryLayoutProps) {
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          {onBack && (
            <BackButton
              onPress={onBack}
              style={styles.back}
              icon={
                <>
                  <Image
                    source={require('../../../assets/password-recovery/back-background.svg')}
                    style={StyleSheet.absoluteFill}
                  />
                  <Image
                    source={require('../../../assets/password-recovery/back-arrow.svg')}
                    style={styles.backArrow}
                  />
                </>
              }
            />
          )}
          <View style={styles.logo} aria-hidden>
            <Image
              source={require('../../../assets/password-recovery/logo-background.svg')}
              style={styles.logoBackground}
            />
            <Image
              source={require('../../../assets/password-recovery/logo-brackets.svg')}
              style={styles.logoBrackets}
            />
            <Image
              source={require('../../../assets/password-recovery/logo-notch.svg')}
              style={styles.logoTopNotch}
            />
            <Image
              source={require('../../../assets/password-recovery/logo-notch.svg')}
              style={styles.logoBottomNotch}
            />
          </View>
          <Text style={styles.brand}>ParcelHub</Text>
          <Text style={styles.subtitle}>Customer Mobile Portal</Text>
        </View>
        <View style={styles.sheetBackground}>
          <View style={styles.sheet}>{children}</View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#09090b' },
  content: { flexGrow: 1 },
  header: {
    alignItems: 'center',
    backgroundColor: '#1d5ce6',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: 204,
    paddingTop: 68,
  },
  back: { position: 'absolute', left: 20, top: 38, width: 36, height: 36 },
  backArrow: { width: 11.75, height: 10.75 },
  logo: { width: 48, height: 48, marginBottom: 8 },
  logoBackground: { width: 48, height: 48 },
  logoBrackets: { position: 'absolute', width: 29.5, height: 29.5, left: 9.25, top: 9.25 },
  logoTopNotch: { position: 'absolute', width: 4, height: 8, left: 24, top: 8 },
  logoBottomNotch: { position: 'absolute', width: 4, height: 8, left: 20, top: 32 },
  brand: {
    color: '#fff',
    fontFamily: 'RecoveryInter-Bold',
    fontSize: 22,
    lineHeight: 27,
    includeFontPadding: false,
  },
  subtitle: {
    color: '#dbeafe',
    fontFamily: 'RecoveryInter-Regular',
    fontSize: 12.5,
    lineHeight: 15,
    marginTop: 2,
    includeFontPadding: false,
  },
  sheetBackground: { flex: 1, backgroundColor: '#1d5ce6' },
  sheet: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 28 },
});
