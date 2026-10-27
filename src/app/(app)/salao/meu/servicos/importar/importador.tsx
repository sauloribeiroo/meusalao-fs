"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, FileUp, Upload, X } from "lucide-react";
import {
  analisarCsvAction,
  importarCsvAction,
  type EstadoImportacao,
} from "@/acoes/importacao";
import { AlertaErro } from "@/components/ui/alerta";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { precoEmReais } from "@/lib/formato";
import { cn } from "@/lib/utils";

const INICIAL: EstadoImportacao = {};

/** Teto do arquivo lido no navegador. Um CSV de catálogo não passa disso. */
const TAMANHO_MAXIMO = 512 * 1024;

const SITUACAO = {
  nova: { rotulo: "Será importado", classe: "text-emerald-700", Icone: Check },
  duplicada: { rotulo: "Já existe", classe: "text-amber-700", Icone: AlertTriangle },
  invalida: { rotulo: "Com erro", classe: "text-destructive", Icone: X },
} as const;

/**
 * RF21 — upload, pré-visualização e confirmação.
 *
 * O arquivo é lido no navegador e enviado como texto, em vez de subir o arquivo
 * em si: o serviço já recebe o conteúdo como string, e assim não há upload
 * binário, armazenamento temporário nem limite de corpo do servidor no caminho.
 */
export function Importador() {
  const [previa, analisar, analisando] = useActionState(analisarCsvAction, INICIAL);
  const [resultado, importar, importando] = useActionState(importarCsvAction, INICIAL);
  const [erroLocal, setErroLocal] = useState<string>();
  const [nomeDoArquivo, setNomeDoArquivo] = useState<string>();
  const campoCsv = useRef<HTMLInputElement>(null);
  const formularioPrevia = useRef<HTMLFormElement>(null);

  async function aoEscolherArquivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;

    setErroLocal(undefined);

    if (arquivo.size > TAMANHO_MAXIMO) {
      setErroLocal("O arquivo passa de 512 KB. Um catálogo de serviços não precisa ser tão grande.");
      return;
    }

    const texto = await arquivo.text();
    setNomeDoArquivo(arquivo.name);
    if (campoCsv.current) campoCsv.current.value = texto;
    formularioPrevia.current?.requestSubmit();
  }

  if (resultado.feitoEm) {
    return (
      <Card>
        <CardContent className="space-y-4 p-8 text-center">
          <Check className="mx-auto size-10 text-emerald-600" aria-hidden />
          <div>
            <p className="text-lg font-semibold">
              {resultado.criados} {resultado.criados === 1 ? "serviço importado" : "serviços importados"}
            </p>
            {resultado.ignorados! > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                {resultado.ignorados} linha(s) foram ignoradas por já existirem ou conterem erro.
              </p>
            )}
          </div>
          <Link href="/salao/meu/servicos" className={buttonVariants()}>
            Ver meus serviços
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div>
            <p className="font-medium">Formato esperado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Três colunas: <strong>nome</strong>, <strong>preço</strong> e{" "}
              <strong>duração em minutos</strong>. O cabeçalho é opcional, e tanto vírgula quanto
              ponto e vírgula servem de separador. Serviço sem preço fica como &quot;Consultar
              preço&quot;.
            </p>
          </div>

          <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
            {"nome;preco;duracaoMin\nCorte feminino;80,00;60\nEscova;50,00;45\nHidratação;;90"}
          </pre>

          <form ref={formularioPrevia} action={analisar}>
            <input ref={campoCsv} type="hidden" name="csv" />
          </form>

          <label
            className={cn(
              buttonVariants({ variant: "outline" }),
              "cursor-pointer",
              analisando && "pointer-events-none opacity-60",
            )}
          >
            <FileUp aria-hidden />
            {analisando ? "Lendo arquivo..." : "Escolher arquivo CSV"}
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={aoEscolherArquivo}
              disabled={analisando}
            />
          </label>

          {nomeDoArquivo && !analisando && (
            <p className="text-sm text-muted-foreground">Arquivo: {nomeDoArquivo}</p>
          )}

          {erroLocal && <AlertaErro>{erroLocal}</AlertaErro>}
          {previa.mensagem && <AlertaErro>{previa.mensagem}</AlertaErro>}
          {resultado.mensagem && <AlertaErro>{resultado.mensagem}</AlertaErro>}
        </CardContent>
      </Card>

      {previa.analise && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div>
              <p className="font-medium">Pré-visualização</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {previa.analise.novas} para importar · {previa.analise.duplicadas} já existentes ·{" "}
                {previa.analise.invalidas} com erro. Nada foi gravado ainda.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="p-2">
                      Linha
                    </th>
                    <th scope="col" className="p-2">
                      Nome
                    </th>
                    <th scope="col" className="p-2">
                      Preço
                    </th>
                    <th scope="col" className="p-2">
                      Duração
                    </th>
                    <th scope="col" className="p-2">
                      Situação
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previa.analise.linhas.map((linha) => {
                    const situacao = SITUACAO[linha.situacao];

                    return (
                      <tr key={linha.linha} className="border-b border-border/60">
                        <td className="p-2 text-muted-foreground">{linha.linha}</td>
                        <td className="p-2 font-medium">{linha.nome || "—"}</td>
                        <td className="p-2">{linha.preco === null ? "—" : precoEmReais(linha.preco)}</td>
                        <td className="p-2">{linha.duracaoMin === null ? "—" : `${linha.duracaoMin} min`}</td>
                        <td className={cn("p-2 font-medium", situacao.classe)}>
                          <span className="flex items-center gap-1.5">
                            <situacao.Icone className="size-3.5 shrink-0" aria-hidden />
                            {situacao.rotulo}
                          </span>
                          {linha.erros.length > 0 && (
                            <span className="mt-0.5 block text-xs font-normal">
                              {linha.erros.join("; ")}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <form action={importar} className="flex flex-wrap gap-2">
              <input type="hidden" name="csv" value={previa.csv ?? ""} />
              <Button type="submit" disabled={importando || previa.analise.novas === 0}>
                <Upload aria-hidden />
                {importando
                  ? "Importando..."
                  : `Importar ${previa.analise.novas} ${previa.analise.novas === 1 ? "serviço" : "serviços"}`}
              </Button>
              <Link href="/salao/meu/servicos" className={buttonVariants({ variant: "ghost" })}>
                Cancelar
              </Link>
            </form>

            {previa.analise.novas === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhuma linha nova para importar neste arquivo.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
