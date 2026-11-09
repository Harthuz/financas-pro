import React, { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import theme from './theme'
import './index.css'
import App from './App.jsx'
import StagePage from './StagePage.jsx'
import PlanningPage from './PlanningPage.jsx'

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

  const isPlanning = pathname === '/planejamento';

  useEffect(() => {
    document.title = isStage ? 'Stage • Finanças Pro' : isPlanning ? 'Meu futuro financeiro • Finanças Pro' : 'Finanças Pro';
  }, [isStage, isPlanning]);

  if (isPlanning) return <PlanningPage onNavigateHome={() => navigate('/')} />;

  if (isStage) {
    return <StagePage onNavigateHome={() => navigate('/')} />;
  }

  return <App onNavigateStage={() => navigate('/stage')} onNavigatePlanning={() => navigate('/planejamento')} />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RootRouter />
    </ThemeProvider>
  </StrictMode>,
)
