"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    FileDigit,
    User,
    FileText,
    Upload,
    Save,
    RefreshCw,
    Loader2,
    CheckCircle2,
    Trash2,
    AlertCircle,
    Phone,
    Heart
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { personasService } from "@/services/personas.service";
import { actasService } from "@/services/actas.service";
import { documentosService } from "@/services/documentos.service";
import { Persona } from "@/types/persona";
import { Acta } from "@/types/acta";
import { dateUtils } from "@/utils/dateUtils";
import {
    actaCoincideConIdentidad,
    construirNumeroActa,
} from "@/lib/digitalizacion-acta";
import {
    MENSAJE_ORDEN_FECHAS,
    normalizarFechaOpcional,
    validarOrdenFechas,
} from "@/lib/persona-fechas";

const formSchema = z.object({
    // Persona principal
    tipo_documento: z.string().min(1, "Seleccione tipo"),
    dni: z.string().max(15, "Máximo 15 caracteres").optional().or(z.literal("")),
    nombres: z.string().min(2, "Min. 2 caracteres").regex(/^[A-ZÁÉÍÓÚÑ ]+$/i, "Solo letras y espacios").transform(v => v.toUpperCase()),
    apellido_paterno: z.string().min(2, "Min. 2 caracteres").regex(/^[A-ZÁÉÍÓÚÑ ]+$/i, "Solo letras y espacios").transform(v => v.toUpperCase()),
    apellido_materno: z.string().min(2, "Min. 2 caracteres").regex(/^[A-ZÁÉÍÓÚÑ ]+$/i, "Solo letras y espacios").transform(v => v.toUpperCase()),
    sexo: z.enum(["M", "F"]),
    fecha_nacimiento: z.string().optional(),
    fecha_fallecimiento: z.string().optional(),
    telefono: z.string().optional(),
    persona_observaciones: z.string().optional(),

    // Cónyuge (solo para MATRIMONIO)
    conyuge_tipo_documento: z.string().optional(),
    conyuge_dni: z.string().max(15).optional().or(z.literal("")),
    conyuge_nombres: z.string().optional().transform(v => v?.toUpperCase() ?? ""),
    conyuge_apellido_paterno: z.string().optional().transform(v => v?.toUpperCase() ?? ""),
    conyuge_apellido_materno: z.string().optional().transform(v => v?.toUpperCase() ?? ""),
    conyuge_sexo: z.enum(["M", "F"]).optional(),
    conyuge_fecha_nacimiento: z.string().optional(),
    conyuge_fecha_fallecimiento: z.string().optional(),

    // Acta
    modo: z.enum(["CLASICO", "CUI"]),
    tipo_acta: z.enum(["NACIMIENTO", "MATRIMONIO", "DEFUNCION"]),
    libro: z.string().optional(),
    numero_acta: z.string().min(1, "Campo obligatorio"),
    anio: z.coerce.number().min(1900),
    fecha_acta: z.string().min(1, "Obligatorio"),
    acta_observaciones: z.string().optional(),
}).refine((data) => {
    if (data.modo === "CLASICO" && (!data.libro || data.libro.trim() === "")) return false;
    return true;
}, { message: "Libro es obligatorio en modo clásico", path: ["libro"] })
.refine((data) => {
    if (data.tipo_acta !== "MATRIMONIO") return true;
    return !!(data.conyuge_nombres?.trim() && data.conyuge_apellido_paterno?.trim() && data.conyuge_apellido_materno?.trim());
}, { message: "Los datos del cónyuge son obligatorios para matrimonios", path: ["conyuge_nombres"] })
.superRefine((data, ctx) => {
    if (!validarOrdenFechas(data.fecha_nacimiento, data.fecha_fallecimiento)) {
        ctx.addIssue({
            code: "custom",
            message: MENSAJE_ORDEN_FECHAS,
            path: ["fecha_fallecimiento"],
        });
    }

    if (
        data.tipo_acta === "MATRIMONIO"
        && !validarOrdenFechas(
            data.conyuge_fecha_nacimiento,
            data.conyuge_fecha_fallecimiento,
        )
    ) {
        ctx.addIssue({
            code: "custom",
            message: MENSAJE_ORDEN_FECHAS,
            path: ["conyuge_fecha_fallecimiento"],
        });
    }
});

type FormValues = z.infer<typeof formSchema>;

