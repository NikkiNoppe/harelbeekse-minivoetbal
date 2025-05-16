
import React from "react";
import { TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface TabItemProps {
  value: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}

const TabItem: React.FC<TabItemProps> = ({ value, icon, label, badge }) => {
  return (
    <TabsTrigger 
      value={value} 
      className={cn(
        "flex-1 min-w-max flex items-center justify-center gap-2 px-4 py-2 font-medium",
        "data-[state=active]:bg-accent data-[state=active]:text-orange-500 data-[state=active]:shadow-sm",
        "dark:data-[state=active]:bg-orange-500 dark:data-[state=active]:text-slate-950", // Dark text in dark mode
        "text-muted-foreground transition-all"
      )}
    >
      {icon}
      <span>{label}</span>
      {badge && (
        <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
          {badge}
        </span>
      )}
    </TabsTrigger>
  );
};

export default TabItem;
