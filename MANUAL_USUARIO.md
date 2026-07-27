# MANUAL DE USUARIO
## Sistema de Registro Civil

**Municipalidad Distrital de La Unión Leticia — Tarma, Perú**

> **USO INTERNO MUNICIPAL**
> Este documento describe tareas visibles en la aplicación. No contiene credenciales ni instrucciones de servidores.

### Control documental

| Campo | Valor |
|---|---|
| Documento | Manual de Usuario del Sistema de Registro Civil |
| Versión | `1.0.0` |
| Fecha | 23 de julio de 2026 |
| Estado | Versión final |
| Audiencia | ADMIN, REGISTRADOR y personal de ventanilla con cuenta REGISTRADOR |
| Documento técnico relacionado | `MANUAL_TECNICO.md` / `MANUAL_TECNICO.html` |
| Clasificación | Uso interno municipal |

### Incorporación de capturas

Cada marcador **Captura pendiente — Figura X.Y** indica exactamente la pantalla y el estado que se debe fotografiar. El HTML busca automáticamente las imágenes en:

`docs/manual-usuario/capturas/figura-X-Y.png`

Ejemplo: la Figura 2.1 se carga desde `docs/manual-usuario/capturas/figura-2-1.png`.

Para incorporar una captura sin romper el diseño:

1. use formato PNG;
2. guarde el archivo con el nombre indicado, en minúsculas;
3. no cambie el número de figura;
4. recargue `MANUAL_USUARIO.html`;
5. si utiliza otra ubicación, cambie únicamente el atributo `src` de la figura en el HTML;
6. no supere 1920 píxeles de ancho y oculte credenciales o datos personales innecesarios.

El contenedor limita automáticamente el ancho, conserva la proporción y evita dividir la figura al imprimir.

### Contenido

1. Generalidades del Sistema
2. Acceso y Autenticación al Sistema
3. Panel Principal e Interfaz de Navegación
4. Guía Paso a Paso de los Módulos Funcionales
5. Generación de Reportes y Consultas
6. Gestión de Perfiles y Permisos
7. Mensajes de Error y Alertas Frecuentes
8. Preguntas Frecuentes (FAQ) y Soporte

---

## 1. Generalidades del Sistema

### 1.1. Propósito del manual y público objetivo

Este manual orienta al personal autorizado en el uso funcional del Sistema de Registro Civil de la Municipalidad Distrital de La Unión Leticia. Explica el acceso, la navegación, el registro y consulta de información, la atención de solicitudes, los reportes y las funciones administrativas.

| Perfil | Uso principal |
|---|---|
| REGISTRADOR | Digitalización, personas, actas y solicitudes, según permisos; su identificador interno es `USER` |
| ADMIN | Operación completa y administración funcional |
| Ventanilla (función organizativa, no rol) | Opera con una cuenta REGISTRADOR autorizada |
| Ciudadano | Solo portal público de verificación |

El manual no comprende instalación, red, certificados, API, base de datos, restauración ni recuperación técnica. Esos procedimientos están en el **Manual Técnico**, secciones 2.4, 5, 6, 7, 8 y 9.

### 1.2. Descripción general de las funcionalidades del software

El sistema permite:

- registrar personas y actas de nacimiento, matrimonio y defunción;
- adjuntar el PDF o imagen digitalizada de un acta;
- consultar, filtrar, editar, anular o eliminar registros según permisos;
- gestionar solicitudes de copias y sus constancias;
- importar actas históricas desde Excel;
- exportar información autorizada a Excel;
- administrar usuarios, auditoría, backup e identidad visual;
- ofrecer al ciudadano una verificación limitada, sin acceso al sistema interno.

### 1.3. Requisitos básicos del usuario

- Equipo conectado a la red autorizada de la Municipalidad.
- Google Chrome, Microsoft Edge o Mozilla Firefox actualizado.
- Resolución mínima recomendada de 1366 × 768 píxeles; para formularios extensos se recomienda 1920 × 1080.
- URL interna oficial: `https://172.16.3.21`.
- Cuenta personal activa. No se deben compartir cuentas.
- Lector de PDF y aplicación compatible con Excel (`.xlsx`) para documentos y reportes.

Al abrir la URL interna, el navegador puede mostrar una advertencia de seguridad antes del login. El procedimiento para continuar se encuentra en la sección 2.1.

---

## 2. Acceso y Autenticación al Sistema

### 2.1. Enlace oficial de acceso a la plataforma

Desde un equipo conectado a la red municipal, abra:

`https://172.16.3.21/login`

El portal público de consulta es independiente del acceso interno y se describe en 5.3.

#### 2.1.1. Saltar la advertencia del navegador

La advertencia aparece porque el navegador no reconoce automáticamente el certificado utilizado en la red privada municipal. Para ingresar:

1. Confirme que el equipo esté conectado a la red municipal.
2. Mire la barra de direcciones y compruebe que muestre `https://172.16.3.21`.
3. Pulse **Configuración avanzada** o **Avanzado**. El nombre depende del navegador.
4. Busque la opción **Continuar a 172.16.3.21** o un texto equivalente que incluya esa misma dirección.
5. Pulse **Continuar a 172.16.3.21**.
6. Espere hasta que aparezca la pantalla **Iniciar Sesión**.

**Resultado esperado:** se muestran los campos **Nombre de Usuario**, **Contraseña** y el botón **Ingresar**.

> Si la barra de direcciones muestra una dirección diferente de `https://172.16.3.21`, no pulse **Continuar**.

La advertencia puede aparecer nuevamente al usar otro navegador, otro equipo o una sesión nueva. En ese caso repita estos pasos y vuelva a comprobar la dirección.

> **Captura pendiente — Figura 2.1-A.** Advertencia del navegador con las opciones **Avanzado** y **Continuar a 172.16.3.21** identificadas.

### 2.2. Interfaz de inicio de sesión y campos requeridos

