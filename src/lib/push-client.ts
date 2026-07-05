/** Browser push registration — Bolt-style job alerts for drivers */

export async function registerForPushNotifications(userId: string): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const token =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? `web-${crypto.randomUUID()}`
      : `web-${userId}-${Date.now()}`;

  await fetch("/api/push/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, token, platform: "web" }),
  });

  return true;
}

export function showLocalNotification(title: string, body: string, link?: string) {
  if (typeof window === "undefined" || Notification.permission !== "granted") return;
  const n = new Notification(title, { body, icon: "/favicon.ico" });
  if (link) n.onclick = () => { window.location.href = link; };
}
