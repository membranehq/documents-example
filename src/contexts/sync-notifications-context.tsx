"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface SyncNotificationContextType {
  triggerRefresh: () => void;
  isRefreshing: boolean;
}

const SyncNotificationContext = createContext<SyncNotificationContextType | undefined>(undefined);

export function SyncNotificationProvider({ children }: { children: ReactNode }) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const triggerRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Reset after a short delay to allow components to react
    setTimeout(() => setIsRefreshing(false), 100);
  }, []);

  return (
    <SyncNotificationContext.Provider value={{ triggerRefresh, isRefreshing }}>
      {children}
    </SyncNotificationContext.Provider>
  );
}

export function useSyncNotifications() {
  const context = useContext(SyncNotificationContext);
  if (context === undefined) {
    throw new Error("useSyncNotifications must be used within a SyncNotificationProvider");
  }
  return context;
}
