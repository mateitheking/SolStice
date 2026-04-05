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
    <View className="mb-6 pb-4" style={{ borderBottomWidth: 1, borderBottomColor: theme === 'dark' ? '#2C2C2E' : '#E9E9EC' }}>
      {eyebrow ? (
        <View className="flex-row items-center gap-2 mb-2">
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
            }}
          >
            {eyebrow}
          </Text>
        </View>
      ) : null}
      <Text
        style={{
          fontSize: 28,
          fontWeight: '800',
          letterSpacing: -0.5,
          color: theme === 'dark' ? '#F4F4F5' : '#111111',
          marginBottom: subtitle ? 4 : 0,
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={{
            fontSize: 13,
            lineHeight: 18,
            color: theme === 'dark' ? '#71717A' : '#6B7280',
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
