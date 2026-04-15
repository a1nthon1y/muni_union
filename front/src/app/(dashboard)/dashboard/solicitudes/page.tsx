"use client";

import { useEffect, useState } from "react";
import { solicitudesService } from "@/services/solicitudes.service";
import { Solicitud } from "@/types/solicitud";
import { SolicitudesTable } from "@/components/solicitudes/SolicitudesTable";
import { NuevaSolicitudForm } from "@/components/solicitudes/NuevaSolicitudForm";
import { SolicitudDetailSheet } from "@/components/solicitudes/SolicitudDetailSheet";
import { Button } from "@/components/ui/button";
import {
    Plus,
    RefreshCw,
    LayoutGrid,
    Trash2,
    Ban,
    AlertTriangle,
    Search,
    Download
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { reportesService } from "@/services/reportes.service";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

type ViewState = 'LIST' | 'CREATE';

export default function SolicitudesPage() {
    const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<ViewState>('LIST');
    const [isDetalleOpen, setIsDetalleOpen] = useState(false);
    const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
    });

    // Estados para diálogos
    const [isAnularOpen, setIsAnularOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [motivoAnulacion, setMotivoAnulacion] = useState("");
    const [solicitudToAnular, setSolicitudToAnular] = useState<number | null>(null);
    const [solicitudToEliminar, setSolicitudToEliminar] = useState<number | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    const [q, setQ] = useState("");
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");
    const [estadoFiltro, setEstadoFiltro] = useState("all");

    const handleExport = async () => {
        setIsExporting(true);
        const toastId = toast.loading("Generando reporte de trámites...");
        try {
            await reportesService.exportSolicitudes({
                q,
                fecha_desde: fechaDesde,
                fecha_hasta: fechaHasta,
                estado: estadoFiltro === "all" ? undefined : estadoFiltro,
            });
            await new Promise(resolve => setTimeout(resolve, 1500));
            toast.success("Descarga lista", { id: toastId });
        } catch (error) {
            toast.error("Error al generar el reporte", { id: toastId });
        } finally {
            setIsExporting(false);
        }
    };

    const fetchSolicitudes = async (p?: number, search?: string) => {
        setIsLoading(true);
        const targetPage = p || pagination.page;
        const targetSearch = search !== undefined ? search : q;
        try {
            const response = await solicitudesService.getAll({
                page: targetPage,
                limit: pagination.limit,
                q: targetSearch,
                fecha_desde: fechaDesde,
                fecha_hasta: fechaHasta,
                estado: estadoFiltro === "all" ? undefined : estadoFiltro,
            });
            setSolicitudes(response.data);
            setPagination({
                ...pagination,
                total: response.total,
                page: targetPage,
                totalPages: Math.ceil(response.total / pagination.limit)
            });
        } catch (error) {
            toast.error("Error al cargar solicitudes");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSolicitudes(1, q);
        }, 400);
        return () => clearTimeout(timer);
    }, [q, fechaDesde, fechaHasta, estadoFiltro]);

    const handlePageChange = (page: number) => {
        fetchSolicitudes(page);
    };

    const handleView = async (solicitud: Solicitud) => {
        try {
            const fullSol = await solicitudesService.getById(solicitud.id);
            setSelectedSolicitud(fullSol);
            setIsDetalleOpen(true);
        } catch (error) {
            toast.error("Error al cargar detalle");
        }
    };

    const handleAtender = async (id: number) => {
        setIsActionLoading(true);
        try {
            await solicitudesService.atender(id);
            toast.success("Solicitud atendida correctamente");
            fetchSolicitudes();
            setIsDetalleOpen(false);
        } catch (error) {
            toast.error("Error al atender solicitud");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleAnularClick = (id: number) => {
        setSolicitudToAnular(id);
        setMotivoAnulacion("");
        setIsAnularOpen(true);
    };

    const confirmAnular = async () => {
        if (!solicitudToAnular || !motivoAnulacion.trim()) {
            toast.error("Debe indicar un motivo");
            return;
        }

        setIsActionLoading(true);
        try {
            await solicitudesService.anular(solicitudToAnular, motivoAnulacion.trim());
            toast.success("Solicitud anulada correctamente");
            fetchSolicitudes();
            setIsAnularOpen(false);
            setIsDetalleOpen(false);
        } catch (error) {
            toast.error("Error al anular solicitud");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleEliminarClick = (id: number) => {
        setSolicitudToEliminar(id);
        setIsEliminarOpen(true);
    };

    const confirmEliminar = async () => {
        if (!solicitudToEliminar) return;

        setIsActionLoading(true);
        try {
            await solicitudesService.delete(solicitudToEliminar);
            toast.success("Solicitud eliminada definitivamente");
            fetchSolicitudes();
            setIsEliminarOpen(false);
            setIsDetalleOpen(false);
        } catch (error) {
            toast.error("No se pudo eliminar la solicitud");
        } finally {
            setIsActionLoading(false);
        }
    };

    if (view === 'CREATE') {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <NuevaSolicitudForm
                    onCancel={() => setView('LIST')}
                    onSuccess={() => {
                        fetchSolicitudes();
                        setView('LIST');
                    }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
            {/* CABECERA ESTANDARIZADA */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 text-foreground">
                        <div className="bg-primary p-2.5 rounded-xl shadow-primary/20 shadow-lg">
                            <LayoutGrid className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Trámites y Certificados</h1>
                    </div>
                    <p className="text-muted-foreground font-medium text-xs ml-1">
                        Expedición de copias certificadas y certificados oficiales.
                    </p>
                </div>

                <Button
                    onClick={() => setView('CREATE')}
                    className="h-12 px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-white font-bold text-xs rounded-2xl transition-all active:scale-95 flex items-center gap-2"
                >
                    <Plus className="h-5 w-5" />
                    NUEVA SOLICITUD
                </Button>
            </div>

            {/* HERRAMIENTAS DE TABLA: FILTRO BUSCADOR */}
            <div className="flex flex-col xl:flex-row gap-4 items-center">
                <div className="flex-1 flex items-center gap-3 bg-card h-[70px] px-5 rounded-2xl border border-border shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-std text-slate-400" />
                        <Input
                            placeholder="Buscar por N° Trámite, DNI o apellidos..."
                            className="pl-9 std-input border-none bg-transparent focus-visible:ring-0 h-11 w-full font-semibold"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                    </div>

                    <Separator orientation="vertical" className="h-8 mx-1 opacity-50" />

                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap hidden sm:block">Desde</span>
                        <Input
                            type="date"
                            className="std-input w-36 border-none bg-transparent focus-visible:ring-0 h-9 text-xs"
                            value={fechaDesde}
                            onChange={(e) => setFechaDesde(e.target.value)}
                        />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap hidden sm:block">Hasta</span>
                        <Input
                            type="date"
                            className="std-input w-36 border-none bg-transparent focus-visible:ring-0 h-9 text-xs"
                            value={fechaHasta}
                            onChange={(e) => setFechaHasta(e.target.value)}
                        />
                    </div>

                    <Separator orientation="vertical" className="h-8 mx-1 opacity-50" />

                    <Select value={estadoFiltro} onValueChange={(v) => setEstadoFiltro(v)}>
                        <SelectTrigger className="w-36 border-none bg-transparent focus:ring-0 h-11 text-xs font-bold uppercase truncate shrink-0">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border shadow-lg">
                            <SelectItem value="all">TODOS</SelectItem>
                            <SelectItem value="PENDIENTE">PENDIENTE</SelectItem>
                            <SelectItem value="ATENDIDO">ATENDIDO</SelectItem>
                            <SelectItem value="ANULADO">ANULADO</SelectItem>
                        </SelectContent>
                    </Select>

                    <Separator orientation="vertical" className="h-8 mx-1 opacity-50" />

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setQ(""); setFechaDesde(""); setFechaHasta(""); setEstadoFiltro("all"); }}
                        className="h-9 w-9 text-slate-400 hover:text-primary hover:bg-primary/5 shrink-0"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>

                <Button
                    variant="outline"
                    disabled={isExporting}
                    className="h-12 px-7 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-2xl shadow-sm transition-all active:scale-95 flex items-center gap-2"
                    onClick={handleExport}
                >
                    {isExporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                    EXPORTAR
                </Button>
            </div>

            <SolicitudesTable
                solicitudes={solicitudes}
                isLoading={isLoading}
                onView={handleView}
                onAtender={(s) => handleAtender(s.id)}
                onAnular={(s) => handleAnularClick(s.id)}
                onDelete={(s) => handleEliminarClick(s.id)}
                pagination={pagination}
                onPageChange={handlePageChange}
            />

            <SolicitudDetailSheet
                solicitud={selectedSolicitud}
                open={isDetalleOpen}
                onOpenChange={setIsDetalleOpen}
                onAtender={handleAtender}
                onAnular={handleAnularClick}
                onDelete={handleEliminarClick}
                isLoadingActions={isActionLoading}
            />

            {/* Diálogo de Anulación */}
            <AlertDialog open={isAnularOpen} onOpenChange={setIsAnularOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
                            <Ban size={20} /> Anular Trámite #{solicitudToAnular?.toString().padStart(6, '0')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción marcará el trámite como ANULADO. Por favor, indique el motivo para el historial institucional.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4 space-y-2">
                        <label className="text-xs font-black uppercase text-muted-foreground tracking-wider">Motivo de Anulación *</label>
                        <Textarea
                            placeholder="Ej: Error en datos del solicitante, duplicidad de trámite, solicitud del usuario..."
                            value={motivoAnulacion}
                            onChange={(e) => setMotivoAnulacion(e.target.value)}
                            className="rounded-xl border-border focus:ring-rose-100 focus:border-rose-400 min-h-[100px]"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                confirmAnular();
                            }}
                            className="bg-rose-600 hover:bg-rose-700 rounded-xl font-bold"
                            disabled={!motivoAnulacion.trim() || isActionLoading}
                        >
                            {isActionLoading ? "Procesando..." : "Sí, Anular Trámite"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Diálogo de Eliminación Definitiva */}
            <ConfirmDialog
                isOpen={isEliminarOpen}
                onClose={() => setIsEliminarOpen(false)}
                onConfirm={confirmEliminar}
                title="¿Eliminar trámite DEFINITIVAMENTE?"
                description="Esta acción eliminará el registro y todo su historial de la base de datos. Use esto SOLO para corregir errores críticos de registro. Esta operación no se puede deshacer."
                confirmText="Sí, Eliminar de Raíz"
                cancelText="Cancelar"
                variant="destructive"
            />
        </div >
    );
}
