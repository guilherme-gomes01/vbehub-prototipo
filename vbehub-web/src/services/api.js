import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8081/api', 
});

// Interceptor
api.interceptors.request.use(async (config) => {
    const token = localStorage.getItem('vbehub_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;