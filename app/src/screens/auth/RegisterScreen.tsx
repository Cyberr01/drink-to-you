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

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const { colors } = useAppTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isSlow = useSlowHint(isLoading);

  function validate() {
    if (name.trim().length < 2) return 'Informe seu nome.';
    if (!EMAIL_PATTERN.test(email.trim())) return 'Informe um e-mail válido.';
    if (password.length < 6) return 'A senha deve ter pelo menos 6 caracteres.';
    if (password !== confirmation) return 'As senhas não conferem.';
    return null;
  }

  async function handleRegister() {
    const validationError = validate();
    setError(validationError);
    if (validationError) return;

    setIsLoading(true);
    try {
      await signUp(name.trim(), email.trim().toLowerCase(), password);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Erro inesperado.');
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout>
      <BrandHeader subtitle="Crie sua conta e comece a se hidratar melhor." />
      <TextInput label="Nome" mode="outlined" value={name} onChangeText={setName} left={<TextInput.Icon icon="account-outline" />} />
      <TextInput
        label="E-mail"
        mode="outlined"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.field}
        left={<TextInput.Icon icon="email-outline" />}
      />
      <TextInput
        label="Senha"
        mode="outlined"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.field}
        left={<TextInput.Icon icon="lock-outline" />}
      />
      <TextInput
        label="Confirmar senha"
        mode="outlined"
        secureTextEntry
        value={confirmation}
        onChangeText={setConfirmation}
        style={styles.field}
        left={<TextInput.Icon icon="lock-check-outline" />}
      />
      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>
      <Button mode="contained" onPress={handleRegister} loading={isLoading} disabled={isLoading} contentStyle={styles.buttonContent}>
        Criar conta
      </Button>
      {isSlow ? (
        <Text style={[styles.hint, { color: colors.muted }]}>
          Acordando o servidor… isso pode levar até 1 minuto na primeira vez. ☕
        </Text>
      ) : null}
      <Button onPress={() => navigation.goBack()} style={styles.link}>
        Já tenho conta
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
