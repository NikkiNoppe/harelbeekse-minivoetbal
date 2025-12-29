import React, { memo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backPath?: string;
  backLabel?: string;
  rightAction?: React.ReactNode;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  backPath,
  backLabel = "Terug",
  rightAction,
  className
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={cn("mb-6", className)}>
      {/* Back button row */}
      <div className={cn(
        "mb-2",
        backPath !== undefined ? "flex items-center justify-between" : rightAction ? "w-full" : ""
      )}>
        {backPath !== undefined ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground -ml-2 h-8 px-2"
          >
            <ArrowLeft size={16} className="mr-1" />
            <span className="text-sm">{backLabel}</span>
          </Button>
        ) : null}
        
        {rightAction && (
          <div className={backPath === undefined ? "w-full" : ""}>
            {rightAction}
          </div>
        )}
      </div>

      {/* Title section */}
      <div>
        <h1 className="text-2xl font-bold leading-tight" style={{ color: 'var(--primary)' }}>
          {title}
        </h1>
      </div>
    </div>
  );
};

export default memo(PageHeader);
