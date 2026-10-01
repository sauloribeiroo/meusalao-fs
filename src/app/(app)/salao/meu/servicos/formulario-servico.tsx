"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { criarServicoAction, type EstadoServico } from "@/acoes/servicos";
import { Campo } from "@/components/campo";
import { AlertaErro } from "@/components/ui/alerta";
import { Button } from "@/components/ui/button";

const INICIAL: EstadoServico = {};

/** RF20 — formulário de novo serviço. */
export function FormularioServico() {
  const [estado, acao, enviando] = useActionState(criarServicoAction, INICIAL);
  const formRef = useRef<HTMLFormElement>(null);

  // Cadastrou: limpa os campos para o próximo serviço.
  useEffect(() => {
    if (estado.sucesso) formRef.current?.reset();
  }, [estado.sucesso]);

  return (
    <form ref={formRef} action={acao} className="space-y-4">
      {estado.mensagem && <AlertaErro>{estado.mensagem}</AlertaErro>}

      <div className="grid gap-4 sm:grid-cols-[1fr_10rem_10rem]">
        <Campo
          label="Nome do serviço"
          name="nome"
          required
          maxLength={120}
          placeholder="Corte feminino"
          defaultValue={estado.valores?.nome}
          erro={estado.erros?.nome?.[0]}
        />
        <Campo
          label="Preço (R$)"
          name="preco"
          inputMode="decimal"
          placeholder="80,00"
          defaultValue={estado.valores?.preco}
          erro={estado.erros?.preco?.[0]}
        />
        <Campo
          label="Duração (min)"
          name="duracaoMin"
          type="number"
          required
          min={5}
          max={600}
          step={5}
          placeholder="60"
          defaultValue={estado.valores?.duracaoMin}
          erro={estado.erros?.duracaoMin?.[0]}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={enviando}>
          <Plus aria-hidden />
          {enviando ? "Cadastrando..." : "Cadastrar serviço"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Sem preço, o serviço aparece como &ldquo;Consultar preço&rdquo;.
        </p>
      </div>

      {/* Anunciado por leitor de tela sem roubar o foco do formulário. */}
      <p aria-live="polite" className="sr-only">
        {estado.sucesso ? "Serviço cadastrado." : ""}
      </p>
    </form>
  );
}
