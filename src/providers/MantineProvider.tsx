import React from 'react';
import { MantineProvider as Provider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { mantineTheme } from '@/theme/mantine-theme';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/modals/styles.css';

interface MantineProviderProps {
  children: React.ReactNode;
}

export const MantineProvider: React.FC<MantineProviderProps> = ({ children }) => {
  return (
    <Provider theme={mantineTheme}>
      <ModalsProvider>
        <Notifications position="top-right" />
        {children}
      </ModalsProvider>
    </Provider>
  );
};