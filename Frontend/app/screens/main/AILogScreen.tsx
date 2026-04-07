import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState, useEffect } from 'react';
import { Animated, Dimensions, Platform, Pressable, Text, View } from 'react-native';
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { AppScreen } from '../../components/AppScreen';
import { TrendChart } from '../../components/TrendChart';
import { useDashboard } from '../../hooks/useDashboard';
import { useDecisions } from '../../hooks/useDecisions';
import { DecisionAction } from '../../types';

const { height: viewportHeight } = Dimensions.get('window');

const filters: Array<DecisionAction | 'ALL'> = ['ALL', 'BUY', 'SELL', 'HOLD'];

const ACTION_META: Record<DecisionAction, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  BUY: { color: '#22C55E', icon: 'trending-up-outline' },
  SELL: { color: '#F43F5E', icon: 'trending-down-outline' },
  HOLD: { color: '#F59E0B', icon: 'pause-circle-outline' },
};

const actionColor = (action: DecisionAction) => ACTION_META[action].color;

function FilterPill({
  label,
  active,
  color,
  onPress,
}: {
  label: string;
  active: boolean;
  color: string;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => ({
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? `${color}B6` : 'rgba(148, 163, 184, 0.35)',
        backgroundColor: active ? `${color}33` : 'rgba(15, 23, 42, 0.36)',
        paddingHorizontal: 13,
        paddingVertical: 7,
        transform: [{ scale: pressed ? 0.97 : hovered ? 1.03 : 1 }],
      })}
    >
      <Text style={{ color: active ? color : '#CBD5E1', fontSize: 12, fontWeight: '800', letterSpacing: 0.4 }}>{label}</Text>
    </Pressable>
  );
}

