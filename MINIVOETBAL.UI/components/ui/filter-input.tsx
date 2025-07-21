import React from "react";
import { Input } from "../../MINIVOETBAL.UI/components/ui/input";
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
        className="bg-white placeholder:text-purple-200 text-purple-dark border border-purple-dark rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-dark focus:border-purple-dark transition-all duration-200"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default FilterInput; 