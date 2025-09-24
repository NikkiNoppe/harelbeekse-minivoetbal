import React from "react";
import { SelectValue } from "@/components/ui/select";

interface PlayerSelectValueProps {
  placeholder?: string;
  selectedPlayerName?: string | null;
}

const PlayerSelectValue: React.FC<PlayerSelectValueProps> = ({ 
  placeholder, 
  selectedPlayerName 
}) => {
  // Dynamic font sizing based on name length
  const getFontSizeClass = (name: string | null | undefined): string => {
    if (!name) return '';
    
    if (name.length > 15) return 'text-xs';
    if (name.length > 10) return 'text-sm';
    return '';
  };

  const fontSizeClass = getFontSizeClass(selectedPlayerName);

  return (
    <SelectValue 
      placeholder={placeholder}
      className={`truncate max-w-full ${fontSizeClass}`}
      style={{
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap'
      }}
    />
  );
};

export default PlayerSelectValue;