**Roles:** ADMIN y REGISTRADOR.

1. Abra la URL proporcionada por Sistemas.
2. En **Nombre de Usuario**, escriba su cuenta.
3. En **Contraseña**, escriba su clave.
4. Pulse **Ingresar**.

**Resultado esperado:** aparece el mensaje `Bienvenido, {nombres}` y se abre el **Dashboard**.

| Mensaje | Qué hacer |
|---|---|
| `El usuario es obligatorio` | Complete el nombre de usuario |
| `La contraseña es obligatoria` | Complete la contraseña |
| `Usuario o contraseña incorrectos.` | Verifique mayúsculas y datos; no pruebe repetidamente |
| `La cuenta se encuentra inactiva. Contacte al administrador.` | Solicite reactivación al ADMIN |
| Demasiados intentos | Espere el tiempo indicado y contacte a soporte si persiste |

> **Captura pendiente — Figura 2.1.** Pantalla real de inicio de sesión con los campos **Nombre de Usuario**, **Contraseña** y el botón **Ingresar**. Debe obtenerse de `https://172.16.3.21/login` sin mostrar credenciales.

La sesión se renueva automáticamente mientras el sistema está en uso. Si vuelve al login:

1. no repita la operación que estaba guardando;
2. inicie sesión otra vez;
3. compruebe si el registro ya fue creado antes de volver a intentarlo.

### 2.3. Proceso de recuperación de contraseña

La versión actual **no tiene recuperación automática por correo, enlace “Olvidé mi contraseña” ni pantalla para que el usuario cambie su propia clave**. El procedimiento real es:

1. El usuario solicita el cambio al ADMIN por el canal institucional.
2. El ADMIN ingresa a **Usuarios**.
3. Abre **⋮ → Editar Perfil → Cambiar Contraseña**.
4. Entrega la nueva clave mediante un canal institucional seguro.
5. El usuario inicia sesión y confirma el acceso.

> **Captura pendiente — Figura 2.2.** Formulario real **Editar Perfil**, con la sección **Cambiar Contraseña**, abierto por un ADMIN. Esta captura representa el procedimiento disponible; no debe inventarse una pantalla de recuperación inexistente.

Nunca envíe contraseñas por WhatsApp, correo personal o captura de pantalla.

---

## 3. Panel Principal e Interfaz de Navegación

### 3.1. Vista del tablero principal (Dashboard)

**Menú:** Dashboard.  
**Roles:** ADMIN y REGISTRADOR.

El tablero muestra:

- Total Actas.
- Personas.
- Solicitudes pendientes y atendidas.
- Total del mes.
- Evolución de seis meses.
- Estado de trámites.
- Accesos directos; ADMIN también ve Usuarios y Auditoría.

El Dashboard es informativo: no edita registros.

> **Captura pendiente — Figura 3.1.** Vista real del Dashboard con indicadores, gráfica de evolución y estado de trámites. Antes de incorporarla se deben ocultar datos personales que no sean necesarios.

### 3.2. Descripción del menú de navegación

| Menú | ADMIN | REGISTRADOR | Función |
|---|:---:|:---:|---|
| Dashboard | Sí | Sí | Resumen |
| Digitalización | Sí | Sí | Registro integral de persona, acta y archivo |
| Personas | Sí | Sí | Ciudadanos |
| Actas | Sí | Sí | Consulta y acciones |
| Solicitudes | Sí | Sí | Trámites y certificados |
| Usuarios | Sí | No | Cuentas y permisos |
| Auditoría | Sí | No | Bitácora y exportación |
| Backup BD | Sí | No | Descarga de respaldo |
| Configuración | Sí | No | Reemplazo de logos institucionales |

La opción **IMPORTAR** se encuentra en **Actas**, fuera del menú lateral. Aunque el botón pueda aparecer a un REGISTRADOR, el proceso está autorizado únicamente para ADMIN.

> **Captura pendiente — Figura 3.2.** Menú lateral expandido de una sesión ADMIN.  

> **Captura pendiente — Figura 3.3.** Menú lateral de una sesión REGISTRADOR, sin opciones administrativas.

### 3.3. Elementos comunes de la interfaz

- **Encabezado:** identifica la pantalla y muestra el menú del usuario.
- **Barra lateral:** permite cambiar de módulo.
- **Avatar del encabezado:** abre opciones de la cuenta y **Cerrar Sesión**.
- **Botón inferior de la barra lateral:** permite cerrar sesión.
- **Menú móvil:** concentra navegación y cierre de sesión en pantallas pequeñas.
- **Notificaciones:** confirman resultados o muestran alertas.
- **Menús ⋮:** agrupan las acciones disponibles para cada registro.

Para cerrar la sesión use el avatar, el botón inferior de la barra lateral o el menú móvil. El resultado esperado es el regreso a `/login`.

La versión actual no incorpora un centro de ayuda dentro de la aplicación; este manual constituye la guía funcional.

> **Captura pendiente — Figura 3.4.** Encabezado y menú de usuario con la opción **Cerrar Sesión**.

**Error:** `No se pudo cargar el resumen. Verifique su conexión e intente recargar la página.`

**Acción:** recargue una vez. Si persiste, entregue a soporte fecha/hora y captura.

---

## 4. Guía Paso a Paso de los Módulos Funcionales

Cada procedimiento de este capítulo debe acompañarse con capturas reales y correlativas. Mientras no se disponga de acceso a una sesión operativa, se mantienen marcadores explícitos para evitar publicar imágenes ficticias o datos personales.

### 4.1. Módulo de Digitalización: registro y llenado de formularios

**Menú:** Digitalización, o **Actas → NUEVA DIGITALIZACIÓN**

**Roles:** ADMIN y REGISTRADOR

**Precondición:** contar con el documento físico y su archivo PDF/JPG/PNG.

La **Consola de Digitalización** registra de forma conjunta ciudadano, acta y archivo.

