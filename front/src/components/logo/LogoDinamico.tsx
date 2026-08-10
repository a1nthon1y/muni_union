"use client";

import { useLogosConfig, obtenerRutaLogoDinamica, LogoInstitucionalTipo } from "@/lib/logo-institucional";
import Image from "next/image";

interface LogoDinamicoProps {
    tipo: LogoInstitucionalTipo;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    priority?: boolean;
}

export function LogoDinamico({ tipo, alt, width = 120, height = 40, className, priority = false }: LogoDinamicoProps) {
    const { logos: logosConfig } = useLogosConfig();
    const ruta = obtenerRutaLogoDinamica(tipo, logosConfig);

    return (
        <Image
            src={ruta}
            alt={alt}
            width={width}
            height={height}
            unoptimized
            className={className}
            priority={priority}
        />
    );
}
