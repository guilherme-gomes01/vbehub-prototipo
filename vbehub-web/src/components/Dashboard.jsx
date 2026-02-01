import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box, CircularProgress } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const Dashboard = () => {
    const [riscoData, setRiscoData] = useState([]);
    const [statusData, setStatusData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Cores para o gráfico de Pizza (Risco)
    const CORES_RISCO = {
        'Alto': '#d32f2f',    // Vermelho
        'Médio': '#ed6c02',   // Laranja
        'Baixo': '#2e7d32',   // Verde
        'Desconhecido': '#9e9e9e'
    };

    useEffect(() => {
        const fetchDados = async () => {
            try {
                // Busca os dados dos endpoints
                const [reqRisco, reqStatus] = await Promise.all([
                    api.get('/sinais/stats/risco'),
                    api.get('/sinais/stats/status')
                ]);

                setRiscoData(reqRisco.data);
                setStatusData(reqStatus.data);
            } catch (error) {
                console.error("Erro ao carregar dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDados();
    }, []);

    if (loading) return <Box sx={{display:'flex', justifyContent:'center', p:5}}><CircularProgress /></Box>;

    return (
        <Box sx={{ flexGrow: 1, mt: 2 }}>
            <Grid container spacing={3}>
                
                {/* --- GRÁFICO 1: NÍVEL DE RISCO (PIZZA) --- */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={3} sx={{ p: 3, height: '400px', display:'flex', flexDirection:'column', alignItems:'center' }}>
                        <Typography variant="h6" gutterBottom color="primary">
                            Monitoramento de Risco
                        </Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={riscoData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {riscoData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CORES_RISCO[entry.name] || '#8884d8'} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* --- GRÁFICO 2: STATUS DO PROCESSO (BARRAS) --- */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={3} sx={{ p: 3, height: '400px', display:'flex', flexDirection:'column', alignItems:'center' }}>
                        <Typography variant="h6" gutterBottom color="primary">
                            Gargalos do Processo
                        </Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statusData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="value" name="Quantidade de Sinais" fill="#1976d2" barSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

            </Grid>
        </Box>
    );
};

export default Dashboard;