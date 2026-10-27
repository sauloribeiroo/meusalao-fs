"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { alterarPapel, moderarSalao, removerComentario } from "@/services/admin/admin.service";
import { ErroDeNegocio, ErroDeValidacao } from "@/services/erros";

/** RF26 — ações do painel administrativo. */

export type EstadoAdmin = {
  mensagem?: string;
  feitoEm?: number;
};

/** Toda ação daqui exige papel ADMIN — a checagem é repetida por ação, não só no layout. */
async function exigirAdministrador(): Promise<string> {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");
  if (sessao.user.papel !== "ADMIN") redirect("/inicio");

  return sessao.user.id;
}

export async function alterarPapelAction(_estado: EstadoAdmin, formData: FormData): Promise<EstadoAdmin> {
  const administradorId = await exigirAdministrador();

  try {
    await alterarPapel(administradorId, {
      usuarioId: String(formData.get("usuarioId") ?? ""),
      papel: String(formData.get("papel") ?? ""),
    });
  } catch (erro) {
    return falha(erro, "Não foi possível alterar o papel. Tente novamente.");
  }

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin");
  return { feitoEm: Date.now() };
}

export async function moderarSalaoAction(_estado: EstadoAdmin, formData: FormData): Promise<EstadoAdmin> {
  await exigirAdministrador();

  try {
    await moderarSalao({
      salaoId: String(formData.get("salaoId") ?? ""),
      publicado: String(formData.get("publicado") ?? ""),
    });
  } catch (erro) {
    return falha(erro, "Não foi possível alterar a situação do salão. Tente novamente.");
  }

  revalidatePath("/admin/saloes");
  revalidatePath("/admin");
  revalidatePath("/saloes");
  return { feitoEm: Date.now() };
}

export async function removerComentarioAction(
  _estado: EstadoAdmin,
  formData: FormData,
): Promise<EstadoAdmin> {
  await exigirAdministrador();

  try {
    await removerComentario(String(formData.get("avaliacaoId") ?? ""));
  } catch (erro) {
    return falha(erro, "Não foi possível remover o comentário. Tente novamente.");
  }

  revalidatePath("/admin/avaliacoes");
  return { feitoEm: Date.now() };
}

function falha(erro: unknown, generica: string): EstadoAdmin {
  if (erro instanceof ErroDeValidacao) {
    return { mensagem: Object.values(erro.erros).flat().join(" ") || erro.message };
  }
  // "Você não pode remover o próprio acesso de administrador" já vem do serviço.
  if (erro instanceof ErroDeNegocio) return { mensagem: erro.message };

  console.error("Falha em ação administrativa:", erro);
  return { mensagem: generica };
}
