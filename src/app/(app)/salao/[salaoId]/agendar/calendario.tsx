"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarX, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { AlertaErro } from "@/components/ui/alerta";
import { Button } from "@/components/ui/button";
import { dataCurta, dataPorExtenso } from "@/lib/formato";
import { cn } from "@/lib/utils";

type Slot = { hora: string; dataHora: string; livre: boolean };

type Disponibilidade = {
  funcionamento: { horaAbertura: string; horaFechamento: string } | null;
  slots: Slot[];
};

const DIAS_OFERECIDOS = 21;
const POR_PAGINA = 7;

const NOME_DO_DIA = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });

/**
 * Próximos dias a partir de hoje, como "AAAA-MM-DD" no fuso do salão (UTC-3).
 * Montado a partir do deslocamento, e não do relógio do navegador, para o
 * cliente em outro fuso não ver um dia a mais ou a menos.
 */
function proximosDias(): string[] {
  const agora = new Date();
  const hojeNoSalao = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
  const base = Date.UTC(hojeNoSalao.getUTCFullYear(), hojeNoSalao.getUTCMonth(), hojeNoSalao.getUTCDate());

  return Array.from({ length: DIAS_OFERECIDOS }, (_, i) =>
    new Date(base + i * 86_400_000).toISOString().slice(0, 10),
  );
}

/** RF15 — calendário de dias e horários, marcando o que está ocupado. */
export function Calendario({
  salaoId,
  servicoId,
  salaoNome,
}: {
  salaoId: string;
  servicoId: string;
  salaoNome: string;
}) {
  const router = useRouter();
  const [dias] = useState(proximosDias);
  const [diaSelecionado, setDiaSelecionado] = useState(dias[0]);
  const [pagina, setPagina] = useState(0);
  const [dados, setDados] = useState<Disponibilidade | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const ultimaPagina = Math.ceil(dias.length / POR_PAGINA) - 1;
  const visiveis = dias.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA);

  useEffect(() => {
    const controle = new AbortController();
    setCarregando(true);
    setErro(null);

    const busca = new URLSearchParams({ salaoId, servicoId, data: diaSelecionado });

    fetch(`/api/disponibilidade?${busca}`, { signal: controle.signal })
      .then(async (resposta) => {
        const corpo = await resposta.json();
        if (!resposta.ok) throw new Error(corpo.erro ?? "Não foi possível carregar os horários.");
        setDados(corpo);
      })
      .catch((falha: Error) => {
        if (falha.name === "AbortError") return;
        setDados(null);
        setErro(falha.message);
      })
      .finally(() => {
        if (!controle.signal.aborted) setCarregando(false);
      });

    return () => controle.abort();
  }, [salaoId, servicoId, diaSelecionado]);

  function escolher(slot: Slot) {
    const busca = new URLSearchParams({ servicoId, dataHora: slot.dataHora });
    router.push(`/salao/${salaoId}/agendar/confirmar?${busca}`);
  }

  return (
    <section aria-labelledby="escolha-horario" className="space-y-6">
      <h2 id="escolha-horario" className="text-lg font-semibold">
        Escolha o dia e o horário
      </h2>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Semana anterior"
          disabled={pagina === 0}
          onClick={() => setPagina((p) => p - 1)}
        >
          <ChevronLeft aria-hidden />
        </Button>

        <ul className="grid flex-1 grid-cols-7 gap-1.5">
          {visiveis.map((dia) => {
            const selecionado = dia === diaSelecionado;
            const [ano, mes, numero] = dia.split("-").map(Number);
            const rotuloDia = NOME_DO_DIA.format(new Date(Date.UTC(ano, mes - 1, numero))).replace(".", "");

            return (
              <li key={dia}>
                <button
                  type="button"
                  onClick={() => setDiaSelecionado(dia)}
                  aria-pressed={selecionado}
                  aria-label={dataPorExtenso(dia)}
                  className={cn(
                    "flex w-full flex-col items-center rounded-lg border px-1 py-2.5 text-xs transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    selecionado
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-accent",
                  )}
                >
                  <span className="font-medium capitalize">{rotuloDia}</span>
                  <span className="mt-0.5">{dataCurta(dia)}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Próxima semana"
          disabled={pagina >= ultimaPagina}
          onClick={() => setPagina((p) => p + 1)}
        >
          <ChevronRight aria-hidden />
        </Button>
      </div>

      <div aria-live="polite" aria-busy={carregando}>
        {/* first-letter, e não capitalize: "quinta-feira, 1 de outubro" deve
            virar "Quinta-feira, 1 de outubro", não "Quinta-Feira, 1 De Outubro". */}
        <p className="mb-3 text-sm font-medium first-letter:uppercase">{dataPorExtenso(diaSelecionado)}</p>

        {carregando && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Carregando horários...
          </p>
        )}

        {!carregando && erro && <AlertaErro>{erro}</AlertaErro>}

        {!carregando && !erro && dados?.funcionamento === null && (
          <p className="flex items-center gap-2 rounded-lg bg-muted px-4 py-6 text-sm text-muted-foreground">
            <CalendarX className="size-4 shrink-0" aria-hidden />
            {salaoNome} não abre neste dia. Escolha outra data.
          </p>
        )}

        {!carregando && !erro && dados?.funcionamento && (
          <>
            <p className="mb-3 text-xs text-muted-foreground">
              Aberto das {dados.funcionamento.horaAbertura} às {dados.funcionamento.horaFechamento}
            </p>

            {dados.slots.every((slot) => !slot.livre) ? (
              <p className="rounded-lg bg-muted px-4 py-6 text-sm text-muted-foreground">
                Não há mais horários livres neste dia.
              </p>
            ) : (
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {dados.slots.map((slot) => (
                  <li key={slot.hora}>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn("w-full", !slot.livre && "line-through opacity-60")}
                      disabled={!slot.livre}
                      aria-label={`${slot.hora}, ${slot.livre ? "disponível" : "indisponível"}`}
                      onClick={() => escolher(slot)}
                    >
                      {slot.hora}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  );
}
