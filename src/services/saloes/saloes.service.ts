import { prisma } from "@/lib/prisma";
import { ErroDeAutorizacao, ErroNaoEncontrado } from "@/services/erros";

/**
 * Resolução do salão em que o dono autenticado está trabalhando.
 *
 * O MVP assume um salão por dono: as telas do salão (serviços, horários, agenda)
 * não pedem qual salão editar. O schema já permite vários — a relação é 1:N —,
 * então quando existir troca de salão, basta estas funções passarem a receber
 * o id escolhido.
 */

/** Salão do dono, ou null se ele ainda não cadastrou nenhum. */
export async function salaoDoDono(donoId: string): Promise<{ id: string; nome: string; publicado: boolean } | null> {
  return prisma.salao.findFirst({
    where: { donoId },
    orderBy: { criadoEm: "asc" },
    select: { id: true, nome: true, publicado: true },
  });
}

/** Igual à anterior, mas exige que o salão exista. */
export async function exigirSalaoDoDono(donoId: string): Promise<{ id: string; nome: string; publicado: boolean }> {
  const salao = await salaoDoDono(donoId);
  if (!salao) {
    throw new ErroNaoEncontrado("Nenhum salão cadastrado para este usuário. Conclua o cadastro do salão primeiro.");
  }

  return salao;
}

/**
 * Garante que o salão pertence a quem está pedindo (RGN07). O administrador
 * passa direto, como prevê a própria regra.
 */
export async function exigirSalaoDoUsuario(
  salaoId: string,
  usuario: { id: string; papel: string },
): Promise<{ id: string; nome: string }> {
  const salao = await prisma.salao.findUnique({
    where: { id: salaoId },
    select: { id: true, nome: true, donoId: true },
  });

  if (!salao) throw new ErroNaoEncontrado("Salão não encontrado");
  if (usuario.papel !== "ADMIN" && salao.donoId !== usuario.id) {
    throw new ErroDeAutorizacao("Este salão pertence a outro usuário");
  }

  return { id: salao.id, nome: salao.nome };
}

/** Existência do salão, para as rotas públicas (busca, disponibilidade). */
export async function exigirSalao(salaoId: string): Promise<{ id: string; nome: string; publicado: boolean }> {
  const salao = await prisma.salao.findUnique({
    where: { id: salaoId },
    select: { id: true, nome: true, publicado: true },
  });

  if (!salao) throw new ErroNaoEncontrado("Salão não encontrado");

  return salao;
}
