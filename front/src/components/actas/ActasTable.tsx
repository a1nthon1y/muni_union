"use client";

import {
    FileText,
    Search,
    Eye,
    Edit,
    Trash2,
    MoreHorizontal,
    Paperclip,
    RefreshCw,
    Download,
    FileSpreadsheet,
    FileDown,
    Cross,
    Baby,
    Heart,
    Ban,
    RotateCcw
} from "lucide-react";
import { Pagination } from "@/components/shared/Pagination";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { reportesService } from "@/services/reportes.service";
import type { ActasFilters } from "@/services/actas.service";
import { dateUtils } from "@/utils/dateUtils";
import { Loader2 } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Acta } from "@/types/acta";
import { useAuthStore } from "@/store/useAuthStore";
import { isAdmin, isConsulta, isOperador } from "@/lib/roles";

interface ActasTableProps {
    actas: Acta[];
    isLoading: boolean;
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    onPageChange: (page: number) => void;
    onView: (acta: Acta) => void;
    onEdit?: (acta: Acta) => void;
    onDelete: (id: number) => void;
    onAnular?: (acta: Acta) => void;
    onReactivar?: (acta: Acta) => void;
    onUploadDoc?: (acta: Acta) => void;
    onDeleteDoc?: (acta: Acta) => void;
    onViewDoc?: (acta: Acta) => void;
    onDownloadDoc?: (acta: Acta) => void;
    onSearch: (filtros: Partial<ActasFilters>) => void;
}

