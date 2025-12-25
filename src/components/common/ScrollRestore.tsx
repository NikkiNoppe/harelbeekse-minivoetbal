import { useEffect } from "react";

/**
 * ScrollRestore component ensures body scroll is always enabled
 * This fixes issues where modals or other components might leave
 * body overflow: hidden after unmounting
 */
export const ScrollRestore: React.FC = () => {
  useEffect(() => {
    // Ensure body is always scrollable on desktop
    const ensureScrollable = () => {
      // Only restore if no modal or sheet is open
      const hasOpenModal = document.querySelector('[role="dialog"][data-state="open"]');
      const hasOpenSheet = document.querySelector('[data-radix-dialog-content][data-state="open"]');
      
      if (!hasOpenModal && !hasOpenSheet) {
        const bodyStyle = window.getComputedStyle(document.body);
        // Always ensure body is scrollable when no modals are open
        if (bodyStyle.overflow === 'hidden' || bodyStyle.overflowY === 'hidden') {
          document.body.style.overflowY = 'auto';
          document.body.style.overflowX = 'hidden';
        }
      }
    };

    // Check immediately
    ensureScrollable();

    // Also check periodically to catch any issues
    const interval = setInterval(ensureScrollable, 1000);

    // Cleanup on unmount
    return () => {
      clearInterval(interval);
      // Final cleanup - ensure scroll is restored
      document.body.style.overflowY = 'auto';
      document.body.style.overflowX = 'hidden';
    };
  }, []);

  return null;
};

