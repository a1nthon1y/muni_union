import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { ActasTable } from "./ActasTable";

vi.mock("@/store/useAuthStore", () => ({
    useAuthStore: (selector: (state: object) => unknown) => selector({
        usuario: {
            id: 1,
            rol_id: 1,
            permisos: {},
        },
    }),
}));

const propsBase = {
    actas: [],
    isLoading: false,
    pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
    },
    onPageChange: vi.fn(),
    onView: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onSearch: vi.fn(),
};

describe("Filtros del Registro de Actas", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    test("mantiene visible el buscador ciudadano y envía q", async () => {
        vi.useFakeTimers();
        const onSearch = vi.fn();
        render(<ActasTable {...propsBase} onSearch={onSearch} />);

        const input = screen.getByRole("textbox", {
            name: "Buscar actas por ciudadano",
        });
        expect(input).toHaveAttribute(
            "placeholder",
            "DNI, primer apellido, segundo apellido o nombres",
        );

        fireEvent.change(input, { target: { value: "QUISPE RAMOS" } });
        await act(async () => {
            await vi.advanceTimersByTimeAsync(500);
        });

        expect(onSearch).toHaveBeenCalledWith({ q: "QUISPE RAMOS" });
    });

    test("limpiar restablece la búsqueda ciudadana", async () => {
        const user = userEvent.setup();
        render(<ActasTable {...propsBase} />);

        const input = screen.getByRole("textbox", {
            name: "Buscar actas por ciudadano",
        });
        await user.type(input, "QUISPE");
        await user.click(screen.getByRole("button", { name: "Limpiar filtros" }));

        expect(input).toHaveValue("");
    });
});
