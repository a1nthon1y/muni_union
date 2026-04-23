import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
    return (
        <div className="min-h-screen flex flex-col lg:flex-row">

            {/* Panel izquierdo — institucional */}
            <div className="hidden lg:flex lg:w-2/5 bg-[#0f2744] flex-col items-center justify-center px-12 py-16 text-white text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/Logo_MDUnion.svg"
                    alt="Logo Municipalidad"
                    className="w-24 h-24 mb-8 drop-shadow-lg"
                />
                <h1 className="text-2xl font-black uppercase tracking-widest leading-snug mb-3">
                    Municipalidad<br />Distrital de La Unión
                </h1>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-300 mb-12">
                    Oficina de Registro Civil
                </p>

                <div className="w-px h-12 bg-white/20 mb-12" />

                <div className="space-y-7 text-left max-w-xs w-full">
                    {[
                        { icon: "📋", title: "Registro de Actas", desc: "Nacimiento, matrimonio y defunción del distrito." },
                        { icon: "🔍", title: "Búsqueda avanzada", desc: "Localice cualquier registro por nombre, DNI o código." },
                        { icon: "📄", title: "Constancias digitales", desc: "Emisión de documentos con código de verificación." },
                    ].map((f) => (
                        <div key={f.title} className="flex gap-4 items-start">
                            <span className="text-2xl mt-0.5">{f.icon}</span>
                            <div>
                                <p className="font-bold text-sm text-white">{f.title}</p>
                                <p className="text-xs text-blue-200/75 mt-0.5 leading-relaxed">{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <p className="mt-16 text-[10px] font-bold uppercase tracking-widest text-white/20">
                    Sistema STDU v2.0 · Piura, Perú
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
