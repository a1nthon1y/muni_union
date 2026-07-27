# Identidad Visual Configurable Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sustituir la configuración editable de URL pública por la actualización administrativa de `Logo_MDUnion.svg` y `Logo_blanco.svg`, conservando sus rutas actuales en toda la aplicación.

**Architecture:** El Backend valida y reemplaza atómicamente SVG en el volumen NFS existente, conserva metadatos en `configuracion_sistema` y publica únicamente las dos rutas canónicas. Nginx consulta primero al Backend y usa los SVG estáticos del Frontend como respaldo; el Frontend ofrece dos tarjetas de reemplazo y elimina toda lógica de URL configurable.

**Tech Stack:** Node.js 20, Express 5, Multer, `node:test`, PostgreSQL 15, Next.js 16, React 19, TypeScript, Axios, Tailwind CSS 4, Nginx y NFS.

## Global Constraints

- Conservar exactamente `/Logo_MDUnion.svg` y `/Logo_blanco.svg`.
- Solo ADMIN puede consultar metadatos y reemplazar archivos.
- Aceptar únicamente SVG con nombre canónico y máximo 2 MB.
- Rechazar contenido SVG activo: `DOCTYPE`, entidades, `<script>`, atributos `on*`, `javascript:` y referencias externas.
- Escribir temporal y renombrar; un error nunca elimina el logo vigente.
- Mantener los SVG actuales del Frontend como respaldo.
- Servir logos sin caché.
- Eliminar la edición funcional de URL, dominio o IP de código, migraciones limpias y manuales.
- Conservar las IP de infraestructura necesarias para operar las VMs.
- La constancia usa `window.location.origin`.

---

### Task 1: Validación y almacenamiento atómico de logos

**Files:**
- Create: `back/src/services/identidad-visual.service.js`
- Create: `back/test/identidad-visual.test.js`
- Modify: `back/Dockerfile`

**Interfaces:**
- Produces: `LOGOS`, `validarLogoSvg({ tipo, originalname, mimetype, buffer })`, `guardarLogoAtomico({ tipo, buffer, baseDir })`, `obtenerRutaLogo(tipo, baseDir)`.
- `tipo` is `"principal" | "blanco"`.
- `LOGOS[tipo]` exposes `{ clave, filename }`.

- [ ] **Step 1: Write failing validation tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  validarLogoSvg,
  guardarLogoAtomico,
} from "../src/services/identidad-visual.service.js";

const svgSeguro = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>');

test("acepta el SVG principal con nombre canónico", () => {
  assert.doesNotThrow(() => validarLogoSvg({
    tipo: "principal",
    originalname: "Logo_MDUnion.svg",
    mimetype: "image/svg+xml",
    buffer: svgSeguro,
  }));
});

test("rechaza nombre distinto del canónico", () => {
  assert.throws(() => validarLogoSvg({
    tipo: "principal",
    originalname: "otro.svg",
    mimetype: "image/svg+xml",
    buffer: svgSeguro,
  }), /Logo_MDUnion\.svg/);
});

for (const contenido of [
  "<svg><script>alert(1)</script></svg>",
  '<svg onload="alert(1)"></svg>',
  '<svg><a href="javascript:alert(1)"/></svg>',
  '<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg>&xxe;</svg>',
  '<svg><image href="https://externo/logo.png"/></svg>',
]) {
  test(`rechaza contenido SVG activo: ${contenido.slice(0, 24)}`, () => {
    assert.throws(() => validarLogoSvg({
      tipo: "principal",
      originalname: "Logo_MDUnion.svg",
      mimetype: "image/svg+xml",
      buffer: Buffer.from(contenido),
    }), /SVG no permitido/);
  });
}

test("un reemplazo inválido conserva el archivo anterior", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "logos-"));
  const vigente = path.join(dir, "Logo_MDUnion.svg");
  await writeFile(vigente, "<svg id='anterior'/>");
  await assert.rejects(
    guardarLogoAtomico({ tipo: "principal", buffer: Buffer.alloc(0), baseDir: dir }),
  );
  assert.equal(await readFile(vigente, "utf8"), "<svg id='anterior'/>");
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm --prefix back test -- test/identidad-visual.test.js`  
Expected: FAIL because `identidad-visual.service.js` does not exist.

- [ ] **Step 3: Implement minimal validation and atomic storage**

```js
export const LOGOS = Object.freeze({
  principal: { clave: "logo_principal", filename: "Logo_MDUnion.svg" },
  blanco: { clave: "logo_blanco", filename: "Logo_blanco.svg" },
});

