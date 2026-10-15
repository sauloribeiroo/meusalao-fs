import type { Metadata } from "next";
import Link from "next/link";
import { LinkIcon } from "lucide-react";
import { FormularioRedefinir } from "@/app/(auth)/redefinir-senha/formulario-redefinir";
import { buttonVariants } from "@/components/ui/button";
import { tokenEhValido } from "@/services/usuarios/recuperacao.service";

export const metadata: Metadata = { title: "Nova senha | MeuSalão" };

/**
 * RF05 — segunda etapa da recuperação.
 *
 * O token é conferido antes de desenhar o formulário: é melhor avisar que o
 * link expirou agora do que depois de a pessoa digitar a senha duas vezes.
 */
export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const valido = token ? await tokenEhValido(token) : false;

  if (!valido) {
    return (
      <div className="space-y-6 text-center">
        <LinkIcon className="mx-auto size-10 text-muted-foreground" aria-hidden />
        <div>
          <h2 className="text-2xl font-black tracking-tight">Link inválido ou expirado</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Links de recuperação valem por uma hora e só podem ser usados uma vez. Peça um novo para
            continuar.
          </p>
        </div>
        <Link href="/esqueci-senha" className={buttonVariants({ size: "lg", className: "w-full" })}>
          Pedir um novo link
        </Link>
      </div>
    );
  }

  return (
    <>
      <h2 className="mb-1 text-3xl font-black tracking-tight">Nova senha</h2>
      <p className="mb-8 text-muted-foreground">Escolha a senha que você vai usar para entrar.</p>

      <FormularioRedefinir token={token!} />
    </>
  );
}
