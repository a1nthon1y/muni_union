import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { PersonaDetailSheet } from "./PersonaDetailSheet";
import type { Persona } from "@/types/persona";

const getAll = vi.fn();

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/services/actas.service", () => ({
    actasService: {
        getAll: (...args: unknown[]) => getAll(...args),
    },
}));

const personaBase: Persona = {
    id: 42,
    tipo_documento: "DNI",
    dni: "12345678",
    nombres: "JUAN CARLOS",
    apellido_paterno: "QUISPE",
    apellido_materno: "RAMOS",
    sexo: "M",
    fecha_nacimiento: "1980-05-14",
    activo: true,
    fecha_registro: "2024-01-01",
};

describe("Detalle del ciudadano", () => {
    beforeEach(() => {
        getAll.mockReset();
    });

    test("consulta actas por ID y muestra la participación", async () => {
        getAll.mockResolvedValue({
            data: [{
                id: 7,
                tipo_acta: "MATRIMONIO",
                numero_acta: "MAT-L2-14",
                anio: 2024,
                fecha_acta: "2024-03-10",
                estado: "ACTIVO",
                persona_principal_id: 12,
                persona_secundaria_id: 42,
                fecha_registro: "2024-03-10",
                tiene_documento: true,
            }],
            pagination: { total: 1, page: 1, limit: 50, totalPages: 1 },
        });

        render(
            <PersonaDetailSheet
                isOpen
                onClose={vi.fn()}
                persona={personaBase}
            />,
        );

        expect(await screen.findByText("MAT-L2-14")).toBeInTheDocument();
        expect(screen.getByText("Cónyuge")).toBeInTheDocument();
        expect(getAll).toHaveBeenCalledWith({
            persona_id: 42,
            page: 1,
            limit: 50,
        });
    });

    test("explica cuando la persona no tiene actas", async () => {
        getAll.mockResolvedValue({
            data: [],
            pagination: { total: 0, page: 1, limit: 50, totalPages: 0 },
        });

        render(
            <PersonaDetailSheet
                isOpen
                onClose={vi.fn()}
                persona={personaBase}
            />,
        );

        expect(await screen.findByText(
            "Este ciudadano no tiene actas vinculadas",
        )).toBeInTheDocument();
    });

    test("ofrece reintentar cuando la consulta falla", async () => {
        getAll.mockRejectedValue(new Error("sin conexión"));

        render(
            <PersonaDetailSheet
                isOpen
                onClose={vi.fn()}
                persona={personaBase}
            />,
        );

        expect(await screen.findByText(
            "No se pudieron cargar las actas vinculadas",
        )).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
    });
});
