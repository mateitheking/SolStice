import { PropsWithChildren } from 'react';
import { View } from 'react-native';

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
  return (
    <View
      className={`px-4 py-4 mb-3 rounded-2xl overflow-hidden bg-[#111827CC] border border-[#334155] ${className}`}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 5,
        borderLeftWidth: accent !== 'none' ? 3 : undefined,
        borderLeftColor: accent !== 'none' ? accentColors[accent] : undefined,
      }}
    >
      {children}
    </View>
  );
}
