# Diseño: Manual de Usuario con lectura guiada

**Fecha:** 26 de julio de 2026  
**Estado:** Aprobado para planificación  
**Documento:** Manual de Usuario del Sistema de Registro Civil  
**Audiencia:** ADMIN, REGISTRADOR y personal municipal con poca experiencia en sistemas modernos

## 1. Objetivo

Ampliar el Manual de Usuario para que una persona sin experiencia previa en aplicaciones modernas pueda completar las operaciones habituales sin depender de conocimientos implícitos.

El manual explicará:

- qué control debe utilizar;
- qué dato debe escribir o seleccionar;
- qué resultado debe aparecer;
- cómo reconocer que una operación terminó;
- qué debe verificar antes de repetir una acción;
- cómo recuperarse de una pérdida de conexión;
- cómo utilizar, combinar y limpiar los filtros;
- cómo interpretar cada resultado de una importación.

El texto no calificará a los usuarios por edad. Utilizará expresiones respetuosas como **usuarios con poca experiencia digital**.

## 2. Alcance

### Incluido

- Ampliar `MANUAL_USUARIO.md` y regenerar `MANUAL_USUARIO.html`.
- Mantener la estructura institucional de ocho capítulos.
- Detallar el acceso por la red municipal y el salto de la advertencia del certificado.
- Detallar filtros de Actas, Personas, Solicitudes, Usuarios y Auditoría.
- Detallar las etapas y resultados de la importación masiva.
- Ampliar los procedimientos ante errores de conexión, sesiones vencidas y operaciones interrumpidas.
- Agregar marcadores para nuevas capturas sin cambiar los nombres de las figuras existentes.
- Actualizar `docs/manual-usuario/capturas/README.md`.
- Adaptar el generador HTML para admitir figuras complementarias con sufijos alfabéticos.

### Excluido

- Cambios en el Frontend, Backend, base de datos o despliegue.
- Cambios en el tamaño de letra o diseño general del HTML.
- Capturas reales; serán incorporadas posteriormente por el responsable del documento.
- Instrucciones técnicas de certificados, Nginx, DNS o servidores.
- Recomendar llamadas a la Oficina de Informática como parte del procedimiento normal para saltar la advertencia del navegador.

## 3. Estilo de redacción

Cada procedimiento seguirá esta secuencia:

1. **Dónde está:** menú, pantalla y control visible.
2. **Qué hacer:** una sola acción por paso.
3. **Qué escribir:** formato y ejemplo cuando corresponda.
4. **Qué debe aparecer:** resultado visible esperado.
5. **Antes de repetir:** consulta o verificación para evitar duplicados.
6. **Si no funciona:** recuperación segura y datos que deben conservarse.

Los nombres de botones, campos, estados y mensajes se escribirán exactamente como aparecen en la aplicación. No se utilizarán expresiones ambiguas como “configure lo necesario”, “procese el archivo” o “aplique el filtro”.

Las advertencias distinguirán visualmente:

- **Resultado esperado**
- **No vuelva a pulsar**
- **Revise antes de repetir**
- **Operación terminada**

## 4. Acceso y advertencia del navegador

La sección 2.1 incorporará el procedimiento **Saltar la advertencia del navegador**:

1. confirmar que el equipo está conectado a la red municipal;
2. comprobar que la barra de dirección muestre exactamente `https://172.16.3.21`;
3. pulsar **Configuración avanzada** o **Avanzado**, según el navegador;
4. pulsar **Continuar a 172.16.3.21** o el texto equivalente;
5. esperar la pantalla de inicio de sesión;
6. comprender que la advertencia puede aparecer nuevamente al usar otro navegador, otro equipo o una sesión nueva.

La instrucción no solicitará asistencia técnica. La única condición de seguridad será: si la dirección mostrada no es `172.16.3.21`, no continuar.

Se agregará el marcador:

- `figura-2-1a.png`: advertencia del navegador con **Avanzado** y **Continuar** identificados.

La figura complementaria conservará las rutas actuales de `figura-2-1.png` y `figura-2-2.png`.

## 5. Uso detallado de filtros

Cada módulo explicará que los filtros reducen la lista visible, pueden combinarse y también determinan el contenido exportado cuando existe **EXPORTAR**.

### 5.1. Actas

Se documentarán individualmente:

- **Buscar por DNI o Nombres:** admite DNI, nombre o apellido de la persona.
- **Código o folio:** busca el código completo, folio o CUI según el registro.
- **Libro:** corresponde únicamente al libro; no debe combinarse con CUI cuando el registro no tiene libro.
- **Año:** utiliza cuatro dígitos.
- **Tipo:** TODOS, NACIMIENTO, MATRIMONIO o DEFUNCIÓN.
- **Desde / Hasta:** filtra por rango de fechas.
- botón con flechas circulares: limpia todos los filtros.

Se incluirán ejemplos de una búsqueda simple y una combinada, además de la advertencia de limpiar filtros anteriores cuando un registro conocido no aparece.

Marcador nuevo:

- `figura-4-4a.png`: filtros de Actas identificados y botón para limpiarlos.

### 5.2. Personas

Se explicará:

- búsqueda por DNI completo;
- búsqueda por nombres o apellidos;
- actualización automática del listado mientras se escribe;
- limpieza con el botón de flechas circulares;
- exportación del resultado filtrado.

Marcador nuevo:

- `figura-4-7a.png`: buscador de Ciudadanos y control para limpiar.

### 5.3. Solicitudes

Se explicará:

