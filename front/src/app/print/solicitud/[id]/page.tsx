"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { solicitudesService } from "@/services/solicitudes.service";
import { Solicitud } from "@/types/solicitud";
import { SolicitudPrintView } from "@/components/solicitudes/SolicitudPrintView";
import { Loader2, Printer, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SolicitudPrintPage() {
    const { id } = useParams();
    const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchSolicitud = async () => {
            try {
                const data = await solicitudesService.getById(Number(id));
                setSolicitud(data);
            } catch (error) {
                console.error("Error al cargar solicitud:", error);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchSolicitud();
    }, [id]);

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white">
                <Loader2 className="h-12 w-12 animate-spin text-slate-900" />
                <div className="text-center">
                    <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-900">
                        Generando Constancia de Trámite
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Verificando estados con el Registro Civil...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !solicitud) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white">
                <XCircle className="h-16 w-16 text-rose-500" />
                <div className="text-center">
                    <p className="text-xl font-black text-rose-600 uppercase tracking-widest">ERROR DE SISTEMA</p>
                    <p className="text-sm font-bold text-slate-500">No se encontró el trámite o no tiene acceso.</p>
                </div>
                <Button onClick={() => window.close()} className="mt-4 rounded-xl font-bold uppercase text-[10px]">Cerrar Ventana</Button>
            </div>
        );
    }

    if (solicitud.estado === 'ANULADO') {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white">
                <XCircle className="h-16 w-16 text-rose-400" />
                <div className="text-center space-y-1">
                    <p className="text-xl font-black text-rose-600 uppercase tracking-widest">Constancia Anulada</p>
                    <p className="text-sm font-bold text-slate-500">
                        La solicitud <span className="font-mono">#{solicitud.id.toString().padStart(6, '0')}</span> fue anulada y no puede imprimirse.
                    </p>
                    <p className="text-xs text-slate-400 mt-2">Los documentos anulados no tienen validez oficial.</p>
                </div>
                <Button onClick={() => window.close()} variant="outline" className="mt-4 rounded-xl font-bold uppercase text-[10px] border-rose-200 text-rose-600 hover:bg-rose-50">
                    Cerrar Ventana
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-black p-0 print:p-0 relative flex justify-center !bg-white !text-black shadow-none border-none">
            {/* Control flotante para imprimir de nuevo si es necesario, oculto en print */}
            <div className="fixed top-8 right-8 print:hidden z-50 flex flex-col items-end gap-3">
                <p className="max-w-[220px] text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Revise el documento. Luego imprima con el botón o Ctrl+P.
                </p>
                <div className="flex gap-3">
                <Button
                    variant="outline"
                    onClick={() => window.close()}
                    className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xl rounded-full px-6 h-12 font-black uppercase tracking-widest text-[10px]"
                >
                    CERRAR
                </Button>
                <Button
                    onClick={() => window.print()}
                    className="bg-slate-900 text-white hover:bg-slate-800 shadow-xl rounded-full px-6 h-12 font-black uppercase tracking-widest text-[10px] flex gap-3"
                >
                    <Printer size={16} /> IMPRIMIR
                </Button>
                </div>
            </div>

            <SolicitudPrintView solicitud={solicitud} />
        </div>
    );
}