#### 4.1.1. Información del ciudadano

1. Seleccione el tipo de documento.
2. Ingrese DNI si corresponde.
3. Complete nombres y apellidos.
4. Seleccione y verifique el sexo, que es obligatorio. Complete fecha de nacimiento, teléfono u observaciones cuando correspondan.
5. Revise las coincidencias mostradas por el sistema.

Para una persona sin documento use **SIN DOCUMENTO**.

> Una coincidencia por nombre no demuestra que sea la misma persona. Revise fecha, acta física y demás datos. No fusione registros por suposición.

#### 4.1.2. Especificaciones del acta

1. Seleccione Nacimiento, Matrimonio o Defunción.
2. Elija el modo:
   - **Libro Clásico:** libro y número de acta.
   - **RENIEC (CUI):** código CUI/ID.
3. Use la sugerencia **AUTO** solo después de verificar libro, tipo y año.
4. Complete año y fecha del acta.
5. En matrimonio complete **Cónyuge — Obligatorio en Matrimonio**.
6. Agregue observaciones si son necesarias.

Formato clásico mostrado: `NAC-L{libro}-{numero}` o prefijo equivalente según tipo.

#### 4.1.3. Archivo digitalizado

1. Seleccione PDF, JPG o PNG.
2. Verifique que corresponda a la persona y al acta de la pantalla.
3. Tamaño máximo real: **20 MB**.
4. Pulse **Procesar Registro**.

El archivo es obligatorio para este flujo.

**Resultados esperados:**

- `Nueva acta registrada con éxito.`
- `Operación exitosa: Datos y documento actualizados.`

**Mensajes relevantes:**

| Mensaje/situación | Acción |
|---|---|
| `Documento Requerido` | Adjunte el archivo antes de procesar |
| Acta duplicada | No vuelva a guardar; revise el acta existente |
| Homonimia/ciudadano identificado | Compare datos antes de seleccionar |
| Error al procesar | Verifique si el acta quedó creada antes de reintentar |

> **Captura pendiente — Figura 4.1.** Consola de Digitalización antes de completar datos.  

> **Captura pendiente — Figura 4.2.** Formulario con las secciones de ciudadano y especificaciones del acta completas, usando datos de prueba autorizados.  

> **Captura pendiente — Figura 4.3.** Selector del archivo digitalizado y confirmación del registro exitoso.

---

### 4.2. Módulo de Actas: búsqueda, filtrado y descarga

**Menú:** Actas

**Pantalla:** Registro de Actas

#### 4.2.1. Buscar y filtrar

Los filtros reducen la lista a medida que se escriben o seleccionan. No es necesario llenar todos. Puede usar uno solo o combinar varios.

| Filtro visible | Qué debe ingresar | Ejemplo y resultado |
|---|---|---|
| **Buscar por DNI o Nombres...** | DNI completo, nombre o apellido de la persona | `12345678` muestra actas relacionadas con ese DNI; `QUISPE` muestra coincidencias por nombre |
| **Código o folio** | Código completo, folio numérico o CUI | `NAC-L32-15`, `15` o el CUI registrado |
| **Libro** | Solo el número del libro | `32` busca actas cuyo código pertenece al libro 32 |
| **Año** | Año de cuatro dígitos | `2024` limita el resultado a ese año |
| **Tipo** | TODOS, NACIMIENTO, MATRIMONIO o DEFUNCION | Seleccione **TODOS** para no limitar por tipo |
| **Desde / Hasta** | Fecha inicial y final | Use ambas fechas para revisar un periodo |

Procedimiento recomendado:

1. Antes de escribir, mire si ya existe algún filtro activo.
2. Ingrese primero el dato más específico, por ejemplo DNI, código, folio o CUI.
3. Espere a que la lista se actualice.
4. Si aparecen demasiados resultados, agregue tipo, año o fechas.
5. Antes de exportar, confirme que la lista visible corresponda a lo solicitado.
6. Para comenzar otra búsqueda, pulse el botón con **flechas circulares**. Todos los campos deben quedar vacíos y **Tipo** debe volver a **TODOS**.

> **Importante para búsquedas por CUI:** no mantenga un valor en **Libro** si el registro CUI no tiene libro. Si conoce el CUI y no aparece, limpie todos los filtros, escriba únicamente el CUI en **Código o folio** y espere la actualización.

**Ejemplo de combinación:** para revisar nacimientos del libro 32 del año 2024, escriba `32` en **Libro**, `2024` en **Año** y seleccione **NACIMIENTO** en **Tipo**.

Para soporte o exportación, anote todos los filtros activos.

> **Captura pendiente — Figura 4.4-A.** Filtros de Actas identificados, ejemplo de búsqueda y botón de flechas circulares para limpiar.

#### 4.2.2. Modificar, anular, reactivar o eliminar

Abra el menú **⋮** de la fila:

| Acción | Requisito | Resultado |
|---|---|---|
| Ver Detalles | Usuario autenticado | Ficha completa |
| Editar | Permiso `actas_modificar` | Actualiza datos |
| Imprimir | Desde detalle | Vista `/print/acta/{id}` |
| Ver/Descargar documento | Documento existente | Abre archivo |
| Adjuntar/Reemplazar Archivo | Usuario autenticado | Sustituye documento vigente |
| Anular | Permiso `actas_anular` | Estado ANULADO |
| Reactivar | Solo ADMIN | Estado activo |
| Eliminar | Permiso `actas_eliminar` | Eliminación lógica |

Para anular, el motivo es obligatorio. Si aparece `Debe indicar el motivo de anulación`, complete el campo.

> Reemplazar o eliminar un documento puede borrar el archivo físico anterior. Confirme acta y archivo antes de aceptar.

#### 4.2.3. Descargar e iniciar una importación

- **EXPORTAR:** genera Excel con los filtros activos.
- **IMPORTAR:** abre la carga masiva; solo ADMIN puede completarla.

