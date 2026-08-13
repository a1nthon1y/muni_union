"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { usuariosService } from "@/services/usuarios.service";
import { ChangePasswordInput } from "@/types/usuario";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, User, Lock, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const changePasswordSchema = z.object({
    passwordActual: z.string().min(1, "La contraseña actual es obligatoria"),
    passwordNuevo: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
    confirmarPassword: z.string().min(1, "Debe confirmar la nueva contraseña"),
}).refine((data) => data.passwordNuevo === data.confirmarPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmarPassword"],
});

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export default function PerfilPage() {
    const usuario = useAuthStore((state) => state.usuario);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<ChangePasswordForm>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            passwordActual: "",
            passwordNuevo: "",
            confirmarPassword: "",
        },
    });

    const onSubmit = async (values: ChangePasswordForm) => {
        setIsLoading(true);
        try {
            await usuariosService.cambiarMiPassword({
                passwordActual: values.passwordActual,
                passwordNuevo: values.passwordNuevo,
            });
            toast.success("Contraseña actualizada correctamente");
            form.reset();
        } catch (error: any) {
            const message = error.response?.data?.message || "Error al cambiar la contraseña";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-semibold text-foreground leading-tight">Mi Perfil</h1>
                <p className="text-muted-foreground mt-2">Gestiona tu información personal y seguridad</p>
            </div>

            <Card className="border-border shadow-sm rounded-2xl">
                <CardHeader className="bg-muted/40 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-semibold text-foreground">Información de la Cuenta</CardTitle>
                            <CardDescription className="text-sm text-muted-foreground">Datos de tu usuario en el sistema</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">Usuario</Label>
                            <p className="text-foreground font-medium mt-1">{usuario?.username}</p>
                        </div>
                        <div>
                            <Label className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">Rol</Label>
                            <p className="text-foreground font-medium mt-1">{usuario?.rol}</p>
                        </div>
                        <div className="sm:col-span-2">
                            <Label className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">Nombre Completo</Label>
                            <p className="text-foreground font-medium mt-1">{usuario?.nombres} {usuario?.apellidos}</p>
                        </div>
                        {usuario?.dni && (
                            <div>
                                <Label className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">DNI</Label>
                                <p className="text-foreground font-medium mt-1">{usuario?.dni}</p>
                            </div>
                        )}
                        {usuario?.telefono && (
                            <div>
                                <Label className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">Teléfono</Label>
                                <p className="text-foreground font-medium mt-1">{usuario?.telefono}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="border-border shadow-sm rounded-2xl">
                <CardHeader className="bg-muted/40 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center">
                            <Lock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-semibold text-foreground">Cambiar Contraseña</CardTitle>
                            <CardDescription className="text-sm text-muted-foreground">Actualiza tu contraseña para mantener tu cuenta segura</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="passwordActual"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contraseña Actual</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showCurrent ? "text" : "password"}
                                                    placeholder="Ingresa tu contraseña actual"
                                                    {...field}
                                                    className="pr-10"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                                                    onClick={() => setShowCurrent(!showCurrent)}
                                                    aria-label={showCurrent ? "Ocultar contraseña" : "Mostrar contraseña"}
                                                >
                                                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="passwordNuevo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nueva Contraseña</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showNew ? "text" : "password"}
                                                    placeholder="Mínimo 8 caracteres"
                                                    {...field}
                                                    className="pr-10"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                                                    onClick={() => setShowNew(!showNew)}
                                                    aria-label={showNew ? "Ocultar contraseña" : "Mostrar contraseña"}
                                                >
                                                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="confirmarPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showConfirm ? "text" : "password"}
                                                    placeholder="Repite la nueva contraseña"
                                                    {...field}
                                                    className="pr-10"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                                                    onClick={() => setShowConfirm(!showConfirm)}
                                                    aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                                                >
                                                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end pt-4 border-t border-border">
                                <Button
                                    type="submit"
                                    className="gap-2"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-4 w-4" />
                                            Actualizar Contraseña
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}