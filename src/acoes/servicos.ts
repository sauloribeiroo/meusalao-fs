"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ErroDeValidacao } from "@/services/erros";
import { atualizarServico, criarServico, removerServico } from "@/services/servicos/servicos.service";

export type EstadoFormularioServico = {
  mensagem?: string;
  erros?: Record<string, string[]>;
  sucesso?: boolean;
};

async function exigirDono() {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");
  if (sessao.user.papel !== "DONO_SALAO") redirect("/inicio");
  return sessao.user;
}

export async function criarServicoAction(
  _estado: EstadoFormularioServico,
  formData: FormData,
): Promise<EstadoFormularioServico> {
  const usuario = await exigirDono();
  const salaoId = String(formData.get("salaoId"));

  try {
    await criarServico(usuario.id, salaoId, {
      nome: formData.get("nome"),
      preco: formData.get("preco"),
      duracaoMin: formData.get("duracaoMin"),
    });
  } catch (erro) {
    if (erro instanceof ErroDeValidacao) return { erros: erro.erros };

    console.error("Falha ao criar serviço:", erro);
    return { mensagem: "Não foi possível criar o serviço. Tente novamente." };
  }

  revalidatePath("/salao/meu/servicos");
  return { sucesso: true };
}

export async function atualizarServicoAction(
  _estado: EstadoFormularioServico,
  formData: FormData,
): Promise<EstadoFormularioServico> {
  const usuario = await exigirDono();
  const servicoId = String(formData.get("servicoId"));

  try {
    await atualizarServico(usuario.id, servicoId, {
      nome: formData.get("nome"),
      preco: formData.get("preco"),
      duracaoMin: formData.get("duracaoMin"),
    });
  } catch (erro) {
    if (erro instanceof ErroDeValidacao) return { erros: erro.erros };

    console.error("Falha ao atualizar serviço:", erro);
    return { mensagem: "Não foi possível salvar as alterações. Tente novamente." };
  }

  revalidatePath("/salao/meu/servicos");
  return { sucesso: true };
}

export async function removerServicoAction(servicoId: string) {
  const usuario = await exigirDono();
  await removerServico(usuario.id, servicoId);
  revalidatePath("/salao/meu/servicos");
}
