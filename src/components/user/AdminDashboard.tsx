
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, Shield, UserIcon, Trophy, DollarSign, Settings } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import PlayersTab from "./tabs/PlayersTab";
import AdminSettingsPanel from "@/components/admin/AdminSettingsPanel";
import { useAuth } from "@/components/auth/AuthProvider";

import CompetitionManagementTab from "@/components/admin/tabs/CompetitionManagementTab";
import FinancialTabUpdated from "@/components/admin/tabs/FinancialTabUpdated";
import UserManagementTab from "@/components/admin/tabs/UserManagementTab";
import TeamsTab from "@/components/admin/tabs/TeamsTab";
import MatchFormTab from "@/components/team/MatchFormTab";

type TabName = "match-forms" | "players" | "teams" | "users" | "competition" | "financial" | "settings";

interface AdminDashboardProps {
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const isAdmin = user?.role === "admin";

  // Define all possible tabs with their configurations in the original order
  const tabConfigs = [
    { key: "match-forms" as TabName, label: "Wedstrijdformulieren", icon: <Calendar size={16} />, adminOnly: false },
    { key: "players" as TabName, label: "Spelers", icon: <Users size={16} />, adminOnly: false },
    { key: "teams" as TabName, label: "Teams", icon: <Shield size={16} />, adminOnly: true },
    { key: "users" as TabName, label: "Gebruikers", icon: <UserIcon size={16} />, adminOnly: true },
    { key: "competition" as TabName, label: "Competitiebeheer", icon: <Trophy size={16} />, adminOnly: true },
    { key: "financial" as TabName, label: "Financieel", icon: <DollarSign size={16} />, adminOnly: true },
    { key: "settings" as TabName, label: "Instellingen", icon: <Settings size={16} />, adminOnly: true }
  ];

  // Filter visible tabs based on user role
  const visibleTabs = tabConfigs.filter(tab => !tab.adminOnly || isAdmin);

  return (
    <div className="w-full">
      {/* Desktop Tabs - hidden on mobile */}
      {!isMobile && (
        <div className="w-full bg-white border-b border-purple-200 shadow-sm">
          <div className="max-w-7xl mx-auto">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabName)} className="w-full">
              <TabsList className="custom-tabs-list">
                <div className="custom-tabs-container">
                  {visibleTabs.map((tab) => (
                    <TabsTrigger
                      key={tab.key}
                      value={tab.key}
                      className="custom-tab-trigger"
                    >
                      {tab.icon}
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                    </TabsTrigger>
                  ))}
                </div>
              </TabsList>
            </Tabs>
          </div>
        </div>
      )}

      {/* Mobile - Show current tab title */}
      {isMobile && (
        <div className="w-full bg-white border-b border-purple-200 shadow-sm py-4">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-lg font-semibold text-purple-700 flex items-center gap-2">
              {visibleTabs.find(tab => tab.key === activeTab)?.icon}
              {visibleTabs.find(tab => tab.key === activeTab)?.label}
            </h1>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabName)} className="w-full">
          <div className="animate-fade-in">
            <TabsContent value="match-forms" className="mt-0">
              <MatchFormTab teamId={user?.teamId || 0} teamName="Admin" />
            </TabsContent>
            
            <TabsContent value="players" className="mt-0">
              <PlayersTab />
            </TabsContent>
            
            {isAdmin && (
              <>
                <TabsContent value="teams" className="mt-0">
                  <TeamsTab />
                </TabsContent>
                
                <TabsContent value="users" className="mt-0">
                  <UserManagementTab />
                </TabsContent>
                
                <TabsContent value="competition" className="mt-0">
                  <CompetitionManagementTab />
                </TabsContent>
                
                <TabsContent value="financial" className="mt-0">
                  <FinancialTabUpdated />
                </TabsContent>
                
                <TabsContent value="settings" className="mt-0">
                  <AdminSettingsPanel />
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
