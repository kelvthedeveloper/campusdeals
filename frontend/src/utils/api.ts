import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
    (config) => {
        if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
            if (config.headers) {
                delete (config.headers as any)['Content-Type'];
            }
        }
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('access_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Don't intercept refresh token requests or already retried requests
        if (originalRequest.url?.includes('/auth/refresh/') || originalRequest._retry) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                const refreshToken = localStorage.getItem('refresh_token');
                const isLoginPage = window.location.pathname === '/auth/login';
                const isAuthMe = originalRequest.url?.includes('/auth/me/');

                if (refreshToken) {
                    originalRequest._retry = true;
                    try {
                        const { data } = await axios.post(`${API_URL}/auth/refresh/`, {
                            refresh: refreshToken
                        });
                        localStorage.setItem('access_token', data.access);
                        api.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
                        return api(originalRequest);
                    } catch {
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('refresh_token');
                        if (!isLoginPage) {
                            const currentPath = window.location.pathname + window.location.search;
                            window.location.href = `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
                        }
                    }
                } else {
                    // No refresh token. 
                    // ONLY redirect if we aren't already on login page AND it's not a silent auth check.
                    if (!isLoginPage && !isAuthMe) {
                        const currentPath = window.location.pathname + window.location.search;
                        window.location.href = `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
                    }
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
