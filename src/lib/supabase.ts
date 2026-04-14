// Client Supabase Storage léger (REST API directe, pas de SDK requis)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Upload un fichier dans le bucket Supabase Storage
 * @returns L'URL publique du fichier
 */
export async function uploadToStorage(
  bucket: string,
  path: string,
  file: ArrayBuffer,
  contentType: string
): Promise<string> {
  const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: new Uint8Array(file),
  });

  if (!res.ok) {
    const rawText = await res.text();
    let detail = rawText;
    try {
      const json = JSON.parse(rawText);
      detail = json.message || json.error || rawText;
    } catch { /* raw text */ }
    console.error(`[Supabase Storage] Upload error ${res.status}:`, rawText);
    throw new Error(`[${res.status}] ${detail}`);
  }

  // Retourne l'URL publique
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Supprime un fichier du bucket Supabase Storage
 */
export async function deleteFromStorage(bucket: string, path: string): Promise<void> {
  const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;

  await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });
}

/**
 * Génère une signed URL pour un fichier dans un bucket privé
 * @returns L'URL signée (valide pour la durée spécifiée)
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 3600
): Promise<string> {
  const url = `${SUPABASE_URL}/storage/v1/object/sign/${bucket}/${path}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn }),
  });

  if (!res.ok) {
    throw new Error(`Signed URL error ${res.status}`);
  }

  const data = await res.json();
  return `${SUPABASE_URL}/storage/v1${data.signedURL}`;
}
