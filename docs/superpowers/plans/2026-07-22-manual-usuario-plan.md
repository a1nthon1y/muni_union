# Manual de Usuario Didáctico Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Actualizar el Manual de Usuario para que el personal municipal pueda operar el sistema e importar archivos históricos sin instrucciones técnicas ambiguas.

**Architecture:** `MANUAL_USUARIO.md` será la fuente textual completa y precisa. `MANUAL_USUARIO.html` reproducirá el mismo contenido con una jerarquía visual apta para impresión A4/PDF, saltos de página razonables y avisos de operación.

**Tech Stack:** Markdown, HTML5, CSS de impresión.

## Global Constraints

- Documentar solo comportamientos confirmados por la aplicación actual.
- Usar español claro, pasos numerados y términos visibles en la interfaz.
- No incluir credenciales, rutas de servidor ni instrucciones de administración técnica.
- Explicar que las coincidencias de ciudadanos sin DNI requieren revisión y que la regla automática se corregirá antes de nuevas cargas históricas.
- Mantener el contenido funcional equivalente en Markdown y HTML.

---

### Task 1: Reescribir la guía de operaciones del usuario

**Files:**
- Modify: `MANUAL_USUARIO.md`

**Interfaces:**
- Consumes: flujos visibles del frontend y validaciones confirmadas del backend.
- Produces: guía operativa lista para personal municipal.

- [ ] **Step 1: Reemplazar el contenido con una estructura orientada a tareas**

Incluir: acceso, navegación, consulta de actas, registro manual, digitalización, personas, trámites, importación masiva, resultados de importación, errores frecuentes, seguridad y soporte.

- [ ] **Step 2: Documentar importación masiva con reglas verificadas**

Especificar `.xlsx`/`.xls`, ZIP opcional, relación `nombre_archivo_pdf`/`carpeta_ruta`, `fecha_acta`, sexo `M`/`F`, comportamiento de `OK`, `OMITIDO`, `OMITIDO_DOC`, `ERROR`, límite de 30.000 filas y espera de hasta 10 minutos.

- [ ] **Step 3: Revisar precisión**

Verificar que no se mencione CSV, límite de 25 MB para digitalización, auto-fusión segura de ciudadanos sin DNI ni afirmaciones de rendimiento no demostradas.

### Task 2: Preparar la versión imprimible

**Files:**
- Modify: `MANUAL_USUARIO.html`

**Interfaces:**
- Consumes: la estructura y el texto final de `MANUAL_USUARIO.md`.
- Produces: manual HTML coherente y apto para Guardar como PDF.

- [ ] **Step 1: Actualizar índice y secciones**

Replicar el contenido operativo del Markdown y conservar anclas navegables.

- [ ] **Step 2: Incorporar estilos de impresión**

Usar `@page` A4, encabezado y pie institucionales, bloques de advertencia legibles en escala de grises y evitar cortar pasos numerados o tablas entre páginas.

- [ ] **Step 3: Verificar impresión**

Abrir el HTML en navegador, usar vista previa de impresión y comprobar que el índice, encabezados, avisos y listas se imprimen completos.

### Task 3: Revisión editorial final

**Files:**
- Modify: `MANUAL_USUARIO.md`
- Modify: `MANUAL_USUARIO.html`

**Interfaces:**
- Consumes: ambas versiones actualizadas.
- Produces: manual consistente listo para revisión municipal.

- [ ] **Step 1: Comparar secciones clave**

Confirmar que ambos documentos incluyan los mismos límites, extensiones aceptadas, estados de importación y advertencias.

- [ ] **Step 2: Revisar lenguaje**

Eliminar jerga técnica no necesaria y asegurar que cada instrucción indique dónde hacer clic y qué resultado esperar.

- [ ] **Step 3: Commit**

```bash
git add MANUAL_USUARIO.md MANUAL_USUARIO.html docs/superpowers/plans/2026-07-22-manual-usuario-plan.md
git commit -m "docs: actualizar manual de usuario para operaciones e importación"
```
