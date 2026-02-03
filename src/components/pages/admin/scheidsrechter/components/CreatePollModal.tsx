import React, { useState } from 'react';
import { format, addDays } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Calendar as CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { AppModal } from '@/components/modals/base/app-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { pollService } from '@/services/scheidsrechter/pollService';
import type { PollMatchDateInput } from '@/services/scheidsrechter/types';
import { cn } from '@/lib/utils';

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface MatchDateEntry {
  id: string;
  date: Date | null;
  location: string;
  timeSlot: string;
  matchCount: number;
}

// Helper to generate months
const getMonthOptions = () => {
  const months = [];
  const currentDate = new Date();
  for (let i = 0; i <= 6; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    const value = format(date, 'yyyy-MM');
    const label = format(date, 'MMMM yyyy', { locale: nl });
    months.push({ value, label });
  }
  return months;
};

const CreatePollModal: React.FC<CreatePollModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [deadline, setDeadline] = useState<Date | null>(addDays(new Date(), 3));
  const [matchDates, setMatchDates] = useState<MatchDateEntry[]>([
    { id: crypto.randomUUID(), date: null, location: '', timeSlot: '', matchCount: 2 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddMatchDate = () => {
    setMatchDates([
      ...matchDates,
      { id: crypto.randomUUID(), date: null, location: '', timeSlot: '', matchCount: 2 }
    ]);
  };

  const handleRemoveMatchDate = (id: string) => {
    if (matchDates.length > 1) {
      setMatchDates(matchDates.filter(md => md.id !== id));
    }
  };

  const handleUpdateMatchDate = (id: string, field: keyof MatchDateEntry, value: any) => {
    setMatchDates(matchDates.map(md => 
      md.id === id ? { ...md, [field]: value } : md
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!deadline) {
      toast.error('Selecteer een deadline');
      return;
    }
    
    if (deadline < new Date()) {
      toast.error('Deadline moet in de toekomst liggen');
      return;
    }

    const validMatchDates = matchDates.filter(md => md.date);
    if (validMatchDates.length === 0) {
      toast.error('Voeg minimaal één wedstrijddatum toe');
      return;
    }

    setIsSubmitting(true);

    try {
      const pollMatchDates: PollMatchDateInput[] = validMatchDates.map(md => ({
        match_date: format(md.date!, 'yyyy-MM-dd'),
        location: md.location || undefined,
        time_slot: md.timeSlot || undefined,
        match_count: md.matchCount
      }));

      const result = await pollService.createPoll({
        poll_month: selectedMonth,
        deadline: deadline.toISOString(),
        match_dates: pollMatchDates
      });

      if (result.success) {
        toast.success('Poll succesvol aangemaakt');
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || 'Kon poll niet aanmaken');
      }
    } catch (error) {
      console.error('Error creating poll:', error);
      toast.error('Fout bij aanmaken poll');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Nieuwe Poll Aanmaken"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Month Selection */}
        <div className="space-y-2">
          <Label htmlFor="month">Maand</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger id="month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getMonthOptions().map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Deadline */}
        <div className="space-y-2">
          <Label>Deadline</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !deadline && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {deadline ? format(deadline, 'PPP', { locale: nl }) : "Selecteer datum"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={deadline || undefined}
                onSelect={(date) => setDeadline(date || null)}
                disabled={(date) => date < new Date()}
                initialFocus
                locale={nl}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Match Dates */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Wedstrijddatums</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddMatchDate}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Toevoegen
            </Button>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {matchDates.map((matchDate, index) => (
              <div 
                key={matchDate.id} 
                className="p-3 border rounded-lg bg-card space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Datum {index + 1}
                  </span>
                  {matchDates.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMatchDate(matchDate.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Date Picker */}
                  <div className="col-span-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !matchDate.date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {matchDate.date 
                            ? format(matchDate.date, 'EEE d MMM yyyy', { locale: nl })
                            : "Kies datum"
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={matchDate.date || undefined}
                          onSelect={(date) => handleUpdateMatchDate(matchDate.id, 'date', date)}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          locale={nl}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Location */}
                  <Input
                    placeholder="Locatie"
                    value={matchDate.location}
                    onChange={(e) => handleUpdateMatchDate(matchDate.id, 'location', e.target.value)}
                  />

                  {/* Time slot */}
                  <Input
                    placeholder="Tijdslot (bv. 20:00)"
                    value={matchDate.timeSlot}
                    onChange={(e) => handleUpdateMatchDate(matchDate.id, 'timeSlot', e.target.value)}
                  />

                  {/* Match count */}
                  <div className="col-span-2">
                    <Select 
                      value={matchDate.matchCount.toString()} 
                      onValueChange={(val) => handleUpdateMatchDate(matchDate.id, 'matchCount', parseInt(val))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map(n => (
                          <SelectItem key={n} value={n.toString()}>
                            {n} {n === 1 ? 'wedstrijd' : 'wedstrijden'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Annuleren
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Aanmaken...' : 'Poll Aanmaken'}
          </Button>
        </div>
      </form>
    </AppModal>
  );
};

export default CreatePollModal;
