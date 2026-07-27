"use client";

import { useState } from "react";
import { usePersonas } from "@/hooks/usePersonas";
import { PersonasTable } from "@/components/personas/PersonasTable";
import { PersonaSheet } from "@/components/personas/PersonaSheet";
import { PersonaDetailSheet } from "@/components/personas/PersonaDetailSheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Persona, PersonaInput } from "@/types/persona";
import { Search, UserPlus, Download, Users, Loader2, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { reportesService } from "@/services/reportes.service";

export default function PersonasPage() {
    const {
        personas,
        isLoading,
        termino,
        setTermino,
        createPersona,
        updatePersona,
        deletePersona,
        reactivatePersona,
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
                        Gestión de la base de datos de personas para registros y trámites.
                    </p>
                </div>

                <Button
                    onClick={handleNew}
                    className="h-12 px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-white font-bold text-xs rounded-2xl transition-all active:scale-95 flex items-center gap-2"
                >
                    <UserPlus className="h-5 w-5" />
                    REGISTRAR CIUDADANO
                </Button>
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

            <PersonasTable
                personas={personas}
                isLoading={isLoading}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
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
        </div >
    );
}
