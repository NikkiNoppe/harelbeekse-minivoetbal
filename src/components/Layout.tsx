
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, FileText, Trophy, Ban, Users, Home, BookOpen, Image, Mail } from "lucide-react";
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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

// Updated mock teams data with email instead of permissions
const MOCK_TEAMS = [
  { id: 1, name: "FC De Kampioenen", email: "kampioenen@example.com" },
  { id: 2, name: "Bavo United", email: "bavo@example.com" },
  { id: 3, name: "Zandberg Boys", email: "zandberg@example.com" },
  { id: 4, name: "Sportclub Veldhoven", email: "veldhoven@example.com" },
];

// Mock news data
const NEWS_ITEMS = [
  {
    id: 1,
    title: "Nieuw seizoen van start",
    date: "14 December, 2024",
    excerpt: "Het nieuwe seizoen is van start gegaan met spannende wedstrijden.",
    image: "https://images.unsplash.com/photo-1516731415730-0c607149933a?q=80&w=200&h=150&auto=format&fit=crop"
  },
  {
    id: 2,
    title: "Overzicht trainingsschema",
    date: "10 December, 2024",
    excerpt: "Bekijk het nieuwe trainingsschema voor het komende seizoen.",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=200&h=150&auto=format&fit=crop"
  },
];

