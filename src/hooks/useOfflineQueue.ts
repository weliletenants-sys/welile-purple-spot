import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export interface QueuedAction {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retries: number;
}

const QUEUE_KEY = "offline_sync_queue";
const MAX_RETRIES = 3;

export const useOfflineQueue = () => {
  const [queue, setQueue] = useState<QueuedAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Load queue from localStorage
  useEffect(() => {
    const savedQueue = localStorage.getItem(QUEUE_KEY);
    if (savedQueue) {
      try {
        setQueue(JSON.parse(savedQueue));
      } catch (error) {
        console.error("Failed to load queue:", error);
        localStorage.removeItem(QUEUE_KEY);
      }
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    if (queue.length > 0) {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } else {
      localStorage.removeItem(QUEUE_KEY);
    }
  }, [queue]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Back online! Syncing your changes...");
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Add action to queue
  const addToQueue = useCallback((type: string, data: any) => {
    const action: QueuedAction = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    setQueue((prev) => [...prev, action]);
    
    if (!navigator.onLine) {
      toast.info("Saved offline. Will sync when online.", {
        duration: 2000,
      });
    }
  }, []);

  // Remove action from queue
  const removeFromQueue = useCallback((actionId: string) => {
    setQueue((prev) => prev.filter((action) => action.id !== actionId));
  }, []);

  // Update action retry count
  const incrementRetries = useCallback((actionId: string) => {
    setQueue((prev) =>
      prev.map((action) =>
        action.id === actionId
          ? { ...action, retries: action.retries + 1 }
          : action
      )
    );
  }, []);

  // Process a single action
  const processAction = useCallback(async (action: QueuedAction): Promise<boolean> => {
    try {
      // Import the action processor
      const { processQueuedAction } = await import("@/utils/queueProcessor");
      await processQueuedAction(action);
      return true;
    } catch (error) {
      console.error(`Failed to process action ${action.type}:`, error);
      return false;
    }
  }, []);

  // Sync all queued actions
  const syncQueue = useCallback(async () => {
    if (!isOnline || queue.length === 0 || isSyncing) {
      return;
    }

    setIsSyncing(true);

    const actionsToProcess = [...queue];
    let successCount = 0;
    let failedActions: QueuedAction[] = [];

    for (const action of actionsToProcess) {
      const success = await processAction(action);

      if (success) {
        successCount++;
        removeFromQueue(action.id);
      } else {
        if (action.retries < MAX_RETRIES) {
          incrementRetries(action.id);
          failedActions.push(action);
        } else {
          // Max retries reached, remove from queue
          removeFromQueue(action.id);
          toast.error(`Failed to sync action after ${MAX_RETRIES} attempts`, {
            description: `Action type: ${action.type}`,
          });
        }
      }
    }

    setIsSyncing(false);

    if (successCount > 0) {
      toast.success(`Successfully synced ${successCount} action${successCount > 1 ? 's' : ''}!`);
    }

    if (failedActions.length > 0) {
      toast.warning(`${failedActions.length} action${failedActions.length > 1 ? 's' : ''} will be retried`);
    }
  }, [isOnline, queue, isSyncing, processAction, removeFromQueue, incrementRetries]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && queue.length > 0 && !isSyncing) {
      // Small delay to ensure connection is stable
      const timer = setTimeout(() => {
        syncQueue();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, queue.length, isSyncing, syncQueue]);

  return {
    queue,
    queueLength: queue.length,
    isSyncing,
    isOnline,
    addToQueue,
    syncQueue,
  };
};
