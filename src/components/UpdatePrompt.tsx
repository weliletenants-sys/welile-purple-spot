import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Sparkles, RefreshCw } from 'lucide-react';

export const UpdatePrompt = () => {
  const { toast } = useToast();
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [newWorker, setNewWorker] = useState<ServiceWorker | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date());
  const [postponeCount, setPostponeCount] = useState(() => {
    const saved = localStorage.getItem('update_postpone_count');
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        
        // Reasonable update checking - every 5 minutes for stability
        setInterval(() => {
          reg.update();
          setLastCheckTime(new Date());
        }, 5 * 60 * 1000);
        
        // Check immediately on page load
        reg.update();
        setLastCheckTime(new Date());
        
        // Check when page becomes visible (user returns to tab)
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            reg.update();
            setLastCheckTime(new Date());
          }
        });
        
        // Check on focus (user clicks on window)
        window.addEventListener('focus', () => {
          reg.update();
          setLastCheckTime(new Date());
        });
      });

      // Listen for new service worker
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Show success toast
        toast({
          title: "✨ App Updated Successfully",
          description: "You're now using the latest version with all new features and improvements.",
          duration: 4000,
        });
        
        // Close dialog if open
        setShowUpdateDialog(false);
        
        // Reload the page after a brief delay to show the toast
        setTimeout(() => {
          window.location.reload();
        }, 1000);
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
              setNewWorker(installingWorker);
              setShowUpdateDialog(true);
              
              // Show a subtle toast notification
              toast({
                title: "Update Available",
                description: "A new version is ready when you're ready to update.",
                duration: 6000,
              });
            }
          });
        }
      });
    }
  }, [registration, toast]);

  const handleUpdate = () => {
    if (newWorker) {
      // Reset postpone count on update
      localStorage.removeItem('update_postpone_count');
      setPostponeCount(0);
      newWorker.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdateDialog(false);
      window.location.reload();
    }
  };

  const handleLater = () => {
    const newCount = postponeCount + 1;
    setPostponeCount(newCount);
    localStorage.setItem('update_postpone_count', newCount.toString());
    setShowUpdateDialog(false);
    
    // Reasonable reminder timing - 1 hour for better UX
    setTimeout(() => {
      setShowUpdateDialog(true);
    }, 60 * 60 * 1000);
  };

  return (
    <>
      <Dialog open={showUpdateDialog} onOpenChange={(open) => {
        // Prevent closing the dialog by clicking outside
        if (!open) {
          handleLater();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-gradient-to-r from-primary to-accent relative">
                <Sparkles className="w-6 h-6 text-primary-foreground animate-pulse" />
                {postponeCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold animate-bounce">
                    {postponeCount}
                  </div>
                )}
              </div>
              <DialogTitle className="text-2xl">New Features Available!</DialogTitle>
            </div>
            <DialogDescription className="text-base pt-2">
              A new version with improvements and features is available. Update when convenient to get the latest enhancements.
              {postponeCount >= 2 && (
                <div className="mt-3 p-3 bg-muted border border-border rounded-md">
                  <p className="text-sm text-muted-foreground">
                    💡 You've postponed this update {postponeCount} times. Updating ensures you have the best experience.
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col gap-2 pt-4">
            <Button 
              onClick={handleUpdate} 
              size="lg" 
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Update Now
            </Button>
            <Button 
              onClick={handleLater} 
              variant="outline" 
              size="lg" 
              className="w-full"
            >
              Remind Me Later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Update Check Indicator - Hidden for cleaner UX across devices */}
    </>
  );
};
