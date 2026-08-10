"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    CheckCircle2, XCircle, Loader2, ShieldCheck,
    ArrowLeft, FileText, User, Calendar, Hash,
    Banknote, UserCheck, Clock, Printer, AlertTriangle,
} from "lucide-react";
import { useLogosConfig, obtenerRutaLogoDinamica } from "@/lib/logo-institucional";

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

/* ── Configuración por estado ─────────────────────────────── */
const ESTADO_CONFIG: Record<string, {
    label: string;
    description: string;
    bannerBg: string;
    bannerText: string;
    bannerSub: string;
    icon: React.ElementType;
    dot: string;
    chip: string;
    canPrint: boolean;
}> = {
    ATENDIDO: {
        label: "Atendido",
        description: "El trámite fue completado y entregado al solicitante.",
        bannerBg: "bg-emerald-600",
        bannerText: "text-white",
        bannerSub: "text-emerald-100",
        icon: CheckCircle2,
        dot: "bg-emerald-500",
        chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
        canPrint: true,
    },
    PENDIENTE: {
        label: "Pendiente",
        description: "La solicitud fue registrada y está en espera de ser atendida.",
        bannerBg: "bg-amber-500",
        bannerText: "text-white",
        bannerSub: "text-amber-100",
        icon: Clock,
        dot: "bg-amber-500",
        chip: "bg-amber-50 text-amber-700 border-amber-200",
        canPrint: false,
    },
    ANULADO: {
        label: "Anulado",
        description: "Esta constancia fue anulada por la Oficina de Registro Civil.",
        bannerBg: "bg-rose-600",
        bannerText: "text-white",
        bannerSub: "text-rose-100",
        icon: AlertTriangle,
        dot: "bg-rose-500",
        chip: "bg-rose-50 text-rose-700 border-rose-200",
        canPrint: false,
    },
};

const formatFecha = (fecha: string | null) => {
    if (!fecha) return "—";
    return new Date(fecha).toLocaleDateString("es-PE", {
        day: "2-digit", month: "long", year: "numeric",
    });
};

function DataRow({ icon: Icon, label, value }: {
    icon: React.ElementType; label: string; value: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-3 py-3.5 border-b border-slate-100 last:border-0 print:py-2 print:border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 print:hidden">
                <Icon className="w-4 h-4 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
                <p className="text-sm font-bold text-slate-800">{value}</p>
            </div>
        </div>
    );
}

