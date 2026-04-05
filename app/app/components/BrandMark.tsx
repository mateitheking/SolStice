import { Text, View } from 'react-native';
import { useAppContext } from '../providers/AppProvider';

type BrandMarkProps = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: BrandMarkProps) {
  const {
    settings: { theme },
  } = useAppContext();

  return (
    <View className="flex-row items-center gap-2">
      <View className={`border ${theme === 'dark' ? 'border-zinc-200' : 'border-zinc-900'} ${compact ? 'h-8 w-12' : 'h-10 w-14'}`}>
        <View className="h-full w-1/2 bg-[#8BF4D5]" />
      </View>
      <Text className={`font-bold tracking-tight ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'} ${compact ? 'text-sm' : 'text-base'}`}>
        web3tech
      </Text>
    </View>
  );
}
