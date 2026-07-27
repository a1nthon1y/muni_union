import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import ConfiguracionPage from "./page";

const getLogos = vi.fn();
const updateLogo = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/store/useAuthStore", () => ({
    useAuthStore: (selector: (state: object) => unknown) => selector({
        usuario: { id: 1, rol_id: 1, username: "aespinoza" },
    }),
}));

vi.mock("@/services/configuracion.service", () => ({
    configuracionService: {
        getLogos: (...args: unknown[]) => getLogos(...args),
        updateLogo: (...args: unknown[]) => updateLogo(...args),
    },
}));

vi.mock("sonner", () => ({
    toast: {
        success: (...args: unknown[]) => toastSuccess(...args),
        error: (...args: unknown[]) => toastError(...args),
    },
}));

const logos = {
    principal: {
        tipo: "principal",
        nombre: "Logo_MDUnion.svg",
        ruta: "/Logo_MDUnion.svg",
        personalizado: false,
        fecha_modificacion: null,
    },
    blanco: {
        tipo: "blanco",
        nombre: "Logo_blanco.svg",
        ruta: "/Logo_blanco.svg",
        personalizado: true,
        fecha_modificacion: "2026-07-26T20:00:00-05:00",
    },
};

describe("Configuración de identidad visual", () => {
    beforeEach(() => {
        getLogos.mockResolvedValue(logos);
        updateLogo.mockResolvedValue({
            ...logos.principal,
            personalizado: true,
            fecha_modificacion: "2026-07-26T21:00:00-05:00",
        });
        Object.defineProperties(URL, {
            createObjectURL: {
                configurable: true,
                value: vi.fn(() => "blob:preview"),
            },
            revokeObjectURL: {
                configurable: true,
                value: vi.fn(),
            },
        });
    });

    test("muestra los dos logos y elimina la configuración de URL", async () => {
        render(<ConfiguracionPage />);

        expect(await screen.findByRole("heading", { name: "Identidad visual" })).toBeInTheDocument();
        expect(screen.getByText("Logo_MDUnion.svg")).toBeInTheDocument();
        expect(screen.getByText("Logo_blanco.svg")).toBeInTheDocument();
        expect(screen.queryByText(/URL pública de verificación/i)).not.toBeInTheDocument();
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    test("rechaza un archivo cuyo nombre no es el canónico", async () => {
        const user = userEvent.setup();
        render(<ConfiguracionPage />);
        const input = await screen.findByLabelText("Seleccionar Logo_MDUnion.svg");

        await user.upload(
            input,
            new File(["<svg/>"], "otro.svg", { type: "image/svg+xml" }),
        );

        expect(toastError).toHaveBeenCalledWith(
            "El archivo debe llamarse exactamente Logo_MDUnion.svg.",
        );
        expect(updateLogo).not.toHaveBeenCalled();
    });

    test("envía un SVG válido y confirma el reemplazo", async () => {
        const user = userEvent.setup();
        render(<ConfiguracionPage />);
        const input = await screen.findByLabelText("Seleccionar Logo_MDUnion.svg");
        const archivo = new File(
            ["<svg/>"],
            "Logo_MDUnion.svg",
            { type: "image/svg+xml" },
        );

        await user.upload(input, archivo);
        await user.click(screen.getByRole("button", { name: "Reemplazar Logo_MDUnion.svg" }));

        await waitFor(() => {
            expect(updateLogo).toHaveBeenCalledWith("principal", archivo);
        });
        expect(toastSuccess).toHaveBeenCalledWith(
            "Logo_MDUnion.svg fue reemplazado correctamente.",
        );
    });
});
