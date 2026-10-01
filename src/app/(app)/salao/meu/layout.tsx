import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AbasDoSalao } from "@/app/(app)/salao/meu/abas";

/**
 * Área de gestão do salão. Só o dono (e o administrador) entra — o middleware
 * garante a sessão, e aqui se confere o papel.
 */
export default async function SalaoLayout({ children }: { children: React.ReactNode }) {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");
  if (sessao.user.papel !== "DONO_SALAO" && sessao.user.papel !== "ADMIN") redirect("/inicio");

  return (
    <>
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-6 pt-8">
          <h1 className="text-2xl font-black tracking-tight">Meu salão</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie os serviços e os horários que os clientes veem ao agendar.
          </p>
          <AbasDoSalao />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </>
  );
}
