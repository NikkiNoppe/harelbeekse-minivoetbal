
import React from "react";
import TabVisibilitySettingsUpdated from "@/components/admin/settings/TabVisibilitySettingsUpdated";

const AdminSettingsPanel: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Instellingen</h1>
      <TabVisibilitySettingsUpdated />
    </div>
  );
};

export default AdminSettingsPanel;
