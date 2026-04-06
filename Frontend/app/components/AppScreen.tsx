import { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type AppScreenProps = PropsWithChildren<{
  padded?: boolean;
}>;

export function AppScreen({ children, padded = true }: AppScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-[#070B14]">
      <View className={`flex-1 ${padded ? 'px-5 py-4' : ''}`}>{children}</View>
    </SafeAreaView>
  );
}
