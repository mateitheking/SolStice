import { Text, View } from 'react-native';
import { useAppContext } from '../providers/AppProvider';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
};

export function ScreenHeader({ title, subtitle, eyebrow }: ScreenHeaderProps) {
  const {
    settings: { theme },
  } = useAppContext();

  return (
    <View className="mb-5 border-b border-zinc-300 pb-3">
      {eyebrow ? (
        <Text className={`text-[11px] uppercase tracking-[2.2px] mb-2 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
          {eyebrow}
        </Text>
      ) : null}
      <Text className={`text-[30px] font-bold mb-1 ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>
        {title}
      </Text>
      {subtitle ? (
        <Text className={`leading-5 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-600'}`}>{subtitle}</Text>
      ) : null}
    </View>
  );
}