Mensajes de exportación: `Generando Excel de actas...`, `Descarga lista` o `Error al generar el reporte`.

> **Captura pendiente — Figura 4.4.** Registro de Actas con filtros y botones **IMPORTAR** y **EXPORTAR**.  

> **Captura pendiente — Figura 4.5.** Menú **⋮** de un acta con las acciones permitidas al perfil autenticado.  

> **Captura pendiente — Figura 4.6.** Alerta de confirmación para anular o eliminar un acta, sin ejecutar la acción sobre información productiva.

---

### 4.3. Módulo de Personas: registro, búsqueda y mantenimiento

**Menú:** Personas

**Pantalla:** Ciudadanos

#### 4.3.1. Buscar antes de crear

El campo **Buscar por DNI o Nombres...** consulta mientras escribe.

1. Para una persona con DNI, escriba los 8 dígitos completos.
2. Espere la actualización de la lista.
3. Si no conoce el DNI, borre el contenido y escriba un nombre o apellido.
4. Revise todas las coincidencias antes de registrar una nueva persona.
5. Para limpiar la búsqueda, pulse el botón con **flechas circulares**. La lista general debe aparecer nuevamente.

**Resultado esperado:** la tabla muestra solo las personas que coinciden con el texto ingresado.

> **Revise antes de crear:** una búsqueda sin resultados no es suficiente si el nombre está incompleto. Pruebe DNI, primer apellido y nombres para evitar duplicados.

> **Captura pendiente — Figura 4.7-A.** Buscador de Ciudadanos, resultado filtrado y botón para limpiar.

#### 4.3.2. Registrar

1. Pulse **REGISTRAR CIUDADANO**.
2. Complete nombres y apellidos obligatorios.
3. Seleccione tipo de documento; use **SIN DOCUMENTO** si corresponde.
4. Seleccione y verifique el sexo, que es obligatorio.
5. Complete los demás datos disponibles.
6. Revise y guarde.

#### 4.3.3. Editar, eliminar y exportar

- Editar requiere `personas_modificar`.
- Eliminar requiere `personas_eliminar` y puede rechazarse si la persona tiene actas.
- **EXPORTAR** genera Excel del resultado filtrado.

No elimine una persona para resolver un duplicado sin verificar antes sus actas vinculadas.

> **Captura pendiente — Figura 4.7.** Padrón de Ciudadanos con búsqueda y botón **REGISTRAR CIUDADANO**.  

> **Captura pendiente — Figura 4.8.** Formulario de registro de persona con campos obligatorios identificados.  

> **Captura pendiente — Figura 4.9.** Alerta de confirmación de eliminación o mensaje que impide eliminar una persona vinculada.

---

### 4.4. Módulo de Solicitudes: procesamiento y flujo de atención

**Menú:** Solicitudes

**Pantalla:** Trámites y Certificados

#### 4.4.1. Crear una solicitud

1. Pulse **NUEVA SOLICITUD**.
2. Busque o registre al solicitante. El DNI debe tener 8 dígitos.
3. Ingrese el tipo o concepto de la solicitud.
4. Agregue las actas solicitadas, cantidad y precio cuando corresponda.
5. Revise el resumen.
6. Guarde.

**Resultado esperado:** solicitud en estado **PENDIENTE**.

#### 4.4.2. Atender, anular o eliminar

- **Atender:** desde el detalle; resultado `Solicitud atendida correctamente` y estado **ATENDIDO**.
- **Anular:** indique motivo; estado **ANULADO**.
- **Eliminar:** confirme solo cuando corresponda; el registro deja de aparecer en listados normales.

#### 4.4.3. Imprimir documento o cargo

Desde el detalle pulse **Imprimir Documento / Cargo**.

La impresión incluye el número de constancia y un enlace de verificación. Revise antes de entregar:

- solicitante;
- actas/cantidades;
- estado;
- total;
- número de constancia.

El documento impreso puede contener DNI completo. Debe entregarse únicamente al destinatario autorizado.

#### 4.4.4. Filtros y exportación

Los filtros se aplican al listado y también al archivo generado por **EXPORTAR**.

| Filtro visible | Uso |
|---|---|
| **Buscar por N° Trámite, DNI o apellidos...** | Escriba el número de solicitud, DNI del solicitante o uno de sus apellidos |
| **Desde** | Fecha inicial del periodo |
| **Hasta** | Fecha final del periodo |
| **Estado** | TODOS, PENDIENTE, ATENDIDO o ANULADO |

1. Para encontrar un trámite concreto, escriba primero su número.
2. Si busca varias solicitudes, seleccione las fechas y el estado.
3. Espere la actualización de la tabla después de cada cambio.
4. Revise la lista antes de pulsar **EXPORTAR**.
5. Para retirar todos los filtros, pulse el botón con **flechas circulares**. El texto y las fechas deben quedar vacíos, y el estado debe volver a **TODOS**.

**Ejemplo:** para revisar trámites pendientes de una semana, seleccione la fecha inicial en **Desde**, la fecha final en **Hasta** y **PENDIENTE** en **Estado**.

> **Captura pendiente — Figura 4.10-A.** Filtros de Solicitudes combinados y botón para limpiar.

> **Captura pendiente — Figura 4.10.** Listado de Trámites y Certificados con filtros.  

> **Captura pendiente — Figura 4.11.** Formulario **NUEVA SOLICITUD** con solicitante, actas y resumen.  

> **Captura pendiente — Figura 4.12.** Detalle de solicitud con opciones de atención e impresión.  

> **Captura pendiente — Figura 4.13.** Alerta de confirmación para anular o eliminar una solicitud.

---

### 4.5. Módulo de Importación Masiva de Actas Históricas

**Ruta funcional:** **Actas → IMPORTAR**

**Pantalla:** Carga Masiva de Actas

