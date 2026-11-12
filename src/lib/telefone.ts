/** Quantidade máxima de dígitos de um telefone brasileiro com DDD (celular). */
const DIGITOS_MAXIMOS = 11;

/**
 * Formata o telefone enquanto a pessoa digita, aceitando fixo e celular:
 * "8532345678" → "(85) 3234-5678" e "85999990000" → "(85) 99999-0000".
 *
 * O resultado sempre passa na validação do cadastro (`novoUsuarioSchema`),
 * que já aceita parênteses, espaço e hífen.
 */
export function mascararTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, DIGITOS_MAXIMOS);

  if (digitos.length === 0) return "";
  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

/** onChange para inputs não controlados: reescreve o valor já formatado. */
export function aoDigitarTelefone(evento: React.ChangeEvent<HTMLInputElement>) {
  evento.currentTarget.value = mascararTelefone(evento.currentTarget.value);
}
