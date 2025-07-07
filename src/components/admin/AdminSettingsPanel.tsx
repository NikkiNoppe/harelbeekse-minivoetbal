
import React from "react";
import { Settings } from "lucide-react";
import TabVisibilitySettingsUpdated from "@/components/admin/settings/TabVisibilitySettingsUpdated";

const AdminSettingsPanel: React.FC = () => {
  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Instellingen
        </h2>
      </div>

      <section>
        <TabVisibilitySettingsUpdated />
      </section>
    </div>
  );
};

export default AdminSettingsPanel;