**Rol:** solo ADMIN

#### 4.5.1. Preparar archivos

1. Prepare el Excel con las columnas indicadas a continuación; la plantilla descargable no está disponible actualmente.
2. Use `.xlsx` o `.xls`; CSV no está admitido.
3. Si incluye documentos, prepare un ZIP opcional conservando nombres y carpetas.
4. Máximo: **30.000 filas** y **500 MB por archivo**.

Campos obligatorios por fila:

- `nombres`, `apellido_paterno`, `apellido_materno`;
- `tipo_acta`: `NACIMIENTO`, `MATRIMONIO` o `DEFUNCION`;
- `fecha_acta` en formato `AAAA-MM-DD`;
- `cui`, o bien `libro` y `numero_acta`;
- `anio` es opcional; si falta, se obtiene del año de `fecha_acta`.

Campos relevantes opcionales:

- `dni`, `tipo_documento`, `sexo`, `fecha_nacimiento`, `telefono`;
- `persona_observaciones`, `acta_observaciones`;
- `nombre_archivo_pdf`, `carpeta_ruta`;
- en matrimonio: `conyuge_nombres`, `conyuge_apellido_paterno`, `conyuge_apellido_materno` obligatorios, y demás campos `conyuge_*` cuando existan.

`sexo`, si se proporciona, acepta solo `M` o `F`. Si queda vacío, la versión actual asigna `M`. **No inicie nuevas cargas históricas hasta que Sistemas confirme la corrección de esta regla.**

`nombre_archivo_pdf` debe coincidir exactamente con el archivo del ZIP. Si hay nombres repetidos, use `carpeta_ruta` para identificar la ruta interna.

#### 4.5.2. Ejecutar

1. Seleccione el Excel.
2. Seleccione el ZIP si corresponde.
3. Pulse **INICIAR CARGA** una sola vez.
4. Cuando aparezca la barra de progreso, no vuelva a pulsar el botón.
5. Mientras suben los archivos puede mostrarse `Sincronizando archivos con el sistema central...`.
6. Cuando la carga llega a 100 %, puede mostrarse `Procesando registros de acta, por favor espere.`.
7. Mantenga abierta la pestaña. El cliente admite hasta aproximadamente 16 minutos y 40 segundos.
8. No actualice la página, no cierre el navegador y no inicie otra carga mientras procesa.

> Llegar a **100 %** solo confirma que los archivos terminaron de enviarse. La importación todavía puede estar procesando las filas.

#### 4.5.3. Confirmar que la importación terminó

La importación se considera terminada únicamente cuando desaparece la barra de progreso y aparece el resumen con estos cinco contadores:

- **TOTAL FILAS**;
- **ACTAS NUEVAS**;
- **YA EXISTÍAN**;
- **DOCS VINCULADOS**;
- **ERRORES**.

Puede aparecer uno de estos resultados:

| Resultado visible | Significado | Acción inmediata |
|---|---|---|
| `Importación completada` y cero errores | El lote terminó sin filas rechazadas | Revise una muestra y genere el reporte |
| Mensaje de documentos vinculados | Se asociaron documentos a actas que ya existían sin PDF | Abra esas actas y compruebe el documento |
| Mensaje con cantidad de errores | El lote terminó parcialmente | No cargue todo nuevamente; revise las filas indicadas |

> **Operación terminada:** el resumen final ya está visible. En este punto puede usar **GENERAR REPORTE EXCEL** o **IR AL REGISTRO DE ACTAS**.

#### 4.5.4. Interpretar el estado de cada fila

| Estado | Qué ocurrió | Qué debe hacer | ¿Debe reintentar? |
|---|---|---|---|
| `OK` | La persona y el acta fueron procesadas correctamente | Busque una muestra en Registro de Actas | No |
| `OMITIDO` | El acta ya existía y no se creó otra | Lea el mensaje y busque el acta existente | No |
| `OMITIDO_DOC` | El acta ya existía sin documento y se vinculó el archivo disponible | Abra el acta y compruebe **Ver/Descargar documento** | No, salvo que la verificación muestre un problema |
| `ERROR` | La fila fue rechazada antes de completarse | Anote el número de fila, lea el mensaje y corrija el Excel | Sí, pero solo esa fila corregida |

Después:

1. Pulse **GENERAR REPORTE EXCEL**.
2. Abra el reporte y ubique la columna **ESTADO**.
3. Revise **DETALLE/ERROR** para cada fila `ERROR`.
4. Pulse **IR AL REGISTRO DE ACTAS** y compruebe una muestra de filas `OK` y todas las filas `OMITIDO_DOC`.
5. Si debe reintentar, cree otro Excel únicamente con filas `ERROR` corregidas.

> No vuelva a cargar el archivo completo. Las filas `OK`, `OMITIDO` y `OMITIDO_DOC` ya fueron atendidas y repetirlas dificulta la revisión.

Las filas sin DNI requieren revisión humana y no deben cargarse hasta corregir la regla automática de coincidencia.

#### 4.5.5. Si la conexión se interrumpe

1. No pulse **INICIAR CARGA** nuevamente.
2. Si la barra continúa avanzando, espere a que aparezca el resumen.
3. Si aparece un error o la página deja de responder, conserve el Excel, ZIP y hora de inicio.
4. Abra **Actas → Registro de Actas**.
5. Limpie los filtros anteriores.
6. Busque varias filas del lote por código, folio, CUI o persona.
7. Prepare un nuevo Excel solo con filas confirmadas como no procesadas o con estado `ERROR`.

> **Revise antes de repetir:** una interrupción del navegador no demuestra que el servidor haya detenido la importación.

#### 4.5.6. Datos que deben conservarse

- nombre del Excel y ZIP;
- total de filas;
- hora de inicio;
- reporte generado;
- filas `ERROR` y mensaje exacto;
- captura de pantalla.

No envíe el archivo completo por canales no autorizados: contiene datos personales.

