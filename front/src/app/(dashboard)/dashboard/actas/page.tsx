"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { FileDigit, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { actasService, type ActasFilters } from "@/services/actas.service";
import { ActasTable } from "@/components/actas/ActasTable";
import { ActaEditSheet } from "@/components/actas/ActaEditSheet";
import { ActaDetailSheet } from "@/components/actas/ActaDetailSheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
import { Acta } from "@/types/acta";
import { documentosService } from "@/services/documentos.service";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, CheckCircle2, Trash2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { isConsulta } from "@/lib/roles";

export default function ActasPage() {
    const router = useRouter();
    const usuario = useAuthStore((state) => state.usuario);
    const soloConsulta = isConsulta(usuario?.rol_id);
    const searchParams = useSearchParams();
    const personaIdParam = Number.parseInt(searchParams.get("persona_id") || "", 10);
    const actaIdParam = Number.parseInt(searchParams.get("acta_id") || "", 10);
    const initialPersonaId = Number.isInteger(personaIdParam) && personaIdParam > 0
        ? personaIdParam
        : undefined;
    const [actas, setActas] = useState<Acta[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1
    });
    const [filtros, setFiltros] = useState<ActasFilters>({
        tipo: "",
        anio: "",
        q: "",
        numero: "",
        libro: "",
        persona_id: initialPersonaId,
        page: 1,
        limit: 10
    });
    const openedActaId = useRef<number | null>(null);

    // Estado para la edición y detalles
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedActa, setSelectedActa] = useState<Acta | null>(null);

    // Estado para confirmación de eliminación
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDelDocConfirmOpen, setIsDelDocConfirmOpen] = useState(false);
    const [actaToDelete, setActaToDelete] = useState<number | null>(null);
    const [actaToDelDoc, setActaToDelDoc] = useState<Acta | null>(null);

    // Estado para confirmación de anulación
    const [isAnularDialogOpen, setIsAnularDialogOpen] = useState(false);
    const [actaToAnular, setActaToAnular] = useState<Acta | null>(null);
    const [motivoAnulacion, setMotivoAnulacion] = useState("");

    // Estado para subida de documento
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [actaToUpload, setActaToUpload] = useState<Acta | null>(null);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    // Helper para manejar boolean de PostgreSQL
    const hasDoc = (acta: Acta) => !!acta.tiene_documento;

    const fetchActas = useCallback(async () => {
        setLoading(true);
        try {
            const response = await actasService.getAll(filtros);
            setActas(response.data);
            setPagination(response.pagination);

            if (
                Number.isInteger(actaIdParam)
                && actaIdParam > 0
                && openedActaId.current !== actaIdParam
            ) {
                const actaSolicitada = response.data.find((acta) => acta.id === actaIdParam);
                if (actaSolicitada) {
                    openedActaId.current = actaIdParam;
                    setSelectedActa(actaSolicitada);
                    setIsDetailOpen(true);
                }
            }
        } catch {
            toast.error("Error al cargar actas");
        } finally {
            setLoading(false);
        }
    }, [actaIdParam, filtros]);

    useEffect(() => {
        fetchActas();
    }, [fetchActas]);

    const handleSearch = useCallback((nuevosFiltros: Partial<ActasFilters>) => {
        setFiltros(prev => ({
            ...prev,
            ...nuevosFiltros,
            page: 1
        }));
    }, []);

    const handlePageChange = (newPage: number) => {
        setFiltros(prev => ({ ...prev, page: newPage }));
    };

    const handleView = (acta: Acta) => {
        setSelectedActa(acta);
        setIsDetailOpen(true);
    };

    const handleEdit = (acta: Acta) => {
        setSelectedActa(acta);
        setIsEditOpen(true);
    };

    // --- Eliminar (error de registro) ---
    const handleDelete = (id: number) => {
        setActaToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (actaToDelete) {
            try {
                await actasService.delete(actaToDelete);
                toast.success("Acta eliminada correctamente", {
                    description: "El registro y su documento asociado han sido removidos."
                });
                fetchActas();
            } catch {
                toast.error("No se pudo eliminar el acta");
            } finally {
                setActaToDelete(null);
                setIsDeleteDialogOpen(false);
            }
        }
    };

    // --- Anular (cambiar estado) ---
    const handleAnular = (acta: Acta) => {
        setActaToAnular(acta);
        setMotivoAnulacion("");
        setIsAnularDialogOpen(true);
    };

    const confirmAnular = async () => {
        if (!actaToAnular) return;
        if (!motivoAnulacion.trim()) {
            toast.error("Debe indicar el motivo de anulación");
            return;
        }
        try {
            await actasService.anular(actaToAnular.id, motivoAnulacion.trim());
            toast.success("Acta anulada correctamente", {
                description: "El acta permanece en el sistema como registro anulado."
            });
            fetchActas();
        } catch {
            toast.error("No se pudo anular el acta");
        } finally {
            setActaToAnular(null);
            setMotivoAnulacion("");
            setIsAnularDialogOpen(false);
        }
    };

    // --- Reactivar ---
    const handleReactivar = async (acta: Acta) => {
        try {
            await actasService.reactivate(acta.id);
            toast.success("Acta reactivada correctamente");
            fetchActas();
        } catch {
            toast.error("No se pudo reactivar el acta");
        }
    };

    // --- Subir documento ---
    const handleUploadDoc = (acta: Acta) => {
        setActaToUpload(acta);
        setUploadFile(null);
        setIsUploadDialogOpen(true);
    };

    const confirmUpload = async () => {
        if (!actaToUpload || !uploadFile) return;
        setUploading(true);
        try {
            // Si ya tiene documento, eliminar el anterior primero
            if (hasDoc(actaToUpload)) {
                const docs = await documentosService.getByActa(actaToUpload.id);
                for (const doc of docs) {
                    await documentosService.delete(doc.id);
                }
            }
            await documentosService.upload(actaToUpload.id, uploadFile);
            toast.success(
                hasDoc(actaToUpload) ? "Documento reemplazado correctamente" : "Documento adjuntado correctamente",
                { description: `Archivo vinculado al acta N° ${actaToUpload.numero_acta}` }
            );
            fetchActas();
        } catch {
            toast.error("Error al subir el documento");
        } finally {
            setUploading(false);
            setActaToUpload(null);
            setUploadFile(null);
            setIsUploadDialogOpen(false);
        }
    };

    // --- Eliminar SOLO documento ---
    const handleDeleteDoc = (acta: Acta) => {
        setActaToDelDoc(acta);
        setIsDelDocConfirmOpen(true);
    };

    const confirmDeleteDoc = async () => {
        if (!actaToDelDoc) return;
        try {
            const docs = await documentosService.getByActa(actaToDelDoc.id);
            for (const doc of docs) {
                await documentosService.delete(doc.id);
            }
            toast.success("Documento desvinculado correctamente");
            fetchActas();
        } catch {
            toast.error("Error al eliminar el documento");
        } finally {
            setIsDelDocConfirmOpen(false);
            setActaToDelDoc(null);
        }
    };

    // --- Ver y Descargar documento ---
    const getFileUrl = (ruta?: string) => {
        if (!ruta) return "";
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        const rootUrl = apiBase.replace('/api', '');
        return `${rootUrl}/${ruta}`;
    };

    const handleViewDoc = (acta: Acta) => {
        const url = getFileUrl(acta.ruta_archivo);
        if (url) window.open(url, '_blank');
    };

    const handleDownloadDoc = (acta: Acta) => {
        const url = getFileUrl(acta.ruta_archivo);
        if (!url) return;

        const link = document.createElement('a');
        link.href = url;
        link.target = "_blank";
        link.download = `ACTA_${acta.tipo_acta}_${acta.numero_acta}.${acta.tipo_documento?.toLowerCase() || 'pdf'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 text-foreground">
                        <div className="bg-primary p-2.5 rounded-xl shadow-primary/20 shadow-lg">
                            <FileDigit className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Registro de Actas</h1>
                    </div>
                    <p className="text-muted-foreground font-medium text-xs ml-1">
                        {soloConsulta
                            ? "Consulta del archivo digital de actas (solo lectura)."
                            : "Archivo digital y control de las actas registradas en el distrito."}
                    </p>
                </div>

                {!soloConsulta && (
                <Button
                    onClick={() => router.push("/dashboard/digitalizacion")}
                    className="h-12 px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-white font-bold text-xs rounded-2xl transition-all active:scale-95 flex items-center gap-2"
                >
                    <Plus className="h-5 w-5" />
                    NUEVA DIGITALIZACIÓN
                </Button>
                )}
            </div>

            <ActasTable
                actas={actas}
                isLoading={loading}
                pagination={pagination}
                onPageChange={handlePageChange}
                onView={handleView}
                onEdit={soloConsulta ? undefined : handleEdit}
                onDelete={handleDelete}
                onDeleteDoc={handleDeleteDoc}
                onViewDoc={handleViewDoc}
                onDownloadDoc={handleDownloadDoc}
                onAnular={handleAnular}
                onReactivar={handleReactivar}
                onUploadDoc={handleUploadDoc}
                onSearch={handleSearch}
            />

            <ActaEditSheet
                key={selectedActa ? `edit-acta-${selectedActa.id}` : 'no-acta'}
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                onSuccess={fetchActas}
                acta={selectedActa}
            />

            <ActaDetailSheet
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                acta={selectedActa}
                onEdit={soloConsulta ? undefined : handleEdit}
            />

            {/* Diálogo de ANULACIÓN con motivo */}
            <AlertDialog open={isAnularDialogOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsAnularDialogOpen(false);
                    setMotivoAnulacion("");
                }
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Anular Acta N° {actaToAnular?.numero_acta}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            El acta será marcada como ANULADA. El registro y su documento se conservarán como respaldo.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Motivo de anulación *</label>
                        <Textarea
                            placeholder="Ej: Error en datos del titular, orden judicial, duplicidad de registro..."
                            value={motivoAnulacion}
                            onChange={(e) => setMotivoAnulacion(e.target.value)}
                            className="resize-none min-h-20"
                        />
                        {motivoAnulacion.trim() === '' && (
                            <p className="text-xs text-red-500">El motivo es obligatorio</p>
                        )}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmAnular}
                            disabled={!motivoAnulacion.trim()}
                            className="bg-amber-600 hover:bg-amber-700"
                        >
                            Sí, Anular Acta
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Diálogo de ELIMINACIÓN (error de registro) */}
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={confirmDelete}
                title="¿Eliminar Acta por error de registro?"
                description="Esta acción eliminará el acta, su documento digitalizado y el archivo físico del servidor. Use esta opción solo si el acta fue creada por error (duplicado, datos incorrectos). Esta operación NO se puede deshacer."
                confirmText="Eliminar definitivamente"
                cancelText="Cancelar"
            />

            {/* Diálogo de ELIMINACIÓN DE SOLO DOCUMENTO */}
            <ConfirmDialog
                isOpen={isDelDocConfirmOpen}
                onClose={() => setIsDelDocConfirmOpen(false)}
                onConfirm={confirmDeleteDoc}
                title="¿Desvincular documento del acta?"
                description={`Se eliminará el archivo digitalizado vinculado al acta N° ${actaToDelDoc?.numero_acta}. El registro del acta permanecerá intacto.`}
                confirmText="Sí, eliminar documento"
                cancelText="Cancelar"
                variant="destructive"
            />

            {/* Diálogo de SUBIDA DE DOCUMENTO */}
            <AlertDialog open={isUploadDialogOpen} onOpenChange={(open) => {
                if (!open && !uploading) {
                    setIsUploadDialogOpen(false);
                    setUploadFile(null);
                }
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {actaToUpload?.tiene_documento ? 'Reemplazar' : 'Adjuntar'} Documento — Acta N° {actaToUpload?.numero_acta}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {actaToUpload?.tiene_documento
                                ? 'El documento actual será reemplazado por el nuevo archivo. Esta acción no se puede deshacer.'
                                : 'Suba el escaneo del acta (PDF o Imagen JPG/PNG). Máximo 10MB.'
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div
                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${uploadFile ? 'border-green-500 bg-green-50' : 'border-slate-300 hover:border-blue-400 bg-slate-50'
                            }`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            if (e.dataTransfer.files[0]) setUploadFile(e.dataTransfer.files[0]);
                        }}
                    >
                        {uploadFile ? (
                            <div className="flex flex-col items-center gap-2">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                                <span className="font-bold text-slate-700">{uploadFile.name}</span>
                                <span className="text-xs text-slate-500">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                <Button variant="ghost" size="sm" onClick={() => setUploadFile(null)} className="text-red-500 hover:text-red-600">
                                    <Trash2 className="h-4 w-4 mr-1" /> Quitar
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <Upload className="h-8 w-8 text-slate-400" />
                                <span className="text-sm text-slate-500">Suelte el archivo aquí o</span>
                                <label className="cursor-pointer">
                                    <span className="text-blue-600 font-semibold hover:underline">seleccione desde carpeta</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="application/pdf,image/*"
                                        onChange={(e) => e.target.files && setUploadFile(e.target.files[0])}
                                    />
                                </label>
                            </div>
                        )}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={uploading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmUpload}
                            disabled={!uploadFile || uploading}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {uploading ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Subiendo...</>
                            ) : (
                                'Adjuntar Documento'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
