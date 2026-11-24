import { View } from 'react-native';
import { CheckIcon } from './Icons';

export function SuccessBadge() {
  return (
    <View aria-hidden className="h-24 w-24 items-center justify-center rounded-full bg-green-100">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-green-600">
        <CheckIcon color="#fff" size={32} />
      </View>
    </View>
  );
}