> **Captura pendiente — Figura 4.14.** Pantalla de Carga Masiva con selección de Excel y ZIP opcional.  

> **Captura pendiente — Figura 4.15.** Resumen real del resultado del lote con estados `OK`, `OMITIDO`, `OMITIDO_DOC` y `ERROR`.

> **Captura pendiente — Figura 4.15-A.** Importación completada sin errores, con los cinco contadores del resumen.

> **Captura pendiente — Figura 4.15-B.** Importación parcial con errores y detalle de las filas rechazadas.

---

## 5. Generación de Reportes y Consultas

### 5.1. Configuración de filtros para la emisión de reportes

1. Abra Actas, Personas, Solicitudes o Auditoría.
2. Complete únicamente los filtros que correspondan a la consulta.
3. Revise que el listado visible represente el universo que desea exportar.
4. Anote los filtros cuando el reporte sea parte de una atención o incidencia.

Cuando utiliza varios filtros, el sistema exige que el registro cumpla todos al mismo tiempo. Por ejemplo, una solicitud debe coincidir con el texto, las fechas y el estado seleccionados. Si una información que conoce no aparece:

1. pulse el botón con **flechas circulares**;
2. confirme que los campos quedaron vacíos;
3. realice primero una búsqueda con un solo dato;
4. agregue otros filtros únicamente para reducir los resultados.

> **Captura pendiente — Figura 5.1.** Ejemplo real de filtros aplicados en Registro de Actas antes de la exportación.

### 5.2. Exportación de información a los formatos permitidos

| Módulo | Acción | Formato disponible | Contenido |
|---|---|---|---|
| Actas | EXPORTAR | Excel `.xlsx` | Actas con filtros activos |
| Personas | EXPORTAR | Excel `.xlsx` | Ciudadanos filtrados |
| Solicitudes | EXPORTAR | Excel `.xlsx` | Trámites filtrados |
| Auditoría | EXPORTAR | Excel `.xlsx` | Bitácora filtrada; solo ADMIN |
| Carga masiva | GENERAR REPORTE EXCEL | Excel `.xlsx` | Resultado del lote |

La versión actual **no exporta reportes tabulares en PDF ni CSV**. Los PDF o imágenes vinculados a las actas son documentos digitalizados, no reportes. Las vistas de impresión de actas y solicitudes son documentos imprimibles, no una exportación tabular.

Buenas prácticas:

1. revise filtros antes de exportar;
2. espere el mensaje de descarga completa;
3. abra el archivo y verifique encabezados/cantidad;
4. guárdelo en carpeta institucional protegida;
5. no lo envíe por correo personal ni mensajería no autorizada.

> **Captura pendiente — Figura 5.2.** Botón **EXPORTAR** y confirmación de generación del Excel.  

> **Captura pendiente — Figura 5.3.** Archivo `.xlsx` generado, abierto con datos de prueba o con datos personales ocultos.

### 5.3. Consulta pública de constancias

El portal público es independiente del login municipal. El ciudadano no necesita usuario.

1. Abra la URL de verificación impresa en el documento.
2. Ingrese el número numérico de constancia, normalmente impreso con seis dígitos y ceros iniciales, o abra el enlace completo. El campo acepta hasta 10 dígitos.
3. Pulse verificar.

El portal puede mostrar:

- validez y estado;
- tipo de trámite;
- fechas;
- cantidad/total;
- nombre parcialmente enmascarado;
- nombre completo del trabajador que atendió, cuando la solicitud está ATENDIDA.

No muestra el contenido de las actas ni el DNI completo del solicitante.

| Mensaje | Acción |
|---|---|
| `Ingrese el número de constancia.` | Complete el número |
| `No se encontró ninguna constancia...` | Verifique el número impreso y sus ceros iniciales |
| `Error al verificar la constancia.` | Intente una vez más y reporte URL/hora |
| Demasiadas consultas | Espere antes de repetir |

Una respuesta válida confirma el registro en el sistema; no reemplaza la revisión del documento físico cuando esta sea necesaria.

> **Captura pendiente — Figura 5.4.** Portal público `/verificar` sin datos ingresados.  

> **Captura pendiente — Figura 5.5.** Resultado de una constancia de prueba, con los datos personales no necesarios ocultos.

---

## 6. Gestión de Perfiles y Permisos

### 6.1. Panel de administración de usuarios institucionales

**Menú:** Usuarios

**Rol:** ADMIN

Buscar usuario:

1. En **Buscar por DNI, usuario o nombres...**, escriba uno de esos datos.
2. Espere la actualización del listado.
3. Verifique que la fila corresponda a la cuenta correcta antes de abrir **⋮**.
4. Para mostrar nuevamente todas las cuentas, pulse el botón con **flechas circulares**.

El buscador solo cambia la lista visible. No activa, desactiva ni modifica cuentas.

Crear usuario:

1. Pulse **NUEVO USUARIO**.
2. Complete nombres, apellidos, contraseña y rol; el sistema genera el nombre de usuario.
3. Si el rol es REGISTRADOR, asigne permisos.
4. Guarde y entregue la cuenta por canal seguro.

Acciones del menú **⋮**:

- **Editar Perfil**; dentro de este formulario se encuentra **Cambiar Contraseña**;
- **Configurar Permisos**;
- **Desactivar Acceso** / **Activar Acceso**;
- eliminar, cuando la aplicación lo permita.

No desactive ni elimine la cuenta propia durante una sesión administrativa.

> **Captura pendiente — Figura 6.1.** Panel de Gestión de Usuarios de una sesión ADMIN.  

> **Captura pendiente — Figura 6.1-A.** Buscador de Usuarios con una coincidencia y botón para limpiar.

> **Captura pendiente — Figura 6.2.** Formulario **NUEVO USUARIO**, sin contraseñas visibles.

### 6.2. Asignación de roles y bandejas de trabajo

