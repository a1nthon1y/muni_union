"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
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
import { Loader2, Save, UserPlus, Fingerprint, MapPin, Calendar, Phone } from "lucide-react";
import { Persona, PersonaInput } from "@/types/persona";
import { personasService } from "@/services/personas.service";
import { dateUtils } from "@/utils/dateUtils";
import {
    MENSAJE_ORDEN_FECHAS,
    normalizarFechaOpcional,
    validarOrdenFechas,
} from "@/lib/persona-fechas";
import {
    maxLengthDocumento,
    sanitizarApellido,
    sanitizarDocumento,
    sanitizarNombres,
    sanitizarSoloDigitos,
    validarApellido,
    validarDocumento,
    validarFechaNoFutura,
    validarNombres,
    validarTelefono,
} from "@/lib/form-validators";

const sexoDesdePersona = (valor?: string | null): "M" | "F" => (
    valor === "F" ? "F" : "M"
);

const personaSchema = z.object({
    tipo_documento: z.string().min(1, "Seleccione tipo"),
    dni: z.string().optional().or(z.literal("")),
    nombres: z.string().min(1, "Nombres son obligatorios"),
    apellido_paterno: z.string().min(1, "Apellido paterno es obligatorio"),
    apellido_materno: z.string().min(1, "Apellido materno es obligatorio"),
    sexo: z.enum(["M", "F"], { message: "Seleccione sexo" }),
    fecha_nacimiento: z.string().optional().or(z.literal("")),
    fecha_fallecimiento: z.string().optional().or(z.literal("")),
    telefono: z.string().optional().or(z.literal("")),
    direccion: z.string().max(200).optional().or(z.literal("")),
    observaciones: z.string().max(500).optional().or(z.literal("")),
}).superRefine((data, ctx) => {
    const add = (path: string, message: string) => {
        ctx.addIssue({ code: "custom", message, path: [path] });
    };

    for (const [valor, path, etiqueta] of [
        [data.apellido_paterno, "apellido_paterno", "Ap. paterno"],
        [data.apellido_materno, "apellido_materno", "Ap. materno"],
    ] as const) {
        const err = validarApellido(valor, etiqueta);
        if (err) add(path, err);
    }

    const errNombres = validarNombres(data.nombres);
    if (errNombres) add("nombres", errNombres);

    const errDoc = validarDocumento(data.tipo_documento, data.dni);
    if (errDoc) add("dni", errDoc);

    const errTel = validarTelefono(data.telefono);
    if (errTel) add("telefono", errTel);

    const errFechaNac = validarFechaNoFutura(data.fecha_nacimiento, "F. nacimiento");
    if (errFechaNac) add("fecha_nacimiento", errFechaNac);

    const errFechaFall = validarFechaNoFutura(data.fecha_fallecimiento, "F. fallecimiento");
    if (errFechaFall) add("fecha_fallecimiento", errFechaFall);

    if (!validarOrdenFechas(data.fecha_nacimiento, data.fecha_fallecimiento)) {
        add("fecha_fallecimiento", MENSAJE_ORDEN_FECHAS);
    }
});

type PersonaFormValues = z.infer<typeof personaSchema>;

interface PersonaSheetProps {
    isOpen: boolean;
    onClose: () => void;
    persona?: Persona | null;
    onSubmit: (values: PersonaInput) => Promise<Persona | null>;
}

