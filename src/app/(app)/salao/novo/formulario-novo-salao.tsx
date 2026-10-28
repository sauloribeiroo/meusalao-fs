"use client";

import { useActionState, useEffect, useState } from "react";
import { Check, MapPin, Search, Store } from "lucide-react";
import {
  buscarEnderecoAction,
  criarSalaoAction,
  type EstadoBuscaEndereco,
  type EstadoCadastroSalao,
} from "@/acoes/cadastro-salao";
import { Campo } from "@/components/campo";
import { AlertaErro } from "@/components/ui/alerta";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const CADASTRO: EstadoCadastroSalao = {};
const BUSCA: EstadoBuscaEndereco = {};

type Local = { latitude: number; longitude: number; descricao: string };

/**
 * RF03 — cadastro do salão.
 *
 * A localização vem da busca de endereço (Nominatim), e não de latitude e
 * longitude digitadas: ninguém sabe a própria latitude de cabeça. Da escolha
 * aproveitamos só as coordenadas — o endereço gravado continua sendo o que o
 * dono escreveu, porque o `display_name` do Nominatim é longo demais para
 * aparecer num card ("Rua das Flores, 120, Aldeota, Fortaleza, Região
 * Geográfica Imediata de Fortaleza, ..., Brasil").
 *
 * Seguir sem localização é permitido: só impede o salão de aparecer no mapa e
 * na ordenação por proximidade, não de existir e receber agendamentos.
 */
export function FormularioNovoSalao() {
  const [estado, cadastrar, criando] = useActionState(criarSalaoAction, CADASTRO);
  const [busca, buscarEndereco, buscando] = useActionState(buscarEnderecoAction, BUSCA);

  const [endereco, setEndereco] = useState(estado.valores?.endereco ?? "");
  const [escolhido, setEscolhido] = useState<Local>();

  /**
   * Navegação por recarga completa, e não `router.push`: a ação acabou de
   * trocar o cookie da sessão (o papel virou DONO_SALAO), e só uma requisição
   * nova faz o middleware e os layouts enxergarem o papel atualizado. Uma
   * navegação do lado do cliente reaproveitaria o estado antigo e a área do
   * dono recusaria quem acabou de criar o salão.
   */
  useEffect(() => {
    if (estado.criadoEm) window.location.href = "/salao/meu/dados";
  }, [estado.criadoEm]);

  return (
    <div className="space-y-6">
      {/* A busca fica fora do formulário de cadastro: formulário aninhado não
          existe em HTML, e ela precisa de submit próprio. O endereço digitado
          é espelhado num campo oculto do cadastro. */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-5">
        <div>
          <p className="font-medium">Endereço</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Digite e busque no mapa. É o que posiciona seu salão para quem procura por perto.
          </p>
        </div>

        <form action={buscarEndereco} className="flex flex-wrap gap-2">
          <div className="min-w-56 flex-1">
            <label className="sr-only" htmlFor="endereco-busca">
              Endereço do salão
            </label>
            <input
              id="endereco-busca"
              name="endereco"
              value={endereco}
              onChange={(evento) => setEndereco(evento.target.value)}
              placeholder="Rua das Flores, 120, Aldeota, Fortaleza"
              className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button type="submit" variant="outline" disabled={buscando}>
            <Search aria-hidden />
            {buscando ? "Buscando..." : "Buscar"}
          </Button>
        </form>

        {estado.erros?.endereco?.[0] && (
          <p className="text-xs text-destructive">{estado.erros.endereco[0]}</p>
        )}

        {busca.mensagem && <AlertaErro>{busca.mensagem}</AlertaErro>}

        {busca.locais && busca.locais.length > 0 && (
          <ul className="space-y-2">
            {busca.locais.map((local) => {
              const ativo =
                escolhido?.latitude === local.latitude && escolhido?.longitude === local.longitude;

              return (
                <li key={`${local.latitude},${local.longitude}`}>
                  <button
                    type="button"
                    onClick={() => setEscolhido(local)}
                    aria-pressed={ativo}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-lg border p-3 text-left text-sm transition-colors",
                      ativo ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                    )}
                  >
                    {ativo ? (
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    ) : (
                      <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                    )}
                    <span className="min-w-0">{local.descricao}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {escolhido ? (
          <p className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
            <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>Localização definida. Seu salão vai aparecer no mapa.</span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Sem localização o salão funciona normalmente, mas fica fora do mapa e da ordenação por
            proximidade. Dá para ajustar depois em Meu salão.
          </p>
        )}
      </div>

      <form action={cadastrar} className="space-y-5" noValidate>
        <input type="hidden" name="endereco" value={endereco} />
        <input type="hidden" name="latitude" value={escolhido?.latitude ?? ""} />
        <input type="hidden" name="longitude" value={escolhido?.longitude ?? ""} />

        <Campo
          label="Nome do salão"
          name="nome"
          required
          defaultValue={estado.valores?.nome}
          erro={estado.erros?.nome?.[0]}
          placeholder="Salão da Márcia"
        />

        <Campo
          label="Tipo"
          name="tipo"
          defaultValue={estado.valores?.tipo}
          erro={estado.erros?.tipo?.[0]}
          placeholder="Salão de beleza, Barbearia, Estúdio..."
        />

        <Campo
          label="Telefone"
          name="telefone"
          type="tel"
          defaultValue={estado.valores?.telefone}
          erro={estado.erros?.telefone?.[0]}
          placeholder="(85) 3333-0001"
        />

        <div className="space-y-1.5">
          <Label htmlFor="descricao">Descrição</Label>
          <textarea
            id="descricao"
            name="descricao"
            rows={3}
            maxLength={500}
            defaultValue={estado.valores?.descricao}
            placeholder="Conte em poucas linhas o que o salão oferece."
            className="flex w-full rounded-lg border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {estado.erros?.descricao?.[0] && (
            <p className="text-xs text-destructive">{estado.erros.descricao[0]}</p>
          )}
        </div>

        {estado.mensagem && <AlertaErro>{estado.mensagem}</AlertaErro>}

        <Button type="submit" size="lg" className="w-full" disabled={criando}>
          <Store aria-hidden />
          {criando ? "Criando..." : "Criar salão"}
        </Button>
      </form>
    </div>
  );
}
