import React, { useState } from 'react';
import KanbanBoard from './components/KanbanBoard';
import MapaSinais from './components/MapaSinais';
import { CssBaseline, AppBar, Toolbar, Typography, Container, Tabs, Tab, Box } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MapIcon from '@mui/icons-material/Map';
import Login from './components/Login';

function App() {
  // Estado para controlar se o usuario esta logado
  const [logado, setLogado] = useState(false); 
  const [tabIndex, setTabIndex] = useState(0);

  // Se nao estiver logado, retorna apenas a tela de Login
  if (!logado) {
      return <Login onLogin={setLogado} />;
  }

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  return (
    <>
      <CssBaseline />
      
      {/* Barra Superior */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            🚨 Sistema VBE Hub
          </Typography>
        </Toolbar>
        
        {/* Abas de Navegação */}
        <Tabs 
            value={tabIndex} 
            onChange={handleTabChange} 
            textColor="inherit" 
            indicatorColor="secondary"
            centered
        >
            <Tab icon={<DashboardIcon />} label="Fluxo de Trabalho (Kanban)" />
            <Tab icon={<MapIcon />} label="Visão Geoespacial (Mapa)" />
        </Tabs>
      </AppBar>

      {/* Conteúdo Principal */}
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
      </Container>
    </>
  );
}

export default App;