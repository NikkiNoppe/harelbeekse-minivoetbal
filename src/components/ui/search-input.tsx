import React from "react";
import { Input } from "@/components/ui/input";

interface SearchInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  placeholder,
  value,
  onChange,
  className = ""
}) => {
  return (
    <div className={className}>
      <Input
        type="search"
        placeholder={`🔍 ${placeholder}`}
        className="bg-white placeholder:text-brand-200 text-brand-dark border border-brand-dark rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-dark focus:border-brand-dark transition-all duration-200"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default SearchInput; 