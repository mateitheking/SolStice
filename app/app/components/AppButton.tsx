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
      ? { backgroundColor: '#111111' }
      : variant === 'danger'
        ? { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', borderWidth: 1 }
        : { backgroundColor: 'transparent', borderColor: '#D1D5DB', borderWidth: 1 };

  const textColor =
    variant === 'primary' ? '#FFFFFF' : variant === 'danger' ? '#DC2626' : '#374151';

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
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : '#374151'} />
      ) : (
        <Text style={{ color: textColor, fontWeight: '600', fontSize: 15 }}>{label}</Text>
      )}
    </Pressable>
  );
}
