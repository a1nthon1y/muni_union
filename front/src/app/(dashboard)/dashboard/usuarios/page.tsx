"use client";

import { useEffect, useState } from "react";
import {
    Users,
    UserPlus,
    RefreshCw,
    ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usuariosService } from "@/services/usuarios.service";
import { UsuariosTable } from "@/components/usuarios/UsuariosTable";
import { UsuarioSheet } from "@/components/usuarios/UsuarioSheet";
import { PermisosDialog } from "@/components/usuarios/PermisosDialog";
import { Usuario } from "@/types/auth";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Search, Loader2 } from "lucide-react";

export default function UsuariosPage() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
    const [isPermisosOpen, setIsPermisosOpen] = useState(false);
    const [permisosUsuario, setPermisosUsuario] = useState<Usuario | null>(null);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
    });
    const [searchTerm, setSearchTerm] = useState("");

    const currentUser = useAuthStore((state) => state.usuario);
    const router = useRouter();

    // Seguridad: Solo Admins
    useEffect(() => {
        if (currentUser && currentUser.rol_id !== 1) {
            toast.error("No tiene permisos para acceder a esta sección");
            router.push("/dashboard");
        }
    }, [currentUser]);

    const fetchUsuarios = async (p?: number, q?: string) => {
        setIsLoading(true);
        const targetPage = p || pagination.page;
        const query = q !== undefined ? q : searchTerm;
        try {
            const response = await usuariosService.listar({
                page: targetPage,
                limit: pagination.limit,
                q: query
            });
            setUsuarios(response.data);
            setPagination({
                ...pagination,
                total: response.total,
                page: targetPage,
                totalPages: Math.ceil(response.total / pagination.limit)
            });
        } catch (error) {
            toast.error("Error al cargar usuarios");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageChange = (page: number) => {
        fetchUsuarios(page);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsuarios(1, searchTerm);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleCreate = () => {
        setEditingUsuario(null);
        setIsSheetOpen(true);
    };

    const handleEdit = (usuario: Usuario) => {
        setEditingUsuario(usuario);
        setIsSheetOpen(true);
    };

    const handlePermisos = (usuario: Usuario) => {
        setPermisosUsuario(usuario);
        setIsPermisosOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (id === currentUser?.id) {
            return toast.error("No puedes eliminar tu propio usuario");
        }

        if (!confirm("¿Está seguro de eliminar este usuario?")) return;

        try {
            await usuariosService.eliminar(id);
            toast.success("Usuario eliminado");
            fetchUsuarios();
        } catch (error) {
            toast.error("Error al eliminar usuario");
        }
    };

    const handleToggleStatus = async (id: number, active: boolean) => {
        if (id === currentUser?.id) {
            return toast.error("No puedes desactivar tu propio usuario");
        }

        try {
            await usuariosService.cambiarEstado(id, active);
            toast.success("Estado actualizado");
            fetchUsuarios();
        } catch (error) {
            toast.error("Error al actualizar estado");
        }
    };

    const handleFormSubmit = async (values: any) => {
        if (editingUsuario) {
            await usuariosService.actualizar(editingUsuario.id, values);
        } else {
            await usuariosService.crear(values);
        }
    };

    if (currentUser?.rol_id !== 1) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center text-center p-6">
                <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center mb-4 border border-red-100 shadow-sm">
                    <ShieldAlert className="h-10 w-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Acceso Restringido</h2>
                <p className="text-slate-500 max-w-sm mt-2 font-medium">Solo los administradores pueden gestionar las cuentas de usuario del sistema.</p>
                <Button variant="outline" className="mt-6 font-semibold" onClick={() => router.push("/dashboard")}>
                    Volver al Dashboard
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 text-foreground">
                        <div className="bg-primary p-2.5 rounded-xl shadow-primary/20 shadow-lg">
                            <Users className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Gestión de Usuarios</h1>
                    </div>
                    <p className="text-muted-foreground font-medium text-xs ml-1">
                        Administración de accesos y roles del equipo institucional.
                    </p>
                </div>

                <Button
                    onClick={handleCreate}
                    className="h-12 px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-white font-bold text-xs rounded-2xl transition-all active:scale-95 flex items-center gap-2"
                >
                    <UserPlus className="h-5 w-5" />
                    NUEVO USUARIO
                </Button>
            </div>

            {/* HERRAMIENTAS DE TABLA: FILTRO BUSCADOR */}
            <div className="flex flex-col xl:flex-row gap-4 items-center">
                <div className="flex-1 flex items-center gap-3 bg-card h-[70px] px-5 rounded-2xl border border-border shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-std text-slate-400" />
                        <Input
                            placeholder="Buscar por DNI, usuario o nombres..."
                            className="pl-9 std-input border-none bg-transparent focus-visible:ring-0 h-11 w-full font-semibold"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <Separator orientation="vertical" className="h-8 mx-1 opacity-50" />

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-slate-400 hover:text-primary hover:bg-primary/5 shrink-0"
                        onClick={() => setSearchTerm("")}
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <UsuariosTable
                usuarios={usuarios}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                onPermisos={handlePermisos}
                pagination={pagination}
                onPageChange={handlePageChange}
            />

            {/* Form Sheet */}
            <UsuarioSheet
                key={editingUsuario ? `user-edit-${editingUsuario.id}` : 'user-new'}
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                usuario={editingUsuario}
                onSuccess={fetchUsuarios}
                onSubmit={handleFormSubmit}
            />

            {/* Permisos Dialog */}
            <PermisosDialog
                open={isPermisosOpen}
                onOpenChange={setIsPermisosOpen}
                usuario={permisosUsuario}
                onSuccess={fetchUsuarios}
            />
        </div>
    );
}
