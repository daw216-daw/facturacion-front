# MEMORY.md — facturacion-front (SPA React)

> Documento de referencia interno. Complementa a `CLAUDE.md` (patrones de código) con el detalle
> completo de la estructura, pantallas y cómo este frontend se conecta con `api-facturacion`.
> Última revisión: 2026-07-01, tras añadir a la vista previa de Facturas el mismo flujo de
> PDF/email/WhatsApp que ya tenía Presupuestos, y tras añadir el selector/orden de textos legales
> múltiples en el formulario de Presupuestos.

## 1. Stack

- React 19.2 + Vite 7.2 (`npm run dev` en `http://localhost:5173`, `npm run build`, `npm run lint`).
- MUI 7.3 (+ MUI X DataGrid 8.26) como única librería de UI.
- Axios 1.13 con interceptores (`src/lib/api.js`).
- React Router DOM 7.13, rutas declaradas en `src/app/router.jsx`.
- Estado: React Context API puro (`AuthContext`, `ThemeContext`) — sin Redux/Zustand/React Query.
- TipTap 3.18 (`StarterKit`) para el editor WYSIWYG de `DocumentoTexto`.
- dayjs para fechas.

## 2. Estructura de directorios

```
src/
├── app/
│   ├── App.jsx               # RouterProvider + comprobación de AuthContext
│   ├── router.jsx            # todas las rutas (admin/emisor/públicas)
│   ├── Dashboard.jsx         # dashboard admin (placeholder)
│   └── EmisorDashboard.jsx   # dashboard emisor (placeholder, sin funcionalidad real)
├── features/                 # un módulo por recurso de negocio
│   ├── auth/
│   │   ├── context/AuthContext.jsx   # useAuth() → { user, login, logout, loading }
│   │   └── pages/LoginPage.jsx
│   ├── clientes/pages/ (ClientesPage, ClienteForm, ClienteCard, ConfirmActionDialog local)
│   ├── presupuestos/
│   │   ├── pages/ (PresupuestosPage, PresupuestoForm, PresupuestoPreview)
│   │   ├── components/PresupuestoCard.jsx
│   │   └── services/presupuestos.service.js
│   ├── facturas/
│   │   ├── pages/ (FacturasPage, FacturaForm, FacturaPreview)
│   │   └── services/facturas.service.js
│   ├── emisores/ (pages/EmisoresPage, EmisorForm; components/EmisorCard; services/)
│   ├── users/ (pages/UsersPage, UserForm, UserCard; services/)
│   ├── series/ (pages/SeriesPage, SerieForm; components/SerieCard; services/)
│   └── documentoTextos/
│       ├── pages/DocumentoTextosPage.jsx
│       ├── components/DocumentoTextoForm.jsx, DocumentoTextoPreview.jsx
│       └── services/documentoTextos.service.js
├── common/
│   ├── ConfirmActionDialog.jsx   # diálogo de confirmación genérico reutilizable
│   └── DocumentoTextoEditor.jsx  # wrapper TipTap + toolbar MUI (bold/italic/strike/H1-3/listas)
├── guards/
│   ├── RequireAuth.jsx       # redirige a /login si no hay user
│   └── RequireRole.jsx       # redirige a /unauthorized si el role no está en allowed[]
├── layouts/
│   ├── admin/AdminLayout.jsx, AdminSidebar.jsx, AdminTopBar.jsx   # sidebar colapsable + topbar
│   └── EmisorLayout.jsx      # barra simple, sin sidebar
├── lib/api.js                 # instancia Axios con interceptores
└── styles/ThemeContext.jsx, theme.js   # dark/light mode persistido en localStorage
```

## 3. Conexión al API (`src/lib/api.js`)

- Base URL: `import.meta.env.VITE_API_BASE_URL` o fallback `http://api-facturacion.local/api`. En
  desarrollo local normalmente se apunta a `http://localhost:8000/api` (donde corre `php artisan serve`).
- Token Sanctum guardado en `localStorage` bajo la clave `token`.
- Request interceptor: añade `Authorization: Bearer {token}` a toda petición.
- Response interceptor: en `401` limpia el token y redirige a `/login`.

## 4. Autenticación y roles

- `AuthContext.jsx`: al montar la app llama `GET /me` con el token guardado para restaurar sesión;
  `login()` hace `POST /login` con `{ email, password }`; `logout()` hace `POST /logout`.
- `LoginPage` redirige tras login a `/admin` o `/emisor` según `user.role`.
- `RequireRole` en el router filtra el árbol de rutas por rol — hoy solo `admin` tiene pantallas
  reales; `emisor` es un layout/dashboard placeholder sin funcionalidad.

## 5. Rutas (`src/app/router.jsx`)

| Ruta | Componente | Rol |
|---|---|---|
| `/login` | LoginPage | público |
| `/unauthorized` | mensaje estático | público |
| `/admin` | Dashboard | admin |
| `/admin/clientes` | ClientesPage | admin |
| `/admin/users` | UsersPage | admin |
| `/admin/presupuestos` | PresupuestosPage | admin |
| `/admin/presupuestos/:id/preview` | PresupuestoPreview | admin |
| `/admin/facturas` | FacturasPage | admin |
| `/admin/facturas/:id/preview` | FacturaPreview | admin |
| `/admin/emisores` | EmisoresPage | admin |
| `/admin/series` | SeriesPage | admin |
| `/admin/documento-textos` | DocumentoTextosPage | admin |
| `/emisor` | EmisorDashboard | emisor |
| `*` | redirige a `/login` | — |

Añadir una ruta admin nueva requiere tocar `router.jsx` **y** `AdminSidebar.jsx` (la navegación no
se genera automáticamente desde las rutas).

