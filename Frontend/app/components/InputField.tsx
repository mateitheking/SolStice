import { Text, TextInput, View } from 'react-native';

type InputFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

export function InputField({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  autoCapitalize = 'none',
}: InputFieldProps) {
  return (
    <View className="mb-3">
      <Text className="mb-2 text-sm font-medium text-slate-300">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        placeholder={label}
        placeholderTextColor="#64748B"
        className="border px-4 py-3 rounded-xl bg-[#0F172A] border-[#334155] text-white"
      />
    </View>
  );
}