export function AILogScreen() {
  const { data: dashboard } = useDashboard();
  const { data, isLoading, refetch } = useDecisions();
  const [filter, setFilter] = useState<DecisionAction | 'ALL'>('ALL');
  const [newestFirst, setNewestFirst] = useState(true);
  const isPhone = Dimensions.get('window').width < 430;

  const scrollY = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const glowDrift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.2, duration: 850, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 850, useNativeDriver: true }),
      ])
    );

    const driftLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowDrift, { toValue: 1, duration: 9500, useNativeDriver: true }),
        Animated.timing(glowDrift, { toValue: 0, duration: 9500, useNativeDriver: true }),
      ])
    );

    pulseLoop.start();
    driftLoop.start();
    return () => {
      pulseLoop.stop();
      driftLoop.stop();
    };
  }, [glowDrift, pulse]);

  const list = useMemo(() => {
    const source = data ?? [];
    const filtered = filter === 'ALL' ? source : source.filter((item) => item.action === filter);
    return [...filtered].sort((a, b) => {
      const x = new Date(a.timestamp).getTime();
      const y = new Date(b.timestamp).getTime();
      return newestFirst ? y - x : x - y;
    });
  }, [data, filter, newestFirst]);

  const chartData = useMemo(() => {
    const history =
      dashboard?.history?.length && dashboard.history.length > 0
        ? dashboard.history
        : [164, 167, 166, 170, 172, 171, 176, 174, 178, 181, 183];
    return history.map((v, i) => ({ t: `${i * 3}m`, price: Number(v.toFixed(2)) }));
  }, [dashboard?.history]);

  const latest = dashboard?.latestDecision ?? null;
  const avgConfidence =
    list.length > 0 ? Math.round(list.reduce((acc, item) => acc + item.confidence, 0) / list.length) : 76;
  const executedCount = list.filter((item) => item.action !== 'HOLD').length;

  const reasoningText =
    latest?.explanation ??
    'Market is range-bound with low conviction. The model keeps risk constrained and waits for asymmetric setups.';

  const heroOpacity = scrollY.interpolate({
    inputRange: [0, viewportHeight * 0.38],
    outputRange: [1, 0.76],
    extrapolate: 'clamp',
  });

  const streamOpacity = scrollY.interpolate({
    inputRange: [viewportHeight * 0.35, viewportHeight * 1.2],
    outputRange: [0.35, 1],
    extrapolate: 'clamp',
  });

  const glowX = glowDrift.interpolate({ inputRange: [0, 1], outputRange: [-18, 22] });
  const glowY = glowDrift.interpolate({ inputRange: [0, 1], outputRange: [16, -14] });

  return (
    <AppScreen padded={false}>
      <View style={{ flex: 1, backgroundColor: '#040816' }}>
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -160,
            left: -140,
            width: 420,
            height: 420,
            borderRadius: 210,
            backgroundColor: 'rgba(29, 78, 216, 0.28)',
            transform: [{ translateX: glowX }, { translateY: glowY }],
          }}
        />
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 160,
            right: -120,
            width: 380,
            height: 380,
            borderRadius: 190,
            backgroundColor: 'rgba(8, 145, 178, 0.26)',
            transform: [{ translateX: glowY }],
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 24,
            bottom: -90,
            width: 300,
            height: 300,
            borderRadius: 150,
            backgroundColor: 'rgba(20, 184, 166, 0.16)',
          }}
        />

        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
          contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 34, paddingBottom: 110 }}
        >
          <Animated.View style={{ opacity: heroOpacity, marginBottom: 22 }}>
            <Text style={{ color: '#A5B4FC', fontSize: 12, fontWeight: '700', letterSpacing: 2, marginBottom: 10 }}>
              ANALYTICS
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
              AI Analytics
            </Text>
            <Text style={{ color: '#CBD5E1', fontSize: isPhone ? 15 : 17, lineHeight: isPhone ? 24 : 28, maxWidth: 760 }}>
              Decision intelligence, confidence mapping, and model behavior in one cinematic interface.
            </Text>
          </Animated.View>

          <View
            style={{
              borderRadius: 30,
              padding: 18,
              marginBottom: 26,
              backgroundColor: 'rgba(15, 23, 42, 0.48)',
              borderWidth: 1,
              borderColor: 'rgba(96, 165, 250, 0.28)',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <View>
                <Text style={{ color: '#94A3B8', fontSize: 11, letterSpacing: 1.2, marginBottom: 4 }}>SOL PRICE</Text>
                <Text style={{ color: '#F8FAFC', fontSize: isPhone ? 28 : 34, fontWeight: '900' }}>${(dashboard?.solPrice ?? 183.91).toFixed(2)}</Text>
              </View>

              <View style={{ minWidth: 120 }}>
                <Text style={{ color: '#94A3B8', fontSize: 11, letterSpacing: 1.2, marginBottom: 4 }}>EXECUTED</Text>
                <Text style={{ color: '#67E8F9', fontSize: 30, fontWeight: '900' }}>{executedCount}</Text>
              </View>

              <View style={{ minWidth: 120 }}>
                <Text style={{ color: '#94A3B8', fontSize: 11, letterSpacing: 1.2, marginBottom: 4 }}>AVG CONF.</Text>
                <Text style={{ color: '#22C55E', fontSize: 30, fontWeight: '900' }}>{avgConfidence}%</Text>
              </View>

              <View style={{ alignItems: 'flex-end', minWidth: 140 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Animated.View
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 5,
                      marginRight: 7,
                      backgroundColor: dashboard?.agentStatus === 'Active' ? '#22C55E' : '#F59E0B',
                      transform: [{ scale: pulse }],
                    }}
                  />
                  <Text
                    style={{
                      color: dashboard?.agentStatus === 'Active' ? '#22C55E' : '#F59E0B',
                      fontSize: 12,
                      fontWeight: '800',
                      letterSpacing: 1,
                    }}
                  >
                    {(dashboard?.agentStatus ?? 'Idle').toUpperCase()}
                  </Text>
                </View>
                <Text style={{ color: '#64748B', fontSize: 12 }}>LIVE MODEL</Text>
              </View>
            </View>

            <View style={{ height: 210, marginTop: 14 }}>
              {Platform.OS === 'web' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="analyticsFill" x1="0" y1="0" x2="0" y2="1">
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
                    <Area type="monotone" dataKey="price" stroke="none" fill="url(#analyticsFill)" />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#67E8F9"
                      strokeWidth={3}
                      dot={false}
                      isAnimationActive
                      animationDuration={1600}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                ) : (
                <TrendChart values={chartData.map((x) => x.price)} height={190} />
              )}
            </View>
          </View>

          <Animated.View style={{ opacity: streamOpacity }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
              <Text style={{ color: '#E2E8F0', fontSize: 22, fontWeight: '800' }}>Decision Stream</Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {filters.map((item) => {
                  const active = filter === item;
                  const color = item === 'ALL' ? '#94A3B8' : ACTION_META[item].color;
                  return (
                    <FilterPill key={item} label={item} active={active} color={color} onPress={() => setFilter(item)} />
                  );
                })}

                <Pressable
                  onPress={() => {
                    setNewestFirst((prev) => !prev);
                    void refetch();
                  }}
                  style={({ pressed }) => ({
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: 'rgba(148, 163, 184, 0.4)',
                    backgroundColor: 'rgba(15, 23, 42, 0.46)',
                    paddingHorizontal: 11,
                    paddingVertical: 7,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  })}
                >
                  <Text style={{ color: '#CBD5E1', fontSize: 12, fontWeight: '700' }}>{newestFirst ? 'Newest' : 'Oldest'}</Text>
                </Pressable>
              </View>
            </View>

            <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)', marginBottom: 24 }}>
              {isLoading ? (
                <Text style={{ color: '#94A3B8', marginTop: 14 }}>Loading AI logs...</Text>
              ) : list.length === 0 ? (
                <Text style={{ color: '#94A3B8', marginTop: 14 }}>No log entries for this filter.</Text>
              ) : (
                list.map((item) => {
                  const meta = ACTION_META[item.action];
                  return (
                    <View
                      key={item.id}
                      style={{
                        paddingVertical: 15,
                        borderBottomWidth: 1,
                        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
                        justifyContent: 'space-between',
                        gap: 10,
                      }}
                    >
                      <View style={{ width: Platform.OS === 'web' ? 220 : undefined }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                          <Ionicons name={meta.icon} size={16} color={meta.color} />
                          <Text style={{ color: meta.color, fontSize: 12, fontWeight: '900', marginLeft: 8, letterSpacing: 1 }}>{item.action}</Text>
                        </View>
                        <Text style={{ color: '#64748B', fontSize: 12 }}>
                          {new Date(item.timestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>

                      <View style={{ flex: 1, maxWidth: 640 }}>
                        <Text style={{ color: '#CBD5E1', lineHeight: 22 }}>{item.explanation}</Text>
                      </View>

                      <View style={{ width: Platform.OS === 'web' ? 190 : undefined, alignItems: Platform.OS === 'web' ? 'flex-end' : 'flex-start' }}>
                        <View style={{ height: 5, width: 170, borderRadius: 999, backgroundColor: 'rgba(30, 41, 59, 0.92)', overflow: 'hidden', marginBottom: 6 }}>
                          <View style={{ height: 5, width: `${item.confidence}%`, borderRadius: 999, backgroundColor: meta.color }} />
                        </View>
                        <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 2 }}>{item.confidence}% confidence</Text>
                        <Text style={{ color: '#7DD3FC', fontSize: 12, fontWeight: '700' }}>SOL ${item.price.toFixed(2)}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            <View
              style={{
                borderRadius: 24,
                padding: 16,
                backgroundColor: 'rgba(15, 23, 42, 0.45)',
                borderWidth: 1,
                borderColor: 'rgba(34, 197, 94, 0.28)',
              }}
            >
              <Text style={{ color: '#86EFAC', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 8 }}>REASONING LENS</Text>
              <Text style={{ color: '#E2E8F0', fontSize: 17, fontWeight: '800', marginBottom: 8 }}>
                {latest?.action ?? 'HOLD'} signal interpretation
              </Text>
              <Text style={{ color: '#A5B4FC', lineHeight: 22, marginBottom: 10 }}>{reasoningText}</Text>
              <View style={{ height: 6, borderRadius: 999, backgroundColor: 'rgba(30, 41, 59, 0.92)', overflow: 'hidden' }}>
                <View
                  style={{
                    height: 6,
                    width: `${latest?.confidence ?? 76}%`,
                    borderRadius: 999,
                    backgroundColor: actionColor(latest?.action ?? 'HOLD'),
                  }}
                />
              </View>
            </View>
          </Animated.View>
        </Animated.ScrollView>
      </View>
    </AppScreen>
  );
}
