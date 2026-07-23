import test from "node:test";
import assert from "node:assert/strict";
import { obtenerParamsDB } from "../src/services/backup-db-config.js";

test("el backup usa la misma configuración DB_* que el pool de la aplicación", () => {
    const config = obtenerParamsDB({
        DB_HOST: "172.16.3.23",
        DB_PORT: "5432",
        DB_USER: "app_user",
        DB_PASSWORD: "secreto",
        DB_NAME: "registro_muni_union",
        DB_SSL: "true",
        DATABASE_URL: "postgresql://neon-user:secret@neon.example/neon_db",
    });

    assert.deepEqual(config, {
        host: "172.16.3.23",
        port: "5432",
        user: "app_user",
        password: "secreto",
        database: "registro_muni_union",
        ssl: true,
    });
});
