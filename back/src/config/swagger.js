import swaggerJsdoc from "swagger-jsdoc";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "API – Registro Civil Municipal",
            version: "1.0.0",
            description:
                "API REST para el sistema de gestión de actas y solicitudes del Registro Civil. " +
                "Autenticación via cookies httpOnly (acceso 1h, refresh 7d).",
        },
        servers: [
            { url: "http://localhost:4000/api", description: "Desarrollo" },
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: "apiKey",
                    in: "cookie",
                    name: "auth_token",
                    description: "JWT en cookie httpOnly. Hacer login en /auth/login para obtenerla.",
                },
            },
            schemas: {
                Usuario: {
                    type: "object",
                    properties: {
                        id:        { type: "integer", example: 1 },
                        username:  { type: "string",  example: "aespinoza" },
                        nombres:   { type: "string",  example: "ANTHONY" },
                        apellidos: { type: "string",  example: "ESPINOZA RIOS" },
                        rol_id:    { type: "integer", example: 1 },
                        rol:       { type: "string",  example: "Administrador" },
                        activo:    { type: "boolean", example: true },
                    },
                },
                Persona: {
                    type: "object",
                    properties: {
                        id:               { type: "integer" },
                        dni:              { type: "string",  example: "12345678" },
                        tipo_documento:   { type: "string",  example: "DNI" },
                        nombres:          { type: "string",  example: "JUAN" },
                        apellido_paterno: { type: "string",  example: "GARCIA" },
                        apellido_materno: { type: "string",  example: "LOPEZ" },
                        sexo:             { type: "string",  enum: ["M", "F"] },
                        fecha_nacimiento: { type: "string",  format: "date" },
                        fecha_fallecimiento: {
                            type: "string",
                            format: "date",
                            nullable: true,
                        },
                        telefono:         { type: "string" },
                        direccion:        { type: "string" },
                    },
                },
                Error: {
                    type: "object",
                    properties: {
                        message: { type: "string" },
                    },
                },
                ErrorValidacion: {
                    type: "object",
                    properties: {
                        message: { type: "string", example: "Datos inválidos" },
                        errors: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    field:   { type: "string" },
                                    message: { type: "string" },
                                },
                            },
                        },
                    },
                },
            },
        },
        security: [{ cookieAuth: [] }],
    },
    apis: ["./src/routes/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
