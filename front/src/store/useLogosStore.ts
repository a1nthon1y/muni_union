import { create } from 'zustand';
import { LogoEstadoBasico, LogoInstitucionalTipo, logosInstitucionalesPorDefecto } from '@/lib/logo-institucional';
import { configuracionService } from '@/services/configuracion.service';

interface LogosState {
    logos: Record<LogoInstitucionalTipo, LogoEstadoBasico> | null;
    loading: boolean;
    loadLogos: () => Promise<void>;
    setLogos: (logos: Record<LogoInstitucionalTipo, LogoEstadoBasico>) => void;
}

export const useLogosStore = create<LogosState>((set) => ({
    logos: null,
    loading: true,
    loadLogos: async () => {
        try {
            const configuracion = await configuracionService.getLogos();
            set({ logos: configuracion as Record<LogoInstitucionalTipo, LogoEstadoBasico>, loading: false });
        } catch (error) {
            console.debug("Usando logos por defecto (configuración no disponible):", error);
            set({ logos: logosInstitucionalesPorDefecto(), loading: false });
        }
    },
    setLogos: (logos) => set({ logos }),
}));
