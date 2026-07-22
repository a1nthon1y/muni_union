# 🚀 Manual de Instalación y Despliegue en Producción
**Sistema de Registro Civil — Municipalidad Distrital de La Unión**  
Versión 1.1.0 · Julio 2026

Este manual describe el procedimiento para desplegar e instalar toda la infraestructura del sistema del Registro Civil en un clúster de virtualización de 4 máquinas virtuales (VMs) corriendo **Debian 12** sobre **Proxmox VE**.

---

## 🗺️ 1. Arquitectura de Red e IPs

El sistema se distribuye en 4 servidores dedicados e interconectados mediante una red LAN local privada:

| VM / Servidor | IP de Red | Componentes | Recursos Sugeridos |
| :--- | :--- | :--- | :--- |
| **Frontend** | `172.16.3.21` | Nginx (Proxy Dual HTTPS) + Next.js (Node.js 20 en Docker) | 2 vCPUs, 2 GB RAM, 20 GB Disco |
| **Backend** | `172.16.3.22` | API REST Express (Node.js 20 en Docker) | 2 vCPUs, 4 GB RAM, 30 GB Disco |
| **PostgreSQL**| `172.16.3.23` | Servidor de base de datos PostgreSQL 15 | 2 vCPUs, 4 GB RAM, 40 GB Disco SSD |
| **Storage** | `172.16.3.24` | Servidor NFS (Archivos adjuntos/documentos y backups) | 1 vCPU, 1 GB RAM, 100+ GB Disco (SATA/HDD) |

### Flujo de Red
```
                     Peticiones Internet
                              │
                 verificar.muniunion.gob.pe
                              │
                              ▼
           ┌─────────────────────────────────────┐
           │        VM FRONTEND (172.16.3.21)    │
           │  • Nginx escucha :80 / :443         │
           │  • Proxy a Next.js (Localhost:3000) │
           └──────────────┬───────────────┬──────┘
                          │               │
                 Peticiones API      Peticiones API
                 (Red Interna)       (Portal Público)
                          │               │
                          ▼               ▼
           ┌─────────────────────────────────────┐
           │        VM BACKEND (172.16.3.22)     │
           │  • Express.js API (Puerto 4000)     │
           └──────────────┬───────────────┬──────┘
                          │               │
                 Consultas SQL       Montura NFS
                  (SSL Oblig)        (Subidas/Logs)
                          │               │
                          ▼               ▼
 ┌─────────────────────────────┐ ┌─────────────────────────────┐
 │  VM POSTGRESQL (172.16.3.23)│ │    VM STORAGE (172.16.3.24) │
 │  • BD PostgreSQL (Puerto5432)│ │  • Almacén NFS (NFS Server) │
 └─────────────────────────────┘ └─────────────────────────────┘
```

---

## 📋 2. Orden Secuencial de Instalación

Por dependencias de servicios, se debe seguir estrictamente este orden de aprovisionamiento:

1. **VM Storage (`.24`):** Proporciona almacenamiento compartido NFS; esencial para el backend y backups de la BD.
2. **VM PostgreSQL (`.23`):** Se conecta a Storage para depositar sus backups.
3. **VM Backend (`.22`):** Requiere conexión activa a la BD (`.23`) y montura NFS (`.24`).
4. **VM Frontend (`.21`):** Requiere que la API del Backend (`.22`) esté activa y respondiendo.

---

## ⚡ 3. Paso a Paso por Servidor

### 🔐 3.0. En TODAS las VMs (Aseguramiento Base y Firewall)
En cada servidor Debian 12 recién creado, ejecutar el script de endurecimiento (*hardening*) base:
```bash
# Copiar y ejecutar el script de seguridad
scp deploy/00_base_hardening.sh root@172.16.3.XX:/tmp/
ssh root@172.16.3.XX "bash /tmp/00_base_hardening.sh"
```
> **IMPORTANTE:** Este script inhabilita el login directo de `root` por SSH y configura el puerto SSH alternativo si se especifica. En adelante, ingresar con el usuario administrador `deploy`.

---

### 📁 3.1. VM Storage — `172.16.3.24`
1. Transferir el script de configuración NFS:
   ```bash
   scp deploy/storage/01_setup_storage.sh deploy@172.16.3.24:/tmp/
   ssh deploy@172.16.3.24 "sudo bash /tmp/01_setup_storage.sh"
   ```
2. Validar que las carpetas compartidas estén disponibles en la red:
   ```bash
   showmount -e 172.16.3.24
   # Debe listar:
   # /mnt/nfs_uploads  172.16.3.22
   # /mnt/nfs_logs     172.16.3.22
   # /mnt/nfs_backups  172.16.3.23
   ```

---

### 🗄️ 3.2. VM PostgreSQL — `172.16.3.23`
1. Instalar PostgreSQL 15 y montar el directorio de backups NFS:
   ```bash
   scp deploy/db/02_setup_postgresql.sh deploy@172.16.3.23:/tmp/
   ssh deploy@172.16.3.23 "sudo bash /tmp/02_setup_postgresql.sh"
   ```
2. Inicializar la estructura de la Base de Datos. Puedes elegir:
   * **Opción A (Instalación limpia automatizada):**
     ```bash
     scp -r deploy/db deploy@172.16.3.23:/opt/muni_union/deploy/
     ssh deploy@172.16.3.23 "bash /opt/muni_union/deploy/db/init_db.sh limpia"
     ```
   * **Opción B (Migraciones manuales en orden):**
     Ejecutar los scripts SQL ubicados en `back/src/migrations/` usando `psql` contra la IP del servidor. El orden obligatorio es:
     1. 000_schema.sql
     2. 001_refresh_tokens.sql
     3. 002_indexes.sql
     4. 003_usuario_permisos.sql
     5. 004_usuario_permisos_modificar.sql
     6. 005_seed_data.sql

