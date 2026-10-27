import { NextResponse } from "next/server";
import { corpoJson, exigirPapel, rota } from "@/lib/api";
import { ErroDeValidacao } from "@/services/erros";
import { publicacaoSchema } from "@/services/saloes/schemas";
import {
  definirPublicacao,
  exigirSalaoDoDono,
  situacaoDePublicacao,
} from "@/services/saloes/saloes.service";

/**
 * RF23 — publicação do perfil do salão.
 *
 * GET   /api/saloes/publicacao  checklist da RGN05 e situação atual
 * PATCH /api/saloes/publicacao  { "publicado": true | false }
 *
 * O salão não vem no corpo: é sempre o do dono autenticado, resolvido pela
 * sessão. Aceitar um salaoId de fora abriria a porta para publicar o salão
 * alheio, e a checagem de dono teria de ser refeita aqui.
 */

export const GET = rota(async () => {
  const dono = await exigirPapel("DONO_SALAO");
  const salao = await exigirSalaoDoDono(dono.id);

  return NextResponse.json({ situacao: await situacaoDePublicacao(salao.id) });
});

export const PATCH = rota(async (request: Request) => {
  const dono = await exigirPapel("DONO_SALAO");
  const salao = await exigirSalaoDoDono(dono.id);

  const resultado = publicacaoSchema.safeParse(await corpoJson(request));
  if (!resultado.success) {
    throw new ErroDeValidacao(resultado.error.flatten().fieldErrors as Record<string, string[]>);
  }

  return NextResponse.json({ situacao: await definirPublicacao(salao.id, resultado.data.publicado) });
});
