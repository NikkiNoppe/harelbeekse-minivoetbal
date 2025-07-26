
import React from "react";

interface PlayerSelectionHeaderProps {
  teamName: string;
  selectedCount: number;
}

const PlayerSelectionHeader: React.FC<PlayerSelectionHeaderProps> = ({
  teamName,
  selectedCount
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4">
        <h3 className="text-lg font-medium">Selecteer spelers voor {teamName}</h3>
        <div className="text-sm bg-muted p-2 rounded flex items-center gap-2">
          <span className="font-semibold text-md">
            {selectedCount}
            <span className="text-primary">/8</span>
          </span> 
          <span>spelers geselecteerd</span>
        </div>
      </div>
      
      <div className="bg-muted/30 p-4 rounded-md mb-4">
        <h4 className="font-medium mb-2">Instructies:</h4>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Selecteer maximaal 8 spelers voor deze wedstrijd</li>
          <li>Vul voor elke geselecteerde speler het rugnummer in (1-99)</li>
          <li>Duid één speler aan als kapitein</li>
        </ul>
      </div>
    </div>
  );
};

export default PlayerSelectionHeader;
