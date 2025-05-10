
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, FileText, Trophy, Ban, Info, Layers } from "lucide-react";
import CompetitionTab from "@/components/tabs/CompetitionTab";
import CupTab from "@/components/tabs/CupTab";
import SuspensionsTab from "@/components/tabs/SuspensionsTab";
import RegulationsTab from "@/components/tabs/RegulationsTab";
import AlgemeenTab from "@/components/tabs/AlgemeenTab";
import PlayOffTab from "@/components/tabs/PlayOffTab";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/components/auth/AuthProvider";
import LoginForm from "@/components/auth/LoginForm";
import UserAccount from "@/components/auth/UserAccount";
import AdminPanel from "@/components/admin/AdminPanel";
import TeamDashboard from "@/components/team/TeamDashboard";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Link, useNavigate } from "react-router-dom";

// Updated mock teams data with new team names
export const MOCK_TEAMS = [{
  id: 1,
  name: "Garage Verbeke",
  email: "garage.verbeke@example.com",
  played: 10,
  won: 8,
  draw: 1,
  lost: 1,
  goalDiff: 15,
  points: 25
}, {
  id: 2,
  name: "Shakthar Truu",
  email: "shakthar.truu@example.com",
  played: 10,
  won: 7,
  draw: 2,
  lost: 1,
  goalDiff: 12,
  points: 23
}, {
  id: 3,
  name: "De Dageraad",
  email: "dageraad@example.com",
  played: 10,
  won: 6,
  draw: 2,
  lost: 2,
  goalDiff: 8,
  points: 20
}, {
  id: 4,
  name: "Cafe De Gilde",
  email: "cafe.degilde@example.com",
  played: 10,
  won: 5,
  draw: 3,
  lost: 2,
  goalDiff: 6,
  points: 18
}, {
  id: 5,
  name: "De Florre",
  email: "deflorre@example.com",
  played: 10,
  won: 4,
  draw: 4,
  lost: 2,
  goalDiff: 4,
  points: 16
}, {
  id: 6,
  name: "Bemarmi Boys",
  email: "bemarmi.boys@example.com",
  played: 10,
  won: 4,
  draw: 2,
  lost: 4,
  goalDiff: 0,
  points: 14
}];
const Layout: React.FC = () => {
  const isMobile = useIsMobile();
  const {
    user,
    login,
    logout,
    isAuthenticated
  } = useAuth();
  const [loginDialogOpen, setLoginDialogOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("algemeen");
  const navigate = useNavigate();

  // Find team data if user is a team role
  const teamData = user?.teamId ? MOCK_TEAMS.find(team => team.id === user.teamId) : null;
  const handleLogoClick = () => {
    setActiveTab("algemeen");
    navigate("/");
  };
  return <div className="min-h-screen flex flex-col bg-slate-950 text-white">
      {/* Header */}
      <header className="w-full py-4 px-6 shadow-md soccer-pattern bg-slate-950">
        <div className="container flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleLogoClick} role="button" aria-label="Go to home page">
            <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-md">
              <svg className="h-8 w-8 text-orange-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 15L9 9.75L12 4.5L15 9.75L12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7.5 10.5L12 15L16.5 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7.5 19.5L12 15L16.5 19.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-white text-lg font-bold tracking-tight md:text-lg">Harelbeekse Minivoetbal</h1>
              <p className="text-white/80 text-xs md:text-sm">Competitie</p>
            </div>
          </div>
          
          <div className={cn("flex space-x-4", isMobile ? "flex" : "hidden md:flex")}>
            {isAuthenticated && user ? <UserAccount user={user} onLogout={logout} /> : <>
                <button onClick={() => setLoginDialogOpen(true)} className="px-4 py-2 rounded-md hover:bg-opacity-90 transition-colors font-medium text-slate-950 bg-orange-500 hover:bg-orange-400">
                  Inloggen
                </button>
              </>}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-6">
        {isAuthenticated && user ? <>
            {user.role === "admin" ? <AdminPanel /> : user.teamId && teamData && <TeamDashboard user={user} teamData={teamData} />}
          </> : <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full flex mb-8 bg-slate-800 p-1 overflow-x-auto">
              <TabItem value="algemeen" icon={<Info />} label="Algemeen" />
              <TabItem value="competitie" icon={<Award />} label="Competitie" />
              <TabItem value="playoff" icon={<Layers />} label="Play-Off" />
              <TabItem value="beker" icon={<Trophy />} label="Beker" />
              <TabItem value="schorsingen" icon={<Ban />} label="Schorsingen" />
              <TabItem value="reglement" icon={<FileText />} label="Reglement" />
            </TabsList>
            <div className="animate-fade-in">
              <TabsContent value="algemeen"><AlgemeenTab /></TabsContent>
              <TabsContent value="competitie"><CompetitionTab teams={MOCK_TEAMS} /></TabsContent>
              <TabsContent value="playoff"><PlayOffTab /></TabsContent>
              <TabsContent value="beker"><CupTab /></TabsContent>
              <TabsContent value="schorsingen"><SuspensionsTab /></TabsContent>
              <TabsContent value="reglement"><RegulationsTab /></TabsContent>
            </div>
          </Tabs>}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 py-6 text-white/80">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-white mb-3">Harelbeekse Minivoetbal Competitie</h3>
              <p className="text-sm">Minivoetbalcompetitie in sinds 1985.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3">Contact</h3>
              <p className="text-sm">info@minivoetbalharelbeke.be</p>
              <p className="text-sm">+34 468 15 52 16</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3">Volg Ons</h3>
              <div className="flex space-x-4 text-sm">
                <a href="#" className="hover:text-orange-400 transition-colors">Facebook</a>
                <a href="#" className="hover:text-orange-400 transition-colors">Instagram</a>
                <a href="#" className="hover:text-orange-400 transition-colors">Twitter</a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-white/10 text-center text-sm">
            <p>© {new Date().getFullYear()} Voetbal Arena. Alle rechten voorbehouden.</p>
          </div>
        </div>
      </footer>

      {/* Login Dialog */}
      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogContent className="sm:max-w-md bg-slate-900 text-white border-slate-700">
          <LoginForm onLoginSuccess={user => {
          login(user);
          setLoginDialogOpen(false);
        }} />
        </DialogContent>
      </Dialog>
    </div>;
};
interface TabItemProps {
  value: string;
  icon: React.ReactNode;
  label: string;
}
const TabItem: React.FC<TabItemProps> = ({
  value,
  icon,
  label
}) => {
  return <TabsTrigger value={value} className={cn("flex-1 min-w-max flex items-center justify-center gap-2 px-4 py-2 font-medium", "data-[state=active]:bg-slate-700 data-[state=active]:text-orange-400 data-[state=active]:shadow-sm", "text-gray-400 transition-all")}>
      {icon}
      <span>{label}</span>
    </TabsTrigger>;
};
export default Layout;
