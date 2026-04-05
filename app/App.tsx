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
  const navigationTheme = useMemo<Theme>(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: '#ECECEC',
        card: '#F7F7F7',
        text: '#111111',
        border: '#D4D4D8',
        primary: '#111111',
      },
    }),
    []
  );

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={'dark'} />
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
