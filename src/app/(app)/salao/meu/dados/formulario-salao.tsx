"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { atualizarSalaoAction, type EstadoEdicao } from "@/acoes/perfil";
import { Campo } from "@/components/campo";
import { FormularioSalvo } from "@/components/formulario-salvo";
import { AlertaErro } from "@/components/ui/alerta";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const INICIAL: EstadoEdicao = {};

export type DadosDoSalao = {
  nome: string;
  endereco: string;
  descricao: string | null;
  tipo: string | null;
  telefone: string | null;
  latitude: number | null;
  longitude: number | null;
};

const texto = (valor: string | null) => valor ?? "";
const numero = (valor: number | null) => (valor === null ? "" : String(valor));

/** RF07 — edição dos dados cadastrais do salão. */
export function FormularioSalao({ salao }: { salao: DadosDoSalao }) {
  const [estado, acao, salvando] = useActionState(atualizarSalaoAction, INICIAL);
  const v = estado.valores;

  return (
    <form action={acao} className="space-y-4">
      {estado.mensagem && <AlertaErro>{estado.mensagem}</AlertaErro>}

      <Campo
        label="Nome do salão"
        name="nome"
        required
        maxLength={120}
        defaultValue={v?.nome ?? salao.nome}
        erro={estado.erros?.nome?.[0]}
      />

      <div className="space-y-1.5">
        <Label htmlFor="descricao">Descrição</Label>
        <textarea
          id="descricao"
          name="descricao"
          rows={3}
          maxLength={500}
          placeholder="Conte em poucas linhas o que o salão oferece."
          defaultValue={v?.descricao ?? texto(salao.descricao)}
          aria-invalid={Boolean(estado.erros?.descricao)}
          className="flex w-full rounded-lg border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {estado.erros?.descricao?.[0] && (
          <p className="text-xs text-destructive">{estado.erros.descricao[0]}</p>
        )}
      </div>

      <Campo
        label="Endereço"
        name="endereco"
        required
        maxLength={200}
        defaultValue={v?.endereco ?? salao.endereco}
        erro={estado.erros?.endereco?.[0]}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          label="Telefone"
          name="telefone"
          type="tel"
          placeholder="(85) 3333-0001"
          defaultValue={v?.telefone ?? texto(salao.telefone)}
          erro={estado.erros?.telefone?.[0]}
        />
        <Campo
          label="Tipo"
          name="tipo"
          maxLength={60}
          placeholder="Salão de bairro, Barbearia..."
          defaultValue={v?.tipo ?? texto(salao.tipo)}
          erro={estado.erros?.tipo?.[0]}
        />
      </div>

      <fieldset className="space-y-3 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-medium">Localização no mapa</legend>
        <p className="text-xs text-muted-foreground">
          Sem as coordenadas o salão continua na busca, mas fica de fora do mapa e da ordenação por
          proximidade.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo
            label="Latitude"
            name="latitude"
            inputMode="decimal"
            placeholder="-3.7437"
            defaultValue={v?.latitude ?? numero(salao.latitude)}
            erro={estado.erros?.latitude?.[0]}
          />
          <Campo
            label="Longitude"
            name="longitude"
            inputMode="decimal"
            placeholder="-38.4968"
            defaultValue={v?.longitude ?? numero(salao.longitude)}
            erro={estado.erros?.longitude?.[0]}
          />
        </div>
      </fieldset>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={salvando}>
          <Save aria-hidden />
          {salvando ? "Salvando..." : "Salvar dados"}
        </Button>
        <FormularioSalvo salvoEm={estado.salvoEm} />
      </div>
    </form>
  );
}
