"use client";

import {
    Edit2,
    Trash2,
    Search,
    UserPlus,
    MoreHorizontal,
    Phone,
    Calendar
} from "lucide-react";
import { dateUtils } from "@/utils/dateUtils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Persona } from "@/types/persona";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/useAuthStore";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pagination } from "@/components/shared/Pagination";

interface PersonasTableProps {
    personas: Persona[];
    onEdit: (persona: Persona) => void;
    onDelete: (id: number) => void;
    onReactivate: (id: number) => void;
    onSearch: (value: string) => void;
    onNew: () => void;
    isLoading: boolean;
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    onPageChange: (page: number) => void;
}

export function PersonasTable({
    personas,
    onEdit,
    onDelete,
    onSearch,
    onNew,
    isLoading,
    pagination,
    onPageChange
}: PersonasTableProps) {
    const usuario = useAuthStore((state) => state.usuario);
    const isAdmin = usuario?.rol_id === 1;

    return (
        <div className="space-y-4">

            <div className="std-table-container">
                <Table>
                    <TableHeader className="std-table-header">
                        <TableRow>
                            <TableHead className="std-table-head">DNI</TableHead>
                            <TableHead className="std-table-head">Ciudadano / Datos Personales</TableHead>
                            <TableHead className="std-table-head text-center">Sexo</TableHead>
                            <TableHead className="std-table-head text-center">F. Nacimiento</TableHead>
                            <TableHead className="std-table-head text-right">Contacto</TableHead>
                            <TableHead className="std-table-head text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={6} className="h-16 animate-pulse bg-muted/20" />
                                </TableRow>
                            ))
                        ) : personas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground font-medium">
                                    No se encontraron ciudadanos registrados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            personas.map((persona) => (
                                <TableRow key={persona.id} className="std-table-row">
                                    <TableCell className="std-table-cell">
                                        <div className="flex flex-col gap-1">
                                            {persona.tipo_documento && (
                                                <Badge variant="outline" className="w-fit text-[9px] font-black h-4 px-1 bg-primary/5 text-primary border-primary/20">
                                                    {persona.tipo_documento}
                                                </Badge>
                                            )}
                                            {persona.dni ? (
                                                <span className="data-console font-medium text-xs tracking-tight">{persona.dni}</span>
                                            ) : (
                                                <span className="text-muted-foreground/40 font-medium italic text-[10px] uppercase tracking-wide">Sin Número</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="std-table-cell">
                                        <div className="flex flex-col">
                                            <span className="text-foreground/90 font-medium tracking-tight">
                                                {persona.apellido_paterno} {persona.apellido_materno}, {persona.nombres}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                                Ref: #{persona.id}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="std-table-cell text-center">
                                        <Badge
                                            variant={persona.sexo === 'M' ? 'info' : 'outline'}
                                            className={persona.sexo === 'F' ? 'border-pink-200 text-pink-600 bg-pink-500/10 dark:border-pink-500/30 dark:text-pink-400' : ''}
                                        >
                                            {persona.sexo}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="std-table-cell text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs text-foreground/80">
                                                {dateUtils.formatDisplayDate(persona.fecha_nacimiento)}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="std-table-cell text-right">
                                        {persona.telefono ? (
                                            <div className="flex items-center justify-end gap-2 text-foreground/80">
                                                <span className="text-xs font-medium">{persona.telefono}</span>
                                                <Phone size={12} className="text-muted-foreground/40" />
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-medium text-muted-foreground/30 uppercase italic tracking-wide">N/A</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="std-table-cell text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted rounded-full">
                                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-xl border-border p-1">
                                                <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 py-2">Opciones</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => onEdit(persona)} className="cursor-pointer font-medium gap-2 py-2.5 rounded-lg text-xs">
                                                    <Edit2 className="icon-std" /> Editar Ciudadano
                                                </DropdownMenuItem>
                                                {isAdmin && (
                                                    <>
                                                        <DropdownMenuSeparator className="my-1" />
                                                        <DropdownMenuItem
                                                            onClick={() => onDelete(persona.id)}
                                                            className="text-rose-600 cursor-pointer font-medium gap-2 py-2.5 rounded-lg text-xs"
                                                        >
                                                            <Trash2 className="h-4 w-4" /> Eliminar Registro
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
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
                label="ciudadanos"
            />
        </div>
    );
}
