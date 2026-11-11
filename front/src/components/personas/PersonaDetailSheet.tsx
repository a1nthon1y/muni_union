"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/utils/api";
import {
    Calendar,
    Cross,
    FileText,
    Loader2,
    MapPin,
    Phone,
    RotateCcw,
    User,
} from "lucide-react";
import { ActaVinculadaCard } from "@/components/actas/ActaVinculadaCard";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { actasService } from "@/services/actas.service";
import type { Acta, TipoActa } from "@/types/acta";
import type { Persona } from "@/types/persona";
import { dateUtils } from "@/utils/dateUtils";

interface PersonaDetailSheetProps {
    isOpen: boolean;
    onClose: () => void;
    persona: Persona | null;
}

const ordenTipoActa: Record<TipoActa, number> = {
    NACIMIENTO: 1,
    MATRIMONIO: 2,
    DEFUNCION: 3,
};

const ordenarActasVinculadas = (actas: Acta[]) =>
    [...actas].sort((a, b) => {
        const porTipo = ordenTipoActa[a.tipo_acta] - ordenTipoActa[b.tipo_acta];
        if (porTipo !== 0) return porTipo;
        const porFecha = (a.fecha_acta ?? "").localeCompare(b.fecha_acta ?? "");
        if (porFecha !== 0) return porFecha;
        return a.id - b.id;
    });

const getFileUrl = (ruta: string) => {
    const apiBase = getApiBaseUrl();
    return `${apiBase.replace(/\/api\/?$/, "")}/${ruta.replace(/^\//, "")}`;
};

