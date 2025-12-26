import React, { useState, useCallback, useEffect, useRef } from "react";
import { AppModal } from "@/components/modals/base/app-modal";
import MatchesCompactForm from "@/components/pages/admin/matches/MatchesCompactForm";
import MatchesFormActions from "@/components/pages/admin/matches/components/MatchesFormActions";
import { MatchFormData } from "@/components/pages/admin/matches/types";

interface MatchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: MatchFormData;
  isAdmin: boolean;
  isReferee: boolean;
  teamId: number;
  onComplete?: () => void;
}

interface FooterProps {
  onSubmit: () => void;
  isSubmitting: boolean;
  canActuallyEdit: boolean;
  isAdmin: boolean;
  submitButtonRef: React.RefObject<HTMLButtonElement>;
}

export const MatchesFormModal: React.FC<MatchFormDialogProps> = ({
  open,
  onOpenChange,
  match,
  isAdmin,
  isReferee,
  teamId,
  onComplete
}) => {
  const [footerProps, setFooterProps] = useState<FooterProps | null>(null);
  const footerPropsRef = useRef<FooterProps | null>(null);

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
    onOpenChange(false);
  };

  const handleRenderFooter = useCallback((props: FooterProps) => {
    footerPropsRef.current = props;
    setFooterProps(props);
    return null; // Don't render in children, it's in footer
  }, []);

  const footerContent = footerProps ? (
    <MatchesFormActions
      ref={footerProps.submitButtonRef}
      onSubmit={footerProps.onSubmit}
      isSubmitting={footerProps.isSubmitting}
      canActuallyEdit={footerProps.canActuallyEdit}
      isAdmin={footerProps.isAdmin}
      noWrapper={true}
    />
  ) : null;

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title="Wedstrijdformulier"
      size="lg"
      aria-describedby="match-form-description"
      showCloseButton={true}
      footer={footerContent}
    >
      <div id="match-form-description" className="sr-only">
        Vul scores, spelers en details van de wedstrijd in
      </div>
      <div className="space-y-6">
        <MatchesCompactForm 
          match={match} 
          onComplete={handleComplete} 
          isAdmin={isAdmin} 
          isReferee={isReferee} 
          teamId={teamId}
          renderFooter={handleRenderFooter}
        />
      </div>
    </AppModal>
  );
};