export function PersonaSheet({
    isOpen,
    onClose,
    persona,
    onSubmit
}: PersonaSheetProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tiposDocumento, setTiposDocumento] = useState<{ id: number, nombre: string }[]>([]);

    useEffect(() => {
        const loadTipos = async () => {
            try {
                const data = await personasService.getTiposDocumento();
                setTiposDocumento(data);
            } catch (error) {
                console.error("Error al cargar tipos de documento:", error);
            }
        };
        if (isOpen) {
            loadTipos();
        }
    }, [isOpen]);

    const form = useForm<PersonaFormValues>({
        resolver: zodResolver(personaSchema),
        mode: "onTouched",
        reValidateMode: "onChange",
        defaultValues: {
            tipo_documento: "DNI",
            dni: "",
            nombres: "",
            apellido_paterno: "",
            apellido_materno: "",
            sexo: 'M',
            fecha_nacimiento: "",
            fecha_fallecimiento: "",
            telefono: "",
            direccion: "",
            observaciones: "",
        },
    });

    const tipoDocumentoValue = form.watch("tipo_documento");

    useEffect(() => {
        if (isOpen) {
            if (persona) {
                form.reset({
                    tipo_documento: persona.tipo_documento || "DNI",
                    dni: persona.dni || "",
                    nombres: persona.nombres || "",
                    apellido_paterno: persona.apellido_paterno || "",
                    apellido_materno: persona.apellido_materno || "",
                    sexo: sexoDesdePersona(persona.sexo),
                    fecha_nacimiento: dateUtils.formatInputDate(persona.fecha_nacimiento),
                    fecha_fallecimiento: dateUtils.formatInputDate(persona.fecha_fallecimiento),
                    telefono: persona.telefono || "",
                    direccion: persona.direccion || "",
                    observaciones: persona.observaciones || "",
                });
            } else {
                form.reset({
                    tipo_documento: "DNI",
                    dni: "",
                    nombres: "",
                    apellido_paterno: "",
                    apellido_materno: "",
                    sexo: 'M',
                    fecha_nacimiento: "",
                    fecha_fallecimiento: "",
                    telefono: "",
                    direccion: "",
                    observaciones: "",
                });
            }
        }
    }, [persona, isOpen, form]);

    const handleFormSubmit = async (values: PersonaFormValues) => {
        try {
            setIsSubmitting(true);
            const input: PersonaInput = {
                tipo_documento: values.tipo_documento,
                dni: values.dni || undefined,
                nombres: values.nombres.toUpperCase(),
                apellido_paterno: values.apellido_paterno.toUpperCase(),
                apellido_materno: values.apellido_materno.toUpperCase(),
                sexo: values.sexo,
                fecha_nacimiento: persona
                    ? normalizarFechaOpcional(values.fecha_nacimiento)
                    : normalizarFechaOpcional(values.fecha_nacimiento) ?? undefined,
                fecha_fallecimiento: persona
                    ? normalizarFechaOpcional(values.fecha_fallecimiento)
                    : normalizarFechaOpcional(values.fecha_fallecimiento) ?? undefined,
                telefono: values.telefono || undefined,
                direccion: values.direccion?.toUpperCase() || undefined,
                observaciones: values.observaciones || undefined,
            };

            const result = await onSubmit(input);
            if (result) {
                onClose();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={(v) => !v && onClose()}>
            <SheetContent className="sm:max-w-md flex flex-col h-full p-0 overflow-hidden">
                <div className="p-6 border-b bg-muted/30">
                    <SheetHeader>
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2.5 rounded-xl">
                                {persona ? (
                                    <Fingerprint className="h-5 w-5 text-primary" />
                                ) : (
                                    <UserPlus className="h-5 w-5 text-primary" />
                                )}
                            </div>
                            <div>
                                <SheetTitle className="text-xl font-bold tracking-tight">
                                    {persona ? "Editar Ciudadano" : "Nuevo Ciudadano"}
                                </SheetTitle>
                                <SheetDescription className="text-muted-foreground font-medium text-[11px] uppercase tracking-wider">
                                    {persona ? "Ref: #" + persona.id : "Registro Civil / Municipal"}
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <Form {...form}>
                        <form id="persona-form" onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 pb-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="tipo_documento"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="std-label mb-1.5 uppercase font-bold text-[10px] text-primary tracking-wider">Tipo Doc.</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="std-input h-10 font-bold bg-muted/20 border-primary/20">
                                                        <SelectValue placeholder="—" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {tiposDocumento.length > 0 ? (
                                                        tiposDocumento.map((tipo) => (
                                                            <SelectItem key={tipo.id} value={tipo.nombre} className="font-semibold">
                                                                {tipo.nombre}
                                                            </SelectItem>
                                                        ))
                                                    ) : (
                                                        <>
                                                            <SelectItem value="DNI" className="font-semibold">DNI</SelectItem>
                                                            <SelectItem value="CNE" className="font-semibold">CARNET EXTR.</SelectItem>
                                                            <SelectItem value="PASAPORTE" className="font-semibold">PASAPORTE</SelectItem>
                                                            <SelectItem value="P. NACIMIENTO" className="font-semibold">P. NACIMIENTO</SelectItem>
                                                        </>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="dni"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="std-label flex items-center gap-2">
                                                <Fingerprint className="h-3 w-3 text-primary" /> N° DOCUMENTO
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="NÚMERO"
                                                    maxLength={maxLengthDocumento(tipoDocumentoValue) || 15}
                                                    disabled={tipoDocumentoValue.toUpperCase().includes("SIN DOCUMENTO")}
                                                    className="std-input h-10 font-bold bg-muted/20"
                                                    onChange={(e) => field.onChange(
                                                        sanitizarDocumento(e.target.value, tipoDocumentoValue),
                                                    )}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="sexo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="std-label mb-1.5 uppercase font-bold text-[10px] text-muted-foreground mr-2">Sexo</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="std-input h-10 font-bold">
                                                        <SelectValue placeholder="—" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="M" className="font-semibold">MASCULINO</SelectItem>
                                                    <SelectItem value="F" className="font-semibold">FEMENINO</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="fecha_nacimiento"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="std-label flex items-center gap-2">
                                                <Calendar className="h-3 w-3 text-primary" /> F. Nacimiento
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="date"
                                                    className="std-input h-10 font-semibold"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="nombres"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="std-label mb-1.5">Nombres Completos</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="NOMBRES"
                                                className="std-input h-10 font-semibold uppercase"
                                                onChange={(e) => field.onChange(sanitizarNombres(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="apellido_paterno"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="std-label mb-1.5">Ape. Paterno</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="PATERNO o S/A"
                                                    className="std-input h-10 font-semibold uppercase"
                                                    onChange={(e) => field.onChange(sanitizarApellido(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="apellido_materno"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="std-label mb-1.5">Ape. Materno</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="MATERNO o S/A"
                                                    className="std-input h-10 font-semibold uppercase"
                                                    onChange={(e) => field.onChange(sanitizarApellido(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="fecha_fallecimiento"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="std-label flex items-center gap-2">
                                                <Calendar className="h-3 w-3 text-primary" /> F. Fallecimiento
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="date"
                                                    className="std-input h-10 font-semibold"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="telefono"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="std-label flex items-center gap-2">
                                                <Phone className="h-3 w-3 text-primary" /> Teléfono
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="999..."
                                                    maxLength={9}
                                                    inputMode="numeric"
                                                    className="std-input h-10 font-semibold"
                                                    onChange={(e) => field.onChange(sanitizarSoloDigitos(e.target.value, 9))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="direccion"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="std-label flex items-center gap-2">
                                            <MapPin className="h-3 w-3 text-primary" /> Dirección
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="DIRECCIÓN"
                                                className="std-input h-10 font-semibold uppercase"
                                            />
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
                                        <FormLabel className="std-label mb-1.5">Notas / Observaciones</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                placeholder="..."
                                                className="std-input min-h-20"
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
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 h-12 rounded-xl font-bold uppercase text-[11px] tracking-widest"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            form="persona-form"
                            className="flex-1 h-12 btn-primary rounded-xl font-bold uppercase text-[11px] tracking-widest gap-2 shadow-lg shadow-primary/20"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                            {persona ? "Actualizar" : "Guardar Ciudadano"}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
