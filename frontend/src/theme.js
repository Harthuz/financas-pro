import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#10B981',      // Emerald Neon
      dark: '#059669',
      light: '#34D399',
      contrastText: '#05150E',
    },
    secondary: {
      main: '#38BDF8',      // Sky Cyan
      dark: '#0284C7',
      light: '#7DD3FC',
      contrastText: '#081420',
    },
    background: {
      default: '#090D16',   // Obsidian Deep Canvas
      paper: '#111827',     // Elevated Slate Surface
    },
    text: {
      primary: '#F8FAFC',   // Crisp Alabaster
      secondary: '#94A3B8', // Muted Titanium Gray
    },
    success: {
      main: '#10B981',
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
    borderRadius: 14,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          backgroundImage: 'none',
          backgroundColor: 'rgba(17, 24, 39, 0.82)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 18,
          backgroundImage: 'none',
          backgroundColor: '#111827',
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
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          color: '#04130D',
          fontWeight: 700,
          boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
            boxShadow: '0 6px 20px 0 rgba(16, 185, 129, 0.45)',
          },
        },
        root: {
          borderRadius: 10,
          padding: '8px 16px',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: 'rgba(9, 13, 22, 0.6)',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(148, 163, 184, 0.22)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(16, 185, 129, 0.5)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#10B981',
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
          backgroundColor: '#0D1320',
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
