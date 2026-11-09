import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3A9C74',      // Emerald Neon
      dark: '#2F7F5F',
      light: '#5BB591',
      contrastText: '#05150E',
    },
    secondary: {
      main: '#5B9BD5',      // Sky Cyan
      dark: '#3F7FB8',
      light: '#93BDE3',
      contrastText: '#081420',
    },
    background: {
      default: '#0D1014',   // Obsidian Deep Canvas
      paper: '#15181D',     // Elevated Slate Surface
    },
    text: {
      primary: '#F8FAFC',   // Crisp Alabaster
      secondary: '#94A3B8', // Muted Titanium Gray
    },
    success: {
      main: '#3A9C74',
    },
    warning: {
      main: '#F59E0B',
    },
    error: {
      main: '#F43F5E',
    },
    divider: 'rgba(148, 163, 184, 0.12)',
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
      fontWeight: 800,
      letterSpacing: '-0.025em',
    },
    h5: {
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 4 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          backgroundImage: 'none',
          backgroundColor: '#15181D',
          boxShadow: 'none',
          border: '1px solid rgba(148, 163, 184, 0.12)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          backgroundImage: 'none',
          backgroundColor: '#15181D',
          border: '1px solid rgba(148, 163, 184, 0.16)',
        },
        paperFullScreen: {
          borderRadius: 0,
          border: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          backgroundColor: '#3A9C74',
          color: '#04130D',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: '#2F7F5F',
            boxShadow: 'none',
          },
        },
        root: {
          borderRadius: 6,
          padding: '8px 16px',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          backgroundColor: 'rgba(13, 16, 20, 0.6)',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(148, 163, 184, 0.22)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(58, 156, 116, 0.5)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#3A9C74',
            borderWidth: '1.5px',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        },
        head: {
          backgroundColor: '#111418',
          color: '#94A3B8',
          fontWeight: 700,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
      },
    },
  },
});

export default theme;
