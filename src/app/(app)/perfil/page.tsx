import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { FormularioPerfil } from "@/app/(app)/perfil/formulario-perfil";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buscarPerfil } from "@/services/usuarios/usuarios.service";

export const metadata: Metadata = { title: "Meus dados | MeuSalão" };

/** RF07 — edição dos dados de cadastro do usuário. */
export default async function PerfilPage() {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");

  const perfil = await buscarPerfil(sessao.user.id);
  if (!perfil) notFound();

  return (
    <>
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-2xl px-6 py-8">
          <h1 className="text-2xl font-black tracking-tight">Meus dados</h1>
          <p className="mt-1 text-sm text-muted-foreground">Mantenha seu cadastro atualizado.</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Dados pessoais</CardTitle>
            <CardDescription>
              Coletamos apenas nome, e-mail e telefone — o mínimo para o agendamento funcionar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormularioPerfil perfil={perfil} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
