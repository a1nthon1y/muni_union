"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
    Search,
    Plus,
    Trash2,
    User,
    FileText,
    Loader2,
    ChevronRight,
    CheckCircle2,
    ArrowLeft,
    Save,
    Baby,
    Heart,
    Cross,
    Fingerprint
} from "lucide-react";
import { solicitudesService } from "@/services/solicitudes.service";
import { actasService } from "@/services/actas.service";
import { Acta } from "@/types/acta";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    sanitizarNombre,
    sanitizarSoloDigitos,
    validarTelefono,
} from "@/lib/form-validators";

const solicitudSchema = z.object({
    dni_solicitante: z.string().min(1, "DNI es obligatorio"),
    nombres_solicitante: z.string().min(1, "Nombres son obligatorios"),
    apellidos_solicitante: z.string().min(1, "Apellidos son obligatorios"),
    telefono_solicitante: z.string().optional().or(z.literal("")),
    direccion_solicitante: z.string().max(200).optional().or(z.literal("")),
    tipo_solicitud: z.string().min(2, "Tipo de solicitud es obligatorio"),
    observaciones: z.string().default(""),
    detalles: z.array(z.object({
        acta_id: z.number(),
        tipo_acta: z.string(),
        numero_acta: z.string(),
        anio: z.number(),
        cantidad: z.number().min(1),
        precio_unitario: z.number().min(0),
    })).min(1, "Debe agregar al menos un acta"),
}).superRefine((data, ctx) => {
    const add = (path: string, message: string) => {
        ctx.addIssue({ code: "custom", message, path: [path] });
    };

    const dni = data.dni_solicitante.trim();
    if (!/^\d{8}$/.test(dni)) {
        add("dni_solicitante", "El DNI debe tener exactamente 8 dígitos");
    }

    if (!/^[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ ]*$/i.test(data.nombres_solicitante.trim()) || data.nombres_solicitante.trim().length < 2) {
        add("nombres_solicitante", "Nombres: solo letras, mínimo 2 caracteres");
    }

    if (!/^[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ ]*$/i.test(data.apellidos_solicitante.trim()) || data.apellidos_solicitante.trim().length < 2) {
        add("apellidos_solicitante", "Apellidos: solo letras, mínimo 2 caracteres");
    }

    const errTel = validarTelefono(data.telefono_solicitante);
    if (errTel) add("telefono_solicitante", errTel);
});

type SolicitudFormValues = z.infer<typeof solicitudSchema>;

interface NuevaSolicitudFormProps {
    onCancel: () => void;
    onSuccess: () => void;
}

