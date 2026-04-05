import { ScrollView, Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { AppScreen } from '../../components/AppScreen';
import { GlassCard } from '../../components/GlassCard';
import { MotionView } from '../../components/MotionView';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useAppContext } from '../../providers/AppProvider';
import { useToast } from '../../providers/ToastProvider';

export function ProfileScreen() {
  const { user, wallet, logout, disconnectWallet } = useAppContext();
  const { showToast } = useToast();

  const handleLogout = async () => {
    await logout();
    showToast('Logged out', 'info');
  };

  const handleDisconnect = async () => {
    await disconnectWallet();
    showToast('Wallet disconnected', 'info');
  };

  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <MotionView delay={40}>
          <ScreenHeader
            eyebrow="account"
            title="Profile"
            subtitle="Данные аккаунта и управление подключенным кошельком."
          />
        </MotionView>

        <MotionView delay={110}>
          <GlassCard>
            <Text className="text-zinc-600 mb-1">Email</Text>
            <Text className="text-zinc-900 text-lg font-semibold">{user?.email}</Text>
          </GlassCard>
        </MotionView>

        <MotionView delay={160}>
          <GlassCard>
            <Text className="text-zinc-600 mb-1">Wallet Address</Text>
            <Text className="text-zinc-900">{wallet.address ?? 'Not connected'}</Text>
            <Text className="text-zinc-600 mt-3 mb-1">Balance</Text>
            <Text className="text-zinc-900 text-2xl font-bold">{wallet.balance.toFixed(4)} SOL</Text>
          </GlassCard>
        </MotionView>

        <MotionView delay={220}>
          <View className="gap-3 mt-2">
            <AppButton label="Disconnect Wallet" onPress={handleDisconnect} variant="secondary" />
            <AppButton label="Logout" onPress={handleLogout} variant="danger" />
          </View>
        </MotionView>
      </ScrollView>
    </AppScreen>
  );
}
