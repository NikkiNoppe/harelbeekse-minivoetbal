
import React, { useState } from "react";
import { Button, Drawer, Group, Menu, Text, Avatar, Divider, Stack, Box, Title } from "@mantine/core";
import { useAuth } from "@/components/auth/AuthProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu as MenuIcon, User, LogOut, Settings, Shield, Users, Calendar, Trophy, Award, DollarSign, Home, BookOpen, Ban, AlertTriangle, Target } from "lucide-react";
import Logo from "./Logo";

interface HeaderProps {
  onLogoClick: () => void;
  onLoginClick: () => void;
  onTabChange: (tab: string) => void;
  activeTab: string;
  isAuthenticated: boolean;
  user: any;
}

const Header: React.FC<HeaderProps> = ({ 
  onLogoClick, 
  onLoginClick,
  onTabChange,
  activeTab,
  isAuthenticated,
  user
}) => {
  const isMobile = useIsMobile();
  const [drawerOpened, setDrawerOpened] = useState(false);

  // Route mapping per key (voor toekomstig onderscheid)
  const routeMap: Record<string, string> = {
    algemeen: '/', beker: '/beker', competitie: '/competitie', playoff: '/playoff', schorsingen: '/schorsingen', teams: '/teams', reglement: '/reglement', kaarten: '/kaarten',
    'match-forms': '/match-forms', players: '/players', users: '/users', competition: '/competition', playoffs: '/playoffs', cup: '/cup', financial: '/financial', settings: '/settings',
  };

  const handleLogout = () => {
    setDrawerOpened(false);
    // Optioneel: trigger een logout callback als je die wilt toevoegen
  };

  const adminNavItems = [
    { key: "match-forms", label: "Wedstrijdformulieren", icon: <Calendar size={16} />, adminOnly: false },
    { key: "players", label: "Spelers", icon: <Users size={16} />, adminOnly: false },
    { key: "teams", label: "Teams", icon: <Shield size={16} />, adminOnly: true },
    { key: "users", label: "Gebruikers", icon: <User size={16} />, adminOnly: true },
    { key: "competition", label: "Competitie", icon: <Trophy size={16} />, adminOnly: true },
    { key: "cup", label: "Beker", icon: <Award size={16} />, adminOnly: true },
    { key: "financial", label: "Financieel", icon: <DollarSign size={16} />, adminOnly: true },
    { key: "settings", label: "Instellingen", icon: <Settings size={16} />, adminOnly: true }
  ];

  const publicNavItems = [
    { key: "algemeen", label: "Algemeen", icon: <Home size={16} /> },
    { key: "beker", label: "Beker", icon: <Award size={16} /> },
    { key: "competitie", label: "Competitie", icon: <Trophy size={16} /> },
    { key: "playoff", label: "Play-off", icon: <Target size={16} /> },
    { key: "schorsingen", label: "Schorsingen", icon: <Ban size={16} /> },
    { key: "teams", label: "Teams", icon: <Shield size={16} /> },
    { key: "reglement", label: "Reglement", icon: <BookOpen size={16} /> }
  ];

  const isAdmin = user?.role === "admin";
  const visibleAdminItems = adminNavItems.filter(item => !item.adminOnly || isAdmin);
  const currentNavItems = isAuthenticated ? visibleAdminItems : publicNavItems;

  return (
    <header style={{ background: '#6d28d9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', position: 'sticky', top: 0, zIndex: 50 }}>
      <Box mx="auto" px={16} style={{ maxWidth: 1200 }}>
        <Group justify="space-between" align="center" h={64}>
          <Logo onClick={onLogoClick} />
          <Button
            variant="subtle"
            c="grape"
            size="md"
            style={{ background: '#ede9fe' }}
            onClick={() => setDrawerOpened(true)}
          >
            <MenuIcon size={24} />
          </Button>
        </Group>
      </Box>
      <Drawer
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        position="right"
        size={320}
        padding="md"
        title={<Title order={3} c="grape.8">{isAuthenticated ? "Dashboard" : "Navigatie"}</Title>}
      >
        <Stack gap="md">
          {isAuthenticated && (
            <Group gap="sm" align="center" p="xs" style={{ background: '#ede9fe', borderRadius: 12 }}>
              <Avatar color="grape" radius="xl">{user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}</Avatar>
              <Box>
                <Text fw={500} c="grape.9">{user?.username || user?.email}</Text>
                <Text size="xs" c="grape.6">{user?.role === "admin" ? "Administrator" : user?.role === "referee" ? "Scheidsrechter" : "Team Manager"}</Text>
              </Box>
            </Group>
          )}
          <Divider label="Menu" labelPosition="left" color="grape.2" />
          <Stack gap={0}>
            {currentNavItems.map((item) => (
              <Button
                key={item.key}
                variant={activeTab === item.key ? "light" : "subtle"}
                c="grape"
                leftSection={item.icon}
                fullWidth
                onClick={() => {
                  setDrawerOpened(false);
                  onTabChange(item.key);
                }}
                style={{ justifyContent: 'flex-start', fontWeight: 500 }}
              >
                {item.label}
              </Button>
            ))}
          </Stack>
          <Divider color="grape.2" />
          {!isAuthenticated && (
            <Button
              leftSection={<User size={16} />}
              c="grape"
              variant="filled"
              fullWidth
              onClick={() => {
                onLoginClick();
                setDrawerOpened(false);
              }}
            >
              Inloggen
            </Button>
          )}
          {isAuthenticated && (
            <Button
              leftSection={<LogOut size={16} />}
              c="grape"
              variant="outline"
              fullWidth
              onClick={handleLogout}
            >
              Uitloggen
            </Button>
          )}
        </Stack>
      </Drawer>
    </header>
  );
};

export default Header;
