import test from "node:test";
import assert from "node:assert/strict";
import { formatearIp, obtenerIpCliente } from "../src/utils/ipUtils.js";

test("formatearIp normaliza loopback IPv6 a IPv4", () => {
    assert.equal(formatearIp("::1"), "127.0.0.1");
    assert.equal(formatearIp("0:0:0:0:0:0:0:1"), "127.0.0.1");
});

test("formatearIp limpia prefijos ::ffff: mapeados de IPv4", () => {
    assert.equal(formatearIp("::ffff:192.168.1.50"), "192.168.1.50");
    assert.equal(formatearIp("::ffff:200.48.10.5"), "200.48.10.5");
});

test("formatearIp remueve el puerto accidental en IPv4", () => {
    assert.equal(formatearIp("192.168.1.50:54321"), "192.168.1.50");
});

test("formatearIp maneja valores nulos o vacíos", () => {
    assert.equal(formatearIp(null), "127.0.0.1");
    assert.equal(formatearIp(undefined), "127.0.0.1");
    assert.equal(formatearIp(""), "127.0.0.1");
});

test("obtenerIpCliente prioriza cabeceras de proxy antes de req.ip", () => {
    // 1. Cloudflare
    const reqCf = {
        headers: { "cf-connecting-ip": "203.0.113.195" },
        ip: "10.0.0.1"
    };
    assert.equal(obtenerIpCliente(reqCf), "203.0.113.195");

    // 2. X-Real-IP (Nginx)
    const reqNginx = {
        headers: { "x-real-ip": "192.168.1.88" },
        ip: "127.0.0.1"
    };
    assert.equal(obtenerIpCliente(reqNginx), "192.168.1.88");

    // 3. X-Forwarded-For toma el primer cliente
    const reqForwarded = {
        headers: { "x-forwarded-for": "192.168.1.75, 10.0.0.1" },
        ip: "10.0.0.1"
    };
    assert.equal(obtenerIpCliente(reqForwarded), "192.168.1.75");

    // 4. req.ip con formato IPv6 mapeado
    const reqExpress = {
        headers: {},
        ip: "::ffff:192.168.1.33"
    };
    assert.equal(obtenerIpCliente(reqExpress), "192.168.1.33");

    // 5. socket directo
    const reqSocket = {
        headers: {},
        socket: { remoteAddress: "::1" }
    };
    assert.equal(obtenerIpCliente(reqSocket), "127.0.0.1");
});
