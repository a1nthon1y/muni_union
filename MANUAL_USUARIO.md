# Manual de Usuario — Sistema de Registro Civil
**Municipalidad Distrital de La Unión**
Versión 1.2.0 | Julio 2026

---

## 1. Introducción

El Sistema de Registro Civil permite registrar, consultar y digitalizar actas de nacimiento, matrimonio y defunción. También permite atender solicitudes de copias certificadas.

Este manual está dirigido al personal municipal. Cada sección indica **dónde ingresar**, **qué acción realizar** y **qué resultado esperar**.

**Acceso al sistema (producción actual):**

```
https://172.16.3.21
```

Navegadores recomendados: Google Chrome, Microsoft Edge o Mozilla Firefox.

**Usuario administrador inicial**

| Campo | Valor |
|---|---|
| Usuario | `aespinoza` |
| Contraseña | `123456` |

Cambiar esta contraseña en el primer ingreso. Los demás usuarios los crea el administrador desde el módulo **Usuarios**.

---

## 2. Roles de usuario

| Rol | Qué puede hacer |
|---|---|
| **Administrador** | Acceso total: usuarios, auditoría, backup, configuración, importación y todas las operaciones |
| **Operador** | Digitalización, personas, actas y solicitudes según permisos asignados |

---

## 3. Inicio de sesión

1. Abrir el navegador e ingresar `https://172.16.3.21`.
2. Ingresar **usuario** y **contraseña**.
3. Clic en **Ingresar**.
4. Al ingresar se muestra el **Dashboard**.

> Si la sesión expira, el sistema redirige al login. Mientras se use el sistema, la sesión se renueva automáticamente.

**Cerrar sesión:** ícono de usuario (esquina superior derecha) → **Cerrar sesión**.

---

## 4. Dashboard

- Tarjetas de resumen: actas, ciudadanos, solicitudes pendientes y atendidas.
- Gráfico de evolución de actas (últimos 6 meses).
- Gráfico de solicitudes por estado.

---

## 5. Módulo de Actas

Menú → **Actas**

### 5.1 Buscar y filtrar

Use los filtros superiores. La exportación Excel usa los mismos filtros visibles.

| Campo | Comportamiento |
|---|---|
| Buscar por DNI o nombres | Búsqueda parcial por titular o cónyuge |
| Código o folio | Código completo (`NAC-L1-1`) = coincidencia exacta. Solo número (`1`) = folio exacto |
| Libro | Exacto: `2` o `L2` |
| Año / Tipo / Fechas | Filtran el listado y la exportación |

### 5.2 Registrar nueva acta

1. Clic en **Nueva Acta**.
2. Seleccionar tipo (Nacimiento, Matrimonio o Defunción).
3. Modo de numeración:
   - **Libro Clásico:** libro y número.
   - **CUI (RENIEC):** código CUI.
4. Completar titular (buscar o crear persona).
5. En Matrimonio, completar también el cónyuge.
6. Ingresar fecha del acta y observaciones.
7. **Guardar**.

### 5.3 Detalle, impresión y documento

Desde el detalle se puede:
- **Imprimir** el acta (luego Ctrl+P o Guardar como PDF).
- **Ver Acta** si tiene documento digitalizado.
- **Editar** (si tiene permiso).

### 5.4 Anular / reactivar

- **Anular:** menú ⋮ → Anular → motivo obligatorio.
- **Reactivar:** solo Administrador.

---

## 6. Módulo de Digitalización

Menú → **Digitalización**

1. Buscar el acta.
2. Seleccionar archivo PDF, JPG o PNG (máx. **20 MB**).
3. **Subir documento**.

Si el acta ya tenía documento, el nuevo archivo lo reemplaza.

---

## 7. Módulo de Personas

Menú → **Personas**

Antes de crear, buscar por DNI y por nombres. Para recién nacidos sin DNI usar **Sin documento**. Si aparece una coincidencia dudosa sin DNI, revisar el acta física antes de continuar.

---

## 8. Módulo de Solicitudes (Trámites)

Menú → **Solicitudes**