| Perfil | Bandejas y funciones |
|---|---|
| ADMIN | Dashboard, Digitalización, Personas, Actas, Solicitudes, Usuarios, Auditoría, Backup BD, Configuración e importación |
| REGISTRADOR | Dashboard, Digitalización, Personas, Actas y Solicitudes, según permisos asignados |

Permisos configurables para REGISTRADOR:

- modificar, anular o eliminar actas;
- modificar o eliminar personas.

ADMIN puede reactivar actas y gestionar usuarios, auditoría, backup, configuración e importación. El identificador técnico del perfil REGISTRADOR es `USER`.

1. En **Usuarios**, abra el menú **⋮** de la cuenta.
2. Seleccione **Configurar Permisos**.
3. Active solo las funciones aprobadas para el puesto.
4. Guarde y solicite al usuario que vuelva a ingresar si el cambio no aparece en su sesión.

> **Captura pendiente — Figura 6.3.** Diálogo real **Configurar Permisos** para un usuario REGISTRADOR.  

> **Captura pendiente — Figura 6.4.** Comparación del menú visible para ADMIN y REGISTRADOR.

### 6.3. Otras funciones administrativas

#### 6.3.1. Auditoría

**Menú:** Auditoría

**Pantalla:** Bitácora de Auditoría

Permite filtrar por usuario, fechas y módulo; revisar quién hizo qué y exportar resultados.

| Filtro visible | Uso |
|---|---|
| **Usuario...** | Escriba el usuario que realizó la acción |
| Primera fecha | Inicio del periodo |
| Segunda fecha | Fin del periodo |
| **Módulo** | TODOS, ACTAS, USUARIOS, PERSONAS o SOLICITUDES |

1. Escriba el usuario o seleccione el periodo y módulo.
2. Espere la actualización de la tabla.
3. Revise **Total: {cantidad} registros** para conocer el resultado.
4. Pulse **EXPORTAR** solo después de comprobar los filtros.
5. Para restablecer la bitácora, pulse el botón con **flechas circulares**.

La bitácora puede contener IP y datos operativos. No debe compartirse fuera del personal autorizado.

> **Captura pendiente — Figura 6.5.** Bitácora de Auditoría con filtros y botón **EXPORTAR**.

> **Captura pendiente — Figura 6.5-A.** Filtros de Auditoría identificados y total resultante.

#### 6.3.2. Descargar backup

**Menú:** Backup BD

**Rol:** ADMIN

1. Revise la información mostrada.
2. Pulse **DESCARGAR BACKUP AHORA**.
3. Espere `Backup descargado correctamente`.
4. Entregue el archivo al responsable técnico por el canal aprobado.

El archivo SQL contiene datos confidenciales. El usuario funcional **no debe intentar restaurarlo**. Restauración, validación y retención están en el Manual Técnico, sección 9.1.

> **Captura pendiente — Figura 6.6.** Panel **Backup BD** y botón **DESCARGAR BACKUP AHORA**.

#### 6.3.3. Identidad visual

**Menú:** Configuración

**Rol:** ADMIN

La pantalla contiene dos tarjetas:

- **Logo principal:** `Logo_MDUnion.svg`, usado en el acceso, portal y documentos impresos.
- **Logo para fondos oscuros:** `Logo_blanco.svg`, usado en el menú lateral.

Para reemplazar un logo:

1. Identifique la tarjeta correspondiente.
2. Prepare un SVG de hasta 2 MB con el nombre exacto indicado en la tarjeta.
3. Pulse **Seleccionar** y elija el archivo.
4. Revise la vista previa.
5. Pulse **Reemplazar logo**.
6. Confirme el mensaje de reemplazo correcto.
7. Actualice las pantallas relacionadas y compruebe el cambio.

> Al cargar otro archivo con este mismo nombre, el logo anterior será reemplazado y el cambio se aplicará en todo el sistema.

Si el archivo tiene otro nombre, formato o tamaño, la pantalla lo rechaza y conserva el logo anterior. Si persiste un error de almacenamiento, coordine con el encargado de la Oficina de Informática.

> **Captura pendiente — Figura 6.7.** Pantalla **Identidad visual**, selección, vista previa y confirmación del reemplazo.

---

## 7. Mensajes de Error y Alertas Frecuentes

### 7.1. Alertas de validación de datos

| Alerta o situación | Causa probable | Acción del usuario |
|---|---|---|
| Campo obligatorio resaltado | Falta información requerida | Complete el campo y revise nuevamente |
| DNI inválido | No contiene 8 dígitos | Corrija el número; no agregue letras ni espacios |
| `Documento Requerido` | No se adjuntó el archivo del acta | Seleccione PDF, JPG o PNG |
| Archivo rechazado | Tipo no admitido o más de 20 MB | Use un formato permitido y reduzca el tamaño |
| Logo rechazado | Nombre distinto, formato diferente de SVG o más de 2 MB | Use exactamente `Logo_MDUnion.svg` o `Logo_blanco.svg`, según la tarjeta |
| Acta duplicada | Ya existe el número/año o CUI | Busque el acta existente; no vuelva a guardar |
| Motivo obligatorio | Se intentó anular sin justificar | Registre el motivo antes de confirmar |
| Persona no se elimina | Tiene actas vinculadas | Revise sus relaciones; no fuerce la eliminación |
| Fila `ERROR` en importación | Datos incompletos o inválidos | Corrija solo la fila indicada y genere un nuevo archivo |

> **Captura pendiente — Figura 7.1.** Formulario real con campos obligatorios señalados, sin datos personales.  

> **Captura pendiente — Figura 7.2.** Alerta real de validación o duplicidad obtenida con datos de prueba autorizados.

### 7.2. Mensajes de error del sistema o pérdida de conexión

