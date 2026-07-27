# Diseño: Integración integral de fecha de fallecimiento

**Fecha:** 26 de julio de 2026  
**Estado:** Aprobado  
**Alcance:** Frontend, Backend, importación, reportes, impresión, API, migraciones, pruebas y documentación.

## 1. Objetivo

Completar la incorporación de `fecha_fallecimiento` siguiendo el mismo criterio funcional de `fecha_nacimiento` en todos los flujos donde el dato personal resulte pertinente.

La columna ya existe en producción. El repositorio incorporará una migración idempotente para que instalaciones existentes, nuevas y de recuperación mantengan el mismo esquema sin modificar valores ya registrados.

## 2. Reglas funcionales

- La fecha de fallecimiento es opcional.
- Puede registrarse al crear una persona, durante la digitalización y mediante importación masiva.
- Puede modificarse o eliminarse al editar una persona.
- Si existen ambas fechas, fallecimiento no puede ser anterior a nacimiento.
- Omitir el campo en una actualización conserva el valor existente.
- Enviar explícitamente `null` elimina el valor existente.
- Las fechas inválidas producen un error de validación y no un error interno.
- La actualización de un acta detectada no puede depender de un identificador desactualizado durante el retardo de búsqueda.

## 3. Persistencia y compatibilidad

Se añadirá `008_fecha_fallecimiento.sql`:

```sql
ALTER TABLE personas
ADD COLUMN IF NOT EXISTS fecha_fallecimiento DATE;
```

El script será seguro para producción porque `IF NOT EXISTS` no recrea la columna ni altera sus datos. `000_schema.sql`, el instalador limpio y la documentación de despliegue quedarán sincronizados con la secuencia `000–008`.

## 4. Backend y API

### 4.1. Personas

- Crear acepta y persiste `fecha_fallecimiento`.
- Actualizar diferencia entre campo omitido y `null`.
- Las reglas HTTP validan formato `YYYY-MM-DD`.
- Se valida la relación cronológica entre nacimiento y fallecimiento usando los valores nuevos o, para actualizaciones parciales, el valor persistido correspondiente.
- Swagger declara el campo como fecha opcional y anulable.

### 4.2. Importación

- Se normalizan `fecha_fallecimiento` y `conyuge_fecha_fallecimiento`.
- Una fecha informada pero no reconocida rechaza esa fila con detalle.
- Cuando el titular se identifica por DNI también se actualizan las fechas informadas.
- Los datos vacíos no borran fechas existentes durante una importación.
- Se aplica la relación cronológica tanto al titular como al cónyuge.

### 4.3. Reportes

El Excel de Personas incluirá **Fecha Nac.** y **Fecha Fallecimiento**.

El Excel de Actas incluirá nacimiento y fallecimiento del titular. Para matrimonios también incluirá nacimiento y fallecimiento del cónyuge. Solicitudes y Auditoría no cambian porque actualmente no exponen fecha de nacimiento.

La conversión de fechas utilizará una función estable que no dependa de la zona horaria del servidor para evitar desplazamientos de un día.

## 5. Frontend

### 5.1. Registro y edición

- Digitalización y PersonaSheet mostrarán los dos campos de fecha.
- Ambos formularios validarán que fallecimiento no sea anterior a nacimiento.
- El alta enviará la fecha o la omitirá cuando esté vacía.
- La edición enviará `null` cuando el usuario borre una fecha previamente registrada.
- Los mensajes indicarán el campo y la regla incumplida.

### 5.2. Consultas e impresión

- El listado de Personas mostrará nacimiento y fallecimiento sin ocultar las acciones.
- El detalle de Acta mantendrá ambos datos del titular y del cónyuge.
- La impresión de Acta mostrará fallecimiento únicamente cuando exista, igual que los demás datos opcionales.
- No se añadirá este dato a solicitudes ni al portal público.

### 5.3. Integridad durante digitalización

Al modificar tipo, libro, número o modo de un acta previamente detectada se invalidará inmediatamente `actaEncontrada`. La búsqueda posterior podrá volver a identificarla. El envío comprobará que el acta retenida todavía coincide con el identificador construido antes de decidir entre crear y actualizar.

## 6. Pruebas

Se añadirán pruebas para:

- migración idempotente;
- creación con y sin fecha de fallecimiento;
- actualización, conservación por omisión y eliminación con `null`;
- rechazo de formato inválido y cronología imposible;
- importación de titular encontrado por DNI;
- importación de titular y cónyuge nuevos o existentes;
- columnas y valores de Excel de Personas y Actas;
- validación de formularios;
- invalidación de una acta detectada cuando cambia su identidad;
- renderizado condicional en listado, detalle e impresión.

También se ejecutarán build y pruebas completas de Frontend y Backend. Los errores de lint preexistentes se distinguirán de cualquier error nuevo en los archivos modificados.

## 7. Documentación

Se actualizarán README, Manual Técnico y Manual de Usuario para:

- registrar la migración `008`;
- describir creación, edición e importación del campo;
- indicar su presencia en reportes e impresión;
- documentar que una fecha existente puede eliminarse desde la edición.

Los HTML de los manuales se regenerarán sin verificación visual.

## 8. Fuera de alcance

- Estado automático “fallecido”.
- Nuevos filtros, métricas o tarjetas del Dashboard.
- Incorporación del dato en Solicitudes, Auditoría o portal público.
- Cambios retroactivos a fechas ya almacenadas en producción.
