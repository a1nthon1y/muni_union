"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, FileEdit } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Acta, TipoActa } from "@/types/acta";
import { actasService } from "@/services/actas.service";
import { dateUtils } from "@/utils/dateUtils";
import {
    sanitizarSoloDigitos,
    validarFechaNoFutura,
    validarLibro,
    validarNumeroActa,
} from "@/lib/form-validators";

const actaSchema = z.object({
    tipo_acta: z.enum(['NACIMIENTO', 'MATRIMONIO', 'DEFUNCION']),
    modo: z.enum(['CLASICO', 'CUI']),
    libro: z.string().optional(),
    numero_acta: z.string().min(1, "Número obligatorio"),
    anio: z.coerce.number().min(1900).max(Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric' }).format(new Date())) + 1),
    fecha_acta: z.string().min(1, "Fecha obligatoria"),
    observaciones: z.string().max(500).optional(),
}).superRefine((data, ctx) => {
    const add = (path: string, message: string) => {
        ctx.addIssue({ code: "custom", message, path: [path] });
    };

    const errNum = validarNumeroActa(data.modo, data.numero_acta);
    if (errNum) add("numero_acta", errNum);

    if (data.modo === "CLASICO") {
        const errLibro = validarLibro(data.libro);
        if (errLibro) add("libro", errLibro);
    }

    const errFecha = validarFechaNoFutura(data.fecha_acta, "Fecha del acta");
    if (errFecha) add("fecha_acta", errFecha);
});

type ActaFormData = z.infer<typeof actaSchema>;

interface ActaEditSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    acta: Acta | null;
}

