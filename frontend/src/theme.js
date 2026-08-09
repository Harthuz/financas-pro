import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2E5A44',      // Verde Musgo Escuro
      dark: '#1C3A2B',
      light: '#4B7B61',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#556B2F',      // Verde Oliva Escuro
      dark: '#3A4B20',
      light: '#7F9E4B',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F5F7F6',   // Cinza-esverdeado claro para fundo geral
      paper: '#FFFFFF',     // Branco puro para cartões e containers
    },
    text: {
      primary: '#1F2E26',   // Texto principal escuro musgo
      secondary: '#50665B', // Texto secundário acinzentado
    },
    success: {
      main: '#2E7D32',
    },
    error: {
      main: '#D32F2F',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    button: {
      textTransform: 'none', // Evita botões em CAIXA ALTA forçada
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow: '0 4px 18px 0 rgba(46, 90, 68, 0.05), 0 1px 3px 0 rgba(46, 90, 68, 0.02)',
          border: '1px solid rgba(46, 90, 68, 0.08)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          boxShadow: '0 2px 8px 0 rgba(46, 90, 68, 0.15)',
          '&:hover': {
            boxShadow: '0 4px 14px 0 rgba(46, 90, 68, 0.25)',
          },
        },
        root: {
          borderRadius: 8,
          padding: '8px 18px',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: '1px',
          },
        },
      },
    },
  },
});

export default theme;
