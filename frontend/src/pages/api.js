import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://localhost:7073/api';
const api = axios.create({
    baseURL: API_BASE_URL, // Replace with your actual API base URL
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        debugger;
        const token = localStorage.getItem('mongo-token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor (optional, but often useful)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        debugger;
        if (error.response && error.response.status === 401) {
            // Handle unauthorized access (e.g., redirect to login)
            localStorage.removeItem('mongo-token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
