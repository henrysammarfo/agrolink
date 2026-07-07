/** Browser push registration — Web Push via service worker (VAPID optional). */
import { apiFetch } from "@/lib/api/fetch-auth";

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function registerForPushNotifications(userId: string): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (!("serviceWorker" in navigator)) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const reg = await navigator.serviceWorker.ready;

  let subscription = await reg.pushManager.getSubscription();
  if (!subscription && VAPID_PUBLIC) {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    });
  }

  const token = subscription
    ? JSON.stringify(subscription.toJSON())
    : typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `web-${crypto.randomUUID()}`
      : `web-${userId}-${Date.now()}`;

  await apiFetch("/api/push/register", {
    method: "POST",
    body: JSON.stringify({ token, platform: "web" }),
  });

  return true;
}

export function showLocalNotification(title: string, body: string, link?: string) {
  if (typeof window === "undefined" || Notification.permission !== "granted") return;

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(title, {
        body,
        icon: "/icons/icon-192.png",
        badge: "/favicon.png",
        data: { link },
      });
    });
    return;
  }

  const n = new Notification(title, { body, icon: "/icons/icon-192.png" });
  if (link) n.onclick = () => { window.location.href = link; };
}
