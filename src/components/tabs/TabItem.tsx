import React from 'react';
import { TabsTrigger } from "@/components/ui/tabs";

interface TabItemProps {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export function TabItem({ value, label, icon }: TabItemProps) {
  return (
    <TabsTrigger value={value} className="flex items-center gap-2">
      {icon}
      <span>{label}</span>
    </TabsTrigger>
  );
}