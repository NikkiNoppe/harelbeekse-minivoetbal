
import React, { useState, ReactNode } from "react";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import LoginForm from "@/components/auth/LoginForm";
import MainTabs from "@/components/tabs/MainTabs";
import AdminDashboard from "@/components/user/AdminDashboard";

// Types voor tabs
import { TabName } from "@/context/TabVisibilityContext";
type AdminTabName = "match-forms" | "players" | "teams" | "users" | "competition" | "playoffs" | "financial" | "settings" | "cup";

interface LayoutProps {
  children?: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabName>("algemeen");
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTabName>("match-forms");
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Simpel, vervang door echte auth indien nodig
  const [user, setUser] = useState<any>(null); // Simpel, vervang door echte user indien nodig

  const handleLogoClick = () => {
    if (isAuthenticated) {
      setActiveAdminTab("match-forms");
    } else {
      setActiveTab("algemeen");
    }
  };

  const handleLoginClick = () => {
    setLoginDialogOpen(true);
  };

  const handleLoginSuccess = () => {
    setLoginDialogOpen(false);
    setIsAuthenticated(true); // Simpel voorbeeld
    setUser({ role: "admin" }); // Simpel voorbeeld
  };

  // Handler voor tab wissel vanuit Header
  const handleTabChange = (tab: string) => {
    if (isAuthenticated) {
      setActiveAdminTab(tab as AdminTabName);
    } else {
      setActiveTab(tab as TabName);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-purple-100 text-foreground">
      <Header 
        onLogoClick={handleLogoClick} 
        onLoginClick={handleLoginClick}
        onTabChange={handleTabChange}
        activeTab={isAuthenticated ? activeAdminTab : activeTab}
        isAuthenticated={isAuthenticated}
        user={user}
      />
      <main className="flex-1 w-full bg-purple-100">
        {children}
      </main>
      <Footer />
      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogContent className="w-full max-w-md mx-4 sm:mx-auto bg-background text-foreground border-border rounded-lg">
          <DialogTitle className="sr-only">Inloggen</DialogTitle>
          <DialogDescription className="sr-only">
            Log in op je account om toegang te krijgen tot het systeem
          </DialogDescription>
          <div className="rounded-b-lg">
            <LoginForm onLoginSuccess={handleLoginSuccess} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Layout;
