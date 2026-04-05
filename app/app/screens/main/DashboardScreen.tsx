import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, ScrollView, Text, View } from 'react-native';
import { AppScreen } from '../../components/AppScreen';
import { EmptyState } from '../../components/EmptyState';
import { GlassCard } from '../../components/GlassCard';
import { MotionView } from '../../components/MotionView';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SimpleLineChart } from '../../components/SimpleLineChart';
import { useDashboard } from '../../hooks/useDashboard';

function PulsingDot() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.6, duration: 900, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.2, duration: 900, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.8, duration: 900, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, [opacity, scale]);

  return (
    <View style={{ width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: '#10B981',
          opacity,
          transform: [{ scale }],
        }}
      />
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />
    </View>
  );
}

const actionAccent = (action: string) => {
  if (action === 'BUY') return 'emerald';
  if (action === 'SELL') return 'rose';
  return 'amber';
};

const actionColor = (action: string) => {
  if (action === 'BUY') return '#10B981';
  if (action === 'SELL') return '#F43F5E';
  return '#F59E0B';
};

export function DashboardScreen() {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <AppScreen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={{ marginTop: 12, color: '#9CA3AF', fontSize: 13 }}>Connecting to AI agent...</Text>
        </View>
      </AppScreen>
    );
  }

  if (!data) {
    return (
      <AppScreen>
        <EmptyState title="No data yet" subtitle="Dashboard metrics will appear after sync." />
      </AppScreen>
    );
  }

  const plPositive = data.profitLoss >= 0;

  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        <MotionView delay={40}>
          <ScreenHeader
            eyebrow="overview"
            title="Dashboard"
            subtitle="Live AI agent metrics and SOL price feed."
          />
        </MotionView>

        {/* SOL Price + Chart */}
        <MotionView delay={100}>
          <GlassCard>
            <View className="flex-row items-center justify-between mb-1">
              <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '500' }}>SOL / USD</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#ECFDF5', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 }}>
                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#10B981' }} />
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#10B981', letterSpacing: 1 }}>LIVE</Text>
              </View>
            </View>
            <Text style={{ fontSize: 38, fontWeight: '800', color: '#111111', letterSpacing: -1, marginBottom: 12 }}>
              ${data.solPrice.toFixed(2)}
            </Text>
            <SimpleLineChart values={data.history} />
          </GlassCard>
        </MotionView>

        {/* P&L + Trades */}
        <MotionView delay={160}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <GlassCard className="flex-1" accent={plPositive ? 'emerald' : 'rose'}>
              <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '500', marginBottom: 6 }}>Profit / Loss</Text>
              <Text style={{ fontSize: 26, fontWeight: '800', color: plPositive ? '#10B981' : '#F43F5E' }}>
                {plPositive ? '↑ +' : '↓ '}
                {data.profitLoss}%
              </Text>
            </GlassCard>

            <GlassCard className="flex-1">
              <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '500', marginBottom: 6 }}>Total Trades</Text>
              <Text style={{ fontSize: 26, fontWeight: '800', color: '#111111' }}>{data.tradesCount}</Text>
            </GlassCard>
          </View>
        </MotionView>

        {/* Vault Balance */}
        <MotionView delay={210}>
          <GlassCard accent="blue">
            <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '500', marginBottom: 6 }}>Vault Balance</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
              <Text style={{ fontSize: 30, fontWeight: '800', color: '#111111' }}>
                {data.vaultBalance.toFixed(2)}
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#9CA3AF', marginBottom: 4 }}>SOL</Text>
            </View>
          </GlassCard>
        </MotionView>

        {/* Agent Status */}
        <MotionView delay={250}>
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {data.agentStatus === 'Active' ? (
                  <PulsingDot />
                ) : (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#9CA3AF' }} />
                )}
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#111111' }}>
                    AI Agent
                  </Text>
                  <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
                    {data.agentStatus === 'Active' ? 'Running · scanning markets' : 'Idle · waiting for signal'}
                  </Text>
                </View>
              </View>
              <View style={{
                backgroundColor: data.agentStatus === 'Active' ? '#ECFDF5' : '#F3F4F6',
                borderRadius: 20,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: data.agentStatus === 'Active' ? '#10B981' : '#6B7280', letterSpacing: 0.5 }}>
                  {data.agentStatus === 'Active' ? 'ACTIVE' : 'IDLE'}
                </Text>
              </View>
            </View>
          </GlassCard>
        </MotionView>

        {/* Latest AI Decision */}
        {data.latestDecision ? (
          <MotionView delay={290}>
            <GlassCard accent={actionAccent(data.latestDecision.action) as any}>
              <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '500', marginBottom: 10 }}>Latest AI Decision</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: actionColor(data.latestDecision.action) + '18',
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                }}>
                  <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: actionColor(data.latestDecision.action) }} />
                  <Text style={{ fontSize: 14, fontWeight: '800', color: actionColor(data.latestDecision.action), letterSpacing: 1 }}>
                    {data.latestDecision.action}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 11, color: '#9CA3AF' }}>Confidence</Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#111111' }}>
                    {data.latestDecision.confidence}%
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 18 }}>
                {data.latestDecision.explanation}
              </Text>
              <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>
                {new Date(data.latestDecision.timestamp).toLocaleTimeString()} · SOL ${data.latestDecision.price.toFixed(2)}
              </Text>
            </GlassCard>
          </MotionView>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}
