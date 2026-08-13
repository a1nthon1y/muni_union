"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2 } from "lucide-react";
import api from "@/utils/api";
import { isConsulta, rutaBloqueadaParaConsulta } from "@/lib/roles";

const rolePermissions: Record<string, number[]> = {
    "/dashboard/usuarios": [1],
    "/dashboard/auditoria": [1],
    "/dashboard/backup": [1],
    "/dashboard/configuracion": [1],
};

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, usuario, login, logout } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            if (isAuthenticated && usuario) {
                if (isConsulta(usuario.rol_id) && rutaBloqueadaParaConsulta(pathname)) {
                    router.push("/dashboard/personas");
                    setIsChecking(false);
                    return;
                }
                const requiredRoles = rolePermissions[pathname];
                if (requiredRoles && !requiredRoles.includes(usuario.rol_id)) {
                    router.push("/dashboard");
                }
                setIsChecking(false);
                return;
            }

            try {
                const { data } = await api.get("/auth/me");
                login(data.usuario);

                if (isConsulta(data.usuario.rol_id) && rutaBloqueadaParaConsulta(pathname)) {
                    router.push("/dashboard/personas");
                    setIsChecking(false);
                    return;
                }

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
