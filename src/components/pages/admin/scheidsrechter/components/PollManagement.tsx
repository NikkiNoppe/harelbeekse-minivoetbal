import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { pollService } from '@/services/scheidsrechter/pollService';
import type { MonthlyPoll } from '@/services/scheidsrechter/types';
import CreatePollModal from './CreatePollModal';
import { AppAlertModal } from '@/components/modals/base/app-alert-modal';
import PollsTable from './PollsTable';
import PollDetailModal from './PollDetailModal';
import AutoGeneratePreviewModal from './AutoGeneratePreviewModal';

const getMonthOptions = () => {
  const months: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = -1; i <= 5; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push({
      value: format(d, 'yyyy-MM'),
      label: format(d, 'MMMM yyyy', { locale: nl }),
    });
  }
  return months;
};

const PollManagement: React.FC = () => {
  const [polls, setPolls] = useState<MonthlyPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<MonthlyPoll | null>(null);
  const [pollToDelete, setPollToDelete] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchPolls = async () => {
    setLoading(true);
    try {
      const data = await pollService.getAllPolls();
      setPolls(data);
    } catch (error) {
      console.error('Error fetching polls:', error);
      toast.error('Fout bij ophalen polls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  const handleOpenPoll = async (pollId: number) => {
    const success = await pollService.openPoll(pollId);
    if (success) {
      toast.success('Poll geopend');
      fetchPolls();
    } else {
      toast.error('Kon poll niet openen');
    }
  };

  const handleClosePoll = async (pollId: number) => {
    const success = await pollService.closePoll(pollId);
    if (success) {
      toast.success('Poll gesloten');
      fetchPolls();
    } else {
      toast.error('Kon poll niet sluiten');
    }
  };

  const handleDeletePoll = async () => {
    if (!pollToDelete) return;
    const result = await pollService.deletePoll(pollToDelete);
    if (result.success) {
      toast.success('Poll verwijderd');
      fetchPolls();
    } else {
      toast.error(result.error || 'Kon poll niet verwijderen');
    }
    setPollToDelete(null);
  };

  const handleAutoGenerate = async (month: string) => {
    setIsGenerating(true);
    try {
      const result = await scheidsrechterService.generateMonthlyPolls(month);
      if (result.success) {
        const created = (result as any).groups_created ?? 0;
        toast.success(
          created > 0
            ? `${created} poll-groepen aangemaakt voor ${month}`
            : `Geen nieuwe groepen gevonden voor ${month}`
        );
        fetchPolls();
      } else {
        toast.error('Kon polls niet automatisch genereren');
      }
    } catch (e) {
      console.error(e);
      toast.error('Fout bij automatisch genereren');
    } finally {
      setIsGenerating(false);
    }
  };

  const monthOptions = getMonthOptions();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Beschikbaarheidspolls</h2>
          <p className="text-sm text-muted-foreground">
            Beheer maandelijkse polls voor scheidsrechters
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchPolls}
            disabled={loading}
            aria-label="Vernieuwen"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isGenerating} className="gap-1.5">
                <Sparkles className={`h-4 w-4 ${isGenerating ? 'animate-pulse' : ''}`} />
                {isGenerating ? 'Bezig...' : 'Auto-genereer'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Genereer uit wedstrijden</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {monthOptions.map((m) => (
                <DropdownMenuItem
                  key={m.value}
                  onClick={() => handleAutoGenerate(m.value)}
                  className="capitalize"
                >
                  {m.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-1">
            <Plus className="h-4 w-4" />
            Nieuwe Poll
          </Button>
        </div>
      </div>

      <PollsTable
        polls={polls}
        loading={loading}
        onOpenPoll={handleOpenPoll}
        onClosePoll={handleClosePoll}
        onDeletePoll={(id) => setPollToDelete(id)}
        onViewPoll={(poll) => setSelectedPoll(poll)}
      />

      <CreatePollModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchPolls}
      />

      {selectedPoll && (
        <PollDetailModal
          isOpen={!!selectedPoll}
          onClose={() => setSelectedPoll(null)}
          poll={selectedPoll}
        />
      )}

      <AppAlertModal
        open={pollToDelete !== null}
        onOpenChange={(open) => !open && setPollToDelete(null)}
        title="Poll Verwijderen"
        description="Weet je zeker dat je deze poll wilt verwijderen? Alle bijhorende beschikbaarheid wordt mee verwijderd. Dit kan niet ongedaan worden gemaakt."
        confirmAction={{
          label: 'Verwijderen',
          onClick: handleDeletePoll,
          variant: 'destructive',
        }}
        cancelAction={{
          label: 'Annuleren',
          onClick: () => setPollToDelete(null),
        }}
      />
    </div>
  );
};

export default PollManagement;
