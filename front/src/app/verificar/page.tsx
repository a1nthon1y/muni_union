"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Search, ArrowRight } from "lucide-react";

export default function VerificarIndexPage() {
    const router = useRouter();
    const [codigo, setCodigo] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const limpio = codigo.trim().replace(/\D/g, ""); // solo dígitos
        if (!limpio) {
            setError("Ingrese el número de constancia.");
            return;
        }
        setError("");
        router.push(`/verificar/${limpio.padStart(6, "0")}`);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">

            {/* Header institucional */}
            <div className="w-full max-w-md mb-8 text-center">
                <div className="flex justify-center mb-3">
                    <img src="/Logo_MDUnion.svg" alt="Logo" className="w-16 h-16" />
                </div>
                <h1 className="text-xl font-black uppercase tracking-widest text-slate-900">
                    Municipalidad Distrital de La Unión
                </h1>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
                    Oficina de Registro Civil
                </p>
            </div>

            {/* Card */}
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">

                {/* Cabecera */}
                <div className="bg-slate-900 px-6 py-5 flex items-center gap-4">
                    <ShieldCheck className="w-9 h-9 text-white shrink-0" />
                    <div>
                        <p className="text-white font-black text-base uppercase tracking-wide">
                            Verificación de Constancia
                        </p>
                        <p className="text-slate-400 text-xs font-semibold mt-0.5 uppercase tracking-widest">
                            Compruebe la autenticidad de su documento
                        </p>
                    </div>
                </div>

                {/* Formulario */}
                <div className="p-6 space-y-5">
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Ingrese el <span className="font-black text-slate-900">número de constancia</span> impreso
                        en su documento (ej.&nbsp;<span className="font-mono font-bold">000001</span>).
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label
                                htmlFor="codigo"
                                className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5"
                            >
                                N° de Constancia
                            </label>
                            <input
                                id="codigo"
                                type="text"
                                inputMode="numeric"
                                maxLength={10}
                                value={codigo}
                                onChange={(e) => {
                                    setCodigo(e.target.value);
                                    setError("");
                                }}
                                placeholder="000001"
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-2xl font-black font-mono tracking-[0.3em] text-slate-900 placeholder:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-center"
                                autoFocus
                            />
                            {error && (
                                <p className="mt-1.5 text-xs font-bold text-rose-600">{error}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-slate-900 hover:bg-slate-700 text-white font-black uppercase tracking-widest text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                            <Search className="w-4 h-4" />
                            Verificar Constancia
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>
                </div>

                {/* Pie */}
                <div className="border-t border-slate-100 px-6 py-4 bg-slate-50">
                    <p className="text-[10px] text-slate-400 font-medium text-center leading-relaxed">
                        Este servicio permite verificar la autenticidad de constancias de trámite
                        emitidas por la Oficina de Registro Civil.
                    </p>
                </div>
            </div>

            <p className="mt-6 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                Sistema STDU · Municipalidad Distrital de La Unión
            </p>
        </div>
    );
}
