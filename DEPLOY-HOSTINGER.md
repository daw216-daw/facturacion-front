# Despliegue en Hostinger (hosting compartido, subdominios)

Guía para subir **api-facturacion** (Laravel 12) y **facturacion-front** (React + Vite) a un plan compartido de Hostinger (Premium / Business: incluyen SSH, Composer y cron).

Sustituye en toda la guía:
- `<tu-dominio>` → el dominio donde va la app (propuesta: `kmelendez.dev`)
- `uXXXX` → tu usuario de Hostinger (hPanel → Avanzado → Acceso SSH)

> La cuenta tiene **varios proyectos** (p. ej. *finanzas*). Esta guía solo crea cosas nuevas dentro de `public_html/facturacion/`: no toques las carpetas de otros proyectos.

## 0. Esquema final

Misma estructura que el proyecto *finanzas*: cada proyecto en `public_html/<proyecto>/` con `api/` (Laravel) y `web/` (build del front), y cada subdominio con **carpeta personalizada**.

| Subdominio | Qué sirve | Carpeta del subdominio (hPanel) |
|---|---|---|
| `https://api-facturacion.<tu-dominio>` | API Laravel | `public_html/facturacion/api/public` |
| `https://app-facturacion.<tu-dominio>` | Front React (estáticos) | `public_html/facturacion/web` |

```
/home/uXXXX/domains/<tu-dominio>/
├── DO_NOT_UPLOAD_HERE        ← Hostinger: no poner nada a este nivel
└── public_html/              ← web del dominio principal
    └── facturacion/
        ├── api/              ← Laravel completo (repo api-facturacion)
        │   ├── .htaccess     ← ¡incluido en el repo! bloquea todo salvo public/
        │   └── public/       ← raíz del subdominio api-facturacion
        └── web/              ← contenido de dist/ (incluido .htaccess) → app-facturacion
```

> **Seguridad:** como `facturacion/api` está dentro de `public_html`, sin protección se podría descargar desde `https://<tu-dominio>/facturacion/api/storage/logs/laravel.log`. El `.htaccess` de la raíz del repo `api-facturacion` lo impide (solo deja pasar `public/`). Compruébalo en el apartado 4.

---

## 1. Preparar hPanel (una sola vez)

1. **PHP**: Sitios web → Avanzado → *Configuración de PHP* → **PHP 8.3** (mínimo 8.2).
   Extensiones activadas: `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `dom`, `ctype`, `fileinfo`, `gd` (dompdf), `zip`, `intl` (recomendada).
2. **Subdominios**: Dominios → *Subdominios* → dominio `<tu-dominio>` → marca **Carpeta personalizada para subdominio**:
   - `api-facturacion` → carpeta `facturacion/api/public`
   - `app-facturacion` → carpeta `facturacion/web`

   (Así aparecen en la lista con el directorio completo `/home/uXXXX/domains/<tu-dominio>/public_html/facturacion/...`, como los de finanzas.)
3. **SSL**: Seguridad → *SSL* → instalar el certificado gratuito en `api-facturacion.<tu-dominio>` y `app-facturacion.<tu-dominio>`.
4. **Base de datos**: Bases de datos → *MySQL* → crear base de datos + usuario (anota nombre, usuario y contraseña; el host suele ser `localhost`).
5. **Email** (para enviar presupuestos y facturas): Emails → crear buzón, p. ej. `facturacion@<tu-dominio>`.
6. **SSH**: Avanzado → *Acceso SSH* → activar y anotar host, puerto y usuario.

---

## 2. Subir el API (Laravel)

Conéctate por SSH:

```bash
ssh -p <puerto> uXXXX@<host-ssh>
mkdir -p ~/domains/<tu-dominio>/public_html/facturacion
cd ~/domains/<tu-dominio>/public_html/facturacion
php -v            # debe ser 8.2 o superior (si no, cambia la versión en hPanel)
```

### 2.1 Código

Opción A — **Git** (recomendada):
```bash
# hPanel puede haber creado ya facturacion/api/public al crear el subdominio:
# si "api" existe y está vacía, bórrala antes (rm -rf api)
git clone <url-del-repo-api> api
ls -la api/.htaccess      # debe existir: protege todo salvo public/
```
Opción B — **ZIP**: comprime `api-facturacion` en local **sin** `vendor/`, `node_modules/` ni `.env` (pero **con** el `.htaccess` de la raíz), súbelo con el Administrador de archivos a `public_html/facturacion/`, descomprímelo y renombra la carpeta a `api`.

### 2.2 Dependencias

```bash
cd ~/domains/<tu-dominio>/public_html/facturacion/api
composer install --no-dev --optimize-autoloader
```

### 2.3 Configuración (.env)

```bash
cp .env.production.example .env
nano .env          # rellena APP_URL, CORS_ALLOWED_ORIGINS, DB_*, MAIL_*
php artisan key:generate
```

Valores clave (ver `.env.production.example`):
- `APP_ENV=production` y `APP_DEBUG=false`
- `APP_URL=https://api-facturacion.<tu-dominio>`
- `CORS_ALLOWED_ORIGINS=https://app-facturacion.<tu-dominio>` (exacto: con `https://` y **sin** `/` final)
- `MAIL_OVERRIDE_TO_ADDRESS=` **vacío**

