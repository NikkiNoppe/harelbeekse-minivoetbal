import React from 'react';
import { 
  AppShell, 
  Burger, 
  Group, 
  Text, 
  Tabs,
  UnstyledButton,
  useMantineTheme
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { 
  Home, 
  Trophy, 
  Calendar, 
  Users, 
  FileText, 
  Settings,
  User,
  LogOut 
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useTabVisibility, TabName } from '@/context/TabVisibilityContext';

interface MantineLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLoginClick: () => void;
}

export const MantineLayout: React.FC<MantineLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  onLoginClick
}) => {
  const [opened, { toggle }] = useDisclosure();
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const { user, logout } = useAuth();
  const { isTabVisible } = useTabVisibility();

  const tabs = [
    { value: 'algemeen', label: 'Algemeen', icon: <Home size={16} /> },
    { value: 'competitie', label: 'Competitie', icon: <Trophy size={16} /> },
    { value: 'beker', label: 'Beker', icon: <Calendar size={16} /> },
    { value: 'playoff', label: 'Play-off', icon: <Trophy size={16} /> },
    { value: 'teams', label: 'Teams', icon: <Users size={16} /> },
    { value: 'kaarten', label: 'Kaarten', icon: <FileText size={16} /> },
    { value: 'schorsingen', label: 'Schorsingen', icon: <FileText size={16} /> },
    { value: 'reglement', label: 'Reglement', icon: <FileText size={16} /> },
  ].filter(tab => isTabVisible(tab.value as TabName));

  const handleLogout = () => {
    logout();
    onTabChange('algemeen');
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened }
      }}
      padding="md"
      styles={{
        main: {
          backgroundColor: '#faf8ff',
        },
        header: {
          backgroundColor: '#60368c',
          borderBottom: '2px solid #ab86dd',
        },
        navbar: {
          backgroundColor: '#e9e0ff',
          borderRight: '2px solid #ab86dd',
        },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
              color="white"
            />
            <Text size="xl" fw={700} c="white">
              Harelbeke Minivoetbal
            </Text>
          </Group>
          
          <Group>
            {user ? (
              <Group gap="sm">
                <Text size="sm" c="white">
                  Welkom, {user.username}
                </Text>
                <UnstyledButton
                  onClick={handleLogout}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#ab86dd',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <LogOut size={16} />
                  <Text size="sm">Uitloggen</Text>
                </UnstyledButton>
              </Group>
            ) : (
              <UnstyledButton
                onClick={onLoginClick}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#ab86dd',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <User size={16} />
                <Text size="sm">Inloggen</Text>
              </UnstyledButton>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      {!isMobile && (
        <AppShell.Navbar p="md">
          <Tabs
            value={activeTab}
            onChange={(value) => value && onTabChange(value)}
            orientation="vertical"
            color="purple"
            styles={{
              list: {
                gap: '4px',
              },
              tab: {
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid transparent',
                '&[data-active]': {
                  backgroundColor: '#60368c',
                  color: 'white',
                  borderColor: '#ab86dd',
                },
                '&:hover:not([data-active])': {
                  backgroundColor: '#ab86dd',
                  color: 'white',
                },
              },
            }}
          >
            <Tabs.List>
              {tabs.map((tab) => (
                <Tabs.Tab
                  key={tab.value}
                  value={tab.value}
                  leftSection={tab.icon}
                >
                  {tab.label}
                </Tabs.Tab>
              ))}
              
              {user?.role === 'admin' && (
                <Tabs.Tab
                  value="admin"
                  leftSection={<Settings size={16} />}
                >
                  Admin
                </Tabs.Tab>
              )}
            </Tabs.List>
          </Tabs>
        </AppShell.Navbar>
      )}

      <AppShell.Main>
        {isMobile && (
          <Tabs
            value={activeTab}
            onChange={(value) => value && onTabChange(value)}
            color="purple"
            styles={{
              list: {
                backgroundColor: '#e9e0ff',
                borderRadius: '8px',
                marginBottom: '16px',
                padding: '4px',
                overflowX: 'auto',
              },
              tab: {
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '14px',
                '&[data-active]': {
                  backgroundColor: '#60368c',
                  color: 'white',
                },
              },
            }}
          >
            <Tabs.List>
              {tabs.map((tab) => (
                <Tabs.Tab
                  key={tab.value}
                  value={tab.value}
                  leftSection={tab.icon}
                >
                  {tab.label}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs>
        )}
        
        {children}
      </AppShell.Main>
    </AppShell>
  );
};