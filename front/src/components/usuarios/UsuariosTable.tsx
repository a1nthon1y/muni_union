"use client";

import {
    User,
    Shield,
    Phone,
    Power,
    Edit,
    Trash2,
    MoreHorizontal,
    ShieldCheck
} from "lucide-react";
import { es } from "date-fns/locale";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Usuario } from "@/types/auth";
import { Pagination } from "@/components/shared/Pagination";
import { etiquetaRol } from "@/lib/roles";

interface UsuariosTableProps {
    usuarios: Usuario[];
    isLoading: boolean;
    onEdit: (usuario: Usuario) => void;
    onDelete: (id: number) => void;
    onToggleStatus: (id: number, active: boolean) => void;
    onPermisos: (usuario: Usuario) => void;
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    onPageChange: (page: number) => void;
}

export function UsuariosTable({
    usuarios,
    isLoading,
    onEdit,
    onDelete,
    onToggleStatus,
    onPermisos,
    pagination,
    onPageChange
}: UsuariosTableProps) {

    const getRolBadge = (rol: string, rolId: number) => {
        const label = etiquetaRol(rolId, rol);
        const isAdm = rolId === 1;
        const isConsultaRol = rolId === 3;
        return (
            <Badge
                variant={isAdm ? 'default' : 'outline'}
                className={`gap-1.5 shadow-sm ${isConsultaRol ? 'border-sky-300 text-sky-700 bg-sky-50 dark:border-sky-700 dark:text-sky-300 dark:bg-sky-950/30' : ''}`}
            >
                <Shield className="h-3 w-3" /> {label}
            </Badge>
        );
    };

    return (
        <div className="space-y-4 pt-1">

            <div className="std-table-container">
                <Table>
                    <TableHeader className="std-table-header">
                        <TableRow>
                            <TableHead className="std-table-head">Usuario / Rol</TableHead>
                            <TableHead className="std-table-head">Nombres y Apellidos</TableHead>
                            <TableHead className="std-table-head">Contacto</TableHead>
                            <TableHead className="std-table-head">Estado</TableHead>
                            <TableHead className="std-table-head text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={5} className="h-16 animate-pulse bg-muted/20" />
                                </TableRow>
                            ))
                        ) : usuarios.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-40 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                                        <User size={40} strokeWidth={1} />
                                        <p className="font-medium">No se encontraron usuarios.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            usuarios.map((u) => (
                                <TableRow key={u.id} className="std-table-row">
                                    <TableCell className="std-table-cell">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-foreground font-semibold">
                                                {u.username}
                                            </span>
                                            {getRolBadge(u.rol, u.rol_id)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="std-table-cell">
                                        <div className="flex flex-col">
                                            <span className="text-foreground tracking-tight py-0.5">
                                                {u.nombres} {u.apellidos}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">
                                                    {u.dni || "SIN DOCUMENTO"}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground/30">•</span>
                                                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1.5">
                                                    Registrado
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="std-table-cell">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs text-muted-foreground flex items-center gap-2">
                                                <Phone className="h-3 w-3 text-muted-foreground/50" /> {u.telefono || "Sin teléfono"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="std-table-cell">
                                        <Badge variant={u.activo ? "success" : "error"}>
                                            {u.activo ? "Activo" : "Inactivo"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="std-table-cell text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted rounded-full">
                                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-border p-1">
                                                <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">Opciones</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => onEdit(u)} className="cursor-pointer font-medium gap-2 py-2 rounded-lg text-xs">
                                                    <Edit className="icon-std" /> Editar Perfil
                                                </DropdownMenuItem>
                                                {u.rol_id === 2 && (
                                                    <DropdownMenuItem onClick={() => onPermisos(u)} className="cursor-pointer font-bold gap-2 py-2 rounded-lg text-xs text-primary">
                                                        <ShieldCheck className="h-4 w-4" /> Configurar Permisos
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onClick={() => onToggleStatus(u.id, !u.activo)} className={`cursor-pointer font-bold gap-2 py-2 rounded-lg text-xs ${u.activo ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                    <Power className="h-4 w-4" /> {u.activo ? 'Desactivar Acceso' : 'Activar Acceso'}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="my-1" />
                                                <DropdownMenuItem onClick={() => onDelete(u.id)} className="text-rose-600 cursor-pointer font-bold gap-2 py-2 rounded-lg text-xs">
                                                    <Trash2 className="h-4 w-4" /> Eliminar Usuario
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Pagination
                total={pagination.total}
                page={pagination.page}
                limit={pagination.limit}
                totalPages={pagination.totalPages}
                onPageChange={onPageChange}
                label="usuarios"
            />
        </div>
    );
}
