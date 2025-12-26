import * as React from "react"
import { cn } from "@/lib/utils"

const VisuallyHidden = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & {
    asChild?: boolean
  }
>(({ className, asChild, children, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      className: cn(
        "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
        "clip-[rect(0,0,0,0)]",
        className,
        (children.props as any)?.className
      ),
    } as any);
  }
  
  return (
    <span
      ref={ref}
      className={cn(
        "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
        "clip-[rect(0,0,0,0)]",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
})
VisuallyHidden.displayName = "VisuallyHidden"

export { VisuallyHidden }

