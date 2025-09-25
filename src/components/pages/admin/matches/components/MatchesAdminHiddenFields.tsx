import React from 'react';
import { MatchFormData } from '../types';

interface MatchesAdminHiddenFieldsProps {
  match: MatchFormData;
}

// Hidden fields component to preserve poll data during form submissions
const MatchesAdminHiddenFields: React.FC<MatchesAdminHiddenFieldsProps> = ({ match }) => {
  const matchTyped = match as any;
  
  return (
    <>
      <input
        type="hidden"
        name="assignedRefereeId"
        value={matchTyped.assignedRefereeId || ''}
      />
      <input
        type="hidden"
        name="pollGroupId"
        value={matchTyped.pollGroupId || ''}
      />
      <input
        type="hidden"
        name="pollMonth"
        value={matchTyped.pollMonth || ''}
      />
    </>
  );
};

export default MatchesAdminHiddenFields;