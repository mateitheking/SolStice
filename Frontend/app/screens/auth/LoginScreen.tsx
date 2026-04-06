import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { AppScreen } from '../../components/AppScreen';
import { GlassCard } from '../../components/GlassCard';
import { InputField } from '../../components/InputField';
import { MotionView } from '../../components/MotionView';
import { ScreenHeader } from '../../components/ScreenHeader';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { useAppContext } from '../../providers/AppProvider';
import { useToast } from '../../providers/ToastProvider';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login, continueAsGuest, authLoading } = useAppContext();
  const { showToast } = useToast();

  const [email, setEmail] = useState('demo@trading.app');
  const [password, setPassword] = useState('demo123');

  const handleLogin = async () => {
    try {
      await login(email.trim(), password);
      showToast('Welcome back', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      showToast(message, 'error');
    }
  };

  const handleGuest = async () => {
    await continueAsGuest();
    showToast('Logged in as guest', 'info');
  };

  return (
    <AppScreen>
      <View className="flex-1 justify-center">
        <MotionView delay={50}>
          <ScreenHeader
            eyebrow="access"
            title="AI Trading Control"
            subtitle="Авторизация для доступа к стратегии, журналу решений и кошельку."
          />
        </MotionView>

        <MotionView delay={140}>
          <GlassCard>
            <InputField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
            <InputField label="Password" value={password} onChangeText={setPassword} secureTextEntry />

            <View className="gap-3 mt-2">
              <AppButton label="Login" onPress={handleLogin} loading={authLoading} />
              <AppButton label="Register" onPress={() => navigation.navigate('Register')} variant="secondary" />
              <AppButton label="Continue as Guest" onPress={handleGuest} variant="secondary" />
            </View>

            {authLoading ? <ActivityIndicator color="#0F172A" className="mt-4" /> : null}
          </GlassCard>
        </MotionView>
      </View>
    </AppScreen>
  );
}
