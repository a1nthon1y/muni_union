"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Loader2, Save, ShieldAlert, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/useAuthStore";
import { configuracionService } from "@/services/configuracion.service";

export default function ConfiguracionPage() {
    const router = useRouter();
    const currentUser = useAuthStore((s) => s.usuario);
    const [url, setUrl] = useState("https://172.16.3.21");
    const [ejemplo, setEjemplo] = useState("https://172.16.3.21/verificar/000001");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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
                const data = await configuracionService.get();
                setUrl(data.url_verificacion_publica);
                setEjemplo(data.ejemplo_verificacion);
            } catch {
                toast.error("No se pudo cargar la configuración");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [currentUser]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const data = await configuracionService.updateUrlVerificacion(url);
            setUrl(data.url_verificacion_publica);
            setEjemplo(data.ejemplo_verificacion);
            toast.success("URL pública guardada", {
                description: "Las nuevas constancias usarán esta dirección.",
            });
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message
                || "No se pudo guardar la URL";
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    if (currentUser?.rol_id !== 1) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center text-center p-6">
                <ShieldAlert className="h-10 w-10 text-red-500 mb-4" />
                <h2 className="text-2xl font-semibold text-slate-800">Acceso restringido</h2>
                <p className="text-slate-500 mt-2">Solo administradores pueden cambiar el dominio público.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl">
            <div className="space-y-1">
                <div className="flex items-center gap-3 text-foreground">
                    <div className="bg-primary p-2.5 rounded-xl shadow-primary/20 shadow-lg">
                        <Globe className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                        Configuración del sistema
                    </h1>
                </div>
                <p className="text-muted-foreground font-medium text-xs ml-1">
                    Por defecto usa la IP de producción <code>https://172.16.3.21</code>.
                    Puede cambiarla a un dominio público cuando esté activo.
                </p>
            </div>

            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border bg-slate-50/50">
                    <h2 className="text-base font-bold text-foreground">URL pública de verificación</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                        Puede usar la IP de producción o un dominio público cuando esté activo.
                        No agregue barra final.
                    </p>
                </div>

                <div className="p-6 space-y-5">
                    {loading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">
                                    URL base
                                </label>
                                <Input
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://172.16.3.21"
                                    className="std-input h-11 font-mono"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Ejemplos: <code>https://172.16.3.21</code> o{" "}
                                    <code>https://verificar.muniunion.gob.pe</code>
                                </p>
                            </div>

                            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                                <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                                <div className="text-xs text-blue-800 space-y-1">
                                    <p>
                                        En producción actual la verificación ya funciona por IP:
                                    </p>
                                    <p className="font-mono font-bold break-all">{ejemplo}</p>
                                    <p>
                                        Si cambia a un dominio público, también debe actualizar Nginx
                                        en la VM Frontend (`server_name`) y el DNS.
                                    </p>
                                </div>
                            </div>

                            <Button
                                onClick={handleSave}
                                disabled={saving || !url.trim()}
                                className="w-full h-12 rounded-2xl font-bold text-xs"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Guardar URL pública
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
