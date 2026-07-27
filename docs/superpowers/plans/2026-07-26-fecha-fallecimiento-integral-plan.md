# Fecha de Fallecimiento Integral Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar el manejo opcional de `fecha_fallecimiento` en registro, edición, importación, consultas, impresión y reportes sin afectar inserciones que omiten el campo.

**Architecture:** La validación de fechas se aislará en funciones puras reutilizadas por los servicios y formularios. La Consola de Digitalización validará nuevamente la identidad del acta al enviar para evitar actualizar un registro retenido por el debounce. Los reportes usarán mapeadores puros y fechas sin conversión de zona horaria.

**Tech Stack:** Node.js 20, Express 5, PostgreSQL 15, Next.js 16, React 19, TypeScript 5, Zod 4, node:test, Vitest y XLSX.

## Global Constraints

- `fecha_fallecimiento` es opcional en toda inserción.
- Fallecimiento no puede ser anterior a nacimiento cuando ambas fechas existen.
- Campo omitido en una actualización conserva el valor; `null` lo elimina.
- Producción ya tiene la columna: la migración debe usar `ADD COLUMN IF NOT EXISTS`.
- No agregar filtros, estados, métricas ni datos públicos nuevos.
- No agregar fecha de fallecimiento a Solicitudes ni Auditoría.
- Crear solo pruebas dirigidas a comportamientos críticos.
- No ejecutar builds intermedios.
- Ejecutar una sola vez los builds de Frontend y Backend al finalizar.
- Regenerar manuales sin verificación visual.

---

### Task 1: Esquema reproducible y validación de fechas

**Files:**
- Create: `back/src/migrations/008_fecha_fallecimiento.sql`
- Modify: `back/src/migrations/000_schema.sql`
- Create: `back/src/services/persona-fechas.service.js`
- Create: `back/test/persona-fechas.test.js`
- Modify: `back/src/routes/personas.routes.js`
- Modify: `back/src/config/swagger.js`

**Interfaces:**
- Produces: `resolverFechasPersona(actual, cambios) -> { fecha_nacimiento, fecha_fallecimiento }`.
- Produces: `FechaPersonaValidationError`.
- Consumes: valores `string | null | undefined`.

- [ ] **Step 1: Write focused failing tests**

```javascript
test("permite insertar sin fecha de fallecimiento", () => {
    assert.deepEqual(resolverFechasPersona(null, {
        fecha_nacimiento: "1990-01-01",
    }), {
        fecha_nacimiento: "1990-01-01",
        fecha_fallecimiento: null,
    });
});

test("permite eliminar fallecimiento con null", () => {
    assert.equal(resolverFechasPersona({
        fecha_nacimiento: "1990-01-01",
        fecha_fallecimiento: "2020-01-01",
    }, {
        fecha_fallecimiento: null,
    }).fecha_fallecimiento, null);
});

test("rechaza fallecimiento anterior al nacimiento", () => {
    assert.throws(() => resolverFechasPersona(null, {
        fecha_nacimiento: "2000-01-01",
        fecha_fallecimiento: "1999-12-31",
    }), /no puede ser anterior/);
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npm --prefix back test -- --test-name-pattern="fecha de fallecimiento|fallecimiento anterior|insertar sin"
```

Expected: FAIL because `persona-fechas.service.js` does not exist.

- [ ] **Step 3: Implement the pure date resolver**

```javascript
const tiene = (objeto, campo) =>
    Object.prototype.hasOwnProperty.call(objeto, campo);

export class FechaPersonaValidationError extends Error {}

export const resolverFechasPersona = (actual, cambios) => {
    const fecha_nacimiento = tiene(cambios, "fecha_nacimiento")
        ? cambios.fecha_nacimiento || null
        : actual?.fecha_nacimiento || null;
    const fecha_fallecimiento = tiene(cambios, "fecha_fallecimiento")
        ? cambios.fecha_fallecimiento || null
        : actual?.fecha_fallecimiento || null;

    if (fecha_nacimiento && fecha_fallecimiento
        && fecha_fallecimiento < fecha_nacimiento) {
        throw new FechaPersonaValidationError(
            "La fecha de fallecimiento no puede ser anterior a la fecha de nacimiento.",
        );
    }

    return { fecha_nacimiento, fecha_fallecimiento };
};
```

