"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, ShieldCheck, Clock } from "lucide-react";

interface ConstanciaVerificada {
    numero: string;
    tipo_solicitud: string;
    estado: string;
    fecha_solicitud: string;
    fecha_atencion: string | null;
    solicitante: string;
    cantidad_documentos: number;
    total: string;
    atendido_por: string | null;
}

interface VerificacionResult {
    valido: boolean;
    message?: string;
    constancia?: ConstanciaVerificada;
}

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    ATENDIDO:  { label: "Atendido",  color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
    PENDIENTE: { label: "Pendiente", color: "text-amber-700",   bg: "bg-amber-50 border-amber-200" },
    ANULADO:   { label: "Anulado",   color: "text-rose-700",    bg: "bg-rose-50 border-rose-200" },
};

const formatFecha = (fecha: string | null) => {
    if (!fecha) return "—";
    return new Date(fecha).toLocaleDateString("es-PE", {
        day: "2-digit", month: "long", year: "numeric",
    });
};

export default function VerificarPage() {
    const { codigo } = useParams<{ codigo: string }>();
    const [result, setResult] = useState<VerificacionResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

        fetch(`${apiBase}/verificar/solicitud/${codigo}`)
            .then(async (res) => {
                const data = await res.json();
                setResult(data);
            })
            .catch(() => {
                setResult({ valido: false, message: "No se pudo conectar con el servidor de verificación." });
            })
            .finally(() => setLoading(false));
    }, [codigo]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
            {/* Header institucional */}
            <div className="w-full max-w-lg mb-6 text-center">
                <div className="flex justify-center mb-3">
                    <img src="/Logo_MDUnion.svg" alt="Logo" className="w-14 h-14" />
                </div>
                <h1 className="text-xl font-black uppercase tracking-widest text-slate-900">
                    Municipalidad Distrital de La Unión
                </h1>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
                    Verificación de Constancia de Trámite
                </p>
            </div>

            {/* Card resultado */}
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">

                {/* Cargando */}
                {loading && (
                    <div className="p-12 flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-slate-400" />
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                            Verificando constancia N° {codigo?.padStart(6, "0")}...
                        </p>
                    </div>
                )}

                {/* Resultado: válido */}
                {!loading && result?.valido && result.constancia && (
                    <>
                        <div className="bg-emerald-600 px-6 py-5 flex items-center gap-4">
                            <CheckCircle2 className="w-10 h-10 text-white shrink-0" />
                            <div>
                                <p className="text-white font-black text-lg uppercase tracking-wide">
                                    Constancia Verificada
                                </p>
                                <p className="text-emerald-100 text-xs font-semibold mt-0.5 uppercase tracking-widest">
                                    Documento auténtico registrado en el sistema STDU
                                </p>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Número y estado */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">N° de Constancia</p>
                                    <p className="text-2xl font-black text-slate-900 font-mono tracking-widest">
                                        {result.constancia.numero}
                                    </p>
                                </div>
                                <span className={`px-3 py-1.5 rounded-full border text-xs font-black uppercase tracking-widest ${ESTADO_CONFIG[result.constancia.estado]?.bg ?? "bg-slate-50 border-slate-200"} ${ESTADO_CONFIG[result.constancia.estado]?.color ?? "text-slate-700"}`}>
                                    {ESTADO_CONFIG[result.constancia.estado]?.label ?? result.constancia.estado}
                                </span>
                            </div>

                            <div className="h-px bg-slate-100" />

                            {/* Datos de verificación */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Tipo de Trámite</p>
                                    <p className="text-sm font-bold text-slate-800">{result.constancia.tipo_solicitud}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Solicitante</p>
                                    <p className="text-sm font-bold text-slate-800 uppercase">{result.constancia.solicitante}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Fecha de Solicitud</p>
                                    <p className="text-sm font-bold text-slate-800">{formatFecha(result.constancia.fecha_solicitud)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Fecha de Atención</p>
                                    <p className="text-sm font-bold text-slate-800">{formatFecha(result.constancia.fecha_atencion)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Documentos</p>
                                    <p className="text-sm font-bold text-slate-800">{result.constancia.cantidad_documentos}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Liquidado</p>
                                    <p className="text-sm font-bold text-slate-800">S/ {result.constancia.total}</p>
                                </div>
                            </div>

                            {result.constancia.atendido_por && (
                                <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Atendido por</p>
                                    <p className="text-sm font-bold text-slate-700 uppercase">{result.constancia.atendido_por}</p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Resultado: inválido / no encontrado */}
                {!loading && result && !result.valido && (
                    <>
                        <div className="bg-rose-600 px-6 py-5 flex items-center gap-4">
                            <XCircle className="w-10 h-10 text-white shrink-0" />
                            <div>
                                <p className="text-white font-black text-lg uppercase tracking-wide">
                                    Constancia No Verificada
                                </p>
                                <p className="text-rose-100 text-xs font-semibold mt-0.5 uppercase tracking-widest">
                                    No se encontró el documento en el sistema
                                </p>
                            </div>
                        </div>
                        <div className="p-6 text-center space-y-3">
                            <p className="text-sm text-slate-600 font-medium">
                                {result.message || "El código ingresado no corresponde a ninguna constancia registrada."}
                            </p>
                            <p className="text-xs text-slate-400">
                                Verifique que el número impreso en su documento sea correcto o comuníquese con la Oficina de Registro Civil.
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Pie institucional */}
            <div className="mt-6 text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">
                        Sistema STDU · Oficina de Registro Civil
                    </p>
                </div>
                <p className="text-[10px] text-slate-300 font-medium uppercase tracking-widest">
                    Municipalidad Distrital de La Unión — Piura, Perú
                </p>
            </div>
        </div>
    );
}
