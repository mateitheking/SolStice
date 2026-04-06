import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Platform, Pressable, Text, View } from 'react-native';
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { AppScreen } from '../../components/AppScreen';
import { TrendChart } from '../../components/TrendChart';
import { useDashboard } from '../../hooks/useDashboard';
import { useDecisions } from '../../hooks/useDecisions';
import { useAppContext } from '../../providers/AppProvider';
import { useToast } from '../../providers/ToastProvider';
import { DecisionAction, StrategyType } from '../../types';

const { height: viewportHeight } = Dimensions.get('window');

const truncateAddress = (addr: string | null) => {
  if (!addr) return 'Not connected';
  return addr.length > 16 ? `${addr.slice(0, 6)}...${addr.slice(-6)}` : addr;
};

const actionColor = (action: DecisionAction) => {
  if (action === 'BUY') return '#22C55E';
  if (action === 'SELL') return '#F43F5E';
  return '#F59E0B';
};

function StrategyPanel({
  label,
  description,
  icon,
  active,
  onPress,
}: {
  label: StrategyType;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => ({
        flex: 1,
        minWidth: 220,
        borderRadius: 26,
        padding: 18,
        backgroundColor: active ? 'rgba(14, 116, 144, 0.24)' : 'rgba(15, 23, 42, 0.3)',
        shadowColor: active ? '#22D3EE' : '#0F172A',
        shadowOpacity: hovered || active ? 0.4 : 0.18,
        shadowRadius: hovered || active ? 24 : 14,
        shadowOffset: { width: 0, height: 12 },
        transform: [{ scale: pressed ? 0.98 : hovered ? 1.02 : 1 }],
      })}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          borderRadius: 26,
          borderWidth: 1,
          borderColor: active ? 'rgba(103, 232, 249, 0.65)' : 'rgba(148, 163, 184, 0.2)',
        }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: active ? 'rgba(103, 232, 249, 0.24)' : 'rgba(71, 85, 105, 0.32)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={icon} size={20} color={active ? '#67E8F9' : '#CBD5E1'} />
        </View>
        {active ? <Text style={{ color: '#67E8F9', fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>ACTIVE</Text> : null}
      </View>

      <Text style={{ color: '#F8FAFC', fontSize: 21, fontWeight: '800', marginBottom: 6 }}>{label}</Text>
      <Text style={{ color: '#94A3B8', fontSize: 14, lineHeight: 22 }}>{description}</Text>
    </Pressable>
  );
}

function ActionBar({
  title,
  subtitle,
  icon,
  color,
  loading,
  arrowShift,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  loading: boolean;
  arrowShift: Animated.AnimatedInterpolation<string | number>;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      disabled={loading}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => ({
        opacity: loading ? 0.55 : 1,
        borderRadius: 999,
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(15, 23, 42, 0.12)',
        transform: [{ scale: pressed ? 0.985 : hovered ? 1.01 : 1 }],
        shadowColor: color,
        shadowOpacity: hovered ? 0.35 : 0.2,
        shadowRadius: hovered ? 18 : 10,
        shadowOffset: { width: 0, height: 10 },
      })}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: `${color}B0`,
          backgroundColor: `${color}2C`,
        }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              backgroundColor: `${color}2A`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={icon} size={20} color={color} />
          </View>
          <View>
            <Text style={{ color: '#F8FAFC', fontSize: 18, fontWeight: '800' }}>{title}</Text>
            <Text style={{ color: '#A5B4FC', fontSize: 13 }}>{subtitle}</Text>
          </View>
        </View>

        <Animated.View style={{ transform: [{ translateX: arrowShift }] }}>
          <Ionicons name="arrow-forward" size={18} color={color} />
        </Animated.View>
      </View>
    </Pressable>
  );
}