> **IMPORTANTE:** La VM de base de datos exige obligatoriamente conexiones cifradas SSL (`hostssl` configurado en `pg_hba.conf`). El Backend debe contar con `DB_SSL=true` en sus variables de entorno.

---

### ⚙️ 3.3. VM Backend — `172.16.3.22`
1. Instalar dependencias del sistema, Docker CE y montar NFS compartidos:
   ```bash
   scp deploy/backend/03_setup_backend.sh deploy@172.16.3.22:/tmp/
   ssh deploy@172.16.3.22 "sudo bash /tmp/03_setup_backend.sh"
   ```
2. Clonar el repositorio en `/opt/muni_union` y configurar permisos:
   ```bash
   ssh deploy@172.16.3.22 "git clone https://github.com/a1nthon1y/muni_union.git /opt/muni_union"
   ```
3. Mover y rellenar el archivo de entorno del backend en la raíz `/opt/muni_union/.env.backend`:
   ```bash
   sudo cp /root/muni_union.env.backend /opt/muni_union/.env.backend
   sudo chown deploy:deploy /opt/muni_union/.env.backend
   ```
4. Editar la configuración del entorno para adecuar los valores reales de producción (IP de la BD, contraseñas, secretos de tokens):
   ```bash
   nano /opt/muni_union/.env.backend
   ```
5. Desplegar e iniciar el contenedor Docker de la API:
   ```bash
   cd /opt/muni_union
   docker compose -f deploy/docker-compose.backend.yml up -d --build
   ```
6. **Verificación local del build backend:**
   Puedes testear el correcto estado y compilación del backend corriendo:
   ```bash
   npm run build
   # Ejecutará el script interno scripts/build-check.js el cual valida
   # sintácticamente el 100% de los archivos JS.
   ```
7. Probar salud de la API:
   ```bash
   curl -f http://localhost:4000/api/health
   # Debe responder: {"status":"ok","services":{"db":"ok"}}
   ```

---

### 🖥️ 3.4. VM Frontend — `172.16.3.21`
1. Instalar dependencias, Docker CE y servidor web Nginx:
   ```bash
   scp deploy/frontend/04_setup_frontend.sh deploy@172.16.3.21:/tmp/
   ssh deploy@172.16.3.21 "sudo bash /tmp/04_setup_frontend.sh"
   ```
2. Clonar el repositorio:
   ```bash
   ssh deploy@172.16.3.21 "git clone https://github.com/a1nthon1y/muni_union.git /opt/muni_union"
   ```
3. Colocar variables de entorno del frontend (`/opt/muni_union/.env.frontend`):
   ```bash
   sudo cp /root/muni_union.env.frontend /opt/muni_union/.env.frontend
   sudo chown deploy:deploy /opt/muni_union/.env.frontend
   ```
4. Iniciar la compilación de producción de Next.js (`next build`) y levantar contenedor:
   ```bash
   cd /opt/muni_union
   docker compose -f deploy/docker-compose.frontend.yml up -d --build
   ```
5. Comprobar que Nginx esté corriendo perfectamente con el archivo de configuración dual:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## 📋 4. Variables de Entorno Clave

### Para el Backend (`.env.backend`):
* `NODE_ENV=production`
* `PORT=4000`
* `DB_HOST=172.16.3.23`
* `DB_USER=app_user`
* `DB_PASSWORD=ContraseñaComplejaBD`
* `DB_DATABASE=registro_muni_union`
* `DB_PORT=5432`
* `DB_SSL=true` (Requerido por seguridad perimetral de la BD)
* `JWT_SECRET=ClaveSecretaMuyLargaYSeguraDeMinimo64Caracteres`
* `REFRESH_TOKEN_SECRET=OtraClaveSecretaLargaYCompletamenteDiferente`
* `FRONTEND_URL=https://172.16.3.21` (URL origen permitida para CORS)

### Para el Frontend (`.env.frontend`):
* `NODE_ENV=production`
* `NEXT_PUBLIC_API_URL=https://172.16.3.21/api` (Dirección proxy expuesta por Nginx)

---

## 🛠️ 5. Mantenimiento y Backups

### Copias de seguridad automáticas (Base de Datos):
El sistema cuenta con un script programado vía `cron` en la VM de PostgreSQL (`.23`). Realiza un backup tipo dump comprimido cada día a las 23:00 hrs y lo deposita en la montura NFS de Storage:
* Ruta del script: `/opt/muni_union/deploy/db/backup_db.sh`
* Tarea Cron asignada: `0 23 * * * /opt/muni_union/deploy/db/backup_db.sh`

### Restauración rápida en caso de incidentes:
Si requieres recuperar los datos desde una copia anterior, ingresa a la VM de Base de Datos y ejecuta:
```bash
ssh deploy@172.16.3.23 "bash /opt/muni_union/deploy/db/restore_db.sh"
```
El script te solicitará seleccionar el backup deseado del almacenamiento NFS.

---

## ✅ 6. Protocolo de Verificación de Despliegue

Una vez completada la instalación de las 4 VMs, sigue este protocolo:
1. Desde una PC autorizada de la municipalidad, abre `https://172.16.3.21`.
2. Se debe renderizar la pantalla de login del **Sistema de Registro Civil**.
3. Abre las herramientas de desarrollador (`F12`) y verifica que no existan advertencias ni errores en la consola (como warnings de etiquetas `<label>` desvinculadas).
4. Realiza una petición manual a la API de salud: `https://172.16.3.21/api/health`. Debe retornar un estado HTTP 200 y JSON indicando salud correcta del servicio.
5. Inicia sesión con las credenciales asignadas por defecto y realiza un cambio de contraseña preventivo.
