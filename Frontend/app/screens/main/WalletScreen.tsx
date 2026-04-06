import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { AppScreen } from '../../components/AppScreen';
import { GlassCard } from '../../components/GlassCard';
import { MotionView } from '../../components/MotionView';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useAppContext } from '../../providers/AppProvider';
import { useToast } from '../../providers/ToastProvider';

export function WalletScreen() {
  const { wallet, connectWallet, disconnectWallet, refreshWallet } = useAppContext();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    await connectWallet();
    showToast('Wallet connected', 'success');
    setLoading(false);
  };

  const handleDisconnect = async () => {
    setLoading(true);
    await disconnectWallet();
    showToast('Wallet disconnected', 'info');
    setLoading(false);
  };

  const handleRefresh = async () => {
    setLoading(true);
    await refreshWallet();
    setLoading(false);
  };

  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <MotionView delay={40}>
          <ScreenHeader
            eyebrow="wallet"
            title="Phantom Wallet"
            subtitle="Devnet подключение с обновлением баланса и быстрым disconnect."
          />
        </MotionView>

        <MotionView delay={110}>
          <GlassCard>
            <Text className="text-zinc-600 mb-1">Connection Status</Text>
            <Text className={`text-xl font-semibold ${wallet.connected ? 'text-emerald-600' : 'text-rose-600'}`}>
              {wallet.connected ? 'Connected' : 'Disconnected'}
            </Text>
          </GlassCard>
        </MotionView>

        <MotionView delay={160}>
          <GlassCard>
            <Text className="text-zinc-600 mb-1">Network</Text>
            <Text className="text-lg font-semibold text-zinc-900">{wallet.network}</Text>
          </GlassCard>
        </MotionView>

        <MotionView delay={210}>
          <GlassCard>
            <Text className="text-zinc-600 mb-1">Address</Text>
            <Text className="text-zinc-900">{wallet.address ?? 'Not connected'}</Text>
            <Text className="text-zinc-600 mt-3 mb-1">Balance</Text>
            <Text className="text-2xl font-bold text-zinc-900">{wallet.balance.toFixed(4)} SOL</Text>
          </GlassCard>
        </MotionView>

        <MotionView delay={260}>
          <View className="gap-3 mt-1">
            {wallet.connected ? (
              <>
                <AppButton label="Refresh Balance" onPress={handleRefresh} loading={loading} />
                <AppButton label="Disconnect" onPress={handleDisconnect} variant="danger" loading={loading} />
              </>
            ) : (
              <AppButton label="Connect Phantom" onPress={handleConnect} loading={loading} />
            )}
          </View>
        </MotionView>

        {loading ? <ActivityIndicator className="mt-4" color="#0F172A" /> : null}
      </ScrollView>
    </AppScreen>
  );
}
