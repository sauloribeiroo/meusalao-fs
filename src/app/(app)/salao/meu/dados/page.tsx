import type { Metadata } from "next";
import { PartyPopper } from "lucide-react";
import { auth } from "@/auth";
import { FormularioSalao } from "@/app/(app)/salao/meu/dados/formulario-salao";
import { Publicacao } from "@/app/(app)/salao/meu/dados/publicacao";
import { SemSalao } from "@/components/sem-salao";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buscarSalaoEditavel,
  salaoDoDono,
  situacaoDePublicacao,
} from "@/services/saloes/saloes.service";

export const metadata: Metadata = { title: "Dados do salão | MeuSalão" };

/** RF07 — dados cadastrais do salão. */
export default async function DadosDoSalaoPage({
  searchParams,
}: {
  searchParams: Promise<{ criado?: string }>;
}) {
  const { criado } = await searchParams;
  const sessao = await auth();
  const resumo = await salaoDoDono(sessao!.user.id);

  if (!resumo) return <SemSalao />;

  const [salao, situacao] = await Promise.all([
    buscarSalaoEditavel(resumo.id),
    situacaoDePublicacao(resumo.id),
  ]);

  return (
    <div className="space-y-6">
      {criado && (
        <p className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
          <PartyPopper className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Salão criado. Cadastre ao menos um serviço e marque os horários de funcionamento — aí o
            botão de publicar libera.
          </span>
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Publicação</CardTitle>
          <CardDescription>
            O salão só aparece na busca e no mapa depois de publicado (RGN05).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Publicacao situacao={situacao} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados do salão</CardTitle>
          <CardDescription>É o que o cliente vê ao abrir o perfil do salão e ao agendar.</CardDescription>
        </CardHeader>
        <CardContent>
          <FormularioSalao salao={salao} />
        </CardContent>
      </Card>
    </div>
  );
}
