import React, { useState } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AvailabilityMatrix from './AvailabilityMatrix';

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

interface AssignmentWorkspaceProps {
  /** Externe maand (YYYY-MM). */
  selectedMonth?: string;
  onSelectedMonthChange?: (m: string) => void;
}

/**
 * Toewijz-werkruimte met matrix en maand-selector.
 */
export const AssignmentWorkspace: React.FC<AssignmentWorkspaceProps> = ({
  selectedMonth: externalMonth,
  onSelectedMonthChange,
}) => {
  const [internalMonth, setInternalMonth] = useState(format(new Date(), 'yyyy-MM'));
  const selectedMonth = externalMonth ?? internalMonth;
  const setSelectedMonth = (m: string) => {
    if (onSelectedMonthChange) onSelectedMonthChange(m);
    else setInternalMonth(m);
  };
  const [matrixToolbarContainer, setMatrixToolbarContainer] = useState<HTMLDivElement | null>(null);

  return (
    <div className="space-y-4">
      {/* Toolbar — mobiel: maand + auto-toewijzen onder elkaar, full-width */}
      <div className="sticky top-0 z-10 -mx-1 border-b border-border/50 bg-brand-100/95 px-1 pb-3 backdrop-blur-sm sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:backdrop-blur-none">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch lg:items-center">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="min-h-[44px] w-full sm:w-[200px] lg:w-[160px]" aria-label="Maand selecteren">
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

          <div className="w-full sm:min-w-[12rem] sm:flex-1 lg:w-auto lg:flex-none" ref={setMatrixToolbarContainer} />
        </div>
      </div>

      <AvailabilityMatrix
        hideHeader
        selectedMonth={selectedMonth}
        onSelectedMonthChange={setSelectedMonth}
        toolbarContainer={matrixToolbarContainer}
      />
    </div>
  );
};

export default AssignmentWorkspace;
