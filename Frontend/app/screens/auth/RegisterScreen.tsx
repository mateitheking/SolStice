import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { AppScreen } from '../../components/AppScreen';
import { GlassCard } from '../../components/GlassCard';
import { InputField } from '../../components/InputField';
import { MotionView } from '../../components/MotionView';
import { ScreenHeader } from '../../components/ScreenHeader';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { useAppContext } from '../../providers/AppProvider';
import { useToast } from '../../providers/ToastProvider';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { register, authLoading } = useAppContext();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    if (!email || !password) {
      showToast('Fill email and password', 'error');
      return;
    }

    try {
      await register(email.trim(), password);
      showToast('Account created', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      showToast(message, 'error');
    }
  };

  return (
    <AppScreen>
      <View className="flex-1 justify-center">
        <MotionView delay={60}>
          <ScreenHeader
            eyebrow="onboarding"
            title="Create Account"
            subtitle="Сохраним сессию и настройки на устройстве."
          />
        </MotionView>

        <MotionView delay={140}>
          <GlassCard>
            <InputField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
            <InputField label="Password" value={password} onChangeText={setPassword} secureTextEntry />

            <View className="gap-3 mt-2">
              <AppButton label="Register" onPress={handleRegister} loading={authLoading} />
              <AppButton label="Back to Login" onPress={() => navigation.goBack()} variant="secondary" />
            </View>
          </GlassCard>
        </MotionView>
      </View>
    </AppScreen>
  );
}
