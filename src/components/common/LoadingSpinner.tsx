import React from "react";

/**
 * LoadingSpinner component
 * Reusable loading spinner for route loading states
 */
export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-purple-600 flex items-center space-x-2">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
        <span>Laden...</span>
      </div>
    </div>
  );
};

