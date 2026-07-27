import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import ActasPage from "./page";

const getAll = vi.fn();

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn() }),
    useSearchParams: () => new URLSearchParams("persona_id=42&acta_id=7"),
}));

vi.mock("@/services/actas.service", () => ({
    actasService: {
        getAll: (...args: unknown[]) => getAll(...args),
        delete: vi.fn(),
        anular: vi.fn(),
        reactivate: vi.fn(),
    },
}));

vi.mock("@/components/actas/ActasTable", () => ({
    ActasTable: () => <div>Tabla de actas</div>,
}));

vi.mock("@/components/actas/ActaEditSheet", () => ({
    ActaEditSheet: () => null,
}));

vi.mock("@/components/actas/ActaDetailSheet", () => ({
    ActaDetailSheet: ({
        isOpen,
        acta,
    }: {
        isOpen: boolean;
        acta: { numero_acta?: string } | null;
    }) => isOpen && acta
        ? <div>Acta N° {acta.numero_acta}</div>
        : null,
}));

const acta = {
    id: 7,
    tipo_acta: "MATRIMONIO",
    numero_acta: "MAT-L2-14",
    anio: 2024,
    fecha_acta: "2024-03-10",
    estado: "ACTIVO",
    persona_principal_id: 12,
    persona_secundaria_id: 42,
    fecha_registro: "2024-03-10",
};

beforeEach(() => {
    getAll.mockReset();
    getAll.mockResolvedValue({
        data: [acta],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
});

test("filtra por persona_id y abre el acta indicada en la URL", async () => {
    render(<ActasPage />);

    await waitFor(() => {
        expect(getAll).toHaveBeenCalledWith(expect.objectContaining({
            persona_id: 42,
        }));
    });
    expect(await screen.findByText("Acta N° MAT-L2-14")).toBeInTheDocument();
});