export default function VerificarPage() {
    const { codigo } = useParams<{ codigo: string }>();
    const router = useRouter();
    const [result, setResult] = useState<VerificacionResult | null>(null);
    const [loading, setLoading] = useState(true);
    const { logos: logosConfig } = useLogosConfig();
    const logoRuta = obtenerRutaLogoDinamica("principal", logosConfig);

    useEffect(() => {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
        fetch(`${apiBase}/verificar/solicitud/${codigo}`)
            .then(async (res) => { const data = await res.json(); setResult(data); })
            .catch(() => setResult({ valido: false, message: "No se pudo conectar con el servidor de verificación." }))
            .finally(() => setLoading(false));
    }, [codigo]);

    const numFmt = codigo?.padStart(6, "0") ?? "—";
    const constancia = result?.constancia;
    const est = constancia ? ESTADO_CONFIG[constancia.estado] : null;
    const verifiedAt = new Date().toLocaleDateString("es-PE", {
        day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

    const handlePrint = () => {
        if (!constancia || !est) return;
        const estadoEmoji = constancia.estado === "ATENDIDO" ? "✅" : constancia.estado === "PENDIENTE" ? "⏳" : "❌";
        const estadoColor = constancia.estado === "ATENDIDO" ? "#059669" : constancia.estado === "PENDIENTE" ? "#d97706" : "#dc2626";
        const estadoBg    = constancia.estado === "ATENDIDO" ? "#d1fae5" : constancia.estado === "PENDIENTE" ? "#fef3c7" : "#fee2e2";
        const rows = [
            ["N° de Constancia",    constancia.numero],
            ["Tipo de Trámite",     constancia.tipo_solicitud],
            ["Solicitante",         constancia.solicitante.toUpperCase()],
            ["Fecha de Solicitud",  formatFecha(constancia.fecha_solicitud)],
            ["Fecha de Atención",   formatFecha(constancia.fecha_atencion)],
            ["Cant. de Copias",     `${constancia.cantidad_documentos} copia${constancia.cantidad_documentos !== 1 ? "s" : ""}`],
            ["Total Liquidado",     `S/ ${Number(constancia.total).toFixed(2)}`],
            ...(constancia.atendido_por ? [["Atendido por", constancia.atendido_por.toUpperCase()]] : []),
        ];

        const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Comprobante de Verificación N° ${constancia.numero}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; color: #1e293b; padding: 40px; font-size: 13px; line-height: 1.5; }
    .header { display: flex; align-items: center; gap: 18px; border-bottom: 2px solid #1e293b; padding-bottom: 16px; margin-bottom: 24px; }
    .header img { width: 60px; height: 60px; }
    .header-text h1 { font-size: 15px; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; }
    .header-text p  { font-size: 10px; text-transform: uppercase; letter-spacing: .12em; color: #64748b; margin-top: 2px; }
    .header-right   { margin-left: auto; text-align: right; }
    .header-right .doc-title { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .1em; color: #64748b; }
    .header-right .doc-sub   { font-size: 14px; font-weight: 900; text-transform: uppercase; }
    .estado-box { border: 2px solid ${estadoColor}; background: ${estadoBg}; border-radius: 8px; padding: 14px 20px; margin-bottom: 24px; display: flex; align-items: center; gap: 14px; }
    .estado-box .emoji { font-size: 28px; }
    .estado-box .estado-label { font-size: 14px; font-weight: 900; text-transform: uppercase; color: ${estadoColor}; }
    .estado-box .estado-desc  { font-size: 11px; color: #475569; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
    td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; }
    td:first-child { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: .1em; color: #94a3b8; width: 170px; padding-top: 11px; vertical-align: top; }
    td:last-child  { font-weight: 700; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 14px; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }
    .footer strong { display: block; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; color: #64748b; margin-bottom: 2px; }
    .watermark { text-align: center; font-size: 9px; color: #cbd5e1; text-transform: uppercase; letter-spacing: .15em; margin-top: 18px; }
    .toolbar { position: fixed; top: 24px; right: 24px; display: flex; gap: 10px; z-index: 9999; }
    .toolbar button { font-family: Arial, sans-serif; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; padding: 12px 18px; border-radius: 999px; cursor: pointer; border: 1px solid #e2e8f0; background: #fff; color: #475569; }
    .toolbar button.primary { background: #0f172a; color: #fff; border-color: #0f172a; }
    @media print { body { padding: 28px; } .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <button type="button" onclick="window.close()">Cerrar</button>
    <button type="button" class="primary" onclick="window.print()">Imprimir</button>
  </div>
  <div class="header">
    <img src="${window.location.origin}${logoRuta}" alt="Logo" />
    <div class="header-text">
      <p>República del Perú</p>
      <h1>Municipalidad Distrital de La Unión</h1>
      <p>Oficina de Registro Civil</p>
    </div>
    <div class="header-right">
      <div class="doc-title">Documento</div>
      <div class="doc-sub">Comprobante de Verificación</div>
    </div>
  </div>

  <div class="estado-box">
    <div class="emoji">${estadoEmoji}</div>
    <div>
      <div class="estado-label">Constancia ${constancia.numero} — ${est.label}</div>
      <div class="estado-desc">${est.description}</div>
    </div>
  </div>

  <table>
    ${rows.map(([label, val]) => `<tr><td>${label}</td><td>${val}</td></tr>`).join("")}
  </table>

  <div class="footer">
    <div>
      <strong>Verificado digitalmente el</strong>
      ${verifiedAt}
      <br/>URL: ${window.location.href}
    </div>
    <div style="text-align:right">
      <strong>Oficina de Registro Civil</strong>
      Municipalidad Distrital de La Unión<br/>
      Tarma, Perú
    </div>
  </div>

  <div class="watermark">
    Este comprobante confirma la verificación del documento en la fecha indicada.<br/>
    No reemplaza a la constancia oficial emitida por la Oficina de Registro Civil.
  </div>

</body>
</html>`;

        const win = window.open("", "_blank");
        if (!win) return;
        win.document.write(html);
        win.document.close();
    };

    return (
        <>
            {/* ── Vista normal (pantalla) ──────────────────────────── */}
            <div className="min-h-screen flex flex-col lg:flex-row font-sans">

                {/* Panel izquierdo */}
                <div className="lg:w-2/5 flex flex-col items-center justify-center px-10 py-14 text-white text-center relative overflow-hidden"
                    style={{ background: "linear-gradient(160deg, #0c1f3a 0%, #0f2744 55%, #1a3a5c 100%)" }}>

                    {/* Blobs decorativos */}
                    <div className="absolute -bottom-28 -right-28 size-105 rounded-full"
                        style={{ background: "radial-gradient(circle, rgba(30,80,140,0.55) 0%, transparent 70%)" }} />
                    <div className="absolute -top-20 -left-20 size-80 rounded-full"
                        style={{ background: "radial-gradient(circle, rgba(20,60,110,0.5) 0%, transparent 70%)" }} />
                    <div className="absolute top-16 right-8 size-40 rounded-full"
                        style={{ background: "radial-gradient(circle, rgba(40,100,180,0.2) 0%, transparent 70%)" }} />

                    {/* Puntos flotantes */}
                    <div className="absolute bottom-[38%] left-10 w-2.5 h-2.5 rounded-full bg-blue-400/70" />
                    <div className="absolute bottom-[34%] left-20 w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
                    <div className="absolute top-[30%] right-16 w-2 h-2 rounded-full bg-white/30" />
                    <div className="absolute top-[38%] right-24 w-1 h-1 rounded-full bg-blue-300/50" />
                    <div className="absolute bottom-[20%] right-12 w-1.5 h-1.5 rounded-full bg-slate-400/40" />
                    <div className="absolute top-[55%] left-8 w-1 h-1 rounded-full bg-white/20" />

                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoRuta} alt="Logo" className="w-20 h-20 mx-auto mb-6 drop-shadow-lg relative object-contain" />
                    <h1 className="text-xl font-black uppercase tracking-widest leading-snug mb-2 relative">
                        Municipalidad Distrital<br />de La Unión
                    </h1>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-300 mb-10 relative">
                        Oficina de Registro Civil
                    </p>

                    <div className="w-px h-10 bg-white/20 mx-auto mb-10 relative" />

                    {/* Número consultado */}
                    <div className="bg-white/10 border border-white/20 rounded-2xl px-8 py-5 mb-10 relative">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300 mb-1.5">Constancia consultada</p>
                        <p className="text-4xl font-black font-mono tracking-widest text-white">{numFmt}</p>
                    </div>

                    <button
                        onClick={() => router.push("/verificar")}
                        className="flex items-center gap-2 text-xs font-bold text-blue-300 hover:text-white transition-colors uppercase tracking-widest relative"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Verificar otro código
                    </button>

                    <p className="mt-14 text-[10px] font-bold uppercase tracking-widest text-white/25 relative">
                        Sistema STDU v1.0 · Tarma, Perú
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
                        {!loading && result?.valido && constancia && est && (
                            <div className="space-y-4">
                                {/* Banner — color según estado */}
                                <div className={`${est.bannerBg} rounded-2xl px-5 py-4 flex items-center gap-4 shadow-lg`}>
                                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                                        <est.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className={`${est.bannerText} font-black text-sm uppercase tracking-wide`}>
                                            Constancia encontrada — {est.label}
                                        </p>
                                        <p className={`${est.bannerSub} text-[11px] mt-0.5`}>
                                            {est.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Aviso si no está atendido aún */}
                                {constancia.estado === "PENDIENTE" && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-3">
                                        <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-amber-800 leading-relaxed">
                                            El trámite aún no ha sido entregado. Puede volver a consultar cuando el personal de la municipalidad lo atienda.
                                        </p>
                                    </div>
                                )}
                                {constancia.estado === "ANULADO" && (
                                    <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex gap-3">
                                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-rose-800 leading-relaxed">
                                            Esta constancia fue anulada. Si tiene dudas, comuníquese con la Oficina de Registro Civil.
                                        </p>
                                    </div>
                                )}

                                {/* Card datos */}
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                    <div className="px-5 pt-5 pb-4 flex items-start justify-between border-b border-slate-100">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">N° de Constancia</p>
                                            <p className="text-3xl font-black font-mono tracking-widest text-slate-900">{constancia.numero}</p>
                                        </div>
                                        <span className={`mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-widest ${est.chip}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${est.dot}`} />
                                            {est.label}
                                        </span>
                                    </div>

                                    <div className="px-5 pb-5">
                                        <DataRow icon={FileText}  label="Tipo de trámite"    value={constancia.tipo_solicitud} />
                                        <DataRow icon={User}      label="Solicitante"         value={<span className="uppercase">{constancia.solicitante}</span>} />
                                        <DataRow icon={Calendar}  label="Fecha de solicitud"  value={formatFecha(constancia.fecha_solicitud)} />
                                        <DataRow icon={Calendar}  label="Fecha de atención"   value={formatFecha(constancia.fecha_atencion)} />
                                        <DataRow icon={Hash}      label="Documentos"          value={`${constancia.cantidad_documentos} copia${constancia.cantidad_documentos !== 1 ? "s" : ""}`} />
                                        <DataRow icon={Banknote}  label="Total liquidado"     value={`S/ ${Number(constancia.total).toFixed(2)}`} />
                                        {constancia.atendido_por && (
                                            <DataRow icon={UserCheck} label="Atendido por" value={<span className="uppercase">{constancia.atendido_por}</span>} />
                                        )}
                                    </div>
                                </div>

                                {/* Botón imprimir — solo si ATENDIDO */}
                                {est.canPrint && (
                                    <button
                                        onClick={handlePrint}
                                        className="w-full bg-[#0f2744] hover:bg-[#1a3a5c] active:scale-[0.98] text-white font-black uppercase tracking-widest text-xs py-3.5 rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-md shadow-slate-900/20"
                                    >
                                        <Printer className="w-4 h-4" />
                                        Imprimir comprobante de verificación
                                    </button>
                                )}

                                <div className="flex items-center gap-2 px-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                    <p className="text-[11px] text-slate-400 leading-relaxed">
                                        Información verificada contra el registro oficial de la Oficina de Registro Civil.
                                    </p>
                                </div>
                            </div>
                        )}

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
                                        Verifique que el número impreso en su documento sea correcto o comuníquese con la Oficina de Registro Civil.
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
        </>
    );
}