export default function DigitalizacionPage() {
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [personaEncontrada, setPersonaEncontrada] = useState<Persona | null>(null);
    const [actaEncontrada, setActaEncontrada] = useState<Acta | null>(null);

    const [tiposDocumento, setTiposDocumento] = useState<{ id: number, nombre: string }[]>([]);
    const [personaSecundariaEncontrada, setPersonaSecundariaEncontrada] = useState<Persona | null>(null);
    const [sugerencia, setSugerencia] = useState<number | null>(null);
    // Indica si el valor actual del campo fue puesto por la sugerencia automática (no por el usuario)
    const [esSugerencia, setEsSugerencia] = useState(false);

    useEffect(() => {
        personasService.getTiposDocumento()
            .then(setTiposDocumento)
            .catch(err => console.error("Error cargando tipos documento:", err));
    }, []);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            tipo_documento: "DNI",
            dni: "",
            nombres: "",
            apellido_paterno: "",
            apellido_materno: "",
            sexo: "M",
            fecha_nacimiento: "",
            fecha_fallecimiento: "",
            telefono: "",
            persona_observaciones: "",
            tipo_acta: "NACIMIENTO",
            modo: "CLASICO",
            libro: "",
            numero_acta: "",
            anio: Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric' }).format(new Date())),
            fecha_acta: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date()),
            acta_observaciones: "",
            conyuge_tipo_documento: "DNI",
            conyuge_dni: "",
            conyuge_nombres: "",
            conyuge_apellido_paterno: "",
            conyuge_apellido_materno: "",
            conyuge_sexo: "F",
            conyuge_fecha_nacimiento: "",
            conyuge_fecha_fallecimiento: "",
        }
    });

    const modoValue = form.watch("modo");

    const dniValue      = form.watch("dni");
    const conygeDniValue = form.watch("conyuge_dni");
    const nombresValue  = form.watch("nombres");
    const paternoValue = form.watch("apellido_paterno");
    const maternoValue = form.watch("apellido_materno");
    const libroValue = form.watch("libro");
    const numActaValue = form.watch("numero_acta");
    const fechaActaValue = form.watch("fecha_acta");
    const tipoActaValue = form.watch("tipo_acta");
    const esMatrimonio  = tipoActaValue === "MATRIMONIO";

    // Sincronizar año automáticamente con la fecha del acta
    useEffect(() => {
        if (fechaActaValue) {
            const year = new Date(fechaActaValue + 'T00:00:00').getFullYear();
            if (year >= 1900) {
                form.setValue("anio", year);
            }
        }
    }, [fechaActaValue, form]);

    // Auto-fill del siguiente número de acta
    const anioValue = form.watch("anio");
    useEffect(() => {
        const readyClasico = modoValue === "CLASICO" && tipoActaValue && anioValue >= 1900 && libroValue?.trim();
        const readyCui     = modoValue === "CUI"     && tipoActaValue && anioValue >= 1900;
        if (!readyClasico && !readyCui) { setSugerencia(null); return; }

        const timer = setTimeout(async () => {
            try {
                const res = await actasService.getSiguienteNumero({
                    tipo_acta: tipoActaValue,
                    anio:      anioValue,
                    modo:      modoValue,
                    libro:     modoValue === "CLASICO" ? libroValue : undefined,
                });
                setSugerencia(res.siguiente);
                // Auto-fill: solo si el campo está vacío o si el valor actual era la sugerencia anterior
                if (res.siguiente !== null) {
                    const current = form.getValues("numero_acta");
                    if (!current || esSugerencia) {
                        form.setValue("numero_acta", String(res.siguiente));
                        setEsSugerencia(true);
                    }
                }
            } catch {
                setSugerencia(null);
            }
        }, 400);
        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tipoActaValue, anioValue, libroValue, modoValue]);

    // Autocompletado al digitar DNI / Documento — ciudadano principal
    useEffect(() => {
        if (dniValue && dniValue.length >= 8) {
            personasService.checkDni(dniValue).then(p => {
                if (p) {
                    setPersonaEncontrada(p);
                    form.setValue("tipo_documento", p.tipo_documento || "DNI");
                    form.setValue("nombres", p.nombres);
                    form.setValue("apellido_paterno", p.apellido_paterno);
                    form.setValue("apellido_materno", p.apellido_materno);
                    form.setValue("sexo", p.sexo);
                    form.setValue("fecha_nacimiento", dateUtils.formatInputDate(p.fecha_nacimiento));
                    form.setValue("fecha_fallecimiento", dateUtils.formatInputDate(p.fecha_fallecimiento));
                    form.setValue("telefono", p.telefono || "");
                    form.setValue("persona_observaciones", p.observaciones || "");
                    toast.info("Ciudadano identificado.");
                } else {
                    setPersonaEncontrada(null);
                    form.setValue("nombres", "");
                    form.setValue("apellido_paterno", "");
                    form.setValue("apellido_materno", "");
                    form.setValue("fecha_nacimiento", "");
                    form.setValue("fecha_fallecimiento", "");
                    form.setValue("telefono", "");
                    form.setValue("persona_observaciones", "");
                }
            });
        }
    }, [dniValue, form]);

    // Autocompletado al digitar DNI / Documento — cónyuge (mismo comportamiento)
    useEffect(() => {
        if (!conygeDniValue || conygeDniValue.length < 8) {
            if (!conygeDniValue) {
                setPersonaSecundariaEncontrada(null);
                form.setValue("conyuge_nombres", "");
                form.setValue("conyuge_apellido_paterno", "");
                form.setValue("conyuge_apellido_materno", "");
                form.setValue("conyuge_sexo", "F");
                form.setValue("conyuge_fecha_nacimiento", "");
                form.setValue("conyuge_fecha_fallecimiento", "");
            }
            return;
        }
        const timer = setTimeout(() => {
            personasService.getAll({ termino: conygeDniValue }).then(res => {
                const found = res.data?.[0];
                if (found) {
                    setPersonaSecundariaEncontrada(found);
                    form.setValue("conyuge_nombres", found.nombres);
                    form.setValue("conyuge_apellido_paterno", found.apellido_paterno);
                    form.setValue("conyuge_apellido_materno", found.apellido_materno);
                    form.setValue("conyuge_sexo", found.sexo as "M" | "F");
                    form.setValue("conyuge_fecha_nacimiento", found.fecha_nacimiento ?? "");
                    form.setValue("conyuge_fecha_fallecimiento", found.fecha_fallecimiento ?? "");
                    toast.info("Cónyuge identificado.");
                } else {
                    setPersonaSecundariaEncontrada(null);
                    form.setValue("conyuge_nombres", "");
                    form.setValue("conyuge_apellido_paterno", "");
                    form.setValue("conyuge_apellido_materno", "");
                    form.setValue("conyuge_sexo", "F");
                    form.setValue("conyuge_fecha_nacimiento", "");
                    form.setValue("conyuge_fecha_fallecimiento", "");
                }
            }).catch(() => {/* silencioso — el usuario puede ingresar manualmente */});
        }, 400);
        return () => clearTimeout(timer);
    }, [conygeDniValue, form]);

    // Búsqueda de duplicados por nombre (para verificar homonimias)
    useEffect(() => {
        if (nombresValue?.length > 2 && paternoValue?.length > 2 && maternoValue?.length > 2) {
            const timer = setTimeout(() => {
                personasService.buscarDuplicados(nombresValue, paternoValue, maternoValue)
                    .then(personas => {
                        // Solo alertamos si:
                        // 1. Encontramos a alguien con esos nombres
                        // 2. No es la misma persona que ya identificamos por DNI (si existiera)
                        const p = personas[0];
                        if (p && (!personaEncontrada || p.id !== personaEncontrada.id)) {
                            const esDiferenteDni = dniValue && p.dni !== dniValue;

                            toast.warning(
                                esDiferenteDni ? "Posible Homonimia Detectada" : "Ciudadano ya registrado",
                                {
                                    description: esDiferenteDni
                                        ? `Existe un ciudadano con los mismos nombres pero con DNI ${p.dni || "S/N"}. Verifique si se trata de la misma persona.`
                                        : `El ciudadano ${p.apellido_paterno} ${p.apellido_materno}, ${p.nombres} ya existe en el sistema.`,
                                    duration: 8000
                                }
                            );
                        }
                    });
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [nombresValue, paternoValue, maternoValue, dniValue, personaEncontrada]);

    // Validación de Acta Duplicada por Número (Preventiva)
    useEffect(() => {
        if (numActaValue && (modoValue === 'CUI' || libroValue)) {
            const getPrefix = (tipo: string) => {
                switch (tipo) {
                    case 'NACIMIENTO': return 'NAC';
                    case 'MATRIMONIO': return 'MAT';
                    case 'DEFUNCION': return 'DEF';
                    default: return 'ACT';
                }
            };
            const formattedNum = modoValue === "CUI"
                ? numActaValue.toUpperCase()
                : `${getPrefix(tipoActaValue)}-L${libroValue}-${numActaValue}`;

            const timer = setTimeout(() => {
                actasService.getAll({
                    numero: formattedNum
                }).then(response => {
                    const actas = response.data || [];
                    const existente = actas.find(a =>
                        String(a.numero_acta).trim().toUpperCase() === formattedNum.toUpperCase()
                    );

                    if (existente) {
                        setActaEncontrada(existente);
                        const esMismaPersona = existente.dni === dniValue;

                        toast.warning(
                            `Aviso: El acta N° ${formattedNum} ya está registrada.`,
                            {
                                duration: 10000,
                                description: esMismaPersona
                                    ? `Este ciudadano (${existente.tipo_acta}) ya tiene este número de acta.`
                                    : `Registrada para otro ciudadano en ${existente.anio} (${existente.tipo_acta}).`
                            }
                        );
                    } else {
                        setActaEncontrada(null);
                    }
                }).catch(err => {
                    console.error("Error checking actas:", err);
                });
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [numActaValue, libroValue, tipoActaValue, dniValue, modoValue]);



    const resetAll = () => {
        form.reset();
        setFile(null);
        setPersonaEncontrada(null);
        setActaEncontrada(null);
        setSugerencia(null);
        setEsSugerencia(false);
        toast.info("Formulario reiniciado");
    };

    const onSubmit = async (values: FormValues) => {
        // Bloqueo estricto: El objetivo de esta página es la DIGITALIZACIÓN
        if (!file) {
            toast.error("Documento Requerido", {
                description: "Debe adjuntar el sustento digital (PDF o Imagen) para proceder con el registro.",
            });
            return;
        }

        setLoading(true);
        try {
            // 1. Crear o actualizar persona
            let personaId = personaEncontrada?.id;
            if (personaId) {
                // Actualizar datos del ciudadano, incluyendo DNI si se proporcionó
                // (cubre el caso: persona registrada sin DNI que ahora sí tiene)
                await personasService.update(personaId, {
                    dni: values.dni || undefined,
                    tipo_documento: values.tipo_documento,
                    nombres: values.nombres,
                    apellido_paterno: values.apellido_paterno,
                    apellido_materno: values.apellido_materno,
                    sexo: values.sexo,
                    fecha_nacimiento: normalizarFechaOpcional(values.fecha_nacimiento),
                    fecha_fallecimiento: normalizarFechaOpcional(values.fecha_fallecimiento),
                    telefono: values.telefono,
                    observaciones: values.persona_observaciones
                });
            } else {
                const newPersona = await personasService.create({
                    tipo_documento: values.tipo_documento,
                    dni: values.dni,
                    nombres: values.nombres,
                    apellido_paterno: values.apellido_paterno,
                    apellido_materno: values.apellido_materno,
                    sexo: values.sexo,
                    fecha_nacimiento: normalizarFechaOpcional(values.fecha_nacimiento),
                    fecha_fallecimiento: normalizarFechaOpcional(values.fecha_fallecimiento),
                    telefono: values.telefono,
                    observaciones: values.persona_observaciones
                });
                personaId = newPersona.id;
            }

            // 2. Registrar cónyuge si es matrimonio
            let personaSecundariaId: number | undefined = personaSecundariaEncontrada?.id;
            if (values.tipo_acta === "MATRIMONIO") {
                if (personaSecundariaId) {
                    await personasService.update(personaSecundariaId, {
                        tipo_documento: values.conyuge_tipo_documento,
                        nombres: values.conyuge_nombres!,
                        apellido_paterno: values.conyuge_apellido_paterno!,
                        apellido_materno: values.conyuge_apellido_materno!,
                        sexo: values.conyuge_sexo,
                        fecha_nacimiento: normalizarFechaOpcional(values.conyuge_fecha_nacimiento),
                        fecha_fallecimiento: normalizarFechaOpcional(values.conyuge_fecha_fallecimiento),
                    });
                } else {
                    const newConyuge = await personasService.create({
                        tipo_documento: values.conyuge_tipo_documento,
                        dni: values.conyuge_dni,
                        nombres: values.conyuge_nombres!,
                        apellido_paterno: values.conyuge_apellido_paterno!,
                        apellido_materno: values.conyuge_apellido_materno!,
                        sexo: values.conyuge_sexo,
                        fecha_nacimiento: normalizarFechaOpcional(values.conyuge_fecha_nacimiento),
                        fecha_fallecimiento: normalizarFechaOpcional(values.conyuge_fecha_fallecimiento),
                    });
                    personaSecundariaId = newConyuge.id;
                }
            }

            // 3. Crear o Actualizar Acta
            const fullNumeroActa = construirNumeroActa({
                modo: values.modo,
                tipoActa: values.tipo_acta,
                libro: values.libro,
                numeroActa: values.numero_acta,
            });
            const actaVigente = actaCoincideConIdentidad(
                actaEncontrada,
                fullNumeroActa,
                values.anio,
                {
                    principalId: personaId as number,
                    secundariaId: personaSecundariaId ?? null,
                },
            )
                ? actaEncontrada
                : null;

            let currentActaId: number;
            if (actaVigente) {
                const updatedActa = await actasService.update(actaVigente.id, {
                    tipo_acta: values.tipo_acta,
                    numero_acta: fullNumeroActa,
                    anio: values.anio,
                    fecha_acta: values.fecha_acta,
                    persona_principal_id: personaId,
                    persona_secundaria_id: personaSecundariaId ?? null,
                    observaciones: values.acta_observaciones
                });
                currentActaId = updatedActa.id;
            } else {
                const newActa = await actasService.create({
                    tipo_acta: values.tipo_acta,
                    numero_acta: fullNumeroActa,
                    anio: values.anio,
                    fecha_acta: values.fecha_acta,
                    persona_principal_id: personaId as number,
                    persona_secundaria_id: personaSecundariaId ?? null,
                    observaciones: values.acta_observaciones
                });
                currentActaId = newActa.id;
            }

            // 3. Subir Documento si hay
            if (file) {
                try {
                    await documentosService.upload(currentActaId, file);
                    toast.success("Operación exitosa: Datos y documento actualizados.");
                } catch (err) {
                    toast.warning("Datos guardados, pero falló la subida del archivo.");
                }
            } else {
                toast.success(actaVigente ? "Acta actualizada con éxito." : "Nueva acta registrada con éxito.");
            }

            resetAll();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error al procesar el registro integral");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500 pb-24">

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3 text-foreground">
                    <div className="bg-primary p-2.5 rounded-xl shadow-primary/20 shadow-lg shrink-0">
                        <FileDigit className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight leading-none">
                            Consola de Digitalización
                        </h1>
                        <p className="text-muted-foreground font-medium text-[11px] mt-0.5">
                            Registro integral de actas y archivo digital
                        </p>
                    </div>
                </div>
                {/* indicador compacto visible en tablet+ */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-card text-xs font-semibold">
                    <div className={cn("h-2 w-2 rounded-full shrink-0", file ? "bg-emerald-500" : "bg-amber-400")} />
                    {file ? `Archivo: ${file.name.slice(0, 22)}…` : "Sin documento adjunto"}
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>

                    {/* ── Grid principal ─────────────────────────────────────────── */}
                    {/*  mobile:  1 col stacked                                       */}
                    {/*  md:      2 col — 7 + 5                                       */}
                    {/*  xl:      3 col — 5 + 4 + 3  (ciudadano | acta | upload)      */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">

                        {/* ╔══════════════════════════════╗
                            ║  1. INFORMACIÓN DEL CIUDADANO  ║  md:7  xl:5
                            ╚══════════════════════════════╝ */}
                        <div className="md:col-span-7 xl:col-span-5 space-y-3">
                            <Card className="shadow-sm border-border rounded-2xl overflow-hidden bg-card py-0 gap-0">
                                <CardHeader className="h-9 flex items-center px-4 border-b bg-muted/40 py-0! pb-0!">
                                    <div className="flex items-center gap-2">
                                        <User size={13} className="text-primary shrink-0" />
                                        <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80 leading-none">
                                            1. Información del Ciudadano
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-4 py-4 space-y-3">

                                    {/* Fila 1: Tipo(3) | N°Doc(4) | F.Nac(3) | Sexo(2) = 12 cols */}
                                    <div className="grid grid-cols-12 gap-2">
                                        <div className="col-span-3">
                                            <FormField control={form.control} name="tipo_documento" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="std-label">Tipo Doc.</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className={cn("std-input h-9 text-xs font-semibold", !!personaEncontrada && "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20")}>
                                                                <SelectValue placeholder="—" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {tiposDocumento.length > 0
                                                                ? tiposDocumento.map(t => <SelectItem key={t.id} value={t.nombre} className="font-semibold text-xs">{t.nombre}</SelectItem>)
                                                                : <SelectItem value="DNI" className="font-semibold text-xs">DNI</SelectItem>}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        <div className="col-span-4">
                                            <FormField control={form.control} name="dni" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="std-label">N° Documento</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            onChange={(event) => {
                                                                setActaEncontrada(null);
                                                                field.onChange(event);
                                                            }}
                                                            maxLength={15}
                                                            placeholder="Número..."
                                                            className="std-input h-9 text-sm font-semibold tracking-widest" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        <div className="col-span-3">
                                            <FormField control={form.control} name="fecha_nacimiento" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="std-label">F. Nacimiento</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field}
                                                            className={cn("std-input h-9 text-xs", !!personaEncontrada && "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20")}
                                                             />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        <div className="col-span-2">
                                            <FormField control={form.control} name="sexo" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="std-label">Sexo</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className={cn("std-input h-9 font-bold text-xs justify-center gap-1 px-2 [&>span]:flex-none", !!personaEncontrada && "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20")}>
                                                                <span className="font-bold">{field.value || "—"}</span>
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="M" className="font-semibold text-xs">M — Masculino</SelectItem>
                                                            <SelectItem value="F" className="font-semibold text-xs">F — Femenino</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                    </div>

                                    {/* Fila 2: nombres */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                        <FormField control={form.control} name="nombres" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="std-label">Nombres</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="NOMBRES"
                                                        className={cn("std-input h-9 font-semibold uppercase text-xs", !!personaEncontrada && "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20")}
                                                        onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="apellido_paterno" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="std-label">Ap. Paterno</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="PATERNO"
                                                        className={cn("std-input h-9 font-semibold uppercase text-xs", !!personaEncontrada && "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20")}
                                                        onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="apellido_materno" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="std-label">Ap. Materno</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="MATERNO"
                                                        className={cn("std-input h-9 font-semibold uppercase text-xs", !!personaEncontrada && "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20")}
                                                        onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>

                                    {/* Fila 3: F. Fallecimiento + teléfono + observaciones */}
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                                        <FormField control={form.control} name="fecha_fallecimiento" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="std-label">F. Fallecimiento</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field}
                                                        className={cn("std-input h-9 text-xs", !!personaEncontrada && "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20")}
                                                         />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="telefono" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="std-label">Teléfono</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input {...field} placeholder="Opcional"
                                                            className={cn("std-input h-9 pl-8 text-xs", !!personaEncontrada && "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20")} />
                                                        <Phone size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none" />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="persona_observaciones" render={({ field }) => (
                                            <FormItem className="sm:col-span-2">
                                                <FormLabel className="std-label">Observaciones</FormLabel>
                                                <FormControl>
                                                    <Textarea {...field} placeholder="Aclaraciones adicionales..."
                                                        className={cn("std-input min-h-[36px] py-2 resize-none text-xs", !!personaEncontrada && "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20")} rows={1} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>

                                    {/* Persona identificada */}
                                    {personaEncontrada && (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/30">
                                            <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                                                Ciudadano identificado — ID #{personaEncontrada.id}
                                            </span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* ── CÓNYUGE: en mobile/md debajo del ciudadano; en xl debajo también ── */}
                            {esMatrimonio && (
                                <Card className="shadow-sm border-purple-200 dark:border-purple-900/40 rounded-2xl overflow-hidden bg-card py-0 gap-0">
                                    <CardHeader className="h-9 flex items-center px-4 border-b bg-purple-50/60 dark:bg-purple-950/20 py-0! pb-0!">
                                        <div className="flex items-center gap-2">
                                            <Heart size={13} className="text-purple-500 shrink-0" />
                                            <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 leading-none">
                                                Cónyuge — Obligatorio en Matrimonio
                                            </CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="px-4 py-4 space-y-3">
                                        {/* N° documento cónyuge — búsqueda automática al tipear ≥8 caracteres */}
                                        <FormField control={form.control} name="conyuge_dni" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="std-label">N° Documento Cónyuge</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        onChange={(event) => {
                                                            setActaEncontrada(null);
                                                            field.onChange(event);
                                                        }}
                                                        maxLength={15}
                                                        placeholder="Número de documento..."
                                                        className={cn(
                                                            "std-input h-9 text-sm font-semibold tracking-widest",
                                                            personaSecundariaEncontrada && "border-purple-300 dark:border-purple-700"
                                                        )} />
                                                </FormControl>
                                            </FormItem>
                                        )} />

                                        {/* nombres cónyuge */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                            <FormField control={form.control} name="conyuge_nombres" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="std-label">Nombres</FormLabel>
                                                    <FormControl><Input {...field} placeholder="NOMBRES" className="std-input h-9 text-xs uppercase" onChange={(e) => field.onChange(e.target.value.toUpperCase())} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="conyuge_apellido_paterno" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="std-label">Ap. Paterno</FormLabel>
                                                    <FormControl><Input {...field} placeholder="PATERNO" className="std-input h-9 text-xs uppercase" onChange={(e) => field.onChange(e.target.value.toUpperCase())} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="conyuge_apellido_materno" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="std-label">Ap. Materno</FormLabel>
                                                    <FormControl><Input {...field} placeholder="MATERNO" className="std-input h-9 text-xs uppercase" onChange={(e) => field.onChange(e.target.value.toUpperCase())} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        {/* Sexo (2/12) + F.Nacimiento (5/12) + F.Fallecimiento (5/12) */}
                                        <div className="grid grid-cols-12 gap-2">
                                            <div className="col-span-2">
                                                <FormField control={form.control} name="conyuge_sexo" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="std-label">Sexo</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value} defaultValue="F">
                                                            <FormControl>
                                                                <SelectTrigger className="std-input h-9 font-bold text-xs justify-center gap-1 px-2 [&>span]:flex-none">
                                                                    <span className="font-bold">{field.value || "—"}</span>
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="M" className="font-semibold text-xs">M — Masculino</SelectItem>
                                                                <SelectItem value="F" className="font-semibold text-xs">F — Femenino</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )} />
                                            </div>
                                            <div className="col-span-5">
                                                <FormField control={form.control} name="conyuge_fecha_nacimiento" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="std-label">F. Nacimiento</FormLabel>
                                                        <FormControl><Input type="date" {...field} className="std-input h-9 text-xs" /></FormControl>
                                                    </FormItem>
                                                )} />
                                            </div>
                                            <div className="col-span-5">
                                                <FormField control={form.control} name="conyuge_fecha_fallecimiento" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="std-label">F. Fallecimiento</FormLabel>
                                                        <FormControl><Input type="date" {...field} className="std-input h-9 text-xs" /></FormControl>
                                                    </FormItem>
                                                )} />
                                            </div>
                                        </div>

                                        {personaSecundariaEncontrada && (
                                            <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-900/30">
                                                <CheckCircle2 size={13} className="text-purple-500 shrink-0" />
                                                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">
                                                    Vinculado a registro existente ID #{personaSecundariaEncontrada.id}
                                                </span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* ╔════════════════╗
                            ║  2. ACTA + FILE  ║  md:5  xl:4
                            ╚════════════════╝ */}
                        <div className="md:col-span-5 xl:col-span-4 space-y-3">
                            <Card className="shadow-sm border-border rounded-2xl overflow-hidden bg-card py-0 gap-0">
                                <CardHeader className="h-9 flex items-center px-4 border-b bg-muted/40 py-0! pb-0!">
                                    <div className="flex items-center gap-2">
                                        <FileText size={13} className="text-primary shrink-0" />
                                        <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80 leading-none">
                                            2. Especificaciones del Acta
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-4 py-4 space-y-3">

                                    {/* Toggle libro / CUI */}
                                    <div className="flex p-1 bg-muted/60 rounded-xl w-fit">
                                        <Button type="button" variant={modoValue === 'CLASICO' ? 'default' : 'ghost'} size="sm"
                                            className={cn("rounded-lg h-7 text-[9px] font-black uppercase tracking-widest px-3.5", modoValue === 'CLASICO' && "bg-primary shadow-sm")}
                                            onClick={() => {
                                                setActaEncontrada(null);
                                                form.setValue("modo", "CLASICO");
                                            }}>
                                            Libro Clásico
                                        </Button>
                                        <Button type="button" variant={modoValue === 'CUI' ? 'default' : 'ghost'} size="sm"
                                            className={cn("rounded-lg h-7 text-[9px] font-black uppercase tracking-widest px-3.5", modoValue === 'CUI' && "bg-primary shadow-sm")}
                                            onClick={() => {
                                                setActaEncontrada(null);
                                                form.setValue("modo", "CUI");
                                            }}>
                                            RENIEC (CUI)
                                        </Button>
                                    </div>

                                    {/* tipo acta + fecha */}
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <FormField control={form.control} name="tipo_acta" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="std-label">Tipo de Acta</FormLabel>
                                                <Select
                                                    onValueChange={(value) => {
                                                        setActaEncontrada(null);
                                                        field.onChange(value);
                                                    }}
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className={cn("std-input h-9 font-bold text-xs", !!actaEncontrada && "border-rose-400 bg-rose-50/50 dark:bg-rose-950/20")}>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="NACIMIENTO" className="font-semibold text-xs">Nacimiento</SelectItem>
                                                        <SelectItem value="MATRIMONIO" className="font-semibold text-xs">Matrimonio</SelectItem>
                                                        <SelectItem value="DEFUNCION" className="font-semibold text-xs">Defunción</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )} />

                                        <FormField control={form.control} name="fecha_acta" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="std-label">F. Registro</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} className={cn("std-input h-9 text-xs font-semibold", !!actaEncontrada && "border-rose-400 bg-rose-50/50 dark:bg-rose-950/20")} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>

                                    {/* libro / n° acta / año */}
                                    <div className="grid grid-cols-12 gap-2">
                                        {modoValue === 'CLASICO' && (
                                            <div className="col-span-4">
                                                <FormField control={form.control} name="libro" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="std-label">Libro N°</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                onChange={(event) => {
                                                                    setActaEncontrada(null);
                                                                    field.onChange(event);
                                                                }}
                                                                placeholder="N°"
                                                                className={cn("std-input h-9 font-bold text-center text-sm", !!actaEncontrada && "border-rose-400 bg-rose-50/50 dark:bg-rose-950/20")} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                            </div>
                                        )}
                                        <div className={cn(modoValue === 'CLASICO' ? "col-span-5" : "col-span-9")}>
                                            <FormField control={form.control} name="numero_acta" render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <FormLabel className="std-label m-0 leading-none">
                                                                {modoValue === 'CLASICO' ? 'N° Acta' : 'CUI / ID'}
                                                            </FormLabel>
                                                            {esSugerencia && numActaValue && (
                                                                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-1 py-0.5 rounded">
                                                                    AUTO
                                                                </span>
                                                            )}
                                                        </div>
                                                        {modoValue === 'CLASICO' && (libroValue || numActaValue) && (
                                                            <Badge variant="outline" className="h-4 px-1 text-[8px] bg-primary/5 text-primary border-primary/20 font-bold shrink-0">
                                                                {tipoActaValue.substring(0, 3)}-L{libroValue || '?'}-{numActaValue || '?'}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            placeholder={modoValue === 'CLASICO' ? "Número" : "Código CUI"}
                                                            className={cn(
                                                                "std-input h-9 font-black uppercase text-sm tracking-widest",
                                                                esSugerencia && numActaValue && "border-emerald-300 dark:border-emerald-700",
                                                                !!actaEncontrada && "border-rose-400 bg-rose-50/50 dark:bg-rose-950/20"
                                                            )}
                                                            onChange={(e) => {
                                                                setActaEncontrada(null);
                                                                field.onChange(e.target.value.toUpperCase());
                                                                setEsSugerencia(false);
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                        <div className="col-span-3">
                                            <FormField control={form.control} name="anio" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="std-label">Año</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" {...field} disabled
                                                            className="std-input h-9 bg-muted/50 text-muted-foreground font-bold text-xs text-center" />
                                                    </FormControl>
                                                </FormItem>
                                            )} />
                                        </div>
                                    </div>

                                    <FormField control={form.control} name="acta_observaciones" render={({ field }) => (
                                        <FormItem>
                                                    <FormLabel className="std-label">Observaciones</FormLabel>
                                                    <FormControl>
                                                        <Textarea {...field} disabled={!!actaEncontrada} placeholder="Notas adicionales del acta..."
                                                            className="std-input min-h-[36px] py-2 resize-none text-xs" rows={1} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </CardContent>
                            </Card>
                        </div>

                        {/* ╔══════════════════╗
                            ║  3. ARCHIVO FILE   ║  md:full-row en mobile/md, xl:3
                            ╚══════════════════╝ */}
                        <div className="md:col-span-12 xl:col-span-3 space-y-3">
                            <Card className="shadow-sm border-border rounded-2xl overflow-hidden bg-card py-0 gap-0 h-full">
                                <CardHeader className="h-9 flex items-center px-4 border-b bg-muted/40 py-0! pb-0!">
                                    <div className="flex items-center gap-2">
                                        <Upload size={13} className="text-primary shrink-0" />
                                        <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80 leading-none">
                                            3. Archivo Digitalizado
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-4 py-4 flex flex-col gap-3">

                                    {/* input siempre en DOM — permite reemplazar archivo */}
                                    <input
                                        type="file"
                                        className="hidden"
                                        id="file-upload-main"
                                        onChange={(e) => e.target.files && setFile(e.target.files[0])}
                                        accept="application/pdf,image/*"
                                    />

                                    {/* zona drag-and-drop */}
                                    <div
                                        className={cn(
                                            "border-2 border-dashed rounded-2xl transition-all cursor-pointer group",
                                            "flex xl:flex-col items-center gap-3 xl:justify-center p-4 xl:py-6 xl:min-h-[140px]",
                                            file
                                                ? "border-primary/60 bg-primary/5"
                                                : "border-border/70 hover:border-primary/50 hover:bg-muted/20 dark:border-border"
                                        )}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
                                        }}
                                        onClick={() => document.getElementById('file-upload-main')?.click()}
                                    >
                                        {file ? (
                                            <div className="bg-primary/20 p-2.5 rounded-full group-hover:scale-110 transition-transform shrink-0">
                                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                            </div>
                                        ) : (
                                            <div className="bg-muted/80 p-2.5 rounded-full group-hover:scale-110 transition-transform shrink-0">
                                                <Upload className="h-5 w-5 text-muted-foreground/50" />
                                            </div>
                                        )}

                                        <div className="flex flex-col xl:items-center xl:text-center gap-0.5 min-w-0">
                                            <span className="font-bold text-foreground text-xs uppercase tracking-tight leading-tight truncate max-w-full">
                                                {file ? file.name : "Arrastra o haz clic"}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground/60 font-semibold uppercase">
                                                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB — listo` : "PDF · JPG · PNG · máx 20 MB"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* acciones de archivo */}
                                    {file ? (
                                        <Button variant="ghost" size="sm" type="button"
                                            onClick={() => setFile(null)}
                                            className="w-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-bold uppercase text-[10px] tracking-wider h-8 rounded-xl border border-rose-100 dark:border-rose-900/30">
                                            <Trash2 size={13} className="mr-1.5" /> Quitar Archivo
                                        </Button>
                                    ) : (
                                        <>
                                            <Button type="button" variant="outline"
                                                className="w-full border-border h-9 rounded-xl font-bold uppercase text-[10px] tracking-widest"
                                                onClick={() => document.getElementById('file-upload-main')?.click()}>
                                                Examinar Archivos
                                            </Button>
                                            <div className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase rounded-xl border border-amber-100 dark:border-amber-900/30 tracking-tight leading-snug">
                                                <AlertCircle size={13} className="shrink-0 mt-px" />
                                                <span>Documento requerido para procesar.</span>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                    </div>
                </form>
            </Form>

            {/* ── BARRA FIJA INFERIOR ─────────────────────────────────────────── */}
            <div className="fixed bottom-0 left-0 right-0 md:left-20 lg:left-64 z-40
                            bg-background/85 backdrop-blur-md border-t border-border
                            px-4 py-2.5 shadow-[0_-4px_20px_rgb(0,0,0,0.06)]
                            animate-in slide-in-from-bottom-full duration-300">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

                    {/* estado */}
                    <div className="hidden sm:flex flex-col gap-0.5 min-w-0">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none">Estado</span>
                        <div className="flex items-center gap-1.5">
                            <div className={cn("h-2 w-2 rounded-full shrink-0", file ? "bg-emerald-500" : "bg-amber-400")} />
                            <span className="text-xs font-bold text-foreground truncate">
                                {file ? `${file.name.slice(0, 28)}${file.name.length > 28 ? '…' : ''}` : "Falta documento"}
                            </span>
                        </div>
                    </div>

                    {/* acciones */}
                    <div className="flex gap-2.5 w-full sm:w-auto">
                        <Button variant="outline" onClick={resetAll} disabled={loading}
                            className="flex-1 sm:flex-none h-10 px-6 border-border bg-card hover:bg-muted font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-all flex items-center gap-2">
                            <RefreshCw size={14} /> Reiniciar
                        </Button>
                        <Button onClick={form.handleSubmit(onSubmit)} disabled={loading}
                            className="flex-1 sm:flex-none h-10 px-6 bg-primary hover:bg-primary/90 shadow-primary/25 shadow-lg text-white font-bold text-xs rounded-xl active:scale-95 transition-all flex items-center gap-2">
                            {loading ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Procesando…</>
                            ) : (
                                <><Save className="h-4 w-4" /> Procesar Registro</>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
