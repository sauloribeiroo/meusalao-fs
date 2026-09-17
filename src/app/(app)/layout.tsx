import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Cabecalho } from "@/components/cabecalho";

/**
 * Área autenticada. O middleware já barra visitantes; aqui a sessão é lida de
 * novo porque é ela que alimenta o cabeçalho — e serve de segunda checagem.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");

  return (
    <div className="min-h-dvh bg-background">
      <Cabecalho nome={sessao.user.nome} />
      {children}
    </div>
  );
}
