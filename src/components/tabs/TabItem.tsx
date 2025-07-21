
import React, { memo } from "react";
import { cn } from "@/lib/utils";

interface TabItemProps {
  value: string;
  icon: React.ReactNode | string;
  label: string;
  badge?: string;
  isActive?: boolean;
  onClick?: () => void;
}

// Badge component for tab items
const TabBadge = memo(({ badge }: { badge: string }) => (
  <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-white text-purple-600 border-purple-400 font-medium shadow-sm">
    {badge}
  </span>
));

TabBadge.displayName = 'TabBadge';

// Icon component for tab items
const TabIcon = memo(({ icon }: { icon: React.ReactNode | string }) => (
  <div className="flex items-center justify-center">
    {typeof icon === 'string' ? (
      <span className="text-lg">{icon}</span>
    ) : (
      icon
    )}
  </div>
));

TabIcon.displayName = 'TabIcon';

// Label component for tab items
const TabLabel = memo(({ label }: { label: string }) => (
  <span className="font-medium text-sm sm:text-base">{label}</span>
));

TabLabel.displayName = 'TabLabel';

const TabItem: React.FC<TabItemProps> = memo(({
  value,
  icon,
  label,
  badge,
  isActive = false,
  onClick
}) => {
  const handleClick = () => {
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3",
        "transition-all duration-200 ease-in-out",
        "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
        "hover:scale-[1.02] active:scale-[0.98]",
        // Active state
        isActive ? [
          "bg-purple-500 text-white shadow-lg",
          "hover:bg-purple-600"
        ] : [
          "bg-purple-400 text-white",
          "hover:bg-purple-500 hover:shadow-md"
        ]
      )}
      aria-label={`${label} tab${badge ? ` (${badge})` : ''}`}
      aria-selected={isActive}
      role="tab"
    >
      <TabIcon icon={icon} />
      <TabLabel label={label} />
      {badge && <TabBadge badge={badge} />}
    </button>
  );
});

TabItem.displayName = 'TabItem';

export default TabItem;
