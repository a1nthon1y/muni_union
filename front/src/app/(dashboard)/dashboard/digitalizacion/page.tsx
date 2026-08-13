"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useForm, type FieldErrors, type Resolver } from "react-hook-form";
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
    Phone,
    Heart,
    AlertTriangle,
    UserPlus,
    XCircle,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    useFormField,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
    esSinApellido,
    esSinNombre,
    maxLengthDocumento,
    sanitizarApellido,
    sanitizarDocumento,
    sanitizarNombres,
    sanitizarSoloDigitos,
    SIN_APELLIDO,
    SIN_NOMBRE,
    validarApellido,
    validarDocumento,
    validarFechaNoFutura,
    validarLibro,
    validarNombres,
    validarNumeroActa,
    validarTelefono,
} from "@/lib/form-validators";

const formSchema = z.object({
    // Persona principal
    tipo_documento: z.string().min(1, "Seleccione tipo de documento"),
    dni: z.string().optional().or(z.literal("")),
    nombres: z.string().min(1, "Nombres son obligatorios"),
    apellido_paterno: z.string().min(1, "Apellido paterno es obligatorio"),
    apellido_materno: z.string().min(1, "Apellido materno es obligatorio"),
    sexo: z.enum(["M", "F"]),
    fecha_nacimiento: z.string().optional().or(z.literal("")),
    fecha_fallecimiento: z.string().optional().or(z.literal("")),
    telefono: z.string().optional().or(z.literal("")),
    persona_observaciones: z.string().max(500, "Máximo 500 caracteres").optional().or(z.literal("")),

    // Cónyuge (solo para MATRIMONIO)
    conyuge_tipo_documento: z.string().optional(),
    conyuge_dni: z.string().optional().or(z.literal("")),
    conyuge_nombres: z.string().optional().or(z.literal("")),
    conyuge_apellido_paterno: z.string().optional().or(z.literal("")),
    conyuge_apellido_materno: z.string().optional().or(z.literal("")),
    conyuge_sexo: z.enum(["M", "F"]).optional(),
    conyuge_fecha_nacimiento: z.string().optional().or(z.literal("")),
    conyuge_fecha_fallecimiento: z.string().optional().or(z.literal("")),

    // Acta
    modo: z.enum(["CLASICO", "CUI"]),
    tipo_acta: z.enum(["NACIMIENTO", "MATRIMONIO", "DEFUNCION"]),
    libro: z.string().optional().or(z.literal("")),
    numero_acta: z.string().min(1, "Campo obligatorio"),
    anio: z.coerce.number().min(1900, "Año inválido").max(2100, "Año inválido"),
    fecha_acta: z.string().min(1, "Fecha de registro obligatoria"),
    acta_observaciones: z.string().max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
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

    const errFechaActa = validarFechaNoFutura(data.fecha_acta, "F. registro");
    if (errFechaActa) add("fecha_acta", errFechaActa);

    const errFechaNac = validarFechaNoFutura(data.fecha_nacimiento, "F. nacimiento");
    if (errFechaNac) add("fecha_nacimiento", errFechaNac);

    const errFechaFall = validarFechaNoFutura(data.fecha_fallecimiento, "F. fallecimiento");
    if (errFechaFall) add("fecha_fallecimiento", errFechaFall);

    if (!validarOrdenFechas(data.fecha_nacimiento, data.fecha_fallecimiento)) {
        add("fecha_fallecimiento", MENSAJE_ORDEN_FECHAS);
    }

    const errNumActa = validarNumeroActa(data.modo, data.numero_acta);
    if (errNumActa) add("numero_acta", errNumActa);

    if (data.modo === "CLASICO") {
        const errLibro = validarLibro(data.libro);
        if (errLibro) add("libro", errLibro);
    }

    if (data.tipo_acta === "MATRIMONIO") {
        for (const [valor, path, etiqueta] of [
            [data.conyuge_apellido_paterno, "conyuge_apellido_paterno", "Ap. paterno del cónyuge"],
            [data.conyuge_apellido_materno, "conyuge_apellido_materno", "Ap. materno del cónyuge"],
        ] as const) {
            const err = validarApellido(valor, etiqueta);
            if (err) add(path, err);
        }

        const errConNombres = validarNombres(data.conyuge_nombres);
        if (errConNombres) add("conyuge_nombres", errConNombres);

        const errConDoc = validarDocumento(
            data.conyuge_tipo_documento || data.tipo_documento,
            data.conyuge_dni,
        );
        if (errConDoc) add("conyuge_dni", errConDoc);

        if (!validarOrdenFechas(data.conyuge_fecha_nacimiento, data.conyuge_fecha_fallecimiento)) {
            add("conyuge_fecha_fallecimiento", MENSAJE_ORDEN_FECHAS);
        }
    }
});

type FormValues = z.infer<typeof formSchema>;

