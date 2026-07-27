# Búsqueda de actas y detalle de persona Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hacer visible y progresiva la búsqueda de actas por ciudadano y mostrar, desde Detalles de Personas, todas las actas vinculadas por ID.

**Architecture:** El backend ampliará el constructor único de filtros de actas con búsqueda por términos y `persona_id`. El frontend reorganizará los filtros de Actas y añadirá un `PersonaDetailSheet` de solo lectura que reutiliza `GET /api/actas`, evitando un endpoint duplicado.

**Tech Stack:** Express 5, PostgreSQL, Node Test Runner, Next.js 16, React 19, TypeScript, Tailwind CSS 4, Radix UI, Vitest y Testing Library.

## Global Constraints

- No incorporar vinculación manual desde Personas.
- Consultar actas de una persona por ID interno, no por nombre o DNI.
- Buscar cada término de `q` de forma independiente, combinándolos con `AND`.
- Incluir titular y cónyuge en búsquedas y vínculos.
- Mantener visibles las actas anuladas con su estado.
- Conservar los componentes y tokens visuales existentes.
- Mantener accesibilidad de teclado y comportamiento responsive.

---

## Estructura de archivos

- `back/src/services/actas-filtros.js`: única construcción de condiciones SQL para actas.
- `back/test/actas-filtros.test.js`: regresiones de búsqueda progresiva y filtro exacto por persona.
- `front/src/services/actas.service.ts`: contrato de `persona_id`.
- `front/src/components/actas/ActasTable.tsx`: presentación responsive de búsqueda y filtros.
- `front/src/components/actas/ActasTable.test.tsx`: interacción del buscador y limpieza.
- `front/src/components/personas/PersonaDetailSheet.tsx`: detalle de solo lectura y cronología de actas.
- `front/src/components/personas/PersonaDetailSheet.test.tsx`: carga, vínculo y estados del detalle.
- `front/src/components/personas/PersonasTable.tsx`: acción Ver detalles.
- `front/src/app/(dashboard)/dashboard/personas/page.tsx`: estado y apertura del panel.
- `MANUAL_USUARIO.md` y `MANUAL_USUARIO.html`: instrucciones operativas.

### Task 1: Filtros progresivos y exactos del backend

**Files:**
- Modify: `back/src/services/actas-filtros.js`
- Test: `back/test/actas-filtros.test.js`

**Interfaces:**
- Consumes: `construirFiltrosActas(filtros: object)`.
- Produces: soporte para `q` tokenizado y `persona_id` numérico.

- [ ] **Step 1: Escribir pruebas que fallen**

Agregar:

```js
test("cada palabra del ciudadano se busca de forma independiente", () => {
    const { clausulas, params } = construirFiltrosActas({
        q: "  QUISPE   RAMOS juan ",
    });

    assert.deepEqual(params, ["%QUISPE%", "%RAMOS%", "%juan%"]);
    assert.equal(clausulas.length, 3);
    assert.match(clausulas[0], /p\.apellido_paterno/);
    assert.match(clausulas[0], /p2\.apellido_paterno/);
});

test("persona_id incluye titular y cónyuge por ID exacto", () => {
    const { clausulas, params } = construirFiltrosActas({ persona_id: "42" });

    assert.deepEqual(params, [42]);
    assert.deepEqual(clausulas, [
        "(a.persona_principal_id = $1 OR a.persona_secundaria_id = $1)",
    ]);
});

test("persona_id inválido no agrega un filtro", () => {
    const { clausulas, params } = construirFiltrosActas({ persona_id: "abc" });
    assert.deepEqual({ clausulas, params }, { clausulas: [], params: [] });
});
```

- [ ] **Step 2: Verificar RED**

Run:

```bash
cd back && node --test test/actas-filtros.test.js
```

Expected: las pruebas nuevas fallan porque `q` aún genera una sola cláusula y `persona_id` no existe.

- [ ] **Step 3: Implementar el filtro mínimo**

Cambiar la extracción y construcción:

