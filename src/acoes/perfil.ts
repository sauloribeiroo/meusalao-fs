"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { atualizarSessao, auth } from "@/auth";
import { ErroDeNegocio, ErroDeValidacao } from "@/services/erros";
import { atualizarSalao, exigirSalaoDoDono } from "@/services/saloes/saloes.service";
import { atualizarPerfil } from "@/services/usuarios/usuarios.service";

/** RF07 — edição dos dados de cadastro, do usuário e do salão. */

export type EstadoEdicao = {
  mensagem?: string;
  erros?: Record<string, string[]>;
  /** O que já estava digitado, para repopular o formulário após um erro. */
  valores?: Record<string, string>;
  /**
   * Instante do salvamento, em vez de um booleano: muda a cada sucesso, então
   * o efeito no cliente dispara de novo no segundo salvamento. Com `true` fixo,
   * o valor não mudaria e a confirmação só apareceria uma vez.
   */
  salvoEm?: number;
};

const textos = (formData: FormData, campos: string[]): Record<string, string> =>
  Object.fromEntries(campos.map((campo) => [campo, String(formData.get(campo) ?? "")]));

export async function atualizarPerfilAction(
  _estado: EstadoEdicao,
  formData: FormData,
): Promise<EstadoEdicao> {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");

  const valores = textos(formData, ["nome", "email", "telefone"]);

  let perfil;
  try {
    perfil = await atualizarPerfil(sessao.user.id, valores);
  } catch (erro) {
    return falha(erro, valores, "Não foi possível salvar seus dados. Tente novamente.");
  }

  // Dispara o callback jwt com trigger "update", que relê o usuário do banco.
  // Sem isso, o cabeçalho ficaria com o nome antigo até o próximo login.
  // O objeto precisa trazer o usuário: chamar com {} apaga a sessão e desloga.
  await atualizarSessao({ user: { nome: perfil.nome, email: perfil.email } });

  revalidatePath("/perfil");
  revalidatePath("/inicio");
  return { salvoEm: Date.now() };
}

export async function atualizarSalaoAction(
  _estado: EstadoEdicao,
  formData: FormData,
): Promise<EstadoEdicao> {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");
  if (sessao.user.papel !== "DONO_SALAO" && sessao.user.papel !== "ADMIN") redirect("/inicio");

  const valores = textos(formData, [
    "nome",
    "endereco",
    "descricao",
    "tipo",
    "telefone",
    "latitude",
    "longitude",
  ]);

  try {
    const salao = await exigirSalaoDoDono(sessao.user.id);
    await atualizarSalao(salao.id, valores);
  } catch (erro) {
    return falha(erro, valores, "Não foi possível salvar os dados do salão. Tente novamente.");
  }

  revalidatePath("/salao/meu/dados");
  revalidatePath("/inicio");
  return { salvoEm: Date.now() };
}

function falha(erro: unknown, valores: Record<string, string>, generica: string): EstadoEdicao {
  if (erro instanceof ErroDeValidacao) return { valores, erros: erro.erros };
  if (erro instanceof ErroDeNegocio) return { valores, mensagem: erro.message };

  console.error("Falha ao editar dados de cadastro:", erro);
  return { valores, mensagem: generica };
}
