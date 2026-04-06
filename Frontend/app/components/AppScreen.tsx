import { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../providers/AppProvider';

type AppScreenProps = PropsWithChildren<{
  padded?: boolean;
}>;

export function AppScreen({ children, padded = true }: AppScreenProps) {
  const {
    settings: { theme },
  } = useAppContext();

  return (
    <SafeAreaView className={`flex-1 ${theme === 'dark' ? 'bg-[#141414]' : 'bg-[#ECECEC]'}`}>
      <View className={`flex-1 ${padded ? 'px-5 py-4' : ''}`}>{children}</View>
    </SafeAreaView>
  );
}
