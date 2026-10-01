import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Tag } from "lucide-react";
import { Calendario } from "@/app/(app)/salao/[salaoId]/agendar/calendario";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { duracaoLegivel, precoEmReais } from "@/lib/formato";
import { ErroNaoEncontrado } from "@/services/erros";
import { exigirSalao } from "@/services/saloes/saloes.service";
import { listarServicosDoSalao } from "@/services/servicos/servicos.service";

export const metadata: Metadata = { title: "Agendar | MeuSalão" };

type Props = {
  params: Promise<{ salaoId: string }>;
  searchParams: Promise<{ servicoId?: string }>;
};

/**
 * RF15 — ponto de entrada do agendamento.
 *
 * Sem `servicoId` na URL, lista os serviços para escolher; com ele, mostra o
 * calendário. A tela dedicada de seleção de serviço é a issue #17 — aqui está
 * a versão mínima que torna o fluxo navegável.
 */
export default async function AgendarPage({ params, searchParams }: Props) {
  const { salaoId } = await params;
  const { servicoId } = await searchParams;

  const salao = await buscarSalaoPublicado(salaoId);
  if (!salao) notFound();

  const servicos = await listarServicosDoSalao(salaoId);
  const escolhido = servicos.find((servico) => servico.id === servicoId);

  return (
    <>
      <header className="bg-brand-dark">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <h1 className="text-3xl font-black tracking-tight text-white">{salao.nome}</h1>
          <p className="mt-1 text-white/70">
            {escolhido ? `Agendando: ${escolhido.nome}` : "Escolha o serviço que você quer agendar"}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {servicos.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Este salão ainda não cadastrou serviços.
            </CardContent>
          </Card>
        )}

        {servicos.length > 0 && !escolhido && (
          <ul className="space-y-3">
            {servicos.map((servico) => (
              <li key={servico.id}>
                <Card>
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
                    <Link
                      href={`/salao/${salaoId}/agendar?servicoId=${servico.id}`}
                      className={buttonVariants()}
                    >
                      Escolher horário
                    </Link>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}

        {escolhido && (
          <div className="space-y-6">
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
          </div>
        )}
      </main>
    </>
  );
}

/** RGN05: salão não publicado não é visível para o cliente. */
async function buscarSalaoPublicado(salaoId: string) {
  try {
    const salao = await exigirSalao(salaoId);
    return salao.publicado ? salao : null;
  } catch (erro) {
    if (erro instanceof ErroNaoEncontrado) return null;
    throw erro;
  }
}
