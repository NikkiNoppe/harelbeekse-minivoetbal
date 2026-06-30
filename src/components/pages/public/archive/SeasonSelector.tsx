import React from 'react';
import { cn } from '@/lib/utils';

interface Props {
  seasons: string[];
  selected: string | null;
  onSelect: (label: string) => void;
}

const SeasonSelector: React.FC<Props> = ({ seasons, selected, onSelect }) => {
  if (seasons.length === 0) return null;
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
      {seasons.map((s) => {
        const active = s === selected;
        return (
          <button
            key={s}
            onClick={() => onSelect(s)}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border-[1.5px] transition-all',
              active
                ? 'bg-brand-700 text-white border-brand-700 shadow-md'
                : 'bg-white text-brand-800 border-brand-200 hover:bg-brand-50'
            )}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
};

export default SeasonSelector;
