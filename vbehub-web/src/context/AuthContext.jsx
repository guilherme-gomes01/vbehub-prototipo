import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Para nao piscar a tela de login no F5

    useEffect(() => {
        const token = localStorage.getItem('vbehub_token');
        if (token) {
            setUser({ token }); // Recupera a sessao
        }
        setLoading(false);
    }, []);

    const login = async (email, senha) => {
        try {
            const response = await api.post('/auth/login', { email, senha });
            const { token } = response.data;

            localStorage.setItem('vbehub_token', token);
            setUser({ token });
            return true;
        } catch (error) {
            console.error("Erro ao logar:", error);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('vbehub_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ authenticated: !!user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};