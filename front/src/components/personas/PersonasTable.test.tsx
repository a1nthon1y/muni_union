import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { PersonasTable } from "./PersonasTable";
import type { Persona } from "@/types/persona";

vi.mock("@/store/useAuthStore", () => ({
    useAuthStore: (selector: (state: object) => unknown) => selector({
        usuario: {
            id: 1,
            rol_id: 1,
            permisos: {},
        },
    }),
}));

const personaBase: Persona = {
    id: 42,
    tipo_documento: "DNI",
    dni: "12345678",
    nombres: "JUAN CARLOS",
    apellido_paterno: "QUISPE",
    apellido_materno: "RAMOS",
    sexo: "M",
    activo: true,
    fecha_registro: "2024-01-01",
};

test("ofrece Ver detalles y entrega la persona seleccionada", async () => {
    const user = userEvent.setup();
    const onView = vi.fn();

    render(
        <PersonasTable
            personas={[personaBase]}
            onView={onView}
            onEdit={vi.fn()}
            onDelete={vi.fn()}
            onReactivate={vi.fn()}
            isLoading={false}
            pagination={{
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
            }}
            onPageChange={vi.fn()}
        />,
    );

    await user.click(screen.getByRole("button", {
        name: "Opciones de ciudadano",
    }));
    await user.click(screen.getByRole("menuitem", { name: /Ver detalles/i }));

    expect(onView).toHaveBeenCalledWith(personaBase);
});
