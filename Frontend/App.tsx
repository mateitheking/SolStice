import './global.css';
import 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './app/navigation/RootNavigator';
import { AppProvider, useAppContext } from './app/providers/AppProvider';
import { ToastProvider } from './app/providers/ToastProvider';

function AppShell() {
  const {
    settings: { theme },
  } = useAppContext();

  const navigationTheme = useMemo<Theme>(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: theme === 'dark' ? '#141414' : '#ECECEC',
        card: theme === 'dark' ? '#1D1D1D' : '#F7F7F7',
        text: theme === 'dark' ? '#F4F4F5' : '#111111',
        border: theme === 'dark' ? '#3F3F46' : '#B8B8B8',
        primary: '#111111',
      },
    }),
    [theme]
  );

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppProvider>
            <ToastProvider>
              <AppShell />
            </ToastProvider>
          </AppProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
