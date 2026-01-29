import React, { useState, useContext } from 'react'; // Adiciona useContext
import { Box, Paper, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { AuthContext } from '../context/AuthContext'; // Importa o Contexto

const Login = () => { // Nao recebe mais props
    const { login } = useContext(AuthContext); // Pega a funcao de login global
    
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState(false);
    const [carregando, setCarregando] = useState(false); // Feedback visual

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro(false);
        setCarregando(true);

        // Chama a funcao do Contexto (que chama a API Java)
        const sucesso = await login(email, senha);

        if (!sucesso) {
            setErro(true);
            setCarregando(false);
        }
        // Se sucesso, o AuthContext atualiza o estado 'authenticated' e o App redireciona sozinho
    };

    return (
        <Box sx={{ 
            height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' 
        }}>
            <Paper elevation={3} sx={{ p: 4, width: '400px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h5" align="center" gutterBottom>
                    🔐 VBE Hub - Acesso Restrito
                </Typography>
                
                {erro && <Alert severity="error">Credenciais inválidas! Verifique e-mail e senha.</Alert>}
                
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
                    <Button 
                        type="submit" 
                        variant="contained" 
                        size="large" 
                        fullWidth
                        disabled={carregando}
                    >
                        {carregando ? <CircularProgress size={24} color="inherit"/> : "Entrar no Sistema"}
                    </Button>
                </form>
            </Paper>
        </Box>
    );
};

export default Login;