import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { AppScreen } from '../../components/AppScreen';
import { GlassCard } from '../../components/GlassCard';
import { InputField } from '../../components/InputField';
import { MotionView } from '../../components/MotionView';
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
      <View style={{ flex: 1, justifyContent: 'center' }}>

        {/* Brand header */}
        <MotionView delay={30}>
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View style={{
              width: 64, height: 64, borderRadius: 18,
              backgroundColor: '#111111',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}>
              <View style={{ width: 28, height: 28, borderRadius: 4, overflow: 'hidden', flexDirection: 'row' }}>
                <View style={{ flex: 1, backgroundColor: '#8BF4D5' }} />
                <View style={{ flex: 1, backgroundColor: '#111111' }} />
              </View>
            </View>
            <Text style={{ fontSize: 26, fontWeight: '800', color: '#111111', letterSpacing: -0.5 }}>
              web3tech
            </Text>
            <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>
              AI-powered SOL trading agent
            </Text>
          </View>
        </MotionView>

        <MotionView delay={120}>
          <GlassCard>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111111', marginBottom: 16 }}>
              Sign in
            </Text>
            <InputField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
            <InputField label="Password" value={password} onChangeText={setPassword} secureTextEntry />

            <View style={{ gap: 10, marginTop: 8 }}>
              <AppButton label="Sign In" onPress={handleLogin} loading={authLoading} />
              <AppButton label="Create Account" onPress={() => navigation.navigate('Register')} variant="secondary" />
              <AppButton label="Continue as Guest" onPress={handleGuest} variant="secondary" />
            </View>

            {authLoading ? <ActivityIndicator color="#10B981" style={{ marginTop: 12 }} /> : null}
          </GlassCard>
        </MotionView>

        <MotionView delay={220}>
          <Text style={{ textAlign: 'center', fontSize: 11, color: '#D1D5DB', marginTop: 20 }}>
            Demo: demo@trading.app / demo123
          </Text>
        </MotionView>
      </View>
    </AppScreen>
  );
}
