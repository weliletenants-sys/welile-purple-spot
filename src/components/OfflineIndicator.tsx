import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WifiOff, Wifi } from "lucide-react";

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      // Hide reconnected message after 3 seconds
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-slide-down">
        <Alert className="bg-orange-100 dark:bg-orange-900/50 border-orange-500 shadow-lg">
          <WifiOff className="h-5 w-5 text-orange-700 dark:text-orange-300" />
          <AlertDescription className="text-orange-800 dark:text-orange-200 font-semibold text-base">
            📴 You're Offline - Using saved data
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-slide-down">
        <Alert className="bg-green-100 dark:bg-green-900/50 border-green-500 shadow-lg">
          <Wifi className="h-5 w-5 text-green-700 dark:text-green-300" />
          <AlertDescription className="text-green-800 dark:text-green-200 font-semibold text-base">
            ✅ Back Online!
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return null;
};
