import { ActivityIndicator, Pressable, Text } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
};

export function AppButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}: AppButtonProps) {
  const bgStyle =
    variant === 'primary'
      ? { backgroundColor: '#2563EB', borderColor: '#1D4ED8', borderWidth: 1 }
      : variant === 'danger'
        ? { backgroundColor: '#450A0A', borderColor: '#7F1D1D', borderWidth: 1 }
        : { backgroundColor: '#0F172A', borderColor: '#334155', borderWidth: 1 };

  const textColor =
    variant === 'primary' ? '#FFFFFF' : variant === 'danger' ? '#FCA5A5' : '#CBD5E1';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          borderRadius: 14,
          paddingVertical: 13,
          paddingHorizontal: 16,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : pressed ? 0.82 : 1,
          transform: [{ scale: pressed ? 0.977 : 1 }],
          ...bgStyle,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : '#CBD5E1'} />
      ) : (
        <Text style={{ color: textColor, fontWeight: '700', fontSize: 15 }}>{label}</Text>
      )}
    </Pressable>
  );
}
