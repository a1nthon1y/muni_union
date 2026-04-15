"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2 } from "lucide-react";
import api from "@/utils/api";

const rolePermissions: Record<string, number[]> = {
    "/dashboard/usuarios": [1],
    "/dashboard/auditoria": [1],
};

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, usuario, login, logout } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            if (isAuthenticated && usuario) {
                // Ya tenemos usuario en sessionStorage — verificar permisos de ruta
                const requiredRoles = rolePermissions[pathname];
                if (requiredRoles && !requiredRoles.includes(usuario.rol_id)) {
                    router.push("/dashboard");
                }
                setIsChecking(false);
                return;
            }

            // No hay sesión local — preguntar al servidor si la cookie sigue válida
            try {
                const { data } = await api.get("/auth/me");
                login(data.usuario);

                const requiredRoles = rolePermissions[pathname];
                if (requiredRoles && !requiredRoles.includes(data.usuario.rol_id)) {
                    router.push("/dashboard");
                }
            } catch {
                logout();
                router.push("/login");
            } finally {
                setIsChecking(false);
            }
        };

        checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    // Redirigir a /login cuando no está autenticado (dentro de useEffect — regla de React)
    useEffect(() => {
        if (!isChecking && !isAuthenticated) {
            router.push("/login");
        }
    }, [isChecking, isAuthenticated, router]);

    if (isChecking) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-background text-foreground">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="font-medium animate-pulse text-muted-foreground">Verificando sesión...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return <>{children}</>;
}
