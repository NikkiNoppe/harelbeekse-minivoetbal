
import React from "react";
import { ArrowRight } from "lucide-react";

interface FormMenuItemProps {
  title: string | React.ReactNode;
  subtitle?: string;
  onClick?: () => void;
}

export const MatchesFormMenuItem: React.FC<FormMenuItemProps> = ({ title, subtitle, onClick }) => {
  return (
    <div
      className="flex items-center justify-between p-3 rounded-md border hover:bg-slate-100 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div>
        <h4 className="font-medium">{title}</h4>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
};
