import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
    return (
        <div className="min-h-screen flex flex-col lg:flex-row">

            {/* Panel izquierdo — institucional */}
            <div
                className="hidden lg:flex lg:w-2/5 flex-col items-center justify-center px-12 py-16 text-white text-center relative overflow-hidden"
                style={{
                    background: "linear-gradient(160deg, #0c1f3a 0%, #0f2744 55%, #1a3a5c 100%)",
                }}
            >
                {/* Patrón de puntos decorativo */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
                        backgroundSize: "28px 28px",
                    }}
                />
                {/* Círculo decorativo grande de fondo */}
                <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full border border-white/5" />
                <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full border border-white/5" />
                <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full border border-white/5" />

                {/* Logo principal — grande y prominente */}
                <div className="relative mb-8">
                    <div className="w-40 h-40 rounded-full border-2 border-white/15 flex items-center justify-center bg-white/5 shadow-2xl">
                        <div className="w-32 h-32 rounded-full border border-white/10 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/Logo_MDUnion.svg"
                                alt="Logo Municipalidad"
                                className="w-24 h-24 drop-shadow-lg"
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
                    Sistema STDU v2.0 · Tarma, Perú
                </p>
            </div>

            {/* Panel derecho — formulario */}
            <div className="flex-1 flex items-center justify-center bg-background p-6 lg:p-12">
                <div className="w-full max-w-md">
                    {/* Logo visible solo en mobile */}
                    <div className="flex justify-center mb-8 lg:hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/Logo_MDUnion.svg" alt="Logo" className="w-20 h-20" />
                    </div>
                    <LoginForm />
                </div>
            </div>
        </div>
    );
}
