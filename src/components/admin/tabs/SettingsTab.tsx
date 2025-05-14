
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BlogPostsManager from "@/components/admin/BlogPostsManager";
import TabVisibilitySettings from "@/components/admin/settings/TabVisibilitySettings";

const SettingsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Instellingen</h1>
      
      <Tabs defaultValue="visibility">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="visibility">Tab Zichtbaarheid</TabsTrigger>
          <TabsTrigger value="blog">Blog Berichten</TabsTrigger>
        </TabsList>
        
        <TabsContent value="visibility" className="space-y-4 mt-4">
          <TabVisibilitySettings />
        </TabsContent>
        
        <TabsContent value="blog" className="space-y-4 mt-4">
          <BlogPostsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsTab;
