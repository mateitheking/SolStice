import { ActivityIndicator, FlatList, Linking, Pressable, Text } from 'react-native';
import { AppScreen } from '../../components/AppScreen';
import { EmptyState } from '../../components/EmptyState';
import { GlassCard } from '../../components/GlassCard';
import { MotionView } from '../../components/MotionView';
import { ScreenHeader } from '../../components/ScreenHeader';
import { usePublicNews } from '../../hooks/usePublicNews';
import { useToast } from '../../providers/ToastProvider';

export function NewsScreen() {
  const { data, isLoading, refetch } = usePublicNews();
  const { showToast } = useToast();

  const openUrl = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);

    if (!canOpen) {
      showToast('Cannot open this news link', 'error');
      return;
    }

    await Linking.openURL(url);
  };

  if (isLoading) {
    return (
      <AppScreen>
        <MotionView>
          <ScreenHeader
            eyebrow="public"
            title="News"
            subtitle="Актуальные новости по AI trading и web3 рынку."
          />
        </MotionView>
        <ActivityIndicator color="#111111" className="mt-6" />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <MotionView delay={50}>
        <ScreenHeader
          eyebrow="public"
          title="News"
          subtitle="Актуальные новости по AI trading и web3 рынку."
        />
      </MotionView>

      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        onRefresh={refetch}
        refreshing={isLoading}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState title="No news yet" subtitle="News feed will appear soon." />}
        renderItem={({ item, index }) => (
          <MotionView delay={90 + index * 40}>
            <GlassCard>
              <Text className="text-[11px] uppercase tracking-[1.4px] text-zinc-500 mb-1">{item.source}</Text>
              <Text className="text-lg font-semibold text-zinc-900 mb-2">{item.title}</Text>
              <Text className="text-zinc-700 mb-3 leading-5">{item.summary}</Text>
              <Text className="text-zinc-500 text-xs mb-3">{new Date(item.publishedAt).toLocaleString()}</Text>
              <Pressable
                onPress={() => openUrl(item.url)}
                className="border border-zinc-800 px-3 py-2 self-start rounded-none"
              >
                <Text className="text-zinc-900 font-semibold">Read Source</Text>
              </Pressable>
            </GlassCard>
          </MotionView>
        )}
      />
    </AppScreen>
  );
}
