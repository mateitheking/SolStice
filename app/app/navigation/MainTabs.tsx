import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AILogScreen } from '../screens/main/AILogScreen';
import { DashboardScreen } from '../screens/main/DashboardScreen';
import { NewsScreen } from '../screens/main/NewsScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { SettingsScreen } from '../screens/main/SettingsScreen';
import { StrategyScreen } from '../screens/main/StrategyScreen';
import { WalletScreen } from '../screens/main/WalletScreen';

export type MainTabParamList = {
  Dashboard: undefined;
  Wallet: undefined;
  Strategy: undefined;
  News: undefined;
  'AI Log': undefined;
  Profile: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#F6F6F6',
          borderTopColor: '#B8B8B8',
          height: 72,
          paddingBottom: 8,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#111111',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
            Dashboard: 'stats-chart-outline',
            Wallet: 'wallet-outline',
            Strategy: 'rocket-outline',
            News: 'newspaper-outline',
            'AI Log': 'analytics-outline',
            Profile: 'person-circle-outline',
            Settings: 'settings-outline',
          };

          return <Ionicons name={iconMap[route.name as keyof MainTabParamList]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Wallet" component={WalletScreen} />
      <Tab.Screen name="Strategy" component={StrategyScreen} />
      <Tab.Screen name="News" component={NewsScreen} />
      <Tab.Screen name="AI Log" component={AILogScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
