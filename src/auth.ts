import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { authConfig } from "@/auth.config";
import { autenticarUsuario, buscarUsuarioPorId, vincularContaSocial } from "@/services/usuarios/usuarios.service";

// Os campos extras de Session e JWT ficam em src/types/next-auth.d.ts.

/** O login com Google só é oferecido quando as credenciais estão configuradas. */
export const googleHabilitado = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, senha: {} },
      // Um erro aqui vira CredentialsSignin no Auth.js, e a UI o traduz em
      // "e-mail ou senha incorretos".
      authorize: async (credenciais) => {
        const usuario = await autenticarUsuario(credenciais);
        return { id: usuario.id, name: usuario.nome, email: usuario.email, image: usuario.imagem };
      },
    }),
    ...(googleHabilitado ? [Google({ allowDangerousEmailAccountLinking: true })] : []),
  ],
  callbacks: {
    ...authConfig.callbacks,

    // No login social, cria/vincula o usuário na nossa base e adota o id dela.
    async signIn({ account, profile, user }) {
      if (account?.provider !== "google") return true;
      if (!profile?.email) return false;

      const usuario = await vincularContaSocial({
        provedor: account.provider,
        idNoProvedor: account.providerAccountId,
        nome: profile.name ?? profile.email,
        email: profile.email,
        imagem: typeof profile.picture === "string" ? profile.picture : null,
      });

      user.id = usuario.id;
      return true;
    },

    // O papel entra no token no login e acompanha a sessão dali em diante.
    async jwt({ token, user }) {
      if (user?.id) {
        const usuario = await buscarUsuarioPorId(user.id);
        if (usuario) {
          token.sub = usuario.id;
          token.name = usuario.nome;
          token.email = usuario.email;
          token.papel = usuario.papel;
        }
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.sub ?? "";
      session.user.nome = token.name ?? "";
      session.user.papel = token.papel ?? "CLIENTE";
      return session;
    },
  },
});
