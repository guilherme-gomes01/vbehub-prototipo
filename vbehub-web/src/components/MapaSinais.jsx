import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { Box, Paper, Typography, Chip } from '@mui/material';
import L from 'leaflet';

// --- CORREÇÃO DE ÍCONES DO LEAFLET (Bug padrão do React) ---
import iconMarker from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: iconRetina,
    iconUrl: iconMarker,
    shadowUrl: iconShadow,
});
// ------------------------------------------------------------

const MapaSinais = () => {
    const [sinais, setSinais] = useState([]);

    useEffect(() => {
        // IMPORTANTE: Porta 8081 aqui!
        axios.get('http://localhost:8081/api/sinais')
            .then(response => {
                // Filtra apenas sinais que tenham latitude e longitude válidas
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
                                        color={sinal.nivelRisco === 'Alto' ? 'error' : sinal.nivelRisco === 'Médio' ? 'warning' : 'success'} 
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