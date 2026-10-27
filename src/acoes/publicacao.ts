"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ErroDeNegocio } from "@/services/erros";
import { definirPublicacao, exigirSalaoDoDono } from "@/services/saloes/saloes.service";

/** RF23 — publicar ou tirar do ar o perfil do salão. */

export type EstadoPublicacao = {
  mensagem?: string;
  feitoEm?: number;
};

export async function alternarPublicacaoAction(
  _estado: EstadoPublicacao,
  formData: FormData,
): Promise<EstadoPublicacao> {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");
  if (sessao.user.papel !== "DONO_SALAO" && sessao.user.papel !== "ADMIN") redirect("/inicio");

  const publicado = String(formData.get("publicado") ?? "") === "true";

  try {
    const salao = await exigirSalaoDoDono(sessao.user.id);
    await definirPublicacao(salao.id, publicado);
  } catch (erro) {
    // "O salão ainda não pode ser publicado. Falta: ..." já vem do serviço.
    if (erro instanceof ErroDeNegocio) return { mensagem: erro.message };

    console.error("Falha ao alterar a publicação do salão:", erro);
    return { mensagem: "Não foi possível alterar a publicação. Tente novamente." };
  }

  revalidatePath("/salao/meu/dados");
  revalidatePath("/salao/meu/painel");
  revalidatePath("/saloes");
  revalidatePath("/inicio");
  return { feitoEm: Date.now() };
}
