import React, { useState } from 'react';
import { Button, Dialog, HelperText, TextInput } from 'react-native-paper';
import { challengeService } from '../../services/challengeService';
import { feedback } from '../../services/feedback';
import { ChallengeSummary } from '../../types';
import { getErrorMessage } from '../../utils/errors';

const MIN_CODE_LENGTH = 4;

interface JoinChallengeDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onJoined: (challenge: ChallengeSummary) => Promise<void> | void;
}

/** Diálogo para entrar em uma sala existente informando o código de convite. */
export function JoinChallengeDialog({ visible, onDismiss, onJoined }: JoinChallengeDialogProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  async function handleJoin() {
    const trimmed = code.trim();
    if (trimmed.length < MIN_CODE_LENGTH) {
      setError('Informe o código da sala (ex.: AGUA-DEMO).');
      return;
    }
    setIsJoining(true);
    setError(null);
    try {
      const joined = await challengeService.join(trimmed);
      feedback.success();
      setCode('');
      await onJoined(joined);
    } catch (caught) {
      setError(getErrorMessage(caught, 'Erro ao entrar na sala.'));
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <Dialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>Entrar em Sala de Desafio</Dialog.Title>
      <Dialog.Content>
        <TextInput
          label="Código do convite"
          placeholder="Ex.: AGUA-DEMO"
          mode="outlined"
          autoCapitalize="characters"
          value={code}
          onChangeText={setCode}
        />
        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Cancelar</Button>
        <Button onPress={handleJoin} loading={isJoining} disabled={isJoining}>
          Entrar
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}