function DigLabel({
    children,
    hint,
    title,
    option,
}: {
    children: ReactNode;
    hint?: string;
    title?: string;
    option?: ReactNode;
}) {
    const labelText = typeof children === "string" ? children : undefined;
    return (
        <div className={cn("dig-field-head", hint && "dig-field-head--hint")}>
            <div className="flex items-center justify-between gap-1 min-w-0">
                <FormLabel className="dig-field-label min-w-0" title={title ?? labelText}>
                    {children}
                </FormLabel>
                {option}
            </div>
            {hint ? <p className="dig-field-hint" title={hint}>{hint}</p> : null}
        </div>
    );
}

function DigInlineCheck({
    checked,
    onCheckedChange,
    label,
    title,
}: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    label: string;
    title?: string;
}) {
    return (
        <label className="dig-field-option" title={title ?? label}>
            <Checkbox
                className="size-3"
                checked={checked}
                onCheckedChange={(value) => onCheckedChange(value === true)}
            />
            <span>{label}</span>
        </label>
    );
}

function DigFormMessage() {
    const { error, formMessageId } = useFormField();
    const message = error ? String(error.message ?? "") : "";
    return (
        <p
            id={formMessageId}
            role={message ? "alert" : undefined}
            className={cn("dig-field-msg", !message && "invisible")}
        >
            {message || "\u00A0"}
        </p>
    );
}

