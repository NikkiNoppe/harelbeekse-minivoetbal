import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface TableColumn<T = any> {
  key: string;
  header: string;
  accessor: (row: T, index: number) => React.ReactNode;
  className?: string;
  mobilePriority?: "primary" | "secondary" | "hidden";
  mobileLabel?: string;
}

export interface ResponsiveTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  keyExtractor: (row: T, index: number) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T, index: number) => void;
  className?: string;
  cardClassName?: string;
  ariaLabel?: string;
}

function ResponsiveTable<T = any>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  emptyMessage = "Geen data gevonden",
  onRowClick,
  className,
  cardClassName,
  ariaLabel,
}: ResponsiveTableProps<T>) {
  // Desktop: Table view
  const TableView = () => (
    <div className="hidden md:block w-full overflow-x-auto">
      <Table className={cn("table", className)} aria-label={ariaLabel}>
        <TableHeader>
          <TableRow className="table-header-row">
            {columns.map((column) => (
              <TableHead key={column.key} className={column.className}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8">
                Laden...
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => (
              <TableRow
                key={keyExtractor(row, index)}
                onClick={onRowClick ? () => onRowClick(row, index) : undefined}
                className={onRowClick ? "cursor-pointer" : ""}
                role={onRowClick ? "button" : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRowClick(row, index);
                        }
                      }
                    : undefined
                }
              >
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.accessor(row, index)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  // Mobile: Card view
  const CardView = () => {
    const primaryColumns = columns.filter((col) => col.mobilePriority === "primary" || !col.mobilePriority);
    const secondaryColumns = columns.filter((col) => col.mobilePriority === "secondary");
    const hiddenColumns = columns.filter((col) => col.mobilePriority === "hidden");

    return (
      <div className="md:hidden space-y-3" aria-label={ariaLabel}>
        {isLoading ? (
          <div className="space-y-3" role="status" aria-live="polite" aria-busy="true">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data.length === 0 ? (
          <Card>
            <CardContent className="p-4">
              <div className="text-center text-muted-foreground">{emptyMessage}</div>
            </CardContent>
          </Card>
        ) : (
          data.map((row, index) => (
            <Card
              key={keyExtractor(row, index)}
              onClick={onRowClick ? () => onRowClick(row, index) : undefined}
              className={cn(
                "transition-[box-shadow,opacity] duration-150 ease-in-out",
                onRowClick && "cursor-pointer active:opacity-90",
                cardClassName
              )}
              style={{
                boxShadow: 'var(--shadow-elevation-1)',
              }}
              onMouseEnter={onRowClick ? (e) => {
                if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
                  e.currentTarget.style.boxShadow = 'var(--shadow-elevation-2)';
                }
              } : undefined}
              onMouseLeave={onRowClick ? (e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-elevation-1)';
              } : undefined}
              role={onRowClick ? "button" : "article"}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRowClick(row, index);
                      }
                    }
                  : undefined
              }
              aria-label={
                onRowClick
                  ? `Rij ${index + 1}, klik om details te bekijken`
                  : `Rij ${index + 1}`
              }
            >
              <CardContent className="p-4 space-y-3">
                {/* Primary information - always visible */}
                <div className="space-y-2">
                  {primaryColumns.map((column) => (
                    <div key={column.key} className="flex items-start justify-between gap-2 min-h-[44px]">
                      <span className="text-small text-muted-foreground font-medium flex-shrink-0">
                        {column.mobileLabel || column.header}:
                      </span>
                      <span className="text-body text-right flex-1 min-w-0">
                        {column.accessor(row, index)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Secondary information - collapsible or less prominent */}
                {secondaryColumns.length > 0 && (
                  <div className="pt-2 border-t border-border space-y-2">
                    {secondaryColumns.map((column) => (
                      <div key={column.key} className="flex items-start justify-between gap-2 text-small">
                        <span className="text-muted-foreground flex-shrink-0">
                          {column.mobileLabel || column.header}:
                        </span>
                        <span className="text-right flex-1 min-w-0">
                          {column.accessor(row, index)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  };

  return (
    <>
      <TableView />
      <CardView />
    </>
  );
}

export default ResponsiveTable;


