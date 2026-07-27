"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
    AlertTriangle,
    CheckCircle2,
    FileWarning,
    ImageIcon,
    Loader2,
    RefreshCw,
    ShieldAlert,
    Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import {
    configuracionService,
    LogoConfig,
    LogoTipo,
} from "@/services/configuracion.service";
import {
    LOGOS_INSTITUCIONALES,
    logosInstitucionalesPorDefecto,
    validarArchivoLogo,
} from "@/lib/logo-institucional";

const DEFINICIONES: Record<LogoTipo, {
    titulo: string;
    descripcion: string;
    nombre: LogoConfig["nombre"];
    uso: string;
}> = {
    principal: {
        titulo: LOGOS_INSTITUCIONALES.principal.titulo,
        descripcion: LOGOS_INSTITUCIONALES.principal.uso,
        nombre: LOGOS_INSTITUCIONALES.principal.nombreArchivo,
        uso: LOGOS_INSTITUCIONALES.principal.uso,
    },
    blanco: {
        titulo: LOGOS_INSTITUCIONALES.blanco.titulo,
        descripcion: LOGOS_INSTITUCIONALES.blanco.uso,
        nombre: LOGOS_INSTITUCIONALES.blanco.nombreArchivo,
        uso: LOGOS_INSTITUCIONALES.blanco.uso,
    },
};

const mensajeError = (error: unknown) =>
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message
    || "No se pudo reemplazar el logo. El archivo anterior continúa disponible.";

const formatearFecha = (fecha: string | null) => {
    if (!fecha) return "Archivo incluido con el sistema";
    return new Intl.DateTimeFormat("es-PE", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(fecha));
};