const MAX_BYTES = 2 * 1024 * 1024;
const PATRONES_ACTIVOS = [
  /<!DOCTYPE/i, /<!ENTITY/i, /<script\b/i, /\son[a-z]+\s*=/i,
  /javascript\s*:/i, /(?:href|xlink:href)\s*=\s*["']https?:/i,
];

export function validarLogoSvg({ tipo, originalname, mimetype, buffer }) {
  const logo = LOGOS[tipo];
  if (!logo) throw new Error("Tipo de logo no válido.");
  if (originalname !== logo.filename) throw new Error(`El archivo debe llamarse ${logo.filename}.`);
  if (mimetype !== "image/svg+xml") throw new Error("Solo se acepta image/svg+xml.");
  if (!buffer?.length || buffer.length > MAX_BYTES) throw new Error("El SVG debe pesar entre 1 byte y 2 MB.");
  const texto = buffer.toString("utf8");
  if (!/<svg[\s>]/i.test(texto) || PATRONES_ACTIVOS.some((regex) => regex.test(texto))) {
    throw new Error("SVG no permitido: contiene estructura inválida o contenido activo.");
  }
  return logo;
}
```

Implement `guardarLogoAtomico` con `mkdir`, `writeFile` a `.${filename}.${randomUUID()}.tmp`, validación previa y `rename` al destino; limpiar el temporal en `catch`. Actualizar `back/Dockerfile` para crear `/app/uploads/configuracion/logos`.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm --prefix back test -- test/identidad-visual.test.js`  
Expected: all identity tests PASS.

- [ ] **Step 5: Commit**

```bash
git add back/src/services/identidad-visual.service.js back/test/identidad-visual.test.js back/Dockerfile
git commit -m "feat: validar y almacenar logos institucionales"
```

---

### Task 2: API administrativa, publicación y migración

**Files:**
- Create: `back/src/middlewares/logo-upload.middleware.js`
- Modify: `back/src/services/configuracion.service.js`
- Modify: `back/src/controllers/configuracion.controller.js`
- Modify: `back/src/routes/configuracion.routes.js`
- Modify: `back/src/app.js`
- Modify: `back/src/migrations/006_configuracion_sistema.sql`
- Create: `back/src/migrations/007_identidad_visual.sql`
- Create: `back/test/configuracion-logos.test.js`

**Interfaces:**
- Produces authenticated `GET /api/configuracion/logos`.
- Produces ADMIN-only `PUT /api/configuracion/logos/:tipo`, multipart field `logo`.
- Produces public `GET /Logo_MDUnion.svg` and `GET /Logo_blanco.svg`.
- Removes `PUT /api/configuracion/url-verificacion`.

- [ ] **Step 1: Write failing service/controller tests**

Use `node:test` with an injected temporary `LOGOS_DIR` and assert:

```js
test("la configuración solo devuelve las dos rutas canónicas", async () => {
  const resultado = await obtenerConfiguracionLogos();
  assert.deepEqual(Object.keys(resultado).sort(), ["blanco", "principal"]);
  assert.equal(resultado.principal.ruta, "/Logo_MDUnion.svg");
  assert.equal(resultado.blanco.ruta, "/Logo_blanco.svg");
});

test("actualizar logo conserva la ruta y devuelve fecha", async () => {
  const resultado = await actualizarLogo({
    tipo: "blanco",
    file: {
      originalname: "Logo_blanco.svg",
      mimetype: "image/svg+xml",
      buffer: svgSeguro,
    },
  });
  assert.equal(resultado.ruta, "/Logo_blanco.svg");
  assert.ok(resultado.fecha_modificacion);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm --prefix back test -- test/configuracion-logos.test.js`  
Expected: FAIL because the logo configuration API functions do not exist.

- [ ] **Step 3: Implement API and remove URL behavior**

Create Multer memory storage:

```js
export const uploadLogo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) =>
    cb(file.mimetype === "image/svg+xml" ? null : new Error("Solo se acepta SVG."), true),
});
```

Replace route definitions with:

```js
router.get("/logos", allowRoles(1), getLogos);
router.put("/logos/:tipo", allowRoles(1), uploadLogo.single("logo"), putLogo);
```

Mount public logo delivery before authenticated `/api` middleware:

```js
app.get(["/Logo_MDUnion.svg", "/Logo_blanco.svg"], serveLogo);
```

Set `Content-Type: image/svg+xml`, `X-Content-Type-Options: nosniff` and `Cache-Control: no-store, max-age=0`. Return 404 when no custom file exists so Nginx can use the static fallback.

Rewrite migration `006` to seed only `logo_principal` and `logo_blanco`. Migration `007` removes only the inherited URL key and upserts both logo keys idempotently.

- [ ] **Step 4: Run backend tests**

Run: `npm --prefix back test`  
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add back/src back/test back/Dockerfile
git commit -m "feat: exponer configuracion de logos"
```

---

### Task 3: Rutas canónicas y respaldo Nginx

**Files:**
- Modify: `deploy/frontend/04_setup_frontend.sh`
- Modify: `deploy/app/nginx-production.conf`
- Modify: `nginx/nginx.conf`

**Interfaces:**
- Consumes Backend root logo routes from Task 2.
- Produces exact external routes with Backend-first and Frontend fallback.

- [ ] **Step 1: Add a failing configuration assertion**

Run:

```bash
rg 'location = /Logo_MDUnion\.svg' deploy/frontend/04_setup_frontend.sh
```

Expected: no match.

- [ ] **Step 2: Add exact locations to internal and public servers**

Use one exact block per logo:

```nginx
location = /Logo_MDUnion.svg {
    proxy_intercept_errors on;
    error_page 404 = @frontend_logo;
    add_header Cache-Control "no-store, max-age=0" always;
    proxy_pass http://backend;
}

location = /Logo_blanco.svg {
    proxy_intercept_errors on;
    error_page 404 = @frontend_logo;
    add_header Cache-Control "no-store, max-age=0" always;
    proxy_pass http://backend;
}

location @frontend_logo {
    add_header Cache-Control "no-store, max-age=0" always;
    proxy_pass http://frontend;
}
```

Remove the old regex that grouped the main logo with the favicon. Apply equivalent upstream names in `nginx/nginx.conf`.

- [ ] **Step 3: Validate generated and static configurations**

Run:

```bash
rg 'location = /Logo_(MDUnion|blanco)\.svg' \
  deploy/frontend/04_setup_frontend.sh deploy/app/nginx-production.conf nginx/nginx.conf
```

Expected: both names in each active configuration.

- [ ] **Step 4: Commit**

```bash
git add deploy/frontend/04_setup_frontend.sh deploy/app/nginx-production.conf nginx/nginx.conf
git commit -m "feat: publicar logos configurables sin cache"
```

---

### Task 4: Servicio Frontend y página de identidad visual

**Files:**
- Modify: `front/package.json`
- Modify: `front/package-lock.json`
- Create: `front/vitest.config.ts`
- Create: `front/src/app/(dashboard)/dashboard/configuracion/page.test.tsx`
- Modify: `front/src/services/configuracion.service.ts`
- Modify: `front/src/app/(dashboard)/dashboard/configuracion/page.tsx`
- Modify: `front/src/components/layout/Sidebar.tsx`
- Modify: `front/src/components/layout/Header.tsx`

**Interfaces:**
- Consumes `GET /configuracion/logos` and `PUT /configuracion/logos/:tipo`.
- Produces `LogoConfig`, `getLogos()` and `updateLogo(tipo, file)`.

- [ ] **Step 1: Install and configure component test tooling**

Run:

```bash
npm --prefix front install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Add scripts:

```json
"test": "vitest run"
```

- [ ] **Step 2: Write failing page tests**

Test that:

```tsx
expect(screen.queryByText(/URL pública/i)).not.toBeInTheDocument();
expect(screen.getByText("Logo_MDUnion.svg")).toBeInTheDocument();
expect(screen.getByText("Logo_blanco.svg")).toBeInTheDocument();
expect(screen.getAllByText(/será reemplazado y el cambio se aplicará en todo el sistema/i)).toHaveLength(2);
```

Mock only the HTTP service and authenticated ADMIN store. Add a test selecting `otro.svg` and assert the page rejects the wrong name before calling the service.

- [ ] **Step 3: Run tests and verify RED**

Run: `npm --prefix front test -- configuracion/page.test.tsx`  
Expected: FAIL because the page still renders URL configuration.

- [ ] **Step 4: Implement the service and page**

Define:

```ts
export type LogoTipo = "principal" | "blanco";

export interface LogoConfig {
  tipo: LogoTipo;
  nombre: "Logo_MDUnion.svg" | "Logo_blanco.svg";
  ruta: "/Logo_MDUnion.svg" | "/Logo_blanco.svg";
  personalizado: boolean;
  fecha_modificacion: string | null;
}
```

`updateLogo` sends `FormData` with `logo` and `Content-Type` controlled by Axios. The page uses two reusable cards, `URL.createObjectURL` for local preview and `?v=${Date.now()}` after save.

Set `unoptimized` on `next/image` instances using either canonical logo so requests reach Nginx directly.

- [ ] **Step 5: Run tests, lint and build**

Run:

```bash
npm --prefix front test
npm --prefix front run lint
npm --prefix front run build
```

Expected: all commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add front
git commit -m "feat: administrar identidad visual"
```

---

### Task 5: Eliminar consumo de URL configurable

**Files:**
- Modify: `front/src/components/solicitudes/SolicitudPrintView.tsx`
- Test: `front/src/components/solicitudes/SolicitudPrintView.test.tsx`

**Interfaces:**
- Removes the old `configuracionService.get()` URL dependency.
- Produces verification URLs from `window.location.origin`.

- [ ] **Step 1: Write failing test**

```tsx
render(<SolicitudPrintView solicitud={solicitudFixture} />);
expect(screen.getByText(`${window.location.origin}/verificar/000001`)).toBeInTheDocument();
expect(configuracionService.get).not.toHaveBeenCalled();
```

- [ ] **Step 2: Run test and verify RED**

Run: `npm --prefix front test -- SolicitudPrintView.test.tsx`  
Expected: FAIL because the component still calls configuration and defaults to a fixed IP.

- [ ] **Step 3: Implement runtime origin**

Remove the service import, state and effect. Use:

```ts
const baseUrl = typeof window === "undefined" ? "" : window.location.origin;
```

- [ ] **Step 4: Run Frontend test suite**

Run: `npm --prefix front test && npm --prefix front run lint && npm --prefix front run build`  
Expected: all commands exit 0.

- [ ] **Step 5: Commit**

```bash
git add front/src/components/solicitudes
git commit -m "refactor: derivar origen de constancias"
```

---

### Task 6: Actualizar manuales y eliminar la función anterior

**Files:**
- Modify: `MANUAL_TECNICO.md`
- Modify: `MANUAL_TECNICO.html`
- Modify: `MANUAL_USUARIO.md`
- Modify: `MANUAL_USUARIO.html`
- Modify: `README.md`
- Modify: `docs/manual-usuario/capturas/README.md`

**Interfaces:**
- Documents only identity visual management under Configuración.
- Removes functional references to URL/domain/IP editing.

- [ ] **Step 1: Add documentation assertions that initially fail**

Run:

```bash
rg 'url_verificacion_publica|PUT /url-verificacion|Guardar URL pública|Configuración de URL pública' \
  MANUAL_TECNICO.md MANUAL_TECNICO.html MANUAL_USUARIO.md MANUAL_USUARIO.html
```

Expected: matches exist before editing.

- [ ] **Step 2: Update technical documentation**

Document:

- two canonical names and routes;
- ADMIN-only multipart endpoints;
- NFS directory;
- SVG validation and atomic replacement;
- Nginx fallback and no-cache behavior;
- database keys;
- backup/restore and troubleshooting;
- tests for replacement across all views.

Keep infrastructure IPs and deployment DNS/certificate instructions because they are not user-editable application settings.

- [ ] **Step 3: Update user documentation**

Replace the current Configuración procedure and screenshot caption with:

1. open **Configuración**;
2. identify logo principal or logo blanco;
3. select SVG with exact required name;
4. review preview and replacement warning;
5. press **Reemplazar logo**;
6. refresh affected screens and verify login/menu/prints.

- [ ] **Step 4: Regenerate/synchronize HTML and verify absence**

Run:

```bash
rg 'url_verificacion_publica|PUT /url-verificacion|Guardar URL pública|Configuración de URL pública' \
  MANUAL_TECNICO.md MANUAL_TECNICO.html MANUAL_USUARIO.md MANUAL_USUARIO.html
```

Expected: no matches.

- [ ] **Step 5: Commit**

```bash
git add MANUAL_TECNICO.* MANUAL_USUARIO.* README.md docs/manual-usuario/capturas/README.md
git commit -m "docs: documentar identidad visual configurable"
```

---

### Task 7: Verificación integral

**Files:**
- No new production files.

- [ ] **Step 1: Run all automated checks**

```bash
npm --prefix back test
npm --prefix back run build
npm --prefix front test
npm --prefix front run lint
npm --prefix front run build
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 2: Verify removed functionality**

```bash
rg 'updateUrlVerificacion|putUrlVerificacion|url_verificacion_publica|/url-verificacion' \
  back front MANUAL_TECNICO.md MANUAL_USUARIO.md
```

Expected: no matches.

- [ ] **Step 3: Verify canonical routes remain**

```bash
rg '/Logo_MDUnion.svg|/Logo_blanco.svg' back front deploy nginx
```

Expected: both canonical routes exist in API delivery, Nginx and consumers.

- [ ] **Step 4: Browser acceptance**

As ADMIN:

1. open Configuración and confirm there is no URL/domain/IP field;
2. upload valid `Logo_MDUnion.svg`;
3. verify login, portal, acta and solicitud print;
4. upload valid `Logo_blanco.svg`;
5. verify expanded/collapsed sidebar and header;
6. recreate Backend and Frontend containers;
7. verify both custom logos remain.

- [ ] **Step 5: Final commit if verification produced corrections**

```bash
git add -A
git commit -m "fix: completar verificacion de identidad visual"
```
