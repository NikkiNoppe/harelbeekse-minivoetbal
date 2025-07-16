import React from 'react';
import { Card, CardProps } from '@mantine/core';

interface MantineCardProps extends CardProps {
  children: React.ReactNode;
}

export const MantineCard: React.FC<MantineCardProps> = ({ children, ...props }) => {
  return (
    <Card
      radius="md"
      shadow="sm"
      withBorder
      style={{
        borderColor: '#e9e0ff',
        transition: 'all 0.2s ease',
      }}
      {...props}
    >
      {children}
    </Card>
  );
};