export function ActasTable({
    actas,
    isLoading,
    pagination,
    onPageChange,
    onView,
    onEdit,
    onDelete,
    onAnular,
    onReactivar,
    onUploadDoc,
    onViewDoc,
    onDownloadDoc,
    onSearch
}: ActasTableProps) {
    const usuario = useAuthStore((state) => state.usuario);
    const soloConsulta = isConsulta(usuario?.rol_id);
    const isAdminUser  = isAdmin(usuario?.rol_id);
    const canImportar  = isOperador(usuario?.rol_id);
    const canModificar = !soloConsulta && (isAdminUser || (usuario?.permisos?.actas_modificar !== false));
    const canAnular    = !soloConsulta && (isAdminUser || !!usuario?.permisos?.actas_anular);
    const canEliminar  = !soloConsulta && (isAdminUser || !!usuario?.permisos?.actas_eliminar);

    // Helper para manejar boolean de PostgreSQL - Verificamos el campo correcto en 'Acta'
    const hasDoc = (acta: Acta) => !!acta.tiene_documento;

    const [searchTerm, setSearchTerm] = useState("");
    const [searchNumero, setSearchNumero] = useState("");
    const [searchLibro, setSearchLibro] = useState("");
    const [searchAnio, setSearchAnio] = useState("");
    const [searchTipo, setSearchTipo] = useState("TODOS");
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");
    const [exporting, setExporting] = useState(false);

    const debouncedSearch = useDebounce(searchTerm, 500);
    const debouncedNumero = useDebounce(searchNumero, 500);
    const debouncedLibro = useDebounce(searchLibro, 500);
    const debouncedAnio = useDebounce(searchAnio, 500);

    const handleExport = async () => {
        setExporting(true);
        const filters = {
            tipo: searchTipo !== "TODOS" ? searchTipo : "",
            anio: searchAnio,
            numero: searchNumero,
            libro: searchLibro,
            q: searchTerm,
            fecha_desde: fechaDesde,
            fecha_hasta: fechaHasta,
        };

        const toastId = toast.loading("Generando Excel de actas...");
        try {
            await reportesService.exportActas(filters);
            await new Promise(resolve => setTimeout(resolve, 1500));
            toast.success("Descarga lista", { id: toastId });
        } catch {
            toast.error("Error al generar el reporte", { id: toastId });
        } finally {
            setExporting(false);
        }
    };

    useEffect(() => { onSearch({ q: debouncedSearch }); }, [debouncedSearch, onSearch]);
    useEffect(() => { onSearch({ numero: debouncedNumero }); }, [debouncedNumero, onSearch]);
    useEffect(() => { onSearch({ libro: debouncedLibro }); }, [debouncedLibro, onSearch]);
    useEffect(() => { onSearch({ anio: debouncedAnio }); }, [debouncedAnio, onSearch]);
    useEffect(() => { onSearch({ tipo: searchTipo === "TODOS" ? "" : searchTipo }); }, [searchTipo, onSearch]);
    useEffect(() => { onSearch({ fecha_desde: fechaDesde }); }, [fechaDesde, onSearch]);
    useEffect(() => { onSearch({ fecha_hasta: fechaHasta }); }, [fechaHasta, onSearch]);

    const getTipoActaBadge = (tipo: string) => {
        switch (tipo) {
            case 'NACIMIENTO':
                return (
                    <Badge variant="info">
                        <Baby className="h-3 w-3" /> NACIMIENTO
                    </Badge>
                );
            case 'MATRIMONIO':
                return (
                    <Badge variant="default" className="bg-primary/90">
                        <Heart className="h-3 w-3" /> MATRIMONIO
                    </Badge>
                );
            case 'DEFUNCION':
                return (
                    <Badge variant="secondary">
                        <Cross className="h-3 w-3" /> DEFUNCIÓN
                    </Badge>
                );
            default:
                return <Badge variant="outline">{tipo}</Badge>;
        }
    };

    const getStatusBadge = (estado: string) => {
        switch (estado) {
            case 'ACTIVO': return <Badge variant="success">Activo</Badge>;
            case 'OBSERVADO': return <Badge variant="warning">Observado</Badge>;
            case 'ANULADO': return <Badge variant="error">Anulado</Badge>;
            default: return <Badge variant="outline">{estado}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <section
                    aria-label="Búsqueda por ciudadano"
                    className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                >
                    <label
                        htmlFor="actas-ciudadano"
                        className="mb-2 block text-xs font-semibold text-foreground"
                    >
                        Buscar por ciudadano
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="actas-ciudadano"
                            aria-label="Buscar actas por ciudadano"
                            placeholder="DNI, primer apellido, segundo apellido o nombres"
                            className="h-12 w-full pl-10 font-semibold"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                        Escriba progresivamente: primer apellido, segundo apellido y nombres.
                    </p>
                </section>

                <section
                    aria-label="Filtros del registro"
                    className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                        <Input
                            aria-label="Código o folio"
                            placeholder="Código o folio"
                            className="h-11 font-semibold"
                            value={searchNumero}
                            onChange={(event) => setSearchNumero(event.target.value)}
                        />
                        <Input
                            aria-label="Libro"
                            placeholder="Libro"
                            className="h-11 font-semibold"
                            value={searchLibro}
                            onChange={(event) => setSearchLibro(event.target.value)}
                        />
                        <Input
                            aria-label="Año"
                            placeholder="Año"
                            type="number"
                            className="h-11 font-semibold"
                            value={searchAnio}
                            onChange={(event) => setSearchAnio(event.target.value)}
                        />
                        <Select value={searchTipo} onValueChange={setSearchTipo}>
                            <SelectTrigger
                                aria-label="Tipo de acta"
                                className="h-11 w-full text-xs font-bold uppercase"
                            >
                                <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border shadow-xl">
                                <SelectItem value="TODOS" className="text-xs font-medium">TODOS</SelectItem>
                                <SelectItem value="NACIMIENTO" className="text-xs font-medium">NACIMIENTO</SelectItem>
                                <SelectItem value="MATRIMONIO" className="text-xs font-medium">MATRIMONIO</SelectItem>
                                <SelectItem value="DEFUNCION" className="text-xs font-medium">DEFUNCIÓN</SelectItem>
                            </SelectContent>
                        </Select>
                        <div>
                            <label htmlFor="actas-desde" className="sr-only">Desde</label>
                            <Input
                                id="actas-desde"
                                aria-label="Fecha desde"
                                type="date"
                                className="h-11 text-xs"
                                value={fechaDesde}
                                onChange={(event) => setFechaDesde(event.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="actas-hasta" className="sr-only">Hasta</label>
                            <Input
                                id="actas-hasta"
                                aria-label="Fecha hasta"
                                type="date"
                                className="h-11 text-xs"
                                value={fechaHasta}
                                onChange={(event) => setFechaHasta(event.target.value)}
                            />
                        </div>
                        <Button
                            aria-label="Limpiar filtros"
                            variant="outline"
                            className="h-11 gap-2"
                            onClick={() => {
                                setSearchTerm("");
                                setSearchNumero("");
                                setSearchLibro("");
                                setSearchAnio("");
                                setSearchTipo("TODOS");
                                setFechaDesde("");
                                setFechaHasta("");
                            }}
                        >
                            <RefreshCw className="h-4 w-4" />
                            Limpiar
                        </Button>
                    </div>
                </section>

                <div className="flex flex-col justify-end gap-3 sm:flex-row">
                    {canImportar && (
                        <Button
                            variant="default"
                            className="h-12 gap-2 rounded-2xl bg-emerald-600 px-7 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-700 active:scale-95"
                            onClick={() => window.location.href = "/dashboard/digitalizacion/carga-masiva"}
                        >
                            <FileSpreadsheet className="h-5 w-5" />
                            IMPORTAR
                        </Button>
                    )}
                    {!soloConsulta && (
                        <Button
                            variant="outline"
                            disabled={exporting}
                            className="h-12 gap-2 rounded-2xl px-7 text-xs font-bold shadow-sm transition-all active:scale-95"
                            onClick={handleExport}
                        >
                            {exporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                            EXPORTAR
                        </Button>
                    )}
                </div>
            </div>

            <div className="std-table-container">
                <Table>
                    <TableHeader className="std-table-header">
                        <TableRow>
                            <TableHead className="std-table-head">Tipo / N° Acta</TableHead>
                            <TableHead className="std-table-head">Titular de Datos</TableHead>
                            <TableHead className="std-table-head">
                                <span className="block">Fecha del acta</span>
                                <span className="block text-[9px] font-normal normal-case tracking-normal text-muted-foreground/80">
                                    inscripción registral
                                </span>
                            </TableHead>
                            <TableHead className="std-table-head text-center">Documento</TableHead>
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
                        ) : actas.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground font-medium">No se encontraron actas.</TableCell></TableRow>
                        ) : (
                            actas.map((acta) => (
                                <TableRow key={acta.id} className="std-table-row">
                                    <TableCell className="std-table-cell">
                                        <div className="flex flex-col gap-1.5">
                                            {getTipoActaBadge(acta.tipo_acta)}
                                            <span className="data-console w-fit font-bold tracking-tight text-primary/80">N° {acta.numero_acta}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="std-table-cell">
                                        <div className="flex flex-col">
                                            <span className="text-foreground/90 font-medium tracking-tight">{acta.apellido_paterno} {acta.apellido_materno}, {acta.nombres}</span>
                                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">DNI: {acta.dni}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="std-table-cell">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs text-foreground/80 font-medium">
                                                {dateUtils.formatDisplayDate(acta.fecha_acta)}
                                            </span>
                                            <span className="text-[10px] font-medium text-muted-foreground/60">
                                                Año registral {acta.anio}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="std-table-cell text-center">
                                        {hasDoc(acta) ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-full border border-blue-100 dark:border-blue-900/50 shadow-sm transition-all hover:bg-blue-100 dark:hover:bg-blue-900/50">
                                                    {acta.tipo_documento?.toLowerCase().includes('pdf') ? (
                                                        <FileText size={14} className="text-blue-600 dark:text-blue-400" />
                                                    ) : (
                                                        <Paperclip size={14} className="text-blue-500 dark:text-blue-400" />
                                                    )}
                                                    <span className="text-[10px] font-semibold uppercase tracking-tight italic">Digitalizado</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center">
                                                <Badge variant="outline" className="text-muted-foreground/50 border-border font-medium h-5 text-[9px] uppercase tracking-widest">Físico</Badge>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="std-table-cell text-xs">
                                        {getStatusBadge(acta.estado)}
                                    </TableCell>
                                    <TableCell className="std-table-cell text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted rounded-full">
                                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-border p-1">
                                                <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 py-2">Opciones</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => onView(acta)} className="cursor-pointer font-medium gap-2 py-2.5 rounded-lg text-xs">
                                                    <Eye className="icon-std" /> Ver Detalles
                                                </DropdownMenuItem>
                                                {canModificar && (
                                                    <DropdownMenuItem onClick={() => onEdit?.(acta)} className="cursor-pointer font-medium gap-2 py-2.5 rounded-lg text-xs">
                                                        <Edit className="icon-std" /> Editar Información
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator className="my-1" />
                                                {hasDoc(acta) && (
                                                    <>
                                                        <DropdownMenuItem
                                                            className="cursor-pointer text-blue-600 font-medium gap-2 py-2.5 rounded-lg text-xs"
                                                            onClick={() => onViewDoc?.(acta)}
                                                        >
                                                            <Eye className="h-4 w-4" /> Ver Documento
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="cursor-pointer text-blue-600 font-medium gap-2 py-2.5 rounded-lg text-xs"
                                                            onClick={() => onDownloadDoc?.(acta)}
                                                        >
                                                            <FileDown className="h-4 w-4" /> Descargar
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                                <DropdownMenuItem
                                                    onClick={() => onUploadDoc?.(acta)}
                                                    className="cursor-pointer text-foreground/70 font-medium gap-2 py-2.5 rounded-lg text-xs"
                                                >
                                                    {hasDoc(acta) ? (
                                                        <><RefreshCw className="h-4 w-4" /> Reemplazar Archivo</>
                                                    ) : (
                                                        <><Paperclip className="h-4 w-4" /> Adjuntar Archivo</>
                                                    )}
                                                </DropdownMenuItem>

                                                {(canAnular || canEliminar) && (
                                                    <>
                                                        <DropdownMenuSeparator className="my-1" />
                                                        {canAnular && acta.estado === 'ACTIVO' && (
                                                            <DropdownMenuItem
                                                                onClick={() => onAnular?.(acta)}
                                                                className="text-amber-600 cursor-pointer font-medium gap-2 py-2.5 rounded-lg text-xs"
                                                            >
                                                                <Ban className="h-4 w-4" /> Anular Registro
                                                            </DropdownMenuItem>
                                                        )}
                                                        {isAdminUser && acta.estado !== 'ACTIVO' && (
                                                            <DropdownMenuItem
                                                                onClick={() => onReactivar?.(acta)}
                                                                className="text-emerald-600 cursor-pointer font-medium gap-2 py-2.5 rounded-lg text-xs"
                                                            >
                                                                <RotateCcw className="h-4 w-4" /> Reactivar Registro
                                                            </DropdownMenuItem>
                                                        )}
                                                        {canEliminar && (
                                                            <DropdownMenuItem
                                                                onClick={() => onDelete(acta.id)}
                                                                className="text-rose-600 cursor-pointer font-medium gap-2 py-2.5 rounded-lg text-xs"
                                                            >
                                                                <Trash2 className="h-4 w-4" /> Eliminar Registro
                                                            </DropdownMenuItem>
                                                        )}
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
                label="actas"
            />
        </div>
    );
};
