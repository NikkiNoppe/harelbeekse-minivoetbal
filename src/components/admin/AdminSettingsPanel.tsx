
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SettingsTab from "@/components/admin/tabs/SettingsTab";
import UserManagementTab from "@/components/admin/tabs/UserManagementTab";
import DateGeneratorTab from "@/components/admin/DateGeneratorTab";
import DateGeneratorPreview from "@/components/admin/DateGeneratorPreview";
import { Settings, Users, Calendar, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AdminSettingsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState("settings");
  const [showPreview, setShowPreview] = useState(false);

  // Fetch generated dates for preview
  const { data: generatedDates, isLoading: loadingDates, refetch: refetchDates } = useQuery({
    queryKey: ['generatedDates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('available_dates')
        .select('*')
        .order('available_date');
      
      if (error) throw error;
      return data || [];
    },
    enabled: showPreview
  });

  const handleDatesGenerated = () => {
    setShowPreview(true);
    setActiveTab("preview");
    refetchDates();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Instellingen</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Instellingen</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Gebruikers</span>
          </TabsTrigger>
          <TabsTrigger value="dates" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Speeldagen</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2" disabled={!showPreview}>
            <Eye className="h-4 w-4" />
            <span>Voorvertoning</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="settings" className="mt-4">
          <SettingsTab />
        </TabsContent>
        
        <TabsContent value="users" className="mt-4">
          <UserManagementTab />
        </TabsContent>
        
        <TabsContent value="dates" className="mt-4">
          <DateGeneratorTab onDatesGenerated={handleDatesGenerated} />
        </TabsContent>
        
        <TabsContent value="preview" className="mt-4">
          <DateGeneratorPreview 
            generatedDates={generatedDates || []} 
            isLoading={loadingDates}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettingsPanel;
