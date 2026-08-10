"use client";

import LoginForm from "@/components/auth/LoginForm";
import { useLogosConfig, obtenerRutaLogoDinamica } from "@/lib/logo-institucional";

export default function LoginPage() {
    const { logos: logosConfig } = useLogosConfig();
    const logoRuta = obtenerRutaLogoDinamica("principal", logosConfig);

    return (
        <div className="min-h-screen flex flex-col lg:flex-row">

            {/* Panel izquierdo — institucional */}
            <div
                className="hidden lg:flex lg:w-2/5 flex-col items-center justify-center px-12 py-16 text-white text-center relative overflow-hidden"
                style={{
                    background: "linear-gradient(160deg, #0c1f3a 0%, #0f2744 55%, #1a3a5c 100%)",
                }}
            >
                {/* Blob grande — esquina inferior derecha */}
                <div className="absolute -bottom-28 -right-28 w-[420px] h-[420px] rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(30,80,140,0.55) 0%, transparent 70%)" }} />
                {/* Blob mediano — esquina superior izquierda */}
                <div className="absolute -top-20 -left-20 w-[320px] h-[320px] rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(20,60,110,0.5) 0%, transparent 70%)" }} />
                {/* Blob pequeño — zona central-alta derecha */}
                <div className="absolute top-16 right-8 w-[160px] h-[160px] rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(40,100,180,0.2) 0%, transparent 70%)" }} />
 
                {/* Puntos flotantes decorativos */}
                <div className="absolute bottom-[38%] left-10 w-2.5 h-2.5 rounded-full bg-blue-400/70" />
                <div className="absolute bottom-[34%] left-20 w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
                <div className="absolute top-[30%] right-16 w-2 h-2 rounded-full bg-white/30" />
                <div className="absolute top-[38%] right-24 w-1 h-1 rounded-full bg-blue-300/50" />
                <div className="absolute bottom-[20%] right-12 w-1.5 h-1.5 rounded-full bg-slate-400/40" />
                <div className="absolute top-[55%] left-8 w-1 h-1 rounded-full bg-white/20" />
 
                {/* Logo principal — grande y prominente */}
                <div className="relative mb-8">
                    <div className="w-40 h-40 rounded-full border-2 border-white/15 flex items-center justify-center bg-white/5 shadow-2xl">
                        <div className="w-32 h-32 rounded-full border border-white/10 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={logoRuta}
                                alt="Logo Municipalidad"
                                className="w-24 h-24 drop-shadow-lg object-contain"
                            />
                        </div>
                    </div>
                </div>

                <h1 className="text-2xl font-black uppercase tracking-widest leading-snug mb-2 relative">
                    Municipalidad<br />Distrital de La Unión
                </h1>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-300 mb-10 relative">
                    Oficina de Registro Civil
                </p>

                <div className="w-16 h-px bg-white/20 mb-10 relative" />

                <div className="space-y-6 text-left max-w-xs w-full relative">
                    {[
                        { icon: "📋", title: "Registro de Actas", desc: "Nacimiento, matrimonio y defunción del distrito." },
                        { icon: "🔍", title: "Búsqueda avanzada", desc: "Localice cualquier registro por nombre, DNI o código." },
                        { icon: "📄", title: "Constancias digitales", desc: "Emisión de documentos con código de verificación." },
                    ].map((f) => (
                        <div key={f.title} className="flex gap-4 items-start">
                            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-lg">
                                {f.icon}
                            </div>
                            <div>
                                <p className="font-bold text-sm text-white">{f.title}</p>
                                <p className="text-xs text-blue-200/70 mt-0.5 leading-relaxed">{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <p className="mt-14 text-[10px] font-bold uppercase tracking-widest text-white/20 relative">
                    Sistema STDU v1.0 · Tarma, Perú
                </p>
            </div>

            {/* Panel derecho — formulario */}
            <div className="flex-1 flex items-center justify-center bg-background p-6 lg:p-12">
                <div className="w-full max-w-md">
                    {/* Logo visible solo en mobile */}
                    <div className="flex justify-center mb-8 lg:hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={logoRuta} alt="Logo" className="w-20 h-20 object-contain" />
                    </div>
                    <LoginForm />
                </div>
            </div>
        </div>
    );
}