### 2.4 Permisos

```bash
chmod -R 775 storage bootstrap/cache
```

### 2.5 Base de datos y primer administrador

```bash
php artisan migrate --force
php artisan app:crear-admin          # pide nombre, email y contraseña
```

> **No** ejecutes `php artisan db:seed` en producción (crea un usuario de prueba).

### 2.6 Cachés de producción

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

> Cada vez que cambies el `.env` hay que volver a ejecutar `php artisan config:cache`.

### 2.7 Subdominio de la API

Si en el paso 1 creaste `api-facturacion` con la carpeta personalizada `facturacion/api/public`, no hay que hacer nada más: el subdominio sirve directamente `public/`.

Comprobación: `https://api-facturacion.<tu-dominio>/up` debe responder con una página verde de Laravel ("Application up").

### 2.8 Cron (limpieza diaria de sesiones caducadas)

hPanel → Avanzado → *Cron Jobs* → personalizado, **cada minuto**:
```
/usr/bin/php /home/uXXXX/domains/<tu-dominio>/public_html/facturacion/api/artisan schedule:run >> /dev/null 2>&1
```
(Si `/usr/bin/php` no es la versión correcta, usa la ruta que indique `which php` por SSH.)

### 2.9 Email: que llegue y no acabe en spam

1. **Remitente = buzón del SMTP**: `MAIL_FROM_ADDRESS` debe ser exactamente el mismo buzón que `MAIL_USERNAME` (p. ej. `facturacion@<tu-dominio>`). Hostinger rechaza o marca como spam otro remitente.
   - El email sale con el **nombre del emisor** ("Reformas Pérez <facturacion@…>") y las respuestas del cliente van al **email del emisor** (Reply-To), configurado en la pantalla Emisores.
2. **SPF, DKIM y DMARC**: hPanel → Emails → *Configuración del correo* / *Autenticación* → activar los tres (si el dominio usa los DNS de Hostinger se añaden con un clic). Sin ellos, Gmail y Outlook suelen mandar los emails a spam.
3. **Prueba de envío** (no cambia ningún dato):
   ```bash
   php artisan app:probar-email tu-email@gmail.com
   ```
   Envía el último presupuesto y la última factura con el PDF real. Para uno concreto: `--presupuesto=ID` o `--factura=ID`.
   Para **ver** cómo quedan sin enviar nada: `php artisan app:probar-email --dry-run` → imprime un enlace temporal (2 h) para abrir la prueba en el navegador (email, PDF y versión de texto).

---

## 3. Subir el front (React)

Hostinger compartido **no** compila Node: el build se hace en tu ordenador.

```bash
cd facturacion-front
cp .env.production.example .env.production
# edita: VITE_API_BASE_URL=https://api-facturacion.<tu-dominio>/api
npm ci
npm run build
```

Sube **todo el contenido** de `dist/` a `public_html/facturacion/web/` (Administrador de archivos, FTP o `scp`):
```bash
scp -P <puerto> -r dist/. uXXXX@<host-ssh>:~/domains/<tu-dominio>/public_html/facturacion/web/
```

> Asegúrate de que se sube **`dist/.htaccess`** (archivo oculto). Sin él, al recargar en `/admin/facturas` da error 404.

