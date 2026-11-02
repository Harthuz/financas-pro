import React, { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import theme from './theme'
import './index.css'
import App from './App.jsx'
import StagePage from './StagePage.jsx'

function RootRouter() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (to) => {
    window.history.pushState({}, '', to);
    setPathname(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isStage = pathname === '/stage' || pathname.startsWith('/stage/');

  useEffect(() => {
    document.title = isStage ? 'Stage • Finanças Pro' : 'Finanças Pro';
  }, [isStage]);

  if (isStage) {
    return <StagePage onNavigateHome={() => navigate('/')} />;
  }

  return <App onNavigateStage={() => navigate('/stage')} />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RootRouter />
    </ThemeProvider>
  </StrictMode>,
)
