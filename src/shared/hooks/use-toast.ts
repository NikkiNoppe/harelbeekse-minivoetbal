import { useState, useCallback } from "react"

interface Toast {
  title: string
  description?: string
  variant?: "default" | "destructive"
}

let toastQueue: Toast[] = [];
let setToastsGlobal: ((toasts: Toast[]) => void) | null = null;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  // Register the setter globally
  if (!setToastsGlobal) {
    setToastsGlobal = setToasts;
  }

  const toast = useCallback((toast: Toast) => {
    setToasts(prev => [...prev, toast])
    
    // Auto remove toast after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.slice(1))
    }, 5000)
  }, [])

  return {
    toast,
    toasts
  }
}

// Create a standalone toast function
export const toast = (toastData: Toast) => {
  if (setToastsGlobal) {
    toastQueue.push(toastData);
    setToastsGlobal([...toastQueue]);
    
    // Auto remove toast after 5 seconds
    setTimeout(() => {
      toastQueue = toastQueue.slice(1);
      if (setToastsGlobal) {
        setToastsGlobal([...toastQueue]);
      }
    }, 5000);
  } else {
    // Fallback to console if hook not initialized
    console.log('Toast:', toastData.title, toastData.description);
  }
};
