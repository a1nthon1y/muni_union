import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
    withCredentials: true,
});

// ─── Lógica de refresh ────────────────────────────────────────────────────────
let isRefreshing = false;
// Cola de peticiones que llegaron mientras se estaba refrescando
let pendingQueue: Array<{ resolve: () => void; reject: (e: unknown) => void }> = [];

const processPendingQueue = (error: unknown) => {
    pendingQueue.forEach(({ resolve, reject }) => error ? reject(error) : resolve());
    pendingQueue = [];
};

const doLogout = () => {
    useAuthStore.getState().logout();
    if (typeof window !== 'undefined') {
        window.location.href = '/login';
    }
};

// Extendemos la config de Axios para marcar reintentos
interface RetryConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const config = error.config as RetryConfig | undefined;

        // Solo actuar en 401 y si no estamos ya en las rutas de auth
        const isAuthRoute = config?.url?.startsWith('/auth/');
        if (error.response?.status !== 401 || isAuthRoute || config?._retry) {
            return Promise.reject(error);
        }

        // Si ya se está refrescando, encolar la petición y esperar
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                pendingQueue.push({
                    resolve: () => resolve(api(config!)),
                    reject,
                });
            });
        }

        config!._retry = true;
        isRefreshing = true;

        try {
            // Pedir nuevo access token usando el refresh token (cookie httpOnly)
            const { data } = await api.post('/auth/refresh');
            useAuthStore.getState().login(data.usuario);

            processPendingQueue(null);
            return api(config!); // reintentar la petición original
        } catch (refreshError) {
            processPendingQueue(refreshError);
            const isLoginPage = typeof window !== 'undefined'
                && window.location.pathname === '/login';
            if (!isLoginPage) {
                toast.error('Su sesión expiró. Por favor, ingrese de nuevo.');
                doLogout();
            }
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;
