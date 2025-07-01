
import React from "react";
import { cn } from "@/lib/utils";

interface TabItemProps {
  value: string;
  icon: React.ReactNode | string;
  label: string;
  badge?: string;
}

const TabItem: React.FC<TabItemProps> = ({
  value,
  icon,
  label,
  badge
}) => {
  return (
    <div className={cn(
      "flex-1 flex items-center justify-center gap-2 px-4 py-2 font-medium",
      "bg-purple-400 text-white",
      "hover:bg-purple-500 hover:text-white",
      "transition-all"
    )}>
      {typeof icon === 'string' ? <span>{icon}</span> : icon}
      <span>{label}</span>
      {badge && (
        <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-white text-purple-600 border-purple-400">
          {badge}
        </span>
      )}
    </div>
  );
};

export default TabItem;
