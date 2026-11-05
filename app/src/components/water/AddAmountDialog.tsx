import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, Dialog, HelperText, Portal, TextInput } from 'react-native-paper';

const MAX_AMOUNT_ML = 5000;

interface AddAmountDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: (amountMl: number, note: string) => Promise<void>;
}

export function AddAmountDialog({ visible, onDismiss, onConfirm }: AddAmountDialogProps) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function reset() {
    setAmount('');
    setNote('');
    setError(null);
  }

  function handleDismiss() {
    reset();
    onDismiss();
  }

  async function handleConfirm() {
    const amountMl = Number(amount);
    if (!Number.isInteger(amountMl) || amountMl < 1 || amountMl > MAX_AMOUNT_ML) {
      setError(`Informe um valor entre 1 e ${MAX_AMOUNT_ML} ml.`);
      return;
    }
    setIsSaving(true);
    try {
      await onConfirm(amountMl, note.trim());
      reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Erro inesperado.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleDismiss}>
        <Dialog.Title>Quanto você bebeu?</Dialog.Title>
        <Dialog.Content>
          <TextInput
            label="Quantidade (ml)"
            mode="outlined"
            keyboardType="number-pad"
            value={amount}
            onChangeText={setAmount}
            error={!!error}
            autoFocus
          />
          <HelperText type="error" visible={!!error}>
            {error}
          </HelperText>
          <TextInput
            label="Observação (opcional)"
            mode="outlined"
            value={note}
            onChangeText={setNote}
            maxLength={200}
            style={styles.note}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={handleDismiss}>Cancelar</Button>
          <Button onPress={handleConfirm} loading={isSaving} disabled={isSaving}>
            Adicionar
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  note: { marginTop: 4 },
});
