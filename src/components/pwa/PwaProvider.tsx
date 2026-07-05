import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaProvider() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(console.warn);
    }

    const onInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || dismissed || !deferred) return null;

  return (
    <div className="fixed bottom-20 inset-x-4 z-[100] mx-auto max-w-md md:bottom-6 md:left-auto md:right-6">
      <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-background/95 p-4 shadow-2xl backdrop-blur">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
          <Download className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Install AgroLink</p>
          <p className="text-xs text-muted-foreground">Add to home screen — full-screen feed & checkout.</p>
        </div>
        <button
          onClick={async () => {
            await deferred.prompt();
            setDeferred(null);
          }}
          className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
        >
          Install
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
