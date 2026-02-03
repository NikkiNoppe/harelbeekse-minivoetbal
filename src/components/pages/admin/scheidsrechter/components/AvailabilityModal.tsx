import React from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { AppModal } from '@/components/modals/base/app-modal';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { RefereeWithAvailability } from '@/services/scheidsrechter/types';

interface AvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  location: string;
  referees: RefereeWithAvailability[];
  pollGroupId: string;
}

const AvailabilityModal: React.FC<AvailabilityModalProps> = ({
  isOpen,
  onClose,
  date,
  location,
  referees,
  pollGroupId
}) => {
  // Get availability for this specific poll group
  const getAvailability = (referee: RefereeWithAvailability) => {
    const avail = referee.availability.find(a => a.poll_group_id === pollGroupId);
    if (!avail) return { responded: false, is_available: false, notes: undefined };
    return { responded: true, is_available: avail.is_available, notes: avail.notes };
  };

  // Sort: available first, then responded, then not responded
  const sortedReferees = [...referees].sort((a, b) => {
    const availA = getAvailability(a);
    const availB = getAvailability(b);
    
    if (availA.is_available && !availB.is_available) return -1;
    if (!availA.is_available && availB.is_available) return 1;
    if (availA.responded && !availB.responded) return -1;
    if (!availA.responded && availB.responded) return 1;
    return a.username.localeCompare(b.username);
  });

  const availableCount = sortedReferees.filter(r => getAvailability(r).is_available).length;
  const respondedCount = sortedReferees.filter(r => getAvailability(r).responded).length;

  return (
    <AppModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={`Beschikbaarheid - ${date}`}
      subtitle={location}
    >
      <div className="space-y-4">
        {/* Stats */}
        <div className="flex gap-3 p-3 bg-muted rounded-lg">
          <div className="text-center flex-1">
            <div className="text-2xl font-bold text-success">{availableCount}</div>
            <div className="text-xs text-muted-foreground">Beschikbaar</div>
          </div>
          <div className="text-center flex-1">
            <div className="text-2xl font-bold">{respondedCount}</div>
            <div className="text-xs text-muted-foreground">Gereageerd</div>
          </div>
          <div className="text-center flex-1">
            <div className="text-2xl font-bold text-muted-foreground">
              {sortedReferees.length}
            </div>
            <div className="text-xs text-muted-foreground">Totaal</div>
          </div>
        </div>

        {/* Referees list */}
        <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scheidsrechter</TableHead>
                <TableHead className="w-[100px] text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedReferees.map(referee => {
                const avail = getAvailability(referee);
                
                return (
                  <TableRow key={referee.user_id}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{referee.username}</span>
                        {avail.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            "{avail.notes}"
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {!avail.responded ? (
                        <Badge variant="outline" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Geen reactie
                        </Badge>
                      ) : avail.is_available ? (
                        <Badge className="gap-1 bg-success text-success-foreground">
                          <Check className="h-3 w-3" />
                          Ja
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <X className="h-3 w-3" />
                          Nee
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppModal>
  );
};

export default AvailabilityModal;
