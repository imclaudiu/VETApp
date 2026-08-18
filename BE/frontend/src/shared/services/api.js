import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost', // prin Traefik, fara port explicit (port 80)
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || error.response?.data || error.message || 'Eroare necunoscută';
        return Promise.reject(new Error(message));
    }
);

export default api;