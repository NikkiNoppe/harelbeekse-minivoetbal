
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        "transition-opacity duration-150 ease-in-out",
        className
      )}
      {...props}
    />
  )
}

// Enhanced skeleton components for better loading states with token-based styling
export const CardSkeleton = () => (
  <div className="space-y-3 p-4">
    <Skeleton className="h-5 w-3/4 bg-muted" />
    <Skeleton className="h-4 w-1/2 bg-muted" />
    <Skeleton className="h-4 w-2/3 bg-muted" />
  </div>
)

export const TableRowSkeleton = () => (
  <div className="flex space-x-4 py-4">
    <Skeleton className="h-4 w-32 bg-muted" />
    <Skeleton className="h-4 w-24 bg-muted" />
    <Skeleton className="h-4 w-28 bg-muted" />
    <Skeleton className="h-4 w-20 bg-muted" />
  </div>
)

export const TeamCardSkeleton = () => (
  <div className="space-y-3 p-4 border border-border rounded-lg bg-card">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Skeleton className="w-8 h-8 rounded-full bg-muted" />
        <Skeleton className="h-5 w-32 bg-muted" />
      </div>
      <Skeleton className="h-6 w-16 bg-muted" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-24 bg-muted" />
      <Skeleton className="h-4 w-28 bg-muted" />
      <Skeleton className="h-4 w-20 bg-muted" />
    </div>
  </div>
)

export const StandingsSkeleton = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="bg-card border border-border rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-8 bg-muted" />
          <Skeleton className="h-5 w-32 bg-muted" />
          <Skeleton className="h-6 w-12 bg-muted" />
        </div>
        <div className="flex items-center gap-4 pt-2 border-t border-border">
          <Skeleton className="h-4 w-16 bg-muted" />
          <Skeleton className="h-4 w-16 bg-muted" />
          <Skeleton className="h-4 w-16 bg-muted" />
        </div>
      </div>
    ))}
  </div>
)

export const MatchCardSkeleton = () => (
  <div className="bg-card border border-border rounded-lg p-4 space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-20 bg-muted" />
      <Skeleton className="h-4 w-16 bg-muted" />
    </div>
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-24 bg-muted" />
      <Skeleton className="h-6 w-12 bg-muted" />
      <Skeleton className="h-6 w-24 bg-muted" />
    </div>
    <div className="flex items-center gap-4">
      <Skeleton className="h-4 w-16 bg-muted" />
      <Skeleton className="h-4 w-16 bg-muted" />
    </div>
  </div>
)

export { Skeleton }
