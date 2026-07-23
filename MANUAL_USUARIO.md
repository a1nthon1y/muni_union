# Manual de Usuario — Sistema de Registro Civil
**Municipalidad Distrital de La Unión**
Versión 1.1.0 | Julio 2026

---

## 1. Introducción

El Sistema de Registro Civil permite registrar, consultar y digitalizar actas de nacimiento, matrimonio y defunción. También permite atender solicitudes de copias certificadas.

Este manual está dirigido al personal que utiliza el sistema en la municipalidad. Cada sección indica **dónde ingresar**, **qué acción realizar** y **qué resultado esperar**.

**Acceso al sistema:** Ingresar desde cualquier navegador en la red interna de la municipalidad:
```
https://[IP del servidor]
```

---

## 2. Roles de usuario

| Rol | Qué puede hacer |
|---|---|
| **Administrador** | Acceso total: usuarios, auditoría, todas las operaciones |
| **Operador** | Digitalización, personas, actas, solicitudes (según permisos asignados) |

---

## 3. Inicio de sesión

1. Abrir el navegador e ingresar la dirección del sistema.
2. En la pantalla de login, ingresar **usuario** y **contraseña**.
3. Hacer clic en **Ingresar**.
4. Al ingresar exitosamente se muestra el **Dashboard**.

> Si la sesión expira automáticamente, el sistema redirige al login. Las credenciales se mantienen activas por 1 hora; el sistema las renueva automáticamente mientras esté en uso.

**Cerrar sesión:** Hacer clic en el ícono de usuario (esquina superior derecha) → **Cerrar sesión**.

---

## 4. Dashboard

La pantalla principal muestra:

- **Tarjetas de resumen:** Total de actas registradas, ciudadanos, solicitudes pendientes y atendidas del mes.
- **Gráfico de evolución:** Actas registradas por mes (últimos 6 meses), separadas por tipo.
- **Gráfico de solicitudes:** Distribución por estado (Pendiente / Atendido / Anulado).

---

## 5. Módulo de Actas

### 5.1 Ver listado de actas

Menú → **Actas**

La tabla muestra todas las actas activas. Se puede:
- **Buscar** por nombre, DNI o número de acta (campo de búsqueda superior).
- **Filtrar** por tipo (Nacimiento / Matrimonio / Defunción), año, estado.
- **Paginar** con los controles inferiores.
- **Exportar** a Excel con el botón correspondiente.

### 5.2 Registrar nueva acta

1. Clic en **Nueva Acta**.
2. Seleccionar el **tipo** (Nacimiento, Matrimonio o Defunción).
3. Seleccionar el **modo de numeración:**
   - **Libro Clásico:** ingresar libro y número. El sistema sugiere el siguiente número disponible automáticamente.
   - **CUI (RENIEC):** ingresar el código CUI directamente.
4. Completar los datos del **titular** (buscar ciudadano existente o crear nuevo).
5. Para **Matrimonio:** completar también los datos del cónyuge (obligatorio).
6. Ingresar la **fecha del acta** y observaciones si corresponde.
7. Clic en **Guardar**.

### 5.3 Ver detalle de un acta

Hacer clic en cualquier fila de la tabla → se abre el panel lateral con toda la información.

Desde el detalle se puede:
- **Imprimir / generar PDF:** botón **Imprimir** → se abre una ventana con el documento oficial listo para imprimir o guardar como PDF.
- **Ver documento digitalizado:** si el acta tiene PDF adjunto, botón **Ver Acta**.
- **Editar:** botón **Editar Acta** (requiere permiso).

### 5.4 Editar un acta

Solo usuarios con permiso de modificación pueden editar. Se pueden modificar todos los campos excepto el tipo de acta.

### 5.5 Anular un acta

1. En el listado, buscar el acta → menú de acciones (⋮) → **Anular**.
2. Ingresar el **motivo de anulación** (obligatorio).
3. Confirmar.

El acta queda en estado **ANULADO** y el motivo se agrega a las observaciones. No se elimina físicamente.

### 5.6 Reactivar un acta anulada (solo Administrador)

Menú de acciones → **Reactivar**. El acta vuelve a estado ACTIVO.

---

## 6. Módulo de Digitalización

Menú → **Digitalización**

Permite adjuntar archivos PDF o imagen a actas existentes que aún no tienen documento digital.

1. Buscar el acta por número o nombre.
2. Seleccionar el archivo desde el equipo.
3. Clic en **Subir documento**.

**Formatos y límite:** PDF, JPG o PNG; máximo **20 MB por archivo**.

> Si se sube un nuevo documento a un acta que ya tiene archivo, el documento anterior se reemplaza. Verificar el archivo antes de confirmar.

---

## 7. Módulo de Personas (Ciudadanos)