- búsqueda por número de trámite, DNI o apellidos;
- fechas **Desde** y **Hasta**;
- estados TODOS, PENDIENTE, ATENDIDO y ANULADO;
- combinación de texto, fechas y estado;
- limpieza completa;
- exportación del resultado visible.

Marcador nuevo:

- `figura-4-10a.png`: filtros de Solicitudes y ejemplo de combinación.

### 5.4. Usuarios

Solo para ADMIN:

- búsqueda por DNI, nombre de usuario o nombres;
- limpieza del buscador;
- aclaración de que el buscador no cambia el estado de una cuenta.

Marcador nuevo:

- `figura-6-1a.png`: buscador de Gestión de Usuarios.

### 5.5. Auditoría

Solo para ADMIN:

- usuario;
- fecha inicial y fecha final;
- módulo: TODOS, ACTAS, USUARIOS, PERSONAS o SOLICITUDES;
- limpieza de todos los filtros;
- relación entre filtros, total mostrado y archivo exportado.

Marcador nuevo:

- `figura-6-5a.png`: filtros de Bitácora de Auditoría.

## 6. Importación masiva

La sección 4.5 se dividirá en estados comprensibles para el usuario.

### 6.1. Antes de iniciar

- confirmar Excel `.xlsx` o `.xls`;
- confirmar ZIP opcional `.zip`;
- revisar nombres de archivos;
- no cerrar la pestaña;
- no pulsar **INICIAR IMPORTACIÓN** dos veces.

### 6.2. Durante la importación

Se explicarán:

- mensaje **Procesando información**;
- porcentaje de progreso;
- espera sin actualizar ni cerrar la página;
- diferencia entre progreso de carga y resultado final;
- que llegar a 100 % no sustituye la revisión del resumen final.

### 6.3. Operación terminada

La importación se considera terminada únicamente cuando aparece el bloque de resultados con:

- **TOTAL FILAS**
- **ACTAS NUEVAS**
- **YA EXISTÍAN**
- **DOCS VINCULADOS**
- **ERRORES**

Se documentarán los posibles mensajes finales:

- importación completada sin errores;
- importación completada con documentos vinculados;
- importación completada parcialmente con errores.

### 6.4. Estado de cada fila

| Estado | Qué ocurrió | Qué debe hacer |
|---|---|---|
| `OK` | Se creó o procesó correctamente la persona y el acta | Revisar una muestra en Registro de Actas; no volver a importar la fila |
| `OMITIDO` | El acta ya existía | Leer el detalle y no crear un duplicado |
| `OMITIDO_DOC` | El acta ya existía sin documento y el sistema vinculó el archivo disponible | Abrir el acta y comprobar el documento |
| `ERROR` | La fila no pudo procesarse | Leer el número de fila y el mensaje, corregirla y preparar un Excel solo con errores |

Se explicará cómo usar **GENERAR REPORTE EXCEL** y **IR AL REGISTRO DE ACTAS**.

Marcadores nuevos:

- `figura-4-15a.png`: importación completada sin errores.
- `figura-4-15b.png`: importación parcial con incidencias y detalle por fila.

## 7. Pérdida de conexión y recuperación

La sección 7.2 incorporará procedimientos separados.

### Antes de guardar

- conservar los datos visibles;
- comprobar conexión;
- no recargar hasta revisar si puede copiar la información necesaria.

### Durante un guardado

1. no volver a pulsar inmediatamente;
2. esperar unos segundos;
3. abrir el listado del módulo;
4. buscar el registro;
5. repetir únicamente si se confirmó que no fue creado o actualizado.

### Durante una importación

1. no iniciar otro lote;
2. esperar si la barra continúa avanzando;
3. si la pantalla muestra error, conservar Excel, ZIP, hora y captura;
4. revisar Registro de Actas con los filtros adecuados;
5. generar un nuevo Excel solo con filas confirmadas como no procesadas o con `ERROR`.

### Durante una exportación

- esperar que desaparezca el indicador de generación;
- comprobar la carpeta de descargas;
- reintentar una sola vez con los mismos filtros.

### Sesión devuelta al login

- iniciar sesión nuevamente;
- consultar el listado antes de repetir la última operación.

Marcador nuevo:

- `figura-7-3a.png`: secuencia de recuperación después de una pérdida de conexión.

## 8. Capturas y compatibilidad

Los nombres existentes no cambiarán. Las nuevas imágenes utilizarán sufijos:

```text
figura-2-1a.png
figura-4-4a.png
figura-4-7a.png
figura-4-10a.png
figura-4-15a.png
figura-4-15b.png
figura-6-1a.png
figura-6-5a.png
figura-7-3a.png
```

El generador reconocerá números de figura como `2.1-A` y los convertirá a rutas `figura-2-1a.png`. Los contenedores conservarán el comportamiento actual: mostrar la imagen si existe y el marcador **Imagen pendiente** si falta.

## 9. Criterios de aceptación

- La advertencia del navegador tiene pasos directos para **Avanzado** y **Continuar**.
- El manual no solicita asistencia técnica para saltar esa advertencia.
- La dirección diferente de `172.16.3.21` detiene el procedimiento.
- Cada filtro visible está explicado con propósito, ejemplo, combinación y limpieza.
- La importación distingue progreso, terminación, resumen y estado por fila.
- `OK`, `OMITIDO`, `OMITIDO_DOC` y `ERROR` incluyen una acción concreta.
- La recuperación por pérdida de conexión evita reintentos ciegos y duplicados.
- Las figuras existentes conservan sus nombres.
- Las nuevas figuras aparecen como marcadores estables en Markdown y HTML.
- El diseño visual y tamaño de letra actuales no cambian.
- Markdown y HTML quedan sincronizados.
