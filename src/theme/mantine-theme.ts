import { createTheme, MantineColorsTuple } from '@mantine/core';

// Your exact purple color palette
const primaryColors: MantineColorsTuple = [
  '#e9e0ff', // zeer licht - 50
  '#d4c5ff', // 100  
  '#c1a8ff', // 200
  '#ab86dd', // licht - 300 (your specified light)
  '#9b6fd9', // 400
  '#8b58d5', // 500
  '#7b47d1', // 600
  '#60368c', // donker - 700 (your specified dark)
  '#4a2a6b', // 800
  '#351f4a', // 900
];

export const mantineTheme = createTheme({
  primaryColor: 'purple',
  colors: {
    purple: primaryColors,
  },
  fontFamily: 'Inter, system-ui, sans-serif',
  radius: {
    xs: '4px',
    sm: '6px', 
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  spacing: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  shadows: {
    sm: '0 1px 3px rgba(96, 54, 140, 0.1)',
    md: '0 4px 6px rgba(96, 54, 140, 0.1), 0 2px 4px rgba(96, 54, 140, 0.06)',
    lg: '0 10px 15px rgba(96, 54, 140, 0.1), 0 4px 6px rgba(96, 54, 140, 0.05)',
  },
  components: {
    Card: {
      defaultProps: {
        radius: 'md',
        shadow: 'sm',
        withBorder: true,
      },
      styles: {
        root: {
          borderColor: '#e9e0ff',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 10px 15px rgba(96, 54, 140, 0.1), 0 4px 6px rgba(96, 54, 140, 0.05)',
            transition: 'all 0.2s ease',
          },
        },
      },
    },
    Button: {
      defaultProps: {
        radius: 'md',
      },
      styles: {
        root: {
          border: '1px solid transparent',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
      },
      styles: {
        input: {
          borderColor: '#e9e0ff',
          '&:focus': {
            borderColor: '#60368c',
          },
        },
      },
    },
    Table: {
      defaultProps: {
        withRowBorders: true,
        withColumnBorders: false,
      },
      styles: {
        table: {
          borderColor: '#e9e0ff',
        },
        th: {
          backgroundColor: '#e9e0ff',
          color: '#60368c',
          fontWeight: 600,
          borderColor: '#ab86dd',
        },
        td: {
          borderColor: '#e9e0ff',
        },
      },
    },
  },
});