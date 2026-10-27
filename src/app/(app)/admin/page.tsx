import type { Metadata } from "next";
import { CalendarCheck, Eye, MessageSquare, Store, UserRound, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { resumoDaPlataforma } from "@/services/admin/admin.service";

export const metadata: Metadata = { title: "Administração | MeuSalão" };

/** RF26 — números gerais da plataforma. */
export default async function AdminPage() {
  const resumo = await resumoDaPlataforma();

  const indicadores = [
    { Icone: Users, rotulo: "Usuários", valor: resumo.usuarios },
    { Icone: UserRound, rotulo: "Donos de salão", valor: resumo.donos },
    { Icone: Store, rotulo: "Salões", valor: resumo.saloes },
    { Icone: Eye, rotulo: "Salões publicados", valor: resumo.saloesPublicados },
    { Icone: CalendarCheck, rotulo: "Agendamentos", valor: resumo.agendamentos },
    { Icone: MessageSquare, rotulo: "Avaliações", valor: resumo.avaliacoes },
  ];

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {indicadores.map(({ Icone, rotulo, valor }) => (
        <li key={rotulo}>
          <Card>
            <CardContent className="p-5">
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Icone className="size-4" aria-hidden />
                {rotulo}
              </p>
              <p className="mt-1 text-2xl font-black tracking-tight">{valor}</p>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
