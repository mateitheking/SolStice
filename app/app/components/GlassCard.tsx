import { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { useAppContext } from '../providers/AppProvider';

type GlassCardProps = PropsWithChildren<{
  className?: string;
  accent?: 'emerald' | 'rose' | 'amber' | 'blue' | 'none';
}>;

const accentColors: Record<string, string> = {
  emerald: '#10B981',
  rose: '#F43F5E',
  amber: '#F59E0B',
  blue: '#3B82F6',
  none: 'transparent',
};

export function GlassCard({ children, className = '', accent = 'none' }: GlassCardProps) {
  const {
    settings: { theme },
  } = useAppContext();

  return (
    <View
      className={`px-4 py-4 mb-3 rounded-2xl overflow-hidden ${
        theme === 'dark'
          ? 'bg-[#1C1C1E] border border-[#2C2C2E]'
          : 'bg-white border border-[#E9E9EC]'
      } ${className}`}
      style={{
        shadowColor: theme === 'dark' ? '#000' : '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: theme === 'dark' ? 0.4 : 0.06,
        shadowRadius: 8,
        elevation: 3,
        borderLeftWidth: accent !== 'none' ? 3 : undefined,
        borderLeftColor: accent !== 'none' ? accentColors[accent] : undefined,
      }}
    >
      {children}
    </View>
  );
}
