import React from "react";
import TabVisibilitySettingsUpdated from "@/components/pages/admin/settings/components/TabVisibilitySettingsUpdated";
import CompetitionDataSettings from "@/components/pages/admin/settings/components/CompetitionDataSettings";
import { Settings } from "lucide-react";

const AdminSettingsPage: React.FC = () => {
  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Instellingen
        </h2>
      </div>

      <section className="space-y-8">
        <TabVisibilitySettingsUpdated />
        <CompetitionDataSettings />
      </section>
    </div>
  );
};

export default AdminSettingsPage;