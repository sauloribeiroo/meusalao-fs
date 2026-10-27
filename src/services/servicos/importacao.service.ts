import { prisma } from "@/lib/prisma";
import { ErroDeValidacao } from "@/services/erros";
import { novoServicoSchema } from "@/services/servicos/schemas";

/**
 * RF21 — importação do catálogo de serviços por CSV.
 *
 * O parsing é próprio, e não de biblioteca, por duas razões: o formato aceito
 * aqui é de três colunas, e uma dependência de CSV traz consigo o problema de
 * confiar no que ela faz com entrada malformada — que é justamente o caso de
 * uso. São ~40 linhas de código com teste de mesa simples.
 *
 * O fluxo é em duas etapas, como o requisito pede: `analisar` não grava nada e
 * devolve o que aconteceria; `importar` repete a análise e grava só o que passou.
 * Reanalisar no segundo passo é de propósito — entre a pré-visualização e a
 * confirmação o catálogo pode ter mudado em outra aba.
 */

/** Teto de linhas por arquivo. Catálogo de salão não chega perto disso. */
export const MAXIMO_DE_LINHAS = 200;

/** Cabeçalhos aceitos, já normalizados (sem acento, minúsculos). */
const COLUNAS_ESPERADAS = ["nome", "preco", "duracaomin"];

export type SituacaoDaLinha = "nova" | "duplicada" | "invalida";

export type LinhaAnalisada = {
  /** Número da linha no arquivo, contando o cabeçalho — é o que o usuário vê. */
  linha: number;
  nome: string;
  preco: number | null;
  duracaoMin: number | null;
  situacao: SituacaoDaLinha;
  erros: string[];
};

export type AnaliseDoCsv = {
  separador: string;
  novas: number;
  duplicadas: number;
  invalidas: number;
  linhas: LinhaAnalisada[];
};

const semAcento = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

/**
 * Separador do arquivo. Excel em português salva com ponto e vírgula, e nesse
 * caso a vírgula aparece dentro do preço ("30,00") — chutar errado aqui quebra
 * todas as linhas de uma vez.
 */
function detectarSeparador(primeiraLinha: string): string {
  const pontoEVirgula = (primeiraLinha.match(/;/g) ?? []).length;
  const virgula = (primeiraLinha.match(/,/g) ?? []).length;

  return pontoEVirgula >= virgula ? ";" : ",";
}

/** Divide uma linha respeitando aspas, inclusive aspas duplicadas ("" → "). */
function dividirLinha(linha: string, separador: string): string[] {
  const campos: string[] = [];
  let atual = "";
  let dentroDeAspas = false;

  for (let i = 0; i < linha.length; i += 1) {
    const caractere = linha[i];

    if (caractere === '"') {
      if (dentroDeAspas && linha[i + 1] === '"') {
        atual += '"';
        i += 1;
      } else {
        dentroDeAspas = !dentroDeAspas;
      }
    } else if (caractere === separador && !dentroDeAspas) {
      campos.push(atual.trim());
      atual = "";
    } else {
      atual += caractere;
    }
  }

  campos.push(atual.trim());

  return campos;
}

/** O arquivo tem cabeçalho se a primeira linha nomeia as colunas esperadas. */
const ehCabecalho = (campos: string[]): boolean =>
  campos.some((campo) => COLUNAS_ESPERADAS.includes(semAcento(campo)));

export async function analisarCsvDeServicos(salaoId: string, conteudo: unknown): Promise<AnaliseDoCsv> {
  if (typeof conteudo !== "string" || conteudo.trim() === "") {
    throw new ErroDeValidacao({ csv: ["Envie um arquivo CSV com ao menos uma linha"] });
  }

  // ﻿: o Excel grava BOM, que grudaria no primeiro cabeçalho.
  const linhas = conteudo
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .map((linha) => linha.trim());

  const primeiraPreenchida = linhas.find((linha) => linha !== "") ?? "";
  const separador = detectarSeparador(primeiraPreenchida);

  const existentes = await prisma.servico.findMany({ where: { salaoId }, select: { nome: true } });
  const jaCadastrados = new Set(existentes.map((servico) => semAcento(servico.nome)));
  const vistosNoArquivo = new Set<string>();

  const analisadas: LinhaAnalisada[] = [];
  let util = 0;

  for (const [indice, texto] of linhas.entries()) {
    if (texto === "") continue;

    const campos = dividirLinha(texto, separador);
    if (util === 0 && ehCabecalho(campos)) {
      util += 1;
      continue;
    }

    util += 1;
    if (analisadas.length >= MAXIMO_DE_LINHAS) {
      throw new ErroDeValidacao({
        csv: [`O arquivo passa de ${MAXIMO_DE_LINHAS} serviços. Divida-o em partes menores.`],
      });
    }

    const [nomeBruto = "", precoBruto = "", duracaoBruta = ""] = campos;
    const resultado = novoServicoSchema.safeParse({
      nome: nomeBruto,
      preco: precoBruto,
      duracaoMin: duracaoBruta,
    });

    if (!resultado.success) {
      const porCampo = resultado.error.flatten().fieldErrors;
      analisadas.push({
        linha: indice + 1,
        nome: nomeBruto,
        preco: null,
        duracaoMin: null,
        situacao: "invalida",
        erros: Object.values(porCampo).flatMap((mensagens) => mensagens ?? []),
      });
      continue;
    }

    const { nome, preco, duracaoMin } = resultado.data;
    const chave = semAcento(nome);
    // Duplicada tanto contra o catálogo quanto contra o próprio arquivo: dois
    // "Corte" na mesma planilha não podem virar dois serviços iguais.
    const duplicada = jaCadastrados.has(chave) || vistosNoArquivo.has(chave);
    vistosNoArquivo.add(chave);

    analisadas.push({
      linha: indice + 1,
      nome,
      preco: preco ?? null,
      duracaoMin,
      situacao: duplicada ? "duplicada" : "nova",
      erros: duplicada ? ["Já existe um serviço com esse nome"] : [],
    });
  }

  if (analisadas.length === 0) {
    throw new ErroDeValidacao({ csv: ["Nenhuma linha de serviço encontrada no arquivo"] });
  }

  return {
    separador,
    novas: analisadas.filter((linha) => linha.situacao === "nova").length,
    duplicadas: analisadas.filter((linha) => linha.situacao === "duplicada").length,
    invalidas: analisadas.filter((linha) => linha.situacao === "invalida").length,
    linhas: analisadas,
  };
}

export type ResultadoDaImportacao = {
  criados: number;
  ignorados: number;
  analise: AnaliseDoCsv;
};

/**
 * Grava as linhas novas. Duplicadas e inválidas são puladas, não interrompem:
 * uma planilha de 40 serviços com um erro de digitação deve importar 39.
 */
export async function importarServicosDoCsv(salaoId: string, conteudo: unknown): Promise<ResultadoDaImportacao> {
  const analise = await analisarCsvDeServicos(salaoId, conteudo);
  const novas = analise.linhas.filter((linha) => linha.situacao === "nova");

  if (novas.length > 0) {
    await prisma.servico.createMany({
      data: novas.map((linha) => ({
        salaoId,
        nome: linha.nome,
        preco: linha.preco,
        duracaoMin: linha.duracaoMin!,
      })),
    });
  }

  return {
    criados: novas.length,
    ignorados: analise.duplicadas + analise.invalidas,
    analise,
  };
}
