import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Scissors } from "lucide-react";
import { buscarSalaoPorId } from "@/services/saloes/saloes.service";
import { listarServicosPorSalao } from "@/services/servicos/servicos.service";
import { Card, CardContent } from "@/components/ui/card";
import { Calendario } from "@/app/(app)/salao/[salaoId]/agendar/calendario";

export const metadata: Metadata = { title: "Agendar | MeuSalão" };

const formatoPreco = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default async function AgendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ salaoId: string }>;
  searchParams: Promise<{ servicoId?: string }>;
}) {
  const { salaoId } = await params;
  const { servicoId } = await searchParams;

  const salao = await buscarSalaoPorId(salaoId);
  if (!salao) notFound();

  const servicos = await listarServicosPorSalao(salaoId);
  const servicoSelecionado = servicoId ? servicos.find((s) => s.id === servicoId) : undefined;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-black tracking-tight">{salao.nome}</h1>

      {!servicoSelecionado ? (
        <>
          <p className="mt-1 text-sm text-muted-foreground">Escolha o serviço que deseja agendar.</p>
          <ul className="mt-6 space-y-2">
            {servicos.length === 0 && (
              <li className="text-sm text-muted-foreground">Este salão ainda não cadastrou serviços.</li>
            )}
            {servicos.map((servico) => (
              <li key={servico.id}>
                <a href={`/salao/${salaoId}/agendar?servicoId=${servico.id}`}>
                  <Card className="transition-colors hover:border-primary">
                    <CardContent className="flex items-center justify-between gap-4 p-4">
                      <div className="flex items-center gap-3">
                        <Scissors className="size-5 text-primary" aria-hidden />
                        <div>
                          <p className="font-medium">{servico.nome}</p>
                          <p className="text-sm text-muted-foreground">{servico.duracaoMin} min</p>
                        </div>
                      </div>
                      <span className="font-semibold">
                        {servico.preco ? formatoPreco.format(Number(servico.preco)) : "Consultar preço"}
                      </span>
                    </CardContent>
                  </Card>
                </a>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <Calendario
          salaoId={salaoId}
          servicoId={servicoSelecionado.id}
          servicoNome={servicoSelecionado.nome}
          duracaoMin={servicoSelecionado.duracaoMin}
        />
      )}
    </main>
  );
}
