import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export const UpdatePrompt = () => {
  const { toast } = useToast();
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        
        // Check for updates every 30 minutes
        setInterval(() => {
          reg.update();
        }, 30 * 60 * 1000);
      });

      // Listen for new service worker
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        toast({
          title: "Update Available",
          description: "Click to reload and get the latest version.",
          action: (
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
            >
              Reload Now
            </button>
          ),
          duration: 10000,
        });
      });
    }
  }, [toast]);

  useEffect(() => {
    if (registration) {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              toast({
                title: "Update Ready",
                description: "A new version is available. Reload to update.",
                action: (
                  <button
                    onClick={() => {
                      newWorker.postMessage({ type: 'SKIP_WAITING' });
                      window.location.reload();
                    }}
                    className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
                  >
                    Update Now
                  </button>
                ),
                duration: 15000,
              });
            }
          });
        }
      });
    }
  }, [registration, toast]);

  return null;
};
