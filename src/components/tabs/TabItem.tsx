import React from "react";
import { TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
interface TabItemProps {
  value: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}
const TabItem: React.FC<TabItemProps> = ({
  value,
  icon,
  label,
  badge
}) => {
  return <TabsTrigger value={value} className={cn("flex-1 min-w-max flex items-center justify-center gap-2 px-4 py-2 font-medium", "data-[state=active]:bg-purple-light data-[state=active]:text-purple-dark data-[state=active]:shadow-sm", "dark:data-[state=active]:bg-purple-light dark:data-[state=active]:text-purple-dark", "text-purple-dark transition-all hover:text-purple-light border-purple-light")}>
      {icon}
      <span className="text-soccer-white">{label}</span>
      {badge && <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-purple-dark text-white border-purple-light">
          {badge}
        </span>}
    </TabsTrigger>;
};
export default TabItem;