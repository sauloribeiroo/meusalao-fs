import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { buscarSalaoPorDono } from "@/services/saloes/saloes.service";
import { listarServicosPorSalao } from "@/services/servicos/servicos.service";
import { ListaServicos } from "@/app/(app)/salao/meu/servicos/lista-servicos";

export const metadata: Metadata = { title: "Meus serviços | MeuSalão" };

export default async function ServicosPage() {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");
  if (sessao.user.papel !== "DONO_SALAO") redirect("/inicio");

  const salao = await buscarSalaoPorDono(sessao.user.id);
  if (!salao) redirect("/salao/onboarding");

  const servicos = await listarServicosPorSalao(salao.id);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-black tracking-tight">Meus serviços</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Cadastre os serviços oferecidos pelo {salao.nome}, com preço e duração.
      </p>

      <ListaServicos
        salaoId={salao.id}
        servicosIniciais={servicos.map((s) => ({
          id: s.id,
          nome: s.nome,
          preco: s.preco ? Number(s.preco) : null,
          duracaoMin: s.duracaoMin,
        }))}
      />
    </main>
  );
}
