import { NextResponse } from "next/server";
import { corpoJson, exigirPapel, rota } from "@/lib/api";
import { ErroDeValidacao } from "@/services/erros";
import {
  analisarCsvDeServicos,
  importarServicosDoCsv,
} from "@/services/servicos/importacao.service";
import { exigirSalaoDoDono } from "@/services/saloes/saloes.service";

/**
 * RF21 — importação do catálogo por CSV, em duas etapas.
 *
 * POST /api/servicos/importacao  { "csv": "...", "confirmar": false }  pré-visualiza
 * POST /api/servicos/importacao  { "csv": "...", "confirmar": true }   grava
 *
 * Um POST só, com a confirmação no corpo, em vez de duas rotas: é a mesma
 * operação em dois momentos, e separar obrigaria a repetir a resolução do salão
 * e a validação do arquivo em dois lugares.
 */

type Corpo = { csv?: unknown; confirmar?: unknown };

export const POST = rota(async (request: Request) => {
  const dono = await exigirPapel("DONO_SALAO");
  const salao = await exigirSalaoDoDono(dono.id);

  const corpo = (await corpoJson(request)) as Corpo;
  if (typeof corpo?.csv !== "string") {
    throw new ErroDeValidacao({ csv: ["Envie o conteúdo do arquivo no campo \"csv\""] });
  }

  if (corpo.confirmar !== true) {
    return NextResponse.json({ analise: await analisarCsvDeServicos(salao.id, corpo.csv) });
  }

  const resultado = await importarServicosDoCsv(salao.id, corpo.csv);

  return NextResponse.json(resultado, { status: 201 });
});
