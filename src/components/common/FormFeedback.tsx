import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormFeedbackProps {
  isSuccess?: boolean;
  isSubmitting?: boolean;
  children: React.ReactNode;
  className?: string;
  "aria-live"?: "polite" | "assertive" | "off";
}

export const FormFeedback: React.FC<FormFeedbackProps> = ({
  isSuccess = false,
  isSubmitting = false,
  children,
  className,
  "aria-live": ariaLive = "polite",
}) => {
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isSuccess) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  return (
    <div
      className={cn(
        "transition-all duration-150 ease-in-out",
        showSuccess && "form-success-feedback",
        className
      )}
      style={{
        transitionDuration: "var(--transition-fast)",
        transitionTimingFunction: "var(--transition-timing)",
      }}
      aria-live={ariaLive}
      aria-atomic="true"
    >
      {showSuccess && (
        <div
          className="flex items-center gap-2 text-success mb-2 animate-in fade-in duration-150"
          role="status"
        >
          <Check className="h-4 w-4" />
          <span className="text-small">Opgeslagen</span>
        </div>
      )}
      {isSubmitting && (
        <div className="text-muted-foreground text-small" role="status" aria-busy="true">
          Opslaan...
        </div>
      )}
      {children}
    </div>
  );
};
