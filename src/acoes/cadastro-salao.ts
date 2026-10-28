"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { atualizarSessao, auth } from "@/auth";
import { ErroDeNegocio, ErroDeValidacao } from "@/services/erros";
import { buscarCoordenadas, type LocalEncontrado } from "@/services/saloes/geocodificacao";
import { buscaDeEnderecoSchema } from "@/services/saloes/schemas";
import { criarSalao } from "@/services/saloes/saloes.service";

/** RF03 — cadastro do salão. */

export type EstadoCadastroSalao = {
  mensagem?: string;
  erros?: Record<string, string[]>;
  valores?: Record<string, string>;
  /** Instante da criação. A tela navega quando ele muda. */
  criadoEm?: number;
};

export type EstadoBuscaEndereco = {
  mensagem?: string;
  locais?: LocalEncontrado[];
  /** Muda a cada busca, para a tela reagir mesmo quando o resultado se repete. */
  buscadoEm?: number;
};

/**
 * Busca o endereço no Nominatim. Fica numa ação de servidor, e não num fetch do
 * navegador, porque a consulta exige um User-Agent que identifique a aplicação.
 */
export async function buscarEnderecoAction(
  _estado: EstadoBuscaEndereco,
  formData: FormData,
): Promise<EstadoBuscaEndereco> {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");

  const resultado = buscaDeEnderecoSchema.safeParse({ endereco: String(formData.get("endereco") ?? "") });
  if (!resultado.success) {
    return { mensagem: resultado.error.flatten().fieldErrors.endereco?.[0] ?? "Endereço inválido" };
  }

  const locais = await buscarCoordenadas(resultado.data.endereco);

  if (locais.length === 0) {
    return {
      buscadoEm: Date.now(),
      mensagem:
        "Não encontramos esse endereço. Tente incluir bairro e cidade — ou siga sem o mapa e ajuste depois.",
    };
  }

  return { locais, buscadoEm: Date.now() };
}

export async function criarSalaoAction(
  _estado: EstadoCadastroSalao,
  formData: FormData,
): Promise<EstadoCadastroSalao> {
  const sessao = await auth();
  if (!sessao?.user) redirect("/login");

  const campos = ["nome", "endereco", "descricao", "tipo", "telefone", "latitude", "longitude"];
  const valores = Object.fromEntries(campos.map((campo) => [campo, String(formData.get(campo) ?? "")]));

  try {
    await criarSalao(sessao.user.id, valores);
  } catch (erro) {
    if (erro instanceof ErroDeValidacao) return { valores, erros: erro.erros };
    if (erro instanceof ErroDeNegocio) return { valores, mensagem: erro.message };

    console.error("Falha ao cadastrar salão:", erro);
    return { valores, mensagem: "Não foi possível cadastrar o salão. Tente novamente." };
  }

  // O papel mudou de CLIENTE para DONO_SALAO: sem renovar a sessão, o
  // middleware e o layout continuariam vendo o papel antigo até o próximo
  // login, e a área de gestão recusaria quem acabou de criar o salão.
  await atualizarSessao({ user: { nome: sessao.user.nome, email: sessao.user.email } });

  revalidatePath("/salao/meu/dados");
  revalidatePath("/inicio");

  // Sem `redirect` aqui, de propósito: ele interrompe a ação lançando, e o
  // `Set-Cookie` da sessão recém-atualizada se perde junto — o JWT continuaria
  // dizendo CLIENTE e a área do dono recusaria quem acabou de criar o salão.
  // Retornando normalmente, o cookie vai na resposta e a tela navega depois.
  return { criadoEm: Date.now() };
}
