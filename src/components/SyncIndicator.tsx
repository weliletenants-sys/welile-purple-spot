import { RefreshCw, CloudOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";

export const SyncIndicator = () => {
  const { queueLength, isSyncing, isOnline, syncQueue } = useOfflineQueue();

  if (queueLength === 0 && isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 min-w-[280px]">
        <div className="flex items-center gap-3">
          {isSyncing ? (
            <>
              <RefreshCw className="h-5 w-5 text-primary animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-medium">Syncing changes...</p>
                <p className="text-xs text-muted-foreground">
                  {queueLength} action{queueLength !== 1 ? "s" : ""} pending
                </p>
              </div>
            </>
          ) : !isOnline ? (
            <>
              <CloudOff className="h-5 w-5 text-orange-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Offline Mode</p>
                <p className="text-xs text-muted-foreground">
                  {queueLength} action{queueLength !== 1 ? "s" : ""} queued
                </p>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Ready to sync</p>
                <p className="text-xs text-muted-foreground">
                  {queueLength} action{queueLength !== 1 ? "s" : ""} pending
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => syncQueue()}
                className="gap-2"
              >
                <RefreshCw className="h-3 w-3" />
                Sync Now
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
