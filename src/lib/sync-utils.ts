/** Découpe un tableau en chunks de taille donnée */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/** Pause async */
export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
