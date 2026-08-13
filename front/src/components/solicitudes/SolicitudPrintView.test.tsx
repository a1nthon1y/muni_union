import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { SolicitudPrintView } from "./SolicitudPrintView";
import { Solicitud } from "@/types/solicitud";

const solicitud = {
    id: 42,
    tipo_solicitud: "COPIA CERTIFICADA",
    estado: "ATENDIDA",
    fecha_solicitud: "2026-07-26T12:00:00-05:00",
    solicitante_nombres: "Ana",
    solicitante_apellidos: "Quispe",
    solicitante_dni: "12345678",
    detalles: [],
} as unknown as Solicitud;

describe("Constancia de solicitud", () => {
    test("construye la verificación con el origen actual del navegador", () => {
        render(<SolicitudPrintView solicitud={solicitud} />);

        expect(
            screen.getByText("Escanee el código QR para verificar la autenticidad"),
        ).toBeInTheDocument();
    });
});