// Mock sponsors
const SPONSORS = [
  { id: 1, name: "Sponsor 1", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Adidas_logo.png/800px-Adidas_logo.png" },
  { id: 2, name: "Sponsor 2", logo: "https://1000logos.net/wp-content/uploads/2021/05/Coca-Cola-logo.png" },
  { id: 3, name: "Sponsor 3", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Ford_logo_flat.svg/2560px-Ford_logo_flat.svg.png" },
  { id: 4, name: "Sponsor 4", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Nike_logo.svg/2560px-Nike_logo.svg.png" },
];

// Mock features
const FEATURES = [
  { 
    id: 1, 
    title: "Ons Team", 
    description: "Bekijk ons team van ervaren spelers en coaches.", 
    icon: <Users className="h-12 w-12 text-white mb-4" />, 
    link: "#" 
  },
  { 
    id: 2, 
    title: "Prijzen", 
    description: "Ontdek onze prestaties en gewonnen prijzen.", 
    icon: <Award className="h-12 w-12 text-white mb-4" />, 
    link: "#" 
  },
  { 
    id: 3, 
    title: "Coaches", 
    description: "Maak kennis met onze ervaren trainers.", 
    icon: <Trophy className="h-12 w-12 text-white mb-4" />, 
    link: "#" 
  },
  { 
    id: 4, 
    title: "Regels", 
    description: "Lees over de regels en richtlijnen van onze club.", 
    icon: <FileText className="h-12 w-12 text-white mb-4" />, 
    link: "#" 
  },
];

// Activities we offer
const ACTIVITIES = [
  { id: 1, title: "Team training", description: "Wekelijkse teamtraining voor alle leeftijden" },
  { id: 2, title: "Privé coaching", description: "One-on-one training met onze beste coaches" },
  { id: 3, title: "Zomerkamp", description: "Intensieve trainingen tijdens de zomervakantie" },
  { id: 4, title: "Vriendschappelijke wedstrijden", description: "Wedstrijden tegen andere lokale clubs" },
];

const Layout: React.FC = () => {
  const isMobile = useIsMobile();
  const { user, login, logout, isAuthenticated } = useAuth();
  const [loginDialogOpen, setLoginDialogOpen] = React.useState(false);
  
  // Find team data if user is a team role
  const teamData = user?.teamId ? MOCK_TEAMS.find(team => team.id === user.teamId) : null;
  
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Navigation */}
      <header className="w-full bg-black/90 py-4 px-6 shadow-md border-b border-gray-800 sticky top-0 z-50">
        <div className="container flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-md">
              <svg
                className="h-6 w-6 text-black"
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
              <h1 className="text-white text-lg md:text-xl font-bold tracking-tight">SOCCER<span className="text-gray-400">CLUB</span></h1>
              <p className="text-gray-400 text-xs">since 2023</p>
            </div>
          </div>
          
          <div className="hidden md:flex space-x-6 items-center">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink 
                    href="#"
                    className="text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center"
                  >
                    <Home className="mr-1 h-4 w-4" /> Home
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm font-medium text-gray-300 hover:text-white transition-colors bg-transparent">About Club</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[200px] gap-2 p-2 bg-black/90 border border-gray-800">
                      <li>
                        <NavigationMenuLink href="#" className="block p-2 hover:bg-gray-800 rounded">Club Information</NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink href="#" className="block p-2 hover:bg-gray-800 rounded">Our Coaches</NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink href="#" className="block p-2 hover:bg-gray-800 rounded">Training Rooms</NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink href="#" className="block p-2 hover:bg-gray-800 rounded">Arena</NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink 
                    href="#"
                    className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                  >
                    Team
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink 
                    href="#"
                    className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                  >
                    Blog
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink 
                    href="#"
                    className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                  >
                    <Image className="mr-1 h-4 w-4" /> Gallery
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink 
                    href="#"
                    className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                  >
                    <Mail className="mr-1 h-4 w-4" /> Contacts
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          
          <div className="flex space-x-4">
            {isAuthenticated && user ? (
              <UserAccount user={user} onLogout={logout} />
            ) : (
              <>
                <Button 
                  variant="outline"
                  className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white"
                  onClick={() => setLoginDialogOpen(true)}
                >
                  Inloggen
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      {isAuthenticated && user ? (
        <main className="flex-1 container py-8 bg-gray-100 text-gray-900">
          {user.role === "admin" ? (
            <AdminPanel />
          ) : (
            user.teamId && teamData && (
              <TeamDashboard user={user} teamData={teamData} />
            )
          )}
        </main>
      ) : (
        <div className="flex-1">
          {/* Hero Section */}
          <section className="dark-hero min-h-[70vh] flex items-center">
            <div className="container px-6 py-20">
              <div className="max-w-2xl animate-fade-in">
                <h1 className="text-5xl md:text-6xl font-bold mb-4 hero-text">SOCCER</h1>
                <h2 className="text-3xl md:text-4xl font-medium mb-6 hero-text">We Love This Game</h2>
                <p className="text-gray-300 mb-8">
                  Lorem ipsum dolor sit amet consectetur adipisicing elit, sed do eiusmod tempor incididunt ut 
                  labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.
                </p>
                <Button 
                  className="bg-white text-black hover:bg-gray-200 hover:text-black flex items-center gap-2"
                >
                  More about our team
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Button>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-16 bg-black">
            <div className="container px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {FEATURES.map((feature) => (
                  <div key={feature.id} className="text-center p-6 card-hover border border-gray-800 rounded-lg">
                    <div className="flex justify-center">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-gray-400 mb-4">{feature.description}</p>
                    <Button 
                      variant="outline" 
                      className="mt-2 bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white w-full"
                    >
                      details
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Join Club Section */}
          <section className="py-20 grass-pattern">
            <div className="container px-6">
              <div className="max-w-4xl mx-auto text-center">
                <h3 className="text-xl font-medium mb-2">Looking for a good team?</h3>
                <h2 className="text-4xl md:text-5xl font-bold mb-8">Join Our Club!</h2>
                <p className="text-gray-300 mb-8">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed quis lobortis felis. Sed commodo commodo tempor. Nullam eget augue 
                  quis felis posuere accumsan at et erat. Sed urna dolor, posuere sed amet vel, accumsan hendrerum mi. Nunc ullamcorper dolor non 
                  insipida dapibus, risus tellus congue etiam, ac faucibus odio nunc id erat. Phasellus mollis eu nisl eget congue. Vivamus id laoreet risus, 
                  sed scelerisque dolor. Curabitur ultricies convallis sapien, eget placerat magna pharetra ut.
                </p>
                <Button 
                  className="bg-white text-black hover:bg-gray-200 hover:text-black flex items-center gap-2 mx-auto"
                >
                  More about our team
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Button>
              </div>
            </div>
          </section>

          {/* News and Activities Section */}
          <section className="py-16 bg-black">
            <div className="container px-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Welcome section */}
                <div>
                  <h2 className="text-2xl font-bold mb-6 border-b border-gray-800 pb-2">WELCOME TO OUR SITE</h2>
                  <div className="mb-6">
                    <img 
                      src="https://images.unsplash.com/photo-1543351611-58f69d7c1781?q=80&w=300&h=200&auto=format&fit=crop" 
                      alt="Soccer player" 
                      className="w-full h-48 object-cover mb-4 rounded-md"
                    />
                    <h3 className="font-bold text-lg mb-2">Lorem ipsum dolor sit amet</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Lorem ipsum dolor sit amet consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore 
                      magna aliqua.
                    </p>
                    <p className="text-gray-400 text-sm">
                      Lorem ipsum dolor sit amet consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore 
                      magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo 
                      consequat.
                    </p>
                  </div>
                  <Button variant="link" className="text-white hover:text-gray-300 p-0">
                    read more →
                  </Button>
                </div>

                {/* Latest news */}
                <div>
                  <h2 className="text-2xl font-bold mb-6 border-b border-gray-800 pb-2">LATEST NEWS</h2>
                  {NEWS_ITEMS.map((item) => (
                    <div key={item.id} className="mb-8 pb-6 border-b border-gray-800">
                      <div className="text-xs text-gray-500 mb-2">{item.date}</div>
                      <h3 className="font-bold text-lg mb-3">{item.title}</h3>
                      <div className="flex gap-4 items-start">
                        <img 
                          src={item.image}
                          alt={item.title}
                          className="w-24 h-20 object-cover rounded-sm"
                        />
                        <p className="text-gray-400 text-sm">{item.excerpt}</p>
                      </div>
                    </div>
                  ))}
                  <Button variant="link" className="text-white hover:text-gray-300 p-0">
                    news archive →
                  </Button>
                </div>

                {/* What we do */}
                <div>
                  <h2 className="text-2xl font-bold mb-6 border-b border-gray-800 pb-2">WHAT WE DO</h2>
                  {ACTIVITIES.map((activity) => (
                    <div key={activity.id} className="mb-4 pb-4 border-b border-gray-800 flex gap-4">
                      <img 
                        src={`https://source.unsplash.com/random/80x60/?soccer,${activity.id}`}
                        alt={activity.title}
                        className="w-20 h-16 object-cover rounded-sm"
                      />
                      <div>
                        <h3 className="font-bold text-sm mb-1">{activity.title}</h3>
                        <p className="text-gray-400 text-xs">{activity.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Sponsors Section */}
          <section className="py-12 bg-gray-900">
            <div className="container px-6">
              <h2 className="text-2xl font-bold mb-8 text-center">OUR SPONSORS</h2>
              <div className="flex justify-center items-center gap-10 flex-wrap">
                {SPONSORS.map((sponsor) => (
                  <div key={sponsor.id} className="w-32 h-20">
                    <img 
                      src={sponsor.logo} 
                      alt={sponsor.name} 
                      className="sponsor-logo w-full h-full object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Main Content Tabs - Only shown when not using the new design */}
          <div className="hidden">
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
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="soccer-footer py-8 text-white/80">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-md">
                <svg
                  className="h-6 w-6 text-black"
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
                <h1 className="text-white text-lg font-bold tracking-tight">SOCCER<span className="text-gray-400">CLUB</span></h1>
                <p className="text-gray-400 text-xs">since 2023</p>
              </div>
            </div>
            <div className="flex space-x-4 text-sm">
              <a href="#" className="text-white/60 hover:text-white transition-colors">Home</a>
              <a href="#" className="text-white/60 hover:text-white transition-colors">About Club</a>
              <a href="#" className="text-white/60 hover:text-white transition-colors">Team</a>
              <a href="#" className="text-white/60 hover:text-white transition-colors">Blog</a>
              <a href="#" className="text-white/60 hover:text-white transition-colors">Gallery</a>
              <a href="#" className="text-white/60 hover:text-white transition-colors">Contacts</a>
            </div>
          </div>
          
          <div className="mt-8 pt-4 border-t border-white/10 text-center text-sm flex justify-between flex-wrap">
            <p>© {new Date().getFullYear()} Soccer Club. Alle rechten voorbehouden.</p>
            <div className="flex space-x-2 mt-2 md:mt-0">
              <a href="#" className="text-blue-400 hover:text-white"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg></a>
              <a href="#" className="text-blue-600 hover:text-white"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path></svg></a>
              <a href="#" className="text-pink-600 hover:text-white"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path></svg></a>
              <a href="#" className="text-red-600 hover:text-white"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd"></path></svg></a>
            </div>
          </div>
        </div>
      </footer>

      {/* Login Dialog */}
      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogContent className="sm:max-w-md bg-gray-900 text-white border-gray-800">
          <LoginForm onLoginSuccess={(user) => {
            login(user);
            setLoginDialogOpen(false);
          }} />
        </DialogContent>
      </Dialog>
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