export function ActaEditSheet({ isOpen, onClose, onSuccess, acta }: ActaEditSheetProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const parseNumeroActa = (fullNum: string) => {
        if (!fullNum) return { libro: "", acta: "", modo: 'CLASICO' as const };
        const parts = fullNum.split("-");
        // Formato clásico: Prefijo-LX-Num
        if (parts.length >= 3 && parts[1].startsWith("L")) {
            return {
                libro: parts[1].replace(/^L/, ""), // Quitar 'L' inicial
                acta: parts[2],
                modo: 'CLASICO' as const
            };
        }
        // Si no cumple el formato clásico, asumimos CUI (Modo Moderno)
        return { libro: "", acta: fullNum, modo: 'CUI' as const };
    };

    const initialParsed = parseNumeroActa(acta?.numero_acta || "");

    const form = useForm<ActaFormData>({
        resolver: zodResolver(actaSchema) as any,
        mode: "onTouched",
        reValidateMode: "onChange",
        defaultValues: {
            tipo_acta: (acta?.tipo_acta as 'NACIMIENTO' | 'MATRIMONIO' | 'DEFUNCION') || 'NACIMIENTO',
            modo: initialParsed.modo,
            libro: initialParsed.libro,
            numero_acta: initialParsed.acta,
            anio: acta?.anio || Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric' }).format(new Date())),
            fecha_acta: dateUtils.formatInputDate(acta?.fecha_acta),
            observaciones: acta?.observaciones || "",
        },
    });

    const modoValue = form.watch("modo");

    const libroValue = form.watch("libro");
    const numeroValue = form.watch("numero_acta");
    const tipoValue = form.watch("tipo_acta");
    const fechaActaValue = form.watch("fecha_acta");

    // Sincronizar año automáticamente con la fecha del acta
    useEffect(() => {
        if (fechaActaValue) {
            const year = new Date(fechaActaValue + 'T00:00:00').getFullYear();
            if (year >= 1900) {
                form.setValue("anio", year);
            }
        }
    }, [fechaActaValue, form]);

    // Sincronización del formulario con el estado del Sheet y el Acta
    useEffect(() => {
        if (isOpen && acta) {
            const parsed = parseNumeroActa(acta.numero_acta);
            form.reset({
                tipo_acta: acta.tipo_acta,
                modo: parsed.modo,
                libro: parsed.libro,
                numero_acta: parsed.acta,
                anio: acta.anio,
                fecha_acta: dateUtils.formatInputDate(acta.fecha_acta),
                observaciones: acta.observaciones || "",
            });
        } else if (!isOpen) {
            form.reset({
                tipo_acta: 'NACIMIENTO',
                modo: 'CLASICO',
                libro: "",
                numero_acta: "",
                anio: Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric' }).format(new Date())),
                fecha_acta: "",
                observaciones: "",
            });
            form.clearErrors();
        }
    }, [acta, isOpen, form]);

    // Validación de duplicados al editar (solo si cambia el número respecto al original)
    useEffect(() => {
        if (numeroValue && (modoValue === 'CUI' || libroValue)) {
            const getPrefix = (tipo: string) => {
                switch (tipo) {
                    case 'NACIMIENTO': return 'NAC';
                    case 'MATRIMONIO': return 'MAT';
                    case 'DEFUNCION': return 'DEF';
                    default: return 'ACT';
                }
            };
            const formatted = modoValue === 'CUI' 
                ? numeroValue.toUpperCase()
                : `${getPrefix(tipoValue)}-L${libroValue}-${numeroValue}`.toUpperCase();

            if (formatted !== acta?.numero_acta?.toUpperCase()) {
                const timer = setTimeout(() => {
                    actasService.getAll({ numero: formatted })
                        .then(response => {
                            const actas = response.data || [];
                            const existente = actas.find(a =>
                                String(a.numero_acta).toUpperCase() === formatted && a.id !== acta?.id
                            );
                            if (existente) {
                                toast.warning(`Atención: El acta N° ${formatted} ya existe.`, {
                                    description: `Pertenece a otro registro (${existente.tipo_acta}). Evite duplicados.`,
                                    duration: 8000
                                });
                            }
                        });
                }, 800);
                return () => clearTimeout(timer);
            }
        }
    }, [numeroValue, libroValue, tipoValue, acta, isOpen, modoValue]);

    const onSubmit = async (values: ActaFormData) => {
        if (!acta) return;
        setIsSubmitting(true);
        try {
            const getPrefix = (tipo: string) => {
                switch (tipo) {
                    case 'NACIMIENTO': return 'NAC';
                    case 'MATRIMONIO': return 'MAT';
                    case 'DEFUNCION': return 'DEF';
                    default: return 'ACT';
                }
            };
            const fullNumeroActa = values.modo === 'CUI' 
                ? values.numero_acta.toUpperCase().trim()
                : `${getPrefix(values.tipo_acta)}-L${values.libro}-${values.numero_acta}`.toUpperCase();

            await actasService.update(acta.id, {
                ...values,
                numero_acta: fullNumeroActa,
                persona_principal_id: acta.persona_principal_id
            });
            toast.success("Acta actualizada correctamente");
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error updating acta:", error);
            toast.error("Error al actualizar el acta");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-md flex flex-col h-full p-0 overflow-hidden">
                <div className="p-6 border-b bg-muted/30">
                    <SheetHeader>
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2.5 rounded-xl shadow-sm">
                                <FileEdit className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <SheetTitle className="text-xl font-bold tracking-tight">
                                    Editar Acta
                                </SheetTitle>
                                <SheetDescription className="text-muted-foreground font-medium text-[11px] uppercase tracking-wider">
                                    N° {acta?.numero_acta || "S/N"} · Registro Integral
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <Form {...form}>
                        <form id="acta-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pb-4">
                            <FormField
                                control={form.control}
                                name="tipo_acta"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="std-label mb-1.5 uppercase font-bold text-[10px] text-primary">Tipo de Acta</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="std-input h-10 font-bold uppercase text-xs">
                                                    <SelectValue placeholder="—" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="NACIMIENTO" className="font-semibold text-xs text-info">NACIMIENTO</SelectItem>
                                                <SelectItem value="MATRIMONIO" className="font-semibold text-xs">MATRIMONIO</SelectItem>
                                                <SelectItem value="DEFUNCION" className="font-semibold text-xs">DEFUNCIÓN</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex p-1 bg-muted/60 rounded-xl mb-2 w-fit">
                                <Button
                                    type="button"
                                    variant={modoValue === 'CLASICO' ? 'default' : 'ghost'}
                                    size="sm"
                                    className={cn("rounded-lg h-7 text-[9px] font-black uppercase tracking-widest px-4", modoValue === 'CLASICO' && "shadow-sm bg-primary")}
                                    onClick={() => form.setValue("modo", "CLASICO")}
                                >
                                    Libro Clásico
                                </Button>
                                <Button
                                    type="button"
                                    variant={modoValue === 'CUI' ? 'default' : 'ghost'}
                                    size="sm"
                                    className={cn("rounded-lg h-7 text-[9px] font-black uppercase tracking-widest px-4", modoValue === 'CUI' && "shadow-sm bg-primary")}
                                    onClick={() => form.setValue("modo", "CUI")}
                                >
                                    RENIEC (CUI)
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                {modoValue === 'CLASICO' && (
                                    <div className="md:col-span-4">
                                        <FormField
                                            control={form.control}
                                            name="libro"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="std-label mb-1.5">Libro</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            inputMode="numeric"
                                                            maxLength={4}
                                                            className="std-input h-10 font-bold bg-primary/5 text-center"
                                                            onChange={(e) => field.onChange(sanitizarSoloDigitos(e.target.value, 4))}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}
                                <div className={cn(modoValue === 'CLASICO' ? "md:col-span-5" : "md:col-span-9")}>
                                    <FormField
                                        control={form.control}
                                        name="numero_acta"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex items-center justify-between mb-1.5 ">
                                                    <FormLabel className="std-label m-0 p-0 leading-none">
                                                        {modoValue === 'CLASICO' ? 'N° Acta' : 'CUI / Identificador'}
                                                    </FormLabel>
                                                    {modoValue === 'CLASICO' && (libroValue || numeroValue) && (
                                                        <Badge variant="outline" className="h-4 px-1 text-[8px] bg-primary/5 text-primary border-primary/20 font-bold">
                                                            PREVIEW: {tipoValue.substring(0, 3)}-L{libroValue || '?'}-{numeroValue || '?'}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        inputMode="numeric"
                                                        maxLength={modoValue === "CLASICO" ? 6 : 12}
                                                        placeholder={modoValue === "CLASICO" ? "Número" : "6-12 dígitos"}
                                                        className="std-input h-10 font-bold tracking-widest uppercase"
                                                        onChange={(e) => field.onChange(
                                                            sanitizarSoloDigitos(
                                                                e.target.value,
                                                                modoValue === "CLASICO" ? 6 : 12,
                                                            ),
                                                        )}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <FormField
                                        control={form.control}
                                        name="anio"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="std-label mb-1.5">Año</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} disabled className="std-input h-10 bg-muted/50 text-muted-foreground font-bold" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <FormField
                                control={form.control}
                                name="fecha_acta"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="std-label mb-1.5">Fecha del Acta</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} className="std-input h-10 font-semibold text-xs" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="observaciones"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="std-label mb-1.5">Observaciones</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="..."
                                                className="std-input min-h-[100px] py-3 resize-none font-medium bg-muted/10"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </form>
                    </Form>
                </div>

                <div className="p-6 border-t bg-background">
                    <div className="flex gap-4">
                        <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl font-bold uppercase text-[11px] tracking-widest" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" form="acta-form" className="flex-1 h-12 rounded-xl btn-primary font-bold uppercase text-[11px] tracking-widest gap-2 shadow-lg shadow-primary/20" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Guardar Cambios
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