Menú → **Personas**

Registro de ciudadanos del distrito. Cada acta está vinculada a uno o más ciudadanos.

### Registrar nueva persona
1. Clic en **Nueva Persona**.
2. Completar: tipo de documento, número, nombres, apellidos, sexo, fecha de nacimiento, teléfono, dirección.
3. **Guardar**.

> Antes de crear una persona, buscarla por DNI y por nombres. Para recién nacidos sin DNI, seleccionar el tipo de documento **Sin documento**. Si el sistema muestra una coincidencia sin DNI, no asumir que es la misma persona: verificar el acta física y solicitar revisión al administrador si hay duda.

### Buscar persona
Usar el campo de búsqueda: acepta nombre completo, apellidos o DNI. La búsqueda tolera errores tipográficos menores.

---

## 8. Módulo de Solicitudes

Menú → **Trámites**

Gestiona las solicitudes de copias certificadas que presentan los ciudadanos.

### 8.1 Nueva solicitud

1. Clic en **Nueva Solicitud**.
2. Buscar el **solicitante** por DNI. Si no existe, completar sus datos.
3. Seleccionar el **tipo de solicitud** (ej. Copia Certificada).
4. Agregar las **actas** solicitadas: buscar por número o nombre, indicar cantidad y precio unitario.
5. **Guardar**.

La solicitud queda en estado **PENDIENTE**.

### 8.2 Atender una solicitud

Cuando el ciudadano recoge su documento y paga:
1. Buscar la solicitud en el listado.
2. Clic en **Atender** → confirmar.

La solicitud pasa a estado **ATENDIDO**.

### 8.3 Imprimir Constancia de Trámite

Desde el detalle de la solicitud → botón **Imprimir Constancia**.

Se genera un documento oficial con:
- Número de constancia (ej. `N° 000001`)
- Datos del solicitante
- Detalle de actas solicitadas, cantidades y precios
- Total pagado
- Espacio para firmas
- **URL de verificación pública** al pie del documento

### 8.4 Anular una solicitud

Menú de acciones → **Anular** → ingresar motivo → confirmar.

---

## 9. Verificación de constancias (ciudadano)

El ciudadano que recibe una Constancia de Trámite puede verificar su autenticidad desde cualquier lugar:

1. Abrir el navegador e ingresar la URL indicada al pie de la constancia:
   ```
   https://verificar.muniunion.gob.pe/verificar/000001
   ```
   O ingresar directamente a `https://verificar.muniunion.gob.pe/verificar` y escribir el número.

2. El sistema muestra si la constancia es **válida** (verde) o **no encontrada** (rojo).

> Esta verificación **no requiere login** y está disponible desde cualquier red.

---

## 10. Módulo de Importación masiva

Menú → **Importación** (Administrador)

Permite cargar actas históricas en lote desde una plantilla Excel. Es una operación exclusiva del Administrador; antes de iniciar, revisar que el Excel y los documentos correspondan al mismo lote.

### Antes de importar

1. Descargar la **plantilla oficial** desde la pantalla de Importación.
2. Usar solo archivos **`.xlsx` o `.xls`**. No se admiten archivos CSV.
3. Completar los campos obligatorios de cada fila:
   - `nombres`, `apellido_paterno`, `apellido_materno`
   - `tipo_acta`
   - `fecha_acta`
   - `libro` y `numero_acta`, salvo que se use CUI
4. Registrar `sexo` únicamente como **M** o **F**. Una letra distinta hace que esa fila quede en error.
5. Usar una fecha válida para `fecha_acta`, por ejemplo `2026-07-22` o `22/07/2026`.
6. Para nacimientos sin DNI, dejar el DNI vacío y registrar **Sin documento** como tipo de documento.

> **Importante sobre ciudadanos sin DNI:** no se debe asumir que dos personas con el mismo nombre y fecha de nacimiento son la misma persona. Si hay una coincidencia dudosa, conservar el acta física y solicitar revisión antes de continuar con nuevos lotes.

### Preparar el ZIP de documentos (opcional)

El ZIP puede contener PDFs, JPG o PNG. Para que un documento se vincule:

- La columna `nombre_archivo_pdf` debe tener exactamente el nombre del archivo, por ejemplo `NACIMIENTO_001.pdf`.
- Si se usa `carpeta_ruta`, debe coincidir con la estructura dentro del ZIP.

Ejemplo:

```text
Excel
nombre_archivo_pdf = NACIMIENTO_001.pdf
carpeta_ruta       = nacimientos/libro_1

ZIP
nacimientos/libro_1/NACIMIENTO_001.pdf
```

Si los archivos tienen nombres únicos, el sistema también puede encontrarlos por nombre. Si hay nombres repetidos, `carpeta_ruta` es obligatoria para evitar vincular el documento equivocado.

