
import React, { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    selectedDates,
    selectedFormat,
    generatedMatches,
    competitionName,
    isCreating,
    setSelectedFormat,
    setCompetitionName,
    toggleDate,
    generateSchedule,
    saveCompetition,
    minimumDatesRequired,
    activeTab,
    setActiveTab
  } = useCompetitionGenerator();

  // Auto select next tab when conditions are met
  useEffect(() => {
    if (selectedFormat && activeTab === "format") {
      setActiveTab("dates");
    }
    if (generatedMatches.length > 0 && activeTab === "dates") {
      setActiveTab("preview");
    }
  }, [selectedFormat, generatedMatches.length, activeTab, setActiveTab]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Competitiegenerator</CardTitle>
          <CardDescription>
            Genereer een nieuwe competitie met playoff systeem of beker
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="format">1. Format</TabsTrigger>
              <TabsTrigger value="dates">2. Speeldagen</TabsTrigger>
              <TabsTrigger value="preview">3. Voorvertoning</TabsTrigger>
            </TabsList>
            
            {/* Tab 1: Format selecteren */}
            <TabsContent value="format" className="space-y-4">
              <FormatSelectionTab
                competitionFormats={competitionFormats}
                loadingFormats={loadingFormats}
                selectedFormat={selectedFormat}
                setSelectedFormat={setSelectedFormat}
                competitionName={competitionName}
                setCompetitionName={setCompetitionName}
                onGenerateSchedule={() => setActiveTab("dates")}
              />
            </TabsContent>
            
            {/* Tab 2: Speeldagen selecteren */}
            <TabsContent value="dates" className="space-y-4">
              <DatesSelectionTab
                availableDates={availableDates}
                loadingDates={loadingDates}
                selectedDates={selectedDates}
                toggleDate={toggleDate}
                onGenerateSchedule={generateSchedule}
                minimumDatesRequired={minimumDatesRequired}
              />
            </TabsContent>
            
            {/* Tab 3: Voorvertoning */}
            <TabsContent value="preview" className="space-y-4">
              <PreviewTab
                generatedMatches={generatedMatches}
                competitionName={competitionName}
                selectedDates={selectedDates}
                competitionFormat={competitionFormats?.find(f => f.id === selectedFormat)}
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
