# Manual de Usuario — Sistema de Registro Civil
**Municipalidad Distrital de La Unión — Piura, Perú**  
Versión 1.3.0 | Julio 2026

---

## A quién va dirigido este manual

Este documento es para el personal que **usa el sistema día a día** y para quien **administra las cuentas y la operación** dentro de la municipalidad (administrador de aplicación).

No hace falta ser programador. Cuando aparezca un término técnico, se explica en lenguaje simple.

---

## 1. Qué es el sistema

El **Sistema de Registro Civil** es una aplicación web (se abre en el navegador, como una página de internet) que permite:

- Registrar y consultar **actas** de nacimiento, matrimonio y defunción.
- Registrar **personas** (ciudadanos) vinculadas a esas actas.
- Adjuntar el **documento digitalizado** (PDF o imagen) de cada acta.
- Atender **solicitudes** (trámites) de copias certificadas.
- Que el ciudadano **verifique** una constancia sin necesidad de ingresar al sistema interno.
- Que el administrador haga **copias de seguridad**, **importaciones masivas** y **configuración** del enlace de verificación.

**Dirección de acceso en producción (red municipal):**

```
https://172.16.3.21
```

Use Google Chrome, Microsoft Edge o Mozilla Firefox actualizados.

> La primera vez el navegador puede avisar que el certificado de seguridad no es de una empresa conocida. En la red interna de la municipalidad eso es esperado: puede continuar de forma segura a esa dirección.

### Usuario administrador inicial

| Campo | Valor |
|---|---|
| Usuario | `aespinoza` |
| Contraseña | `123456` |

**Importante:** cambie esta contraseña en el primer ingreso. Los demás usuarios (operadores de ventanilla, etc.) los crea el administrador desde el menú **Usuarios**.

---

## 2. Roles (quién puede hacer qué)

| Rol | Significado | Qué puede hacer |
|---|---|---|
| **Administrador** | Responsable del sistema dentro de la municipalidad | Todo: usuarios, auditoría, backup, configuración, importación masiva y operación normal |
| **Operador** | Personal de registro / ventanilla | Personas, actas, digitalización y solicitudes, según los permisos que le asigne el administrador |

El administrador puede, por cada operador, permitir o bloquear acciones sensibles como **anular**, **eliminar** o **modificar** actas y personas.

---

## 3. Cómo iniciar sesión

1. Abra el navegador.
2. Escriba la dirección `https://172.16.3.21` y pulse Enter.
3. Escriba su **usuario** y **contraseña**.
4. Pulse **Ingresar**.
5. Verá la pantalla principal llamada **Dashboard** (tablero de resumen).

Si deja el sistema mucho tiempo sin usarlo, puede pedirle de nuevo el login. Eso es normal por seguridad.

**Cerrar sesión:** en la esquina superior derecha, ícono de usuario → **Cerrar sesión**.

---

## 4. Dashboard (pantalla principal)

Es la primera pantalla después del login. Muestra un resumen para saber cómo va el trabajo:

- Cantidad de actas y ciudadanos registrados.
- Solicitudes pendientes y atendidas.
- Gráficos de evolución (últimos meses).

No se registran actas desde aquí; solo se consulta el resumen.

---

## 5. Actas

Menú lateral → **Actas**

Una **acta** es el registro oficial (nacimiento, matrimonio o defunción) con su número, año, fecha y persona(s) involucrada(s).

### 5.1 Buscar y filtrar (también sirve para exportar)

Use los campos de arriba de la tabla. Lo que filtre aquí es lo mismo que se exporta a Excel.

| Campo | Cómo usarlo |
|---|---|
| Buscar por DNI o nombres | Escriba parte del nombre o DNI del titular (o cónyuge en matrimonio) |
| Código o folio | Si escribe el código completo, por ejemplo `NAC-L1-1`, busca **exactamente** ese. Si escribe solo `1`, busca el folio **1** (no trae el 10, 11, 100…) |
| Libro | Número de libro, por ejemplo `2` o `L2` |
| Año / Tipo / Fechas | Acotan el listado |

### 5.2 Registrar una acta nueva

1. Pulse **Nueva Acta**.
2. Elija el tipo: Nacimiento, Matrimonio o Defunción.
3. Elija el modo de numeración:
   - **Libro clásico:** libro + número (el sistema puede sugerir el siguiente número).
   - **CUI:** código de RENIEC, cuando corresponda.
4. Busque o cree a la **persona titular**.
5. En matrimonio, complete también al **cónyuge** (obligatorio).
6. Indique la **fecha del acta** y observaciones si hace falta.
7. Pulse **Guardar**.

### 5.3 Ver, imprimir y documento digital

En el detalle del acta puede:

- Ver todos los datos.
- **Imprimir** el formato del sistema (se abre una vista lista para imprimir o guardar).
- **Ver Acta** si ya tiene PDF/imagen adjunto.
- **Editar**, si su usuario tiene permiso.

### 5.4 Anular y reactivar

- **Anular:** menú de acciones (⋮) → Anular → escriba el **motivo** (obligatorio). El acta queda marcada como ANULADA; no desaparece.
- **Reactivar:** solo el administrador puede volver a dejarla activa.

---

## 6. Digitalización (adjuntar el PDF o imagen)

Menú → **Digitalización**

Sirve para subir el archivo escaneado del acta física.

1. Busque el acta.
2. Elija un archivo **PDF, JPG o PNG** (máximo **20 MB**).
3. Pulse **Subir documento**.

