import axios from 'axios';

const api = axios.create({
    // Le da variavel de ambiente do Vite; fallback para localhost em dev
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081/api',
});

// Interceptor de REQUEST: injeta o token JWT automaticamente
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('vbehub_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor de RESPONSE: trata 401 (token expirado/invalido)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Limpa sessao e redireciona para login
            localStorage.removeItem('vbehub_token');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default api;