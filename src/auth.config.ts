import type { NextAuthConfig } from "next-auth";

/** Rotas que exigem sessão. O restante (login, cadastro) é público. */
const ROTAS_PRIVADAS = ["/inicio"];

/**
 * Parte da configuração que também roda no middleware (Edge). Não pode
 * importar Prisma nem bcrypt — por isso os providers ficam em `auth.ts`.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const logado = Boolean(auth?.user);
      const { pathname } = request.nextUrl;

      // Quem já está logado não precisa ver login/cadastro.
      if (logado && (pathname === "/login" || pathname === "/cadastro")) {
        return Response.redirect(new URL("/inicio", request.nextUrl));
      }

      if (ROTAS_PRIVADAS.some((rota) => pathname.startsWith(rota))) return logado;

      return true;
    },
  },
} satisfies NextAuthConfig;
