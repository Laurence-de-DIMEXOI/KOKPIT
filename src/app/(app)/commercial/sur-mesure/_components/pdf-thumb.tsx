"use client";

import { useEffect, useState } from "react";

// Cache mémoire url → dataURL (évite de re-rendre le PDF à chaque montage de carte).
const cache = new Map<string, string>();
let workerReady = false;

/** Vignette = 1re page d'un PDF, rendue côté navigateur via pdfjs. */
export function PdfThumb({ url, className }: { url: string; className?: string }) {
  const [img, setImg] = useState<string | null>(() => cache.get(url) ?? null);

  useEffect(() => {
    if (cache.has(url)) { setImg(cache.get(url)!); return; }
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        if (!workerReady) {
          pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
          workerReady = true;
        }
        const pdf = await pdfjs.getDocument({ url }).promise;
        const page = await pdf.getPage(1);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: Math.min(2, 360 / base.width) });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        await page.render({ canvasContext: ctx, viewport }).promise;
        const data = canvas.toDataURL("image/jpeg", 0.72);
        cache.set(url, data);
        if (!cancelled) setImg(data);
      } catch {
        /* PDF illisible / CORS → on laisse le fond vide */
      }
    })();
    return () => { cancelled = true; };
  }, [url]);

  return (
    <div
      className={className}
      style={img ? { backgroundImage: `url(${img})`, backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center" } : undefined}
    />
  );
}
