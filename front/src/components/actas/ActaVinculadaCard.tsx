"use client";

import type { ReactNode } from "react";
import { Baby, Cross, Eye, FileText, Heart, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dateUtils } from "@/utils/dateUtils";

// ─── Visual por tipo de acta (compartido: Personas y Solicitudes) ────────────

const tipoActaVisual = {
    NACIMIENTO: {
        label: "Nacimiento",
        icon: Baby,
        className: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300",
    },
    MATRIMONIO: {
        label: "Matrimonio",
        icon: Heart,
        className: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/30 dark:text-violet-300",
    },
    DEFUNCION: {
        label: "Defunción",
        icon: Cross,
        className: "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
    },
} as const;

const tipoActaNeutro = {
    label: "Acta",
    icon: FileText,
    className: "border-border bg-muted text-muted-foreground",
} as const;

const obtenerVisualTipoActa = (tipo: string) =>
    tipoActaVisual[tipo as keyof typeof tipoActaVisual] ?? tipoActaNeutro;

// ─── Tarjeta compartida de acta vinculada ─────────────────────────────────────
// Reglas de consistencia:
//   · Orden de acciones: Ver acta → Ver documento → Imprimir registro
//   · Badges propios (caller) → estado → digitalización
//   · La impresión del registro siempre es la última acción de la fila

interface ActaVinculadaCardProps {
    numeroActa: string;
    tipoActa: string;
    anio: number;
    /** Línea opcional de fecha (p. ej. fecha de inscripción en Personas) */
    fechaActa?: string;
    /** Estado registral del acta — se muestra como badge solo si se provee */
    estado?: string;
    /** Badge(s) propios del módulo (participación, x cantidad, etc.) */
    badges?: ReactNode;
    /** Indicar "Digitalizada" solo cuando hay archivo; en Solicitudes además se muestra "Sin digitalizar" */
    hasDocumento?: boolean;
    mostrarSinDigitalizar?: boolean;
    documentoUrl?: string;
    /** Acción primaria: abrir el expediente en el módulo Actas */
    onVer?: () => void;
    /** Acción final: imprimir el Detalle de Registro del acta */
    onImprimir?: () => void;
}

export function ActaVinculadaCard({
    numeroActa,
    tipoActa,
    anio,
    fechaActa,
    estado,
    badges,
    hasDocumento = false,
    mostrarSinDigitalizar = false,
    documentoUrl,
    onVer,
    onImprimir,
}: ActaVinculadaCardProps) {
    const visual = obtenerVisualTipoActa(tipoActa);
    const Icon = visual.icon;

    return (
        <article className="relative rounded-xl border bg-card p-4 pl-14 shadow-sm">
            <div className={`absolute left-2.5 top-4 z-10 rounded-full border p-2 ${visual.className}`}>
                <Icon className="h-4 w-4" />
            </div>
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <p className="font-mono text-sm font-bold text-primary">
                        {numeroActa}
                    </p>
                    <p className="mt-1 text-xs font-medium text-foreground/80">
                        {visual.label} · Año registral {anio}
                    </p>
                    {fechaActa && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                            Fecha del acta:{" "}
                            <span className="font-medium text-foreground/70">
                                {dateUtils.formatDisplayDate(fechaActa)}
                            </span>
                        </p>
                    )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {badges}
                    {estado && (
                        <Badge variant={estado === "ACTIVO" ? "success" : estado === "ANULADO" ? "error" : "warning"}>
                            {estado}
                        </Badge>
                    )}
                    {hasDocumento
                        ? <Badge variant="info">Digitalizada</Badge>
                        : mostrarSinDigitalizar && <Badge variant="warning">Sin digitalizar</Badge>}
                </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
                {onVer && (
                    <Button size="sm" className="gap-2" title="Abrir el expediente completo en el módulo Actas" onClick={onVer}>
                        <Eye className="h-4 w-4" />
                        Ver acta
                    </Button>
                )}
                {documentoUrl && (
                    <Button size="sm" variant="outline" className="gap-2" title="Abrir el documento escaneado (PDF/JPG)" onClick={() => window.open(documentoUrl, "_blank")}>
                        <FileText className="h-4 w-4" />
                        Ver documento
                    </Button>
                )}
                {onImprimir && (
                    <Button size="sm" variant="outline" className="gap-2" title="Imprime el Detalle de Registro del acta" onClick={onImprimir}>
                        <Printer className="h-4 w-4" />
                        Imprimir registro
                    </Button>
                )}
            </div>
        </article>
    );
}
