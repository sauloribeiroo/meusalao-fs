import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { buscarSalaoPorDono } from "@/services/saloes/saloes.service";
import { FormularioSalao } from "@/app/(app)/salao/onboarding/formulario-salao";

export const metadata: Metadata = { title: "Cadastrar salão | MeuSalão" };

export default async function OnboardingSalaoPage() {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");
  if (sessao.user.papel !== "DONO_SALAO") redirect("/inicio");

  const salao = await buscarSalaoPorDono(sessao.user.id);
  if (salao) redirect("/salao/meu/servicos");

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-black tracking-tight">Cadastre seu salão</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Conte um pouco sobre o salão e defina os horários de funcionamento. Você poderá editar depois.
      </p>

      <FormularioSalao />
    </main>
  );
}
