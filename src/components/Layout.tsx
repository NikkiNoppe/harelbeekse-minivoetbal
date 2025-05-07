
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, FileText, Trophy, Ban } from "lucide-react";
import CompetitionTab from "@/components/tabs/CompetitionTab";
import CupTab from "@/components/tabs/CupTab";
import SuspensionsTab from "@/components/tabs/SuspensionsTab";
import RegulationsTab from "@/components/tabs/RegulationsTab";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/components/auth/AuthProvider";
import LoginForm from "@/components/auth/LoginForm";
import UserAccount from "@/components/auth/UserAccount";
import AdminPanel from "@/components/admin/AdminPanel";
import TeamDashboard from "@/components/team/TeamDashboard";

// Mock teams data for permissions check
const MOCK_TEAMS = [
  { id: 1, name: "FC De Kampioenen", permissions: { scores: true, players: true } },
  { id: 2, name: "Bavo United", permissions: { scores: true, players: true } },
  { id: 3, name: "Zandberg Boys", permissions: { scores: true, players: false } },
  { id: 4, name: "Sportclub Veldhoven", permissions: { scores: false, players: true } },
];

const Layout: React.FC = () => {
  const isMobile = useIsMobile();
  const { user, login, logout, isAuthenticated } = useAuth();
  
  // Find team data if user is a team role
  const teamData = user?.teamId ? MOCK_TEAMS.find(team => team.id === user.teamId) : null;
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full bg-soccer-green py-4 px-6 shadow-md soccer-pattern">
        <div className="container flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-md">
              <svg
                className="h-8 w-8 text-soccer-green"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 15L9 9.75L12 4.5L15 9.75L12 15Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7.5 10.5L12 15L16.5 10.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7.5 19.5L12 15L16.5 19.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-white text-lg md:text-2xl font-bold tracking-tight">Voetbal Arena</h1>
              <p className="text-white/80 text-xs md:text-sm">Lokale competitie</p>
            </div>
          </div>
          
          <div className={cn(
            "flex space-x-4",
            isMobile ? "flex" : "hidden md:flex"
          )}>
            {isAuthenticated && user ? (
              <UserAccount user={user} onLogout={logout} />
            ) : (
              <>
                <button 
                  className="bg-white text-soccer-green px-4 py-2 rounded-md hover:bg-opacity-90 transition-colors font-medium"
                  onClick={() => document.getElementById('login-modal')?.showModal()}
                >
                  Inloggen
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-6">
        {isAuthenticated && user ? (
          <>
            {user.role === "admin" ? (
              <AdminPanel />
            ) : (
              teamData && (
                <TeamDashboard user={user} teamData={teamData} />
              )
            )}
          </>
        ) : (
          <Tabs defaultValue="competitie" className="w-full">
            <TabsList className="w-full flex mb-8 bg-muted/50 p-1 overflow-x-auto">
              <TabItem value="competitie" icon={<Award />} label="Competitie" />
              <TabItem value="beker" icon={<Trophy />} label="Beker" />
              <TabItem value="schorsingen" icon={<Ban />} label="Schorsingen" />
              <TabItem value="reglement" icon={<FileText />} label="Reglement" />
            </TabsList>
            <div className="animate-fade-in">
              <TabsContent value="competitie"><CompetitionTab /></TabsContent>
              <TabsContent value="beker"><CupTab /></TabsContent>
              <TabsContent value="schorsingen"><SuspensionsTab /></TabsContent>
              <TabsContent value="reglement"><RegulationsTab /></TabsContent>
            </div>
          </Tabs>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-soccer-black py-6 text-white/80">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-white mb-3">Voetbal Arena</h3>
              <p className="text-sm">De beste lokale voetbalcompetitie in de regio sinds 1985.</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3">Contact</h3>
              <p className="text-sm">info@voetbalarena.nl</p>
              <p className="text-sm">+31 123 456 789</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3">Volg Ons</h3>
              <div className="flex space-x-4 text-sm">
                <a href="#" className="hover:text-white transition-colors">Facebook</a>
                <a href="#" className="hover:text-white transition-colors">Instagram</a>
                <a href="#" className="hover:text-white transition-colors">Twitter</a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-white/10 text-center text-sm">
            <p>© {new Date().getFullYear()} Voetbal Arena. Alle rechten voorbehouden.</p>
          </div>
        </div>
      </footer>

      {/* Login Dialog */}
      <dialog id="login-modal" className="modal modal-middle sm:modal-middle rounded-lg shadow-lg p-6 backdrop:bg-black/50 backdrop:backdrop-blur-sm">
        <div className="max-w-md mx-auto p-4">
          <LoginForm onLoginSuccess={(user) => {
            login(user);
            document.getElementById('login-modal')?.close();
          }} />
        </div>
      </dialog>
    </div>
  );
};

interface TabItemProps {
  value: string;
  icon: React.ReactNode;
  label: string;
}

const TabItem: React.FC<TabItemProps> = ({ value, icon, label }) => {
  return (
    <TabsTrigger
      value={value}
      className={cn(
        "flex-1 min-w-max flex items-center justify-center gap-2 px-4 py-2 font-medium",
        "data-[state=active]:bg-white data-[state=active]:text-soccer-green data-[state=active]:shadow-sm",
        "text-gray-600 transition-all"
      )}
    >
      {icon}
      <span>{label}</span>
    </TabsTrigger>
  );
};

export default Layout;
