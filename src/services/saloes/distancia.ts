/**
 * Distância entre dois pontos na superfície da Terra (RF11).
 *
 * Fórmula de Haversine, que trata a Terra como esfera. O erro é de até 0,5%,
 * irrelevante para "a 1,2 km de você" — e evita trazer PostGIS para o projeto
 * só por causa de uma ordenação.
 */

/** Raio médio da Terra, em quilômetros. */
const RAIO_TERRA_KM = 6371;

const emRadianos = (graus: number) => (graus * Math.PI) / 180;

export type Coordenada = { latitude: number; longitude: number };

export function distanciaEmKm(origem: Coordenada, destino: Coordenada): number {
  const deltaLat = emRadianos(destino.latitude - origem.latitude);
  const deltaLng = emRadianos(destino.longitude - origem.longitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(emRadianos(origem.latitude)) *
      Math.cos(emRadianos(destino.latitude)) *
      Math.sin(deltaLng / 2) ** 2;

  return RAIO_TERRA_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Coordenada válida, descartando o (0,0) que costuma ser dado não preenchido. */
export function coordenadaValida(latitude: unknown, longitude: unknown): latitude is number {
  return (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180 &&
    !(latitude === 0 && longitude === 0)
  );
}

/** "0.8 km" ou "350 m" — abaixo de 1 km, metros comunicam melhor. */
export function distanciaLegivel(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1).replace(".", ",")} km`;
}
