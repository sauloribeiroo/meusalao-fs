import type { DiaSemana } from "@prisma/client";

/**
 * Conversões de data e hora usadas pela agenda. Node/TS puro, sem Next.
 *
 * O salão informa horário local ("09:00"); o banco guarda instantes (UTC). Para
 * a conversão ser determinística — igual na máquina do dev, na Vercel e no
 * navegador do cliente — fixamos o fuso do salão em UTC-3 (America/Fortaleza,
 * que não tem horário de verão) em vez de depender do relógio do servidor.
 *
 * Quando o produto atender outras regiões, isto vira uma coluna `fuso` no Salao.
 */
export const FUSO_SALAO = "-03:00";

/** Índice de Date.getUTCDay() → enum do Prisma. */
const DIAS: DiaSemana[] = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];

const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;
const FORMATO_HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const dataValida = (data: string): boolean => FORMATO_DATA.test(data) && !Number.isNaN(Date.parse(data));
export const horaValida = (hora: string): boolean => FORMATO_HORA.test(hora);

/** "09:30" → 570. Assume hora já validada. */
export function minutosDaHora(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

/** 570 → "09:30". */
export function horaDeMinutos(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Dia da semana de uma data local ("2026-10-05" → "SEG").
 * Monta em UTC de propósito: a string já é a data local do salão, então não há
 * conversão de fuso a fazer — só descobrir o dia.
 */
export function diaSemanaDe(data: string): DiaSemana {
  const [ano, mes, dia] = data.split("-").map(Number);
  return DIAS[new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay()];
}

/** Data local + hora local do salão → instante absoluto para gravar no banco. */
export function instanteDe(data: string, hora: string): Date {
  return new Date(`${data}T${hora}:00.000${FUSO_SALAO}`);
}

/** Instante do banco → { data: "2026-10-05", hora: "09:30" } no fuso do salão. */
export function localDe(instante: Date): { data: string; hora: string } {
  // Desloca o instante pelo offset e lê os campos em UTC.
  const deslocado = new Date(instante.getTime() - 3 * 60 * 60 * 1000);
  const iso = deslocado.toISOString();
  return { data: iso.slice(0, 10), hora: iso.slice(11, 16) };
}
