# Despliegue en Hostinger (hosting compartido, subdominios)

Guía para subir **api-facturacion** (Laravel 12) y **facturacion-front** (React + Vite) a un plan compartido de Hostinger (Premium / Business: incluyen SSH, Composer y cron).

Sustituye en toda la guía:
- `<tu-dominio>` → tu dominio, p. ej. `midominio.com`
- `uXXXX` → tu usuario de Hostinger (aparece en hPanel → Avanzado → Acceso SSH)

## 0. Esquema final

| Subdominio | Qué sirve | Carpeta |
|---|---|---|
| `https://api.<tu-dominio>` | API Laravel | carpeta del subdominio → enlazada a `api-facturacion/public` |
| `https://app.<tu-dominio>` | Front React (archivos estáticos) | carpeta del subdominio con el contenido de `dist/` |

El código de Laravel queda **fuera de `public_html`**: así `.env`, `vendor/` y `storage/` nunca son accesibles desde la web.

```
/home/uXXXX/domains/<tu-dominio>/
├── api-facturacion/          ← código Laravel completo (NO público)
└── public_html/
    ├── api/                  ← subdominio api.  → enlace a ../api-facturacion/public
    └── app/                  ← subdominio app.  → contenido de dist/ del front
```

> La ruta exacta de las carpetas de subdominio la muestra hPanel al crearlos. Si es distinta, adapta las rutas de esta guía.

---

## 1. Preparar hPanel (una sola vez)

1. **PHP**: Sitios web → Avanzado → *Configuración de PHP* → **PHP 8.3** (mínimo 8.2).
   Extensiones activadas: `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `dom`, `ctype`, `fileinfo`, `gd` (dompdf), `zip`, `intl` (recomendada).
2. **Subdominios**: Dominios → *Subdominios* → crear `api` y `app`.
3. **SSL**: Seguridad → *SSL* → instalar el certificado gratuito en `api.<tu-dominio>` y `app.<tu-dominio>`.
4. **Base de datos**: Bases de datos → *MySQL* → crear base de datos + usuario (anota nombre, usuario y contraseña; el host suele ser `localhost`).
5. **Email** (para enviar presupuestos y facturas): Emails → crear buzón, p. ej. `facturacion@<tu-dominio>`.
6. **SSH**: Avanzado → *Acceso SSH* → activar y anotar host, puerto y usuario.

---

## 2. Subir el API (Laravel)

Conéctate por SSH:

```bash
ssh -p <puerto> uXXXX@<host-ssh>
cd ~/domains/<tu-dominio>
php -v            # debe ser 8.2 o superior (si no, cambia la versión en hPanel)
```

### 2.1 Código

Opción A — **Git** (recomendada):
```bash
git clone <url-del-repo-api> api-facturacion
```
Opción B — **ZIP**: comprime `api-facturacion` en local **sin** `vendor/`, `node_modules/` ni `.env`, súbelo con el Administrador de archivos a `~/domains/<tu-dominio>/` y descomprímelo.

### 2.2 Dependencias

```bash
cd ~/domains/<tu-dominio>/api-facturacion
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
- `APP_URL=https://api.<tu-dominio>`
- `CORS_ALLOWED_ORIGINS=https://app.<tu-dominio>` (exacto: con `https://` y **sin** `/` final)
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

### 2.7 Apuntar el subdominio `api` a `public/`

Opción A — **enlace simbólico** (recomendada):
```bash
cd ~/domains/<tu-dominio>/public_html
rm -rf api                                         # carpeta vacía creada por hPanel
ln -s ../api-facturacion/public api
```

Opción B — si no se permiten enlaces simbólicos:
1. Copia el contenido de `api-facturacion/public/` (incluido `.htaccess`) a `public_html/api/`.
2. Edita `public_html/api/index.php` y cambia las rutas `__DIR__.'/../` por `__DIR__.'/../../api-facturacion/`:
   ```php
   if (file_exists($maintenance = __DIR__.'/../../api-facturacion/storage/framework/maintenance.php')) {
       require $maintenance;
   }
   require __DIR__.'/../../api-facturacion/vendor/autoload.php';
   $app = require_once __DIR__.'/../../api-facturacion/bootstrap/app.php';
   ```

Comprobación: `https://api.<tu-dominio>/up` debe responder con una página verde de Laravel ("Application up").

### 2.8 Cron (limpieza diaria de sesiones caducadas)

hPanel → Avanzado → *Cron Jobs* → personalizado, **cada minuto**:
```
/usr/bin/php /home/uXXXX/domains/<tu-dominio>/api-facturacion/artisan schedule:run >> /dev/null 2>&1
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
# edita: VITE_API_BASE_URL=https://api.<tu-dominio>/api
npm ci
npm run build
```

Sube **todo el contenido** de `dist/` a `public_html/app/` (Administrador de archivos, FTP o `scp`):
```bash
scp -P <puerto> -r dist/. uXXXX@<host-ssh>:~/domains/<tu-dominio>/public_html/app/
```

> Asegúrate de que se sube **`dist/.htaccess`** (archivo oculto). Sin él, al recargar en `/admin/facturas` da error 404.

Comprobación: `https://app.<tu-dominio>` muestra el login.

---

## 4. Comprobaciones tras el despliegue

- [ ] `https://api.<tu-dominio>/up` → OK
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
cd ~/domains/<tu-dominio>/api-facturacion
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
| Error 500 en el API | Ver `api-facturacion/storage/logs/laravel-AAAA-MM-DD.log`. Revisar permisos de `storage/` y `bootstrap/cache/`. |
| En el navegador: *CORS error* | `CORS_ALLOWED_ORIGINS` debe ser exactamente `https://app.<tu-dominio>` (sin `/` final). Después `php artisan config:cache`. |
| El front llama a `api-facturacion.local` | Falta `.env.production` con `VITE_API_BASE_URL` al hacer el build. Rehacer `npm run build`. |
| 404 al recargar una página del front | Falta `.htaccess` en `public_html/app/`. |
| *Invalid signature* al abrir el PDF compartido | `APP_URL` debe ser `https://api.<tu-dominio>`; luego `php artisan config:cache`. |
| Los emails no salen | `MAIL_HOST=smtp.hostinger.com`, `MAIL_PORT=465`, `MAIL_SCHEME=smtps`, usuario = email completo y `MAIL_FROM_ADDRESS` igual al usuario. Probar con `php artisan app:probar-email`. Ver el detalle en `storage/logs` (en pantalla solo sale un mensaje genérico). |
| Los emails llegan a spam | Activar SPF, DKIM y DMARC (apartado 2.9). |
| Cambié el `.env` y no se nota | `php artisan config:cache`. |
| "Demasiados intentos de inicio de sesión" | Límite de 5 intentos/minuto por email: esperar un minuto. |

---

## 8. Checklist de seguridad

- [ ] `APP_DEBUG=false` y `APP_ENV=production`
- [ ] Laravel fuera de `public_html` (solo `public/` es accesible)
- [ ] `CORS_ALLOWED_ORIGINS` con el dominio exacto del front (nunca `*`)
- [ ] `MAIL_OVERRIDE_TO_ADDRESS` vacío
- [ ] SSL activo y HTTPS forzado en ambos subdominios
- [ ] Contraseña fuerte para el admin y para la base de datos
- [ ] No ejecutar seeders en producción
