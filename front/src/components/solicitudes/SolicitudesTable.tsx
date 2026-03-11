"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    MoreHorizontal,
    Eye,
    CheckCircle2,
    Ban,
    Calendar,
    User,
    FileText,
    Search,
    Filter,
    Trash2
} from "lucide-react";
import { Solicitud, EstadoSolicitud } from "@/types/solicitud";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { dateUtils } from "@/utils/dateUtils";
import { Input } from "@/components/ui/input";
import { useState } from "react";

import { Pagination } from "@/components/shared/Pagination";

interface SolicitudesTableProps {
    solicitudes: Solicitud[];
    isLoading: boolean;
    onView: (solicitud: Solicitud) => void;
    onAtender: (solicitud: Solicitud) => void;
    onAnular: (solicitud: Solicitud) => void;
    onDelete: (solicitud: Solicitud) => void;
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    onPageChange: (page: number) => void;
}

export function SolicitudesTable({
    solicitudes,
    isLoading,
    onView,
    onAtender,
    onAnular,
    onDelete,
    pagination,
    onPageChange
}: SolicitudesTableProps) {


    const getStatusBadge = (estado: EstadoSolicitud) => {
        switch (estado) {
            case 'PENDIENTE':
                return <Badge variant="warning">PENDIENTE</Badge>;
            case 'ATENDIDO':
                return <Badge variant="success">ATENDIDO</Badge>;
            case 'ANULADO':
                return <Badge variant="error">ANULADO</Badge>;
            default:
                return <Badge variant="outline">{estado}</Badge>;
        }
    };

    return (
        <div className="space-y-4">

            <div className="std-table-container">
                <Table>
                    <TableHeader className="std-table-header">
                        <TableRow>
                            <TableHead className="std-table-head">N° Trámite</TableHead>
                            <TableHead className="std-table-head">DNI / Solicitante</TableHead>
                            <TableHead className="std-table-head">Tipo de Tramite</TableHead>
                            <TableHead className="std-table-head">Fecha Solicitud</TableHead>
                            <TableHead className="std-table-head">Estado</TableHead>
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
                        ) : solicitudes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground font-medium">
                                    No se encontraron solicitudes.
                                </TableCell>
                            </TableRow>
                        ) : (
                            solicitudes.map((solicitud: Solicitud) => (
                                <TableRow key={solicitud.id} className="std-table-row">
                                    <TableCell className="std-table-cell">
                                        <span className="data-console">
                                            #{solicitud.id.toString().padStart(6, '0')}
                                        </span>
                                    </TableCell>
                                    <TableCell className="std-table-cell">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-muted-foreground font-semibold tracking-wider uppercase leading-none mb-1">{solicitud.solicitante_dni}</span>
                                            <span className="text-foreground tracking-tight py-0.5">
                                                {solicitud.solicitante_apellidos}, {solicitud.solicitante_nombres}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="std-table-cell">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-3.5 w-3.5 text-primary" />
                                            <span className="uppercase text-xs text-foreground/70">{solicitud.tipo_solicitud}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="std-table-cell">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Calendar className="h-3.5 w-3.5 text-muted-foreground/50" />
                                                <span className="text-xs">
                                                    {dateUtils.formatDisplayTimestamp(solicitud.fecha_solicitud).split(' ')[0]}
                                                </span>
                                            </div>
                                            {solicitud.estado === 'ATENDIDO' && solicitud.fecha_atencion && (
                                                <div className="flex items-center gap-1.5 text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md w-fit border border-emerald-100 dark:border-emerald-900/30 uppercase tracking-wide">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Atendido: {dateUtils.formatDisplayTimestamp(solicitud.fecha_atencion).split(' ')[0]}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="std-table-cell text-xs">
                                        {getStatusBadge(solicitud.estado)}
                                    </TableCell>
                                    <TableCell className="std-table-cell text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted rounded-full">
                                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-xl border-border p-1">
                                                <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">Opciones</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => onView(solicitud)} className="cursor-pointer font-medium gap-2 py-2 rounded-lg text-xs">
                                                    <Eye className="icon-std" /> Ver Detalles
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="my-1" />
                                                {solicitud.estado === 'PENDIENTE' && (
                                                    <DropdownMenuItem
                                                        onClick={() => onAtender(solicitud)}
                                                        className="text-emerald-600 cursor-pointer font-bold gap-2 py-2 rounded-lg text-xs"
                                                    >
                                                        <CheckCircle2 className="h-4 w-4" /> Atender Solicitud
                                                    </DropdownMenuItem>
                                                )}
                                                {solicitud.estado !== 'ANULADO' && (
                                                    <DropdownMenuItem
                                                        onClick={() => onAnular(solicitud)}
                                                        className="text-amber-600 cursor-pointer font-bold gap-2 py-2 rounded-lg text-xs"
                                                    >
                                                        <Ban className="h-4 w-4" /> Anular Trámite
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator className="my-1" />
                                                <DropdownMenuItem
                                                    onClick={() => onDelete(solicitud)}
                                                    className="text-rose-600 cursor-pointer font-bold gap-2 py-2 rounded-lg text-xs"
                                                >
                                                    <Trash2 className="h-4 w-4" /> Eliminar Registro
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
                label="trámites"
            />
        </div>
    );
}
