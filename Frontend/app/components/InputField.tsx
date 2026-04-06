import { Text, TextInput, View } from 'react-native';
import { useAppContext } from '../providers/AppProvider';

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
  const {
    settings: { theme },
  } = useAppContext();

  return (
    <View className="mb-3">
      <Text className={`mb-2 text-sm font-medium ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        placeholder={label}
        placeholderTextColor={theme === 'dark' ? '#A1A1AA' : '#71717A'}
        className={`border px-4 py-3 rounded-none ${
          theme === 'dark'
            ? 'bg-[#18181B] border-[#3F3F46] text-white'
            : 'bg-[#EFEFEF] border-[#A3A3A3] text-zinc-900'
        }`}
      />
    </View>
  );
}
