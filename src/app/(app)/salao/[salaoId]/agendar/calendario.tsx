"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, format, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Slot } from "@/services/agendamentos/disponibilidade.service";

const DIAS_VISIVEIS = 14;

function proximosDias() {
  const hoje = new Date();
  return Array.from({ length: DIAS_VISIVEIS }, (_, i) => addDays(hoje, i));
}

export function Calendario({
  salaoId,
  servicoId,
  servicoNome,
  duracaoMin,
}: {
  salaoId: string;
  servicoId: string;
  servicoNome: string;
  duracaoMin: number;
}) {
  const router = useRouter();
  const dias = proximosDias();
  const [diaSelecionado, setDiaSelecionado] = useState(dias[0]);
  const [pagina, setPagina] = useState(0);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [carregando, setCarregando] = useState(true);

  const diasVisiveis = dias.slice(pagina * 7, pagina * 7 + 7);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setSlots(null);

    const dataStr = format(diaSelecionado, "yyyy-MM-dd");
    fetch(`/api/saloes/${salaoId}/disponibilidade?data=${dataStr}&servicoId=${servicoId}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelado) setSlots(json.slots ?? []);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [salaoId, servicoId, diaSelecionado]);

  function selecionarHorario(horario: string) {
    const dataHora = `${format(diaSelecionado, "yyyy-MM-dd")}T${horario}:00`;
    const params = new URLSearchParams({ servicoId, dataHora });
    router.push(`/salao/${salaoId}/agendar/confirmar?${params.toString()}`);
  }

  return (
    <div className="mt-6">
      <p className="text-sm text-muted-foreground">
        Agendando: <span className="font-medium text-foreground">{servicoNome}</span> ({duracaoMin} min)
      </p>

      <div className="mt-4 flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Dias anteriores"
          disabled={pagina === 0}
          onClick={() => setPagina((p) => p - 1)}
        >
          <ChevronLeft aria-hidden />
        </Button>

        <div className="grid flex-1 grid-cols-7 gap-1.5">
          {diasVisiveis.map((dia) => {
            const selecionado = format(dia, "yyyy-MM-dd") === format(diaSelecionado, "yyyy-MM-dd");
            return (
              <button
                key={dia.toISOString()}
                type="button"
                onClick={() => setDiaSelecionado(dia)}
                className={`flex flex-col items-center rounded-lg border px-1 py-2 text-xs transition-colors ${
                  selecionado
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-accent"
                }`}
              >
                <span className="font-medium capitalize">{format(dia, "EEE", { locale: ptBR })}</span>
                <span>{format(dia, "dd/MM")}</span>
                {isToday(dia) && <span className="mt-0.5 text-[10px] opacity-80">Hoje</span>}
              </button>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Próximos dias"
          disabled={(pagina + 1) * 7 >= DIAS_VISIVEIS}
          onClick={() => setPagina((p) => p + 1)}
        >
          <ChevronRight aria-hidden />
        </Button>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold">Horários disponíveis</h2>

        {carregando && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Carregando horários...
          </p>
        )}

        {!carregando && slots?.length === 0 && (
          <p className="text-sm text-muted-foreground">O salão não funciona neste dia.</p>
        )}

        {!carregando && slots && slots.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {slots.map((slot) => (
              <Button
                key={slot.horario}
                type="button"
                variant={slot.ocupado ? "outline" : "outline"}
                disabled={slot.ocupado}
                aria-label={slot.ocupado ? `${slot.horario}, indisponível` : `${slot.horario}, disponível`}
                className={slot.ocupado ? "bg-muted text-muted-foreground line-through" : ""}
                onClick={() => selecionarHorario(slot.horario)}
              >
                {slot.horario}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
