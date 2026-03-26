// Détecte si on tourne dans Tauri (app desktop)
export const isTauri = () =>
  typeof window !== "undefined" && "__TAURI__" in window;

// Envoie une notification native si Tauri, sinon Notification API web
export async function notifierDesktop(titre: string, corps: string) {
  if (isTauri()) {
    const { sendNotification } = await import("@tauri-apps/api/notification");
    await sendNotification({ title: titre, body: corps });
  } else if (
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    new Notification(titre, { body: corps });
  }
}