```js
const {
    q, tipo, anio, dni, numero, libro,
    fecha_desde, fecha_hasta, persona_id,
} = filtros;

const terminos = q?.trim().split(/\s+/).filter(Boolean) ?? [];
for (const termino of terminos) {
    const placeholder = agregarParametro(params, `%${termino}%`);
    clausulas.push(`(
        concat_ws(' ', p.apellido_paterno, p.apellido_materno, p.nombres) ILIKE ${placeholder}
        OR concat_ws(' ', p2.apellido_paterno, p2.apellido_materno, p2.nombres) ILIKE ${placeholder}
        OR COALESCE(p.dni, '') ILIKE ${placeholder}
        OR COALESCE(p2.dni, '') ILIKE ${placeholder}
    )`);
}

const personaId = Number.parseInt(persona_id, 10);
if (Number.isInteger(personaId) && personaId > 0) {
    const placeholder = agregarParametro(params, personaId);
    clausulas.push(
        `(a.persona_principal_id = ${placeholder} OR a.persona_secundaria_id = ${placeholder})`,
    );
}
```

- [ ] **Step 4: Verificar GREEN y regresiones**

Run:

```bash
cd back && node --test test/actas-filtros.test.js && npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add back/src/services/actas-filtros.js back/test/actas-filtros.test.js
git commit -m "feat: buscar actas por términos y persona"
```

### Task 2: Buscador ciudadano visible en Registro de Actas

**Files:**
- Modify: `front/src/services/actas.service.ts`
- Modify: `front/src/components/actas/ActasTable.tsx`
- Test: `front/src/components/actas/ActasTable.test.tsx`

**Interfaces:**
- Consumes: `onSearch(filtros: Partial<ActasFilters>)`.
- Produces: `ActasFilters.persona_id?: number | string` y filtros organizados en dos niveles.

- [ ] **Step 1: Escribir prueba de interacción que falle**

Crear una prueba que renderice `ActasTable` con props mínimas:

```tsx
test("mantiene visible el buscador ciudadano y envía q", async () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    render(<ActasTable {...propsBase} onSearch={onSearch} />);

    const input = screen.getByRole("textbox", {
        name: "Buscar actas por ciudadano",
    });
    expect(input).toHaveAttribute(
        "placeholder",
        "DNI, primer apellido, segundo apellido o nombres",
    );

    fireEvent.change(input, { target: { value: "QUISPE RAMOS" } });
    await vi.advanceTimersByTimeAsync(500);
    expect(onSearch).toHaveBeenCalledWith({ q: "QUISPE RAMOS" });
    vi.useRealTimers();
});

test("limpiar restablece todos los filtros", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<ActasTable {...propsBase} onSearch={onSearch} />);

    await user.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(screen.getByRole("textbox", {
        name: "Buscar actas por ciudadano",
    })).toHaveValue("");
});
```

- [ ] **Step 2: Verificar RED**

Run:

```bash
cd front && npm test -- src/components/actas/ActasTable.test.tsx
```

Expected: FAIL porque no existen los nombres accesibles ni el nuevo layout.

- [ ] **Step 3: Añadir contrato y layout responsive**

En `ActasFilters`:

```ts
persona_id?: number | string;
```

En `ActasTable`, separar:

```tsx
<section aria-label="Búsqueda por ciudadano" className="rounded-2xl border bg-card p-4">
    <label htmlFor="actas-ciudadano" className="mb-2 block text-xs font-semibold">
        Buscar por ciudadano
    </label>
    <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
            id="actas-ciudadano"
            aria-label="Buscar actas por ciudadano"
            placeholder="DNI, primer apellido, segundo apellido o nombres"
            className="h-12 pl-10"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
        />
    </div>
</section>
```

Colocar código, libro, año, tipo y fechas en:

```tsx
<section
    aria-label="Filtros del registro"
    className="grid grid-cols-1 gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 xl:grid-cols-7"
>
    {/* controles registrales existentes */}
</section>
```

Añadir al botón de limpieza `aria-label="Limpiar filtros"` y conservar el restablecimiento de todos los estados.

- [ ] **Step 4: Verificar GREEN, lint y responsive**

Run:

```bash
cd front
npm test -- src/components/actas/ActasTable.test.tsx
npx eslint src/components/actas/ActasTable.tsx src/components/actas/ActasTable.test.tsx src/services/actas.service.ts
```

Expected: PASS sin errores.

- [ ] **Step 5: Commit**

```bash
git add front/src/services/actas.service.ts front/src/components/actas/ActasTable.tsx front/src/components/actas/ActasTable.test.tsx
git commit -m "feat: priorizar búsqueda ciudadana en actas"
```

### Task 3: Detalles de persona con actas vinculadas

