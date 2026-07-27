"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
    AlertTriangle,
    CheckCircle2,
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

const MAX_BYTES = 2 * 1024 * 1024;

const DEFINICIONES: Record<LogoTipo, {
    titulo: string;
    descripcion: string;
    nombre: LogoConfig["nombre"];
}> = {
    principal: {
        titulo: "Logo principal",
        descripcion: "Se utiliza en el acceso, el portal de verificación y los documentos impresos.",
        nombre: "Logo_MDUnion.svg",
    },
    blanco: {
        titulo: "Logo para fondos oscuros",
        descripcion: "Se utiliza en el menú lateral, tanto expandido como contraído.",
        nombre: "Logo_blanco.svg",
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
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<LogoTipo | null>(null);

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
            try {
                setLogos(await configuracionService.getLogos());
            } catch {
                toast.error("No se pudo cargar la identidad visual");
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
        if (file.name !== esperado) {
            toast.error(`El archivo debe llamarse exactamente ${esperado}.`);
            return;
        }
        if (file.type !== "image/svg+xml") {
            toast.error("Solo se acepta un archivo SVG.");
            return;
        }
        if (file.size > MAX_BYTES) {
            toast.error("El archivo SVG no puede superar 2 MB.");
            return;
        }

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
            toast.success(`${actualizado.nombre} fue reemplazado correctamente.`);
        } catch (error: unknown) {
            toast.error(mensajeError(error));
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
                        Identidad visual
                    </h1>
                </div>
                <p className="max-w-3xl text-sm text-muted-foreground">
                    Actualice los logos institucionales sin cambiar sus nombres ni rutas.
                    El reemplazo se aplica en el acceso, el menú, el portal y los documentos.
                </p>
            </header>

            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div className="space-y-1 text-sm">
                    <p className="font-semibold">El nombre del archivo es obligatorio.</p>
                    <p className="text-xs leading-5 text-amber-900/80">
                        Al cargar otro archivo con este mismo nombre, el logo anterior será
                        reemplazado y el cambio se aplicará en todo el sistema.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex min-h-64 items-center justify-center rounded-2xl border border-border bg-card">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Cargando identidad visual...
                    </div>
                </div>
            ) : logos ? (
                <div className="grid gap-6 lg:grid-cols-2">
                    {(Object.keys(DEFINICIONES) as LogoTipo[]).map((tipo) => {
                        const definicion = DEFINICIONES[tipo];
                        const logo = logos[tipo];
                        const preview = previews[tipo] || logo.ruta;
                        const seleccionado = archivos[tipo];
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
                                                {definicion.titulo}
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

                                <div className="space-y-5 p-5">
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
                                        <span className={`absolute bottom-3 left-3 rounded-md px-2 py-1 text-[10px] font-medium ${
                                            esBlanco
                                                ? "bg-white/10 text-white/70"
                                                : "bg-white/90 text-slate-500 shadow-sm"
                                        }`}>
                                            Vista previa
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-3 text-xs">
                                            <span className="font-mono font-semibold text-foreground">
                                                {definicion.nombre}
                                            </span>
                                            <span className="text-muted-foreground">SVG · máx. 2 MB</span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">
                                            Última actualización: {formatearFecha(logo.fecha_modificacion)}
                                        </p>
                                    </div>

                                    <label
                                        htmlFor={`logo-${tipo}`}
                                        className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus-within:ring-2 focus-within:ring-primary/40"
                                    >
                                        <Upload className="h-4 w-4" />
                                        {seleccionado ? seleccionado.name : `Seleccionar ${definicion.nombre}`}
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
                                                Reemplazando...
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw className="h-4 w-4" />
                                                Reemplazar logo
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </section>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
                    No se pudo mostrar la identidad visual. Recargue la página o contacte
                    al encargado de la Oficina de Informática.
                </div>
            )}
        </div>
    );
}
