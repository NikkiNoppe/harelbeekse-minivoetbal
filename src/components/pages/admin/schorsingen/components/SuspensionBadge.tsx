import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SuspensionBadgeProps {
  type: 'yellow' | 'red' | 'active' | 'pending' | 'completed';
  count?: number;
}

export const SuspensionBadge: React.FC<SuspensionBadgeProps> = ({ type, count }) => {
  const styles = {
    yellow: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30 dark:bg-yellow-500/20 dark:text-yellow-400",
    red: "bg-red-500/10 text-red-700 border-red-500/30 dark:bg-red-500/20 dark:text-red-400",
    active: "bg-destructive/10 text-destructive border-destructive/30",
    pending: "bg-secondary text-secondary-foreground",
    completed: "bg-muted text-muted-foreground"
  };

  const labels = {
    yellow: 'Geel',
    red: 'Rood',
    active: 'Actief',
    pending: 'Wachtend',
    completed: 'Voltooid'
  };

  return (
    <Badge 
      variant="outline" 
      className={cn("font-medium", styles[type])}
    >
      {count !== undefined ? count : labels[type]}
    </Badge>
  );
};
