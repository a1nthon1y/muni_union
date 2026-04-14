import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthState, Usuario } from '@/types/auth';

// El JWT viaja en cookie httpOnly (invisible para JS).
// Solo guardamos info del usuario en sessionStorage para mostrar nombre/rol.
// Si el token expira, el server devuelve 401 y el interceptor de axios hace logout.
export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            usuario: null,
            isAuthenticated: false,
            login: (usuario: Usuario) =>
                set({ usuario, isAuthenticated: true }),
            logout: () =>
                set({ usuario: null, isAuthenticated: false }),
        }),
        {
            name: 'auth-user',
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);