Reject non-ISO dates before comparison using a strict `YYYY-MM-DD` round-trip check.

- [ ] **Step 4: Add the idempotent migration**

```sql
ALTER TABLE personas
ADD COLUMN IF NOT EXISTS fecha_fallecimiento DATE;
```

Also add `fecha_fallecimiento DATE` after `fecha_nacimiento` in `000_schema.sql`.

- [ ] **Step 5: Complete HTTP and Swagger validation**

Add an optional nullable `fecha_fallecimiento` rule with `isDate({ format: "YYYY-MM-DD", strictMode: true })`. Declare both person dates as nullable date strings in Swagger.

- [ ] **Step 6: Run the focused test**

Run:

```bash
npm --prefix back test -- --test-name-pattern="fecha de fallecimiento|fallecimiento anterior|insertar sin"
```

Expected: all date-resolver tests PASS.

---

### Task 2: Inserción y edición Backend

**Files:**
- Modify: `back/src/services/personas.service.js`
- Create: `back/test/personas-fecha-fallecimiento.test.js`
- Modify: `back/src/controllers/personas.controller.js`

**Interfaces:**
- Consumes: `resolverFechasPersona`.
- Produces: `crearPersona(datos, usuarioId, db = pool)`.
- Produces: `actualizarPersona(id, datos, db = pool)`.

- [ ] **Step 1: Write insertion and update tests with a fake database**

The fake database must capture SQL and parameters and return the inserted or existing person. Cover:

```javascript
test("INSERT funciona cuando fecha_fallecimiento está omitida", async () => {
    const db = crearDbPersona();
    await crearPersona(datosMinimos, 7, db);
    const insert = db.consultas.find(({ sql }) => /INSERT INTO personas/.test(sql));
    assert.equal(insert.params[7], null);
});

test("UPDATE conserva fecha omitida y elimina null explícito", async () => {
    // First call with no fecha_fallecimiento preserves 2020-01-01.
    // Second call with fecha_fallecimiento: null writes null.
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npm --prefix back test -- --test-name-pattern="INSERT funciona|UPDATE conserva"
```

Expected: FAIL because the service does not accept injected `db` and cannot clear the date.

- [ ] **Step 3: Inject the database without changing controller calls**

Change internal functions to accept `db = pool`, including document-type resolution and person lookup. Existing two-argument calls remain compatible.

- [ ] **Step 4: Resolve final dates before SQL**

For create, call `resolverFechasPersona(null, datos)`. For update:

1. load the existing person;
2. return `null` if it does not exist;
3. call `resolverFechasPersona(actual, datos)`;
4. write both resolved dates directly, without `COALESCE`.

Map `FechaPersonaValidationError` to HTTP 400 in create and update controllers; unexpected errors remain 500.

- [ ] **Step 5: Run focused Backend tests**

Run:

```bash
npm --prefix back test -- --test-name-pattern="INSERT funciona|UPDATE conserva|fecha de fallecimiento|fallecimiento anterior"
```

Expected: PASS.

---

### Task 3: Importación por DNI y fechas opcionales

**Files:**
- Create: `back/src/services/importacion-personas.service.js`
- Modify: `back/src/services/importacion.service.js`
- Create: `back/test/importacion-fecha-fallecimiento.test.js`

**Interfaces:**
- Produces: `actualizarPersonaImportada(client, personaId, datos)`.
- Produces: `validarFechaImportada(valor, nombreCampo)`.
- Consumes: `resolverFechasPersona`.

- [ ] **Step 1: Write the exact-DNI failing test**

Use a fake client whose first person lookup returns:

```javascript
{ id: 31, dni: "12345678", fecha_nacimiento: "1950-01-01", fecha_fallecimiento: null }
```

Assert that importing a row with the same DNI and `fecha_fallecimiento: "2020-04-03"` executes:

```sql
UPDATE personas SET ... fecha_fallecimiento ...
```

with person ID `31`.

- [ ] **Step 2: Verify RED**

Run:

```bash
npm --prefix back test -- --test-name-pattern="DNI actualiza fecha de fallecimiento"
```

Expected: FAIL because the current exact-DNI path skips date updates.

- [ ] **Step 3: Centralize imported-person updates**

