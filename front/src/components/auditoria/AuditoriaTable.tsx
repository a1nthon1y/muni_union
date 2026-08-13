"use client";

import { Auditoria } from "@/types/auditoria";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { dateUtils } from "@/utils/dateUtils";
import { cn } from "@/lib/utils";
import {
    Activity,
    Database,
    User,
    Globe,
    FileText,
    Plus,
    Edit3,
    Trash,
    ShieldCheck,
    RefreshCcw,
    AlertCircle,
    Server,
    Fingerprint,
    Search,
    Calendar,
    ArrowUpRight
} from "lucide-react";
import { Pagination } from "@/components/shared/Pagination";

interface AuditoriaTableProps {
    logs: Auditoria[];
    isLoading: boolean;
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    onPageChange: (page: number) => void;
}

export function AuditoriaTable({ logs, isLoading, pagination, onPageChange }: AuditoriaTableProps) {
    const getOperacionStyles = (op: string) => {
        switch (op) {
            case 'INSERT':
                return {
                    label: 'Creación',
                    icon: <Plus className="h-3 w-3" />,
                    variant: 'success' as const
                };
            case 'UPDATE':
                return {
                    label: 'Modificación',
                    icon: <Edit3 className="h-3 w-3" />,
                    variant: 'info' as const
                };
            case 'DELETE':
            case 'DELETE_LOGIC':
                return {
                    label: 'Eliminación',
                    icon: <Trash className="h-3 w-3" />,
                    variant: 'error' as const
                };
            case 'UPDATE_STATUS':
                return {
                    label: 'Estado',
                    icon: <RefreshCcw className="h-3 w-3" />,
                    variant: 'warning' as const
                };
            case 'ANULAR':
                return {
                    label: 'Anulación',
                    icon: <AlertCircle className="h-3 w-3" />,
                    variant: 'warning' as const
                };
            case 'UPDATE_PASSWORD':
                return {
                    label: 'Seguridad',
                    icon: <ShieldCheck className="h-3 w-3" />,
                    variant: 'info' as const
                };
            case 'REEMPLAZAR_DOC':
            case 'REPLACE':
                return {
                    label: 'Reemplazo',
                    icon: <RefreshCcw className="h-3 w-3" />,
                    variant: 'info' as const
                };
            case 'ELIMINAR_DOC':
                return {
                    label: 'Doc. Borrado',
                    icon: <Trash className="h-3 w-3" />,
                    variant: 'error' as const
                };
            case 'UPLOAD':
                return {
                    label: 'Carga Doc.',
                    icon: <Plus className="h-3 w-3" />,
                    variant: 'success' as const
                };
            case 'MERGE':
                return {
                    label: 'Fusión',
                    icon: <RefreshCcw className="h-3 w-3" />,
                    variant: 'warning' as const
                };
            default:
                return {
                    label: op,
                    icon: <Activity className="h-3 w-3" />,
                    variant: 'outline' as const
                };
        }
    };

    const getTablaIcon = (tabla: string) => {
        switch (tabla) {
            case 'actas':
                return <FileText className="h-3.5 w-3.5" />;
            case 'usuarios':
                return <User className="h-3.5 w-3.5" />;
            case 'personas':
                return <Activity className="h-3.5 w-3.5" />;
            default:
                return <Database className="h-3.5 w-3.5" />;
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-700">
            <div className="std-table-container">
                <Table className="table-fixed">
                    <TableHeader className="std-table-header">
                        <TableRow className="border-b border-border/50">
                            <TableHead className="std-table-head w-[11%]">Tipo de Evento</TableHead>
                            <TableHead className="std-table-head w-[14%]">Responsable</TableHead>
                            <TableHead className="std-table-head w-[34%]">Descripción de Actividad</TableHead>
                            <TableHead className="std-table-head w-[15%]">Referencia / Módulo</TableHead>
                            <TableHead className="std-table-head w-[13%]">Cronología</TableHead>
                            <TableHead className="std-table-head w-[13%] text-right">Dirección IP</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <TableRow key={i} className="std-table-row">
                                    <TableCell colSpan={6} className="h-20 animate-pulse bg-muted/10" />
                                </TableRow>
                            ))
                        ) : logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-60 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-4">
                                        <div className="bg-muted/30 p-4 rounded-full">
                                            <Activity size={48} strokeWidth={1} className="opacity-20" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-bold text-sm uppercase tracking-[0.2em]">Sin Actividad Detectada</p>
                                            <p className="text-[10px] uppercase tracking-widest opacity-50">No hay registros para los filtros seleccionados</p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => {
                                const op = getOperacionStyles(log.operacion);
                                return (
                                    <TableRow key={log.id} className="std-table-row group">
                                        <TableCell className="std-table-cell align-top">
                                            <div className="flex flex-col gap-2">
                                                <Badge
                                                    variant={op.variant}
                                                    className="gap-1.5 px-3 py-1 rounded-full shadow-sm"
                                                >
                                                    {op.icon}
                                                    <span className="text-[10px] font-black uppercase tracking-wider">
                                                        {op.label}
                                                    </span>
                                                </Badge>
                                                <span className="font-mono text-[9px] text-muted-foreground/40 font-bold uppercase tracking-tighter px-1">
                                                    LOG-ID: #{log.id}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="std-table-cell align-top">
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                                    <User size={14} className="text-primary" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-foreground font-bold tracking-tight text-xs">
                                                        {log.username || 'SISTEMA'}
                                                    </span>
                                                    <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">Admin Central</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="std-table-cell align-top !whitespace-normal min-w-0">
                                            <p
                                                className="text-[11px] text-foreground/75 leading-relaxed font-medium break-words [overflow-wrap:anywhere]"
                                                title={log.descripcion || undefined}
                                            >
                                                {log.descripcion}
                                            </p>
                                        </TableCell>
                                        <TableCell className="std-table-cell align-top">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2 bg-secondary/50 text-secondary-foreground px-2.5 py-1 rounded-lg border border-border w-fit transition-all group-hover:border-primary/30">
                                                    <div className="text-primary/70">{getTablaIcon(log.tabla_afectada)}</div>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.1em]">
                                                        {log.tabla_afectada}
                                                    </span>
                                                </div>
                                                {log.registro_id && (
                                                    <Badge variant="outline" className="text-[9px] font-bold text-muted-foreground/40 border-dashed border-muted w-fit h-5">
                                                        REF: {log.registro_id}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="std-table-cell align-top">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-foreground/80 font-bold tracking-tight">
                                                    {dateUtils.formatDisplayTimestamp(log.fecha).split(' ')[0]}
                                                </span>
                                                <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest mt-0.5">
                                                    {dateUtils.formatDisplayTimestamp(log.fecha).split(' ')[1]}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="std-table-cell text-right align-top">
                                            <div className="flex items-center justify-end gap-2 text-[10px] font-bold text-muted-foreground group-hover:text-primary transition-colors">
                                                <Globe size={11} className="opacity-30" />
                                                <span className="font-mono tracking-tighter">{log.ip || 'INTERNAL'}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
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
                label="eventos"
            />
        </div>
    );
}
