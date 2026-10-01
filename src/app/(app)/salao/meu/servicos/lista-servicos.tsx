"use client";

import { useActionState, useEffect, useState } from "react";
import { Clock, Pencil, Tag, Trash2, X } from "lucide-react";
import { editarServicoAction, removerServicoAction, type EstadoServico } from "@/acoes/servicos";
import { Campo } from "@/components/campo";
import { AlertaErro } from "@/components/ui/alerta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { duracaoLegivel, precoEmReais } from "@/lib/formato";

export type ServicoDaLista = {
  id: string;
  nome: string;
  preco: number | null;
  duracaoMin: number;
};

const INICIAL: EstadoServico = {};

/** RF20 — listagem com edição e remoção dos serviços já cadastrados. */
export function ListaServicos({ servicos }: { servicos: ServicoDaLista[] }) {
  const [editando, setEditando] = useState<string | null>(null);

  if (servicos.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Nenhum serviço cadastrado ainda. Use o formulário acima para começar.
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="space-y-3">
      {servicos.map((servico) => (
        <li key={servico.id}>
          {editando === servico.id ? (
            <FormularioEdicao servico={servico} aoFechar={() => setEditando(null)} />
          ) : (
            <ItemServico servico={servico} aoEditar={() => setEditando(servico.id)} />
          )}
        </li>
      ))}
    </ul>
  );
}

function ItemServico({ servico, aoEditar }: { servico: ServicoDaLista; aoEditar: () => void }) {
  const [estado, acao, removendo] = useActionState(removerServicoAction, INICIAL);

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="min-w-0">
          <p className="truncate font-medium">{servico.nome}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Tag className="size-3.5" aria-hidden />
              {precoEmReais(servico.preco)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5" aria-hidden />
              {duracaoLegivel(servico.duracaoMin)}
            </span>
          </p>
          {estado.mensagem && <AlertaErro className="mt-2">{estado.mensagem}</AlertaErro>}
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={aoEditar}>
            <Pencil aria-hidden />
            Editar
          </Button>
          <form action={acao}>
            <input type="hidden" name="servicoId" value={servico.id} />
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              disabled={removendo}
              aria-label={`Excluir ${servico.nome}`}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 aria-hidden />
              {removendo ? "Excluindo..." : "Excluir"}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

function FormularioEdicao({ servico, aoFechar }: { servico: ServicoDaLista; aoFechar: () => void }) {
  const [estado, acao, salvando] = useActionState(editarServicoAction, INICIAL);

  // Salvou: a lista já foi revalidada no servidor, então basta fechar a edição.
  useEffect(() => {
    if (estado.sucesso) aoFechar();
  }, [estado.sucesso, aoFechar]);

  return (
    <Card>
      <CardContent className="p-4">
        <form action={acao} className="space-y-4">
          <input type="hidden" name="servicoId" value={servico.id} />
          {estado.mensagem && <AlertaErro>{estado.mensagem}</AlertaErro>}

          <div className="grid gap-4 sm:grid-cols-[1fr_10rem_10rem]">
            <Campo
              label="Nome do serviço"
              name="nome"
              id={`nome-${servico.id}`}
              required
              maxLength={120}
              defaultValue={estado.valores?.nome ?? servico.nome}
              erro={estado.erros?.nome?.[0]}
            />
            <Campo
              label="Preço (R$)"
              name="preco"
              id={`preco-${servico.id}`}
              inputMode="decimal"
              placeholder="Consultar preço"
              defaultValue={estado.valores?.preco ?? (servico.preco === null ? "" : String(servico.preco))}
              erro={estado.erros?.preco?.[0]}
            />
            <Campo
              label="Duração (min)"
              name="duracaoMin"
              id={`duracao-${servico.id}`}
              type="number"
              required
              min={5}
              max={600}
              step={5}
              defaultValue={estado.valores?.duracaoMin ?? String(servico.duracaoMin)}
              erro={estado.erros?.duracaoMin?.[0]}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={aoFechar}>
              <X aria-hidden />
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
