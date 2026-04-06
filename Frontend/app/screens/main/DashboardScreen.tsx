import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Platform, Pressable, Text, View } from 'react-native';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AppScreen } from '../../components/AppScreen';
import { TrendChart } from '../../components/TrendChart';
import { WhatWeDoSection } from '../../components/WhatWeDoSection';
import { useDashboard } from '../../hooks/useDashboard';
import { useDecisions } from '../../hooks/useDecisions';
import { useAppContext } from '../../providers/AppProvider';
import { useToast } from '../../providers/ToastProvider';
import { DecisionAction } from '../../types';

const { height: viewportHeight } = Dimensions.get('window');

const actionColor = (action: DecisionAction) => {
  if (action === 'BUY') return '#22C55E';
  if (action === 'SELL') return '#F43F5E';
  return '#F59E0B';
};

const fallbackHistory = [166, 168, 170, 172, 171, 174, 177, 176, 179, 181, 182, 184, 186, 188, 190];
const flowPillars = [
  {
    label: 'SENSE',
    title: 'Market Context Engine',
    body: 'Scans momentum, liquidity, and volatility in one pass to detect regime shifts before execution.',
  },
  {
    label: 'THINK',
    title: 'Policy + Risk Layer',
    body: 'Evaluates expected value, limits downside, and adjusts position sizing based on confidence.',
  },
  {
    label: 'ACT',
    title: 'On-Chain Execution',
    body: 'Submits and confirms actions on Solana with transaction-aware routing and adaptive timing.',
  },
] as const;

function HeroCTA({
  label,
  onPress,
  primary = false,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => ({
        borderRadius: 999,
        borderWidth: primary ? 0 : 1,
        borderColor: '#334155',
        backgroundColor: primary ? '#2563EB' : 'rgba(15, 23, 42, 0.3)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        transform: [{ scale: pressed ? 0.97 : hovered ? 1.04 : 1 }],
        shadowColor: primary ? '#2563EB' : '#0F172A',
        shadowOpacity: hovered ? 0.35 : 0.2,
        shadowRadius: hovered ? 20 : 12,
        shadowOffset: { width: 0, height: 10 },
      })}
    >
      <Text style={{ color: '#E2E8F0', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 }}>{label}</Text>
    </Pressable>
  );
}

