import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { AuthBrandHeader } from './AuthBrandHeader';

interface AuthSheetLayoutProps {
  children: ReactNode;
  onBack?: () => void;
  sheetStyle?: StyleProp<ViewStyle>;
}

export function AuthSheetLayout({ children, onBack, sheetStyle }: AuthSheetLayoutProps) {
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AuthBrandHeader onBack={onBack} />
        <View style={[styles.sheet, sheetStyle]}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#2563eb' },
  content: { flexGrow: 1, backgroundColor: '#2563eb' },
  sheet: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 16, paddingBottom: 28 },
});
