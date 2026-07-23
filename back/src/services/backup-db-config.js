export function obtenerParamsDB(env = process.env) {
    return {
        host:     env.DB_HOST || "localhost",
        port:     env.DB_PORT || "5432",
        user:     env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_NAME,
        ssl:      env.DB_SSL === "true",
    };
}
