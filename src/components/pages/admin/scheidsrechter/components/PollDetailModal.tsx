import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { AppModal } from '@/components/modals/base/app-modal';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { pollService } from '@/services/scheidsrechter/pollService';
import { refereeAvailabilityService } from '@/services/scheidsrechter/refereeAvailabilityService';
import type { MonthlyPoll, PollMatchDate, PollSummary } from '@/services/scheidsrechter/types';
import type { RefereeWithAvailability } from '@/services/scheidsrechter/types';
import AvailabilityModal from './AvailabilityModal';

interface PollDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  poll: MonthlyPoll;
}

const PollDetailModal: React.FC<PollDetailModalProps> = ({
  isOpen,
  onClose,
  poll
}) => {
  const [matchDates, setMatchDates] = useState<PollMatchDate[]>([]);
  const [summary, setSummary] = useState<PollSummary | null>(null);
  const [referees, setReferees] = useState<RefereeWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<{
    date: string;
    location: string;
    pollGroupId: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen && poll) {
      fetchData();
    }
  }, [isOpen, poll]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dates, pollSummary, refereeData] = await Promise.all([
        pollService.getPollMatchDates(poll.id),
        pollService.getPollSummary(poll.id),
        refereeAvailabilityService.getAvailabilityForPoll(poll.poll_month)
      ]);
      
      setMatchDates(dates);
      setSummary(pollSummary);
      setReferees(refereeData);
    } catch (error) {
      console.error('Error fetching poll details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAvailability = (matchDate: PollMatchDate) => {
    const pollGroupId = `${poll.poll_month}_${matchDate.match_date}_${matchDate.location || 'unknown'}`;
    setSelectedDate({
      date: format(new Date(matchDate.match_date), 'EEEE d MMMM', { locale: nl }),
      location: matchDate.location || 'Onbekend',
      pollGroupId
    });
  };

  const responseRate = summary 
    ? (summary.referees_responded / (summary.referees_total || 1)) * 100 
    : 0;

  return (
    <>
      <AppModal
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
        title={`Poll ${format(new Date(`${poll.poll_month}-01`), 'MMMM yyyy', { locale: nl })}`}
        subtitle="Bekijk details en beschikbaarheid"
      >
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <div className="text-2xl font-bold">
                    {summary?.referees_responded || 0}/{summary?.referees_total || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Gereageerd</div>
                  <Progress value={responseRate} className="mt-2 h-1.5" />
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Calendar className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <div className="text-2xl font-bold">
                    {matchDates.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Wedstrijddatums</div>
                </CardContent>
              </Card>
            </div>

            {/* Deadline */}
            {poll.deadline && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Deadline: {format(new Date(poll.deadline), 'EEEE d MMMM HH:mm', { locale: nl })}
                </span>
                {new Date(poll.deadline) > new Date() ? (
                  <Badge variant="outline" className="ml-auto">Actief</Badge>
                ) : (
                  <Badge variant="secondary" className="ml-auto">Verlopen</Badge>
                )}
              </div>
            )}

            {/* Match Dates */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground">Wedstrijddatums</h3>
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {matchDates.map(matchDate => {
                  // Count available referees for this date
                  const pollGroupId = `${poll.poll_month}_${matchDate.match_date}_${matchDate.location || 'unknown'}`;
                  const availableCount = referees.filter(r => 
                    r.availability.some(a => a.poll_group_id === pollGroupId && a.is_available)
                  ).length;

                  return (
                    <Card 
                      key={matchDate.id}
                      className="cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => handleViewAvailability(matchDate)}
                    >
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {format(new Date(matchDate.match_date), 'EEEE d MMMM', { locale: nl })}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {matchDate.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {matchDate.location}
                              </span>
                            )}
                            {matchDate.time_slot && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {matchDate.time_slot}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={availableCount > 0 ? "default" : "secondary"}>
                            {availableCount} beschikbaar
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {matchDate.match_count} wedstrijd{matchDate.match_count !== 1 && 'en'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </AppModal>

      {/* Availability Modal */}
      {selectedDate && (
        <AvailabilityModal
          isOpen={!!selectedDate}
          onClose={() => setSelectedDate(null)}
          date={selectedDate.date}
          location={selectedDate.location}
          referees={referees}
          pollGroupId={selectedDate.pollGroupId}
        />
      )}
    </>
  );
};

export default PollDetailModal;