1. **Nueva Solicitud** → buscar solicitante → agregar actas → guardar (queda **PENDIENTE**).
2. **Atender** cuando el ciudadano recoge el documento.
3. **Imprimir Constancia** desde el detalle. Al pie aparece la URL de verificación pública.

---

## 9. Verificación de constancias (ciudadano)

En producción actual la verificación funciona por IP, sin login:

```
https://172.16.3.21/verificar
https://172.16.3.21/verificar/000001
```

También se puede escribir solo el número en la pantalla de verificación.

**URL por defecto del sistema:** `https://172.16.3.21` (configurada en menú **Configuración**).  
Cuando exista un dominio público, el administrador puede cambiarla; las nuevas constancias usarán esa URL. Mientras tanto, usar siempre la IP.

> La importación masiva de archivos grandes (hasta 500 MB) está habilitada en el servidor. Si una carga tarda, espere hasta 10 minutos y no reintente de inmediato.

---

## 10. Importación masiva (solo Administrador)

Menú → **Digitalización** → **Carga masiva** (o acceso de importación según menú).

- Archivos: `.xlsx` / `.xls` y ZIP opcional (PDF/JPG/PNG).
- Límites: 30.000 filas; 500 MB por archivo.
- Resultados: `OK`, `OMITIDO`, `OMITIDO_DOC`, `ERROR`.
- Esperar hasta 10 minutos. No reintentar de inmediato si aparece tiempo de espera.

Si una fila sale con ERROR: corregir solo esa fila y volver a importarla con su documento.

---

## 11. Backup de base de datos (solo Administrador)

Menú → **Backup BD**

1. Revisar tablas, tamaño y método (`pg_dump` completo o exportación de datos).
2. Clic en **Descargar Backup Ahora**.
3. Guardar el archivo `.sql` en un medio seguro.

El administrador técnico también puede generar backup desde la VM PostgreSQL (`172.16.3.23`). Ver Manual Técnico.

---

## 12. Configuración del dominio público (solo Administrador)

Menú → **Configuración**

Aquí se define la **URL base** impresa en las constancias:

- **Por defecto (producción):** `https://172.16.3.21`
- Futuro dominio público (ejemplo): `https://verificar.muniunion.gob.pe`

No agregue barra final. Después de guardar, las nuevas constancias usarán esa URL.

> Cambiar la URL en el sistema no configura sola el DNS ni Nginx. Si se usa un dominio nuevo, el área de sistemas debe actualizar Nginx, puertos 80/443 y certificados en `172.16.3.21` (detalle en Manual Técnico).

---

## 13. Usuarios (solo Administrador)

Menú → **Usuarios**

1. **Nuevo Usuario** → datos, rol y permisos.
2. Para Operador, configurar permisos de anular/eliminar/modificar.
3. Para desactivar: desmarcar **Activo**.

Usuario inicial: `aespinoza` / `123456` → cambiar contraseña al primer ingreso.

---

## 14. Auditoría (solo Administrador)

Menú → **Auditoría**

Registro de quién hizo qué operación, sobre qué registro, desde qué IP y cuándo. Se puede filtrar y exportar.

---

## 15. Cambio de contraseña

Menú de usuario (esquina superior derecha) → cambiar contraseña.

---

## 16. Preguntas frecuentes

**¿Cuál es la dirección del sistema?**  
`https://172.16.3.21`

**¿Dónde verifica el ciudadano su constancia?**  
`https://172.16.3.21/verificar` (o la URL impresa en la constancia).

**¿Cómo imprimo los manuales HTML?**  
Abrir `MANUAL_USUARIO.html` o `MANUAL_TECNICO.html` en el navegador y usar **Ctrl+P** → Guardar como PDF o Imprimir.

**¿Qué hago si una importación muestra “Error inesperado”?**  
No volver a cargar de inmediato. Esperar y revisar si las actas ya aparecen. Si no, avisar al administrador con captura, Excel y ZIP.

**¿Puedo recuperar un acta anulada?**  
Sí, el Administrador puede reactivarla. Las actas no se borran físicamente.
