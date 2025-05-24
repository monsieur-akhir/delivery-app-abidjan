// Type définition pour PendingOperation
export interface PendingOperation {
  type: "create_delivery" | "submit_rating" | "bid" | "tracking" | "update_profile" | "support_request";
  data: Record<string, unknown>;
  id?: string;
  timestamp: string;
}

// Type définition pour le contexte NetworkContext
export interface NetworkContextType {
  isConnected: boolean;
  isOfflineMode: boolean;
  pendingOperations: PendingOperation[];
  syncPendingOperations: () => Promise<void>;
  addPendingUpload: (operation: Omit<PendingOperation, "id">) => void;
  removePendingOperation: (id: string) => void;
  clearPendingOperations: () => void;
}
