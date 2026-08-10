"use client";

import { useState, useEffect } from "react";
import { configuracionService } from "@/services/configuracion.service";

export const LOGOS_INSTITUCIONALES = {
    principal: {
        titulo: "Logo principal",
        nombreBase: "Logo_MDUnion",
        rutaPublica: "/Logo_MDUnion",
        uso:
            "Acceso al sistema, portal de verificación e impresión de actas y solicitudes.",
    },
    blanco: {
        titulo: "Logo para menú (fondo oscuro)",
        nombreBase: "Logo_blanco",
        rutaPublica: "/Logo_blanco",
        uso: "Menú lateral del sistema (expandido y contraído).",
    },
} as const;

export type LogoInstitucionalTipo = keyof typeof LOGOS_INSTITUCIONALES;

export type LogoEstadoBasico = {
    tipo: LogoInstitucionalTipo;
    nombre?: string; // Opcional para el endpoint público
    ruta: string; // Ahora puede tener diferentes extensiones
    personalizado: boolean;
    fecha_modificacion?: string | null; // Opcional para el endpoint público
};

export const logosInstitucionalesPorDefecto = (): Record<
    LogoInstitucionalTipo,
    LogoEstadoBasico
> => ({
    principal: {
        tipo: "principal",
        nombre: `${LOGOS_INSTITUCIONALES.principal.nombreBase}.svg`,
        ruta: `/uploads/configuracion/logos/${LOGOS_INSTITUCIONALES.principal.nombreBase}.svg`,
        personalizado: false,
        fecha_modificacion: null,
    },
    blanco: {
        tipo: "blanco",
        nombre: `${LOGOS_INSTITUCIONALES.blanco.nombreBase}.svg`,
        ruta: `/uploads/configuracion/logos/${LOGOS_INSTITUCIONALES.blanco.nombreBase}.svg`,
        personalizado: false,
        fecha_modificacion: null,
    },
});

export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export const validarArchivoLogo = (
    file: File,
): string | null => {
    // Validar solo por tipo MIME, no por nombre de archivo
    const tiposValidos = ["image/svg+xml", "image/png", "image/jpeg", "image/jpg"];
    if (file.type && !tiposValidos.includes(file.type)) {
        return "Formato incorrecto. Solo se aceptan SVG, PNG o JPEG.";
    }
    
    if (file.size === 0) {
        return "El archivo está vacío.";
    }
    if (file.size > MAX_LOGO_BYTES) {
        return "El archivo supera el tamaño máximo permitido (2 MB).";
    }
    return null;
};

import { useLogosStore } from "@/store/useLogosStore";

// Función para obtener la ruta dinámica del logo basada en la configuración
export const obtenerRutaLogoDinamica = (
    tipo: LogoInstitucionalTipo,
    configuracionLogos?: Record<LogoInstitucionalTipo, LogoEstadoBasico> | null
): string => {
    // Si hay configuración del API, usar siempre la ruta que entregó (sin importar personalizado)
    if (configuracionLogos?.[tipo]?.ruta) {
        const logo = configuracionLogos[tipo];
        if (logo.fecha_modificacion) {
            const version = new Date(logo.fecha_modificacion).getTime();
            return `${logo.ruta}?v=${version}`;
        }
        return logo.ruta;
    }
    // Fallback: ruta por defecto cuando no hay configuración disponible
    return `/uploads/configuracion/logos/${LOGOS_INSTITUCIONALES[tipo].nombreBase}.svg`;
};

// Hook personalizado para obtener la configuración de logos
export const useLogosConfig = () => {
    const { logos, loading, loadLogos } = useLogosStore();

    useEffect(() => {
        if (!logos && loading) {
            loadLogos();
        }
    }, [logos, loading, loadLogos]);

    return { logos, loading, refreshLogos: loadLogos };
};

