
import { useContext } from "react";
import { PlayerListLockContext } from "@/context/PlayerListLockContext";
import { usePlayerListLockFallback } from "./usePlayerListLockFallback";

/**
 * Hook to access player list lock status.
 * Uses the shared context to avoid multiple database calls.
 * Falls back to creating a new instance if provider is not available (backwards compatibility).
 */
export const usePlayerListLock = () => {
  const context = useContext(PlayerListLockContext);
  
  // If context is available, use it (preferred - avoids multiple database calls)
  if (context !== undefined) {
    return context;
  }
  
  // Fallback: create a new instance if context is not available
  // This should not happen if PlayerListLockProvider is properly set up
  console.warn('⚠️ PlayerListLockProvider not found, using fallback. This may cause multiple database calls.');
  
  return usePlayerListLockFallback();
};
