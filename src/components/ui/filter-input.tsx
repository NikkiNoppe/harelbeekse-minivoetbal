import React from "react";
import { Input } from "@/components/ui/input";
import { LucideIcon } from "lucide-react";

interface FilterInputProps {
  type?: "search" | "date" | "text";
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  icon: LucideIcon;
  className?: string;
}

const FilterInput: React.FC<FilterInputProps> = ({
  type = "search",
  placeholder,
  value,
  onChange,
  icon: Icon,
  className = ""
}) => {
  // Map icons to emoji
  const getIconEmoji = () => {
    if (Icon.name === 'Calendar') return '📅';
    if (Icon.name === 'Trophy') return '🏆';
    return '🔍';
  };

  return (
    <div className={className}>
      <Input
        type={type}
        placeholder={`${getIconEmoji()} ${placeholder}`}
        className="bg-white placeholder:text-brand-200 text-brand-dark border border-brand-dark rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-dark focus:border-brand-dark transition-all duration-200"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default FilterInput; 