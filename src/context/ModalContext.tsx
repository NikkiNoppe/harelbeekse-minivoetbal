import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/**
 * ModalContext - Centralized Modal State Management
 * 
 * This context provides a global way to manage modal state across the entire app.
 * All modals should use this context to open/close, ensuring consistent behavior.
 * 
 * Usage:
 * ```tsx
 * const { openLoginModal, closeLoginModal, isLoginModalOpen } = useModal();
 * ```
 */

interface ModalContextType {
  // Login Modal
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  
  // Test Modal (for testing modal system)
  isTestModalOpen: boolean;
  openTestModal: () => void;
  closeTestModal: () => void;
  
  // Extensible for other modals
  // Add more modal states here as needed
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  const openLoginModal = useCallback(() => {
    setIsLoginModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
  }, []);

  const openTestModal = useCallback(() => {
    setIsTestModalOpen(true);
  }, []);

  const closeTestModal = useCallback(() => {
    setIsTestModalOpen(false);
  }, []);

  const value: ModalContextType = {
    isLoginModalOpen,
    openLoginModal,
    closeLoginModal,
    isTestModalOpen,
    openTestModal,
    closeTestModal,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};

/**
 * useModal Hook
 * 
 * Access modal state and controls from any component.
 * 
 * @throws Error if used outside ModalProvider
 */
export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  
  return context;
};