**Files:**
- Create: `front/src/components/personas/PersonaDetailSheet.tsx`
- Create: `front/src/components/personas/PersonaDetailSheet.test.tsx`
- Modify: `front/src/components/personas/PersonasTable.tsx`
- Modify: `front/src/app/(dashboard)/dashboard/personas/page.tsx`

**Interfaces:**
- Consumes: `persona: Persona | null`, `actasService.getAll({ persona_id, page, limit })`.
- Produces: `PersonaDetailSheet({ isOpen, onClose, persona })` y `PersonasTable.onView`.

- [ ] **Step 1: Escribir pruebas del detalle que fallen**

Mockear `actasService.getAll` y verificar:

```tsx
test("consulta actas por ID y muestra la participación", async () => {
    getAll.mockResolvedValue({
        data: [{
            id: 7,
            tipo_acta: "MATRIMONIO",
            numero_acta: "MAT-L2-14",
            anio: 2024,
            fecha_acta: "2024-03-10",
            estado: "ACTIVO",
            persona_principal_id: 12,
            persona_secundaria_id: 42,
            fecha_registro: "2024-03-10",
            tiene_documento: true,
        }],
        pagination: { total: 1, page: 1, limit: 50, totalPages: 1 },
    });

    render(
        <PersonaDetailSheet
            isOpen
            onClose={vi.fn()}
            persona={{ ...personaBase, id: 42 }}
        />,
    );

    expect(await screen.findByText("MAT-L2-14")).toBeInTheDocument();
    expect(screen.getByText("Cónyuge")).toBeInTheDocument();
    expect(getAll).toHaveBeenCalledWith({
        persona_id: 42,
        page: 1,
        limit: 50,
    });
});

test("explica cuando la persona no tiene actas", async () => {
    getAll.mockResolvedValue({
        data: [],
        pagination: { total: 0, page: 1, limit: 50, totalPages: 0 },
    });
    render(<PersonaDetailSheet isOpen onClose={vi.fn()} persona={personaBase} />);
    expect(await screen.findByText(
        "Este ciudadano no tiene actas vinculadas",
    )).toBeInTheDocument();
});
```

Añadir en la prueba de `PersonasTable`:

```tsx
await user.click(screen.getByRole("button", { name: "Opciones de ciudadano" }));
await user.click(screen.getByRole("menuitem", { name: /Ver detalles/i }));
expect(onView).toHaveBeenCalledWith(personaBase);
```

- [ ] **Step 2: Verificar RED**

Run:

```bash
cd front && npm test -- src/components/personas/PersonaDetailSheet.test.tsx src/components/personas/PersonasTable.test.tsx
```

Expected: FAIL porque el componente y la acción aún no existen.

- [ ] **Step 3: Implementar `PersonaDetailSheet`**

Crear un panel `sm:max-w-xl` con cabecera de identidad, datos personales y sección cronológica. Al abrir:

```tsx
const cargarActas = useCallback(async () => {
    if (!persona) return;
    setLoading(true);
    setError(false);
    try {
        const response = await actasService.getAll({
            persona_id: persona.id,
            page: 1,
            limit: 50,
        });
        setActas(response.data);
        setTotal(response.pagination.total);
    } catch {
        setError(true);
    } finally {
        setLoading(false);
    }
}, [persona]);
```

Determinar participación:

```ts
const participacion = (acta: Acta) =>
    acta.persona_principal_id === persona.id ? "Titular" : "Cónyuge";
```

Acciones:

```tsx
<Button onClick={() => window.open(`/print/acta/${acta.id}`, "_blank")}>
    Imprimir
</Button>
{acta.tiene_documento && acta.ruta_archivo && (
    <Button variant="outline" onClick={() => window.open(getFileUrl(acta.ruta_archivo), "_blank")}>
        Ver documento
    </Button>
)}
```

Para **Ver acta**, navegar a:

```ts
router.push(`/dashboard/actas?persona_id=${persona.id}&acta_id=${acta.id}`);
```

- [ ] **Step 4: Conectar Personas**

En `PersonasTableProps` agregar:

```ts
onView: (persona: Persona) => void;
```

Añadir nombre accesible al disparador y la opción:

```tsx
<Button aria-label="Opciones de ciudadano" variant="ghost">
    <MoreHorizontal />
</Button>
<DropdownMenuItem onClick={() => onView(persona)}>
    <Eye className="h-4 w-4" /> Ver detalles
</DropdownMenuItem>
```

