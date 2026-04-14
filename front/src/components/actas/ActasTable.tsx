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
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { reportesService } from "@/services/reportes.service";
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
import { Separator } from "@/components/ui/separator";
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
    onSearch: (filtros: any) => void;
}

export function ActasTable({
    actas,
    isLoading,
    pagination,
    onPageChange,
    onView,
    onEdit,
    onDelete,
    onDeleteDoc,
    onAnular,
    onReactivar,
    onUploadDoc,
    onViewDoc,
    onDownloadDoc,
    onSearch
}: ActasTableProps) {
    const usuario = useAuthStore((state) => state.usuario);
    const isAdmin = usuario?.rol_id === 1;

    // Helper para manejar boolean de PostgreSQL - Verificamos el campo correcto en 'Acta'
    const hasDoc = (acta: Acta) => !!acta.tiene_documento;

    const [searchTerm, setSearchTerm] = useState("");
    const [searchNumero, setSearchNumero] = useState("");
    const [searchAnio, setSearchAnio] = useState("");
    const [searchTipo, setSearchTipo] = useState("TODOS");
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");
    const [exporting, setExporting] = useState(false);

    const debouncedSearch = useDebounce(searchTerm, 500);
    const debouncedNumero = useDebounce(searchNumero, 500);
    const debouncedAnio = useDebounce(searchAnio, 500);

    const handleExport = async () => {
        setExporting(true);
        const filters = {
            tipo: searchTipo !== "TODOS" ? searchTipo : "",
            anio: searchAnio,
            numero: searchNumero,
            q: searchTerm,
            fecha_desde: fechaDesde,
            fecha_hasta: fechaHasta,
        };

        const toastId = toast.loading("Generando Excel de actas...");
        try {
            await reportesService.exportActas(filters);
            await new Promise(resolve => setTimeout(resolve, 1500));
            toast.success("Descarga lista", { id: toastId });
        } catch (error) {
            toast.error("Error al generar el reporte", { id: toastId });
        } finally {
            setExporting(false);
        }
    };

    useEffect(() => { onSearch({ dni: debouncedSearch }); }, [debouncedSearch]);
    useEffect(() => { onSearch({ numero: debouncedNumero }); }, [debouncedNumero]);
    useEffect(() => { onSearch({ anio: debouncedAnio }); }, [debouncedAnio]);
    useEffect(() => { onSearch({ tipo: searchTipo === "TODOS" ? "" : searchTipo }); }, [searchTipo]);
    useEffect(() => { onSearch({ fecha_desde: fechaDesde }); }, [fechaDesde]);
    useEffect(() => { onSearch({ fecha_hasta: fechaHasta }); }, [fechaHasta]);

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
            {/* HERRAMIENTAS DE TABLA: FILTROS Y ACCIONES SEPARADOS */}
            <div className="flex flex-col xl:flex-row gap-4 items-center">

                {/* FILTROS FILA 1: texto + número + año + tipo */}
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 bg-card h-[70px] px-5 rounded-2xl border border-border shadow-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-std text-slate-400" />
                            <Input
                                placeholder="Buscar por DNI o Nombres..."
                                className="pl-9 std-input border-none bg-transparent focus-visible:ring-0 h-11 w-full font-semibold"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Separator orientation="vertical" className="h-8 mx-1 opacity-50" />
                        <Input
                            placeholder="N° Acta"
                            className="std-input w-28 border-none bg-transparent focus-visible:ring-0 h-11 font-semibold"
                            value={searchNumero}
                            onChange={(e) => setSearchNumero(e.target.value)}
                        />
                        <Input
                            placeholder="Año"
                            type="number"
                            className="std-input w-20 border-none bg-transparent focus-visible:ring-0 h-11 font-semibold"
                            value={searchAnio}
                            onChange={(e) => setSearchAnio(e.target.value)}
                        />
                        <Select value={searchTipo} onValueChange={setSearchTipo}>
                            <SelectTrigger className="w-36 border-none bg-transparent focus:ring-0 h-11 text-xs font-bold uppercase truncate">
                                <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-xl border-border">
                                <SelectItem value="TODOS" className="font-medium text-xs">TODOS</SelectItem>
                                <SelectItem value="NACIMIENTO" className="font-medium text-xs">NACIMIENTO</SelectItem>
                                <SelectItem value="MATRIMONIO" className="font-medium text-xs">MATRIMONIO</SelectItem>
                                <SelectItem value="DEFUNCION" className="font-medium text-xs">DEFUNCION</SelectItem>
                            </SelectContent>
                        </Select>
                        <Separator orientation="vertical" className="h-8 mx-1 opacity-50" />
                        {/* Rango de fechas */}
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Desde</span>
                            <Input
                                type="date"
                                className="std-input w-36 border-none bg-transparent focus-visible:ring-0 h-9 text-xs"
                                value={fechaDesde}
                                onChange={(e) => setFechaDesde(e.target.value)}
                            />
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Hasta</span>
                            <Input
                                type="date"
                                className="std-input w-36 border-none bg-transparent focus-visible:ring-0 h-9 text-xs"
                                value={fechaHasta}
                                onChange={(e) => setFechaHasta(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-slate-400 hover:text-primary hover:bg-primary/5 shrink-0"
                            onClick={() => {
                                setSearchTerm("");
                                setSearchNumero("");
                                setSearchAnio("");
                                setSearchTipo("TODOS");
                                setFechaDesde("");
                                setFechaHasta("");
                            }}
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <Button
                    variant="default"
                    className="h-12 px-7 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 text-white font-bold text-xs rounded-2xl transition-all active:scale-95 flex items-center gap-2"
                    onClick={() => window.location.href = '/dashboard/digitalizacion/carga-masiva'}
                >
                    <FileSpreadsheet className="h-5 w-5" />
                    IMPORTAR
                </Button>
                <Button
                    variant="outline"
                    disabled={exporting}
                    className="h-12 px-7 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-2xl shadow-sm transition-all active:scale-95 flex items-center gap-2"
                    onClick={handleExport}
                >
                    {exporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                    EXPORTAR
                </Button>
            </div>

            <div className="std-table-container">
                <Table>
                    <TableHeader className="std-table-header">
                        <TableRow>
                            <TableHead className="std-table-head">Tipo / N° Acta</TableHead>
                            <TableHead className="std-table-head">Titular de Datos</TableHead>
                            <TableHead className="std-table-head">Fecha / Año</TableHead>
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
                                        <div className="flex flex-col">
                                            <span className="text-xs text-foreground/80 font-medium">{dateUtils.formatDisplayDate(acta.fecha_acta)}</span>
                                            <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">{acta.anio}</span>
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
                                                <DropdownMenuItem onClick={() => onEdit?.(acta)} className="cursor-pointer font-medium gap-2 py-2.5 rounded-lg text-xs">
                                                    <Edit className="icon-std" /> Editar Información
                                                </DropdownMenuItem>
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

                                                {isAdmin && (
                                                    <>
                                                        <DropdownMenuSeparator className="my-1" />
                                                        {acta.estado === 'ACTIVO' ? (
                                                            <DropdownMenuItem
                                                                onClick={() => onAnular?.(acta)}
                                                                className="text-amber-600 cursor-pointer font-medium gap-2 py-2.5 rounded-lg text-xs"
                                                            >
                                                                <Ban className="h-4 w-4" /> Anular Registro
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem
                                                                onClick={() => onReactivar?.(acta)}
                                                                className="text-emerald-600 cursor-pointer font-medium gap-2 py-2.5 rounded-lg text-xs"
                                                            >
                                                                <RotateCcw className="h-4 w-4" /> Reactivar Registro
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            onClick={() => onDelete(acta.id)}
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
                label="actas"
            />
        </div>
    );
};
