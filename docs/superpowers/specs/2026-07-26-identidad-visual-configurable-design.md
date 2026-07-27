# Diseño: identidad visual configurable

**Fecha:** 26 de julio de 2026  
**Estado:** Aprobado para planificación  
**Sistema:** Registro Civil — Municipalidad Distrital de La Unión Leticia

## 1. Objetivo

Reemplazar el módulo que permitía editar una URL pública de verificación por un módulo administrativo para actualizar los dos logos institucionales utilizados por el sistema.

Los nombres y rutas públicas existentes se conservan:

- `/Logo_MDUnion.svg`: logo principal a color.
- `/Logo_blanco.svg`: logo para fondos oscuros.

Cuando un administrador carga una nueva imagen con el nombre canónico correspondiente, el archivo anterior se reemplaza y el cambio se refleja en login, menú lateral, portal público y documentos impresos.

## 2. Alcance

### Incluido

- Eliminar del Backend, Frontend, migraciones vigentes y manuales la capacidad de editar una URL, dominio o IP desde el sistema.
- Mantener las direcciones IP técnicas en el Manual Técnico porque forman parte de la arquitectura de las VMs, no de una configuración funcional.
- Incorporar carga, validación, reemplazo y consulta de los logos.
- Persistir los archivos en el volumen NFS ya montado en `/app/uploads`.
- Conservar los archivos estáticos actuales como respaldo cuando todavía no exista una versión personalizada.
- Mantener exactamente los nombres y rutas que ya consumen las pantallas.
- Evitar que navegador o proxy conserven una versión anterior después del reemplazo.
- Actualizar el Manual Técnico y el Manual de Usuario.

### Excluido

- Editor gráfico, recorte o conversión de imágenes.
- Más de dos variantes de logo.
- Personalización de colores, tipografía o nombre de la Municipalidad.
- Edición de DNS, certificados, Nginx, IP o dominio desde la aplicación.
- Eliminación de las IP técnicas necesarias para operar la infraestructura.

## 3. Reglas funcionales

1. Solo un usuario con rol ADMIN puede cargar logos.
2. La página muestra dos tarjetas independientes: logo principal y logo blanco.
3. Cada tarjeta presenta el nombre obligatorio, vista previa, fecha de modificación y acción de reemplazo.
4. Los archivos deben llamarse exactamente `Logo_MDUnion.svg` o `Logo_blanco.svg`, según la tarjeta.
5. Solo se acepta SVG de hasta 2 MB.
6. Antes de confirmar, la página indica:

   > Al cargar otro archivo con este mismo nombre, el logo anterior será reemplazado y el cambio se aplicará en todo el sistema.

7. Un reemplazo exitoso conserva la misma ruta pública.
8. Si la carga falla, el archivo anterior permanece disponible.
9. Si nunca se cargó una versión personalizada, se muestra el logo incluido actualmente en el Frontend.
10. La URL de una constancia se forma usando el origen actual del navegador; no existe un campo administrativo para editarla.

## 4. Arquitectura

### 4.1. Almacenamiento

El Backend utiliza el volumen existente `/app/uploads`, respaldado por NFS en la VM Storage. Los logos personalizados se guardan en:

```text
/app/uploads/configuracion/logos/
├── Logo_MDUnion.svg
└── Logo_blanco.svg
```

La escritura es atómica:

1. recibir en archivo temporal;
2. validar tamaño, nombre, MIME y contenido;
3. sanear el SVG;
4. escribir un archivo temporal dentro del directorio destino;
5. renombrarlo sobre el archivo canónico.

Si cualquier paso falla, se elimina el temporal y no se modifica el logo vigente.

### 4.2. Base de datos

`configuracion_sistema` conserva únicamente metadatos:

- `logo_principal`: ruta canónica y fecha de modificación.
- `logo_blanco`: ruta canónica y fecha de modificación.

La migración limpia deja de sembrar datos de URL. Una migración posterior idempotente retira únicamente el valor heredado de esa función e incorpora ambas claves de logos para instalaciones existentes, sin borrar futuras configuraciones no relacionadas.

### 4.3. Backend

Rutas propuestas:

| Método y ruta | Acceso | Función |
|---|---|---|
| `GET /api/configuracion/logos` | ADMIN | Estado, nombres, rutas y fechas para la página administrativa |
| `PUT /api/configuracion/logos/principal` | ADMIN | Reemplaza `Logo_MDUnion.svg` |
| `PUT /api/configuracion/logos/blanco` | ADMIN | Reemplaza `Logo_blanco.svg` |
| `GET /Logo_MDUnion.svg` | Público | Sirve el logo principal personalizado o responde 404 para activar el respaldo |
| `GET /Logo_blanco.svg` | Público | Sirve el logo blanco personalizado o responde 404 para activar el respaldo |

