
import React, { useState } from "react";
import { Settings, Trophy, Building, Clock, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TabVisibilitySettingsUpdated from "@/components/admin/settings/TabVisibilitySettingsUpdated";
import PlayerListLockSettings from "@/components/admin/settings/PlayerListLockSettings";
import CompetitionDataSettings from "@/components/admin/settings/CompetitionDataSettings";
import VenuesSettings from "@/components/admin/settings/VenuesSettings";
import SeasonDataSettings from "@/components/admin/settings/SeasonDataSettings";

const AdminSettingsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState("tab-visibility");

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Instellingen
        </h2>
      </div>

      <section>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="tab-visibility">Tab Zichtbaarheid</TabsTrigger>
            <TabsTrigger value="player-lock">Spelerslijst Vergrendeling</TabsTrigger>
            <TabsTrigger value="formats" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Formaten
            </TabsTrigger>
            <TabsTrigger value="venues" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Locaties
            </TabsTrigger>
            <TabsTrigger value="timeslots" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tijdslots
            </TabsTrigger>
            <TabsTrigger value="vacations" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Vakanties
            </TabsTrigger>
            <TabsTrigger value="season" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Seizoensdata
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="tab-visibility">
            <TabVisibilitySettingsUpdated />
          </TabsContent>
          
          <TabsContent value="player-lock">
            <PlayerListLockSettings />
          </TabsContent>
          
          <TabsContent value="formats">
            <CompetitionDataSettings />
          </TabsContent>
          
          <TabsContent value="venues">
            <VenuesSettings />
          </TabsContent>
          
          <TabsContent value="timeslots">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Beheer de tijdslots per locatie waar wedstrijden kunnen worden gespeeld.
                <br />
                <strong>Let op:</strong> Deze functionaliteit is beschikbaar in de Competitie Generator.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="vacations">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Beheer de vakantieperiodes waar geen wedstrijden worden gespeeld.
                <br />
                <strong>Let op:</strong> Deze functionaliteit is beschikbaar in de Competitie Generator.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="season">
            <SeasonDataSettings />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
};

export default AdminSettingsPanel;
