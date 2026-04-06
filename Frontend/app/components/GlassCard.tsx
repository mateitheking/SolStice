import { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { useAppContext } from '../providers/AppProvider';

type GlassCardProps = PropsWithChildren<{
  className?: string;
}>;

export function GlassCard({ children, className = '' }: GlassCardProps) {
  const {
    settings: { theme },
  } = useAppContext();

  return (
    <View
      className={`border px-4 py-4 mb-3 ${
        theme === 'dark'
          ? 'bg-[#1D1D1D] border-[#3F3F46]'
          : 'bg-[#F7F7F7] border-[#B8B8B8]'
      } rounded-none ${className}`}
    >
      {children}
    </View>
  );
}
