import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { pollService } from '@/services/scheidsrechter/pollService';
import type { MonthlyPoll } from '@/services/scheidsrechter/types';
import CreatePollModal from './CreatePollModal';
import { AppAlertModal } from '@/components/modals/base/app-alert-modal';
import PollsTable from './PollsTable';
import PollDetailModal from './PollDetailModal';

const PollManagement: React.FC = () => {
  const [polls, setPolls] = useState<MonthlyPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<MonthlyPoll | null>(null);
  const [pollToDelete, setPollToDelete] = useState<number | null>(null);

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
    try {
      const success = await pollService.openPoll(pollId);
      if (success) {
        toast.success('Poll geopend');
        fetchPolls();
      } else {
        toast.error('Kon poll niet openen');
      }
    } catch (error) {
      console.error('Error opening poll:', error);
      toast.error('Fout bij openen poll');
    }
  };

  const handleClosePoll = async (pollId: number) => {
    try {
      const success = await pollService.closePoll(pollId);
      if (success) {
        toast.success('Poll gesloten');
        fetchPolls();
      } else {
        toast.error('Kon poll niet sluiten');
      }
    } catch (error) {
      console.error('Error closing poll:', error);
      toast.error('Fout bij sluiten poll');
    }
  };

  const handleDeletePoll = async () => {
    if (!pollToDelete) return;
    
    // Note: Would need to add deletePoll to pollService
    // For now, show a message
    toast.info('Verwijderen nog niet geïmplementeerd');
    setPollToDelete(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Beschikbaarheidspolls</h2>
          <p className="text-sm text-muted-foreground">
            Beheer maandelijkse polls voor scheidsrechters
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchPolls}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-1">
            <Plus className="h-4 w-4" />
            Nieuwe Poll
          </Button>
        </div>
      </div>

      {/* Polls Table */}
      <PollsTable
        polls={polls}
        loading={loading}
        onOpenPoll={handleOpenPoll}
        onClosePoll={handleClosePoll}
        onDeletePoll={(id) => setPollToDelete(id)}
        onViewPoll={(poll) => setSelectedPoll(poll)}
      />

      {/* Create Modal */}
      <CreatePollModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchPolls}
      />

      {/* Detail Modal */}
      {selectedPoll && (
        <PollDetailModal
          isOpen={!!selectedPoll}
          onClose={() => setSelectedPoll(null)}
          poll={selectedPoll}
        />
      )}

      {/* Delete Confirmation */}
      <AppAlertModal
        open={pollToDelete !== null}
        onOpenChange={(open) => !open && setPollToDelete(null)}
        title="Poll Verwijderen"
        description="Weet je zeker dat je deze poll wilt verwijderen? Dit kan niet ongedaan worden gemaakt."
        confirmAction={{
          label: "Verwijderen",
          onClick: handleDeletePoll,
          variant: "destructive"
        }}
        cancelAction={{
          label: "Annuleren",
          onClick: () => setPollToDelete(null)
        }}
      />
    </div>
  );
};

export default PollManagement;
