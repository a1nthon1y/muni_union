"use client";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Solicitud } from "@/types/solicitud";
import { es } from "date-fns/locale";
import { dateUtils } from "@/utils/dateUtils";
import {
    User,
    Calendar,
    FileText,
    CreditCard,
    CheckCircle2,
    Ban,
    Clock,
    FileDigit,
    Eye,
    Receipt,
    ExternalLink,
    Printer,
    MapPin,
    Phone,
    Trash2
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface SolicitudDetailSheetProps {
    solicitud: Solicitud | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAtender: (id: number) => void;
    onAnular: (id: number) => void;
    onDelete?: (id: number) => void;
    isLoadingActions?: boolean;
}

export function SolicitudDetailSheet({
    solicitud,
    open,
    onOpenChange,
    onAtender,
    onAnular,
    onDelete,
    isLoadingActions = false
}: SolicitudDetailSheetProps) {
    if (!solicitud) return null;

    const getStatusBadge = (estado: string) => {
        switch (estado) {
            case 'PENDIENTE':
                return <Badge className="bg-amber-100 text-amber-700 border-amber-200 px-2 py-0.5 font-bold uppercase text-[10px]">PENDIENTE</Badge>;
            case 'ATENDIDO':
                return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 px-2 py-0.5 font-bold uppercase text-[10px]">ATENDIDO</Badge>;
            case 'ANULADO':
                return <Badge className="bg-rose-100 text-rose-700 border-rose-200 px-2 py-0.5 font-bold uppercase text-[10px]">ANULADO</Badge>;
            default:
                return <Badge variant="outline" className="px-2 py-0.5 font-bold uppercase text-[10px]">{estado}</Badge>;
        }
    };

    const total = solicitud.detalles?.reduce((acc, curr) => acc + Number(curr.total), 0) || 0;

    const getFileUrl = (ruta?: string) => {
        if (!ruta) return "";
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        const rootUrl = apiBase.replace('/api', '');
        return `${rootUrl}/${ruta}`;
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md flex flex-col h-full p-0 overflow-hidden">
                {/* Header Compacto */}
                <div className="p-5 border-b bg-muted/30">
                    <SheetHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2.5 rounded-xl shadow-sm">
                                    <FileDigit className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <SheetTitle className="text-xl font-bold tracking-tight">
                                        Expediente #{solicitud.id.toString().padStart(6, '0')}
                                    </SheetTitle>
                                    <SheetDescription className="text-muted-foreground font-medium text-[11px] uppercase tracking-wider">
                                        Trámite Municipal · {solicitud.tipo_solicitud}
                                    </SheetDescription>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                {getStatusBadge(solicitud.estado)}
                            </div>
                        </div>
                    </SheetHeader>
                </div>

                {/* Content con Scroll */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">

                    {/* Datos Generales */}
                    <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold text-sm text-foreground uppercase tracking-wide">Datos del Trámite</h3>
                        </div>

                        <div className="bg-muted rounded-lg p-3.5 space-y-2.5 border border-border">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium mb-0.5">Fecha de Registro</p>
                                    <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                        {dateUtils.formatDisplayDate(solicitud.fecha_solicitud)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium mb-0.5">Tipo de Solicitud</p>
                                    <Badge className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
                                        {solicitud.tipo_solicitud}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Solicitante */}
                    <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold text-sm text-foreground uppercase tracking-wide">Solicitante</h3>
                        </div>

                        <div className="bg-muted rounded-lg p-3.5 space-y-2.5 border border-border">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium mb-0.5">Apellidos y Nombres</p>
                                <p className="text-sm font-semibold text-foreground uppercase">
                                    {solicitud.solicitante_apellidos}, {solicitud.solicitante_nombres}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-1">
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium mb-0.5">DNI</p>
                                    <p className="text-sm font-mono font-bold text-primary tracking-wider">{solicitud.solicitante_dni}</p>
                                </div>
                                {solicitud.solicitante_telefono && (
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium mb-0.5">Teléfono</p>
                                        <p className="text-sm text-foreground/70 flex items-center gap-1.5">
                                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                            {solicitud.solicitante_telefono}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {solicitud.solicitante_direccion && (
                                <div className="pt-1">
                                    <p className="text-xs text-muted-foreground font-medium mb-0.5">Dirección</p>
                                    <p className="text-sm text-foreground/70 flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                        {solicitud.solicitante_direccion}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Liquidación Económica */}
                    <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold text-sm text-foreground uppercase tracking-wide">Liquidación</h3>
                        </div>
                        <div className="bg-primary px-5 py-4 rounded-xl text-primary-foreground shadow-md flex items-center justify-between">
                            <div>
                                <h4 className="text-[9px] font-black text-primary-foreground/60 uppercase tracking-widest mb-1">Costo Total del Trámite</h4>
                                <p className="text-3xl font-black tabular-nums">S/ {total.toFixed(2)}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-primary-foreground/10 flex items-center justify-center">
                                <span className="font-black text-xl">S/</span>
                            </div>
                        </div>
                    </div>

                    {/* Detalle de Partidas */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <FileDigit className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold text-sm text-foreground uppercase tracking-wide">Partidas Requeridas ({solicitud.detalles?.length})</h3>
                        </div>
                        <div className="space-y-2">
                            {solicitud.detalles?.map((det) => (
                                <div key={det.id} className="bg-muted px-4 py-3 rounded-xl border border-border flex items-center justify-between group hover:border-primary/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-lg bg-background flex items-center justify-center font-bold text-primary border border-border text-[10px]">
                                            {det.tipo_acta?.substring(0, 1)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground text-[11px] leading-tight flex items-center gap-1.5">
                                                ACTA N° {det.numero_acta}
                                                {det.ruta_archivo && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Digitalizado" />}
                                            </p>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase">{det.tipo_acta} • {det.anio}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="text-[10px] font-black bg-background h-6">x{det.cantidad}</Badge>
                                        {det.ruta_archivo && (
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                className="h-8 w-8 rounded-lg text-primary hover:bg-primary/5 bg-background shadow-sm"
                                                onClick={() => {
                                                    const url = getFileUrl(det.ruta_archivo);
                                                    if (url) window.open(url, '_blank');
                                                }}
                                            >
                                                <Eye size={16} />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Trazabilidad */}
                    {solicitud.estado !== 'PENDIENTE' && (
                        <div className={`p-4 rounded-xl border border-dashed flex items-start gap-3 ${solicitud.estado === 'ATENDIDO' ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50/50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400'}`}>
                            <div className={`p-2 rounded-lg shrink-0 ${solicitud.estado === 'ATENDIDO' ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600' : 'bg-rose-100 dark:bg-rose-900 text-rose-600'}`}>
                                {solicitud.estado === 'ATENDIDO' ? <CheckCircle2 size={16} /> : <Ban size={16} />}
                            </div>
                            <div>
                                <p className="font-bold uppercase tracking-tight text-[11px]">
                                    {solicitud.estado === 'ATENDIDO' ? 'Trámite Procesado' : 'Trámite Anulado'}
                                </p>
                                <div className="grid grid-cols-1 gap-1 mt-1 opacity-80">
                                    <p className="text-[9px] font-bold flex items-center gap-1.5 uppercase">
                                        <Clock size={10} /> {dateUtils.formatDisplayTimestamp(solicitud.fecha_atencion)}
                                    </p>
                                    <p className="text-[9px] font-bold flex items-center gap-1.5 uppercase">
                                        <User size={10} /> {solicitud.usuario_atencion_nombres ? `${solicitud.usuario_atencion_nombres} ${solicitud.usuario_atencion_apellidos}` : 'SISTEMA'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Observaciones */}
                    {solicitud.observaciones && (
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide px-1">Notas Internas</p>
                            <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-lg p-3">
                                <p className="italic text-amber-900/70 dark:text-amber-100/50 text-xs font-medium leading-relaxed">
                                    "{solicitud.observaciones}"
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer unificado */}
                <div className="p-5 border-t bg-background space-y-3">
                    {/* Botón de Impresión — solo para ATENDIDO y PENDIENTE */}
                    {solicitud.estado !== 'ANULADO' && (
                        <Button
                            variant="outline"
                            className="w-full h-11 rounded-xl font-bold uppercase text-[11px] tracking-widest text-slate-600 hover:bg-slate-50 border-slate-200"
                            onClick={() => window.open(`/print/solicitud/${solicitud.id}`, '_blank')}
                        >
                            <Printer size={16} className="mr-2" /> Imprimir Documento / Cargo
                        </Button>
                    )}

                    <div className="flex gap-4">
                        {solicitud.estado === 'PENDIENTE' && (
                            <>
                                <Button
                                    variant="outline"
                                    className="flex-1 h-12 rounded-xl font-bold uppercase text-[11px] tracking-widest text-rose-600 border-rose-100 hover:bg-rose-50"
                                    onClick={() => onAnular(solicitud.id)}
                                    disabled={isLoadingActions}
                                >
                                    <Ban size={16} className="mr-2" /> Anular
                                </Button>
                                <Button
                                    className="flex-1 h-12 rounded-xl font-bold uppercase text-[11px] tracking-widest btn-primary shadow-lg shadow-primary/20"
                                    onClick={() => onAtender(solicitud.id)}
                                    disabled={isLoadingActions}
                                >
                                    <CheckCircle2 size={16} className="mr-2" /> Atender
                                </Button>
                            </>
                        )}

                        {solicitud.estado !== 'PENDIENTE' && (
                            <div className="w-full text-center p-3 bg-muted rounded-xl border border-dashed border-border flex items-center justify-center gap-2">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Trámite Finalizado:</span>
                                {getStatusBadge(solicitud.estado)}
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
