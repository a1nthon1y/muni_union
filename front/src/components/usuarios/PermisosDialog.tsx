"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Usuario } from "@/types/auth";
import { usuariosService } from "@/services/usuarios.service";

interface PermisosDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    usuario: Usuario | null;
    onSuccess: () => void;
}

interface PermisosState {
    actas_modificar: boolean;
    actas_anular: boolean;
    actas_eliminar: boolean;
    personas_modificar: boolean;
    personas_eliminar: boolean;
}

const defaultPermisos: PermisosState = {
    actas_modificar: true,
    actas_anular: false,
    actas_eliminar: false,
    personas_modificar: true,
    personas_eliminar: false,
};

export function PermisosDialog({ open, onOpenChange, usuario, onSuccess }: PermisosDialogProps) {
    const [permisos, setPermisos] = useState<PermisosState>(defaultPermisos);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (open && usuario) {
            setPermisos({
                actas_modificar:    usuario.permisos?.actas_modificar    ?? true,
                actas_anular:       usuario.permisos?.actas_anular       ?? false,
                actas_eliminar:     usuario.permisos?.actas_eliminar     ?? false,
                personas_modificar: usuario.permisos?.personas_modificar ?? true,
                personas_eliminar:  usuario.permisos?.personas_eliminar  ?? false,
            });
        }
    }, [open, usuario]);

    const toggle = (key: keyof PermisosState) => {
        setPermisos(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        if (!usuario) return;
        try {
            setIsSaving(true);
            await usuariosService.actualizar(usuario.id, { permisos });
            toast.success("Permisos actualizados correctamente");
            onOpenChange(false);
            onSuccess();
        } catch {
            toast.error("Error al actualizar permisos");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm rounded-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="bg-primary/10 p-2.5 rounded-xl">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold tracking-tight">
                                Permisos de Módulo
                            </DialogTitle>
                            <DialogDescription className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                {usuario?.nombres} {usuario?.apellidos}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* ACTAS */}
                    <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Actas
                        </p>
                        {([
                            { key: "actas_modificar",  label: "Puede modificar actas" },
                            { key: "actas_anular",     label: "Puede anular actas" },
                            { key: "actas_eliminar",   label: "Puede eliminar actas" },
                        ] as { key: keyof PermisosState; label: string }[]).map(({ key, label }) => (
                            <label
                                key={key}
                                className="flex items-center gap-3 cursor-pointer group"
                                onClick={() => toggle(key)}
                            >
                                <Checkbox
                                    checked={permisos[key]}
                                    onCheckedChange={() => toggle(key)}
                                />
                                <span className="text-xs font-semibold group-hover:text-primary transition-colors">
                                    {label}
                                </span>
                            </label>
                        ))}

                        <Separator className="bg-border/40" />

                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Personas / Ciudadanos
                        </p>
                        {([
                            { key: "personas_modificar", label: "Puede modificar ciudadanos" },
                            { key: "personas_eliminar",  label: "Puede eliminar ciudadanos" },
                        ] as { key: keyof PermisosState; label: string }[]).map(({ key, label }) => (
                            <label
                                key={key}
                                className="flex items-center gap-3 cursor-pointer group"
                                onClick={() => toggle(key)}
                            >
                                <Checkbox
                                    checked={permisos[key]}
                                    onCheckedChange={() => toggle(key)}
                                />
                                <span className="text-xs font-semibold group-hover:text-primary transition-colors">
                                    {label}
                                </span>
                            </label>
                        ))}
                    </div>

                    <p className="text-[10px] text-muted-foreground italic px-1">
                        Los cambios se aplican de inmediato. El usuario necesitará iniciar sesión nuevamente para ver los cambios reflejados.
                    </p>
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                    <Button
                        variant="outline"
                        className="flex-1 font-bold text-xs rounded-xl"
                        onClick={() => onOpenChange(false)}
                        disabled={isSaving}
                    >
                        Cancelar
                    </Button>
                    <Button
                        className="flex-1 font-bold text-xs rounded-xl gap-2"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
