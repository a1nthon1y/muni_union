"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { actasService } from "@/services/actas.service";
import { Acta } from "@/types/acta";
import { ActaPrintView } from "@/components/actas/ActaPrintView";
import { Loader2, Printer, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ActaPrintPage() {
    const { id } = useParams();
    const [acta, setActa] = useState<Acta | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchActa = async () => {
            try {
                const data = await actasService.getById(Number(id));
                setActa(data);
            } catch (error) {
                console.error("Error al cargar acta:", error);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchActa();
    }, [id]);

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white">
                <Loader2 className="h-12 w-12 animate-spin text-slate-900" />
                <div className="text-center">
                    <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-900">
                        Generando Registro Oficial
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Sincronizando con Oficina de Registro Civil...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !acta) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white">
                <XCircle className="h-16 w-16 text-rose-500" />
                <div className="text-center">
                    <p className="text-xl font-black text-rose-600 uppercase">Error de Sistema</p>
                    <p className="text-sm font-bold text-slate-500">No se pudo cargar el registro solicitado.</p>
                </div>
                <Button onClick={() => window.close()} className="mt-4 rounded-xl font-bold uppercase text-[10px]">Cerrar Ventana</Button>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen justify-center border-none bg-white! p-0 text-black! shadow-none">
            <div className="fixed top-8 right-8 z-50 flex flex-col items-end gap-3 print:hidden">
                <p className="max-w-55 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Revise el documento. Luego imprima con el botón o Ctrl+P.
                </p>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => window.close()}
                        className="h-12 rounded-full border-slate-200 bg-white px-6 text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-xl hover:bg-slate-50"
                    >
                        CERRAR
                    </Button>
                    <Button
                        onClick={() => window.print()}
                        className="flex h-12 gap-2 rounded-full bg-slate-900 px-6 text-[10px] font-black uppercase tracking-widest text-white shadow-xl hover:bg-slate-800"
                    >
                        <Printer size={16} /> IMPRIMIR
                    </Button>
                </div>
            </div>

            <ActaPrintView acta={acta} />
        </div>
    );
}
