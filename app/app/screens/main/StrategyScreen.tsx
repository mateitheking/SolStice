import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ScrollView, Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { AppScreen } from '../../components/AppScreen';
import { GlassCard } from '../../components/GlassCard';
import { MotionView } from '../../components/MotionView';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useAppContext } from '../../providers/AppProvider';
import { useToast } from '../../providers/ToastProvider';

export function StrategyScreen() {
  const queryClient = useQueryClient();
  const { strategy, setStrategy, deposit, withdraw } = useAppContext();
  const { showToast } = useToast();

  const depositMutation = useMutation({
    mutationFn: () => deposit(1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Deposit successful', 'success');
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: () => withdraw(1),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Withdraw successful', 'info');
    },
  });

  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <MotionView delay={40}>
          <ScreenHeader
            eyebrow="strategy"
            title="Trading Profile"
            subtitle="Strategy selection is wired to app state. Vault actions are demo-mode until wallet signing is added."
          />
        </MotionView>

        <MotionView delay={110}>
          <GlassCard>
            <Text className="text-base mb-3 text-zinc-700">Choose strategy</Text>

            <View className="flex-row gap-3 mb-3">
              <View className="flex-1">
                <AppButton
                  label="Conservative"
                  onPress={() => setStrategy('Conservative')}
                  variant={strategy === 'Conservative' ? 'primary' : 'secondary'}
                />
              </View>
              <View className="flex-1">
                <AppButton
                  label="Aggressive"
                  onPress={() => setStrategy('Aggressive')}
                  variant={strategy === 'Aggressive' ? 'primary' : 'secondary'}
                />
              </View>
            </View>

            <Text className="text-zinc-600">
              Active strategy: <Text className="text-emerald-600 font-semibold">{strategy}</Text>
            </Text>
          </GlassCard>
        </MotionView>

        <MotionView delay={180}>
          <GlassCard>
            <Text className="mb-3 text-zinc-700">Vault operations</Text>
            <View className="gap-3">
              <AppButton label="Deposit 1 SOL" onPress={() => depositMutation.mutate()} loading={depositMutation.isPending} />
              <AppButton
                label="Withdraw 1 SOL"
                onPress={() => withdrawMutation.mutate()}
                loading={withdrawMutation.isPending}
                variant="secondary"
              />
            </View>
          </GlassCard>
        </MotionView>
      </ScrollView>
    </AppScreen>
  );
}
