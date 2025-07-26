
import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement> & {
    stickyHeader?: boolean;
    stickyColumns?: number;
  }
>(({ className, stickyHeader = false, stickyColumns = 0, ...props }, ref) => (
  <div className={cn(
    "relative w-full overflow-auto border-[0.5px] border-[var(--purple-400)] rounded-xl overflow-hidden",
    stickyColumns > 0 && "responsive-table-container"
  )}>
    <table
      ref={ref}
      className={cn(
        "table w-full caption-bottom text-sm",
        stickyHeader && "sticky-header-table",
        stickyColumns > 0 && `sticky-columns-${stickyColumns}`,
        className
      )}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn(className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn(className)} {...props} />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot ref={ref} className={cn(className)} {...props} />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr ref={ref} className={cn(className)} {...props} />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & {
    sticky?: boolean;
    stickyLeft?: number;
  }
>(({ className, sticky = false, stickyLeft, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      sticky && "sticky-column",
      className
    )}
    style={sticky && stickyLeft !== undefined ? { left: `${stickyLeft}px` } : undefined}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & {
    sticky?: boolean;
    stickyLeft?: number;
  }
>(({ className, sticky = false, stickyLeft, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      sticky && "sticky-column",
      className
    )}
    style={sticky && stickyLeft !== undefined ? { left: `${stickyLeft}px` } : undefined}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption ref={ref} className={cn(className)} {...props} />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
