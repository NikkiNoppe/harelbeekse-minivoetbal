import React from 'react';
import { Button, ButtonProps } from '@mantine/core';

interface MantineButtonProps extends Omit<ButtonProps, 'type'> {
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
}

export const MantineButton: React.FC<MantineButtonProps> = ({ 
  children, 
  variant = 'filled', 
  type,
  ...props 
}) => {
  return (
    <Button
      variant={variant}
      radius="md"
      type={type}
      style={{
        transition: 'all 0.2s ease',
        minHeight: '44px', // Touch target
      }}
      styles={{
        root: {
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
      }}
      {...props}
    >
      {children}
    </Button>
  );
};