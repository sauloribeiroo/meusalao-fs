"use client";

import { useId, useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type DiaHorario = {
  chave: "SEGUNDA" | "TERCA" | "QUARTA" | "QUINTA" | "SEXTA" | "SABADO" | "DOMINGO";
  rotulo: string;
  horaAbertura: string;
  horaFechamento: string;
  ativo: boolean;
};

export const DIAS_UTEIS: DiaHorario["chave"][] = ["SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA"];

export const DIAS_PADRAO: DiaHorario[] = [
  { chave: "SEGUNDA", rotulo: "Segunda", horaAbertura: "09:00", horaFechamento: "18:00", ativo: true },
  { chave: "TERCA", rotulo: "Terça", horaAbertura: "09:00", horaFechamento: "18:00", ativo: true },
  { chave: "QUARTA", rotulo: "Quarta", horaAbertura: "09:00", horaFechamento: "18:00", ativo: true },
  { chave: "QUINTA", rotulo: "Quinta", horaAbertura: "09:00", horaFechamento: "18:00", ativo: true },
  { chave: "SEXTA", rotulo: "Sexta", horaAbertura: "09:00", horaFechamento: "18:00", ativo: true },
  { chave: "SABADO", rotulo: "Sábado", horaAbertura: "09:00", horaFechamento: "13:00", ativo: true },
  { chave: "DOMINGO", rotulo: "Domingo", horaAbertura: "09:00", horaFechamento: "13:00", ativo: false },
];

/**
 * Grade dos 7 dias da semana para horário de funcionamento, com campos
 * nomeados `horarios[DIA][campo]` (consumidos por Server Actions via
 * FormData) e um atalho para replicar o horário de segunda nos dias úteis.
 */
export function GradeHorarios({ diasIniciais = DIAS_PADRAO }: { diasIniciais?: DiaHorario[] }) {
  const [dias, setDias] = useState(diasIniciais);

  function atualizarDia(chave: DiaHorario["chave"], campo: keyof DiaHorario, valor: string | boolean) {
    setDias((atual) => atual.map((d) => (d.chave === chave ? { ...d, [campo]: valor } : d)));
  }

  function replicarParaDiasUteis() {
    const segunda = dias.find((d) => d.chave === "SEGUNDA");
    if (!segunda) return;

    setDias((atual) =>
      atual.map((d) =>
        DIAS_UTEIS.includes(d.chave) && d.chave !== "SEGUNDA"
          ? { ...d, horaAbertura: segunda.horaAbertura, horaFechamento: segunda.horaFechamento, ativo: segunda.ativo }
          : d,
      ),
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Horário de funcionamento</span>
        <Button type="button" variant="outline" size="sm" onClick={replicarParaDiasUteis}>
          <Copy aria-hidden />
          Replicar segunda para dias úteis
        </Button>
      </div>

      <div className="space-y-2">
        {dias.map((dia) => (
          <LinhaDia key={dia.chave} dia={dia} aoAlterar={atualizarDia} />
        ))}
      </div>
    </div>
  );
}

function LinhaDia({
  dia,
  aoAlterar,
}: {
  dia: DiaHorario;
  aoAlterar: (chave: DiaHorario["chave"], campo: keyof DiaHorario, valor: string | boolean) => void;
}) {
  const idBase = useId();

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
      <label className="flex w-28 shrink-0 items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name={`horarios[${dia.chave}][ativo]`}
          checked={dia.ativo}
          onChange={(e) => aoAlterar(dia.chave, "ativo", e.target.checked)}
          className="size-4 rounded border-input"
        />
        {dia.rotulo}
      </label>

      <div className="flex items-center gap-2">
        <Label htmlFor={`${idBase}-abertura`} className="sr-only">
          Abertura em {dia.rotulo}
        </Label>
        <Input
          id={`${idBase}-abertura`}
          name={`horarios[${dia.chave}][horaAbertura]`}
          type="time"
          value={dia.horaAbertura}
          onChange={(e) => aoAlterar(dia.chave, "horaAbertura", e.target.value)}
          className="h-9 w-32"
        />
        <span className="text-sm text-muted-foreground">às</span>
        <Label htmlFor={`${idBase}-fechamento`} className="sr-only">
          Fechamento em {dia.rotulo}
        </Label>
        <Input
          id={`${idBase}-fechamento`}
          name={`horarios[${dia.chave}][horaFechamento]`}
          type="time"
          value={dia.horaFechamento}
          onChange={(e) => aoAlterar(dia.chave, "horaFechamento", e.target.value)}
          className="h-9 w-32"
        />
      </div>
    </div>
  );
}
