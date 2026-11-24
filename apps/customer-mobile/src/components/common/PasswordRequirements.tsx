import { Text, View } from 'react-native';
import { getPasswordRequirements } from '../../utils/authValidation';

export function PasswordRequirements({ password }: { password: string }) {
  if (!password) return null;

  const requirements = getPasswordRequirements(password);
  const items = [
    { label: '8+ chars', met: requirements.hasMinLength },
    { label: 'Uppercase', met: requirements.hasUppercase },
    { label: 'Lowercase', met: requirements.hasLowercase },
    { label: 'Number', met: requirements.hasNumber },
    { label: 'Symbol', met: requirements.hasSymbol },
  ];

  return (
    <View className="bg-slate-50 border border-slate-100 rounded-[10px] p-2.5 flex-row flex-wrap gap-x-3 gap-y-1 mb-2">
      {items.map(({ label, met }) => (
        <Text
          key={label}
          className={`text-[10px] font-semibold ${met ? 'text-[#059669]' : 'text-slate-400'}`}
        >
          {met ? '✓' : '•'} {label}
        </Text>
      ))}
    </View>
  );
}
