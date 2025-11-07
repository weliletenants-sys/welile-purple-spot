import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const InstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      // Check if user dismissed the dialog and hasn't dismissed the banner
      const dialogDismissed = localStorage.getItem('install-prompt-dismissed');
      const bannerHidden = localStorage.getItem('install-banner-hidden');
      
      if (dialogDismissed && !bannerHidden) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowBanner(false);
      localStorage.removeItem('install-prompt-dismissed');
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setBannerDismissed(true);
    localStorage.setItem('install-banner-hidden', 'true');
  };

  if (!showBanner || bannerDismissed) return null;

  return (
    <div className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Download className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium truncate">
            Install Welile Tenants for quick access and offline use
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            onClick={handleInstall}
            size="sm"
            variant="secondary"
            className="whitespace-nowrap"
          >
            Install
          </Button>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-primary-foreground/20 rounded transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
