import React, { useState, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppAlertModal } from "@/components/ui/app-alert-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, AlertTriangle, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Types
export interface CRUDTableProps<T> {
  title: string;
  data: T[];
  isLoading: boolean;
  error: any;
  columns: ColumnDef<T>[];
  onAdd: () => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  isDeleting: boolean;
  isAdding: boolean;
  isUpdating: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  sortOptions: { value: string; label: string }[];
  addButtonText?: string;
  emptyMessage?: string;
  errorMessage?: string;
}

export interface ColumnDef<T> {
  key: keyof T | string;
  header: string;
  render?: (value: any, item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

// Loading skeleton
const TableSkeleton = memo(() => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Naam</TableHead>
        <TableHead>Type</TableHead>
        <TableHead className="text-right">Acties</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-1">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
));

TableSkeleton.displayName = 'TableSkeleton';

// Error state
const ErrorState = memo(({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <Alert variant="destructive">
    <AlertTriangle className="h-4 w-4" />
    <AlertDescription className="flex items-center justify-between">
      <span>{message}</span>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Opnieuw proberen
      </Button>
    </AlertDescription>
  </Alert>
));

ErrorState.displayName = 'ErrorState';

// Actions component
const TableActions = memo(<T extends { id?: number | string }>({ 
  item, 
  onEdit, 
  onDelete, 
  isDeleting,
  isUpdating
}: { 
  item: T; 
  onEdit: (item: T) => void; 
  onDelete: (item: T) => void;
  isDeleting: boolean;
  isUpdating: boolean;
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  
  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(item)}
          className="h-8 w-8 p-0 bg-white text-purple-600 border-purple-400 hover:bg-purple-50"
          disabled={isDeleting || isUpdating}
        >
          {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit className="h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
          className="h-8 w-8 p-0 bg-white text-red-500 border-red-400 hover:bg-red-50 hover:text-red-700"
          disabled={isDeleting || isUpdating}
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
      </div>
      <AppAlertModal
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Bevestig Verwijderen"
        description="Weet je zeker dat je dit item wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt."
        confirmAction={{
          label: isDeleting ? "Verwijderen..." : "Verwijderen",
          onClick: () => {
            onDelete(item);
            setShowDeleteConfirm(false);
          },
          variant: "destructive",
          disabled: isDeleting,
          loading: isDeleting,
        }}
        cancelAction={{
          label: "Annuleren",
          onClick: () => setShowDeleteConfirm(false),
          variant: "secondary",
        }}
      />
    </>
  );
});

TableActions.displayName = 'TableActions';

// Main CRUD Table component
export const AdminCRUDTable = memo(<T extends { id?: number | string }>({
  title,
  data,
  isLoading,
  error,
  columns,
  onAdd,
  onEdit,
  onDelete,
  isDeleting,
  isAdding,
  isUpdating,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  sortOptions,
  addButtonText = "Toevoegen",
  emptyMessage = "Geen items gevonden",
  errorMessage = "Er is een fout opgetreden bij het laden van de data."
}: CRUDTableProps<T>) => {
  const { toast } = useToast();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <TableSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState message={errorMessage} onRetry={() => window.location.reload()} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle>{title}</CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={onAdd} 
              className="btn-dark"
              disabled={isAdding}
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {addButtonText}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search and Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Zoeken..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Sorteren op:</label>
              <Select value={sortBy} onValueChange={onSortChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          {data.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{emptyMessage}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead 
                      key={String(column.key)}
                      className={column.width}
                    >
                      {column.header}
                    </TableHead>
                  ))}
                  <TableHead className="text-right w-24">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => (
                  <TableRow key={item.id || index}>
                    {columns.map((column) => (
                      <TableCell key={String(column.key)}>
                        {column.render 
                          ? column.render(item[column.key as keyof T], item)
                          : String(item[column.key as keyof T] || '')
                        }
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <TableActions
                        item={item}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        isDeleting={isDeleting}
                        isUpdating={isUpdating}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

AdminCRUDTable.displayName = 'AdminCRUDTable'; 