import { Text, View } from 'react-native';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
};

export function ScreenHeader({ title, subtitle, eyebrow }: ScreenHeaderProps) {
  return (
    <View className="mb-6 pb-4" style={{ borderBottomWidth: 1, borderBottomColor: '#334155' }}>
      {eyebrow ? (
        <View className="flex-row items-center gap-2 mb-2">
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#67E8F9' }} />
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: '#94A3B8',
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
          color: '#F8FAFC',
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
            color: '#94A3B8',
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
