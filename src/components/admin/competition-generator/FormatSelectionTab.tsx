
import React from "react";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { CompetitionFormat } from "@/components/admin/competition-generator/types";

interface FormatSelectionTabProps {
  competitionFormats: CompetitionFormat[] | undefined;
  loadingFormats: boolean;
  selectedFormat: number | null;
  setSelectedFormat: (formatId: number) => void;
  competitionName: string;
  setCompetitionName: (name: string) => void;
}

const FormatSelectionTab: React.FC<FormatSelectionTabProps> = ({
  competitionFormats,
  loadingFormats,
  selectedFormat,
  setSelectedFormat,
  competitionName,
  setCompetitionName
}) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Selecteer een competitieformat</h3>
      
      {loadingFormats ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {competitionFormats?.map((format) => (
              <div key={format.format_id} className={`border p-4 rounded-md cursor-pointer ${
                selectedFormat === format.format_id ? 'border-primary bg-primary/5' : ''
              }`} onClick={() => setSelectedFormat(format.format_id)}>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{format.name}</h4>
                    <p className="text-sm text-muted-foreground">{format.description}</p>
                  </div>
                  {selectedFormat === format.format_id && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
                
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                    {format.regular_rounds === 1 ? 'Enkele competitie' : 'Dubbele competitie'}
                  </span>
                  
                  {format.has_playoffs && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                      Met playoffs
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4">
            <label htmlFor="competition-name" className="block text-sm font-medium mb-2">Competitienaam</label>
            <input
              type="text"
              id="competition-name"
              className="w-full p-2 border rounded-md"
              value={competitionName}
              onChange={(e) => setCompetitionName(e.target.value)}
            />
          </div>
        </>
      )}
      
      <div className="mt-4 pt-4 border-t flex justify-end">
        <Button variant="default">
          Volgende
        </Button>
      </div>
    </div>
  );
};

export default FormatSelectionTab;
