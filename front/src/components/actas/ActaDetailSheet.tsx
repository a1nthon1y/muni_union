"use client";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
    User,
    FileText,
    Calendar,
    Clock,
    Phone,
    MapPin,
    Baby,
    Heart,
    Cross,
    FileCheck,
    Download,
    Printer,
    Edit,
    Eye
} from "lucide-react";
import { Acta } from "@/types/acta";
import { dateUtils } from "@/utils/dateUtils";
import { Button } from "@/components/ui/button";

interface ActaDetailSheetProps {
    isOpen: boolean;
    onClose: () => void;
    acta: Acta | null;
    onEdit?: (acta: Acta) => void;
}

export function ActaDetailSheet({ isOpen, onClose, acta, onEdit }: ActaDetailSheetProps) {
    if (!acta) return null;

    const getTipoConfig = () => {
        switch (acta.tipo_acta) {
            case 'NACIMIENTO': return { icon: <Baby className="h-5 w-5" />, color: "text-primary", bg: "bg-primary/10", label: "Nacimiento" };
            case 'MATRIMONIO': return { icon: <Heart className="h-5 w-5" />, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/20", label: "Matrimonio" };
            case 'DEFUNCION': return { icon: <Cross className="h-5 w-5" />, color: "text-muted-foreground", bg: "bg-muted", label: "Defunción" };
            default: return { icon: <FileText className="h-5 w-5" />, color: "text-primary", bg: "bg-primary/10", label: acta.tipo_acta };
        }
    };

    const getStatusBadge = (estado: string) => {
        switch (estado) {
            case 'ACTIVO': return <Badge className="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30 text-xs">Activo</Badge>;
            case 'OBSERVADO': return <Badge className="bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30 text-xs">Observado</Badge>;
            case 'ANULADO': return <Badge className="bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/30 text-xs">Anulado</Badge>;
            default: return <Badge variant="outline" className="text-xs">{estado}</Badge>;
        }
    };

    const tipo = getTipoConfig();

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-md overflow-hidden p-0 flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b bg-muted/30">
                    <SheetHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl shadow-sm ${tipo.bg}`}>
                                    <span className={tipo.color}>{tipo.icon}</span>
                                </div>
                                <div>
                                    <SheetTitle className="text-xl font-bold tracking-tight text-foreground">
                                        Acta N° {acta.numero_acta}
                                    </SheetTitle>
                                    <SheetDescription className="text-muted-foreground font-medium text-[11px] uppercase tracking-wider">
                                        {tipo.label} · Año {acta.anio}
                                    </SheetDescription>
                                </div>
                            </div>
                            {getStatusBadge(acta.estado)}
                        </div>
                    </SheetHeader>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Titular */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold text-sm text-foreground uppercase tracking-wide">
                                {acta.tipo_acta === 'MATRIMONIO' ? 'Contrayente 1' : 'Titular'}
                            </h3>
                        </div>

                        <div className="bg-muted rounded-lg p-4 space-y-3 border border-border">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium mb-0.5">Apellidos y Nombres</p>
                                    <p className="text-sm font-semibold text-foreground uppercase">
                                        {acta.apellido_paterno} {acta.apellido_materno}, {acta.nombres}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium mb-0.5">DNI</p>
                                    <p className="text-sm font-mono font-bold text-primary tracking-wider">{acta.dni}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium mb-0.5">Sexo</p>
                                    <Badge variant="outline" className={`text-xs ${acta.sexo === 'M' ? "text-primary border-primary/20 bg-primary/5" : "text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-900/30 bg-pink-50/50 dark:bg-pink-950/10"}`}>
                                        {acta.sexo === 'M' ? 'Masculino' : 'Femenino'}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium mb-0.5">Fecha de Nacimiento</p>
                                    <p className="text-sm text-foreground/70 flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                        {dateUtils.formatDisplayDate(acta.fecha_nacimiento)}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium mb-0.5">Teléfono</p>
                                    <p className="text-sm text-foreground/70 flex items-center gap-1.5">
                                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                        {acta.telefono || '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium mb-0.5">Dirección</p>
                                    <p className="text-sm text-foreground/70 flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                        {acta.direccion || '—'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cónyuge — solo MATRIMONIO */}
                    {acta.tipo_acta === 'MATRIMONIO' && acta.p2_nombres && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Heart className="h-4 w-4 text-purple-500" />
                                <h3 className="font-semibold text-sm text-purple-600 dark:text-purple-400 uppercase tracking-wide">Contrayente 2</h3>
                            </div>
                            <div className="bg-purple-50/60 dark:bg-purple-950/20 rounded-lg p-4 space-y-3 border border-purple-200 dark:border-purple-900/40">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium mb-0.5">Apellidos y Nombres</p>
                                        <p className="text-sm font-semibold text-foreground uppercase">
                                            {acta.p2_apellido_paterno} {acta.p2_apellido_materno}, {acta.p2_nombres}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium mb-0.5">DNI</p>
                                        <p className="text-sm font-mono font-bold text-purple-600 dark:text-purple-400 tracking-wider">{acta.p2_dni || '—'}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium mb-0.5">Sexo</p>
                                        <Badge variant="outline" className={`text-xs ${acta.p2_sexo === 'M' ? "text-primary border-primary/20" : "text-pink-600 dark:text-pink-400 border-pink-200"}`}>
                                            {acta.p2_sexo === 'M' ? 'Masculino' : 'Femenino'}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium mb-0.5">Fecha de Nacimiento</p>
                                        <p className="text-sm text-foreground/70">{dateUtils.formatDisplayDate(acta.p2_fecha_nacimiento)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Datos del Acta */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold text-sm text-foreground uppercase tracking-wide">Datos del Acta</h3>
                        </div>

                        <div className="bg-muted rounded-lg p-4 space-y-3 border border-border">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium mb-0.5">Tipo</p>
                                    <Badge className="bg-primary text-primary-foreground text-xs">{acta.tipo_acta}</Badge>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium mb-0.5">Número</p>
                                    <p className="text-sm font-semibold text-foreground">{acta.numero_acta}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium mb-0.5">Año</p>
                                    <p className="text-sm font-semibold text-foreground">{acta.anio}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium mb-0.5">Fecha del Acta</p>
                                    <p className="text-sm text-foreground/70 flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                        {dateUtils.formatDisplayDate(acta.fecha_acta)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium mb-0.5">Fecha de Registro</p>
                                    <p className="text-sm text-foreground/70 flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                        {dateUtils.formatDisplayTimestamp(acta.fecha_registro)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Observaciones */}
                    {acta.observaciones && (
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Observaciones</p>
                            <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-lg p-3">
                                <p className="text-sm text-foreground/70 whitespace-pre-wrap leading-relaxed">
                                    {acta.observaciones}
                                </p>
                            </div>
                        </div>
                    )}

                    {acta.tiene_documento && (
                        <div className="flex items-center gap-3 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-lg p-3">
                            <FileCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Documento digitalizado</p>
                                <p className="text-xs text-emerald-600 dark:text-emerald-500">Archivo disponible para visualización</p>
                            </div>
                            <Button size="sm" variant="outline" className="border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 h-8 shrink-0" asChild>
                                <button onClick={() => {
                                    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
                                    const rootUrl = apiBase.replace('/api', '');
                                    const url = `${rootUrl}/${acta.ruta_archivo}`;
                                    window.open(url, '_blank');
                                }}>
                                    <Eye className="h-3.5 w-3.5 mr-1.5" /> Ver Acta
                                </button>
                            </Button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-background">
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            className="flex-1 h-12 rounded-xl font-bold uppercase text-[11px] tracking-widest text-slate-600 hover:bg-slate-50 border-slate-200"
                            onClick={() => window.open(`/print/acta/${acta.id}`, '_blank')}
                        >
                            <Printer className="h-4 w-4 mr-2" /> Imprimir
                        </Button>
                        <Button
                            className="flex-1 h-12 rounded-xl btn-primary font-bold uppercase text-[11px] tracking-widest shadow-lg shadow-primary/20"
                            onClick={() => {
                                onClose();
                                onEdit?.(acta);
                            }}
                        >
                            <Edit className="h-4 w-4 mr-2" /> Editar Acta
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
