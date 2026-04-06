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
  const variantClass =
    variant === 'primary'
      ? 'bg-[#111111] border-[#111111]'
      : variant === 'danger'
        ? 'bg-[#E5E5E5] border-[#A1A1AA]'
        : 'bg-transparent border-[#7C7C7C]';

  const textClass =
    variant === 'primary' ? 'text-white' : 'text-zinc-900';

  return (
    <Pressable
      className={`border px-4 py-3 rounded-none ${variantClass} ${disabled ? 'opacity-50' : 'opacity-100'}`}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.985 : 1 }] }]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : '#111827'} />
      ) : (
        <Text className={`text-center font-semibold text-base ${textClass}`}>{label}</Text>
      )}
    </Pressable>
  );
}
