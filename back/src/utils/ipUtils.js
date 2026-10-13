/**
 * Utilidad para detección y normalización de la dirección IP real del cliente.
 * 
 * Funciona tanto en entorno local (conexión directa o LAN) como en producción
 * detrás de reverse proxies (Nginx, Docker, Cloudflare, Traefik, etc.).
 */

/**
 * Normaliza y limpia una cadena de dirección IP.
 * - Quita prefijo de mapeo IPv6 (::ffff:192.168.1.1 -> 192.168.1.1)
 * - Convierte loopback IPv6 (::1) a IPv4 (127.0.0.1)
 * - Remueve puertos accidentales en IPv4 (192.168.1.1:54321 -> 192.168.1.1)
 * - Trunca a 45 caracteres (límite estándar de IPv6 y compatible con VARCHAR(50))
 * 
 * @param {string} rawIp
 * @returns {string}
 */
export const formatearIp = (rawIp) => {
    if (!rawIp || typeof rawIp !== "string") {
        return "127.0.0.1";
    }

    let ip = rawIp.trim();

    // Loopback IPv6
    if (ip === "::1" || ip === "0:0:0:0:0:0:0:1") {
        return "127.0.0.1";
    }

    // Prefijo IPv4 mapeado en IPv6
    if (ip.startsWith("::ffff:")) {
        ip = ip.substring(7);
    }

    // Remover puerto en IPv4 (ej. 192.168.1.50:61234)
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/.test(ip)) {
        ip = ip.split(":")[0];
    }

    // Limitar longitud para columnas de base de datos VARCHAR(50)
    if (ip.length > 45) {
        ip = ip.substring(0, 45);
    }

    return ip || "127.0.0.1";
};

/**
 * Extrae la IP real del cliente desde el objeto Request de Express.
 * Prioriza cabeceras de proxy inverso (Nginx, Cloudflare) antes de caer en el socket local.
 * 
 * @param {import("express").Request} req
 * @returns {string}
 */
export const obtenerIpCliente = (req) => {
    if (!req) return "INTERNAL";

    // 1. Cloudflare (si se utiliza CDN/WAF)
    const cfConnecting = req.headers?.["cf-connecting-ip"];
    if (cfConnecting) {
        return formatearIp(cfConnecting);
    }

    // 2. Nginx X-Real-IP (directamente la IP del cliente remoto configurada por proxy_set_header X-Real-IP $remote_addr)
    const xRealIp = req.headers?.["x-real-ip"];
    if (xRealIp) {
        return formatearIp(xRealIp);
    }

    // 3. X-Forwarded-For (estándar de proxies; el primer elemento es el cliente originador)
    const xForwardedFor = req.headers?.["x-forwarded-for"];
    if (xForwardedFor) {
        const clientIp = typeof xForwardedFor === "string" 
            ? xForwardedFor.split(",")[0].trim() 
            : Array.isArray(xForwardedFor) ? xForwardedFor[0] : "";
        if (clientIp) {
            return formatearIp(clientIp);
        }
    }

    // 4. Cabeceras alternativas de clientes o balanceadores
    const xClientIp = req.headers?.["x-client-ip"];
    if (xClientIp) {
        return formatearIp(xClientIp);
    }

    // 5. req.ip de Express (gestionado con 'trust proxy')
    if (req.ip) {
        return formatearIp(req.ip);
    }

    // 6. Socket de conexión directa
    const socketIp = req.socket?.remoteAddress || req.connection?.remoteAddress;
    if (socketIp) {
        return formatearIp(socketIp);
    }

    return "127.0.0.1";
};
