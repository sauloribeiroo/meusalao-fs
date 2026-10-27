import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AbasDoAdmin } from "@/app/(app)/admin/abas";

/**
 * RF26 — área administrativa.
 *
 * O middleware garante a sessão; aqui se confere o papel. As ações repetem a
 * checagem por conta própria: um layout não protege um Server Action invocado
 * diretamente.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");
  if (sessao.user.papel !== "ADMIN") redirect("/inicio");

  return (
    <>
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 pt-8">
          <h1 className="text-2xl font-black tracking-tight">Administração</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Usuários, salões e moderação de avaliações da plataforma.
          </p>
          <AbasDoAdmin />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </>
  );
}