Comprobación: `https://app-facturacion.<tu-dominio>` muestra el login.

---

## 4. Comprobaciones tras el despliegue

- [ ] `https://api-facturacion.<tu-dominio>/up` → OK
- [ ] **Protección**: desde tu PC, `curl -s -o /dev/null -w "%{http_code}\n" https://<tu-dominio>/facturacion/api/composer.json` → **403** (y lo mismo con `/facturacion/api/storage/logs/laravel.log`). Si da 200, falta `public_html/facturacion/api/.htaccess`
- [ ] Login con el admin creado en 2.5
- [ ] Contraseña incorrecta → muestra "Credenciales incorrectas"
- [ ] Recargar el navegador en `/admin/presupuestos` → no da 404
- [ ] Crear las **series** de presupuesto y factura del año (pantalla Series)
- [ ] Crear cliente, presupuesto, ver PDF y descargar
- [ ] `php artisan app:probar-email tu-email@…` → llegan los dos emails con su PDF
- [ ] Enviar presupuesto por **email** desde la app (llega al cliente, no a una dirección de pruebas) y aparece en "Envíos" de la vista previa
- [ ] Enlace de **WhatsApp**: abrir el enlace del PDF desde el móvil (no debe decir "Invalid signature")
- [ ] Facturar y ver el PDF de la factura

---

## 5. Actualizar a una nueva versión

**API**
```bash
cd ~/domains/<tu-dominio>/public_html/facturacion/api
php artisan down
git pull                                   # o subir los archivos nuevos
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache && php artisan route:cache && php artisan view:cache
php artisan up
```

**Front**: `npm run build` en local y volver a subir el contenido de `dist/` (sustituyendo el anterior).

---

## 6. Copias de seguridad

- hPanel → *Copias de seguridad*: Hostinger hace copias periódicas; descarga una antes de cada actualización.
- Base de datos manual: `mysqldump -u <usuario> -p <base_de_datos> > backup_$(date +%F).sql`
- Guarda una copia del `.env` del servidor en un lugar seguro (contiene el `APP_KEY`).

---

## 7. Problemas frecuentes

| Síntoma | Causa / solución |
|---|---|
| Error 500 en el API | Ver `public_html/facturacion/api/storage/logs/laravel-AAAA-MM-DD.log`. Revisar permisos de `storage/` y `bootstrap/cache/`. |
| En el navegador: *CORS error* | `CORS_ALLOWED_ORIGINS` debe ser exactamente `https://app-facturacion.<tu-dominio>` (sin `/` final). Después `php artisan config:cache`. |
| El front llama a `api-facturacion.local` | Falta `.env.production` con `VITE_API_BASE_URL` al hacer el build. Rehacer `npm run build`. |
| 404 al recargar una página del front | Falta `.htaccess` en `public_html/facturacion/web/`. |
| *Invalid signature* al abrir el PDF compartido | `APP_URL` debe ser `https://api-facturacion.<tu-dominio>`; luego `php artisan config:cache`. |
| Los emails no salen | `MAIL_HOST=smtp.hostinger.com`, `MAIL_PORT=465`, `MAIL_SCHEME=smtps`, usuario = email completo y `MAIL_FROM_ADDRESS` igual al usuario. Probar con `php artisan app:probar-email`. Ver el detalle en `storage/logs` (en pantalla solo sale un mensaje genérico). |
| Los emails llegan a spam | Activar SPF, DKIM y DMARC (apartado 2.9). |
| Cambié el `.env` y no se nota | `php artisan config:cache`. |
| "Demasiados intentos de inicio de sesión" | Límite de 5 intentos/minuto por email: esperar un minuto. |

---

## 8. Checklist de seguridad

- [ ] `APP_DEBUG=false` y `APP_ENV=production`
- [ ] `public_html/facturacion/api/.htaccess` presente: desde `https://<tu-dominio>/facturacion/api/…` todo da 403 salvo `public/`
- [ ] `CORS_ALLOWED_ORIGINS` con el dominio exacto del front (nunca `*`)
- [ ] `MAIL_OVERRIDE_TO_ADDRESS` vacío
- [ ] SSL activo y HTTPS forzado en ambos subdominios
- [ ] Contraseña fuerte para el admin y para la base de datos
- [ ] No ejecutar seeders en producción
