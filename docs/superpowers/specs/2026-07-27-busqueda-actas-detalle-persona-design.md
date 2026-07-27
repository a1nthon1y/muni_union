# Búsqueda de actas por ciudadano y detalle de persona

**Fecha:** 2026-07-27  
**Estado:** Aprobado para implementación  
**Alcance:** Registro de Actas, Personas, API y documentación de usuario

## Objetivo

Permitir que el registrador encuentre actas a partir de los datos que proporciona un ciudadano y que, desde Personas, pueda consultar de forma inequívoca las actas ya vinculadas a cada persona.

No se incorpora vinculación manual. Las asociaciones siguen dependiendo de `persona_principal_id` y `persona_secundaria_id`, definidos al registrar o editar el acta.

## Decisiones UX

### Registro de Actas

El buscador de ciudadano ocupará una fila propia y visible. Aceptará DNI, apellidos y nombres en un solo campo, con actualización automática después de una pausa breve.

La búsqueda será progresiva:

- `QUISPE` muestra todas las actas cuyos titulares o cónyuges coinciden;
- `QUISPE RAMOS` exige coincidencia de ambos términos;
- `QUISPE RAMOS JUAN CARLOS` continúa reduciendo el resultado;
- un DNI busca tanto al titular como al segundo contrayente.

Cada término separado por espacios se evaluará de manera independiente. La búsqueda no dependerá de que toda la frase coincida como una cadena contigua. Será insensible a mayúsculas y minúsculas.

Los filtros registrales se moverán a una segunda fila: código o folio, libro, año, tipo y rango de fechas. En pantallas estrechas se distribuirán en una cuadrícula, sin ocultar ni comprimir el buscador principal.

El texto de ayuda será: **“DNI, primer apellido, segundo apellido o nombres”**.

### Personas

El menú `⋮` incorporará **Ver detalles** antes de **Editar ciudadano**.

Ver detalles abrirá un panel de solo lectura, separado del formulario de edición. El panel mostrará:

1. identidad y documento;
2. fechas y datos de contacto;
3. sección **Actas vinculadas (N)**.

Cada acta vinculada indicará:

- tipo de acta;
- número;
- año y fecha;
- estado;
- participación de la persona: **Titular** o **Cónyuge**;
- existencia de documento digital.

Las acciones disponibles serán **Ver acta**, **Imprimir** y, cuando exista, **Ver documento**. La consulta debe usar el ID interno de la persona para no mezclar homónimos.

Estados del panel:

- carga: esqueletos compactos dentro de la sección;
- sin actas: “Este ciudadano no tiene actas vinculadas”;
- error: mensaje específico y acción **Reintentar**;
- actas anuladas: visibles con su estado, no ocultas.

## Diseño visual

Se conserva el sistema visual institucional existente: colores semánticos, tipografía y componentes `Sheet`, `Badge`, `Button` y `Table`. La mejora se concentra en jerarquía y legibilidad, sin introducir una estética paralela.

El elemento distintivo será una línea cronológica compacta de actas dentro del detalle del ciudadano. Los iconos de nacimiento, matrimonio y defunción permitirán reconocer el tipo antes de leer, mientras el número de acta seguirá siendo el dato visual principal.

La interfaz deberá cumplir:

- foco de teclado visible;
- botones con texto, no solo iconos, para las acciones principales;
- objetivos táctiles suficientes;
- diseño funcional desde móvil hasta escritorio;
- mensajes claros y operativos.

## Arquitectura y datos

### Filtros de actas

`construirFiltrosActas` dividirá `q` en términos normalizados. Cada término agregará una cláusula que lo busque en:

- nombre completo del titular;
- DNI del titular;
- nombre completo del cónyuge;
- DNI del cónyuge.

Las cláusulas de los términos se combinarán con `AND`; los campos de una misma persona se combinarán con `OR`.

Se añadirá el filtro exacto `persona_id`, cuya condición será:

```sql
(a.persona_principal_id = $n OR a.persona_secundaria_id = $n)
```

### Consulta desde Personas

El frontend reutilizará `GET /api/actas?persona_id={id}` mediante `actasService.getAll`. No se creará un endpoint duplicado bajo Personas.

`PersonaDetailSheet` recibirá la persona seleccionada y solicitará sus actas al abrirse. El resultado seguirá el contrato paginado existente. La cantidad mostrada provendrá de `pagination.total`.

### Navegación

**Ver acta** llevará a Registro de Actas con `persona_id` y el acta seleccionada. Registro de Actas leerá los parámetros de URL y conservará el filtro exacto por persona.

**Imprimir** abrirá `/print/acta/{id}`.

**Ver documento** reutilizará el servicio de documentos y el comportamiento vigente del módulo Actas.

## Pruebas

### Backend

- un término encuentra titular o cónyuge;
- varios términos generan condiciones independientes combinadas con `AND`;
- espacios repetidos no generan términos vacíos;
- `persona_id` filtra titular y cónyuge por ID exacto;
- los filtros registrales continúan combinándose con la búsqueda ciudadana.

### Frontend

- Registro de Actas muestra siempre el buscador ciudadano;
- la escritura dispara `q` después del debounce;
- limpiar restablece búsqueda ciudadana y filtros registrales;
- el menú de Personas ofrece Ver detalles;
- el panel carga actas por ID;
- muestra participación, estados vacío/error/carga y acciones correctas.

### Verificación manual

Se comprobará en anchos móvil, tableta y escritorio; además, se ejecutarán pruebas, lint y build de ambos proyectos según corresponda.

## Documentación

El Manual de Usuario explicará:

- búsqueda progresiva por DNI, apellidos y nombres;
- diferencia entre búsqueda ciudadana y filtros registrales;
- consulta de actas vinculadas desde Detalles del ciudadano;
- que la vinculación se realiza al registrar o editar el acta, no desde Personas.

Después se regenerará `MANUAL_USUARIO.html`.
