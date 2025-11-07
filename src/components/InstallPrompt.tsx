import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      // Check if user has dismissed before
      const dismissed = localStorage.getItem('install-prompt-dismissed');
      const dismissedTime = dismissed ? parseInt(dismissed) : 0;
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      
      // Show immediately if never dismissed or dismissed more than 24 hours ago
      if (!dismissed || dismissedTime < oneDayAgo) {
        setTimeout(() => {
          setShowPrompt(true);
        }, 500);
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
    }
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Store dismissal time to show again after 24 hours
    localStorage.setItem('install-prompt-dismissed', Date.now().toString());
  };

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="sm:max-w-md">
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">📱 Install Welile Tenants</DialogTitle>
          <DialogDescription className="text-base pt-2 space-y-2">
            <p className="font-semibold">Get the full app experience on your device!</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Quick access from your home screen</li>
              <li>Works offline - no internet needed</li>
              <li>Faster loading and better performance</li>
              <li>Push notifications for updates</li>
            </ul>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-4">
          <Button onClick={handleInstall} size="lg" className="w-full text-lg py-6">
            ⬇️ Install Now
          </Button>
          <Button onClick={handleDismiss} variant="outline" size="lg" className="w-full">
            Remind Me Tomorrow
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