function StatPill({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View
      style={{
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: 'rgba(15, 23, 42, 0.24)',
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.18)',
      }}
    >
      <Text style={{ color: '#94A3B8', fontSize: 11, letterSpacing: 0.7, marginBottom: 3 }}>{label.toUpperCase()}</Text>
      <Text style={{ color: accent, fontSize: 17, fontWeight: '800' }}>{value}</Text>
    </View>
  );
}

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { wallet, connectWallet } = useAppContext();
  const { showToast } = useToast();
  const { data } = useDashboard();
  const { data: decisions } = useDecisions();
  const isPhone = Dimensions.get('window').width < 430;

  const scrollY = useRef(new Animated.Value(0)).current;
  const waveShift = useRef(new Animated.Value(0)).current;
  const nebulaDrift = useRef(new Animated.Value(0)).current;

  const history = data?.history?.length ? data.history : fallbackHistory;
  const solPrice = data?.solPrice ?? 190.42;
  const pnl = data?.profitLoss ?? 12.4;
  const vaultBalance = data?.vaultBalance ?? 26.91;
  const agentStatus = data?.agentStatus ?? 'Active';

  const latestLogs = useMemo(() => {
    const top = (decisions ?? []).slice(0, 4);
    if (top.length > 0) return top;

    return [
      {
        id: 'fallback-1',
        timestamp: new Date().toISOString(),
        action: 'BUY' as DecisionAction,
        explanation: 'AI detected momentum breakout with strong volume continuation and low downside volatility.',
        confidence: 86,
        price: solPrice,
        txId: 'sim-1',
      },
      {
        id: 'fallback-2',
        timestamp: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
        action: 'HOLD' as DecisionAction,
        explanation: 'Trend remains constructive, but the model reduced aggression while waiting for confirmation.',
        confidence: 72,
        price: solPrice - 1.1,
        txId: 'sim-2',
      },
      {
        id: 'fallback-3',
        timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
        action: 'SELL' as DecisionAction,
        explanation: 'Short-term mean reversion signal triggered partial exit to protect unrealized gains.',
        confidence: 79,
        price: solPrice - 2.5,
        txId: 'sim-3',
      },
    ];
  }, [decisions, solPrice]);

  const chartData = useMemo(
    () =>
      history.map((value, index) => ({
        time: `${index * 2}m`,
        price: Number(value.toFixed(2)),
      })),
    [history]
  );

  const first = history[0] ?? 1;
  const last = history[history.length - 1] ?? first;
  const change = ((last - first) / first) * 100;
  const isUp = change >= 0;

  useEffect(() => {
    const waveLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(waveShift, {
          toValue: 1,
          duration: 11000,
          useNativeDriver: true,
        }),
        Animated.timing(waveShift, {
          toValue: 0,
          duration: 11000,
          useNativeDriver: true,
        }),
      ])
    );

    const nebulaLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(nebulaDrift, {
          toValue: 1,
          duration: 8500,
          useNativeDriver: true,
        }),
        Animated.timing(nebulaDrift, {
          toValue: 0,
          duration: 8500,
          useNativeDriver: true,
        }),
      ])
    );

    waveLoop.start();
    nebulaLoop.start();

    return () => {
      waveLoop.stop();
      nebulaLoop.stop();
    };
  }, [nebulaDrift, waveShift]);

  const onConnectWallet = async () => {
    if (wallet.connected) {
      showToast('Wallet already connected', 'info');
      return;
    }

    await connectWallet();
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    showToast('Wallet connected', 'success');
  };

  const heroOpacity = scrollY.interpolate({
    inputRange: [0, viewportHeight * 0.45],
    outputRange: [1, 0.38],
    extrapolate: 'clamp',
  });

  const heroTranslateY = scrollY.interpolate({
    inputRange: [0, viewportHeight],
    outputRange: [0, -100],
    extrapolate: 'clamp',
  });

  const chartOpacity = scrollY.interpolate({
    inputRange: [viewportHeight * 0.2, viewportHeight * 0.62],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const chartTranslateY = scrollY.interpolate({
    inputRange: [viewportHeight * 0.2, viewportHeight * 0.62],
    outputRange: [52, 0],
    extrapolate: 'clamp',
  });

  const statsOpacity = scrollY.interpolate({
    inputRange: [viewportHeight * 0.56, viewportHeight * 0.95],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const timelineOpacity = scrollY.interpolate({
    inputRange: [viewportHeight * 0.95, viewportHeight * 1.5],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const whatWeDoOpacity = scrollY.interpolate({
    inputRange: [viewportHeight * 0.7, viewportHeight * 1.12],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const whatWeDoY = scrollY.interpolate({
    inputRange: [viewportHeight * 0.7, viewportHeight * 1.12],
    outputRange: [26, 0],
    extrapolate: 'clamp',
  });

  const systemOpacity = scrollY.interpolate({
    inputRange: [viewportHeight * 1.48, viewportHeight * 2.05],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const finalOpacity = scrollY.interpolate({
    inputRange: [viewportHeight * 2.02, viewportHeight * 2.56],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const waveX = waveShift.interpolate({ inputRange: [0, 1], outputRange: [-60, 60] });
  const nebulaX = nebulaDrift.interpolate({ inputRange: [0, 1], outputRange: [-14, 20] });
  const nebulaY = nebulaDrift.interpolate({ inputRange: [0, 1], outputRange: [20, -15] });

  return (
    <AppScreen padded={false}>
      <View style={{ flex: 1, backgroundColor: '#030712' }}>
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -220,
            left: -120,
            width: 460,
            height: 460,
            borderRadius: 230,
            backgroundColor: 'rgba(76, 29, 149, 0.33)',
            transform: [{ translateX: nebulaX }, { translateY: nebulaY }],
          }}
        />
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 140,
            right: -130,
            width: 420,
            height: 420,
            borderRadius: 210,
            backgroundColor: 'rgba(37, 99, 235, 0.28)',
            transform: [{ translateX: waveX }],
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: -120,
            left: 20,
            width: 320,
            height: 320,
            borderRadius: 160,
            backgroundColor: 'rgba(8, 145, 178, 0.22)',
          }}
        />

        <Animated.ScrollView
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
          })}
        >
          <Animated.View
            style={{
              minHeight: viewportHeight,
              paddingHorizontal: 24,
              paddingTop: 42,
              paddingBottom: 30,
              justifyContent: 'center',
              opacity: heroOpacity,
              transform: [{ translateY: heroTranslateY }],
            }}
          >
            <View style={{ flexDirection: Platform.OS === 'web' ? 'row' : 'column', alignItems: 'center' }}>
              <View style={{ flex: 1, paddingRight: Platform.OS === 'web' ? 24 : 0, maxWidth: 600 }}>
                <Text style={{ color: '#A5B4FC', fontSize: 12, fontWeight: '700', letterSpacing: 2.2, marginBottom: 14 }}>
                  SOLANA AI EXECUTION LAYER
                </Text>
                <Text
                  style={{
                    color: '#F8FAFC',
                    fontSize: Platform.OS === 'web' ? 68 : isPhone ? 40 : 48,
                    lineHeight: Platform.OS === 'web' ? 72 : isPhone ? 45 : 52,
                    fontWeight: '900',
                    letterSpacing: -1,
                    marginBottom: 16,
                  }}
                >
                  AI Trading on Solana
                </Text>
                <Text style={{ color: '#CBD5E1', fontSize: isPhone ? 16 : 19, lineHeight: isPhone ? 26 : 30, maxWidth: 560, marginBottom: 28 }}>
                  Autonomous AI executing trades in real-time
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <HeroCTA label="Connect Wallet" onPress={onConnectWallet} primary />
                  <HeroCTA label="Explore Strategy" onPress={() => navigation.navigate('TRADE')} />
                </View>
                <Text style={{ color: wallet.connected ? '#22C55E' : '#64748B', marginTop: 18, fontWeight: '700' }}>
                  {wallet.connected ? 'Wallet connected and ready' : 'Wallet offline, autonomous execution paused'}
                </Text>
              </View>

              <View
                style={{
                  width: Platform.OS === 'web' ? 420 : '100%',
                  height: 320,
                  marginTop: Platform.OS === 'web' ? 0 : 40,
                  justifyContent: 'center',
                }}
              >
                <Animated.View
                  style={{
                    position: 'absolute',
                    width: 300,
                    height: 300,
                    borderRadius: 150,
                    backgroundColor: 'rgba(56, 189, 248, 0.16)',
                    alignSelf: 'center',
                    transform: [{ translateY: waveX }],
                  }}
                />
                {[0, 1, 2, 3].map((i) => (
                  <Animated.View
                    key={i}
                    style={{
                      height: 52,
                      borderRadius: 999,
                      marginVertical: 8,
                      backgroundColor: `rgba(${80 + i * 40}, ${120 + i * 12}, 255, ${0.07 + i * 0.04})`,
                      borderWidth: 1,
                      borderColor: `rgba(125, 211, 252, ${0.14 + i * 0.06})`,
                      transform: [
                        {
                          translateX: waveShift.interpolate({
                            inputRange: [0, 1],
                            outputRange: [i % 2 === 0 ? -26 : 18, i % 2 === 0 ? 26 : -18],
                          }),
                        },
                      ],
                    }}
                  />
                ))}
              </View>
            </View>
          </Animated.View>

          <Animated.View
            style={{
              opacity: chartOpacity,
              transform: [{ translateY: chartTranslateY }],
              paddingHorizontal: 24,
              paddingTop: 10,
            }}
          >
            <Text style={{ color: '#A5B4FC', fontSize: 12, fontWeight: '700', letterSpacing: 1.8, marginBottom: 8 }}>
              LIVE EXECUTION GRAPH
            </Text>
            <Text style={{ color: '#F8FAFC', fontSize: isPhone ? 44 : 60, fontWeight: '900', marginBottom: 2 }}>${solPrice.toFixed(2)}</Text>
            <Text style={{ color: isUp ? '#22C55E' : '#F43F5E', fontWeight: '800', marginBottom: 22 }}>
              {isUp ? '+' : ''}
              {change.toFixed(2)}% today
            </Text>

            <View style={{ height: 320, width: '100%' }}>
              {Platform.OS === 'web' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -26, bottom: 0 }}>
                    <defs>
                      <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.55} />
                        <stop offset="65%" stopColor="#2563EB" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#030712" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(148, 163, 184, 0.08)" vertical={false} />
                    <XAxis dataKey="time" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} width={46} domain={['dataMin - 1', 'dataMax + 1']} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(2, 6, 23, 0.9)',
                        border: '1px solid rgba(100, 116, 139, 0.45)',
                        borderRadius: 12,
                        color: '#E2E8F0',
                      }}
                      formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Price']}
                      labelFormatter={(label) => `Time: ${label}`}
                    />
                    <Area type="monotone" dataKey="price" stroke="none" fill="url(#priceFill)" />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#22D3EE"
                      strokeOpacity={0.2}
                      strokeWidth={12}
                      dot={false}
                      isAnimationActive
                      animationDuration={1800}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#67E8F9"
                      strokeWidth={3}
                      dot={false}
                      isAnimationActive
                      animationDuration={1800}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <TrendChart values={history} height={300} />
              )}
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: statsOpacity, paddingHorizontal: 24, paddingTop: 26, paddingBottom: 30 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <StatPill
                label="Profit"
                value={`${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}%`}
                accent={pnl >= 0 ? '#22C55E' : '#F43F5E'}
              />
              <StatPill label="Vault" value={`${vaultBalance.toFixed(2)} SOL`} accent="#67E8F9" />
              <StatPill label="AI Status" value={agentStatus.toUpperCase()} accent={agentStatus === 'Active' ? '#22C55E' : '#F59E0B'} />
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: whatWeDoOpacity, transform: [{ translateY: whatWeDoY }] }}>
            <WhatWeDoSection />
          </Animated.View>

          <Animated.View style={{ opacity: timelineOpacity, paddingHorizontal: 24, paddingBottom: 40 }}>
            <Text style={{ color: '#A5B4FC', fontSize: 12, fontWeight: '700', letterSpacing: 1.8, marginBottom: 12 }}>
              AI DECISION FLOW
            </Text>
            <Text style={{ color: '#F8FAFC', fontSize: 35, lineHeight: 42, fontWeight: '900', marginBottom: 26 }}>
              Live decisions, explained in real time
            </Text>

            <View style={{ position: 'relative', paddingLeft: 2 }}>
              <View
                style={{
                  position: 'absolute',
                  left: 82,
                  top: 6,
                  bottom: 0,
                  width: 2,
                  backgroundColor: 'rgba(59, 130, 246, 0.28)',
                }}
              />

              {latestLogs.map((item, idx) => {
                const localOpacity = scrollY.interpolate({
                  inputRange: [viewportHeight * (1 + idx * 0.14), viewportHeight * (1.24 + idx * 0.14)],
                  outputRange: [0.05, 1],
                  extrapolate: 'clamp',
                });

                const localY = scrollY.interpolate({
                  inputRange: [viewportHeight * (1 + idx * 0.14), viewportHeight * (1.24 + idx * 0.14)],
                  outputRange: [42, 0],
                  extrapolate: 'clamp',
                });

                return (
                  <Animated.View
                    key={item.id}
                    style={{
                      flexDirection: Platform.OS === 'web' ? 'row' : 'column',
                      marginBottom: 24,
                      opacity: localOpacity,
                      transform: [{ translateY: localY }],
                    }}
                  >
                    <View style={{ width: 74, paddingTop: 3, marginBottom: Platform.OS === 'web' ? 0 : 8 }}>
                      <Text style={{ color: actionColor(item.action), fontSize: 14, fontWeight: '900', letterSpacing: 1.1 }}>
                        {item.action}
                      </Text>
                    </View>

                    <View style={{ width: 16, alignItems: 'center', marginRight: 12, marginBottom: Platform.OS === 'web' ? 0 : 8 }}>
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: actionColor(item.action),
                          shadowColor: actionColor(item.action),
                          shadowOpacity: 0.85,
                          shadowRadius: 10,
                          shadowOffset: { width: 0, height: 0 },
                        }}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#CBD5E1', fontSize: 15, lineHeight: 23, marginBottom: 10 }}>{item.explanation}</Text>

                      <View style={{ height: 5, borderRadius: 999, backgroundColor: 'rgba(30, 41, 59, 0.85)', overflow: 'hidden' }}>
                        <Animated.View
                          style={{
                            width: `${item.confidence}%`,
                            height: 5,
                            borderRadius: 999,
                            backgroundColor: actionColor(item.action),
                          }}
                        />
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                        <Text style={{ color: '#64748B', fontSize: 12 }}>
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '700' }}>{item.confidence}% confidence</Text>
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>

          <Animated.View
            style={{
              opacity: systemOpacity,
              paddingHorizontal: 24,
              paddingTop: 30,
              paddingBottom: 55,
            }}
          >
            <Text style={{ color: '#A5B4FC', fontSize: 12, fontWeight: '700', letterSpacing: 1.8, marginBottom: 10 }}>
              AUTONOMOUS SYSTEM
            </Text>
            <Text style={{ color: '#F8FAFC', fontSize: 34, lineHeight: 41, fontWeight: '900', marginBottom: 30, maxWidth: 760 }}>
              Designed as one continuous intelligence loop
            </Text>

            <View style={{ gap: 22 }}>
              {flowPillars.map((pillar, idx) => {
                const pillarOpacity = scrollY.interpolate({
                  inputRange: [viewportHeight * (1.62 + idx * 0.18), viewportHeight * (1.88 + idx * 0.18)],
                  outputRange: [0.06, 1],
                  extrapolate: 'clamp',
                });

                const pillarY = scrollY.interpolate({
                  inputRange: [viewportHeight * (1.62 + idx * 0.18), viewportHeight * (1.88 + idx * 0.18)],
                  outputRange: [30, 0],
                  extrapolate: 'clamp',
                });

                return (
                  <Animated.View
                    key={pillar.label}
                    style={{
                      opacity: pillarOpacity,
                      transform: [{ translateY: pillarY }],
                    }}
                  >
                    <View style={{ flexDirection: Platform.OS === 'web' ? 'row' : 'column', alignItems: 'flex-start' }}>
                      <Text
                        style={{
                          minWidth: 88,
                          color: '#67E8F9',
                          fontSize: 12,
                          fontWeight: '900',
                          letterSpacing: 1.7,
                          marginBottom: Platform.OS === 'web' ? 0 : 8,
                        }}
                      >
                        {pillar.label}
                      </Text>

                      <View style={{ flex: 1, paddingLeft: Platform.OS === 'web' ? 12 : 0 }}>
                        <Text style={{ color: '#E2E8F0', fontSize: 23, lineHeight: 29, fontWeight: '800', marginBottom: 8 }}>
                          {pillar.title}
                        </Text>
                        <Text style={{ color: '#94A3B8', fontSize: 15, lineHeight: 24, maxWidth: 770 }}>{pillar.body}</Text>
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>

          <Animated.View
            style={{
              opacity: finalOpacity,
              minHeight: viewportHeight * 0.78,
              paddingHorizontal: 24,
              paddingTop: 30,
              paddingBottom: 120,
              justifyContent: 'center',
            }}
          >
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 20,
                right: 20,
                top: 12,
                bottom: 70,
                borderRadius: 44,
                backgroundColor: 'rgba(15, 23, 42, 0.22)',
              }}
            />
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 40,
                right: 40,
                top: 80,
                height: 2,
                backgroundColor: 'rgba(96, 165, 250, 0.24)',
              }}
            />
            <Text style={{ color: '#A5B4FC', fontSize: 12, fontWeight: '700', letterSpacing: 2, marginBottom: 14 }}>
              READY TO RUN
            </Text>
            <Text style={{ color: '#F8FAFC', fontSize: Platform.OS === 'web' ? 58 : 42, lineHeight: Platform.OS === 'web' ? 62 : 48, fontWeight: '900', marginBottom: 18, maxWidth: 760 }}>
              Let the AI trade while you stay in control
            </Text>
            <Text style={{ color: '#94A3B8', fontSize: 18, lineHeight: 30, marginBottom: 30, maxWidth: 760 }}>
              Capital stays yours. Strategy stays transparent. Execution stays fast on Solana.
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
              <HeroCTA label="Launch Vault" onPress={() => navigation.navigate('TRADE')} primary />
              <HeroCTA label="View AI Analytics" onPress={() => navigation.navigate('AI ANALYTICS')} />
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              <Text style={{ color: '#64748B', fontSize: 12, letterSpacing: 1.2 }}>REAL-TIME EXECUTION</Text>
              <Text style={{ color: '#64748B', fontSize: 12, letterSpacing: 1.2 }}>RISK-AWARE SIGNALS</Text>
              <Text style={{ color: '#64748B', fontSize: 12, letterSpacing: 1.2 }}>SOLANA NATIVE</Text>
            </View>
          </Animated.View>
        </Animated.ScrollView>
      </View>
    </AppScreen>
  );
}
