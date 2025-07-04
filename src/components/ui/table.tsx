
import * as React from "react"
import { cn } from "@/lib/utils"

// Enhanced table wrapper for visible border & rounded corners with responsive features
const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement> & {
    stickyFirstColumn?: boolean;
    stickyHeader?: boolean;
  }
>(({ className, stickyFirstColumn = false, stickyHeader = true, ...props }, ref) => (
  <div className="relative w-full overflow-auto border border-purple-light rounded-lg">
    <table
      ref={ref}
      className={cn(
        "w-full caption-bottom text-sm rounded-lg overflow-hidden",
        stickyFirstColumn && "sticky-first-column",
        className
      )}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement> & {
    sticky?: boolean;
  }
>(({ className, sticky = true, ...props }, ref) => (
  <thead 
    ref={ref} 
    className={cn(
      "[&_tr]:border-b [&_tr]:border-purple-light bg-purple-light",
      sticky && "sticky top-0 z-20",
      className
    )} 
    {...props} 
  />
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
    stickyLeft?: boolean;
  }
>(({ className, sticky = false, stickyLeft = false, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-2 sm:px-4 text-center align-middle font-medium text-purple-dark bg-purple-light border-purple-light [&:has([role=checkbox])]:pr-0 text-xs sm:text-sm whitespace-nowrap",
      sticky && "sticky top-0 z-10",
      stickyLeft && "sticky left-0 z-30 bg-purple-light shadow-md",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & {
    stickyLeft?: boolean;
  }
>(({ className, stickyLeft = false, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-2 sm:p-4 align-middle text-purple-dark border-purple-light [&:has([role=checkbox])]:pr-0 text-xs sm:text-sm",
      stickyLeft && "sticky left-0 z-20 bg-white shadow-md font-medium",
      className
    )}
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