Move date update to `actualizarPersonaImportada` and call it once whenever `personaId` was found, regardless of whether matching happened by DNI or names. Keep empty imported dates non-destructive.

- [ ] **Step 4: Reject a supplied but unrecognized date**

`validarFechaImportada` must distinguish:

- empty value: returns `null`;
- recognized Excel/ISO/date value: returns normalized ISO;
- non-empty unrecognized value: throws `fecha_fallecimiento inválida`.

Apply the same rule to titular and cónyuge.

- [ ] **Step 5: Run the import test**

Run:

```bash
npm --prefix back test -- --test-name-pattern="DNI actualiza fecha de fallecimiento|fecha importada inválida"
```

Expected: PASS.

---

### Task 4: Consola de Digitalización segura

**Files:**
- Create: `front/src/lib/persona-fechas.ts`
- Create: `front/src/lib/digitalizacion-acta.ts`
- Create: `front/src/lib/fecha-fallecimiento.test.ts`
- Modify: `front/src/app/(dashboard)/dashboard/digitalizacion/page.tsx`
- Modify: `front/src/types/persona.ts`

**Interfaces:**
- Produces: `validarOrdenFechas(nacimiento?: string, fallecimiento?: string)`.
- Produces: `construirIdentidadActa(valores) -> string`.
- Produces: `actaCoincideConIdentidad(acta, identidad, anio) -> boolean`.

- [ ] **Step 1: Write critical frontend tests**

```typescript
test("fallecimiento vacío es válido", () => {
    expect(validarOrdenFechas("1990-01-01", "")).toBe(true);
});

test("detecta un acta retenida con identidad diferente", () => {
    expect(actaCoincideConIdentidad(
        { numero_acta: "NAC-L1-10", anio: 2026 },
        "NAC-L1-11",
        2026,
    )).toBe(false);
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npm --prefix front test -- src/lib/fecha-fallecimiento.test.ts
```

Expected: FAIL because the helper modules do not exist.

- [ ] **Step 3: Add Zod cross-field validation**

Use `.superRefine` for titular and cónyuge. Add an issue on `fecha_fallecimiento` or `conyuge_fecha_fallecimiento` only when both dates exist and death is earlier.

- [ ] **Step 4: Invalidate stale acta identity immediately**

For changes to mode, type, book and act number:

```typescript
const cambiarIdentidadActa = (actualizar: () => void) => {
    setActaEncontrada(null);
    actualizar();
};
```

At submission, update only if `actaCoincideConIdentidad(...)` returns true; otherwise create and let Backend duplicate validation decide.

- [ ] **Step 5: Preserve optional insertion**

New-person requests send:

```typescript
fecha_fallecimiento: values.fecha_fallecimiento || undefined
```

Existing-person requests send `null` only when the loaded person had a date and the user cleared it.

- [ ] **Step 6: Run the focused frontend test**

Run:

```bash
npm --prefix front test -- src/lib/fecha-fallecimiento.test.ts
```

Expected: PASS.

---

### Task 5: Persona edit, list, details and print

**Files:**
- Modify: `front/src/components/personas/PersonaSheet.tsx`
- Modify: `front/src/components/personas/PersonasTable.tsx`
- Modify: `front/src/components/actas/ActaPrintView.tsx`
- Verify: `front/src/components/actas/ActaDetailSheet.tsx`

**Interfaces:**
- Consumes: `validarOrdenFechas`.
- Produces: edit payload with `fecha_fallecimiento: string | null | undefined`.

- [ ] **Step 1: Validate PersonaSheet chronology**

Use the shared date validator in the form schema. Keep an empty date valid.

- [ ] **Step 2: Send explicit null only on edit**

```typescript
fecha_fallecimiento: persona
    ? values.fecha_fallecimiento || null
    : values.fecha_fallecimiento || undefined
```

- [ ] **Step 3: Display both dates in Personas**

Replace the single birth column with **Fechas** and show:

- `Nac.: {fecha}`;
- `Fall.: {fecha}` only when present.

Keep existing table actions and pagination unchanged.

- [ ] **Step 4: Add conditional death dates to ActaPrintView**

Show titular and spouse death date only when the corresponding value exists. Use `dateUtils.formatDisplayDate` to avoid UTC day shifts.

- [ ] **Step 5: Review ActaDetailSheet**

