"use client";

import { useState, useEffect } from "react";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const standalone =
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as { standalone?: boolean }).standalone === true);
    if (standalone) return;

    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const ios = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
    setIsIOS(!!ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    if (ios) {
      const t = setTimeout(() => setShow(true), 1500);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShow(false);
    setDeferredPrompt(null);
  };

  if (!show) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm">
      <span className="text-neutral-600">
        {isIOS
          ? "Install: Share → Add to Home Screen"
          : "Install the app for quick access."}
      </span>
      <div className="flex gap-2">
        {!isIOS && deferredPrompt && (
          <button
            type="button"
            onClick={handleInstall}
            className="rounded-md bg-neutral-900 px-3 py-1.5 font-medium text-white hover:bg-neutral-800"
          >
            Install App
          </button>
        )}
        <button
          type="button"
          onClick={() => setShow(false)}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-neutral-600 hover:bg-neutral-50"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
