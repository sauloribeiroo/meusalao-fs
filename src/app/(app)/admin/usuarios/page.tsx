import type { Metadata } from "next";
import { Search } from "lucide-react";
import { SeletorDePapel } from "@/app/(app)/admin/usuarios/seletor-de-papel";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listarUsuarios } from "@/services/admin/admin.service";
import { PAPEIS } from "@/services/admin/schemas";

export const metadata: Metadata = { title: "Usuários | MeuSalão" };

const ROTULO: Record<string, string> = {
  CLIENTE: "Cliente",
  DONO_SALAO: "Dono de salão",
  ADMIN: "Administrador",
};

/** RF26 — usuários da plataforma, com busca e troca de papel. */
export default async function UsuariosAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ termo?: string; papel?: string }>;
}) {
  const { termo, papel } = await searchParams;
  const papelValido = PAPEIS.find((valor) => valor === papel);

  const usuarios = await listarUsuarios({ termo: termo || undefined, papel: papelValido });

  return (
    <div className="space-y-5">
      {/* Busca por GET: o termo fica na URL, então o resultado é compartilhável
          e sobrevive ao recarregar — e não exige estado no cliente. */}
      <form className="flex flex-wrap gap-2">
        <div className="relative min-w-56 flex-1">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            name="termo"
            defaultValue={termo}
            placeholder="Buscar por nome ou e-mail"
            aria-label="Buscar por nome ou e-mail"
            className="pl-9"
          />
        </div>

        <label className="sr-only" htmlFor="filtro-papel">
          Filtrar por papel
        </label>
        <select
          id="filtro-papel"
          name="papel"
          defaultValue={papelValido ?? ""}
          className="h-10 rounded-lg border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Todos os papéis</option>
          {PAPEIS.map((valor) => (
            <option key={valor} value={valor}>
              {ROTULO[valor]}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Buscar
        </button>
      </form>

      {usuarios.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Nenhum usuário encontrado com esses critérios.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {usuarios.map((usuario) => (
            <li key={usuario.id}>
              <Card>
                <CardContent className="flex flex-wrap items-start justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <p className="font-medium">{usuario.nome}</p>
                    <p className="text-sm text-muted-foreground">{usuario.email}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {ROTULO[usuario.papel]} · {usuario.totalSaloes} salão(ões) ·{" "}
                      {usuario.totalAgendamentos} agendamento(s)
                    </p>
                  </div>

                  <SeletorDePapel usuarioId={usuario.id} papel={usuario.papel} />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
