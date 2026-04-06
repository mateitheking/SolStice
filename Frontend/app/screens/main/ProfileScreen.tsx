import { Ionicons } from '@expo/vector-icons';
import { Dimensions, Platform, ScrollView, Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { AppScreen } from '../../components/AppScreen';
import { GlassCard } from '../../components/GlassCard';
import { MotionView } from '../../components/MotionView';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useDashboard } from '../../hooks/useDashboard';
import { useDecisions } from '../../hooks/useDecisions';
import { useAppContext } from '../../providers/AppProvider';
import { useToast } from '../../providers/ToastProvider';

const formatAddress = (address: string | null) => {
  if (!address) return 'Not connected';
  return address.length > 18 ? `${address.slice(0, 8)}...${address.slice(-8)}` : address;
};

export function ProfileScreen() {
  const { user, wallet, logout, disconnectWallet } = useAppContext();
  const { data: dashboard } = useDashboard();
  const { data: decisions } = useDecisions();
  const { showToast } = useToast();

  const totalTrades = dashboard?.tradesCount ?? 0;
  const profitLoss = dashboard?.profitLoss ?? 0;
  const lastActivity = decisions?.[0]?.timestamp
    ? new Date(decisions[0].timestamp).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'No activity yet';

  const avatarLetter = (user?.email?.[0] ?? 'A').toUpperCase();
  const width = Dimensions.get('window').width;
  const isDesktop = Platform.OS === 'web' && width >= 1024;

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
      <View style={{ flex: 1 }}>
        <View style={{ position: 'absolute', top: -90, right: -70, width: 220, height: 220, borderRadius: 999, backgroundColor: '#0EA5E922' }} />
        <View style={{ position: 'absolute', bottom: 20, left: -80, width: 200, height: 200, borderRadius: 999, backgroundColor: '#2563EB22' }} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <View
            style={{
              width: '100%',
              maxWidth: isDesktop ? 1120 : 760,
              alignSelf: 'center',
            }}
          >
            <MotionView delay={40}>
              <ScreenHeader eyebrow="profile" title="Account Profile" subtitle="Identity, wallet details, and performance metrics." />
            </MotionView>

            <MotionView delay={90}>
              <GlassCard className="mb-4" accent="blue">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={{ width: 64, height: 64, borderRadius: 999, backgroundColor: '#1E3A8A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#60A5FA' }}>
                    <Text style={{ color: '#DBEAFE', fontSize: 28, fontWeight: '900' }}>{avatarLetter}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#F8FAFC', fontSize: 20, fontWeight: '900', marginBottom: 2 }}>
                      {user?.isGuest ? 'Guest Investor' : 'AI Trading Member'}
                    </Text>
                    <Text style={{ color: '#94A3B8' }}>{user?.email ?? 'No email found'}</Text>
                  </View>
                </View>
              </GlassCard>
            </MotionView>

            <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 14, alignItems: 'stretch' }}>
              <View style={{ flex: 1 }}>
                <MotionView delay={130}>
                  <GlassCard className="mb-4">
                    <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '700', marginBottom: 10, letterSpacing: 1 }}>WALLET INFO</Text>
                    <View style={{ marginBottom: 10 }}>
                      <Text style={{ color: '#94A3B8', fontSize: 12 }}>Address</Text>
                      <Text style={{ color: '#E2E8F0', fontFamily: 'monospace', fontSize: 14, marginTop: 2 }}>
                        {formatAddress(wallet.address)}
                      </Text>
                    </View>
                    <View style={{ height: 1, backgroundColor: '#334155', marginBottom: 10 }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <View>
                        <Text style={{ color: '#94A3B8', fontSize: 12 }}>Connection</Text>
                        <Text style={{ color: wallet.connected ? '#22C55E' : '#F59E0B', fontWeight: '800' }}>
                          {wallet.connected ? 'CONNECTED' : 'DISCONNECTED'}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: '#94A3B8', fontSize: 12 }}>Balance</Text>
                        <Text style={{ color: '#F8FAFC', fontWeight: '900', fontSize: 24 }}>{wallet.balance.toFixed(4)} SOL</Text>
                      </View>
                    </View>
                  </GlassCard>
                </MotionView>
              </View>

              <View style={{ flex: 1 }}>
                <MotionView delay={170}>
                  <GlassCard className="mb-4" accent="emerald">
                    <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '700', marginBottom: 10, letterSpacing: 1 }}>STATS</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ flex: 1, borderRadius: 14, backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B', padding: 12 }}>
                        <Ionicons name="bar-chart-outline" size={17} color="#67E8F9" />
                        <Text style={{ color: '#94A3B8', marginTop: 8, fontSize: 12 }}>Total trades</Text>
                        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: '900' }}>{totalTrades}</Text>
                      </View>
                      <View style={{ flex: 1, borderRadius: 14, backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B', padding: 12 }}>
                        <Ionicons name="trending-up-outline" size={17} color={profitLoss >= 0 ? '#22C55E' : '#F43F5E'} />
                        <Text style={{ color: '#94A3B8', marginTop: 8, fontSize: 12 }}>Profit %</Text>
                        <Text style={{ color: profitLoss >= 0 ? '#22C55E' : '#F43F5E', fontSize: 24, fontWeight: '900' }}>
                          {profitLoss >= 0 ? '+' : ''}
                          {profitLoss.toFixed(2)}%
                        </Text>
                      </View>
                    </View>
                    <View style={{ marginTop: 10, borderRadius: 14, backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B', padding: 12 }}>
                      <Text style={{ color: '#94A3B8', fontSize: 12 }}>Last activity</Text>
                      <Text style={{ color: '#E2E8F0', marginTop: 4, fontWeight: '700' }}>{lastActivity}</Text>
                    </View>
                  </GlassCard>
                </MotionView>
              </View>
            </View>

            <MotionView delay={210}>
              <View
                style={{
                  gap: 10,
                  flexDirection: isDesktop ? 'row' : 'column',
                }}
              >
                <View style={{ flex: 1 }}>
                  <AppButton label="Disconnect Wallet" onPress={handleDisconnect} variant="secondary" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppButton label="Logout" onPress={handleLogout} variant="danger" />
                </View>
              </View>
            </MotionView>
          </View>
        </ScrollView>
      </View>
    </AppScreen>
  );
}
