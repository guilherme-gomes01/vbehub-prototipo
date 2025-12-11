import React, { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert } from '@mui/material';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Validacao "Hardcoded" para o MVP
        if (email === 'usuariolocal01@vbehub.com' && senha === '123456') {
            onLogin(true); // Avisa o App que logou
        } else {
            setErro(true);
        }
    };

    return (
        <Box sx={{ 
            height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' 
        }}>
            <Paper elevation={3} sx={{ p: 4, width: '400px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h5" align="center" gutterBottom>
                    🔐 VBE Hub - Acesso Restrito
                </Typography>
                
                {erro && <Alert severity="error">Credenciais inválidas!</Alert>}
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <TextField 
                        label="E-mail Institucional" 
                        variant="outlined" 
                        fullWidth 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField 
                        label="Senha" 
                        type="password" 
                        variant="outlined" 
                        fullWidth 
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                    />
                    <Button type="submit" variant="contained" size="large" fullWidth>
                        Entrar no Sistema
                    </Button>
                </form>
            </Paper>
        </Box>
    );
};

export default Login;