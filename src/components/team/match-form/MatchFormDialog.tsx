
import React from "react";
import { Modal, Card, Title, Text } from "@mantine/core";
import { X } from "lucide-react";
import CompactMatchForm from "./CompactMatchForm";
import { MatchFormData } from "./types";

interface MatchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: MatchFormData;
  isAdmin: boolean;
  isReferee: boolean;
  teamId: number;
  onComplete?: () => void;
}

const MatchFormDialog: React.FC<MatchFormDialogProps> = ({
  open,
  onOpenChange,
  match,
  isAdmin,
  isReferee,
  teamId,
  onComplete
}) => {
  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
    onOpenChange(false);
  };

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} size="xl" title={
      <Title order={3} ta="center">
        Wedstrijdformulier - {match.homeTeamName} vs {match.awayTeamName}
      </Title>
    }>
      <Card shadow="md" radius="md" p="md" style={{ background: '#faf5ff' }}>
        <Text size="sm" c="dimmed" ta="center" mb="md">
          Beheer de wedstrijdgegevens, spelers en scores voor deze wedstrijd
        </Text>
        <CompactMatchForm
          match={match}
          onComplete={handleComplete}
          isAdmin={isAdmin}
          isReferee={isReferee}
          teamId={teamId}
        />
      </Card>
    </Modal>
  );
};

export default MatchFormDialog;