export function NuevaSolicitudForm({
    onCancel,
    onSuccess,
}: NuevaSolicitudFormProps) {
    const [step, setStep] = useState(1);
    const [loadingSolicitante, setLoadingSolicitante] = useState(false);
    const [loadingActas, setLoadingActas] = useState(false);
    const [actasBusqueda, setActasBusqueda] = useState<Acta[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<SolicitudFormValues>({
        resolver: zodResolver(solicitudSchema) as any,
        mode: "onTouched",
        reValidateMode: "onChange",
        defaultValues: {
            dni_solicitante: "",
            nombres_solicitante: "",
            apellidos_solicitante: "",
            telefono_solicitante: "",
            direccion_solicitante: "",
            tipo_solicitud: "COPIA CERTIFICADA",
            observaciones: "",
            detalles: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "detalles",
    });

    const dni = form.watch("dni_solicitante");

    useEffect(() => {
        if (dni && dni.length === 8) {
            buscarSolicitante(dni);
        }
    }, [dni]);

    async function buscarSolicitante(dni: string) {
        setLoadingSolicitante(true);
        try {
            const res = await solicitudesService.getSolicitanteByDni(dni);
            if (res && res.nombres) {
                form.setValue("nombres_solicitante", res.nombres);
                form.setValue("apellidos_solicitante", res.apellidos || "");
                form.setValue("telefono_solicitante", res.telefono || "");
                form.setValue("direccion_solicitante", res.direccion || "");
                toast.success("Solicitante encontrado");
            }
        } catch (error) {
            // Si no se encuentra (404), limpiamos los campos para un nuevo registro
            form.setValue("nombres_solicitante", "");
            form.setValue("apellidos_solicitante", "");
            form.setValue("telefono_solicitante", "");
            form.setValue("direccion_solicitante", "");
        } finally {
            setLoadingSolicitante(false);
        }
    }

    async function buscarActas(valor: string) {
        if (!valor.trim()) {
            setActasBusqueda([]);
            return;
        }
        if (valor.length < 2) return;
        setLoadingActas(true);
        try {
            const res = await actasService.getAll({
                q: valor,
                limit: 20
            });
            setActasBusqueda(res.data);
        } catch (error) {
            toast.error("Error al buscar actas");
        } finally {
            setLoadingActas(false);
        }
    }

    const getIcon = (tipo: string) => {
        switch (tipo) {
            case 'NACIMIENTO': return <Baby className="h-4 w-4" />;
            case 'MATRIMONIO': return <Heart className="h-4 w-4" />;
            case 'DEFUNCION': return <Cross className="h-4 w-4" />;
            default: return <FileText className="h-4 w-4" />;
        }
    };

    const getBgColor = (tipo: string) => {
        switch (tipo) {
            case 'NACIMIENTO': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/40';
            case 'MATRIMONIO': return 'bg-primary/10 text-primary border-primary/20';
            case 'DEFUNCION': return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
            default: return 'bg-muted text-muted-foreground border-border';
        }
    };

    async function onSubmit(values: SolicitudFormValues) {
        setSubmitting(true);
        try {
            const solicitante = await solicitudesService.createSolicitante({
                dni: values.dni_solicitante || "",
                nombres: values.nombres_solicitante,
                apellidos: values.apellidos_solicitante,
                telefono: values.telefono_solicitante || undefined,
                direccion: values.direccion_solicitante || undefined,
            });

            await solicitudesService.create({
                solicitante_id: solicitante.id,
                tipo_solicitud: values.tipo_solicitud,
                observaciones: values.observaciones,
                detalles: values.detalles.map(d => ({
                    acta_id: d.acta_id,
                    cantidad: d.cantidad,
                    precio_unitario: d.precio_unitario,
                })),
            });

            toast.success("Solicitud registrada con éxito");
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error al registrar solicitud");
        } finally {
            setSubmitting(false);
        }
    }

    const watchedDetalles = form.watch("detalles");
    const total = watchedDetalles.reduce((acc, curr) => acc + (Number(curr.cantidad || 0) * Number(curr.precio_unitario || 0)), 0);

    return (
        <Card className="animate-in fade-in zoom-in-95 duration-300 border-border overflow-hidden shadow-md">
            <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between py-4 px-6">
                <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                        <Plus className="h-5 w-5 text-primary" /> Nueva Solicitud
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Gestión de copias certificadas.
                    </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                </Button>
            </CardHeader>

            <CardContent className="p-6">
                {/* Stepper */}
                <div className="flex items-center justify-center gap-2 md:gap-4 mb-8">
                    <div className={`flex items-center gap-2 ${step === 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${step === 1 ? 'border-primary bg-primary/10' : 'border-border'}`}>1</div>
                        <span className="text-xs font-semibold uppercase tracking-wider">Solicitante</span>
                    </div>
                    <div className="w-8 h-px bg-border" />
                    <div className={`flex items-center gap-2 ${step === 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${step === 2 ? 'border-primary bg-primary/10' : 'border-border'}`}>2</div>
                        <span className="text-xs font-semibold uppercase tracking-wider">Documentos</span>
                    </div>
                    <div className="w-8 h-px bg-border" />
                    <div className={`flex items-center gap-2 ${step === 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${step === 3 ? 'border-primary bg-primary/10' : 'border-border'}`}>3</div>
                        <span className="text-xs font-semibold uppercase tracking-wider">Confirmar</span>
                    </div>
                </div>

                <Form {...form}>
                    <form className="space-y-6">
                        {step === 1 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-300">
                                <FormField
                                    control={form.control}
                                    name="dni_solicitante"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                                                <Fingerprint className="h-3 w-3 text-primary" /> DNI DEL SOLICITANTE
                                            </FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        placeholder="8 DÍGITOS"
                                                        {...field}
                                                        maxLength={8}
                                                        inputMode="numeric"
                                                        className="font-mono h-10 border-border bg-muted/30 focus:bg-card focus:border-primary focus:ring-primary/10 rounded-lg transition-all"
                                                        onChange={(e) => field.onChange(sanitizarSoloDigitos(e.target.value, 8))}
                                                    />
                                                    {loadingSolicitante && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-400" size={16} />}
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="telefono_solicitante"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold text-muted-foreground uppercase">Teléfono (Opcional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="999..." {...field} maxLength={9} inputMode="numeric" className="h-10 rounded-lg border-border focus:border-primary focus:ring-primary/10 transition-all font-mono" onChange={(e) => field.onChange(sanitizarSoloDigitos(e.target.value, 9))} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="nombres_solicitante"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-1">
                                            <FormLabel className="text-xs font-bold text-muted-foreground uppercase">Nombres</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="NOMBRES"
                                                    {...field}
                                                    className="uppercase h-10 rounded-lg border-border shadow-sm font-semibold focus:border-primary focus:ring-primary/10"
                                                    onChange={(e) => field.onChange(sanitizarNombre(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="apellidos_solicitante"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-1">
                                            <FormLabel className="text-xs font-bold text-muted-foreground uppercase">Apellidos</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="APELLIDOS"
                                                    {...field}
                                                    className="uppercase h-10 rounded-lg border-border shadow-sm font-semibold focus:border-primary focus:ring-primary/10"
                                                    onChange={(e) => field.onChange(sanitizarNombre(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="direccion_solicitante"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Dirección (Opcional)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="DIRECCIÓN"
                                                    {...field}
                                                    className="uppercase h-10 rounded-lg border-border shadow-sm focus:border-primary focus:ring-primary/10"
                                                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                <div className="space-y-2">
                                    <FormLabel className="text-xs font-bold text-muted-foreground uppercase">BUSCAR ACTAS PARA CERTIFICAR</FormLabel>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="DNI, Nombres o N° Acta..."
                                            className="pl-9 h-10 border-border bg-muted/30 rounded-lg focus:bg-card"
                                            onChange={(e) => buscarActas(e.target.value)}
                                        />
                                    </div>

                                    {loadingActas && <div className="text-center py-4 text-sm text-muted-foreground"><Loader2 className="animate-spin inline-block mr-2" size={16} /> Buscando en archivos...</div>}

                                    {actasBusqueda.length > 0 && (
                                        <div className="border rounded-xl divide-y bg-card max-h-60 overflow-y-auto shadow-lg mt-1 border-border transition-all">
                                            {actasBusqueda.map(acta => {
                                                const isInCart = fields.some(f => f.acta_id === acta.id);
                                                return (
                                                    <div key={acta.id} className={`p-2 px-3 flex items-center justify-between hover:bg-muted/50 transition-colors group cursor-pointer ${isInCart ? 'opacity-60 bg-muted/30' : ''}`}
                                                        onClick={() => {
                                                            if (isInCart) return toast.warning("Ya está en la lista");
                                                            append({
                                                                acta_id: acta.id,
                                                                tipo_acta: acta.tipo_acta,
                                                                numero_acta: acta.numero_acta,
                                                                anio: acta.anio,
                                                                cantidad: 1,
                                                                precio_unitario: 10
                                                            });
                                                            toast.success("Agregado al carrito");
                                                        }}
                                                    >
                                                        <div className="flex gap-3 items-center flex-1 min-w-0">
                                                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${getBgColor(acta.tipo_acta)}`}>
                                                                {getIcon(acta.tipo_acta)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                                    <span className="font-bold text-foreground text-[11px] truncate">
                                                                        {acta.apellido_paterno} {acta.apellido_materno}, {acta.nombres}
                                                                    </span>
                                                                    <Badge variant="outline" className={`h-3.5 px-1 text-[8px] font-bold ${getBgColor(acta.tipo_acta)} border-none truncate uppercase`}>{acta.tipo_acta}</Badge>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                                                                    <span className="bg-muted px-1 rounded text-muted-foreground font-mono">N° {acta.numero_acta}</span>
                                                                    <span className="text-border">•</span>
                                                                    <span>AÑO {acta.anio}</span>
                                                                    <span className="text-border">•</span>
                                                                    <span className="font-mono">DNI {acta.dni}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className={`shrink-0 ml-2 rounded-md p-1.5 transition-all ${isInCart ? 'bg-green-100 text-green-600' : 'bg-primary text-primary-foreground opacity-0 group-hover:opacity-100 shadow-sm'}`}>
                                                            {isInCart ? <CheckCircle2 size={12} /> : <Plus size={12} strokeWidth={3} />}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-black text-foreground flex items-center gap-2 text-sm uppercase tracking-widest">
                                        <FileText size={16} className="text-primary" />
                                        Carrito de Certificación ({fields.length})
                                    </h4>
                                    {fields.length === 0 ? (
                                        <div className="border-2 border-dashed border-border rounded-3xl p-10 text-center text-muted-foreground bg-muted/20 flex flex-col items-center gap-3">
                                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                                <Search className="text-muted-foreground/50" />
                                            </div>
                                            <p className="font-medium">Busque y seleccione las actas arriba</p>
                                        </div>
                                    ) : (
                                        <div className="border border-border rounded-xl overflow-hidden shadow-sm bg-card transition-all">
                                            <table className="w-full text-xs">
                                                <thead className="bg-muted/50 border-b border-border">
                                                    <tr>
                                                        <th className="p-3 text-left font-bold text-muted-foreground uppercase tracking-widest text-[9px]">Documento</th>
                                                        <th className="p-3 text-center w-24 font-bold text-muted-foreground uppercase tracking-widest text-[9px]">Cant.</th>
                                                        <th className="p-3 text-center w-32 font-bold text-muted-foreground uppercase tracking-widest text-[9px]">Precio</th>
                                                        <th className="p-3 text-center w-10"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {fields.map((field, index) => (
                                                        <tr key={field.id} className="hover:bg-slate-50/50 transition-colors group">
                                                            <td className="p-3 py-2">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`h-6 w-6 rounded-md flex items-center justify-center border ${getBgColor(field.tipo_acta)}`}>
                                                                        {getIcon(field.tipo_acta)}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="font-bold text-slate-900 leading-none truncate mb-0.5">ACTA N° {field.numero_acta}</p>
                                                                        <div className="flex items-center gap-1.5 text-[9px] text-slate-400 uppercase font-bold tracking-tight">
                                                                            <span>{field.tipo_acta}</span>
                                                                            <span>•</span>
                                                                            <span>{field.anio}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="p-3 py-2">
                                                                <Input
                                                                    type="number"
                                                                    min={1}
                                                                    className="h-10 text-center font-bold text-[13px] bg-muted/30 border-slate-200 dark:border-slate-800 rounded-xl focus:bg-card transition-all"
                                                                    {...form.register(`detalles.${index}.cantidad`, { valueAsNumber: true })}
                                                                />
                                                            </td>
                                                            <td className="p-3 py-2">
                                                                <div className="relative">
                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-primary font-black">S/</span>
                                                                    <Input
                                                                        type="number"
                                                                        min={0}
                                                                        step="0.50"
                                                                        className="h-10 pl-8 text-center font-bold text-[13px] border-slate-200 dark:border-slate-800 rounded-xl focus:bg-card transition-all"
                                                                        {...form.register(`detalles.${index}.precio_unitario`, { valueAsNumber: true })}
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td className="p-3 py-2 text-right">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    type="button"
                                                                    className="h-7 w-7 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                                    onClick={() => remove(index)}
                                                                >
                                                                    <Trash2 size={14} />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div className="bg-foreground rounded-2xl p-6 text-background shadow-lg flex flex-col md:flex-row items-center gap-6">
                                    <div className="h-16 w-16 rounded-xl bg-primary flex items-center justify-center shrink-0">
                                        <User size={30} className="text-primary-foreground" strokeWidth={2.5} />
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Solicitante</p>
                                        <h3 className="text-xl font-bold uppercase tracking-tight text-background">
                                            {form.getValues("apellidos_solicitante")}, {form.getValues("nombres_solicitante")}
                                        </h3>
                                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2">
                                            <span className="text-[10px] font-mono bg-background/10 border border-background/20 px-2 py-0.5 rounded uppercase">DNI: {form.getValues("dni_solicitante")}</span>
                                            {form.getValues("telefono_solicitante") && <span className="text-[10px] font-mono bg-background/10 border border-background/20 px-2 py-0.5 rounded uppercase">TEL: {form.getValues("telefono_solicitante")}</span>}
                                        </div>
                                    </div>
                                    <div className="bg-background/10 p-4 rounded-xl border border-background/20 text-center min-w-[120px]">
                                        <p className="text-[10px] font-bold uppercase text-background/60 tracking-wider">Total a Pagar</p>
                                        <p className="text-2xl font-black text-primary">S/ {total.toFixed(2)}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="tipo_solicitud"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-muted-foreground uppercase">Concepto</FormLabel>
                                                <FormControl>
                                                    <Input {...field} className="h-10 font-bold uppercase border-border bg-muted/30" />
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
                                                <FormLabel className="text-xs font-bold text-muted-foreground uppercase">Notas</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="..." {...field} className="h-10 border-border" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1">Resumen del Pedido</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {watchedDetalles.map((f, i) => (
                                            <div key={i} className="bg-muted border border-border/60 p-3 rounded-xl flex justify-between items-center transition-all hover:bg-card hover:shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center border bg-card ${getBgColor(f.tipo_acta)}`}>
                                                        {getIcon(f.tipo_acta)}
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-primary uppercase tracking-tighter mb-0.5">{f.tipo_acta}</p>
                                                        <p className="text-xs font-bold text-foreground tracking-tight">ACTA N° {f.numero_acta} ({f.anio})</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 text-right">
                                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tabular-nums">
                                                        {f.cantidad} x S/ {Number(f.precio_unitario).toFixed(2)}
                                                    </div>
                                                    <div className="h-8 w-14 rounded-lg bg-primary/10 flex items-center justify-center font-black text-primary text-xs border border-primary/20 tabular-nums">
                                                        S/ {(Number(f.cantidad) * Number(f.precio_unitario)).toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </Form>

                <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
                    <div>
                        {step > 1 && (
                            <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} disabled={submitting} className="font-bold text-muted-foreground">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {step < 3 ? (
                            <Button
                                size="sm"
                                onClick={async () => {
                                    let valid = false;
                                    if (step === 1) valid = await form.trigger(["dni_solicitante", "nombres_solicitante", "apellidos_solicitante", "telefono_solicitante", "direccion_solicitante"]);
                                    if (step === 2) {
                                        if (fields.length === 0) return toast.error("Debe añadir al menos un acta");
                                        valid = await form.trigger("detalles");
                                    }
                                    if (valid) {
                                        setStep(step + 1);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }
                                }}
                                className="h-12 px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-white font-bold text-xs rounded-2xl transition-all active:scale-95 flex items-center gap-2"
                            >
                                SIGUIENTE PASO <ChevronRight className="h-5 w-5" />
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                onClick={form.handleSubmit(onSubmit)}
                                disabled={submitting}
                                className="h-12 px-10 bg-slate-900 dark:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold text-xs rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
                            >
                                {submitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
                                REGISTRAR SOLICITUD
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