## 6. Mapeo módulo (front) ↔ recurso (API) — conexión entre ambos proyectos

Este frontend **no tiene lógica de negocio propia**: estados, numeración legal, cálculo de IVA,
generación de PDF y envío de emails viven en el backend Laravel (`api-facturacion`). El front solo
orquesta llamadas REST y renderiza el resultado.

| Módulo front | Servicio | Endpoints backend consumidos | Notas |
|---|---|---|---|
| `auth` | (inline en `AuthContext`) | `POST /login`, `POST /logout`, `GET /me` | Sanctum Bearer token |
| `clientes` | `clientes.service.js` | `/api/clientes` (CRUD) | soft-delete lógico vía `activo` |
| `presupuestos` | `presupuestos.service.js` | `/api/presupuestos` CRUD + `/enviar` `/aceptar` `/rechazar` `/desactivar` `/facturar` `/preview` `/pdf` `/enviar-email` `/compartir-whatsapp` | `PresupuestoForm.jsx` envía `documento_texto_ids` (array ordenado) para la relación pivote `presupuesto_documento_texto`; `PresupuestoPreview.jsx` consume `textos_legales` (array) del `/preview` |
| `facturas` | `facturas.service.js` | `/api/facturas` CRUD + `/pagar` `/preview` `/pdf` `/enviar-email` `/compartir-whatsapp` | Los 3 últimos son **nuevos**: `FacturaPreview.jsx` ahora replica los botones de compartir que ya tenía `PresupuestoPreview.jsx` (ver sección 7) |
| `emisores` | `emisores.service.js` | `/api/emisores` (CRUD, array plano) | multi-empresa |
| `users` | `users.service.js` | `/api/users` (CRUD) | solo accesible con rol admin en el front; el backend no restringe por policy |
| `series` | `series.service.js` | `/api/series` (CRUD, array plano) | numeración consumida internamente por `SerieService` del backend |
| `documentoTextos` | `documentoTextos.service.js` | `/api/documento-textos` (CRUD, array plano) | editor TipTap en front; en presupuestos se seleccionan varios y se ordenan (ver sección 7); en facturas el backend usa siempre el primero de `tipo=factura` sin selección en el front |

**Roles compartidos:** el campo `User.role` (`admin`/`emisor`) que devuelve el backend determina en
el front qué layout/rutas puede ver (`RequireRole.jsx`). No hay policies en el backend: la única
autorización real ocurre en el middleware de rutas del lado servidor y en el guard de rutas del
lado cliente — ambos deben mantenerse sincronizados manualmente si se añaden roles nuevos.

**Formatos de respuesta** (heterogéneos a propósito, cada `service.js` sabe cómo desenvolver el suyo):
| Recurso | Formato |
|---|---|
| `getPresupuestos()`, `getFacturas()` | paginación Laravel nativa `{ data, links, meta }` |
| `getClientes()`, `getUsers()` | `{ data: [...], meta: { current_page, per_page, total, last_page } }` |
| `getEmisores()`, `getSeries()`, `getDocumentoTextos()` | array plano |
| `createXxx()` | recurso creado directo, o con wrapper `.data` según el endpoint (`?? response.data`) |

## 7. Funcionalidad nueva: compartir Facturas (paridad con Presupuestos)

Antes, solo `PresupuestoPreview.jsx` permitía generar/descargar PDF, enviar por email y compartir
por WhatsApp. Ahora `FacturaPreview.jsx` implementa exactamente el mismo patrón:

- `facturas.service.js` añade `getFacturaPdf(id, {download})`, `sendFacturaEmail(id, data)`,
  `getFacturaWhatsappLink(id, data)` — llaman a los endpoints nuevos del backend
  (`GET /facturas/{id}/pdf`, `POST /facturas/{id}/enviar-email`, `POST /facturas/{id}/compartir-whatsapp`).
- `FacturaPreview.jsx` añade botones con iconos `PictureAsPdfIcon`/`DownloadIcon`/`EmailIcon`/
  `WhatsAppIcon`, un diálogo de "compartir" (`shareOpen`/`shareLoading`) y feedback vía `Snackbar`,
  igual que en `PresupuestoPreview.jsx`. A diferencia de los presupuestos, compartir una factura no
  cambia su estado (no hay equivalente a `prepareForSharing`).

## 8. Funcionalidad: textos legales múltiples en Presupuestos

`PresupuestoForm.jsx` incorpora un selector de `DocumentoTexto` (checkboxes) más una lista
"Orden en el PDF" con botones `ArrowUpwardIcon`/`ArrowDownwardIcon` (no drag-and-drop) para
reordenar los documentos elegidos (`docsSeleccionados`, funciones `moverArriba`/`moverAbajo`). Al
guardar, se envía `documento_texto_ids` como array en el orden final; el backend lo persiste en la
tabla pivote `presupuesto_documento_texto` con la columna `orden`. Al editar un presupuesto
existente, el formulario reconstruye `docsSeleccionados` ordenando por `pivot.orden`.

## 9. Patrones de UI establecidos (ver también `CLAUDE.md`)

- Listados: `DataGrid` en desktop, `Stack` de cards en móvil (`useMediaQuery(breakpoints.down('sm'))`).
- Formularios: `Dialog` MUI (`maxWidth="lg"`, `fullScreen` en móvil), estado local plano + `handleChange` genérico.
- Confirmaciones destructivas: siempre vía `ConfirmActionDialog`.
- Feedback: `{ open, severity, message }` → `Snackbar` + `Alert`, autoHide 4s.
- Tema dark/light persistido en `localStorage('themeMode')`, vía `useThemeMode()`.