| Situación | Causa posible | Procedimiento de atención |
|---|---|---|
| No abre la aplicación | Red o servicio | Verifique la conexión municipal y reporte; no cambie configuraciones técnicas |
| Sesión volvió al login | Expiración | Ingrese y compruebe si la operación anterior terminó |
| 401 / sesión no válida | Sesión ausente o expirada | Inicie sesión nuevamente |
| Acceso denegado / 403 | Rol o permiso | Solicite revisión al ADMIN; no use otra cuenta |
| Dashboard no carga | Pérdida de conexión o API | Recargue una vez y reporte fecha/hora si persiste |
| Importación se corta | Tamaño, tiempo de espera o servicio | Revise si procesó, conserve el reporte y no repita a ciegas |
| Exportación falla | Error temporal o filtros | Reintente una vez y entregue los filtros a soporte |
| Ciudadano no verifica | Número, URL o servicio | Revise el número impreso y reporte URL/hora |
| Backup no descarga | Permiso o servicio | No intente restaurar; contacte al área técnica |

#### 7.2.1. Si falla al guardar

1. No pulse **Guardar** o **Registrar** repetidamente.
2. Espere unos segundos.
3. Regrese al listado correspondiente: Personas, Actas o Solicitudes.
4. Busque el registro con DNI, código, folio, CUI o número de trámite.
5. Si el registro aparece, la operación terminó y no debe repetirla.
6. Repita el registro únicamente cuando confirmó que no existe.

#### 7.2.2. Si falla una importación

1. No inicie otro lote.
2. Revise si la barra sigue avanzando o si apareció el resumen final.
3. Si no hay resumen, abra Registro de Actas y revise una muestra del lote.
4. Reintente únicamente filas `ERROR` o filas confirmadas como no procesadas.

#### 7.2.3. Si falla una exportación

1. Espere hasta que desaparezca el mensaje de generación.
2. Revise la carpeta **Descargas** del equipo.
3. Si el archivo no existe, conserve los mismos filtros y reintente una sola vez.

#### 7.2.4. Si la sesión vuelve al login

1. Inicie sesión nuevamente.
2. Abra el módulo donde estaba trabajando.
3. Busque el registro antes de repetir la última acción.

Repetir una operación sin verificar puede producir duplicados o dificultar la revisión.

> **Captura pendiente — Figura 7.3.** Mensaje real de pérdida de conexión o error de carga.  

> **Captura pendiente — Figura 7.3-A.** Consulta del listado para confirmar si una operación interrumpida terminó.

> **Captura pendiente — Figura 7.4.** Mensaje real de acceso denegado para un perfil sin permiso.

---

## 8. Preguntas Frecuentes (FAQ) y Soporte

### 8.1. Respuestas a las consultas funcionales más frecuentes

**¿Puedo recuperar mi contraseña desde el login?**  
No. La versión actual no ofrece recuperación automática. Solicite el cambio a un ADMIN por el canal institucional.

**¿Por qué no veo Usuarios, Auditoría, Backup BD o Configuración?**  
Esas opciones corresponden al perfil ADMIN.

**¿Por qué el logo no cambió después de reemplazarlo?**<br>
Actualice la página. Si continúa la versión anterior, comuníquelo al encargado de la Oficina de Informática indicando cuál de los dos logos reemplazó y la hora aproximada.

**¿Por qué no puedo editar, anular o eliminar?**  
El perfil REGISTRADOR necesita permisos específicos. Solicite al ADMIN la revisión de su cuenta.

**¿Qué hago si no sé si un registro se guardó?**  
No repita inmediatamente la operación. Busque primero la persona, el acta o la solicitud.

**¿Los reportes se generan en PDF o CSV?**  
No. Los reportes tabulares disponibles se descargan en Excel `.xlsx`. Las vistas imprimibles y los documentos digitalizados son funciones diferentes.

**¿Puedo cargar un CSV o descargar una plantilla de importación?**  
No. La importación acepta `.xlsx` o `.xls`; la plantilla descargable no está disponible actualmente.

**¿Qué significa homonimia?**  
Son personas distintas con nombres iguales o similares. Revise DNI, fecha, acta física y demás datos antes de seleccionar.

**¿Qué estados utiliza el sistema?**

| Objeto | Estados |
|---|---|
| Acta | ACTIVO, OBSERVADO, ANULADO |
| Solicitud | PENDIENTE, ATENDIDO, ANULADO |
| Importación | OK, OMITIDO, OMITIDO_DOC, ERROR |
| Usuario | Activo o inactivo |

La aplicación no incorpora un botón de ayuda ni un centro de soporte interno en la versión actual. Consulte este manual.

### 8.2. Canales de atención y soporte

| Canal | Dato institucional |
|---|---|
| Área responsable | Oficina de Informática |
| Contacto funcional o técnico | Coordinar directamente con el encargado de la Oficina de Informática |
| Correo, anexo, mesa de ayuda y horario | Solicitar al encargado de la Oficina de Informática los datos institucionales vigentes |

Al reportar un problema, entregue:

1. fecha y hora;
2. usuario y rol, **sin contraseña**;
3. módulo o pantalla;
4. acción y botón pulsado;
5. mensaje literal;
6. captura ocultando datos que no sean necesarios;
7. filtros utilizados;
8. número de acta, solicitud o constancia cuando corresponda;
9. si es importación, reporte de errores y nombres de archivos;
10. si el problema comenzó después de un cambio conocido.

Reglas de seguridad:

- use su cuenta personal y cierre sesión al terminar;
- bloquee el equipo al alejarse;
- no comparta contraseña, cookies ni capturas con datos sensibles;
- no descargue reportes o backups en equipos personales;
- no envíe archivos con datos personales por canales no autorizados;
- informe accesos o cambios sospechosos.

Para red, certificado, backup, API o servidores, el personal técnico consulta el **Manual Técnico**, secciones 2.4, 5, 6, 7 y 9.

---

**Fin del Manual de Usuario — versión 1.0.0**
