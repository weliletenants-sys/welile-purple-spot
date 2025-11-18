import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export const UpdatePrompt = () => {
  const { toast } = useToast();
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        
        // Check for updates every 5 minutes
        setInterval(() => {
          reg.update();
        }, 5 * 60 * 1000);
        
        // Check immediately on page load
        reg.update();
        
        // Check when page becomes visible
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            reg.update();
          }
        });
        
        // Check on focus
        window.addEventListener('focus', () => {
          reg.update();
        });
      });

      // Listen for new service worker taking control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        toast({
          title: "✨ App Updated",
          description: "Reloading with the latest version...",
          duration: 2000,
        });
        
        // Reload immediately
        setTimeout(() => {
          window.location.reload();
        }, 500);
      });
    }
  }, [toast]);

  useEffect(() => {
    if (registration) {
      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Auto-update immediately without user intervention
              toast({
                title: "Updating App",
                description: "Installing the latest version...",
                duration: 3000,
              });
              
              installingWorker.postMessage({ type: 'SKIP_WAITING' });
              // Reload will happen via controllerchange event
            }
          });
        }
      });
    }
  }, [registration, toast]);

  return null; // No UI needed - auto-updates happen silently
};