### Pasos para importar

1. Seleccionar el Excel preparado.
2. Seleccionar el ZIP de documentos si corresponde.
3. Revisar que los archivos sean los correctos.
4. Clic en **Importar**.
5. Mantener abierta la pantalla hasta que se muestre el resumen. Los lotes con muchos documentos pueden tardar hasta **10 minutos**.
6. No pulsar Importar nuevamente mientras el proceso esté en curso ni inmediatamente después de un mensaje de tiempo de espera.

### Resultados de la importación

| Resultado | Qué significa | Qué debe hacer el usuario |
|---|---|---|
| **OK** | El acta fue creada correctamente. | Verificar una muestra de registros y documentos. |
| **OMITIDO** | El acta ya existía. No se creó una copia. | Revisar el mensaje; no volver a cargar la misma fila sin corregir algo. |
| **OMITIDO_DOC** | El acta ya existía sin documento y el PDF/imagen fue vinculado. | Abrir el acta y usar **Ver Acta** para confirmar el archivo. |
| **ERROR** | La fila no fue registrada. El resumen muestra el motivo. | Corregir solo las filas con error y volver a importarlas. |

### Si una fila sale con ERROR

1. Leer el mensaje de la fila: indica el campo que debe corregirse.
2. Corregir la fila en un Excel nuevo o en una copia del Excel original.
3. Si esa fila tenía documento, incluir también su PDF/imagen en el ZIP del reintento.
4. Importar únicamente las filas que fallaron.

> No borrar las actas que sí se registraron. No volver a importar un ZIP completo solo por una fila fallida, salvo que se haya verificado que todas las actas del lote están sin documento.

**Límites:** máximo **30.000 filas** por lote y **500 MB por archivo** cargado. Para lotes históricos grandes, se recomienda empezar con una prueba de 5 a 10 filas.

---

## 11. Módulo de Reportes

Menú → **Reportes** (Administrador)

Muestra estadísticas en el Dashboard. Incluye:
- Evolución mensual de actas por tipo (últimos 6 meses).
- Solicitudes por estado.
- Total de ingresos por solicitudes atendidas.

---

## 12. Módulo de Auditoría

Menú → **Auditoría** (solo Administrador)

Registro de todas las operaciones realizadas en el sistema:
- Quién hizo la acción (usuario).
- Qué operación (crear, editar, eliminar, login, etc.).
- En qué registro.
- Desde qué IP.
- Cuándo.

Se puede filtrar por usuario, operación, módulo y rango de fechas. Se puede exportar a Excel.

---

## 13. Módulo de Usuarios

Menú → **Usuarios** (solo Administrador)

### Crear usuario
1. Clic en **Nuevo Usuario**.
2. Completar: nombre, apellidos, nombre de usuario, contraseña, rol.
3. Para usuarios con rol **Operador**, configurar los permisos específicos:
   - Puede anular actas
   - Puede eliminar actas
   - Puede modificar actas
   - Puede eliminar personas
   - Puede modificar personas
4. **Guardar**.

### Editar / desactivar usuario
- Clic en el ícono de edición en la fila del usuario.
- Para desactivar sin eliminar: desmarcar **Activo**.

---

## 14. Cambio de contraseña

Desde el menú de usuario (esquina superior derecha) → **Configuración** → cambiar contraseña.

> Se recomienda cambiar la contraseña inicial `123456` del usuario administrador inmediatamente al primer ingreso.

---

## 15. Preguntas frecuentes

**¿Puedo recuperar un acta eliminada?**
Las actas nunca se borran permanentemente. Si fue anulada, puede reactivarse (solo Administrador). Contactar al administrador del sistema.

**¿Qué pasa si el sistema no carga?**
Verificar conexión a la red interna de la municipalidad. Si el problema persiste, contactar al área de sistemas.

**¿Cómo imprimo el documento de un acta?**
Abrir el detalle del acta → botón **Imprimir** → en la ventana que se abre, usar Ctrl+P o el botón RE-IMPRIMIR.

**¿Cuántos usuarios pueden usar el sistema al mismo tiempo?**
El sistema permite trabajo simultáneo. Si se percibe lentitud, guardar el trabajo en curso y comunicarlo al administrador.

**¿Dónde están guardados los archivos digitalizados?**
Se guardan de forma segura en el servidor de la municipalidad. El personal usuario no debe mover, renombrar ni eliminar archivos directamente desde el servidor.

**¿Qué hago si una importación muestra “Error inesperado”?**
No volver a cargar el mismo lote inmediatamente. Esperar unos minutos y revisar si las actas ya aparecen en el sistema. Si no aparecen, guardar una captura del mensaje y comunicarla al administrador junto con el Excel y ZIP usados.
