import React from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { MoreHorizontal, Play, Pause, Trash2, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { MonthlyPoll, PollStatus } from '@/services/scheidsrechter/types';
import { useIsMobile } from '@/hooks/use-mobile';

interface PollsTableProps {
  polls: MonthlyPoll[];
  loading: boolean;
  onOpenPoll: (pollId: number) => void;
  onClosePoll: (pollId: number) => void;
  onDeletePoll: (pollId: number) => void;
  onViewPoll: (poll: MonthlyPoll) => void;
}

const getStatusBadge = (status: PollStatus) => {
  switch (status) {
    case 'open':
      return <Badge className="bg-success text-success-foreground">🟢 Open</Badge>;
    case 'closed':
      return <Badge variant="secondary">⚪ Gesloten</Badge>;
    case 'processing':
      return <Badge className="bg-warning text-warning-foreground">🟠 Verwerking</Badge>;
    case 'completed':
      return <Badge className="bg-primary/20 text-primary">✅ Voltooid</Badge>;
    case 'draft':
      return <Badge variant="outline">📝 Concept</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const PollsTable: React.FC<PollsTableProps> = ({
  polls,
  loading,
  onOpenPoll,
  onClosePoll,
  onDeletePoll,
  onViewPoll
}) => {
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-8 w-8 ml-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (polls.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-muted-foreground">
            Nog geen polls aangemaakt
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Maak een nieuwe poll aan om scheidsrechters hun beschikbaarheid te laten invullen.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Mobile: cards layout
  if (isMobile) {
    return (
      <div className="space-y-3">
        {polls.map(poll => (
          <Card key={poll.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold capitalize">
                    {format(new Date(`${poll.poll_month}-01`), 'MMMM yyyy', { locale: nl })}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {poll.deadline 
                      ? `Deadline: ${format(new Date(poll.deadline), 'dd MMM HH:mm', { locale: nl })}`
                      : 'Geen deadline'
                    }
                  </p>
                </div>
                {getStatusBadge(poll.status)}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewPoll(poll)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Bekijk
                </Button>
                
                {poll.status === 'draft' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onOpenPoll(poll.id)}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Openen
                  </Button>
                )}
                
                {poll.status === 'open' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onClosePoll(poll.id)}
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    Sluiten
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Desktop: table layout
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Maand</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aangemaakt</TableHead>
              <TableHead className="w-[100px]">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {polls.map(poll => (
              <TableRow key={poll.id}>
                <TableCell className="font-medium capitalize">
                  {format(new Date(`${poll.poll_month}-01`), 'MMMM yyyy', { locale: nl })}
                </TableCell>
                <TableCell>
                  {poll.deadline 
                    ? format(new Date(poll.deadline), 'dd MMM yyyy HH:mm', { locale: nl })
                    : '-'
                  }
                </TableCell>
                <TableCell>
                  {getStatusBadge(poll.status)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(poll.created_at), 'dd MMM yyyy', { locale: nl })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewPoll(poll)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Bekijken
                      </DropdownMenuItem>
                      
                      {poll.status === 'draft' && (
                        <DropdownMenuItem onClick={() => onOpenPoll(poll.id)}>
                          <Play className="h-4 w-4 mr-2" />
                          Openen
                        </DropdownMenuItem>
                      )}
                      
                      {poll.status === 'open' && (
                        <DropdownMenuItem onClick={() => onClosePoll(poll.id)}>
                          <Pause className="h-4 w-4 mr-2" />
                          Sluiten
                        </DropdownMenuItem>
                      )}
                      
                      {(poll.status === 'draft' || poll.status === 'closed') && (
                        <DropdownMenuItem 
                          onClick={() => onDeletePoll(poll.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Verwijderen
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PollsTable;
