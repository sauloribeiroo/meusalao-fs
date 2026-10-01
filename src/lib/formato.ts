/** Formatações de exibição compartilhadas pelas telas. */

const MOEDA = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** RGN06: salão sem preço cadastrado exibe "Consultar preço". */
export const precoEmReais = (preco: number | null): string =>
  preco === null ? "Consultar preço" : MOEDA.format(preco);

/** 90 → "1h30". 60 → "1h". 45 → "45 min". */
export function duracaoLegivel(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;

  if (horas === 0) return `${resto} min`;
  return resto === 0 ? `${horas}h` : `${horas}h${String(resto).padStart(2, "0")}`;
}

/** "2026-10-05" → "segunda-feira, 5 de outubro". */
export function dataPorExtenso(data: string): string {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(ano, mes - 1, dia)));
}

/** "2026-10-05" → "05/10". */
export function dataCurta(data: string): string {
  const [, mes, dia] = data.split("-");
  return `${dia}/${mes}`;
}

const STATUS: Record<string, { rotulo: string; classe: string }> = {
  PENDENTE: { rotulo: "Aguardando confirmação", classe: "bg-amber-100 text-amber-800" },
  CONFIRMADO: { rotulo: "Confirmado", classe: "bg-emerald-100 text-emerald-800" },
  CANCELADO: { rotulo: "Cancelado", classe: "bg-destructive/10 text-destructive" },
  CONCLUIDO: { rotulo: "Concluído", classe: "bg-muted text-muted-foreground" },
};

export const statusLegivel = (status: string) =>
  STATUS[status] ?? { rotulo: status, classe: "bg-muted text-muted-foreground" };
