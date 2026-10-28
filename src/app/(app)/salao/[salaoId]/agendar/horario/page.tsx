import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Calendario } from "@/app/(app)/salao/[salaoId]/agendar/calendario";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { duracaoLegivel, precoEmReais } from "@/lib/formato";
import { ErroNaoEncontrado } from "@/services/erros";
import { buscarPerfilPublico } from "@/services/saloes/saloes.service";

export const metadata: Metadata = { title: "Escolher horário | MeuSalão" };

/** RF15 — escolha do horário para o serviço já selecionado. */
export default async function EscolherHorarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ salaoId: string }>;
  searchParams: Promise<{ servicoId?: string }>;
}) {
  const { salaoId } = await params;
  const { servicoId } = await searchParams;

  const salao = await buscarPerfilPublico(salaoId).catch((erro) => {
    if (erro instanceof ErroNaoEncontrado) notFound();
    throw erro;
  });

  // Serviço ausente ou de outro salão volta para a escolha, em vez de dar erro:
  // o caminho certo está a um passo, e não há nada que o cliente precise corrigir.
  const escolhido = salao.servicos.find((servico) => servico.id === servicoId);
  if (!escolhido) redirect(`/salao/${salaoId}/agendar`);

  return (
    <>
      <header className="bg-brand-dark">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <Link
            href={`/salao/${salaoId}/agendar`}
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Trocar serviço
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-white">{salao.nome}</h1>
          <p className="mt-1 text-white/70">Agendando: {escolhido.nome}</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium">{escolhido.nome}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {precoEmReais(escolhido.preco)} · {duracaoLegivel(escolhido.duracaoMin)}
              </p>
            </div>
            <Link
              href={`/salao/${salaoId}/agendar`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Trocar serviço
            </Link>
          </CardContent>
        </Card>

        <Calendario salaoId={salaoId} servicoId={escolhido.id} salaoNome={salao.nome} />
      </main>
    </>
  );
}
