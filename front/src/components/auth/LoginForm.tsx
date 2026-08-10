"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Lock, User } from "lucide-react";

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import api from "@/utils/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useLogosConfig, obtenerRutaLogoDinamica } from "@/lib/logo-institucional";

const loginSchema = z.object({
    username: z.string().min(1, "El usuario es obligatorio"),
    password: z.string().min(1, "La contraseña es obligatoria"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const login = useAuthStore((state) => state.login);
    const { logos: logosConfig } = useLogosConfig();

    const form = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    });

    async function onSubmit(values: LoginValues) {
        setIsLoading(true);
        try {
            const response = await api.post("/auth/login", values);
            const { usuario } = response.data;

            // El token JWT queda en cookie httpOnly — aquí solo guardamos la info del usuario
            login(usuario);
            toast.success(`Bienvenido, ${usuario.nombres}`);
            router.push("/dashboard");
        } catch (error: unknown) {
            const message =
                (error as { response?: { data?: { message?: string } } })
                    ?.response?.data?.message
                || "Error al iniciar sesión";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className="w-full max-w-md shadow-2xl border-border bg-card/80 backdrop-blur-sm overflow-hidden border-t-4 border-t-primary">
            <CardHeader className="space-y-4 text-center pb-8 pt-10">
                <div className="flex justify-center mb-6">
                    <div className="p-2 w-full max-w-[280px]">
                        <Image
                            src={obtenerRutaLogoDinamica("principal", logosConfig || undefined)}
                            alt="Logo MD Unión"
                            width={400}
                            height={120}
                            unoptimized
                            className="w-full h-auto object-contain"
                            priority
                        />
                    </div>
                </div>
                <div className="space-y-1">
                    <CardTitle className="text-2xl font-black tracking-tighter uppercase text-foreground">Acceso al Sistema</CardTitle>
                    <CardDescription className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70 leading-snug">
                        Registro Civil Municipal · Municipalidad Distrital de La Unión
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="std-label" htmlFor="username-input">Nombre de Usuario</FormLabel>
                                    <FormControl>
                                        <div className="relative group">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <Input
                                                id="username-input"
                                                placeholder="ingrese su usuario"
                                                {...field}
                                                className="pl-10 std-input font-bold"
                                                autoComplete="username"
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-[10px] uppercase font-bold" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="std-label" htmlFor="password-input">Contraseña</FormLabel>
                                    <FormControl>
                                        <div className="relative group">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <Input
                                                id="password-input"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                {...field}
                                                className="pl-10 pr-10 std-input font-bold"
                                                autoComplete="current-password"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-0 top-1/2 -translate-y-1/2 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-primary transition-colors"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-[10px] uppercase font-bold" />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Iniciando sesión...
                                </>
                            ) : (
                                "Ingresar"
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
