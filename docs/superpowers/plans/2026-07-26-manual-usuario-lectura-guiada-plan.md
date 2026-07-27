# Manual de Usuario con Lectura Guiada Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir el Manual de Usuario en una guía operativa explícita para personas con poca experiencia digital, cubriendo acceso, filtros, importación y recuperación ante fallos.

**Architecture:** `MANUAL_USUARIO.md` seguirá siendo la fuente oficial y `scripts/regenerate_manuals.py` generará el HTML imprimible. Las capturas complementarias utilizarán sufijos alfabéticos sin renombrar las figuras existentes.

**Tech Stack:** Markdown, HTML5, Pandoc 3, Python 3 `unittest` y expresiones regulares.

## Global Constraints

- No modificar Frontend, Backend, base de datos ni despliegue.
- No cambiar tamaño de letra ni diseño general del HTML.
- Usar exactamente los nombres visibles de botones, campos, estados y mensajes.
- Mantener las rutas existentes de capturas.
- Documentar el salto del certificado sin solicitar asistencia técnica.
- Permitir continuar únicamente cuando la dirección sea `https://172.16.3.21`.
- Omitir verificación visual; realizar pruebas automáticas y revisión técnica del contenido.

---

### Task 1: Figuras complementarias con sufijos

**Files:**
- Create: `scripts/test_regenerate_manuals.py`
- Modify: `scripts/regenerate_manuals.py`

**Interfaces:**
- Consumes: bloque Markdown convertido por Pandoc con `Figura 2.1-A`.
- Produces: `id="figura-2-1a"` y ruta `docs/manual-usuario/capturas/figura-2-1a.png`.

- [ ] **Step 1: Write the failing test**

```python
import unittest
from scripts.regenerate_manuals import convertir_capturas


class CapturasComplementariasTest(unittest.TestCase):
    def test_convierte_sufijo_alfabetico_en_ruta_estable(self):
        entrada = (
            "<blockquote><p><strong>Captura pendiente — Figura 2.1-A.</strong> "
            "Advertencia del navegador.</p></blockquote>"
        )
        salida = convertir_capturas(entrada)
        self.assertIn('id="figura-2-1a"', salida)
        self.assertIn("figura-2-1a.png", salida)
        self.assertIn("<strong>Figura 2.1-A.</strong>", salida)
```

- [ ] **Step 2: Run test and verify RED**

Run: `PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=. python3 scripts/test_regenerate_manuals.py -v`  
Expected: FAIL because the current capture regex only accepts digits and periods.

- [ ] **Step 3: Extend capture parsing**

Change the capture regex to:

```python
r"(\d+\.\d+(?:-[A-Z])?)"
```

Build the slug with:

```python
slug = numero.lower().replace(".", "-")
```

- [ ] **Step 4: Run test and verify GREEN**

Run: `PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=. python3 scripts/test_regenerate_manuals.py -v`  
Expected: PASS.

---

### Task 2: Acceso guiado y filtros

**Files:**
- Modify: `MANUAL_USUARIO.md`
- Modify: `docs/manual-usuario/capturas/README.md`

**Interfaces:**
- Produces: procedure `Saltar la advertencia del navegador`.
- Produces: detailed filter instructions for Actas, Personas, Solicitudes, Usuarios and Auditoría.

- [ ] **Step 1: Add certificate procedure**

Add six numbered actions under section 2.1 with exact labels **Avanzado**, **Configuración avanzada** and **Continuar a 172.16.3.21**. Add the safety condition:

```markdown
> Si la barra de dirección muestra una dirección diferente de `https://172.16.3.21`, no pulse **Continuar**.
```

Add:

```markdown
> **Captura pendiente — Figura 2.1-A.** Advertencia del navegador con las opciones **Avanzado** y **Continuar a 172.16.3.21**.
```

- [ ] **Step 2: Expand Actas filters**

Document DNI/names, code/folio/CUI, book, year, type, date range, combinations and reset. Explicitly explain that a CUI search can fail when an unrelated Libro filter remains active.

- [ ] **Step 3: Expand remaining filters**

Document:

- Personas: DNI/names and reset;
- Solicitudes: number/DNI/surnames, date range, status and reset;
- Usuarios: DNI/username/names and reset;
- Auditoría: user, date range, module, total, export and reset.

- [ ] **Step 4: Add complementary capture inventory**

Add `figura-2-1a.png`, `figura-4-4a.png`, `figura-4-7a.png`, `figura-4-10a.png`, `figura-6-1a.png` and `figura-6-5a.png` to the capture README.

- [ ] **Step 5: Verify filter names against code**

Run:

```bash
rg 'Código o folio|Libro|PENDIENTE|ATENDIDO|ANULADO|Usuario|ACTAS|USUARIOS|PERSONAS|SOLICITUDES' MANUAL_USUARIO.md
```

Expected: all exact controls and options are documented.

---

### Task 3: Importación y recuperación ante conexión

**Files:**
- Modify: `MANUAL_USUARIO.md`
- Modify: `docs/manual-usuario/capturas/README.md`

**Interfaces:**
- Produces: complete import lifecycle and recovery decision rules.

- [ ] **Step 1: Expand pre-import and progress**

Document file formats, single-click start, open-tab requirement, **Procesando información**, progress percentage and distinction between 100% upload and final result.

- [ ] **Step 2: Define completion**

State that the operation finishes only when the summary displays **TOTAL FILAS**, **ACTAS NUEVAS**, **YA EXISTÍAN**, **DOCS VINCULADOS** and **ERRORES**.

- [ ] **Step 3: Expand row outcomes**

For `OK`, `OMITIDO`, `OMITIDO_DOC` and `ERROR`, document what happened, what to inspect and whether the row may be retried.

- [ ] **Step 4: Add connection recovery procedures**

Add separate procedures for interruption during save, import, export and expired session. Every procedure must require checking the corresponding list before retrying.

- [ ] **Step 5: Add capture inventory**

Add `figura-4-15a.png`, `figura-4-15b.png` and `figura-7-3a.png`.

---

### Task 4: Generate and review deliverables

**Files:**
- Modify: `MANUAL_USUARIO.html` (generated)

**Interfaces:**
- Consumes: updated Markdown and capture converter.
- Produces: synchronized printable HTML.

- [ ] **Step 1: Regenerate HTML**

Run: `python3 scripts/regenerate_manuals.py`

- [ ] **Step 2: Run automated checks**

```bash
PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=. python3 scripts/test_regenerate_manuals.py -v
git diff --check
rg 'figura-(2-1a|4-4a|4-7a|4-10a|4-15a|4-15b|6-1a|6-5a|7-3a)\.png' MANUAL_USUARIO.html
```

Expected: test passes, no whitespace errors and all nine new image paths exist.

- [ ] **Step 3: Senior content review**

Verify against source code:

- every filter label exists in the UI;
- every import state exists in `ResultadoFila`;
- no unsupported CSV/template behavior is claimed;
- no blind retry can create duplicates;
- certificate bypass is restricted to `172.16.3.21`;
- no visual verification is performed.

- [ ] **Step 4: Commit**

```bash
git add MANUAL_USUARIO.md MANUAL_USUARIO.html \
  docs/manual-usuario/capturas/README.md \
  scripts/regenerate_manuals.py scripts/test_regenerate_manuals.py \
  docs/superpowers/plans/2026-07-26-manual-usuario-lectura-guiada-plan.md
git commit -m "docs: ampliar manual para lectura guiada"
```