Las cargas usan `multipart/form-data` con un único campo `logo`.

La validación rechaza:

- nombre distinto del canónico;
- tamaño mayor a 2 MB;
- MIME distinto de `image/svg+xml`;
- documento que no contenga un elemento raíz `<svg>`;
- `DOCTYPE`, entidades XML, scripts, atributos de evento, URLs `javascript:` o referencias externas activas.

El Backend devuelve `Cache-Control: no-store, max-age=0` al servir logos.

### 4.4. Nginx

Nginx intercepta únicamente las dos rutas exactas. Primero consulta al Backend; si no existe un archivo personalizado, utiliza el Frontend como respaldo para servir los SVG incluidos en `public/`.

Las respuestas agregan encabezados de no caché. No se expone el directorio completo de configuración ni se habilita navegación de archivos.

### 4.5. Frontend

La página `/dashboard/configuracion` deja de contener campos de URL, dominio o IP. Presenta:

- encabezado **Identidad visual**;
- explicación del alcance global;
- tarjeta del logo principal;
- tarjeta del logo blanco;
- vista previa del archivo seleccionado;
- nombre requerido;
- tamaño máximo;
- advertencia de reemplazo;
- botón **Reemplazar logo** por tarjeta.

El servicio de configuración elimina `updateUrlVerificacion` y ofrece consulta/carga de logos.

Los componentes mantienen `/Logo_MDUnion.svg` y `/Logo_blanco.svg`. Los usos de `next/image` para estas rutas se marcan como no optimizados, de modo que el navegador consulte la ruta canónica y no una copia generada por Next.js.

`SolicitudPrintView` elimina la consulta de configuración de URL y construye la ruta de verificación con `window.location.origin`.

## 5. Flujo

```text
ADMIN selecciona SVG
  → Frontend valida nombre/tamaño
  → PUT multipart /api/configuracion/logos/{tipo}
  → auth + rol ADMIN
  → Backend valida y sanea SVG
  → reemplazo atómico en NFS
  → actualización de metadatos
  → respuesta con fecha y ruta canónica
  → Frontend renueva vista previa con parámetro temporal anticaché
  → toda la aplicación conserva la misma ruta pública del logo
```

## 6. Errores y seguridad

- `400`: nombre, formato, SVG o tamaño inválido.
- `401`: sesión ausente.
- `403`: usuario no administrador.
- `413`: archivo mayor al límite.
- `500`: error de almacenamiento o base de datos.

Los mensajes indican qué corregir y nunca incluyen rutas internas del servidor. La auditoría registra tipo de logo, usuario y resultado, pero no almacena el contenido del archivo.

El SVG se considera contenido activo y debe sanearse antes de persistirse. No basta con validar extensión o MIME.

## 7. Pruebas

### Backend

- ADMIN puede reemplazar cada logo.
- USER recibe `403`.
- Se rechaza nombre incorrecto.
- Se rechaza archivo mayor a 2 MB.
- Se rechazan SVG con script, eventos, entidades o referencias activas.
- Un error no elimina el logo anterior.
- El reemplazo conserva el nombre canónico.
- La ruta pública sirve el archivo vigente con no caché.
- La ausencia de archivo produce el comportamiento de respaldo.
- La migración deja únicamente las claves de identidad visual.

### Frontend

- La página no muestra controles de URL, dominio o IP.
- Cada tarjeta muestra nombre, restricciones y advertencia.
- La vista previa cambia al seleccionar un SVG válido.
- Los errores del Backend se muestran de forma accionable.
- Un reemplazo exitoso actualiza la vista previa.
- Las constancias usan `window.location.origin`.

### Integración

- El logo principal cambia en login, portal y documentos impresos.
- El logo blanco cambia en el menú expandido y contraído.
- Ambos logos sobreviven la recreación de contenedores.
- El portal público solo expone las dos rutas exactas.

## 8. Documentación

El Manual Técnico describirá almacenamiento, rutas, validaciones, Nginx, permisos, respaldo y pruebas. El Manual de Usuario explicará el procedimiento administrativo y la consecuencia de reemplazar un archivo con el mismo nombre.

Se eliminarán del catálogo funcional, API, base de datos y capturas todas las referencias a una función de edición de URL pública, dominio o IP.
