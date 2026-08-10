import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            // Logos institucionales (rutas raíz del backend)
            {
                source: "/Logo_MDUnion.:ext",
                destination: `${BACKEND_URL}/Logo_MDUnion.:ext`,
            },
            {
                source: "/Logo_blanco.:ext",
                destination: `${BACKEND_URL}/Logo_blanco.:ext`,
            },
            // Archivos subidos (documentos, logos en /uploads/)
            {
                source: "/uploads/:path*",
                destination: `${BACKEND_URL}/uploads/:path*`,
            },
        ];
    },
};

export default nextConfig;
