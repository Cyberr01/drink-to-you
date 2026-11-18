const DEFAULT_ERROR_MESSAGE = 'Erro inesperado.';

/** Extrai uma mensagem amigável de qualquer erro capturado em um bloco try/catch. */
export function getErrorMessage(caught: unknown, fallback = DEFAULT_ERROR_MESSAGE) {
  return caught instanceof Error ? caught.message : fallback;
}
