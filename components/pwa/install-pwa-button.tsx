"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function handleInstall() {
    if (isInstalled) {
      return;
    }

    if (!deferredPrompt) {
      setShowHint(true);
      window.setTimeout(() => setShowHint(false), 3200);
      return;
    }

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleInstall}
        aria-label={isInstalled ? "App installed" : "Install app"}
        className="min-w-[6.75rem]"
      >
        <Download className="mr-2 h-4 w-4" />
        {isInstalled ? "Installed" : "Install"}
      </Button>
      {showHint ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] w-52 rounded-2xl border border-slateblue-100 bg-white p-3 text-xs leading-5 text-slateblue-700 shadow-card">
          Use your browser menu to install this app if the install prompt is not available yet.
        </div>
      ) : null}
    </div>
  );
}
