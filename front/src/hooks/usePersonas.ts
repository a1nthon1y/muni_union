import { useState, useEffect, useCallback } from "react";
import { personasService } from "@/services/personas.service";
import { Persona, PersonaInput } from "@/types/persona";
import { toast } from "sonner";

export function usePersonas() {
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [termino, setTermino] = useState("");
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
    });

    const fetchPersonas = useCallback(async (filtros: { termino?: string; page?: number; limit?: number }) => {
        setIsLoading(true);
        try {
            const response = await personasService.getAll(filtros);
            setPersonas(response.data);
            setPagination({
                total: response.total,
                page: filtros.page || 1,
                limit: filtros.limit || 10,
                totalPages: Math.ceil(response.total / (filtros.limit || 10))
            });
        } catch (error: any) {
            toast.error("Error al cargar personas");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPersonas({ termino, page: 1, limit: pagination.limit });
        }, 400);
        return () => clearTimeout(timer);
    }, [termino, fetchPersonas, pagination.limit]);

    const setPage = (page: number) => {
        fetchPersonas({ termino, page, limit: pagination.limit });
    };

    const createPersona = async (data: PersonaInput) => {
        try {
            if (data.dni) {
                const exists = await personasService.checkDni(data.dni);
                if (exists) {
                    toast.warning(`La persona con DNI ${data.dni} ya está registrada como ${exists.nombres} ${exists.apellido_paterno}`);
                    return null;
                }
            }
            const newPersona = await personasService.create(data);
            toast.success("Persona registrada con éxito");
            fetchPersonas({ termino, page: pagination.page, limit: pagination.limit });
            return newPersona;
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error al registrar persona");
            return null;
        }
    };

    const updatePersona = async (id: number, data: Partial<PersonaInput>) => {
        try {
            if (data.dni) {
                const exists = await personasService.checkDni(data.dni);
                if (exists && exists.id !== id) {
                    toast.warning(`El DNI ${data.dni} ya está registrado a nombre de ${exists.nombres} ${exists.apellido_paterno}`);
                    return null;
                }
            }
            const updated = await personasService.update(id, data);
            toast.success("Datos actualizados");
            fetchPersonas({ termino, page: pagination.page, limit: pagination.limit });
            return updated;
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error al actualizar");
            return null;
        }
    };

    const deletePersona = async (id: number) => {
        try {
            await personasService.delete(id);
            toast.success("Persona eliminada (lógicamente)");
            fetchPersonas({ termino, page: pagination.page, limit: pagination.limit });
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error al eliminar");
        }
    };

    const reactivatePersona = async (id: number) => {
        try {
            await personasService.reactivate(id);
            toast.success("Persona reactivada");
            fetchPersonas({ termino, page: pagination.page, limit: pagination.limit });
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Error al reactivar");
        }
    };

    return {
        personas,
        isLoading,
        termino,
        setTermino,
        pagination,
        setPage,
        refresh: () => fetchPersonas({ termino, page: pagination.page, limit: pagination.limit }),
        createPersona,
        updatePersona,
        deletePersona,
        reactivatePersona,
    };
}
