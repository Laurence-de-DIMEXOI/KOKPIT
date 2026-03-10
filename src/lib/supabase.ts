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
  file: Buffer | ArrayBuffer,
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
    body: file,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload failed: ${res.status} - ${err}`);
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
