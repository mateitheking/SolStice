import { ActivityIndicator, Text, View } from 'react-native';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { useAppContext } from '../providers/AppProvider';

export function RootNavigator() {
  const { user, appReady } = useAppContext();

  if (!appReady) {
    return (
      <View className="flex-1 items-center justify-center bg-[#070B14]">
        <ActivityIndicator size="large" color="#67E8F9" />
        <Text className="mt-3 text-slate-300">Preparing app...</Text>
      </View>
    );
  }

  return user ? <MainTabs /> : <AuthStack />;
}