Confirm its existing conditional fields use `dateUtils.formatDisplayDate`; change only if a mismatch is found.

---

### Task 6: Excel reports

**Files:**
- Modify: `back/src/services/export.service.js`
- Create: `back/test/export-fecha-fallecimiento.test.js`

**Interfaces:**
- Produces: `formatearFechaExcel(fecha)`.
- Produces: `mapearPersonaExcel(persona)`.
- Produces: `mapearActaExcel(acta)`.

- [ ] **Step 1: Write mapper tests**

Assert:

- person without death date exports an empty **Fecha Fallecimiento**;
- person with death date exports `03/04/2020`;
- acta exports titular birth/death;
- marriage exports spouse birth/death.

- [ ] **Step 2: Verify RED**

Run:

```bash
npm --prefix back test -- --test-name-pattern="Excel.*fallecimiento"
```

Expected: FAIL because the columns and mappers do not exist.

- [ ] **Step 3: Implement timezone-stable mappings**

Split the date at `T`, parse `YYYY-MM-DD` components and return `DD/MM/YYYY`. Do not call `new Date(dateOnly).toLocaleDateString()`.

Add:

- Personas: **Fecha Nac.**, **Fecha Fallecimiento**;
- Actas titular: **Fecha Nac. Titular**, **Fecha Fallecimiento Titular**;
- Matrimonios: **Fecha Nac. Cónyuge**, **Fecha Fallecimiento Cónyuge**.

- [ ] **Step 4: Run report tests**

Run:

```bash
npm --prefix back test -- --test-name-pattern="Excel.*fallecimiento"
```

Expected: PASS.

---

### Task 7: Installation and manuals

**Files:**
- Modify: `README.md`
- Modify: `deploy/README.md`
- Modify: `MANUAL_TECNICO.md`
- Modify: `MANUAL_USUARIO.md`
- Modify: `scripts/regenerate_manuals.py` only if regeneration requires it
- Generate: `MANUAL_TECNICO.html`
- Generate: `MANUAL_USUARIO.html`

**Interfaces:**
- Consumes: migration range `000–008` and final behavior.
- Produces: synchronized Markdown and HTML manuals.

- [ ] **Step 1: Update migration ranges and commands**

Replace `000–007` and `00{0..7}` references with `000–008` and `00{0..8}`. Add `008_fecha_fallecimiento.sql` to explicit command lists.

- [ ] **Step 2: Document the functional behavior**

State that the field:

- is optional during registration and import;
- can be modified or cleared in Persona editing;
- cannot precede birth;
- appears in Persons/Actas Excel and Acta print when relevant.

- [ ] **Step 3: Regenerate manuals without browser verification**

Run:

```bash
python3 scripts/regenerate_manuals.py
```

- [ ] **Step 4: Check generated consistency**

Run:

```bash
git diff --check
rg "008_fecha_fallecimiento|Fecha de fallecimiento" README.md deploy/README.md MANUAL_TECNICO.md MANUAL_USUARIO.md
```

Expected: no whitespace errors and all canonical documentation mentions exist.

---

### Task 8: Final targeted verification and single build

**Files:**
- Verify all modified files.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: final release evidence.

- [ ] **Step 1: Run only the focused tests**

```bash
npm --prefix back test -- --test-name-pattern="fecha|fallecimiento|Excel"
npm --prefix front test -- src/lib/fecha-fallecimiento.test.ts
```

- [ ] **Step 2: Check changed-file lint**

Run ESLint only over modified frontend `.ts` and `.tsx` paths. Fix only errors introduced or exposed in those files.

- [ ] **Step 3: Run both builds once**

```bash
npm --prefix back run build
npm --prefix front run build
```

Expected: both exit 0. Do not rerun unless a build failure requires a fix.

- [ ] **Step 4: Review repository state**

```bash
git diff --check
git status --short
```

Expected: no generated caches or unrelated files.

- [ ] **Step 5: Commit implementation**

```bash
git add back front README.md deploy/README.md \
  MANUAL_TECNICO.md MANUAL_TECNICO.html \
  MANUAL_USUARIO.md MANUAL_USUARIO.html \
  docs/superpowers/plans/2026-07-26-fecha-fallecimiento-integral-plan.md
git commit -m "feat: completar fecha de fallecimiento"
```
