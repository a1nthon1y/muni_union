"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Database,
    Download,
    ShieldAlert,
    Info,
    Clock,
    HardDrive,
    Table2,
    CheckCircle2,
    AlertCircle,
    Loader2,
    RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/utils/api";

interface BackupInfo {
    totalTablas: number;
    tamanio: string;
    version: string;
    metodBackup: string;
    pgDumpDisponible: boolean;
    entorno: "produccion" | "desarrollo";
}

const LS_KEY = "muni_union_ultimo_backup";

export default function BackupPage() {
    const router                          = useRouter();
    const currentUser                     = useAuthStore((s) => s.usuario);
    const [info, setInfo]                 = useState<BackupInfo | null>(null);
    const [loadingInfo, setLoadingInfo]   = useState(true);
    const [downloading, setDownloading]   = useState(false);
    const [ultimoBackup, setUltimoBackup] = useState<string | null>(null);

    // Seguridad: solo admin
    useEffect(() => {
        if (currentUser && currentUser.rol_id !== 1) {
            toast.error("No tiene permisos para acceder a esta sección");
            router.push("/dashboard");
        }
    }, [currentUser, router]);

    useEffect(() => {
        setUltimoBackup(localStorage.getItem(LS_KEY));
    }, []);

    const fetchInfo = async () => {
        setLoadingInfo(true);
        try {
            const { data } = await api.get("/backup/info");
            setInfo(data);
        } catch {
            toast.error("No se pudo obtener la información de la base de datos");
        } finally {
            setLoadingInfo(false);
        }
    };

    useEffect(() => {
        if (currentUser?.rol_id === 1) fetchInfo();
    }, [currentUser]);

    const handleDownload = async () => {
        setDownloading(true);
        try {
            // Llamada con axios pero recibiendo como blob para descarga
            const response = await api.get("/backup/download", {
                responseType: "blob",
            });

            const fecha    = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
            const filename = `backup_muni_union_${fecha}.sql`;

            const url  = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href  = url;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            const ahora = new Date().toLocaleString("es-PE", { timeZone: "America/Lima" });
            localStorage.setItem(LS_KEY, ahora);
            setUltimoBackup(ahora);

            toast.success("Backup descargado correctamente", {
                description: "Guarde el archivo en un lugar seguro.",
            });
        } catch {
            toast.error("Error al descargar el backup. Intente nuevamente.");
        } finally {
            setDownloading(false);
        }
    };

    if (currentUser?.rol_id !== 1) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center text-center p-6">
                <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center mb-4 border border-red-100 shadow-sm">
                    <ShieldAlert className="h-10 w-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Acceso Restringido</h2>
                <p className="text-slate-500 max-w-sm mt-2 font-medium">
                    Solo los administradores pueden generar respaldos de la base de datos.
                </p>
                <Button variant="outline" className="mt-6 font-semibold" onClick={() => router.push("/dashboard")}>
                    Volver al Dashboard
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 text-foreground">
                        <div className="bg-primary p-2.5 rounded-xl shadow-primary/20 shadow-lg">
                            <Database className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Respaldo de Base de Datos</h1>
                    </div>
                    <p className="text-muted-foreground font-medium text-xs ml-1">
                        Genera y descarga un backup completo del sistema para proteger la información.
                    </p>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5"
                    onClick={fetchInfo}
                    disabled={loadingInfo}
                    title="Actualizar información"
                >
                    <RefreshCw className={`h-4 w-4 ${loadingInfo ? "animate-spin" : ""}`} />
                </Button>
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InfoCard
                    icon={Table2}
                    label="Tablas en la BD"
                    value={loadingInfo ? "..." : `${info?.totalTablas ?? "—"} tablas`}
                    color="blue"
                />
                <InfoCard
                    icon={HardDrive}
                    label="Tamaño actual"
                    value={loadingInfo ? "..." : (info?.tamanio ?? "—")}
                    color="emerald"
                />
                <InfoCard
                    icon={Clock}
                    label="Último backup"
                    value={ultimoBackup ?? "Nunca"}
                    color="amber"
                    small
                />
            </div>

            {/* Método de backup */}
            {!loadingInfo && info && (
                <div className={`flex items-start gap-3 px-5 py-4 rounded-2xl border ${
                    info.pgDumpDisponible
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-amber-50 border-amber-200"
                }`}>
                    {info.pgDumpDisponible
                        ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                        : <AlertCircle  className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    }
                    <div>
                        <p className={`text-sm font-bold ${info.pgDumpDisponible ? "text-emerald-800" : "text-amber-800"}`}>
                            {info.entorno === "produccion" ? "Servidor de producción" : "Servidor de desarrollo"}
                        </p>
                        <p className={`text-xs mt-0.5 ${info.pgDumpDisponible ? "text-emerald-700" : "text-amber-700"}`}>
                            Método: <span className="font-bold">{info.metodBackup}</span>
                            {!info.pgDumpDisponible && " · Instale pg_dump para incluir el esquema completo."}
                            {" · "}{info.version}
                        </p>
                    </div>
                </div>
            )}

            {/* Card principal de descarga */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border bg-slate-50/50">
                    <div className="flex items-center gap-3 mb-1">
                        <Download className="h-5 w-5 text-primary" />
                        <h2 className="text-base font-bold text-foreground">Generar Backup SQL</h2>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Descarga un archivo <span className="font-bold">.sql</span> con toda la base de datos.
                        {" "}En servidor on-premise incluye schema y datos completos (via <code>pg_dump</code>).
                    </p>
                </div>

                <div className="p-6 space-y-5">
                    {/* Qué incluye */}
                    <div className="space-y-2">
                        <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Qué incluye</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {[
                                "Estructura de todas las tablas",
                                "Todos los registros de actas",
                                "Solicitudes y constancias",
                                "Usuarios y configuración",
                                "Personas registradas",
                                "Historial de auditoría",
                            ].map((item) => (
                                <div key={item} className="flex items-center gap-2 text-xs text-slate-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Aviso de seguridad */}
                    <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-800 leading-relaxed">
                            El archivo contiene <strong>datos confidenciales</strong>. Guárdelo en un medio seguro
                            (disco externo cifrado o almacenamiento protegido) y no lo comparta por canales no seguros.
                        </p>
                    </div>

                    {/* Botón */}
                    <Button
                        onClick={handleDownload}
                        disabled={downloading || loadingInfo}
                        className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2"
                    >
                        {downloading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Generando backup...
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4" />
                                DESCARGAR BACKUP AHORA
                            </>
                        )}
                    </Button>

                    <p className="text-center text-[10px] text-muted-foreground">
                        Se descargará como <code>backup_muni_union_FECHA.sql</code>
                    </p>
                </div>
            </div>

            {/* Instrucciones de restauración */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Database className="h-4 w-4 text-slate-500" />
                    Cómo restaurar el backup
                </h3>
                <div className="space-y-2">
                    {[
                        { n: "1", text: "Asegúrese de tener PostgreSQL instalado en el servidor destino." },
                        { n: "2", text: "Cree una base de datos vacía: CREATE DATABASE muni_union;" },
                        { n: "3", text: "Restaure con: psql -U postgres -d muni_union -f backup_muni_union_FECHA.sql" },
                        { n: "4", text: "Actualice el .env del backend con las nuevas credenciales si cambió el servidor." },
                    ].map(({ n, text }) => (
                        <div key={n} className="flex items-start gap-3 text-xs text-slate-600">
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-black shrink-0 mt-0.5 text-[10px]">
                                {n}
                            </span>
                            {text}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function InfoCard({ icon: Icon, label, value, color, small = false }: {
    icon: React.ElementType;
    label: string;
    value: string;
    color: "blue" | "emerald" | "amber";
    small?: boolean;
}) {
    const colors = {
        blue:    "bg-blue-50 border-blue-100 text-blue-600",
        emerald: "bg-emerald-50 border-emerald-100 text-emerald-600",
        amber:   "bg-amber-50 border-amber-100 text-amber-600",
    };
    return (
        <div className={`rounded-2xl border p-5 ${colors[color]}`}>
            <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{label}</span>
            </div>
            <p className={`font-black ${small ? "text-sm" : "text-xl"} leading-tight`}>{value}</p>
        </div>
    );
}
