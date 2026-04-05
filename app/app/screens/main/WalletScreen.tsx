import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { AppScreen } from '../../components/AppScreen';
import { GlassCard } from '../../components/GlassCard';
import { MotionView } from '../../components/MotionView';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useAppContext } from '../../providers/AppProvider';
import { useToast } from '../../providers/ToastProvider';

const truncateAddress = (addr: string) =>
  addr.length > 16 ? `${addr.slice(0, 8)} ... ${addr.slice(-8)}` : addr;

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
    showToast('Balance updated', 'success');
    setLoading(false);
  };

  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        <MotionView delay={40}>
          <ScreenHeader
            eyebrow="wallet"
            title="Phantom Wallet"
            subtitle="Phantom on web, demo devnet wallet fallback on mobile, with live balance refresh."
          />
        </MotionView>

        {/* Status card */}
        <MotionView delay={110}>
          <GlassCard accent={wallet.connected ? 'emerald' : 'none'}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '500', marginBottom: 4 }}>
                  Connection
                </Text>
                <Text style={{ fontSize: 18, fontWeight: '700', color: wallet.connected ? '#10B981' : '#6B7280' }}>
                  {wallet.connected ? 'Connected' : 'Not Connected'}
                </Text>
              </View>
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: wallet.connected ? '#ECFDF5' : '#F3F4F6',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <View style={{
                  width: 16, height: 16, borderRadius: 8,
                  backgroundColor: wallet.connected ? '#10B981' : '#D1D5DB',
                }} />
              </View>
            </View>
          </GlassCard>
        </MotionView>

        {/* Network */}
        <MotionView delay={155}>
          <GlassCard>
            <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '500', marginBottom: 4 }}>Network</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ backgroundColor: '#EFF6FF', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#3B82F6' }}>{wallet.network}</Text>
              </View>
              <Text style={{ fontSize: 12, color: '#9CA3AF' }}>Solana testnet</Text>
            </View>
          </GlassCard>
        </MotionView>

        {/* Address + Balance */}
        <MotionView delay={200}>
          <GlassCard>
            <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '500', marginBottom: 6 }}>Wallet Address</Text>
            <Text style={{
              fontSize: 13,
              color: wallet.connected ? '#111111' : '#9CA3AF',
              fontFamily: 'monospace',
              letterSpacing: 0.5,
              marginBottom: 16,
            }}>
              {wallet.address ? truncateAddress(wallet.address) : '— not connected —'}
            </Text>
            <View style={{ height: 1, backgroundColor: '#F3F4F6', marginBottom: 16 }} />
            <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '500', marginBottom: 4 }}>Balance</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
              <Text style={{ fontSize: 34, fontWeight: '800', color: '#111111', letterSpacing: -1 }}>
                {wallet.balance.toFixed(4)}
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#9CA3AF', marginBottom: 4 }}>SOL</Text>
            </View>
          </GlassCard>
        </MotionView>

        {/* Actions */}
        <MotionView delay={250}>
          <View style={{ gap: 10, marginTop: 4 }}>
            {wallet.connected ? (
              <>
                <AppButton label="Refresh Balance" onPress={handleRefresh} loading={loading} />
                <AppButton label="Disconnect Wallet" onPress={handleDisconnect} variant="danger" loading={loading} />
              </>
            ) : (
              <AppButton label="Connect Phantom" onPress={handleConnect} loading={loading} />
            )}
          </View>
        </MotionView>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <ActivityIndicator color="#10B981" />
          </View>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}
