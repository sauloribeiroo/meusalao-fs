import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, Clock, Tag } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { duracaoLegivel, precoEmReais } from "@/lib/formato";
import { ErroNaoEncontrado } from "@/services/erros";
import { buscarPerfilPublico } from "@/services/saloes/saloes.service";

export const metadata: Metadata = { title: "Escolher serviço | MeuSalão" };

/**
 * RF15 — seleção do serviço.
 *
 * Tela própria, e não mais um estado da tela do calendário alternado por query
 * string: escolher o serviço e escolher o horário são duas decisões, e separá-las
 * dá a cada uma a URL que o botão "voltar" do navegador espera.
 */
export default async function EscolherServicoPage({
  params,
}: {
  params: Promise<{ salaoId: string }>;
}) {
  const { salaoId } = await params;

  const salao = await buscarPerfilPublico(salaoId).catch((erro) => {
    if (erro instanceof ErroNaoEncontrado) notFound();
    throw erro;
  });

  return (
    <>
      <header className="bg-brand-dark">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <Link
            href={`/salao/${salaoId}`}
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {salao.nome}
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-white">Escolha o serviço</h1>
          <p className="mt-1 text-white/70">A duração do serviço define os horários disponíveis.</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {salao.servicos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
              <p className="text-sm text-muted-foreground">
                Este salão ainda não cadastrou serviços, então não há o que agendar.
              </p>
              <Link href="/saloes" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Ver outros salões
              </Link>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {salao.servicos.map((servico) => (
              <li key={servico.id}>
                <Link
                  href={`/salao/${salaoId}/agendar/horario?servicoId=${servico.id}`}
                  className="block"
                >
                  <Card className="transition-colors hover:border-primary">
                    <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{servico.nome}</p>
                        <p className="mt-1 flex items-center gap-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Tag className="size-3.5" aria-hidden />
                            {precoEmReais(servico.preco)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="size-3.5" aria-hidden />
                            {duracaoLegivel(servico.duracaoMin)}
                          </span>
                        </p>
                      </div>
                      <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
