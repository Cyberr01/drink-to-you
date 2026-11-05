import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthLayout } from '../../components/common/AuthLayout';
import { BrandHeader } from '../../components/common/BrandHeader';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useAuth } from '../../hooks/useAuth';
import { useSlowHint } from '../../hooks/useSlowHint';
import { RootStackParamList } from '../../navigation/types';
import { EMAIL_PATTERN } from '../../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const { colors } = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isSlow = useSlowHint(isLoading);

  function validate() {
    if (!EMAIL_PATTERN.test(email.trim())) return 'Informe um e-mail válido.';
    if (password.length < 6) return 'A senha deve ter pelo menos 6 caracteres.';
    return null;
  }

  async function handleLogin() {
    const validationError = validate();
    setError(validationError);
    if (validationError) return;

    setIsLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Erro inesperado.');
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout>
      <BrandHeader />
      <TextInput
        label="E-mail"
        mode="outlined"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
        left={<TextInput.Icon icon="email-outline" />}
      />
      <TextInput
        label="Senha"
        mode="outlined"
        secureTextEntry={!showPassword}
        value={password}
        onChangeText={setPassword}
        style={styles.field}
        left={<TextInput.Icon icon="lock-outline" />}
        right={
          <TextInput.Icon
            icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
            onPress={() => setShowPassword((current) => !current)}
          />
        }
      />
      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>
      <Button mode="contained" onPress={handleLogin} loading={isLoading} disabled={isLoading} contentStyle={styles.buttonContent}>
        Entrar
      </Button>
      {isSlow ? (
        <Text style={[styles.hint, { color: colors.muted }]}>
          Acordando o servidor… isso pode levar até 1 minuto na primeira vez. ☕
        </Text>
      ) : null}
      <Button onPress={() => navigation.navigate('Register')} style={styles.link}>
        Não tem conta? Cadastre-se
      </Button>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  field: { marginTop: 12 },
  buttonContent: { paddingVertical: 6 },
  hint: { textAlign: 'center', marginTop: 12 },
  link: { marginTop: 8 },
});