export function StrategyScreen() {
  const queryClient = useQueryClient();
  const { data } = useDashboard();
  const { data: decisions } = useDecisions();
  const { wallet, strategy, setStrategy, connectWallet, disconnectWallet, deposit, withdraw } = useAppContext();
  const { showToast } = useToast();
  const isPhone = Dimensions.get('window').width < 430;

  const scrollY = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const arrowPulse = useRef(new Animated.Value(0)).current;
  const glowDrift = useRef(new Animated.Value(0)).current;
  const [displayBalance, setDisplayBalance] = useState(wallet.balance);

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.22, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );

    const arrowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(arrowPulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(arrowPulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );

    const driftLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowDrift, { toValue: 1, duration: 8500, useNativeDriver: true }),
        Animated.timing(glowDrift, { toValue: 0, duration: 8500, useNativeDriver: true }),
      ])
    );

    pulseLoop.start();
    arrowLoop.start();
    driftLoop.start();

    return () => {
      pulseLoop.stop();
      arrowLoop.stop();
      driftLoop.stop();
    };
  }, [arrowPulse, glowDrift, pulse]);

  useEffect(() => {
    const next = wallet.balance;
    if (Math.abs(next - displayBalance) < 0.001) {
      setDisplayBalance(next);
      return;
    }

    let current = displayBalance;
    const steps = 20;
    const delta = (next - current) / steps;
    let tick = 0;

    const id = setInterval(() => {
      tick += 1;
      current += delta;
      if (tick >= steps) {
        clearInterval(id);
        setDisplayBalance(next);
      } else {
        setDisplayBalance(current);
      }
    }, 28);

    return () => clearInterval(id);
  }, [wallet.balance]);

  const depositMutation = useMutation({
    mutationFn: () => deposit(1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Deposited 1 SOL into vault', 'success');
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: () => withdraw(1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Withdrew 1 SOL from vault', 'info');
    },
  });

  const busy = depositMutation.isPending || withdrawMutation.isPending;

  const chartData = useMemo(() => {
    const history = data?.history?.length ? data.history : [152, 154, 157, 155, 158, 161, 160, 162];
    return history.map((price, i) => ({ t: `${i * 3}m`, price: Number(price.toFixed(2)) }));
  }, [data?.history]);

  const nonHoldTrades = useMemo(
    () => (decisions ?? []).filter((item) => item.action !== 'HOLD').slice(-3).reverse(),
    [decisions]
  );
  const latest = data?.latestDecision ?? null;
  const pnl = data?.profitLoss ?? 0;
  const aiStatus = data?.agentStatus ?? 'Idle';

  const heroOpacity = scrollY.interpolate({
    inputRange: [0, viewportHeight * 0.28],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });
  const walletOpacity = scrollY.interpolate({
    inputRange: [0, viewportHeight * 0.5],
    outputRange: [1, 1],
    extrapolate: 'clamp',
  });
  const sectionOpacity = scrollY.interpolate({
    inputRange: [viewportHeight * 0.26, viewportHeight * 1.1],
    outputRange: [1, 1],
    extrapolate: 'clamp',
  });

  const glowX = glowDrift.interpolate({ inputRange: [0, 1], outputRange: [-20, 22] });
  const glowY = glowDrift.interpolate({ inputRange: [0, 1], outputRange: [18, -14] });
  const arrowShift = arrowPulse.interpolate({ inputRange: [0, 1], outputRange: [0, 8] });

  return (
    <AppScreen padded={false}>
      <View style={{ flex: 1, backgroundColor: '#050A18' }}>
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -170,
            left: -140,
            width: 430,
            height: 430,
            borderRadius: 220,
            backgroundColor: 'rgba(109, 40, 217, 0.28)',
            transform: [{ translateX: glowX }, { translateY: glowY }],
          }}
        />
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            right: -120,
            top: 140,
            width: 390,
            height: 390,
            borderRadius: 200,
            backgroundColor: 'rgba(37, 99, 235, 0.24)',
            transform: [{ translateX: glowY }],
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 20,
            bottom: -90,
            width: 320,
            height: 320,
            borderRadius: 180,
            backgroundColor: 'rgba(8, 145, 178, 0.18)',
          }}
        />

        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
          contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 34, paddingBottom: 120 }}
        >
          <Animated.View style={{ opacity: heroOpacity, marginBottom: 22 }}>
            <Text style={{ color: '#A5B4FC', fontSize: 12, fontWeight: '700', letterSpacing: 2, marginBottom: 10 }}>
              TRADE
            </Text>
            <Text
              style={{
                color: '#F8FAFC',
                fontSize: Platform.OS === 'web' ? 52 : isPhone ? 34 : 38,
                lineHeight: Platform.OS === 'web' ? 56 : isPhone ? 39 : 42,
                fontWeight: '900',
                marginBottom: 8,
              }}
            >
              Trading Control Panel
            </Text>
            <Text style={{ color: '#CBD5E1', fontSize: isPhone ? 15 : 17, lineHeight: isPhone ? 24 : 28, maxWidth: 700 }}>
              Manage your AI strategy and capital
            </Text>
          </Animated.View>

          <Animated.View
            style={{
              opacity: walletOpacity,
              marginBottom: 24,
              borderRadius: 34,
              padding: 20,
              backgroundColor: 'rgba(15, 23, 42, 0.58)',
            }}
          >
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                borderRadius: 34,
                borderWidth: 1,
                borderColor: 'rgba(96, 165, 250, 0.45)',
              }}
            />

            <View style={{ flexDirection: Platform.OS === 'web' ? 'row' : 'column', justifyContent: 'space-between' }}>
              <View
                style={{
                  flex: 1,
                  marginRight: Platform.OS === 'web' ? 16 : 0,
                  marginBottom: Platform.OS === 'web' ? 0 : 18,
                }}
              >
                <Text style={{ color: '#94A3B8', fontSize: 11, letterSpacing: 1.4, marginBottom: 8 }}>
                  WALLET BALANCE
                </Text>
                <Text
                  style={{
                    color: '#F8FAFC',
                    fontSize: 42,
                    lineHeight: 44,
                    fontWeight: '900',
                    textShadowColor: 'rgba(103, 232, 249, 0.65)',
                    textShadowRadius: 20,
                    marginBottom: 10,
                  }}
                >
                  {displayBalance.toFixed(4)} SOL
                </Text>
                <Text style={{ color: '#A5B4FC', fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }}>
                  {truncateAddress(wallet.address)}
                </Text>
              </View>

              <View
                style={{
                  minWidth: 210,
                  alignItems: Platform.OS === 'web' ? 'flex-end' : 'flex-start',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Animated.View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      marginRight: 8,
                      backgroundColor: wallet.connected ? '#22C55E' : '#F59E0B',
                      transform: [{ scale: pulse }],
                    }}
                  />
                  <Text
                    style={{
                      color: wallet.connected ? '#22C55E' : '#F59E0B',
                      fontSize: 12,
                      fontWeight: '800',
                      letterSpacing: 1,
                    }}
                  >
                    {wallet.connected ? 'CONNECTED' : 'DISCONNECTED'}
                  </Text>
                </View>

                <Pressable
                  onPress={wallet.connected ? disconnectWallet : connectWallet}
                  style={({ pressed }) => ({
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: wallet.connected ? 'rgba(252, 165, 165, 0.5)' : 'rgba(147, 197, 253, 0.6)',
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    backgroundColor: wallet.connected ? 'rgba(239, 68, 68, 0.22)' : 'rgba(59, 130, 246, 0.26)',
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  })}
                >
                  <Text style={{ color: wallet.connected ? '#FCA5A5' : '#93C5FD', fontWeight: '700' }}>
                    {wallet.connected ? 'Disconnect' : 'Connect Phantom'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: sectionOpacity }}>
            <Text style={{ color: '#A5B4FC', fontSize: 12, fontWeight: '700', letterSpacing: 1.8, marginBottom: 10 }}>
              STRATEGY SELECTION
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
              <StrategyPanel
                label="Conservative"
                description="Lower-volatility entries with tighter risk controls and steadier execution."
                icon="shield-checkmark-outline"
                active={strategy === 'Conservative'}
                onPress={() => setStrategy('Conservative')}
              />
              <StrategyPanel
                label="Aggressive"
                description="Higher frequency actions tuned for momentum bursts and faster upside attempts."
                icon="flash-outline"
                active={strategy === 'Aggressive'}
                onPress={() => setStrategy('Aggressive')}
              />
            </View>

            <Text style={{ color: '#A5B4FC', fontSize: 12, fontWeight: '700', letterSpacing: 1.8, marginBottom: 10 }}>
              VAULT ACTIONS
            </Text>
            <View style={{ gap: 12, marginBottom: 26 }}>
              <ActionBar
                title={busy ? 'Processing Deposit...' : 'Deposit 1 SOL'}
                subtitle="Fund vault liquidity for autonomous execution"
                icon="arrow-down-circle-outline"
                color="#22C55E"
                loading={busy}
                arrowShift={arrowShift}
                onPress={() => depositMutation.mutate()}
              />
              <ActionBar
                title={busy ? 'Processing Withdraw...' : 'Withdraw 1 SOL'}
                subtitle="Move SOL back to wallet reserves"
                icon="arrow-up-circle-outline"
                color="#F43F5E"
                loading={busy}
                arrowShift={arrowShift}
                onPress={() => withdrawMutation.mutate()}
              />
            </View>

            <Text style={{ color: '#A5B4FC', fontSize: 12, fontWeight: '700', letterSpacing: 1.8, marginBottom: 10 }}>
              STRATEGY PERFORMANCE
            </Text>
            <View style={{ marginBottom: 28, borderRadius: 28, padding: 16, backgroundColor: 'rgba(15, 23, 42, 0.48)' }}>
              <View style={{ height: 220, marginBottom: 14 }}>
                {Platform.OS === 'web' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -24, bottom: 0 }}>
                      <defs>
                        <linearGradient id="tradePerf" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="#0F172A" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(148, 163, 184, 0.08)" vertical={false} />
                      <XAxis dataKey="t" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis
                        tick={{ fill: '#64748B', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                        domain={['dataMin - 1', 'dataMax + 1']}
                      />
                      <Area type="monotone" dataKey="price" stroke="none" fill="url(#tradePerf)" />
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#67E8F9"
                        strokeWidth={3}
                        dot={false}
                        isAnimationActive
                        animationDuration={1700}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <TrendChart values={chartData.map((x) => x.price)} height={210} />
                )}
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <View>
                  <Text style={{ color: '#94A3B8', fontSize: 12 }}>Performance</Text>
                  <Text style={{ color: pnl >= 0 ? '#22C55E' : '#F43F5E', fontSize: isPhone ? 24 : 28, fontWeight: '900' }}>
                    {pnl >= 0 ? '+' : ''}
                    {pnl.toFixed(2)}%
                  </Text>
                </View>
                <View style={{ minWidth: 210 }}>
                  <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 6 }}>Last trades</Text>
                  {nonHoldTrades.length ? (
                    nonHoldTrades.map((trade) => (
                      <View
                        key={trade.id}
                        style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}
                      >
                        <Text style={{ color: actionColor(trade.action), fontWeight: '800' }}>{trade.action}</Text>
                        <Text style={{ color: '#94A3B8', fontSize: 12 }}>${trade.price.toFixed(2)}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={{ color: '#64748B' }}>No recent executed trades</Text>
                  )}
                </View>
              </View>
            </View>

            <Text style={{ color: '#A5B4FC', fontSize: 12, fontWeight: '700', letterSpacing: 1.8, marginBottom: 10 }}>
              AI CONTROL PANEL
            </Text>
            <View style={{ borderRadius: 28, padding: 18, backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Animated.View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      marginRight: 8,
                      backgroundColor: aiStatus === 'Active' ? '#22C55E' : '#F59E0B',
                      transform: [{ scale: pulse }],
                    }}
                  />
                  <Text style={{ color: aiStatus === 'Active' ? '#22C55E' : '#F59E0B', fontWeight: '800', letterSpacing: 1 }}>
                    {aiStatus.toUpperCase()}
                  </Text>
                </View>

                <Text style={{ color: '#67E8F9', fontSize: 13, fontWeight: '800' }}>{strategy} MODE</Text>
              </View>

              <Text style={{ color: '#94A3B8', fontSize: 12 }}>Last decision</Text>
              <Text style={{ color: '#E2E8F0', fontSize: 15, lineHeight: 24, marginTop: 4, marginBottom: 12 }}>
                {latest?.explanation ?? 'Waiting for the next market signal...'}
              </Text>

              <View style={{ height: 6, borderRadius: 999, backgroundColor: 'rgba(30, 41, 59, 0.92)', overflow: 'hidden' }}>
                <Animated.View
                  style={{
                    width: `${latest?.confidence ?? 64}%`,
                    height: 6,
                    borderRadius: 999,
                    backgroundColor: actionColor(latest?.action ?? 'HOLD'),
                  }}
                />
              </View>
              <Text style={{ color: '#94A3B8', marginTop: 7, fontSize: 12 }}>{latest?.confidence ?? 64}% confidence</Text>
            </View>
          </Animated.View>
        </Animated.ScrollView>
      </View>
    </AppScreen>
  );
}
