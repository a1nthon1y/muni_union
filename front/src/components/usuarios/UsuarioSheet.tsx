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
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, UserPlus, Fingerprint, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Usuario } from "@/types/auth";
import { UsuarioInput } from "@/types/usuario";

const usuarioSchema = z.object({
    username: z.string().optional().or(z.literal("")),
    nombres: z.string().min(2, "Nombres son obligatorios"),
    apellidos: z.string().min(2, "Apellidos son obligatorios"),
    rol_id: z.string().min(1, "Debe seleccionar un rol"),
    telefono: z.string().optional().nullable().or(z.literal("")),
    dni: z.string().min(8, "DNI debe tener al menos 8 caracteres").max(15).optional().or(z.literal("")),
    password: z.string().optional().or(z.literal("")),
    permisos_actas_anular: z.boolean().default(false),
    permisos_actas_eliminar: z.boolean().default(false),
    permisos_personas_eliminar: z.boolean().default(false),
});

type UsuarioFormValues = z.infer<typeof usuarioSchema>;

const limpiar = (texto: string) =>
    texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, "")
        .trim();

interface UsuarioSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    usuario?: Usuario | null;
    onSuccess: () => void;
    onSubmit: (values: UsuarioInput & { username?: string }) => Promise<void>;
}

export function UsuarioSheet({
    open,
    onOpenChange,
    usuario,
    onSuccess,
    onSubmit
}: UsuarioSheetProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUsernameTouched, setIsUsernameTouched] = useState(false);

    const form = useForm<UsuarioFormValues>({
        resolver: zodResolver(usuarioSchema),
        defaultValues: {
            username: "",
            nombres: "",
            apellidos: "",
            rol_id: "2", // DEFAULT: REGISTRADOR
            telefono: "",
            dni: "",
            password: "",
            permisos_actas_anular: false,
            permisos_actas_eliminar: false,
            permisos_personas_eliminar: false,
        },
    });

    const watchNombres = form.watch("nombres");
    const watchApellidos = form.watch("apellidos");

    // Efecto para sincronizar el username si el usuario NO lo ha tocado manualmente
    useEffect(() => {
        if (!isUsernameTouched && watchNombres && watchApellidos) {
            const inicial = limpiar(watchNombres)[0];
            const primerApellido = limpiar(watchApellidos.split(" ")[0]);

            if (inicial && primerApellido) {
                form.setValue("username", `${inicial}${primerApellido}`);
            }
        }
    }, [watchNombres, watchApellidos, isUsernameTouched, form]);

    useEffect(() => {
        if (open) {
            if (usuario) {
                setIsUsernameTouched(false);
                form.reset({
                    username: usuario.username || "",
                    nombres: usuario.nombres || "",
                    apellidos: usuario.apellidos || "",
                    rol_id: usuario.rol_id ? usuario.rol_id.toString() : "2",
                    telefono: usuario.telefono || "",
                    dni: usuario.dni || "",
                    password: "",
                    permisos_actas_anular:      usuario.permisos?.actas_anular ?? false,
                    permisos_actas_eliminar:    usuario.permisos?.actas_eliminar ?? false,
                    permisos_personas_eliminar: usuario.permisos?.personas_eliminar ?? false,
                });
            } else {
                form.reset({
                    username: "",
                    nombres: "",
                    apellidos: "",
                    rol_id: "2",
                    telefono: "",
                    password: "",
                    permisos_actas_anular: false,
                    permisos_actas_eliminar: false,
                    permisos_personas_eliminar: false,
                });
            }
        } else {
            form.reset({
                username: "",
                nombres: "",
                apellidos: "",
                rol_id: "2",
                telefono: "",
                dni: "",
                password: "",
                permisos_actas_anular: false,
                permisos_actas_eliminar: false,
                permisos_personas_eliminar: false,
            });
            form.clearErrors();
        }
    }, [usuario, open, form]);

    const handleFormSubmit = async (values: UsuarioFormValues) => {
        try {
            setIsSubmitting(true);

            // Validar que si es nuevo usuario, el password sea obligatorio
            if (!usuario && !values.password) {
                toast.error("La contraseña es obligatoria para nuevos usuarios");
                return;
            }

            const isRegistrador = parseInt(values.rol_id) !== 1;

            const input: any = {
                nombres: values.nombres.toUpperCase(),
                apellidos: values.apellidos.toUpperCase(),
                rol_id: parseInt(values.rol_id),
                telefono: values.telefono || undefined,
                dni: values.dni || undefined,
                password: values.password || undefined,
                // Solo enviar permisos para usuarios REGISTRADOR
                permisos: isRegistrador ? {
                    actas_anular:      values.permisos_actas_anular,
                    actas_eliminar:    values.permisos_actas_eliminar,
                    personas_eliminar: values.permisos_personas_eliminar,
                } : undefined,
            };

            if (usuario) {
                input.username = values.username;
            }

            await onSubmit(input);
            toast.success(usuario ? "Usuario actualizado" : "Usuario creado correctamente");
            onOpenChange(false);
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Ocurrió un error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md flex flex-col h-full p-0 overflow-hidden">
                <div className="p-6 border-b bg-muted/30">
                    <SheetHeader>
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2.5 rounded-xl shadow-sm">
                                {usuario ? (
                                    <Fingerprint className="h-5 w-5 text-primary" />
                                ) : (
                                    <UserPlus className="h-5 w-5 text-primary" />
                                )}
                            </div>
                            <div>
                                <SheetTitle className="text-xl font-bold tracking-tight">
                                    {usuario ? "Editar Usuario" : "Nuevo Usuario"}
                                </SheetTitle>
                                <SheetDescription className="text-muted-foreground font-medium text-[11px] uppercase tracking-wider">
                                    {usuario ? "ID: #" + usuario.id : "Registro Administrativo"}
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <Form {...form}>
                        <form id="usuario-form" onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 pb-4">
                            {usuario && (
                                <FormField
                                    control={form.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="std-label mb-1.5">Nombre de Usuario (Login)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    value={field.value || ""}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        setIsUsernameTouched(true);
                                                    }}
                                                    className="std-input h-10 font-bold bg-muted/20"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            <FormField
                                control={form.control}
                                name="nombres"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="std-label mb-1.5">Nombres</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                value={field.value || ""}
                                                placeholder="NOMBRES"
                                                className="std-input h-10 font-semibold uppercase"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="apellidos"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="std-label mb-1.5">Apellidos</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                value={field.value || ""}
                                                placeholder="APELLIDOS"
                                                className="std-input h-10 font-semibold uppercase"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="rol_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="std-label mb-1.5">Rol Sistema</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="std-input h-10 font-semibold">
                                                        <SelectValue placeholder="—" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="1" className="font-semibold">ADMIN</SelectItem>
                                                    <SelectItem value="2" className="font-semibold">REGISTRADOR</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="telefono"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="std-label mb-1.5">Teléfono</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    value={field.value || ""}
                                                    placeholder="999..."
                                                    maxLength={9}
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
                                name="dni"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="std-label mb-1.5">Documento de Identidad (DNI/Otros)</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                value={field.value || ""}
                                                placeholder="Número de documento..."
                                                maxLength={15}
                                                className="std-input h-10 font-bold tracking-widest"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* ── Permisos de módulo (solo para REGISTRADOR) ── */}
                            {form.watch("rol_id") !== "1" && (
                                <>
                                    <div className="py-2">
                                        <Separator className="bg-border/50" />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4 text-primary" />
                                            <span className="std-label">Permisos de Módulo</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground italic">
                                            El Administrador tiene todos los permisos por defecto. Configura permisos adicionales para este usuario.
                                        </p>
                                        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                                            {/* Actas */}
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actas</p>
                                            <FormField
                                                control={form.control}
                                                name="permisos_actas_anular"
                                                render={({ field }) => (
                                                    <FormItem className="flex items-center gap-3 space-y-0">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="text-xs font-semibold cursor-pointer">
                                                            Puede anular actas
                                                        </FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="permisos_actas_eliminar"
                                                render={({ field }) => (
                                                    <FormItem className="flex items-center gap-3 space-y-0">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="text-xs font-semibold cursor-pointer">
                                                            Puede eliminar actas
                                                        </FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                            <Separator className="bg-border/40" />
                                            {/* Personas */}
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Personas / Ciudadanos</p>
                                            <FormField
                                                control={form.control}
                                                name="permisos_personas_eliminar"
                                                render={({ field }) => (
                                                    <FormItem className="flex items-center gap-3 space-y-0">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="text-xs font-semibold cursor-pointer">
                                                            Puede eliminar ciudadanos
                                                        </FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="py-2">
                                <Separator className="bg-border/50" />
                            </div>

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="std-label mb-1.5">
                                            {usuario ? "Cambiar Contraseña" : "Contraseña"}
                                        </FormLabel>
                                        <FormControl>
                                            <Input {...field} type="password" placeholder="••••••••" className="std-input h-10 font-bold" />
                                        </FormControl>
                                        {usuario && (
                                            <p className="text-[10px] font-medium text-muted-foreground italic mt-1">Omitir para mantener actual.</p>
                                        )}
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
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            form="usuario-form"
                            className="flex-1 h-12 btn-primary rounded-xl font-bold uppercase text-[11px] tracking-widest gap-2 shadow-lg shadow-primary/20"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                            {usuario ? "Actualizar" : "Guardar Registro"}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
