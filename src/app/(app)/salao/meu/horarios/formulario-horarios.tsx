"use client";

import { useActionState, useState } from "react";
import { Copy, Save } from "lucide-react";
import { salvarHorariosAction, type EstadoHorarios } from "@/acoes/horarios";
import { AlertaErro } from "@/components/ui/alerta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Dia = "DOM" | "SEG" | "TER" | "QUA" | "QUI" | "SEX" | "SAB";

export type HorarioDoDia = {
  diaSemana: Dia;
  horaAbertura: string;
  horaFechamento: string;
  ativo: boolean;
};

const DIAS: { codigo: Dia; nome: string }[] = [
  { codigo: "DOM", nome: "Domingo" },
  { codigo: "SEG", nome: "Segunda" },
  { codigo: "TER", nome: "Terça" },
  { codigo: "QUA", nome: "Quarta" },
  { codigo: "QUI", nome: "Quinta" },
  { codigo: "SEX", nome: "Sexta" },
  { codigo: "SAB", nome: "Sábado" },
];

const DIAS_UTEIS: Dia[] = ["SEG", "TER", "QUA", "QUI", "SEX"];

const PADRAO = { aberto: false, abertura: "09:00", fechamento: "18:00" };
const INICIAL: EstadoHorarios = {};

type Linha = { aberto: boolean; abertura: string; fechamento: string };

/** Monta o estado inicial a partir do que já está salvo no banco. */
function estadoInicial(horarios: HorarioDoDia[]): Record<Dia, Linha> {
  const porDia = new Map(horarios.map((h) => [h.diaSemana, h]));

  return Object.fromEntries(
    DIAS.map(({ codigo }) => {
      const salvo = porDia.get(codigo);
      return [
        codigo,
        salvo
          ? { aberto: salvo.ativo, abertura: salvo.horaAbertura, fechamento: salvo.horaFechamento }
          : { ...PADRAO },
      ];
    }),
  ) as Record<Dia, Linha>;
}

/** RF22 — horário de funcionamento por dia, com replicar para os dias úteis. */
export function FormularioHorarios({ horarios }: { horarios: HorarioDoDia[] }) {
  const [estado, acao, salvando] = useActionState(salvarHorariosAction, INICIAL);
  const [linhas, setLinhas] = useState(() => estadoInicial(horarios));

  const alterar = (dia: Dia, campo: keyof Linha, valor: string | boolean) =>
    setLinhas((atual) => ({ ...atual, [dia]: { ...atual[dia], [campo]: valor } }));

  /** Copia segunda-feira para os demais dias úteis. */
  const replicar = () => {
    const base = linhas.SEG;
    setLinhas((atual) => {
      const novo = { ...atual };
      for (const dia of DIAS_UTEIS) novo[dia] = { ...base };
      return novo;
    });
  };

  return (
    <form action={acao} className="space-y-6">
      {estado.mensagem && <AlertaErro>{estado.mensagem}</AlertaErro>}
      {estado.erros?.horarios?.map((erro) => <AlertaErro key={erro}>{erro}</AlertaErro>)}

      <ul className="divide-y divide-border rounded-xl border border-border">
        {DIAS.map(({ codigo, nome }) => {
          const linha = linhas[codigo];

          return (
            <li key={codigo} className="flex flex-wrap items-center gap-x-6 gap-y-3 p-4">
              <div className="flex min-w-36 items-center gap-2.5">
                <input
                  type="checkbox"
                  id={`aberto-${codigo}`}
                  name={`aberto-${codigo}`}
                  checked={linha.aberto}
                  onChange={(e) => alterar(codigo, "aberto", e.target.checked)}
                  className="size-4 rounded border-input accent-primary"
                />
                <Label htmlFor={`aberto-${codigo}`} className="cursor-pointer font-medium">
                  {nome}
                </Label>
              </div>

              {linha.aberto ? (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`abertura-${codigo}`} className="text-xs text-muted-foreground">
                      Abre
                    </Label>
                    <Input
                      type="time"
                      id={`abertura-${codigo}`}
                      name={`abertura-${codigo}`}
                      value={linha.abertura}
                      onChange={(e) => alterar(codigo, "abertura", e.target.value)}
                      required
                      className="w-32"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`fechamento-${codigo}`} className="text-xs text-muted-foreground">
                      Fecha
                    </Label>
                    <Input
                      type="time"
                      id={`fechamento-${codigo}`}
                      name={`fechamento-${codigo}`}
                      value={linha.fechamento}
                      onChange={(e) => alterar(codigo, "fechamento", e.target.value)}
                      required
                      className="w-32"
                    />
                  </div>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Fechado</span>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={salvando}>
          <Save aria-hidden />
          {salvando ? "Salvando..." : "Salvar horários"}
        </Button>

        <Button type="button" variant="outline" onClick={replicar}>
          <Copy aria-hidden />
          Replicar segunda para os dias úteis
        </Button>

        <p aria-live="polite" className="text-sm text-emerald-700">
          {estado.sucesso ? "Horários salvos." : ""}
        </p>
      </div>
    </form>
  );
}
