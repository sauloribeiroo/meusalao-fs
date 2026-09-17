import type { DefaultSession } from "next-auth";
import type { UsuarioPublico } from "@/services/usuarios/usuarios.service";

// Campos que o MeuSalão acrescenta à sessão e ao token do Auth.js.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      nome: string;
      papel: UsuarioPublico["papel"];
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    papel?: UsuarioPublico["papel"];
  }
}
