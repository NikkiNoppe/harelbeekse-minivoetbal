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
      {/* Toolbar */}
      <div className="grid gap-3">
        <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-2 lg:w-auto lg:grid-cols-none lg:flex lg:flex-wrap lg:items-center">
          {/* Eén maand-selector voor de matrix */}
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full lg:w-[160px]">
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

          <div className="col-span-2 lg:col-span-1" ref={setMatrixToolbarContainer} />
        </div>
      </div>

      {/* Body */}
      <div>
        <AvailabilityMatrix
          hideHeader
          selectedMonth={selectedMonth}
          onSelectedMonthChange={setSelectedMonth}
          toolbarContainer={matrixToolbarContainer}
        />
      </div>
    </div>
  );
};

export default AssignmentWorkspace;
