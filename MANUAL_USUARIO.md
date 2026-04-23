# Manual de Usuario — Sistema de Registro Civil
**Municipalidad Distrital de La Unión**
Versión 1.0.0 | Abril 2026

---

## 1. Introducción

El Sistema de Registro Civil (STDU) permite gestionar de forma digital los registros de nacimiento, matrimonio y defunción, así como las solicitudes de copias certificadas de los ciudadanos.

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
2. Seleccionar el archivo desde el equipo (PDF o imagen, máx. 25 MB).
3. Clic en **Subir documento**.

---

## 7. Módulo de Personas (Ciudadanos)

Menú → **Personas**

Registro de ciudadanos del distrito. Cada acta está vinculada a uno o más ciudadanos.

### Registrar nueva persona
1. Clic en **Nueva Persona**.
2. Completar: tipo de documento, número, nombres, apellidos, sexo, fecha de nacimiento, teléfono, dirección.
3. **Guardar**.

> Si ya existe una persona con el mismo nombre, el sistema lo advierte para evitar duplicados.

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

Permite cargar actas en lote desde archivos Excel/CSV, con PDFs adjuntos opcionales en un ZIP.

### Pasos
1. Descargar la **plantilla Excel** de ejemplo.
2. Completar los datos según el formato indicado.
3. (Opcional) Preparar un archivo ZIP con los PDFs, con los nombres indicados en la columna `nombre_archivo_pdf`.
4. Seleccionar el archivo Excel/CSV y el ZIP (opcional).
5. Clic en **Importar**.
6. El sistema procesa fila por fila y muestra un reporte con: OK, OMITIDO (duplicado) o ERROR por fila.

**Límite:** 30.000 filas por lote. Si supera ese número, dividir en archivos más pequeños (los duplicados se omiten automáticamente en sucesivas importaciones).

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
El sistema soporta múltiples usuarios concurrentes sin degradación del rendimiento.

**¿Dónde están guardados los archivos digitalizados?**
En el servidor de la municipalidad, dentro de la carpeta `uploads/` del sistema. Se recomienda realizar backups periódicos de esta carpeta junto con la base de datos.
