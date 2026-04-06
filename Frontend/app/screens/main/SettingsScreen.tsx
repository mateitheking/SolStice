import { ScrollView, Switch, Text, View } from 'react-native';
import { AppScreen } from '../../components/AppScreen';
import { GlassCard } from '../../components/GlassCard';
import { MotionView } from '../../components/MotionView';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useAppContext } from '../../providers/AppProvider';
import { useToast } from '../../providers/ToastProvider';

export function SettingsScreen() {
  const { settings, updateSettings } = useAppContext();
  const { showToast } = useToast();

  const toggleTheme = async () => {
    await updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
    showToast(`Theme: ${settings.theme === 'dark' ? 'LIGHT' : 'DARK'}`, 'info');
  };

  const toggleNotifications = async () => {
    const next = !settings.notificationsEnabled;
    await updateSettings({ notificationsEnabled: next });
    showToast(next ? 'Notifications enabled' : 'Notifications disabled', 'info');
  };

  const toggleApiMode = async () => {
    const next = settings.apiMode === 'mock' ? 'real' : 'mock';
    await updateSettings({ apiMode: next });
    showToast(`API mode: ${next.toUpperCase()}`, 'info');
  };

  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <MotionView delay={40}>
          <ScreenHeader
            eyebrow="preferences"
            title="Settings"
            subtitle="Тема, уведомления и режим API для разработки."
          />
        </MotionView>

        <MotionView delay={110}>
          <GlassCard>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-zinc-900 font-semibold">Theme</Text>
                <Text className="text-zinc-600">Dark / Light</Text>
              </View>
              <Switch value={settings.theme === 'dark'} onValueChange={toggleTheme} />
            </View>
          </GlassCard>
        </MotionView>

        <MotionView delay={160}>
          <GlassCard>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-zinc-900 font-semibold">Notifications</Text>
                <Text className="text-zinc-600">Trade updates and alerts</Text>
              </View>
              <Switch value={settings.notificationsEnabled} onValueChange={toggleNotifications} />
            </View>
          </GlassCard>
        </MotionView>

        <MotionView delay={210}>
          <GlassCard>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-zinc-900 font-semibold">Dev Mode</Text>
                <Text className="text-zinc-600">{settings.apiMode === 'mock' ? 'Using Mock API' : 'Using Real API'}</Text>
              </View>
              <Switch value={settings.apiMode === 'real'} onValueChange={toggleApiMode} />
            </View>
          </GlassCard>
        </MotionView>
      </ScrollView>
    </AppScreen>
  );
}
