import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { AppScreen } from '../../components/AppScreen';
import { EmptyState } from '../../components/EmptyState';
import { GlassCard } from '../../components/GlassCard';
import { MotionView } from '../../components/MotionView';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useDecisions } from '../../hooks/useDecisions';
import { DecisionAction } from '../../types';

const actions: Array<DecisionAction | 'ALL'> = ['ALL', 'BUY', 'SELL', 'HOLD'];

export function AILogScreen() {
  const { data, isLoading, refetch } = useDecisions();
  const [filter, setFilter] = useState<DecisionAction | 'ALL'>('ALL');
  const [newestFirst, setNewestFirst] = useState(true);

  const list = useMemo(() => {
    const base = data ?? [];
    const filtered = filter === 'ALL' ? base : base.filter((item) => item.action === filter);
    const sorted = [...filtered].sort((a, b) => {
      const aTime = new Date(a.timestamp).getTime();
      const bTime = new Date(b.timestamp).getTime();
      return newestFirst ? bTime - aTime : aTime - bTime;
    });

    return sorted;
  }, [data, filter, newestFirst]);

  return (
    <AppScreen>
      <MotionView delay={40}>
        <ScreenHeader
          eyebrow="history"
          title="AI Decision Log"
          subtitle="Фильтруй сигналы BUY/SELL/HOLD и анализируй поведение агента."
        />
      </MotionView>

      <MotionView delay={100}>
        <View className="flex-row gap-2 mb-3">
          {actions.map((action) => (
            <Pressable
              key={action}
              className={`px-3 py-2 border rounded-sm ${
                filter === action ? 'bg-[#111111] border-[#111111]' : 'bg-[#EFEFEF] border-[#9CA3AF]'
              }`}
              onPress={() => setFilter(action)}
            >
              <Text className={`text-xs font-semibold ${filter === action ? 'text-white' : 'text-zinc-900'}`}>{action}</Text>
            </Pressable>
          ))}
        </View>
      </MotionView>

      <Pressable className="mb-3" onPress={() => setNewestFirst((prev) => !prev)}>
        <Text className="text-zinc-700 font-semibold">Sort: {newestFirst ? 'Newest first' : 'Oldest first'}</Text>
      </Pressable>

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        refreshing={isLoading}
        onRefresh={refetch}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState title="No data yet" subtitle="No decisions match current filters." />}
        renderItem={({ item, index }) => (
          <MotionView delay={140 + index * 40}>
            <GlassCard>
              <Text className="text-zinc-600 text-xs">{new Date(item.timestamp).toLocaleString()}</Text>
              <View className="flex-row items-center justify-between mt-1 mb-2">
                <Text className="text-zinc-700">Action</Text>
                <Text
                  className={`font-bold ${
                    item.action === 'BUY' ? 'text-emerald-600' : item.action === 'SELL' ? 'text-rose-600' : 'text-zinc-500'
                  }`}
                >
                  {item.action}
                </Text>
              </View>
              <Text className="text-zinc-800 mb-1">{item.explanation}</Text>
              <Text className="text-zinc-700 font-semibold">SOL ${item.price.toFixed(2)}</Text>
            </GlassCard>
          </MotionView>
        )}
      />
    </AppScreen>
  );
}
