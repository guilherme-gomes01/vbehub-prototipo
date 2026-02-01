import React, { useState, useContext } from 'react'; // Adicione useContext
import KanbanBoard from './components/KanbanBoard';
import MapaSinais from './components/MapaSinais';
import { CssBaseline, AppBar, Toolbar, Typography, Container, Tabs, Tab, Box, Button, CircularProgress } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MapIcon from '@mui/icons-material/Map';
import LogoutIcon from '@mui/icons-material/Logout'; // Ícone para sair
import Login from './components/Login';
import { AuthContext } from './context/AuthContext'; // Importa o Contexto
import Dashboard from './components/Dashboard'; 
import BarChartIcon from '@mui/icons-material/BarChart'; 

function App() {
  const { authenticated, logout, loading } = useContext(AuthContext); // Usa o contexto global
  const [tabIndex, setTabIndex] = useState(0);

  // Enquanto verifica o LocalStorage, mostra um "carregando" simples
  if (loading) {
      return <Box sx={{display:'flex', justifyContent:'center', mt: 5}}><CircularProgress /></Box>;
  }

  // Se não estiver logado, mostra Login (sem precisar passar props)
  if (!authenticated) {
      return <Login />;
  }

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  return (
    <>
      <CssBaseline />
      
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            🚨 Sistema VBE Hub
          </Typography>
          
          {/* Botão de Sair */}
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={logout}>
              Sair
          </Button>
        </Toolbar>
        
        <Tabs 
            value={tabIndex} 
            onChange={handleTabChange} 
            textColor="inherit" 
            indicatorColor="secondary"
            centered
        >
            <Tab icon={<DashboardIcon />} label="Fluxo de Trabalho (Kanban)" />
            <Tab icon={<MapIcon />} label="Visão Geoespacial (Mapa)" />
            <Tab icon={<BarChartIcon />} label="Indicadores (BI)" />
        </Tabs>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
        {tabIndex === 0 && (
            <Box>
                <KanbanBoard />
            </Box>
        )}
        
        {tabIndex === 1 && (
            <Box>
                <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
                    Distribuição Geográfica dos Sinais
                </Typography>
                <MapaSinais />
            </Box>
        )}

        {tabIndex === 2 && (
            <Box>
                <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
                    Painel Estratégico de Vigilância
                </Typography>
                <Dashboard />
            </Box>
        )}
      </Container>
    </>
  );
}

export default App;