"use client";

import api from "@/utils/api";
import { useState, useEffect } from "react";
import { usePersonas } from "@/hooks/usePersonas";
import { useDebounce } from "@/hooks/useDebounce";
import { PersonasTable } from "@/components/personas/PersonasTable";
import { PersonaSheet } from "@/components/personas/PersonaSheet";
import { PersonaDetailSheet } from "@/components/personas/PersonaDetailSheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Persona, PersonaInput } from "@/types/persona";
import { Search, UserPlus, Download, Users, Loader2, RefreshCw, Merge, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { reportesService } from "@/services/reportes.service";
import { useAuthStore } from "@/store/useAuthStore";
import { isConsulta } from "@/lib/roles";

export default function PersonasPage() {
    const usuario = useAuthStore((state) => state.usuario);
    const soloConsulta = isConsulta(usuario?.rol_id);

    const {
        personas,
        isLoading,
        termino,
        setTermino,
        createPersona,
        updatePersona,
        deletePersona,
        reactivatePersona,
        refresh,
        pagination,
        setPage
    } = usePersonas();

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
    const [detailPersona, setDetailPersona] = useState<Persona | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [personaToDelete, setPersonaToDelete] = useState<number | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [mergePersona, setMergePersona] = useState<Persona | null>(null);
    const [isMergeOpen, setIsMergeOpen] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        const toastId = toast.loading("Generando Excel de ciudadanos...");
        try {
            await reportesService.exportPersonas({ termino });
            await new Promise(resolve => setTimeout(resolve, 1500));
            toast.success("Descarga lista", { id: toastId });
        } catch {
            toast.error("Error al generar el reporte", { id: toastId });
        } finally {
            setIsExporting(false);
        }
    };


    const handleNew = () => {
        setSelectedPersona(null);
        setIsSheetOpen(true);
    };

    const handleEdit = (persona: Persona) => {
        setSelectedPersona(persona);
        setIsSheetOpen(true);
    };

    const handleView = (persona: Persona) => {
        setDetailPersona(persona);
        setIsDetailOpen(true);
    };

    const handleDelete = (id: number) => {
        setPersonaToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (personaToDelete) {
            try {
                await deletePersona(personaToDelete);
                setPersonaToDelete(null);
            } catch (error: unknown) {
                const message = error instanceof Error
                    ? error.message
                    : "No se pudo eliminar el ciudadano";
                toast.error(message, {
                    duration: 6000
                });
            }
        }
    };

    const handleMerge = (persona: Persona) => {
        setMergePersona(persona);
        setMaestroSeleccionado(null);
        setBusquedaMaestro("");
        setResultadosBusqueda([]);
        setIsMergeOpen(true);
    };

    const [busquedaMaestro, setBusquedaMaestro] = useState("");
    const [resultadosBusqueda, setResultadosBusqueda] = useState<Persona[]>([]);
    const [buscandoMaestro, setBuscandoMaestro] = useState(false);
    const [maestroSeleccionado, setMaestroSeleccionado] = useState<Persona | null>(null);
    const busquedaMaestroDebounced = useDebounce(busquedaMaestro, 400);

    useEffect(() => {
        if (!isMergeOpen) return;

        const buscarMaestro = async () => {
            if (!busquedaMaestroDebounced.trim()) {
                setResultadosBusqueda([]);
                setBuscandoMaestro(false);
                return;
            }
            setBuscandoMaestro(true);
            try {
                const response = await api.get("/personas", {
                    params: { termino: busquedaMaestroDebounced, limit: 20, page: 1 }
                });
                const filtrados = response.data.data.filter((p: Persona) =>
                    p.id !== mergePersona?.id
                );
                setResultadosBusqueda(filtrados);
            } catch (e) {
                console.error(e);
                setResultadosBusqueda([]);
            } finally {
                setBuscandoMaestro(false);
            }
        };

        buscarMaestro();
    }, [busquedaMaestroDebounced, isMergeOpen, mergePersona?.id]);

    const confirmarFusion = async () => {
        if (!mergePersona || !maestroSeleccionado) return;
        try {
            await api.post(`/personas/${mergePersona.id}/fusionar`, { maestro_id: maestroSeleccionado.id });
            toast.success("Registros fusionados correctamente");
            setIsMergeOpen(false);
            setMergePersona(null);
            setMaestroSeleccionado(null);
            refresh();
        } catch (error: any) {
            const msg = error.response?.data?.message || "Error al fusionar registros";
            toast.error(msg);
        }
    };

    const handleSubmit = async (data: PersonaInput) => {
        if (selectedPersona) {
            return await updatePersona(selectedPersona.id, data);
        } else {
            return await createPersona(data);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* CABECERA ESTANDARIZADA */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 text-foreground">
                        <div className="bg-primary p-2.5 rounded-xl shadow-primary/20 shadow-lg">
                            <Users size={24} className="text-white" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Ciudadanos</h1>
                    </div>
                    <p className="text-muted-foreground font-medium text-xs ml-1">
                        {soloConsulta
                            ? "Consulta de la base de datos de personas (solo lectura)."
                            : "Gestión de la base de datos de personas para registros y trámites."}
                    </p>
                </div>

                {!soloConsulta && (
                <Button
                    onClick={handleNew}
                    className="h-12 px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-white font-bold text-xs rounded-2xl transition-all active:scale-95 flex items-center gap-2"
                >
                    <UserPlus className="h-5 w-5" />
                    REGISTRAR CIUDADANO
                </Button>
                )}
            </div>

            {/* HERRAMIENTAS DE TABLA: FILTROS Y ACCIONES SEPARADOS */}
            <div className="flex flex-col xl:flex-row gap-4 items-center">

                {/* CONTENEDOR DE FILTROS (70px de alto) */}
                <div className="flex-1 flex items-center gap-3 bg-card h-17.5 px-5 rounded-2xl border border-border shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 icon-std text-slate-400" />
                        <Input
                            placeholder="Buscar por DNI o Nombres..."
                            className="pl-9 std-input border-none bg-transparent focus-visible:ring-0 h-11 w-full font-semibold"
                            value={termino}
                            onChange={(e) => setTermino(e.target.value)}
                        />
                    </div>

                    <Separator orientation="vertical" className="h-8 mx-1 opacity-50" />

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-slate-400 hover:text-primary hover:bg-primary/5 shrink-0"
                        onClick={() => setTermino("")}
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>

                {!soloConsulta && (
                <Button
                    variant="outline"
                    disabled={isExporting}
                    className="h-12 px-7 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-2xl shadow-sm transition-all active:scale-95 flex items-center gap-2"
                    onClick={handleExport}
                >
                    {isExporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                    EXPORTAR
                </Button>
                )}
            </div>

            <PersonasTable
                personas={personas}
                isLoading={isLoading}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onMerge={handleMerge}
                onReactivate={reactivatePersona}
                pagination={pagination}
                onPageChange={setPage}
            />

            <PersonaDetailSheet
                isOpen={isDetailOpen}
                onClose={() => {
                    setIsDetailOpen(false);
                    setDetailPersona(null);
                }}
                persona={detailPersona}
            />

            <PersonaSheet
                key={selectedPersona ? `edit-${selectedPersona.id}` : 'new-persona'}
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSubmit={handleSubmit}
                persona={selectedPersona}
            />
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={confirmDelete}
                title="¿Eliminar Ciudadano?"
                description="Esta acción eliminará al ciudadano del sistema si no tiene actas asociadas. Los datos se marcarán como inactivos y podrán ser reactivados posteriormente si es necesario."
                confirmText="Eliminar"
                cancelText="Cancelar"
            />

            {/* Diálogo de fusión de homónimos */}
            <Dialog open={isMergeOpen} onOpenChange={(open) => { if (!open) { setIsMergeOpen(false); setMergePersona(null); } }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                            <Merge className="h-6 w-6 text-blue-600" />
                        </div>
                        <DialogTitle className="text-center text-lg">Fusionar registros</DialogTitle>
                        <DialogDescription className="text-center">
                            Seleccione el registro <strong>MAESTRO</strong> que se conservará.
                            Los datos del registro a fusionar se moverán al maestro y este se eliminará.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-4 bg-muted/50 rounded-xl mb-4 text-sm space-y-1">
                        <p className="font-medium">Registro a fusionar (se eliminará):</p>
                        <p>{mergePersona?.apellido_paterno} {mergePersona?.apellido_materno}, {mergePersona?.nombres}</p>
                        <p className="font-mono text-amber-600">DNI: {mergePersona?.dni || 'Sin DNI'} · ID: #{mergePersona?.id}</p>
                        <Badge variant="secondary" className="w-fit h-4 px-1.5 text-[8px] border-amber-300 text-amber-700 bg-amber-50">
                            <AlertTriangle className="h-2.5 w-2.5 mr-1" /> Registro a fusionar
                        </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">
                        Busque el registro maestro (el que se quedará):
                    </p>

                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="DNI, nombres o apellidos del maestro..."
                                className="pl-9 pr-9 text-sm"
                                value={busquedaMaestro}
                                onChange={(e) => setBusquedaMaestro(e.target.value)}
                                autoComplete="off"
                            />
                            {buscandoMaestro && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                        </div>

                        {resultadosBusqueda.length > 0 && (
                            <div className="max-h-60 overflow-y-auto border border-border rounded-xl bg-background">
                                {resultadosBusqueda.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => setMaestroSeleccionado(p)}
                                        className={`w-full px-4 py-3 text-left hover:bg-accent transition-colors border-b last:border-0 flex items-center gap-3 ${
                                            maestroSeleccionado?.id === p.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">
                                                {p.apellido_paterno} {p.apellido_materno}, {p.nombres}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground font-mono">
                                                DNI: {p.dni || 'Sin DNI'} · ID: #{p.id} · {p.tipo_documento || ''}
                                            </p>
                                            {p.fecha_nacimiento && (
                                                <p className="text-[10px] text-muted-foreground">
                                                    Nac.: {new Date(p.fecha_nacimiento).toLocaleDateString('es-PE')}
                                                </p>
                                            )}
                                        </div>
                                        {maestroSeleccionado?.id === p.id && (
                                            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {busquedaMaestro.trim().length > 0 && resultadosBusqueda.length === 0 && !buscandoMaestro && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No se encontraron registros con ese criterio
                            </p>
                        )}
                    </div>

                    {maestroSeleccionado && (
                        <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl">
                            <p className="font-medium text-green-800 dark:text-green-300 mb-1">Maestro seleccionado:</p>
                            <p className="font-medium">{maestroSeleccionado.apellido_paterno} {maestroSeleccionado.apellido_materno}, {maestroSeleccionado.nombres}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                                DNI: {maestroSeleccionado.dni || 'Sin DNI'} · ID: #{maestroSeleccionado.id}
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3 mt-6">
                        <Button variant="outline" className="flex-1" onClick={() => setIsMergeOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="default"
                            className="flex-1"
                            onClick={confirmarFusion}
                            disabled={!maestroSeleccionado}
                        >
                            <Merge className="h-4 w-4 mr-2" />
                            Fusionar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}
