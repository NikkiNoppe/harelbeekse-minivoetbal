
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TeamSelectionTab from "./competition-generator/TeamSelectionTab";
import FormatSelectionTab from "./competition-generator/FormatSelectionTab";
import DatesSelectionTab from "./competition-generator/DatesSelectionTab";
import PreviewTab from "./competition-generator/PreviewTab";
import { useCompetitionGenerator } from "./competition-generator/useCompetitionGenerator";

const CompetitionGenerator: React.FC = () => {
  const {
    availableDates,
    loadingDates,
    competitionFormats,
    loadingFormats,
    teams,
    loadingTeams,
    selectedDates,
    selectedFormat,
    selectedTeams,
    generatedMatches,
    competitionName,
    isCreating,
    setSelectedFormat,
    setCompetitionName,
    toggleDate,
    toggleTeam,
    selectAllTeams,
    deselectAllTeams,
    generateSchedule,
    saveCompetition
  } = useCompetitionGenerator();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Competitiegenerator</CardTitle>
          <CardDescription>
            Genereer een nieuwe competitie met playoff systeem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="teams" className="space-y-6">
            <TabsList>
              <TabsTrigger value="teams">1. Teams</TabsTrigger>
              <TabsTrigger value="format">2. Format</TabsTrigger>
              <TabsTrigger value="dates">3. Speeldagen</TabsTrigger>
              <TabsTrigger value="preview">4. Voorvertoning</TabsTrigger>
            </TabsList>
            
            {/* Tab 1: Teams selecteren */}
            <TabsContent value="teams" className="space-y-4">
              <TeamSelectionTab
                teams={teams}
                loadingTeams={loadingTeams}
                selectedTeams={selectedTeams}
                onTeamToggle={toggleTeam}
                selectAllTeams={selectAllTeams}
                deselectAllTeams={deselectAllTeams}
              />
            </TabsContent>
            
            {/* Tab 2: Format selecteren */}
            <TabsContent value="format" className="space-y-4">
              <FormatSelectionTab
                competitionFormats={competitionFormats}
                loadingFormats={loadingFormats}
                selectedFormat={selectedFormat}
                setSelectedFormat={setSelectedFormat}
                competitionName={competitionName}
                setCompetitionName={setCompetitionName}
              />
            </TabsContent>
            
            {/* Tab 3: Speeldagen selecteren */}
            <TabsContent value="dates" className="space-y-4">
              <DatesSelectionTab
                availableDates={availableDates}
                loadingDates={loadingDates}
                selectedDates={selectedDates}
                toggleDate={toggleDate}
                onGenerateSchedule={generateSchedule}
              />
            </TabsContent>
            
            {/* Tab 4: Voorvertoning */}
            <TabsContent value="preview" className="space-y-4">
              <PreviewTab
                generatedMatches={generatedMatches}
                competitionName={competitionName}
                selectedTeams={selectedTeams}
                competitionFormat={competitionFormats?.find(f => f.format_id === selectedFormat)}
                selectedDates={selectedDates}
                isCreating={isCreating}
                onSaveCompetition={saveCompetition}
                onRegenerateSchedule={generateSchedule}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompetitionGenerator;