En la página mantener `detailPersona` e `isDetailOpen`, pasar `onView` y renderizar `PersonaDetailSheet`. Mantener Editar como flujo separado.

- [ ] **Step 5: Verificar GREEN, lint y build**

Run:

```bash
cd front
npm test -- src/components/personas/PersonaDetailSheet.test.tsx src/components/personas/PersonasTable.test.tsx
npx eslint src/components/personas/PersonaDetailSheet.tsx src/components/personas/PersonaDetailSheet.test.tsx src/components/personas/PersonasTable.tsx 'src/app/(dashboard)/dashboard/personas/page.tsx'
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add front/src/components/personas/PersonaDetailSheet.tsx front/src/components/personas/PersonaDetailSheet.test.tsx front/src/components/personas/PersonasTable.tsx 'front/src/app/(dashboard)/dashboard/personas/page.tsx'
git commit -m "feat: mostrar actas en detalles del ciudadano"
```

### Task 4: Navegación exacta desde Personas hacia Actas

**Files:**
- Modify: `front/src/app/(dashboard)/dashboard/actas/page.tsx`
- Test: `front/src/app/(dashboard)/dashboard/actas/page.test.tsx`

**Interfaces:**
- Consumes: parámetros `persona_id` y `acta_id`.
- Produces: listado filtrado exactamente y apertura opcional del detalle solicitado.

- [ ] **Step 1: Escribir prueba de URL que falle**

Mockear `useSearchParams` con `persona_id=42&acta_id=7`, `actasService.getAll` y verificar:

```tsx
expect(getAll).toHaveBeenCalledWith(expect.objectContaining({
    persona_id: 42,
}));
expect(await screen.findByText(/Acta N° MAT-L2-14/i)).toBeInTheDocument();
```

- [ ] **Step 2: Verificar RED**

Run:

```bash
cd front && npm test -- 'src/app/(dashboard)/dashboard/actas/page.test.tsx'
```

Expected: FAIL porque la página no lee parámetros.

- [ ] **Step 3: Implementar lectura y apertura**

Usar `useSearchParams()` para inicializar `filtros.persona_id`. Después de cargar resultados, abrir `ActaDetailSheet` cuando `acta_id` coincida. Evitar reaperturas con un `useRef`.

- [ ] **Step 4: Verificar GREEN**

Run:

```bash
cd front
npm test -- 'src/app/(dashboard)/dashboard/actas/page.test.tsx'
npx eslint 'src/app/(dashboard)/dashboard/actas/page.tsx' 'src/app/(dashboard)/dashboard/actas/page.test.tsx'
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add 'front/src/app/(dashboard)/dashboard/actas/page.tsx' 'front/src/app/(dashboard)/dashboard/actas/page.test.tsx'
git commit -m "feat: abrir actas filtradas desde personas"
```

### Task 5: Manual y verificación integral

**Files:**
- Modify: `MANUAL_USUARIO.md`
- Modify: `MANUAL_USUARIO.html`

**Interfaces:**
- Consumes: comportamiento final verificado.
- Produces: instrucciones operativas consistentes con la UI.

- [ ] **Step 1: Actualizar el manual**

En §4.2 explicar la búsqueda progresiva y los dos niveles de filtros. En §4.3 documentar `⋮ → Ver detalles → Actas vinculadas`, aclarando que Personas solo consulta relaciones existentes.

- [ ] **Step 2: Regenerar HTML**

Run:

```bash
python3 scripts/regenerate_manuals.py
```

- [ ] **Step 3: Ejecutar verificación final**

Run:

```bash
cd back && npm test && npm run build
cd ../front && npm test && npm run lint && npm run build
cd .. && python3 -m unittest scripts/test_regenerate_manuals.py
```

Expected: todas las pruebas, lint y builds terminan con código 0.

- [ ] **Step 4: Revisar cambios**

Confirmar:

- el buscador ciudadano nunca queda comprimido;
- funciona progresivamente con titular y cónyuge;
- Detalles de Personas carga exclusivamente por ID;
- los estados carga/vacío/error son comprensibles;
- las actas anuladas siguen visibles;
- no se agregó vinculación manual.

- [ ] **Step 5: Commit**

```bash
git add MANUAL_USUARIO.md MANUAL_USUARIO.html
git commit -m "docs: explicar búsqueda y actas vinculadas"
```
