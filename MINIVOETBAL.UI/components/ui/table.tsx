
import * as React from "react"

import { cn } from '../../lib/utils';

// Enhanced table wrapper for visible border & rounded corners with responsive support
const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement> & {
    stickyHeader?: boolean;
    stickyColumns?: number;
  }
>(({ className, stickyHeader = false, stickyColumns = 0, ...props }, ref) => (
  <div className={cn(
    "relative w-full overflow-auto border border-purple-light rounded-lg",
    stickyColumns > 0 && "responsive-table-container"
  )}>
    <table
      ref={ref}
      className={cn(
        "w-full caption-bottom text-sm rounded-lg overflow-hidden",
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
  <thead ref={ref} className={cn("[&_tr]:border-b [&_tr]:border-purple-light bg-purple-light", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0 [&_tr]:border-purple-light", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t border-purple-light bg-purple-light-gray font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-purple-light transition-colors hover:bg-purple-light-gray data-[state=selected]:bg-purple-light-gray",
      className
    )}
    {...props}
  />
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
      "h-12 px-4 text-center align-middle font-medium text-purple-dark bg-purple-light border-purple-light [&:has([role=checkbox])]:pr-0",
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
      "p-4 align-middle text-purple-dark border-purple-light [&:has([role=checkbox])]:pr-0",
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
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-purple-dark", className)}
    {...props}
  />
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
