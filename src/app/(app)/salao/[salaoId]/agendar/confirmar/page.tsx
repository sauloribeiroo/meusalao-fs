import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, MapPin, Scissors, Tag } from "lucide-react";
import { BotaoConfirmar } from "@/app/(app)/salao/[salaoId]/agendar/confirmar/botao-confirmar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { dataPorExtenso, duracaoLegivel, precoEmReais } from "@/lib/formato";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { localDe } from "@/services/horarios/tempo";
import { listarServicosDoSalao } from "@/services/servicos/servicos.service";

export const metadata: Metadata = { title: "Confirmar agendamento | MeuSalão" };

type Props = {
  params: Promise<{ salaoId: string }>;
  searchParams: Promise<{ servicoId?: string; dataHora?: string }>;
};

/** RF16 — revisão antes de confirmar: salão, serviço, dia e horário. */
export default async function ConfirmarPage({ params, searchParams }: Props) {
  const { salaoId } = await params;
  const { servicoId, dataHora } = await searchParams;

  // Sem os dados do slot não há o que revisar — volta para a escolha.
  if (!servicoId || !dataHora || Number.isNaN(Date.parse(dataHora))) notFound();

  const salao = await prisma.salao.findUnique({
    where: { id: salaoId },
    select: { id: true, nome: true, endereco: true, publicado: true },
  });
  if (!salao?.publicado) notFound();

  const servico = (await listarServicosDoSalao(salaoId)).find((item) => item.id === servicoId);
  if (!servico) notFound();

  const { data, hora } = localDe(new Date(dataHora));

  return (
    <>
      <header className="bg-brand-dark">
        <div className="mx-auto max-w-2xl px-6 py-10">
          <h1 className="text-3xl font-black tracking-tight text-white">Confirme seu agendamento</h1>
          <p className="mt-1 text-white/70">Revise os dados antes de confirmar.</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-6 py-8">
        <Card>
          <CardContent className="divide-y divide-border p-0">
            <Linha Icone={MapPin} rotulo="Salão" valor={salao.nome} detalhe={salao.endereco} />
            <Linha
              Icone={Scissors}
              rotulo="Serviço"
              valor={servico.nome}
              detalhe={`${precoEmReais(servico.preco)} · ${duracaoLegivel(servico.duracaoMin)}`}
            />
            <Linha Icone={CalendarDays} rotulo="Dia" valor={dataPorExtenso(data)} inicialMaiuscula />
            <Linha
              Icone={Clock}
              rotulo="Horário"
              valor={hora}
              detalhe={`Previsão de término às ${fimPrevisto(hora, servico.duracaoMin)}`}
            />
            {servico.preco === null && (
              <Linha
                Icone={Tag}
                rotulo="Pagamento"
                valor="Consultar preço"
                detalhe="Este serviço não tem preço publicado. Combine o valor no salão."
              />
            )}
          </CardContent>
        </Card>

        <BotaoConfirmar salaoId={salaoId} servicoId={servicoId} dataHora={dataHora} />

        <Link
          href={`/salao/${salaoId}/agendar?servicoId=${servicoId}`}
          className={buttonVariants({ variant: "ghost", className: "w-full" })}
        >
          Escolher outro horário
        </Link>
      </main>
    </>
  );
}

function Linha({
  Icone,
  rotulo,
  valor,
  detalhe,
  inicialMaiuscula,
}: {
  Icone: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  rotulo: string;
  valor: string;
  detalhe?: string;
  /** Só para a data, que vem em minúsculas do Intl. Nomes próprios não mexem. */
  inicialMaiuscula?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-4">
      <Icone className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{rotulo}</p>
        <p className={cn("font-medium", inicialMaiuscula && "first-letter:uppercase")}>{valor}</p>
        {detalhe && <p className="mt-0.5 text-sm text-muted-foreground">{detalhe}</p>}
      </div>
    </div>
  );
}

/** "10:00" + 90 min → "11:30". */
function fimPrevisto(hora: string, duracaoMin: number): string {
  const [h, m] = hora.split(":").map(Number);
  const total = h * 60 + m + duracaoMin;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
