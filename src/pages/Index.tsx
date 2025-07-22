
import React, { useState } from "react";
import Layout from "@/components/Layout";
import AlgemeenTab from "@/components/tabs/AlgemeenTab";
import BekerTab from "@/components/tabs/BekerTab";
import CompetitieTab from "@/components/tabs/CompetitieTab";
import PlayOffTab from "@/components/tabs/PlayOffTab";
import SchorsingenTab from "@/components/tabs/SchorsingenTab";
import KaartenTab from "@/components/tabs/KaartenTab";
import ReglementTab from "@/components/tabs/ReglementTab";
import TeamsTab from "@/components/tabs/TeamsTab";
import PlayersTab from "@/components/user/tabs/PlayersTab";
import TeamsAdminTab from "@/components/admin/tabs/TeamsTab";
import UserManagementTab from "@/components/admin/tabs/UserManagementTab";
import CompetitionManagementTab from "@/components/admin/tabs/CompetitionManagementTab";
import PlayoffManagementTab from "@/components/admin/tabs/PlayoffManagementTab";
import CupTournamentManager from "@/components/admin/CupTournamentManager";
import FinancialTabUpdated from "@/components/admin/tabs/FinancialTabUpdated";
import AdminSettingsPanel from "@/components/admin/AdminSettingsPanel";
import MatchFormTab from "@/components/team/MatchFormTab";

const Index = () => {
  // Simpele state voor demonstratie, in praktijk via context of props
  const [activeTab, setActiveTab] = useState("algemeen");

  let content = null;
  switch (activeTab) {
    case "algemeen":
      content = <AlgemeenTab />;
      break;
    case "beker":
      content = <BekerTab />;
      break;
    case "competitie":
      content = <CompetitieTab />;
      break;
    case "playoff":
      content = <PlayOffTab />;
      break;
    case "schorsingen":
      content = <SchorsingenTab />;
      break;
    case "kaarten":
      content = <KaartenTab />;
      break;
    case "reglement":
      content = <ReglementTab />;
      break;
    case "teams":
      content = <TeamsTab />;
      break;
    case "players":
      content = <PlayersTab />;
      break;
    case "teams-admin":
      content = <TeamsAdminTab />;
      break;
    case "users":
      content = <UserManagementTab />;
      break;
    case "competition":
      content = <CompetitionManagementTab />;
      break;
    case "playoffs":
      content = <PlayoffManagementTab />;
      break;
    case "cup":
      content = <CupTournamentManager />;
      break;
    case "financial":
      content = <FinancialTabUpdated />;
      break;
    case "settings":
      content = <AdminSettingsPanel />;
      break;
    case "match-forms":
      content = <MatchFormTab teamId={0} teamName="Admin" />;
      break;
    default:
      content = <AlgemeenTab />;
  }

  return <Layout>{content}</Layout>;
};

export default Index;
