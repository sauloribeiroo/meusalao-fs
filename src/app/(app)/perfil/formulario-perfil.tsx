"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { atualizarPerfilAction, type EstadoEdicao } from "@/acoes/perfil";
import { Campo } from "@/components/campo";
import { FormularioSalvo } from "@/components/formulario-salvo";
import { AlertaErro } from "@/components/ui/alerta";
import { Button } from "@/components/ui/button";

const INICIAL: EstadoEdicao = {};

export type PerfilDoUsuario = {
  nome: string;
  email: string;
  telefone: string | null;
};

/** RF07 — edição dos dados do próprio usuário. */
export function FormularioPerfil({ perfil }: { perfil: PerfilDoUsuario }) {
  const [estado, acao, salvando] = useActionState(atualizarPerfilAction, INICIAL);
  const router = useRouter();

  // O cookie de sessão novo só vale a partir da próxima requisição, então o
  // cabeçalho ainda mostraria o nome antigo. O refresh busca a página de novo,
  // já com o cookie atualizado.
  useEffect(() => {
    if (estado.salvoEm) router.refresh();
  }, [estado.salvoEm, router]);

  return (
    <form action={acao} className="space-y-4">
      {estado.mensagem && <AlertaErro>{estado.mensagem}</AlertaErro>}

      <Campo
        label="Nome"
        name="nome"
        required
        maxLength={120}
        autoComplete="name"
        defaultValue={estado.valores?.nome ?? perfil.nome}
        erro={estado.erros?.nome?.[0]}
      />
      <Campo
        label="E-mail"
        name="email"
        type="email"
        required
        autoComplete="email"
        defaultValue={estado.valores?.email ?? perfil.email}
        erro={estado.erros?.email?.[0]}
      />
      <Campo
        label="Telefone"
        name="telefone"
        type="tel"
        autoComplete="tel"
        placeholder="(85) 99999-0000"
        defaultValue={estado.valores?.telefone ?? perfil.telefone ?? ""}
        erro={estado.erros?.telefone?.[0]}
      />

      <p className="text-xs text-muted-foreground">
        O e-mail é usado para entrar na plataforma. Ao trocá-lo, use o novo no próximo login.
      </p>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={salvando}>
          <Save aria-hidden />
          {salvando ? "Salvando..." : "Salvar alterações"}
        </Button>
        <FormularioSalvo salvoEm={estado.salvoEm} />
      </div>
    </form>
  );
}
