"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, ShieldCheck, ArrowLeft, FileText, User, Calendar, Hash, Banknote, UserCheck } from "lucide-react";

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

const ESTADO_CONFIG: Record<string, { label: string; dot: string; chip: string }> = {
    ATENDIDO:  { label: "Atendido",  dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    PENDIENTE: { label: "Pendiente", dot: "bg-amber-500",   chip: "bg-amber-50 text-amber-700 border-amber-200" },
    ANULADO:   { label: "Anulado",   dot: "bg-rose-500",    chip: "bg-rose-50 text-rose-700 border-rose-200" },
};

const formatFecha = (fecha: string | null) => {
    if (!fecha) return "—";
    return new Date(fecha).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });
};

function DataRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3 py-3.5 border-b border-slate-100 last:border-0">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
                <p className="text-sm font-bold text-slate-800 break-words">{value}</p>
            </div>
        </div>
    );
}

export default function VerificarPage() {
    const { codigo } = useParams<{ codigo: string }>();
    const router = useRouter();
    const [result, setResult] = useState<VerificacionResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
        fetch(`${apiBase}/verificar/solicitud/${codigo}`)
            .then(async (res) => { const data = await res.json(); setResult(data); })
            .catch(() => { setResult({ valido: false, message: "No se pudo conectar con el servidor de verificación." }); })
            .finally(() => setLoading(false));
    }, [codigo]);

    const numFmt = codigo?.padStart(6, "0") ?? "—";

    return (
        <div className="min-h-screen flex flex-col lg:flex-row font-sans">

            {/* Panel izquierdo */}
            <div className="lg:w-2/5 bg-[#0f2744] flex flex-col items-center justify-center px-10 py-14 text-white text-center">
                <img src="/Logo_MDUnion.svg" alt="Logo" className="w-20 h-20 mx-auto mb-6 drop-shadow-lg" />
                <h1 className="text-xl font-black uppercase tracking-widest leading-snug mb-2">
                    Municipalidad Distrital<br />de La Unión
                </h1>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-300 mb-10">
                    Oficina de Registro Civil
                </p>

                <div className="w-px h-10 bg-white/20 mx-auto mb-10" />

                {/* Número consultado */}
                <div className="bg-white/10 border border-white/20 rounded-2xl px-8 py-5 mb-10">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300 mb-1.5">Constancia consultada</p>
                    <p className="text-4xl font-black font-mono tracking-widest text-white">{numFmt}</p>
                </div>

                <button
                    onClick={() => router.push("/verificar")}
                    className="flex items-center gap-2 text-xs font-bold text-blue-300 hover:text-white transition-colors uppercase tracking-widest"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Verificar otro código
                </button>

                <p className="mt-14 text-[10px] font-bold uppercase tracking-widest text-white/25">
                    Sistema STDU v2.0 · Piura, Perú
                </p>
            </div>

            {/* Panel derecho — resultado */}
            <div className="flex-1 bg-slate-50 flex flex-col items-center justify-center px-6 py-14">
                <div className="w-full max-w-sm">

                    {/* Cargando */}
                    {loading && (
                        <div className="flex flex-col items-center gap-5 py-16">
                            <div className="w-16 h-16 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center">
                                <Loader2 className="w-7 h-7 animate-spin text-[#0f2744]" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-slate-700">Verificando constancia...</p>
                                <p className="text-xs text-slate-400 mt-1">Consultando el registro oficial</p>
                            </div>
                        </div>
                    )}

                    {/* VÁLIDO */}
                    {!loading && result?.valido && result.constancia && (() => {
                        const est = ESTADO_CONFIG[result.constancia.estado];
                        return (
                            <div className="space-y-4">
                                {/* Banner éxito */}
                                <div className="bg-emerald-600 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-lg shadow-emerald-900/20">
                                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-white font-black text-sm uppercase tracking-wide">Constancia Verificada</p>
                                        <p className="text-emerald-100 text-[11px] mt-0.5">Documento auténtico · Sistema STDU</p>
                                    </div>
                                </div>

                                {/* Card datos */}
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                    {/* Encabezado número + estado */}
                                    <div className="px-5 pt-5 pb-4 flex items-start justify-between">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">N° de Constancia</p>
                                            <p className="text-3xl font-black font-mono tracking-widest text-slate-900">{result.constancia.numero}</p>
                                        </div>
                                        {est && (
                                            <span className={`mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-widest ${est.chip}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${est.dot}`} />
                                                {est.label}
                                            </span>
                                        )}
                                    </div>

                                    <div className="px-5 pb-5">
                                        <DataRow icon={FileText}  label="Tipo de trámite"   value={result.constancia.tipo_solicitud} />
                                        <DataRow icon={User}       label="Solicitante"       value={<span className="uppercase">{result.constancia.solicitante}</span>} />
                                        <DataRow icon={Calendar}   label="Fecha de solicitud" value={formatFecha(result.constancia.fecha_solicitud)} />
                                        <DataRow icon={Calendar}   label="Fecha de atención"  value={formatFecha(result.constancia.fecha_atencion)} />
                                        <DataRow icon={Hash}       label="Documentos"         value={`${result.constancia.cantidad_documentos} copia${result.constancia.cantidad_documentos !== 1 ? "s" : ""}`} />
                                        <DataRow icon={Banknote}   label="Total liquidado"    value={`S/ ${Number(result.constancia.total).toFixed(2)}`} />
                                        {result.constancia.atendido_por && (
                                            <DataRow icon={UserCheck} label="Atendido por" value={<span className="uppercase">{result.constancia.atendido_por}</span>} />
                                        )}
                                    </div>
                                </div>

                                {/* Pie */}
                                <div className="flex items-center gap-2 px-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                    <p className="text-[11px] text-slate-400 leading-relaxed">
                                        Información verificada contra el registro oficial de la Oficina de Registro Civil.
                                    </p>
                                </div>
                            </div>
                        );
                    })()}

                    {/* INVÁLIDO */}
                    {!loading && result && !result.valido && (
                        <div className="space-y-4">
                            <div className="bg-rose-600 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-lg shadow-rose-900/20">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                    <XCircle className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-white font-black text-sm uppercase tracking-wide">No Verificado</p>
                                    <p className="text-rose-100 text-[11px] mt-0.5">El código no figura en el registro</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-5 space-y-3">
                                <p className="text-sm font-semibold text-slate-700">
                                    {result.message || "El código ingresado no corresponde a ninguna constancia registrada."}
                                </p>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Verifique que el número impreso en su documento sea correcto o comuníquese con la Oficina de Registro Civil de la Municipalidad.
                                </p>
                            </div>

                            <button
                                onClick={() => router.push("/verificar")}
                                className="w-full bg-[#0f2744] hover:bg-[#1a3a5c] text-white font-black uppercase tracking-widest text-xs py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Intentar con otro código
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
