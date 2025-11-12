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

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        
        // Check for updates every 10 minutes
        setInterval(() => {
          reg.update();
        }, 10 * 60 * 1000);
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
              
              // Also show a toast as backup
              toast({
                title: "🎉 New Features Available!",
                description: "An update is ready. Tap 'Update Now' to get the latest version.",
                duration: 8000,
              });
            }
          });
        }
      });
    }
  }, [registration, toast]);

  const handleUpdate = () => {
    if (newWorker) {
      newWorker.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdateDialog(false);
      window.location.reload();
    }
  };

  const handleLater = () => {
    setShowUpdateDialog(false);
    // Show reminder after 5 minutes
    setTimeout(() => {
      setShowUpdateDialog(true);
    }, 5 * 60 * 1000);
  };

  return (
    <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-full bg-gradient-to-r from-primary to-accent">
              <Sparkles className="w-6 h-6 text-primary-foreground animate-pulse" />
            </div>
            <DialogTitle className="text-2xl">New Features Available!</DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            We've added new features and improvements to the app. Update now to get the latest version and enjoy the enhanced experience!
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-col gap-2 pt-4">
          <Button 
            onClick={handleUpdate} 
            size="lg" 
            className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
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
  );
};