export default function DigitalizacionPage() {
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [personaEncontrada, setPersonaEncontrada] = useState<Persona | null>(null);
    const [actaEncontrada, setActaEncontrada] = useState<Acta | null>(null);

    const [tiposDocumento, setTiposDocumento] = useState<{ id: number, nombre: string }[]>([]);
    const [personaSecundariaEncontrada, setPersonaSecundariaEncontrada] = useState<Persona | null>(null);
    // Indica si el usuario ya modificó manualmente algún campo de la persona auto-completada
    const [personaModificada, setPersonaModificada] = useState(false);
    const [conyugeModificado, setConyugeModificado] = useState(false);
    // Indica si el valor actual del campo fue puesto por la sugerencia automática (no por el usuario)
    const [esSugerencia, setEsSugerencia] = useState(false);

    // --- NUEVO: Diálogo obligatorio para homonimia ---
    const [dialogoHomonimia, setDialogoHomonimia] = useState<{
        abierto: boolean;
        personaExistente: Persona | null;
        campo: 'principal' | 'conyuge';
    }>({ abierto: false, personaExistente: null, campo: 'principal' });
    const [esHomonimoConfirmado, setEsHomonimoConfirmado] = useState(false);
    const [sinApPaterno, setSinApPaterno] = useState(false);
    const [sinApMaterno, setSinApMaterno] = useState(false);
    const [sinNombres, setSinNombres] = useState(false);

    const sincronizarFlagsNombre = (nombres: string, paterno: string, materno: string) => {
        setSinNombres(esSinNombre(nombres));
        setSinApPaterno(esSinApellido(paterno));
        setSinApMaterno(esSinApellido(materno));
    };

    useEffect(() => {
        personasService.getTiposDocumento()
            .then(setTiposDocumento)
            .catch(err => console.error("Error cargando tipos documento:", err));
    }, []);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as Resolver<FormValues>,
        mode: "onTouched",
        reValidateMode: "onChange",
        defaultValues: {
            tipo_documento: "SIN DOCUMENTO",
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
            modo: "CUI",
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
    const tipoDocumentoValue = form.watch("tipo_documento");

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

    // Auto-fill del siguiente folio solo en modo Libro Clásico (CUI se ingresa manual desde RENIEC)
    const anioValue = form.watch("anio");
    useEffect(() => {
        const readyClasico = modoValue === "CLASICO" && tipoActaValue && anioValue >= 1900 && libroValue?.trim();
        if (!readyClasico) return;

        const timer = setTimeout(async () => {
            try {
                const res = await actasService.getSiguienteNumero({
                    tipo_acta: tipoActaValue,
                    anio:      anioValue,
                    modo:      "CLASICO",
                    libro:     libroValue,
                });
                // Auto-fill: solo si el campo está vacío o si el valor actual era la sugerencia anterior
                if (res.siguiente !== null) {
                    const current = form.getValues("numero_acta");
                    if (!current || esSugerencia) {
                        form.setValue("numero_acta", String(res.siguiente));
                        setEsSugerencia(true);
                    }
                }
            } catch {
                // Sin numeración sugerida; el usuario puede ingresar el número manualmente
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
                    setPersonaModificada(false);
                    form.setValue("tipo_documento", p.tipo_documento || "DNI");
                    form.setValue("nombres", p.nombres);
                    form.setValue("apellido_paterno", p.apellido_paterno);
                    form.setValue("apellido_materno", p.apellido_materno);
                    form.setValue("sexo", p.sexo === "F" ? "F" : "M");
                    form.setValue("fecha_nacimiento", dateUtils.formatInputDate(p.fecha_nacimiento));
                    form.setValue("fecha_fallecimiento", dateUtils.formatInputDate(p.fecha_fallecimiento));
                    form.setValue("telefono", p.telefono || "");
                    form.setValue("persona_observaciones", p.observaciones || "");
                    sincronizarFlagsNombre(p.nombres, p.apellido_paterno, p.apellido_materno);
                    toast.info("Ciudadano identificado.");
                } else {
                    setPersonaEncontrada(null);
                    setPersonaModificada(false);
                    setSinApPaterno(false);
                    setSinApMaterno(false);
                    setSinNombres(false);
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
                setConyugeModificado(false);
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
                    setConyugeModificado(false);
                    form.setValue("conyuge_nombres", found.nombres);
                    form.setValue("conyuge_apellido_paterno", found.apellido_paterno);
                    form.setValue("conyuge_apellido_materno", found.apellido_materno);
                    form.setValue("conyuge_sexo", found.sexo as "M" | "F");
                    form.setValue("conyuge_fecha_nacimiento", found.fecha_nacimiento ?? "");
                    form.setValue("conyuge_fecha_fallecimiento", found.fecha_fallecimiento ?? "");
                    toast.info("Cónyuge identificado.");
                } else {
                    setPersonaSecundariaEncontrada(null);
                    setConyugeModificado(false);
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
                            if (esDiferenteDni && !dialogoHomonimia.abierto) {
                                // Abrir diálogo obligatorio en lugar de toast
                                setDialogoHomonimia({
                                    abierto: true,
                                    personaExistente: p,
                                    campo: 'principal'
                                });
                            } else if (!esDiferenteDni) {
                                toast.warning("Ciudadano ya registrado", {
                                    description: `El ciudadano ${p.apellido_paterno} ${p.apellido_materno}, ${p.nombres} ya existe en el sistema.`,
                                    duration: 8000
                                });
                            }
                        }
                    });
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [nombresValue, paternoValue, maternoValue, dniValue, personaEncontrada, dialogoHomonimia.abierto]);

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



    const resetAll = (silent = false) => {
        form.reset();
        setFile(null);
        setPersonaEncontrada(null);
        setPersonaModificada(false);
        setConyugeModificado(false);
        setActaEncontrada(null);
        setEsSugerencia(false);
        setEsHomonimoConfirmado(false);
        setSinApPaterno(false);
        setSinApMaterno(false);
        setSinNombres(false);
        if (!silent) {
            toast.info("Formulario reiniciado");
        }
    };

    const onInvalid = (errors: FieldErrors<FormValues>) => {
        const first = Object.values(errors).find((e) => e?.message);
        toast.error("Revise los datos del formulario", {
            description: first?.message ? String(first.message) : "Hay campos con formato inválido.",
        });
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
                    observaciones: values.persona_observaciones,
                    es_homonimo: esHomonimoConfirmado,
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

            // 4. Subir documento
            const personaActualizada = Boolean(personaEncontrada?.id);
            const actaActualizada = Boolean(actaVigente);
            let mensajeExito = personaActualizada
                ? actaActualizada
                    ? "Ciudadano y acta actualizados correctamente."
                    : "Ciudadano actualizado y acta registrada correctamente."
                : actaActualizada
                    ? "Acta actualizada correctamente."
                    : "Ciudadano y acta registrados correctamente.";

            if (file) {
                try {
                    await documentosService.upload(currentActaId, file);
                    toast.success(mensajeExito, {
                        description: "Documento digitalizado y vinculado al acta.",
                    });
                } catch {
                    toast.warning("Datos guardados correctamente", {
                        description: personaActualizada
                            ? "El ciudadano fue actualizado, pero falló la subida del archivo."
                            : "El registro se guardó, pero falló la subida del archivo.",
                    });
                }
            } else {
                toast.success(mensajeExito);
            }

            resetAll(true);
        } catch (error: unknown) {
            const apiMessage = axios.isAxiosError(error)
                && typeof error.response?.data?.message === "string"
                ? error.response.data.message
                : undefined;
            toast.error(apiMessage ?? "Error al procesar el registro integral");
        } finally {
            setLoading(false);
        }
    };

    // --- Diálogo obligatorio para homonimia (fuera del formulario) ---
    const p = dialogoHomonimia.personaExistente;
    const dniActual = dialogoHomonimia.campo === 'principal' ? form.watch("dni") : form.watch("conyuge_dni");

    // --- Diálogo obligatorio para homonimia ---
    const dialogoHomonimiaJSX = dialogoHomonimia.abierto && p ? (
        <Dialog open={true} onOpenChange={(open) => !open && setDialogoHomonimia({...dialogoHomonimia, abierto: false})}>
            <DialogContent className="max-w-md">
                <DialogHeader className="text-center">
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                        <AlertTriangle className="h-6 w-6 text-amber-600" />
                    </div>
                    <DialogTitle className="text-lg">¿Es la misma persona?</DialogTitle>
                    <DialogDescription>
                        Encontramos un ciudadano con <strong>los mismos nombres y apellidos</strong> pero <strong>DNI diferente</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-4 bg-muted/50 rounded-xl mb-4 text-sm space-y-1">
                    <p className="font-medium">Ciudadano en el sistema:</p>
                    <p>{p.apellido_paterno} {p.apellido_materno}, {p.nombres}</p>
                    <p className="font-mono text-primary">DNI: {p.dni || 'Sin DNI'}</p>
                    <p className="font-mono">DNI ingresado: {dniActual || 'Sin DNI'}</p>
                </div>

                <p className="text-sm text-muted-foreground mb-4 text-center">
                    ¿Se trata de la <strong>MISMA PERSONA</strong> (error de DNI) o una <strong>PERSONA DIFERENTE</strong> (homónimo)?
                </p>

                <div className="grid grid-cols-2 gap-3">
                    <Button
                        variant="default"
                        className="h-12 text-sm"
                        onClick={() => {
                            // MISMA PERSONA → Usar registro existente
                            if (dialogoHomonimia.campo === 'principal') {
                                setPersonaEncontrada(p);
                                form.setValue("dni", p.dni || dniActual);
                            } else {
                                setPersonaSecundariaEncontrada(p);
                                form.setValue("conyuge_dni", p.dni || dniActual);
                            }
                            setEsHomonimoConfirmado(false);
                            setDialogoHomonimia({...dialogoHomonimia, abierto: false});
                        }}
                    >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        MISMA PERSONA
                    </Button>

                    <Button
                        variant="outline"
                        className="h-12 text-sm border-amber-500 text-amber-700 hover:bg-amber-50"
                        onClick={() => {
                            // HOMÓNIMO → Crear nuevo con es_homonimo=true
                            setEsHomonimoConfirmado(true);
                            setDialogoHomonimia({...dialogoHomonimia, abierto: false});
                        }}
                    >
                        <UserPlus className="h-4 w-4 mr-2" />
                        PERSONA DIFERENTE
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    ) : null;

    return (
        <>
            {dialogoHomonimiaJSX}
            <div className="animate-in fade-in duration-500 pb-16">

                {/* ── Header ─────────────────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 text-foreground">
                        <div className="bg-primary p-2 rounded-lg shadow-primary/20 shadow shrink-0">
                            <FileDigit className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold tracking-tight leading-none">
                                Consola de Digitalización
                            </h1>
                            <p className="text-muted-foreground text-[10px] mt-0.5">
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
                    <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>

                        {/* ── Grid principal ─────────────────────────────────────────── */}
                        {/*  mobile:  1 col stacked                                       */}
                        {/*  md:      2 col — 7 + 5                                       */}
                        {/*  xl:      3 col — 5 + 4 + 3  (ciudadano | acta | upload)      */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-start">

                            {/* 1. CIUDADANO — lg:5 */}
                        <div className="lg:col-span-5 space-y-2">
                            <Card className="shadow-sm border-border rounded-xl overflow-hidden bg-card py-0 gap-0">
                                <CardHeader className="dig-card-header border-b">
                                    <User className="dig-card-icon" />
                                    <CardTitle className="dig-card-title">
                                        1. Ciudadano
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="dig-card-body">

                                    {/* Fila 1: tipo + documento */}
                                    <div className="dig-grid-2">
                                        <FormField control={form.control} name="tipo_documento" render={({ field }) => (
                                            <FormItem className="dig-field">
                                                <DigLabel>Tipo Doc.</DigLabel>
                                                <Select
                                                    onValueChange={(v) => {
                                                        setPersonaModificada(true);
                                                        field.onChange(v);
                                                        if (v.toUpperCase().includes("SIN DOCUMENTO")) {
                                                            form.setValue("dni", "");
                                                        }
                                                    }}
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className={cn("dig-select-trigger", !!personaEncontrada && !personaModificada && "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20")}>
                                                            <SelectValue placeholder="—" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {tiposDocumento.length > 0
                                                            ? tiposDocumento.map(t => <SelectItem key={t.id} value={t.nombre} className="font-semibold text-xs">{t.nombre}</SelectItem>)
                                                            : <SelectItem value="DNI" className="font-semibold text-xs">DNI</SelectItem>}
                                                    </SelectContent>
                                                </Select>
                                                <DigFormMessage />
                                            </FormItem>
                                        )} />

                                        <FormField control={form.control} name="dni" render={({ field }) => (
                                            <FormItem className="dig-field">
                                                <DigLabel hint="Opc." title="Opcional en nacimientos">N° Documento</DigLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        onChange={(event) => {
                                                            setActaEncontrada(null);
                                                            setPersonaModificada(true);
                                                            field.onChange(
                                                                sanitizarDocumento(event.target.value, tipoDocumentoValue),
                                                            );
                                                        }}
                                                        maxLength={maxLengthDocumento(tipoDocumentoValue) || 15}
                                                        disabled={tipoDocumentoValue.toUpperCase().includes("SIN DOCUMENTO")}
                                                        placeholder={tipoDocumentoValue === "DNI" ? "8 dígitos" : "Número..."}
                                                        className="dig-input font-semibold tracking-wide" />
                                                </FormControl>
                                                <DigFormMessage />
                                            </FormItem>
                                        )} />
                                    </div>

                                    {/* Fila 2: nacimiento + sexo */}
                                    <div className="dig-grid-2">
                                        <FormField control={form.control} name="fecha_nacimiento" render={({ field }) => (
                                            <FormItem className="dig-field">
                                                <DigLabel>F. Nacimiento</DigLabel>
                                                <FormControl>
                                                    <Input type="date" {...field}
                                                        className={cn("dig-input", !!personaEncontrada && !personaModificada && "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20")}
                                                        onChange={(e) => { setPersonaModificada(true); field.onChange(e.target.value); }}
                                                         />
                                                </FormControl>
                                                <DigFormMessage />
                                            </FormItem>
                                        )} />

                                        <FormField control={form.control} name="sexo" render={({ field }) => (
                                            <FormItem className="dig-field">
                                                <DigLabel>Sexo</DigLabel>
                                                <Select
                                                    onValueChange={(v) => { setPersonaModificada(true); field.onChange(v); }}
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className={cn("dig-select-trigger font-bold", !!personaEncontrada && !personaModificada && "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20")}>
                                                            <SelectValue placeholder="—" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent position="popper" className="z-[100]">
                                                        <SelectItem value="M" className="font-semibold text-xs">M — Masculino</SelectItem>
                                                        <SelectItem value="F" className="font-semibold text-xs">F — Femenino</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <DigFormMessage />
                                            </FormItem>
                                        )} />
                                    </div>

                                    {/* Nombres: 3 columnas iguales */}
                                    <div className="dig-grid-3">
                                        <FormField control={form.control} name="apellido_paterno" render={({ field }) => (
                                            <FormItem className="dig-field">
                                                <DigLabel
                                                    option={
                                                        <DigInlineCheck
                                                            checked={sinApPaterno}
                                                            label="S/A"
                                                            title="Sin apellido (S/A)"
                                                            onCheckedChange={(activo) => {
                                                                setSinApPaterno(activo);
                                                                setPersonaModificada(true);
                                                                if (activo) {
                                                                    form.setValue("apellido_paterno", SIN_APELLIDO);
                                                                } else if (esSinApellido(field.value)) {
                                                                    form.setValue("apellido_paterno", "");
                                                                }
                                                            }}
                                                        />
                                                    }
                                                >
                                                    Ap. Paterno
                                                </DigLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="PATERNO o S/A"
                                                        disabled={sinApPaterno}
                                                        className={cn("dig-input font-semibold uppercase", sinApPaterno && "bg-muted/60 text-muted-foreground", !!personaEncontrada && !personaModificada && "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20")}
                                                        onChange={(e) => {
                                                            setPersonaModificada(true);
                                                            setSinApPaterno(false);
                                                            field.onChange(sanitizarApellido(e.target.value));
                                                        }} />
                                                </FormControl>
                                                <DigFormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="apellido_materno" render={({ field }) => (
                                            <FormItem className="dig-field">
                                                <DigLabel
                                                    option={
                                                        <DigInlineCheck
                                                            checked={sinApMaterno}
                                                            label="S/A"
                                                            title="Sin apellido (S/A)"
                                                            onCheckedChange={(activo) => {
                                                                setSinApMaterno(activo);
                                                                setPersonaModificada(true);
                                                                if (activo) {
                                                                    form.setValue("apellido_materno", SIN_APELLIDO);
                                                                } else if (esSinApellido(field.value)) {
                                                                    form.setValue("apellido_materno", "");
                                                                }
                                                            }}
                                                        />
                                                    }
                                                >
                                                    Ap. Materno
                                                </DigLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="MATERNO o S/A"
                                                        disabled={sinApMaterno}
                                                        className={cn("dig-input font-semibold uppercase", sinApMaterno && "bg-muted/60 text-muted-foreground", !!personaEncontrada && !personaModificada && "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20")}
                                                        onChange={(e) => {
                                                            setPersonaModificada(true);
                                                            setSinApMaterno(false);
                                                            field.onChange(sanitizarApellido(e.target.value));
                                                        }} />
                                                </FormControl>
                                                <DigFormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="nombres" render={({ field }) => (
                                            <FormItem className="dig-field">
                                                <DigLabel
                                                    option={
                                                        <DigInlineCheck
                                                            checked={sinNombres}
                                                            label="S/N"
                                                            title="Sin nombre (S/N)"
                                                            onCheckedChange={(activo) => {
                                                                setSinNombres(activo);
                                                                setPersonaModificada(true);
                                                                if (activo) {
                                                                    form.setValue("nombres", SIN_NOMBRE);
                                                                } else if (esSinNombre(field.value)) {
                                                                    form.setValue("nombres", "");
                                                                }
                                                            }}
                                                        />
                                                    }
                                                >
                                                    Nombres
                                                </DigLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="NOMBRES o S/N"
                                                        disabled={sinNombres}
                                                        className={cn("dig-input font-semibold uppercase", sinNombres && "bg-muted/60 text-muted-foreground", !!personaEncontrada && !personaModificada && "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20")}
                                                        onChange={(e) => {
                                                            setPersonaModificada(true);
                                                            setSinNombres(false);
                                                            field.onChange(sanitizarNombres(e.target.value));
                                                        }} />
                                                </FormControl>
                                                <DigFormMessage />
                                            </FormItem>
                                        )} />
                                    </div>

                                    <div className="dig-grid-3">
                                        <FormField control={form.control} name="fecha_fallecimiento" render={({ field }) => (
                                            <FormItem className="dig-field">
                                                <DigLabel>F. Fallec.</DigLabel>
                                                <FormControl>
                                                    <Input type="date" {...field}
                                                        className={cn("dig-input", !!personaEncontrada && !personaModificada && "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20")}
                                                        onChange={(e) => { setPersonaModificada(true); field.onChange(e.target.value); }}
                                                         />
                                                </FormControl>
                                                <DigFormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="telefono" render={({ field }) => (
                                            <FormItem className="dig-field">
                                                <DigLabel hint="Opc.">Teléfono</DigLabel>
                                                <FormControl>
                                                    <div className="relative min-w-0">
                                                        <Input {...field} placeholder="9 dígitos"
                                                            maxLength={9}
                                                            inputMode="numeric"
                                                            className={cn("dig-input pl-8", !!personaEncontrada && !personaModificada && "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20")}
                                                            onChange={(e) => { setPersonaModificada(true); field.onChange(sanitizarSoloDigitos(e.target.value, 9)); }} />
                                                        <Phone size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none" />
                                                    </div>
                                                </FormControl>
                                                <DigFormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="persona_observaciones" render={({ field }) => (
                                            <FormItem className="dig-field">
                                                <DigLabel hint="Opc.">Observ.</DigLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Notas..."
                                                        maxLength={500}
                                                        className={cn("dig-input", !!personaEncontrada && !personaModificada && "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20")}
                                                        onChange={(e) => { setPersonaModificada(true); field.onChange(e.target.value); }} />
                                                </FormControl>
                                                <DigFormMessage />
                                            </FormItem>
                                        )} />
                                    </div>

                                    {personaEncontrada && (
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                                            <CheckCircle2 size={11} className="text-emerald-600 shrink-0" />
                                            <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                                                ID #{personaEncontrada.id}
                                            </span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* ── CÓNYUGE: en mobile/md debajo del ciudadano; en xl debajo también ── */}
                            {esMatrimonio && (
                                <Card className="shadow-sm border-purple-200 dark:border-purple-900/40 rounded-xl overflow-hidden bg-card py-0 gap-0">
                                    <CardHeader className="dig-card-header border-b bg-purple-50/60 dark:bg-purple-950/20">
                                        <Heart className="dig-card-icon text-purple-500" />
                                        <CardTitle className="dig-card-title text-purple-600 dark:text-purple-400">
                                            Cónyuge
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="dig-card-body">
                                        <FormField control={form.control} name="conyuge_dni" render={({ field }) => (
                                            <FormItem className="dig-field">
                                                <DigLabel hint="Opcional">N° Documento Cónyuge</DigLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        onChange={(event) => {
                                                            setActaEncontrada(null);
                                                            setConyugeModificado(true);
                                                            field.onChange(
                                                                sanitizarDocumento(
                                                                    event.target.value,
                                                                    form.getValues("conyuge_tipo_documento") || tipoDocumentoValue,
                                                                ),
                                                            );
                                                        }}
                                                        maxLength={15}
                                                        inputMode="text"
                                                        placeholder="Número de documento..."
                                                        className={cn(
                                                            "dig-input font-semibold tracking-wide",
                                                            personaSecundariaEncontrada && "border-purple-300 dark:border-purple-700"
                                                        )} />
                                                </FormControl>
                                                <DigFormMessage />
                                            </FormItem>
                                        )} />

                                        <div className="dig-grid-3">
                                            <FormField control={form.control} name="conyuge_apellido_paterno" render={({ field }) => (
                                                <FormItem className="dig-field">
                                                    <DigLabel>Ap. Paterno</DigLabel>
                                                    <FormControl><Input {...field} placeholder="PATERNO" className={cn("dig-input uppercase", !!personaSecundariaEncontrada && !conyugeModificado && "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20")} onChange={(e) => { setConyugeModificado(true); field.onChange(sanitizarApellido(e.target.value)); }} /></FormControl>
                                                    <DigFormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="conyuge_apellido_materno" render={({ field }) => (
                                                <FormItem className="dig-field">
                                                    <DigLabel>Ap. Materno</DigLabel>
                                                    <FormControl><Input {...field} placeholder="MATERNO" className={cn("dig-input uppercase", !!personaSecundariaEncontrada && !conyugeModificado && "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20")} onChange={(e) => { setConyugeModificado(true); field.onChange(sanitizarApellido(e.target.value)); }} /></FormControl>
                                                    <DigFormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="conyuge_nombres" render={({ field }) => (
                                                <FormItem className="dig-field">
                                                    <DigLabel>Nombres</DigLabel>
                                                    <FormControl><Input {...field} placeholder="NOMBRES" className={cn("dig-input uppercase", !!personaSecundariaEncontrada && !conyugeModificado && "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20")} onChange={(e) => { setConyugeModificado(true); field.onChange(sanitizarNombres(e.target.value)); }} /></FormControl>
                                                    <DigFormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        <div className="dig-grid-3">
                                            <FormField control={form.control} name="conyuge_sexo" render={({ field }) => (
                                                <FormItem className="dig-field">
                                                    <DigLabel>Sexo</DigLabel>
                                                    <Select onValueChange={field.onChange} value={field.value} defaultValue="F">
                                                        <FormControl>
                                                            <SelectTrigger className="dig-select-trigger font-bold">
                                                                <SelectValue placeholder="—" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent position="popper" className="z-[100]">
                                                            <SelectItem value="M" className="font-semibold text-xs">M — Masculino</SelectItem>
                                                            <SelectItem value="F" className="font-semibold text-xs">F — Femenino</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <DigFormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="conyuge_fecha_nacimiento" render={({ field }) => (
                                                <FormItem className="dig-field">
                                                    <DigLabel>F. Nacimiento</DigLabel>
                                                    <FormControl><Input type="date" {...field} className="dig-input" /></FormControl>
                                                    <DigFormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="conyuge_fecha_fallecimiento" render={({ field }) => (
                                                <FormItem className="dig-field">
                                                    <DigLabel>F. Fallecimiento</DigLabel>
                                                    <FormControl><Input type="date" {...field} className="dig-input" /></FormControl>
                                                    <DigFormMessage />
                                                </FormItem>
                                            )} />
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
                        <div className="lg:col-span-4 space-y-2">
                            <Card className="shadow-sm border-border rounded-xl overflow-hidden bg-card py-0 gap-0">
                                <CardHeader className="dig-card-header border-b">
                                    <FileText className="dig-card-icon" />
                                    <CardTitle className="dig-card-title">
                                        2. Acta
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="dig-card-body">

                                    {/* Toggle libro / CUI */}
                                    <div className="flex p-1 bg-muted/60 rounded-xl w-fit">
                                        <Button type="button" variant={modoValue === 'CLASICO' ? 'default' : 'ghost'} size="sm"
                                            className={cn("rounded-lg h-7 text-[9px] font-black uppercase tracking-widest px-3.5", modoValue === 'CLASICO' && "bg-primary shadow-sm")}
                                            onClick={() => {
                                                setActaEncontrada(null);
                                                form.setValue("modo", "CLASICO");
                                                form.setValue("numero_acta", "");
                                                setEsSugerencia(false);
                                            }}>
                                            Libro Clásico
                                        </Button>
                                        <Button type="button" variant={modoValue === 'CUI' ? 'default' : 'ghost'} size="sm"
                                            className={cn("rounded-lg h-7 text-[9px] font-black uppercase tracking-widest px-3.5", modoValue === 'CUI' && "bg-primary shadow-sm")}
                                            onClick={() => {
                                                setActaEncontrada(null);
                                                form.setValue("modo", "CUI");
                                                form.setValue("numero_acta", "");
                                                setEsSugerencia(false);
                                            }}>
                                            RENIEC (CUI)
                                        </Button>
                                    </div>

                                    {/* Fila 1: tipo + fecha */}
                                    <div className="dig-grid-2">
                                        <FormField control={form.control} name="tipo_acta" render={({ field }) => (
                                            <FormItem className="dig-field">
                                                <DigLabel>Tipo de Acta</DigLabel>
                                                <Select
                                                    onValueChange={(value) => {
                                                        setActaEncontrada(null);
                                                        field.onChange(value);
                                                    }}
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className={cn("dig-select-trigger font-bold", !!actaEncontrada && "border-rose-400 bg-rose-50/50 dark:bg-rose-950/20")}>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="NACIMIENTO" className="font-semibold text-xs">Nacimiento</SelectItem>
                                                        <SelectItem value="MATRIMONIO" className="font-semibold text-xs">Matrimonio</SelectItem>
                                                        <SelectItem value="DEFUNCION" className="font-semibold text-xs">Defunción</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <DigFormMessage />
                                            </FormItem>
                                        )} />

                                        <FormField control={form.control} name="fecha_acta" render={({ field }) => (
                                            <FormItem className="dig-field">
                                                <DigLabel>F. Registro</DigLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} className={cn("dig-input font-semibold", !!actaEncontrada && "border-rose-400 bg-rose-50/50 dark:bg-rose-950/20")} />
                                                </FormControl>
                                                <DigFormMessage />
                                            </FormItem>
                                        )} />
                                    </div>

                                    {/* Fila 2: numeración */}
                                    <div className={modoValue === "CLASICO" ? "dig-grid-3" : "dig-grid-2"}>
                                        {modoValue === "CLASICO" && (
                                            <FormField control={form.control} name="libro" render={({ field }) => (
                                                <FormItem className="dig-field">
                                                    <DigLabel>Libro</DigLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            onChange={(event) => {
                                                                setActaEncontrada(null);
                                                                field.onChange(sanitizarSoloDigitos(event.target.value, 4));
                                                            }}
                                                            inputMode="numeric"
                                                            maxLength={4}
                                                            placeholder="N°"
                                                            className={cn("dig-input font-bold text-center", !!actaEncontrada && "border-rose-400 bg-rose-50/50 dark:bg-rose-950/20")} />
                                                    </FormControl>
                                                    <DigFormMessage />
                                                </FormItem>
                                            )} />
                                        )}

                                        <FormField control={form.control} name="numero_acta" render={({ field }) => (
                                            <FormItem className="dig-field">
                                                <DigLabel
                                                    hint={modoValue === "CUI" ? "6-12 díg." : undefined}
                                                    option={
                                                        modoValue === "CLASICO" && esSugerencia && numActaValue ? (
                                                            <span className="shrink-0 text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-200 px-1 rounded">
                                                                AUTO
                                                            </span>
                                                        ) : undefined
                                                    }
                                                >
                                                    {modoValue === "CLASICO" ? "N° Acta" : "CUI / ID"}
                                                </DigLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder={modoValue === "CLASICO" ? "Número" : "6-12 dígitos"}
                                                        inputMode="numeric"
                                                        maxLength={modoValue === "CLASICO" ? 6 : 12}
                                                        className={cn(
                                                            "dig-input font-black uppercase tracking-wide",
                                                            modoValue === "CLASICO" && esSugerencia && numActaValue && "border-emerald-300 dark:border-emerald-700",
                                                            !!actaEncontrada && "border-rose-400 bg-rose-50/50 dark:bg-rose-950/20"
                                                        )}
                                                        onChange={(e) => {
                                                            setActaEncontrada(null);
                                                            const maxLen = modoValue === "CLASICO" ? 6 : 12;
                                                            field.onChange(sanitizarSoloDigitos(e.target.value, maxLen));
                                                            setEsSugerencia(false);
                                                        }}
                                                    />
                                                </FormControl>
                                                <DigFormMessage />
                                            </FormItem>
                                        )} />

                                        <FormField control={form.control} name="anio" render={({ field }) => (
                                            <FormItem className="dig-field">
                                                <DigLabel hint="Auto">Año</DigLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} disabled
                                                        className="dig-input bg-muted/50 text-muted-foreground font-bold text-center" />
                                                </FormControl>
                                            </FormItem>
                                        )} />
                                    </div>

                                    <FormField control={form.control} name="acta_observaciones" render={({ field }) => (
                                        <FormItem className="dig-field">
                                            <DigLabel hint="Opc.">Observ.</DigLabel>
                                            <FormControl>
                                                <Input {...field} disabled={!!actaEncontrada} placeholder="Notas del acta..."
                                                    maxLength={500}
                                                    className="dig-input" />
                                            </FormControl>
                                            <DigFormMessage />
                                        </FormItem>
                                    )} />
                                </CardContent>
                            </Card>
                        </div>

                        {/* ╔══════════════════╗
                            ║  3. ARCHIVO FILE   ║  md:full-row en mobile/md, xl:3
                            ╚══════════════════╝ */}
                        <div className="lg:col-span-3">
                            <Card className="shadow-sm border-border rounded-xl overflow-hidden bg-card py-0 gap-0 h-full">
                                <CardHeader className="dig-card-header border-b">
                                    <Upload className="dig-card-icon" />
                                    <CardTitle className="dig-card-title">
                                        3. Archivo
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="dig-card-body">

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
                                            "border-2 border-dashed rounded-lg transition-all cursor-pointer group",
                                            "flex items-center gap-2.5 p-2.5 min-h-[72px]",
                                            file
                                                ? "border-primary/60 bg-primary/5"
                                                : "border-border/70 hover:border-primary/50 hover:bg-muted/20"
                                        )}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
                                        }}
                                        onClick={() => document.getElementById('file-upload-main')?.click()}
                                    >
                                        {file ? (
                                            <div className="bg-primary/20 p-2 rounded-full shrink-0">
                                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                            </div>
                                        ) : (
                                            <div className="bg-muted/80 p-2 rounded-full shrink-0">
                                                <Upload className="h-4 w-4 text-muted-foreground/50" />
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                            <span className="font-bold text-foreground text-[10px] uppercase tracking-tight truncate">
                                                {file ? file.name : "Arrastra o haz clic · PDF/JPG"}
                                            </span>
                                            <span className="text-[9px] text-muted-foreground/70">
                                                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Requerido · máx 20 MB"}
                                            </span>
                                        </div>
                                    </div>

                                    {file && (
                                        <Button variant="ghost" size="sm" type="button"
                                            onClick={() => setFile(null)}
                                            className="w-full h-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-bold uppercase text-[9px] rounded-lg border border-rose-100 dark:border-rose-900/30">
                                            <Trash2 size={12} className="mr-1" /> Quitar
                                        </Button>
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
                        <Button variant="outline" onClick={() => resetAll()} disabled={loading}
                            className="flex-1 sm:flex-none h-10 px-6 border-border bg-card hover:bg-muted font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-all flex items-center gap-2">
                            <RefreshCw size={14} /> Reiniciar
                        </Button>
                        <Button onClick={form.handleSubmit(onSubmit, onInvalid)} disabled={loading}
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
        </>
    );
}
