import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { AppScreen } from '../../components/AppScreen';
import { EmptyState } from '../../components/EmptyState';
import { GlassCard } from '../../components/GlassCard';
import { MotionView } from '../../components/MotionView';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SimpleLineChart } from '../../components/SimpleLineChart';
import { useDashboard } from '../../hooks/useDashboard';

export function DashboardScreen() {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <AppScreen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0F172A" />
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

  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <MotionView delay={40}>
          <ScreenHeader
            eyebrow="overview"
            title="Dashboard"
            subtitle="Ключевые метрики AI-агента и динамика цены SOL."
          />
        </MotionView>

        <MotionView delay={120}>
          <GlassCard>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-zinc-600">SOL Price</Text>
              <Text className="text-2xl font-bold text-zinc-900">${data.solPrice.toFixed(2)}</Text>
            </View>
            <SimpleLineChart values={data.history} />
          </GlassCard>
        </MotionView>

        <MotionView delay={170}>
          <View className="flex-row gap-3">
            <GlassCard className="flex-1">
              <Text className="text-zinc-600 mb-1">Profit / Loss</Text>
              <Text className={`text-2xl font-bold ${data.profitLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {data.profitLoss >= 0 ? '+' : ''}
                {data.profitLoss}%
              </Text>
            </GlassCard>

            <GlassCard className="flex-1">
              <Text className="text-zinc-600 mb-1">Trades</Text>
              <Text className="text-2xl font-bold text-zinc-900">{data.tradesCount}</Text>
            </GlassCard>
          </View>
        </MotionView>

        <MotionView delay={220}>
          <GlassCard>
            <Text className="text-zinc-600 mb-1">Vault Balance</Text>
            <Text className="text-2xl font-bold text-zinc-900">{data.vaultBalance.toFixed(2)} SOL</Text>
          </GlassCard>
        </MotionView>

        <MotionView delay={260}>
          <GlassCard>
            <View className="flex-row items-center gap-2">
              <View className={`h-3 w-3 rounded-full ${data.agentStatus === 'Active' ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
              <Text className="font-medium text-zinc-800">Agent is {data.agentStatus}</Text>
            </View>
          </GlassCard>
        </MotionView>
      </ScrollView>
    </AppScreen>
  );
}
