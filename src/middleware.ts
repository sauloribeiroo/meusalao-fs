import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Protege as rotas antes de chegar na página: usa só a configuração leve,
// sem acesso ao banco (o middleware roda no Edge).
export const { auth: middleware } = NextAuth(authConfig);

export default middleware;

export const config = {
  // Tudo, menos arquivos estáticos e as rotas internas do Auth.js
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
