"use client";

import Link from "next/link";
import { LogOut, Menu, User } from "lucide-react";
import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { NavContent } from "./Sidebar";
import { usePathname, useRouter } from "next/navigation";
import api from "@/utils/api";
import { useLogosConfig, obtenerRutaLogoDinamica } from "@/lib/logo-institucional";

export function Header() {
    const usuario = useAuthStore((state) => state.usuario);
    const logoutStore = useAuthStore((state) => state.logout);
    const pathname = usePathname();
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);
    const { logos: logosConfig } = useLogosConfig();

    const logout = async () => {
        try { await api.post("/auth/logout"); } catch { /* ignorar errores de red */ }
        logoutStore();
        router.push("/login");
    };

    if (!usuario) return null;

    const getInitials = (nombres?: string, apellidos?: string) => {
        const a = nombres?.[0] ?? '';
        const b = apellidos?.[0] ?? '';
        return (a + b).toUpperCase() || '??';
    };

    return (
        <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/85 backdrop-blur-md transition-all">
            <div className="flex h-16 items-center justify-between px-4 md:px-6">

            {/* LEFT */}
            <div className="flex items-center gap-3">
                {/* Mobile Menu Trigger */}
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden h-10 w-10 rounded-xl hover:bg-muted/60">
                            <Menu size={20} className="text-foreground" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-72 bg-sidebar border-sidebar-border h-full flex flex-col">
                        <SheetHeader className="sr-only">
                            <SheetTitle>Navegación Móvil</SheetTitle>
                        </SheetHeader>

                        <div className="p-6 h-20 flex items-center justify-center border-b border-sidebar-border/30 bg-black/5">
                            <img
                                src={obtenerRutaLogoDinamica("blanco", logosConfig)}
                                alt="Logo Blanco Unión"
                                className="h-8 w-auto object-contain"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <NavContent
                                isCollapsed={false}
                                pathname={pathname}
                                usuario={usuario}
                                onNavClick={() => setMobileOpen(false)}
                            />
                        </div>

                        <div className="p-4 border-t border-sidebar-border/30 bg-black/20">
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-rose-400 hover:bg-rose-500/10 h-11 rounded-xl transition-all"
                                onClick={() => { logout(); setMobileOpen(false); }}
                            >
                                <LogOut size={18} />
                                <span className="font-bold text-[11px] uppercase tracking-wider">Cerrar Sesión</span>
                            </Button>
                        </div>
                    </SheetContent>
                </Sheet>

                <div className="h-6 w-px bg-border/50 mx-1 md:hidden" />

                <h2 className="text-muted-foreground font-semibold text-[10px] md:text-[11px] uppercase tracking-widest hidden sm:block">
                    Panel de Control /
                    <span className="text-foreground ml-1 font-bold">Unión</span>
                </h2>

                <h2 className="text-foreground font-black text-xs uppercase tracking-tighter sm:hidden">
                    Unión
                </h2>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-5">

                <ThemeToggle />


                {/* 👤 USER SECTION */}
                <div className="flex items-center gap-4 border-l pl-5 border-border/50">

                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-foreground tracking-tight leading-none">
                            {usuario.nombres}
                        </p>
                        <Badge className="
          mt-1 
          text-[9px] 
          py-0 px-2 
          border border-primary/20 
          text-primary 
          bg-primary/10 
          font-semibold 
          uppercase tracking-wider
        ">
                            {usuario.rol}
                        </Badge>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="
              relative 
              h-10 w-10 
              rounded-full 
              p-0
              hover:bg-muted/60
              transition-all
            "
                            >
                                <Avatar className="
              h-10 w-10 
              border border-border/50 
              shadow-sm 
              transition-all 
              hover:scale-105
            ">
                                    <AvatarFallback className="
                bg-linear-to-br 
                from-primary 
                to-primary/70 
                text-white 
                font-semibold 
                text-xs
              ">
                                        {getInitials(usuario.nombres, usuario.apellidos)}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            align="end"
                            className="
            w-60 
            rounded-2xl 
            border border-border/50 
            bg-background/90 
            backdrop-blur-xl 
            shadow-2xl 
            p-2
            animate-in fade-in zoom-in-95
          "
                        >

                            <DropdownMenuLabel className="px-3 py-3">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-semibold text-foreground leading-none">
                                        {`${usuario.nombres} ${usuario.apellidos}`}
                                    </p>
                                    <p className="text-[11px] font-medium text-muted-foreground tracking-wide">
                                        @{usuario.username}
                                    </p>
                                </div>
                            </DropdownMenuLabel>

                            <DropdownMenuItem
                                asChild
                                className="
                  cursor-pointer 
                  rounded-xl 
                  px-3 py-2.5
                  text-sm
                  hover:bg-muted/50
                  transition-all
                "
                            >
                                <Link href="/dashboard/perfil" className="flex items-center gap-2 w-full">
                                    <User className="h-4 w-4" />
                                    Mi Perfil
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                onClick={logout}
                                className="
              cursor-pointer 
              rounded-xl 
              px-3 py-2.5
              text-sm
              text-rose-600 
              hover:bg-rose-500/10
              focus:bg-rose-500/10
              transition-all
            "
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Cerrar Sesión
                            </DropdownMenuItem>

                        </DropdownMenuContent>
                    </DropdownMenu>

                </div>
            </div>
            </div>
        </header>

    );
}
