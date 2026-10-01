"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { removerServicoAction } from "@/acoes/servicos";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormularioServico, type ServicoEmEdicao } from "@/app/(app)/salao/meu/servicos/formulario-servico";

type Servico = { id: string; nome: string; preco: number | null; duracaoMin: number };

const formatoPreco = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function ListaServicos({ salaoId, servicosIniciais }: { salaoId: string; servicosIniciais: Servico[] }) {
  const router = useRouter();
  const [servicos, setServicos] = useState(servicosIniciais);
  const [emEdicao, setEmEdicao] = useState<ServicoEmEdicao | "novo" | null>(null);
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const [, iniciarTransicao] = useTransition();

  function fecharFormulario() {
    setEmEdicao(null);
    router.refresh();
  }

  function remover(id: string) {
    setRemovendoId(id);
    iniciarTransicao(async () => {
      await removerServicoAction(id);
      setServicos((atual) => atual.filter((s) => s.id !== id));
      setRemovendoId(null);
    });
  }

  return (
    <div className="mt-8 space-y-4">
      {emEdicao && (
        <FormularioServico
          salaoId={salaoId}
          servico={emEdicao === "novo" ? null : emEdicao}
          aoSalvar={fecharFormulario}
          aoCancelar={() => setEmEdicao(null)}
        />
      )}

      {!emEdicao && (
        <Button onClick={() => setEmEdicao("novo")}>
          <Plus aria-hidden />
          Novo serviço
        </Button>
      )}

      {servicos.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Nenhum serviço cadastrado ainda.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {servicos.map((servico) => (
            <li key={servico.id}>
              <Card>
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-medium">{servico.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {servico.preco ? formatoPreco.format(servico.preco) : "Consultar preço"} ·{" "}
                      {servico.duracaoMin} min
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => setEmEdicao(servico)}>
                      <Pencil aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remover"
                      disabled={removendoId === servico.id}
                      onClick={() => remover(servico.id)}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