export function PersonaDetailSheet({
    isOpen,
    onClose,
    persona,
}: PersonaDetailSheetProps) {
    const router = useRouter();
    const [actas, setActas] = useState<Acta[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const cargarActas = useCallback(async () => {
        if (!persona) return;

        setLoading(true);
        setError(false);
        try {
            const response = await actasService.getAll({
                persona_id: persona.id,
                page: 1,
                limit: 50,
            });
            setActas(ordenarActasVinculadas(response.data));
            setTotal(response.pagination.total);
        } catch {
            setActas([]);
            setTotal(0);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [persona]);

    useEffect(() => {
        if (isOpen && persona) {
            void cargarActas();
        }
    }, [cargarActas, isOpen, persona]);

    if (!persona) return null;

    const nombreCompleto = [
        persona.apellido_paterno,
        persona.apellido_materno,
        persona.nombres,
    ].filter(Boolean).join(" ");

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="sm:max-w-md flex flex-col h-full p-0 overflow-hidden">
                <div className="p-6 border-b bg-muted/30">
                    <SheetHeader>
                        <div className="flex items-center gap-3 pr-8">
                            <div className="bg-primary/10 p-2.5 rounded-xl shadow-sm">
                                <User className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0 text-left">
                                <SheetTitle className="text-xl font-bold tracking-tight text-foreground uppercase">
                                    {nombreCompleto}
                                </SheetTitle>
                                <SheetDescription className="text-muted-foreground font-medium text-[11px] uppercase tracking-wider">
                                    Ciudadano · actas vinculadas
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <section aria-labelledby="persona-identidad" className="space-y-4">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            <h3 id="persona-identidad" className="font-semibold text-sm text-foreground uppercase tracking-wide">
                                Datos del ciudadano
                            </h3>
                        </div>
                        <p className="text-xs text-muted-foreground -mt-2">
                            Fechas del ciudadano en el padrón. La fecha de inscripción de cada acta se muestra abajo, en actas vinculadas.
                        </p>
                        <div className="bg-muted rounded-lg p-4 border border-border grid gap-3 sm:grid-cols-2">
                            <div>
                                <p className="text-[11px] font-medium text-muted-foreground">Documento</p>
                                <p className="mt-1 font-mono text-sm font-bold">
                                    {persona.tipo_documento || "Documento"} · {persona.dni || "Sin número"}
                                </p>
                            </div>
                            <div>
                                <p className="text-[11px] font-medium text-muted-foreground">Sexo</p>
                                <p className="mt-1 text-sm font-semibold">
                                    {persona.sexo === "M" ? "Masculino" : "Femenino"}
                                </p>
                            </div>
                            <div>
                                <p className="text-[11px] font-medium text-muted-foreground">Fecha de nacimiento</p>
                                <p className="mt-1 flex items-center gap-2 text-sm">
                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                    {dateUtils.formatDisplayDate(persona.fecha_nacimiento)}
                                </p>
                            </div>
                            <div>
                                <p className="text-[11px] font-medium text-muted-foreground">Fecha de fallecimiento</p>
                                <p className="mt-1 flex items-center gap-2 text-sm">
                                    <Cross className="h-3.5 w-3.5 text-muted-foreground" />
                                    {dateUtils.formatDisplayDate(persona.fecha_fallecimiento)}
                                </p>
                            </div>
                            <div>
                                <p className="text-[11px] font-medium text-muted-foreground">Teléfono</p>
                                <p className="mt-1 flex items-center gap-2 text-sm">
                                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                    {persona.telefono || "No registrado"}
                                </p>
                            </div>
                            <div>
                                <p className="text-[11px] font-medium text-muted-foreground">Dirección</p>
                                <p className="mt-1 flex items-start gap-2 text-sm">
                                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    {persona.direccion || "No registrada"}
                                </p>
                            </div>
                        </div>
                    </section>

                    <section aria-labelledby="persona-actas" className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <FileText className="h-4 w-4 shrink-0 text-primary" />
                                <div>
                                    <h3 id="persona-actas" className="font-semibold text-sm text-foreground uppercase tracking-wide">
                                        Actas vinculadas
                                    </h3>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Titular o cónyuge · nacimiento → matrimonio → defunción · la fecha es del acta (inscripción)
                                    </p>
                                </div>
                            </div>
                            <Badge variant="outline" className="shrink-0">
                                {total} {total === 1 ? "acta" : "actas"}
                            </Badge>
                        </div>

                        {loading ? (
                            <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                <span className="ml-2 text-sm text-muted-foreground">Cargando actas…</span>
                            </div>
                        ) : error ? (
                            <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-center dark:border-rose-900/50 dark:bg-rose-950/20">
                                <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                                    No se pudieron cargar las actas vinculadas
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Verifique la conexión e inténtelo nuevamente.
                                </p>
                                <Button className="mt-4 gap-2" variant="outline" onClick={() => void cargarActas()}>
                                    <RotateCcw className="h-4 w-4" />
                                    Reintentar
                                </Button>
                            </div>
                        ) : actas.length === 0 ? (
                            <div className="rounded-xl border border-dashed p-6 text-center">
                                <FileText className="mx-auto h-7 w-7 text-muted-foreground/50" />
                                <p className="mt-3 text-sm font-semibold">
                                    Este ciudadano no tiene actas vinculadas
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Las actas aparecerán aquí cuando se registren a nombre de esta persona.
                                </p>
                            </div>
                        ) : (
                            <div className="relative space-y-3 before:absolute before:bottom-4 before:left-5 before:top-4 before:w-px before:bg-border">
                                {actas.map((acta) => (
                                    <ActaVinculadaCard
                                        key={acta.id}
                                        numeroActa={acta.numero_acta}
                                        tipoActa={acta.tipo_acta}
                                        anio={acta.anio}
                                        fechaActa={acta.fecha_acta}
                                        estado={acta.estado}
                                        badges={
                                            <Badge variant="outline">
                                                {acta.persona_principal_id === persona.id ? "Titular" : "Cónyuge"}
                                            </Badge>
                                        }
                                        hasDocumento={!!acta.tiene_documento}
                                        documentoUrl={acta.ruta_archivo ? getFileUrl(acta.ruta_archivo) : undefined}
                                        onVer={() => router.push(`/dashboard/actas?persona_id=${persona.id}&acta_id=${acta.id}`)}
                                        onImprimir={() => window.open(`/print/acta/${acta.id}`, "_blank")}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </SheetContent>
        </Sheet>
    );
}
