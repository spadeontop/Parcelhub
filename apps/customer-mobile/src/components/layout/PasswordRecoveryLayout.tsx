import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { AuthBrandHeader } from './AuthBrandHeader';

interface PasswordRecoveryLayoutProps {
  children: ReactNode;
  onBack?: () => void;
}

export function PasswordRecoveryLayout({ children, onBack }: PasswordRecoveryLayoutProps) {
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AuthBrandHeader onBack={onBack} />
        <View style={styles.sheet}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#2563eb' },
  content: { flexGrow: 1, backgroundColor: '#2563eb' },
  sheet: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 28 },
});