Si el acta ya tenía archivo, el nuevo **reemplaza** al anterior. Revise bien antes de confirmar.

---

## 7. Personas (ciudadanos)

Menú → **Personas**

Aquí se guardan los datos de las personas que aparecen en las actas.

**Buenas prácticas:**

- Antes de crear, busque por DNI y por nombres.
- Para recién nacidos sin DNI use el tipo **Sin documento**.
- Si el sistema muestra una posible coincidencia (mismo nombre/fecha) pero sin DNI, **no asuma** que es la misma persona: revise el acta física.

---

## 8. Solicitudes (trámites)

Menú → **Solicitudes**

Una **solicitud** es el trámite del ciudadano que pide copia certificada u otro servicio similar.

1. **Nueva Solicitud** → busque al solicitante → agregue las actas pedidas → guarde (queda **PENDIENTE**).
2. Cuando el ciudadano recoja el documento, márquela como **Atendida**.
3. Desde el detalle puede **Imprimir la Constancia**. Al pie aparece un enlace para que el ciudadano verifique el documento.

---

## 9. Verificación pública (para el ciudadano)

El ciudadano **no necesita usuario ni contraseña**. Con el enlace de la constancia puede comprobar si el documento es auténtico.

En producción actual (por IP de la municipalidad):

```
https://172.16.3.21/verificar
https://172.16.3.21/verificar/000001
```

También puede abrir la primera dirección y escribir solo el número de constancia.

El **administrador** define qué dirección se imprime en las constancias nuevas (menú **Configuración**). Por defecto es la IP `https://172.16.3.21`. Si más adelante hay un dominio de internet, se cambia ahí.

---

## 10. Importación masiva (solo administrador)

Sirve para cargar muchas actas históricas de una vez desde un archivo Excel (y opcionalmente un ZIP con los PDF/imágenes).

- Formatos Excel: `.xlsx` o `.xls` (no CSV).
- Puede adjuntar un ZIP con documentos.
- Límites prácticos: hasta **30.000 filas** y **500 MB** por archivo.
- El proceso puede tardar varios minutos (hasta unos **10 minutos**). No pulse Importar otra vez mientras espera.
- Resultados por fila: **OK** (creada), **OMITIDO** (ya existía), **OMITIDO_DOC** (se pegó el documento a un acta ya existente), **ERROR** (hay que corregir esa fila).

Si hay ERROR: corrija solo esas filas y vuelva a importarlas con su documento. No borre lo que sí se cargó bien.

---

## 11. Copia de seguridad / Backup (solo administrador)

Menú → **Backup BD**

Una **copia de seguridad** (backup) es un archivo con la información de la base de datos, por si hay que recuperarla ante un fallo.

1. Revise la información que muestra la pantalla (tablas, tamaño, método).
2. Pulse **Descargar Backup**.
3. Guarde el archivo `.sql` en un lugar seguro (disco externo o carpeta protegida). No lo envíe por canales inseguros.

El área técnica también puede generar backups desde el servidor de base de datos (`172.16.3.23`). Eso está explicado en el **Manual Técnico**.

---

## 12. Configuración de la URL de verificación (solo administrador)

Menú → **Configuración**

Aquí se indica la **dirección base** que se imprime en las constancias para que el ciudadano verifique.

| Situación | Valor a usar |
|---|---|
| Producción actual (por defecto) | `https://172.16.3.21` |
| Cuando exista dominio público | Ejemplo: `https://verificar.muniunion.gob.pe` |

No ponga barra al final (`/`).

> Guardar esta URL **no configura sola** el internet ni el servidor Nginx. Si van a usar un dominio nuevo, el técnico debe preparar DNS, certificado y Nginx. Usted solo define qué enlace se imprime en las constancias.

---

## 13. Usuarios (solo administrador)

Menú → **Usuarios**

1. **Nuevo Usuario** → nombres, apellidos, usuario, contraseña y rol.
2. Si es **Operador**, marque qué puede hacer (anular, eliminar, modificar…).
3. Para dejar de usar una cuenta sin borrarla: desmarque **Activo**.

Usuario inicial del sistema: `aespinoza` / `123456` → cambiar al primer uso.

---

## 14. Auditoría (solo administrador)

Menú → **Auditoría**

Es el historial de “quién hizo qué”: crear, editar, anular, iniciar sesión, etc., con fecha e IP. Sirve para control interno. Se puede filtrar y exportar.

---

## 15. Cambiar la propia contraseña

Ícono de usuario (arriba a la derecha) → opción para cambiar contraseña. Use una clave que no sea fácil de adivinar y no la comparta.

---

## 16. Preguntas frecuentes

**No carga el sistema**  
Compruebe que está en la red de la municipalidad y que la dirección sea exactamente `https://172.16.3.21`. Si sigue fallando, avise al área de sistemas.

**El ciudadano no puede verificar**  
Pruebe `https://172.16.3.21/verificar` desde la red. Confirme que la constancia tenga el número correcto. Si usan dominio nuevo, el administrador debe haberlo guardado en **Configuración** y el técnico debe tener Nginx/DNS listos.

**La importación dice error inesperado o se corta**  
Espere unos minutos y revise si las actas ya aparecen. No vuelva a cargar el mismo lote de inmediato. Si no aparecen, guarde captura + Excel/ZIP y avise al administrador técnico.

**¿Se pierde un acta anulada?**  
No. Queda marcada como anulada y el administrador puede reactivarla si corresponde.
