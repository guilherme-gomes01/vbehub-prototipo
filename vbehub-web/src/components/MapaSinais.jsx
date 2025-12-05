import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { Box, Paper, Typography, Chip } from '@mui/material';
import L from 'leaflet';

// --- FUNCAO PARA CRIAR ICONES SVG DINAMICOS ---
// Cria um icone SVG inline com a cor desejada
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-icon',
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" fill="${color}" stroke="black" stroke-width="1">
             <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
           </svg>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36], // A ponta do pino fica no centro inferior
    popupAnchor: [0, -36], // O popup abre acima do pino
  });
};

// Icones pre-definidos para performance
const icons = {
  Alto: createCustomIcon('#d32f2f'),   // Vermelho
  Medio: createCustomIcon('#ed6c02'),  // Laranja/Amarelo Escuro
  Baixo: createCustomIcon('#2e7d32'),  // Verde
  Default: createCustomIcon('#1976d2') // Azul (Padrao)
};

const getIconByRisk = (risk) => {
  const r = risk ? risk.toLowerCase() : '';
  if (r.includes('alto')) return icons.Alto;
  if (r.includes('médio') || r.includes('medio')) return icons.Medio;
  if (r.includes('baixo')) return icons.Baixo;
  return icons.Default;
};

const MapaSinais = () => {
    const [sinais, setSinais] = useState([]);

    useEffect(() => {
        axios.get('http://72.61.222.85:8081/api/sinais')
            .then(response => {
                // Filtra apenas sinais que tenham latitude e longitude validas
                const validos = response.data.filter(s => s.latitude && s.longitude);
                setSinais(validos);
            })
            .catch(error => console.error("Erro ao carregar mapa:", error));
    }, []);

    return (
        <Paper elevation={3} sx={{ p: 1, height: '600px', width: '100%' }}>
            <MapContainer 
                center={[-3.1190, -60.0217]} // Centro de Manaus
                zoom={12} 
                style={{ height: '100%', width: '100%', borderRadius: '8px' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {sinais.map(sinal => (
                    <Marker 
                        key={sinal.id} 
                        position={[sinal.latitude, sinal.longitude]}
                        icon={getIconByRisk(sinal.nivelRisco)} // Aplica o icone colorido
                    >
                        <Popup>
                            <Box sx={{ minWidth: '200px' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                    {sinal.titulo}
                                </Typography>
                                <Typography variant="caption" display="block" gutterBottom>
                                    {sinal.localizacaoBairro || 'Local Desconhecido'}
                                </Typography>
                                
                                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                    <Chip 
                                        label={sinal.nivelRisco || 'N/A'} 
                                        // Cor do chip tambem acompanha o risco
                                        color={
                                            (sinal.nivelRisco || '').toLowerCase().includes('alto') ? 'error' : 
                                            (sinal.nivelRisco || '').toLowerCase().includes('médio') ? 'warning' : 
                                            (sinal.nivelRisco || '').toLowerCase().includes('medio') ? 'warning' : 
                                            'success'
                                        } 
                                        size="small" 
                                        sx={{ height: '20px', fontSize: '10px' }}
                                    />
                                    <Chip 
                                        label={sinal.status} 
                                        size="small" 
                                        variant="outlined"
                                        sx={{ height: '20px', fontSize: '10px' }}
                                    />
                                </Box>
                            </Box>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </Paper>
    );
};

export default MapaSinais;