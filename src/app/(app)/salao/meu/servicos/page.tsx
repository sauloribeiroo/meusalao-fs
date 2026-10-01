import type { Metadata } from "next";
import { auth } from "@/auth";
import { FormularioServico } from "@/app/(app)/salao/meu/servicos/formulario-servico";
import { ListaServicos } from "@/app/(app)/salao/meu/servicos/lista-servicos";
import { SemSalao } from "@/components/sem-salao";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { salaoDoDono } from "@/services/saloes/saloes.service";
import { listarServicosDoSalao } from "@/services/servicos/servicos.service";

export const metadata: Metadata = { title: "Serviços | MeuSalão" };

/** RF20 — cadastro e gestão dos serviços do salão. */
export default async function ServicosPage() {
  const sessao = await auth();
  const salao = await salaoDoDono(sessao!.user.id);

  if (!salao) return <SemSalao />;

  // "Ler para exibir": Server Component chama o serviço direto, sem HTTP.
  const servicos = await listarServicosDoSalao(salao.id);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Novo serviço</CardTitle>
          <CardDescription>
            Nome, preço e duração. A duração define os horários que o cliente pode escolher.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormularioServico />
        </CardContent>
      </Card>

      <section aria-labelledby="cadastrados">
        <h2 id="cadastrados" className="mb-4 text-lg font-semibold">
          Serviços cadastrados{" "}
          <span className="font-normal text-muted-foreground">({servicos.length})</span>
        </h2>
        <ListaServicos servicos={servicos} />
      </section>
    </div>
  );
}
