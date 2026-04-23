"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, Lock } from "lucide-react";

export default function VerificarIndexPage() {
    const router = useRouter();
    const [codigo, setCodigo] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const limpio = codigo.trim().replace(/\D/g, "");
        if (!limpio) {
            setError("Ingrese el número de constancia.");
            return;
        }
        setError("");
        router.push(`/verificar/${limpio.padStart(6, "0")}`);
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row font-sans">

            {/* Panel izquierdo — institucional */}
            <div className="lg:w-2/5 flex flex-col items-center justify-center px-10 py-14 text-white text-center relative overflow-hidden"
                style={{ background: "linear-gradient(160deg, #0c1f3a 0%, #0f2744 55%, #1a3a5c 100%)" }}>

                {/* Blobs decorativos */}
                <div className="absolute -bottom-28 -right-28 w-[420px] h-[420px] rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(30,80,140,0.55) 0%, transparent 70%)" }} />
                <div className="absolute -top-20 -left-20 w-[320px] h-[320px] rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(20,60,110,0.5) 0%, transparent 70%)" }} />
                <div className="absolute top-16 right-8 w-[160px] h-[160px] rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(40,100,180,0.2) 0%, transparent 70%)" }} />

                {/* Puntos flotantes */}
                <div className="absolute bottom-[38%] left-10 w-2.5 h-2.5 rounded-full bg-blue-400/70" />
                <div className="absolute bottom-[34%] left-20 w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
                <div className="absolute top-[30%] right-16 w-2 h-2 rounded-full bg-white/30" />
                <div className="absolute top-[38%] right-24 w-1 h-1 rounded-full bg-blue-300/50" />
                <div className="absolute bottom-[20%] right-12 w-1.5 h-1.5 rounded-full bg-slate-400/40" />
                <div className="absolute top-[55%] left-8 w-1 h-1 rounded-full bg-white/20" />

                <div className="relative mb-6">
                    <img src="/Logo_MDUnion.svg" alt="Logo" className="w-20 h-20 mx-auto drop-shadow-lg" />
                </div>
                <h1 className="text-xl font-black uppercase tracking-widest leading-snug mb-2">
                    Municipalidad Distrital<br />de La Unión
                </h1>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-300 mb-10">
                    Oficina de Registro Civil
                </p>

                <div className="w-px h-12 bg-white/20 mx-auto mb-10" />

                <div className="space-y-6 text-left max-w-xs">
                    {[
                        { icon: "🔍", title: "Verificación en tiempo real", desc: "Consulte el estado de cualquier constancia de trámite emitida." },
                        { icon: "🔒", title: "Sin registro requerido", desc: "Servicio público y gratuito, sin necesidad de cuenta." },
                        { icon: "✅", title: "Resultado instantáneo", desc: "Confirme la autenticidad del documento en segundos." },
                    ].map((f) => (
                        <div key={f.title} className="flex gap-4 items-start">
                            <div className="text-2xl mt-0.5">{f.icon}</div>
                            <div>
                                <p className="font-bold text-sm text-white">{f.title}</p>
                                <p className="text-xs text-blue-200/80 mt-0.5 leading-relaxed">{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <p className="mt-14 text-[10px] font-bold uppercase tracking-widest text-white/25">
                    Sistema STDU v1.0 · Tarma, Perú
                </p>
            </div>

            {/* Panel derecho — formulario */}
            <div className="flex-1 bg-slate-50 flex flex-col items-center justify-center px-6 py-14">
                <div className="w-full max-w-sm">

                    {/* Encabezado formulario */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-[#0f2744] flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
                                Verificar constancia
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Ingrese el código impreso en su documento
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Input código */}
                        <div>
                            <label
                                htmlFor="codigo"
                                className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2"
                            >
                                N° de Constancia
                            </label>
                            <input
                                id="codigo"
                                type="text"
                                inputMode="numeric"
                                maxLength={10}
                                value={codigo}
                                onChange={(e) => { setCodigo(e.target.value); setError(""); }}
                                placeholder="000001"
                                autoFocus
                                className={`w-full bg-white border-2 rounded-2xl px-5 py-4 text-3xl font-black font-mono tracking-[0.35em] text-slate-900 placeholder:text-slate-200 focus:outline-none transition-all text-center shadow-sm ${
                                    error
                                        ? "border-rose-400 focus:border-rose-500"
                                        : "border-slate-200 focus:border-[#0f2744]"
                                }`}
                            />
                            {error ? (
                                <p className="mt-2 text-xs font-bold text-rose-500 flex items-center gap-1">
                                    <span>⚠</span> {error}
                                </p>
                            ) : (
                                <p className="mt-2 text-[11px] text-slate-400">
                                    Ejemplo: <span className="font-mono font-bold text-slate-600">000042</span> — solo el número, sin letras.
                                </p>
                            )}
                        </div>

                        {/* Botón */}
                        <button
                            type="submit"
                            className="w-full bg-[#0f2744] hover:bg-[#1a3a5c] active:scale-[0.98] text-white font-black uppercase tracking-widest text-sm py-4 rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-md shadow-slate-900/20"
                        >
                            Verificar constancia
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    {/* Info pie */}
                    <div className="mt-8 flex items-start gap-3 bg-white border border-slate-100 rounded-2xl px-4 py-3.5 shadow-sm">
                        <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                            Este portal solo muestra información de confirmación de autenticidad. No expone datos personales del solicitante.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
