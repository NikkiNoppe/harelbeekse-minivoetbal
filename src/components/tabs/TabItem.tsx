
import React from "react";
import { TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface TabItemProps {
  value: string;
  icon: React.ReactNode;
  label: string;
}

const TabItem: React.FC<TabItemProps> = ({ value, icon, label }) => {
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
    </TabsTrigger>
  );
};

export default TabItem;
