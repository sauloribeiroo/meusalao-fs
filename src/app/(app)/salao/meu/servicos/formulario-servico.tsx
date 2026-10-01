"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Plus, Save } from "lucide-react";
import { atualizarServicoAction, criarServicoAction, type EstadoFormularioServico } from "@/acoes/servicos";
import { Campo } from "@/components/campo";
import { AlertaErro } from "@/components/ui/alerta";
import { Button } from "@/components/ui/button";

const ESTADO_INICIAL: EstadoFormularioServico = {};

export type ServicoEmEdicao = { id: string; nome: string; preco: number | null; duracaoMin: number } | null;

export function FormularioServico({
  salaoId,
  servico,
  aoSalvar,
  aoCancelar,
}: {
  salaoId: string;
  servico: ServicoEmEdicao;
  aoSalvar: () => void;
  aoCancelar: () => void;
}) {
  const acao = servico ? atualizarServicoAction : criarServicoAction;
  const [estado, action] = useActionState(acao, ESTADO_INICIAL);
  const erros = estado.erros ?? {};

  useEffect(() => {
    if (estado.sucesso) aoSalvar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado.sucesso]);

  return (
    <form action={action} className="space-y-4 rounded-xl border border-border bg-card p-4">
      <input type="hidden" name="salaoId" value={salaoId} />
      {servico && <input type="hidden" name="servicoId" value={servico.id} />}

      <Campo label="Nome do serviço" name="nome" required defaultValue={servico?.nome} erro={erros.nome?.[0]} />
      <div className="grid grid-cols-2 gap-3">
        <Campo
          label="Preço (opcional)"
          name="preco"
          inputMode="decimal"
          placeholder="Ex.: 80,00"
          defaultValue={servico?.preco ?? undefined}
          erro={erros.preco?.[0]}
        />
        <Campo
          label="Duração (min)"
          name="duracaoMin"
          type="number"
          min={1}
          required
          defaultValue={servico?.duracaoMin}
          erro={erros.duracaoMin?.[0]}
        />
      </div>

      {estado.mensagem && <AlertaErro>{estado.mensagem}</AlertaErro>}

      <div className="flex gap-2">
        <BotaoSalvar editando={Boolean(servico)} />
        <Button type="button" variant="outline" onClick={aoCancelar}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function BotaoSalvar({ editando }: { editando: boolean }) {
  const { pending } = useFormStatus();
  const Icone = editando ? Save : Plus;

  return (
    <Button type="submit" disabled={pending}>
      <Icone aria-hidden />
      {pending ? "Salvando..." : editando ? "Salvar alterações" : "Adicionar serviço"}
    </Button>
  );
}
