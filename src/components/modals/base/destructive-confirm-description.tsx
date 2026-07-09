import * as React from "react"
import { AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface DestructiveConfirmDescriptionProps {
  message: React.ReactNode
  warning?: string
  details?: React.ReactNode
  className?: string
}

/** Standaard inhoud voor verwijder- en andere onomkeerbare bevestigingsmodals. */
export function DestructiveConfirmDescription({
  message,
  warning = "Deze actie kan niet ongedaan worden gemaakt.",
  details,
  className,
}: DestructiveConfirmDescriptionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden />
      </div>
      <p className="text-base font-medium text-foreground">{message}</p>
      {details ? (
        <div className="text-left text-sm text-muted-foreground">{details}</div>
      ) : null}
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-left text-sm text-destructive">
        {warning}
      </div>
    </div>
  )
}

interface InfoConfirmDescriptionProps {
  message: React.ReactNode
  note?: string
  className?: string
}

/** Inhoud voor bevestigingen zonder destructieve impact (bijv. opheffen, finaliseren). */
export function InfoConfirmDescription({
  message,
  note,
  className,
}: InfoConfirmDescriptionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Info className="h-6 w-6 text-primary" aria-hidden />
      </div>
      <p className="text-base font-medium text-foreground">{message}</p>
      {note ? (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-left text-sm text-muted-foreground">
          {note}
        </div>
      ) : null}
    </div>
  )
}
