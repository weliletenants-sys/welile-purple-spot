import { createContext, useContext, ReactNode } from "react";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";

interface OfflineQueueContextType {
  addToQueue: (type: string, data: any) => void;
  queueLength: number;
  isSyncing: boolean;
  isOnline: boolean;
}

const OfflineQueueContext = createContext<OfflineQueueContextType | undefined>(undefined);

export const OfflineQueueProvider = ({ children }: { children: ReactNode }) => {
  const queue = useOfflineQueue();

  return (
    <OfflineQueueContext.Provider value={queue}>
      {children}
    </OfflineQueueContext.Provider>
  );
};

export const useOfflineQueueContext = () => {
  const context = useContext(OfflineQueueContext);
  if (!context) {
    throw new Error("useOfflineQueueContext must be used within OfflineQueueProvider");
  }
  return context;
};
