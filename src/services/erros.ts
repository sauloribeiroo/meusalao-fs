// Erros de negócio da camada de serviços. Não dependem do Next: quem chama
// (Server Action, Route Handler, futuro backend dedicado) decide como traduzi-los.

export class ErroDeNegocio extends Error {
  constructor(
    mensagem: string,
    readonly codigo: string,
  ) {
    super(mensagem);
    this.name = "ErroDeNegocio";
  }
}

/** Dados inválidos, com as mensagens agrupadas por campo do formulário. */
export class ErroDeValidacao extends ErroDeNegocio {
  constructor(readonly erros: Record<string, string[]>) {
    super("Dados inválidos", "VALIDACAO");
    this.name = "ErroDeValidacao";
  }
}

/** Violação de uma regra de negócio (ex.: e-mail já cadastrado). */
export class ErroDeConflito extends ErroDeNegocio {
  constructor(mensagem: string) {
    super(mensagem, "CONFLITO");
    this.name = "ErroDeConflito";
  }
}

/** Credenciais inválidas no login. */
export class ErroDeCredenciais extends ErroDeNegocio {
  constructor() {
    super("E-mail ou senha incorretos", "CREDENCIAIS");
    this.name = "ErroDeCredenciais";
  }
}
