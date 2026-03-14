// Saint-Denis de La Réunion : lat=-20.8823, lon=55.4504

export type ConditionMeteo = "soleil" | "nuageux" | "pluie" | "orage";

export const meteoStyles: Record<ConditionMeteo, React.CSSProperties> = {
  soleil: {},
  nuageux: { filter: "brightness(0.98)" },
  pluie: { filter: "brightness(0.96) saturate(0.95)" },
  orage: { filter: "brightness(0.94) saturate(0.90)" },
};

let cachedCondition: ConditionMeteo | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 min

export async function getMeteoReunion(): Promise<ConditionMeteo> {
  // Retourner le cache si encore valide
  if (cachedCondition && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedCondition;
  }

  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=-20.8823&longitude=55.4504&current=weathercode&timezone=Indian%2FReunion"
    );
    const data = await res.json();
    const code: number = data.current.weathercode;

    let condition: ConditionMeteo;
    if (code === 0 || code === 1) condition = "soleil";
    else if (code <= 48) condition = "nuageux";
    else if (code <= 67) condition = "pluie";
    else condition = "orage";

    cachedCondition = condition;
    cacheTimestamp = Date.now();
    return condition;
  } catch {
    return "soleil";
  }
}
