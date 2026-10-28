/**
 * Endereço → coordenadas, pelo Nominatim (OpenStreetMap).
 *
 * Mesma fonte dos ladrilhos do mapa, sem chave de API e sem cobrança. A
 * alternativa (Google Geocoding) exigiria credencial no repositório e cartão
 * cadastrado — para um catálogo de salões de bairro, não se paga.
 *
 * A chamada é sempre do servidor, nunca do navegador: o Nominatim pede um
 * User-Agent que identifique a aplicação, e cabeçalho de identificação não se
 * manda do cliente.
 *
 * Limites da política de uso do serviço: no máximo uma consulta por segundo e
 * identificação obrigatória. Por isso a busca é disparada por ação explícita do
 * usuário ("Buscar endereço"), e não a cada tecla digitada.
 */

const ENDPOINT = "https://nominatim.openstreetmap.org/search";

/** Identificação exigida pela política de uso do Nominatim. */
const USER_AGENT = "MeuSalao/1.0 (projeto academico; https://meusalao-fs.vercel.app)";

/** Sem isso, buscar "Rua das Flores" acharia uma rua em Portugal. */
const PAIS = "br";

const TEMPO_LIMITE_MS = 8000;

export type LocalEncontrado = {
  /** Endereço como o Nominatim o conhece — serve de confirmação visual. */
  descricao: string;
  latitude: number;
  longitude: number;
};

/**
 * Busca até `limite` candidatos para o endereço. Devolve lista vazia quando
 * nada é encontrado, e também quando o serviço falha ou demora: o cadastro não
 * pode ficar impedido por um serviço externo fora do ar — nesse caso o dono
 * ainda informa as coordenadas à mão, ou publica sem elas e aparece na lista
 * sem o pin.
 */
export async function buscarCoordenadas(endereco: string, limite = 5): Promise<LocalEncontrado[]> {
  const termo = endereco.trim();
  if (termo.length < 5) return [];

  for (const [indice, tentativa] of variacoes(termo).entries()) {
    // A política do Nominatim pede no máximo uma consulta por segundo.
    if (indice > 0) await new Promise((resolver) => setTimeout(resolver, 1100));

    const encontrados = await consultar(tentativa, limite);
    if (encontrados.length > 0) return encontrados;
  }

  return [];
}

/** Tipos de logradouro que o OSM frequentemente registra de outra forma. */
const PREFIXO_DE_VIA = /^(rua|r\.|avenida|av\.?|travessa|tv\.?|alameda|praça|praca|rodovia|estrada)\s+/i;

/**
 * Variações do endereço, da mais específica para a mais ampla.
 *
 * A cobertura do OpenStreetMap no Brasil é irregular, e falha de dois jeitos
 * previsíveis: raramente conhece o número da casa, e às vezes registra a via
 * com outro tipo ("Rua Barão de Studart" não existe; "Barão de Studart" sim).
 * Tentar nessa ordem transforma boa parte dos "não encontrado" em um pin na
 * via certa — que, para situar o salão no mapa de uma cidade, já basta.
 */
function variacoes(termo: string): string[] {
  const tentativas = [termo];

  const semNumero = termo.replace(/,?\s*\b\d{1,6}\b/g, "").replace(/\s*,\s*,/g, ",").trim();
  if (semNumero.length >= 5 && semNumero !== termo) tentativas.push(semNumero);

  const semPrefixo = semNumero.replace(PREFIXO_DE_VIA, "").trim();
  if (semPrefixo.length >= 5 && !tentativas.includes(semPrefixo)) tentativas.push(semPrefixo);

  return tentativas;
}

async function consultar(termo: string, limite: number): Promise<LocalEncontrado[]> {
  const busca = new URLSearchParams({
    q: termo,
    format: "jsonv2",
    addressdetails: "0",
    countrycodes: PAIS,
    limit: String(limite),
  });

  try {
    const resposta = await fetch(`${ENDPOINT}?${busca}`, {
      headers: { "User-Agent": USER_AGENT, "Accept-Language": "pt-BR" },
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
    });

    if (!resposta.ok) {
      console.error(`Nominatim respondeu ${resposta.status} para "${termo}"`);
      return [];
    }

    const dados: unknown = await resposta.json();
    if (!Array.isArray(dados)) return [];

    return dados.flatMap(paraLocal);
  } catch (erro) {
    console.error("Falha ao consultar o Nominatim:", erro);
    return [];
  }
}

type RespostaDoNominatim = { display_name?: unknown; lat?: unknown; lon?: unknown };

/**
 * O Nominatim devolve lat/lon como texto. A conversão pode falhar, então o
 * resultado inválido é descartado em vez de virar NaN no banco — daí o flatMap
 * com lista vazia.
 */
function paraLocal(item: RespostaDoNominatim): LocalEncontrado[] {
  const latitude = Number(item?.lat);
  const longitude = Number(item?.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
  if (typeof item.display_name !== "string") return [];

  return [{ descricao: item.display_name, latitude, longitude }];
}
