// Détecte si on tourne dans Tauri (app desktop)
export const isTauri = () =>
  typeof window !== "undefined" && "__TAURI__" in window;

// Envoie une notification native si Tauri, sinon Notification API web
export async function notifierDesktop(titre: string, corps: string) {
  if (isTauri()) {
    try {
      // @ts-ignore — Tauri n'est pas installé en mode web
      const mod = await import(/* webpackIgnore: true */ "@tauri-apps/api/notification");
      await mod.sendNotification({ title: titre, body: corps });
    } catch { /* Tauri non disponible */ }
  } else if (
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    new Notification(titre, { body: corps });
  }
}
