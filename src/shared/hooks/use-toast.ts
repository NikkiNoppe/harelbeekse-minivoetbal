
import { useState, useCallback } from "react"

interface Toast {
  id: string
  title: string
  description?: string
  variant?: "default" | "destructive"
  action?: React.ReactNode
}

let toastQueue: Toast[] = [];
let setToastsGlobal: ((toasts: Toast[]) => void) | null = null;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  // Register the setter globally
  if (!setToastsGlobal) {
    setToastsGlobal = setToasts;
  }

  const toast = useCallback((toast: Omit<Toast, 'id'>) => {
    const toastWithId = { ...toast, id: Math.random().toString(36) }
    setToasts(prev => [...prev, toastWithId])
    
    // Auto remove toast after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastWithId.id))
    }, 5000)
  }, [])

  return {
    toast,
    toasts
  }
}

// Create a standalone toast function
export const toast = (toastData: Omit<Toast, 'id'>) => {
  if (setToastsGlobal) {
    const toastWithId = { ...toastData, id: Math.random().toString(36) }
    toastQueue.push(toastWithId);
    setToastsGlobal([...toastQueue]);
    
    // Auto remove toast after 5 seconds
    setTimeout(() => {
      toastQueue = toastQueue.filter(t => t.id !== toastWithId.id);
      if (setToastsGlobal) {
        setToastsGlobal([...toastQueue]);
      }
    }, 5000);
  } else {
    // Fallback to console if hook not initialized
    console.log('Toast:', toastData.title, toastData.description);
  }
};
