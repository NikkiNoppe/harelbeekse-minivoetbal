
import React, { useState } from "react";
import { Settings, Trophy, Building, Clock, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../MINIVOETBAL.UI/components/ui/tabs";
import TabVisibilitySettingsUpdated from './settings/TabVisibilitySettingsUpdated';
import PlayerListLockSettings from './settings/PlayerListLockSettings';
import CompetitionDataSettings from './settings/CompetitionDataSettings';
import VenuesSettings from './settings/VenuesSettings';
import TimeslotsSettings from './settings/TimeslotsSettings';
import VacationsSettings from './settings/VacationsSettings';
import SeasonDataSettings from './settings/SeasonDataSettings';

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
            <TimeslotsSettings />
          </TabsContent>
          
          <TabsContent value="vacations">
            <VacationsSettings />
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
