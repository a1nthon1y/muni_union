"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    FileText,
    Home,
    Users,
    ClipboardList,
    Activity,
    UserCircle2,
    LogOut,
    ChevronLeft,
    ChevronRight,
    LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Usuario } from "@/types/auth";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";

interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    roles: number[];
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

const navGroups: NavGroup[] = [
    {
        title: "Principal",
        items: [
            { label: "Dashboard", href: "/dashboard", icon: Home, roles: [1, 2] },
        ]
    },
    {
        title: "Operaciones",
        items: [
            { label: "Digitalización", href: "/dashboard/digitalizacion", icon: FileText, roles: [1, 2] },
            { label: "Personas", href: "/dashboard/personas", icon: Users, roles: [1, 2] },
            { label: "Actas", href: "/dashboard/actas", icon: FileText, roles: [1, 2] },
            { label: "Solicitudes", href: "/dashboard/solicitudes", icon: ClipboardList, roles: [1, 2] },
        ]
    },
    {
        title: "Sistema",
        items: [
            { label: "Usuarios", href: "/dashboard/usuarios", icon: UserCircle2, roles: [1] },
            { label: "Auditoría", href: "/dashboard/auditoria", icon: Activity, roles: [1] },
        ]
    }
];

export function NavContent({ isCollapsed, pathname, usuario, onNavClick }: {
    isCollapsed: boolean;
    pathname: string;
    usuario: Usuario;
    onNavClick?: () => void;
}) {
    return (
        <div className="flex-1 overflow-y-auto overflow-x-hidden pt-6 pb-2 custom-scrollbar">
            {navGroups.map((group, idx) => {
                const filteredItems = group.items.filter(item => item.roles.includes(usuario.rol_id));
                if (filteredItems.length === 0) return null;

                return (
                    <div key={group.title} className={cn("mb-8 px-4", idx === 0 && "mt-2")}>
                        {!isCollapsed && (
                            <h3 className="text-[10px] font-bold text-sidebar-foreground/30 uppercase tracking-[0.2em] px-3 mb-4 last:mb-0">
                                {group.title}
                            </h3>
                        )}
                        <div className="space-y-1.5">
                            {filteredItems.map((item) => {
                                const isActive = pathname === item.href;
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onNavClick}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative",
                                            isActive
                                                ? "bg-primary text-white shadow-lg shadow-primary/30 active:scale-95"
                                                : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-white"
                                        )}
                                    >
                                        <Icon
                                            size={18}
                                            className={cn(
                                                "transition-all duration-300",
                                                isActive ? "text-white scale-110" : "group-hover:text-primary group-hover:scale-110"
                                            )}
                                        />
                                        {!isCollapsed && (
                                            <span className={cn(
                                                "font-semibold text-xs transition-all duration-300",
                                                isActive ? "translate-x-0.5" : "group-hover:translate-x-0.5"
                                            )}>
                                                {item.label}
                                            </span>
                                        )}
                                        {isCollapsed && isActive && (
                                            <div className="absolute left-[-10px] w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export function Sidebar() {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const usuario = useAuthStore((state) => state.usuario);
    const logout = useAuthStore((state) => state.logout);

    // Auto-colapso inteligente basado en el tamaño de pantalla
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 1024) {
                setIsCollapsed(true);
            } else {
                setIsCollapsed(false);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!usuario) return null;

    return (
        <aside
            className={cn(
                "bg-sidebar sticky top-0 h-screen text-sidebar-foreground transition-all duration-300 hidden md:flex flex-col border-r border-sidebar-border shadow-2xl z-50 shrink-0",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            {/* Logo Section */}
            <div className="p-6 h-20 flex items-center justify-center border-b border-sidebar-border/30 bg-black/5 overflow-hidden">
                {!isCollapsed && (
                    <div className="flex items-center justify-center animate-in fade-in slide-in-from-left-2 duration-300 w-full px-2">
                        <Image
                            src="/Logo_blanco.svg"
                            alt="Logo Blanco Unión"
                            width={120}
                            height={40}
                            className="h-10 w-auto object-contain"
                        />
                    </div>
                )}
                {isCollapsed && (
                    <div className="flex items-center justify-center animate-in fade-in zoom-in duration-300">
                        <Image
                            src="/Logo_blanco.svg"
                            alt="Logo Blanco Unión"
                            width={40}
                            height={24}
                            className="h-6 w-auto object-contain"
                        />
                    </div>
                )}
            </div>

            {/* Navigation Items */}
            <div className="flex-1 relative flex flex-col min-h-0">
                {/* Botón de Ajuste Universal */}
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "absolute top-8 h-7 w-7 rounded-full bg-primary text-white shadow-xl border-2 border-background hover:bg-primary-hover hover:scale-110 transition-all z-70",
                        isCollapsed ? "-right-3.5" : "-right-3.5"
                    )}
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </Button>

                <NavContent
                    isCollapsed={isCollapsed}
                    pathname={pathname}
                    usuario={usuario}
                />
            </div>

            {/* User Profile / Logout Section */}
            <div className="p-4 border-t border-sidebar-border/30 bg-black/20">
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full justify-start gap-4 text-sidebar-foreground/70 hover:text-rose-400 hover:bg-rose-500/10 h-12 rounded-xl transition-all group",
                        isCollapsed && "justify-center"
                    )}
                    onClick={logout}
                >
                    <LogOut size={18} className="transition-transform group-hover:-translate-x-0.5" />
                    {!isCollapsed && <span className="font-bold text-[11px] uppercase tracking-wider">Cerrar Sesión</span>}
                </Button>
            </div>
        </aside>
    );
}
