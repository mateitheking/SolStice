import { Text, View } from 'react-native';
import { useAppContext } from '../providers/AppProvider';

type EmptyStateProps = {
  title: string;
  subtitle: string;
};

export function EmptyState({ title, subtitle }: EmptyStateProps) {
  const {
    settings: { theme },
  } = useAppContext();

  return (
    <View className="items-center justify-center py-10 px-5">
      <Text className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>{title}</Text>
      <Text className={`text-center ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{subtitle}</Text>
    </View>
  );
}