export default function ConfiguracionPage() {
    const router = useRouter();
    const currentUser = useAuthStore((s) => s.usuario);
    const [logos, setLogos] = useState<Record<LogoTipo, LogoConfig> | null>(null);
    const [archivos, setArchivos] = useState<Partial<Record<LogoTipo, File>>>({});
    const [previews, setPreviews] = useState<Partial<Record<LogoTipo, string>>>({});
    const [erroresArchivo, setErroresArchivo] = useState<Partial<Record<LogoTipo, string>>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<LogoTipo | null>(null);
    const [avisoCarga, setAvisoCarga] = useState<string | null>(null);
    const [errorFatal, setErrorFatal] = useState<string | null>(null);

    useEffect(() => {
        if (currentUser && currentUser.rol_id !== 1) {
            toast.error("No tiene permisos para acceder a esta sección");
            router.push("/dashboard");
        }
    }, [currentUser, router]);

    useEffect(() => {
        if (currentUser?.rol_id !== 1) return;
        const load = async () => {
            setLoading(true);
            setAvisoCarga(null);
            setErrorFatal(null);
            try {
                setLogos(await configuracionService.getLogos());
            } catch (error: unknown) {
                const status = (error as { response?: { status?: number } })?.response?.status;
                if (status === 401 || status === 403) {
                    setErrorFatal(
                        "Su sesión no tiene permisos de administrador para consultar los logos.",
                    );
                    return;
                }
                setLogos(logosInstitucionalesPorDefecto());
                setAvisoCarga(
                    "No se pudo consultar el estado de los logos en el servidor. "
                    + "Puede seleccionar y reemplazar los archivos con normalidad.",
                );
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [currentUser]);

    useEffect(() => () => {
        Object.values(previews).forEach((preview) => {
            if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
        });
    }, [previews]);

    const seleccionarArchivo = (tipo: LogoTipo, file?: File) => {
        if (!file) return;
        const esperado = DEFINICIONES[tipo].nombre;
        const error = validarArchivoLogo(file, esperado);

        if (error) {
            setErroresArchivo((actual) => ({ ...actual, [tipo]: error }));
            setArchivos((actual) => {
                const siguiente = { ...actual };
                delete siguiente[tipo];
                return siguiente;
            });
            const anterior = previews[tipo];
            if (anterior?.startsWith("blob:")) URL.revokeObjectURL(anterior);
            setPreviews((actual) => {
                const siguiente = { ...actual };
                delete siguiente[tipo];
                return siguiente;
            });
            return;
        }

        setErroresArchivo((actual) => {
            const siguiente = { ...actual };
            delete siguiente[tipo];
            return siguiente;
        });

        const anterior = previews[tipo];
        if (anterior?.startsWith("blob:")) URL.revokeObjectURL(anterior);
        setArchivos((actual) => ({ ...actual, [tipo]: file }));
        setPreviews((actual) => ({
            ...actual,
            [tipo]: URL.createObjectURL(file),
        }));
    };

    const reemplazarLogo = async (tipo: LogoTipo) => {
        const file = archivos[tipo];
        if (!file) return;

        const errorLocal = validarArchivoLogo(file, DEFINICIONES[tipo].nombre);
        if (errorLocal) {
            setErroresArchivo((actual) => ({ ...actual, [tipo]: errorLocal }));
            return;
        }

        setSaving(tipo);
        try {
            const actualizado = await configuracionService.updateLogo(tipo, file);
            const previewAnterior = previews[tipo];
            if (previewAnterior?.startsWith("blob:")) URL.revokeObjectURL(previewAnterior);
            setLogos((actual) => actual
                ? { ...actual, [tipo]: actualizado }
                : actual);
            setArchivos((actual) => {
                const siguiente = { ...actual };
                delete siguiente[tipo];
                return siguiente;
            });
            setPreviews((actual) => ({
                ...actual,
                [tipo]: `${actualizado.ruta}?v=${Date.now()}`,
            }));
            toast.success(
                `${actualizado.nombre} fue reemplazado. El cambio se verá en todo el sistema.`,
            );
        } catch (error: unknown) {
            const mensaje = mensajeError(error);
            setErroresArchivo((actual) => ({ ...actual, [tipo]: mensaje }));
            toast.error(mensaje);
        } finally {
            setSaving(null);
        }
    };

    if (currentUser?.rol_id !== 1) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center text-center p-6">
                <ShieldAlert className="h-10 w-10 text-red-500 mb-4" />
                <h2 className="text-2xl font-semibold text-slate-800">Acceso restringido</h2>
                <p className="text-slate-500 mt-2">
                    Solo administradores pueden actualizar la identidad visual.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl space-y-7 animate-in fade-in duration-500">
            <header className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/20">
                        <ImageIcon className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                        Identidad visual — logos
                    </h1>
                </div>
                <p className="max-w-3xl text-sm text-muted-foreground">
                    Suba sus dos logos institucionales. Cada archivo debe tener el nombre
                    exacto indicado abajo. Al reemplazarlo, el sistema conserva la misma
                    ruta y el logo nuevo aparece en acceso, menú, portal e impresiones.
                </p>
            </header>

            <section
                aria-labelledby="instrucciones-logos"
                className="rounded-2xl border border-border bg-muted/40 px-4 py-4 md:px-5"
            >
                <h2
                    id="instrucciones-logos"
                    className="text-sm font-semibold text-foreground"
                >
                    Nombre obligatorio de cada imagen
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                    Formato: solo SVG · tamaño máximo: 2 MB. Si el nombre o el formato no
                    coinciden, la pantalla y el servidor rechazarán el archivo.
                </p>
                <ul className="mt-4 space-y-3 text-sm">
                    {(Object.keys(DEFINICIONES) as LogoTipo[]).map((tipo) => {
                        const def = DEFINICIONES[tipo];
                        return (
                            <li
                                key={tipo}
                                className="flex flex-col gap-1 rounded-xl border border-border bg-card px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div>
                                    <p className="font-medium text-foreground">{def.titulo}</p>
                                    <p className="text-xs text-muted-foreground">{def.uso}</p>
                                </div>
                                <code className="mt-1 shrink-0 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white sm:mt-0">
                                    {def.nombre}
                                </code>
                            </li>
                        );
                    })}
                </ul>
            </section>

            {avisoCarga ? (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <p>{avisoCarga}</p>
                </div>
            ) : null}

            {errorFatal ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
                    {errorFatal}
                </div>
            ) : null}

            {loading ? (
                <div className="flex min-h-64 items-center justify-center rounded-2xl border border-border bg-card">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Cargando logos actuales...
                    </div>
                </div>
            ) : errorFatal ? null : logos ? (
                <div className="grid gap-6 lg:grid-cols-2">
                    {(Object.keys(DEFINICIONES) as LogoTipo[]).map((tipo) => {
                        const definicion = DEFINICIONES[tipo];
                        const logo = logos[tipo];
                        const preview = previews[tipo] || logo.ruta;
                        const seleccionado = archivos[tipo];
                        const errorArchivo = erroresArchivo[tipo];
                        const esBlanco = tipo === "blanco";

                        return (
                            <section
                                key={tipo}
                                className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                            >
                                <div className="border-b border-border px-5 py-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h2 className="font-semibold text-foreground">
                                                Insertar: {definicion.nombre}
                                            </h2>
                                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                                {definicion.descripcion}
                                            </p>
                                        </div>
                                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            {logo.personalizado ? "Personalizado" : "Predeterminado"}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4 p-5">
                                    <div
                                        className={`relative flex h-44 items-center justify-center overflow-hidden rounded-xl border ${
                                            esBlanco
                                                ? "border-slate-700 bg-slate-950"
                                                : "border-slate-200 bg-white"
                                        }`}
                                        style={!esBlanco ? {
                                            backgroundImage:
                                                "linear-gradient(45deg,#f1f5f9 25%,transparent 25%),linear-gradient(-45deg,#f1f5f9 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#f1f5f9 75%),linear-gradient(-45deg,transparent 75%,#f1f5f9 75%)",
                                            backgroundPosition: "0 0,0 8px,8px -8px,-8px 0",
                                            backgroundSize: "16px 16px",
                                        } : undefined}
                                    >
                                        <Image
                                            src={preview}
                                            alt={`Vista previa de ${definicion.titulo.toLowerCase()}`}
                                            width={260}
                                            height={120}
                                            unoptimized
                                            className="max-h-28 w-auto max-w-[75%] object-contain"
                                        />
                                    </div>

                                    <p className="text-[11px] text-muted-foreground">
                                        Última actualización: {formatearFecha(logo.fecha_modificacion)}
                                    </p>

                                    {errorArchivo ? (
                                        <div
                                            role="alert"
                                            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-900"
                                        >
                                            <FileWarning className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                                            <p>{errorArchivo}</p>
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-950">
                                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                                            <p>
                                                Seleccione un archivo que se llame exactamente{" "}
                                                <span className="font-mono font-semibold">
                                                    {definicion.nombre}
                                                </span>
                                                .
                                            </p>
                                        </div>
                                    )}

                                    <label
                                        htmlFor={`logo-${tipo}`}
                                        className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus-within:ring-2 focus-within:ring-primary/40"
                                    >
                                        <Upload className="h-4 w-4" />
                                        {seleccionado
                                            ? seleccionado.name
                                            : `Elegir archivo ${definicion.nombre}`}
                                        <input
                                            id={`logo-${tipo}`}
                                            aria-label={`Seleccionar ${definicion.nombre}`}
                                            type="file"
                                            accept=".svg,image/svg+xml"
                                            className="sr-only"
                                            onChange={(event) => seleccionarArchivo(
                                                tipo,
                                                event.target.files?.[0],
                                            )}
                                        />
                                    </label>

                                    <Button
                                        type="button"
                                        onClick={() => reemplazarLogo(tipo)}
                                        disabled={!seleccionado || saving !== null}
                                        className="h-11 w-full rounded-xl text-xs font-semibold"
                                        aria-label={`Reemplazar ${definicion.nombre}`}
                                    >
                                        {saving === tipo ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw className="h-4 w-4" />
                                                Reemplazar y aplicar en todo el sistema
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </section>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
}
