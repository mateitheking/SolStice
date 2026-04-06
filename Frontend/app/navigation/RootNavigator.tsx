import { ActivityIndicator, Text, View } from 'react-native';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { useAppContext } from '../providers/AppProvider';

export function RootNavigator() {
  const {
    user,
    appReady,
    settings: { theme },
  } = useAppContext();

  if (!appReady) {
    return (
      <View className={`flex-1 items-center justify-center ${theme === 'dark' ? 'bg-zinc-950' : 'bg-slate-100'}`}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text className={`mt-3 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>Preparing app...</Text>
      </View>
    );
  }

  return user ? <MainTabs /> : <AuthStack />;
}
