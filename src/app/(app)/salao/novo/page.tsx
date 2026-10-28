import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { FormularioNovoSalao } from "@/app/(app)/salao/novo/formulario-novo-salao";
import { salaoDoDono } from "@/services/saloes/saloes.service";

export const metadata: Metadata = { title: "Cadastrar salão | MeuSalão" };

/**
 * RF03 — cadastro do salão.
 *
 * Aberta a qualquer usuário logado: é por aqui que um cliente vira dono. Quem
 * já tem salão é mandado para a gestão, porque o MVP assume um salão por dono
 * e o serviço recusaria a criação de qualquer forma.
 */
export default async function NovoSalaoPage() {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");

  if (await salaoDoDono(sessao.user.id)) redirect("/salao/meu/dados");

  return (
    <>
      <header className="bg-brand-dark">
        <div className="mx-auto max-w-2xl px-6 py-10">
          <h1 className="text-3xl font-black tracking-tight text-white">Cadastre seu salão</h1>
          <p className="mt-1 text-white/70">
            Depois é só cadastrar serviços, marcar os horários e publicar para começar a receber
            agendamentos.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        <FormularioNovoSalao />
      </main>
    </>
  );
}
