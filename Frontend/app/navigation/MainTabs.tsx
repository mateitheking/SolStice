import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AILogScreen } from '../screens/main/AILogScreen';
import { DashboardScreen } from '../screens/main/DashboardScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { StrategyScreen } from '../screens/main/StrategyScreen';

export type MainTabParamList = {
  HOME: undefined;
  TRADE: undefined;
  'AI ANALYTICS': undefined;
  PROFILE: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0D111E',
          borderTopColor: '#1E293B',
          height: 78,
          paddingBottom: 8,
          paddingTop: 12,
        },
        tabBarActiveTintColor: '#67E8F9',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
            HOME: 'home-outline',
            TRADE: 'swap-horizontal-outline',
            'AI ANALYTICS': 'pulse-outline',
            PROFILE: 'person-circle-outline',
          };

          return <Ionicons name={iconMap[route.name as keyof MainTabParamList]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HOME" component={DashboardScreen} />
      <Tab.Screen name="TRADE" component={StrategyScreen} />
      <Tab.Screen name="AI ANALYTICS" component={AILogScreen} />
      <Tab.Screen name="PROFILE" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
