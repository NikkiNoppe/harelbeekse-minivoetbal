import React, { useState } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { LayoutGrid, List, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AvailabilityMatrix from './AvailabilityMatrix';
import AssignmentManagement from './AssignmentManagement';

const getMonthOptions = () => {
  const months = [];
  const currentDate = new Date();
  for (let i = -1; i <= 6; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    months.push({
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy', { locale: nl }),
    });
  }
  return months;
};

type ViewMode = 'matrix' | 'list';

interface AssignmentWorkspaceProps {
  refreshKey?: number;
  onAfterChange?: () => void;
}

/**
 * Gefuseerde toewijz-werkruimte: matrix-mode (power-user) ↔ lijst-mode (stap-voor-stap).
 * Eén maand-selector bovenaan stuurt beide views; één refresh-knop ververst data.
 */
export const AssignmentWorkspace: React.FC<AssignmentWorkspaceProps> = ({
  refreshKey = 0,
  onAfterChange,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('matrix');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [innerKey, setInnerKey] = useState(0);

  const handleRefresh = () => {
    setInnerKey((k) => k + 1);
    onAfterChange?.();
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Toewijzen</h2>
          <p className="text-sm text-muted-foreground">
            Wijs scheidsrechters toe op basis van hun beschikbaarheid
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* View toggle */}
          <div className="inline-flex rounded-lg border border-border bg-muted/30 p-1">
            <button
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                viewMode === 'matrix'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-pressed={viewMode === 'matrix'}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Matrix
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                viewMode === 'list'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-pressed={viewMode === 'list'}
            >
              <List className="h-3.5 w-3.5" />
              Lijst
            </button>
          </div>

          {/* Maand selector — alleen in matrix-mode (lijst heeft eigen) */}
          {viewMode === 'matrix' && (
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getMonthOptions().map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button variant="outline" size="icon" onClick={handleRefresh} title="Vernieuwen">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div key={`${viewMode}-${innerKey}-${refreshKey}`}>
        {viewMode === 'matrix' ? (
          <AvailabilityMatrix
            hideHeader
            selectedMonth={selectedMonth}
            onSelectedMonthChange={setSelectedMonth}
          />
        ) : (
          <AssignmentManagement />
        )}
      </div>
    </div>
  );
};

export default AssignmentWorkspace;
