# facturacion-front

React 19 · Vite 7 · MUI v7 · react-router-dom v7 · Axios · TipTap v3 · dayjs

## Estructura
```
src/
  app/
    App.jsx            ← RouterProvider + AuthContext check
    router.jsx         ← todas las rutas
    Dashboard.jsx      ← dashboard admin: conteos e importes (GET /dashboard)
    EmisorDashboard.jsx← dashboard emisor (placeholder — sin funcionalidad)
  features/
    auth/
      context/AuthContext.jsx   ← useAuth() → { user, login, logout, loading }
      pages/LoginPage.jsx
    clientes/presupuestos/facturas/emisores/series/users/documentoTextos/
      pages/           ← páginas y formularios
      components/      ← componentes de la feature (no todas tienen esta carpeta)
      services/        ← <feature>.service.js — llamadas a la API
  common/
    ConfirmActionDialog.jsx     ← dialog genérico de confirmación
    DocumentoTextoEditor.jsx    ← editor TipTap con toolbar MUI
    ShareDialog.jsx             ← compartir por email / WhatsApp: destinatario editable, aviso móvil/fijo, copia al emisor
    telefonos.js                ← analizarTelefono / ayudaTelefono / puedeWhatsapp (móvil vs fijo, misma regla que el API)
    whatsapp.js                 ← abrirWhatsapp(pedirEnlace): abre la ventana al pulsar para evitar el bloqueo de popups
    FormSection.jsx             ← bloque de formulario: nº de paso, título, (obligatorio)/(opcional), descripción y acción
    IvaFechaDialog.jsx          ← diálogo fecha + IVA (chips 21/10/4/0) con resumen base/IVA/total; anioFijo limita la fecha a un año; children para campos extra
    TextosLegalesSelector.jsx   ← selección + orden de textos legales (disponibles | orden en el PDF); getTituloDoc(), esTextoIvaCero(), textosPorDefecto()
    AvisoIvaCero.jsx            ← aviso si IVA 0 % sin texto "IVA 0 %" elegido, con botón para añadirlo
    FullPageLoader.jsx          ← pantalla de carga a página completa
    rutasPorRol.js              ← rutaInicioPorRol(role): /admin | /emisor | /unauthorized
    documentPreview/
      DocumentSheet.jsx         ← hoja de papel que imita los PDF (DocumentSheet, SheetTitle, SheetSectionTitle, SheetCard, RichText, PartyLines, SheetFooter, PAPER)
      PreviewShell.jsx          ← PreviewToolbar (barra fija), PreviewLayout (documento + panel), AsideCard, AsideRow, PreviewSkeleton, PreviewError
      HistorialEnvios.jsx       ← panel "Envíos" (canal, destino, fecha, usuario, estado)
  guards/
    RequireAuth.jsx    ← redirige a /login si no hay user
    RequireRole.jsx    ← redirige a /unauthorized si role no está en allowed[]
  layouts/
    admin/
      AdminLayout.jsx  ← sidebar colapsable + topbar
      AdminSidebar.jsx
      AdminTopBar.jsx
    EmisorLayout.jsx   ← barra simple, sin sidebar
  lib/
    api.js             ← instancia Axios con interceptores (token + 401 → /login)
  styles/
    ThemeContext.jsx   ← ThemeModeProvider, useThemeMode() → { mode, toggleTheme }
    theme.js           ← getTheme(mode) — tema MUI light/dark
```

## Variables de entorno
```
VITE_API_BASE_URL=http://api-facturacion.local/api   # .env (desarrollo) — obligatoria, ya no hay fallback
VITE_API_BASE_URL=https://api.<dominio>/api          # .env.production (build para Hostinger)
```
`.env` y `.env.production` no se versionan; se versionan `.env.example` y `.env.production.example`.
Despliegue: ver **`DEPLOY-HOSTINGER.md`**.

## Comandos
```bash
npm run dev      # inicia en http://localhost:5173 con --host
npm run build
npm run lint
```

## Patrones establecidos — seguir siempre

### Servicio (service layer)
```js
// features/<nombre>/services/<nombre>.service.js
import api from '../../../lib/api';
export async function getXxx(params = {}) {
  const { data } = await api.get('/xxx', { params });
  return data;
}
```

### Página de listado
- MUI `DataGrid` en desktop, `Stack` de cards custom en mobile (`useMediaQuery(theme.breakpoints.down('sm'))`)
- Estado: `rows`, `loading`, función `loadXxx()` llamada en `useEffect` y tras cada acción
- Feedback: `{ open, severity, message }` → `Snackbar` + `Alert` arriba-derecha, 4s autoHide
- Acciones destructivas/irreversibles: siempre a través de `ConfirmActionDialog`

### Formulario
- `Dialog` MUI con `maxWidth="lg"` y `fullScreen` en mobile
- Estado local del form como objeto plano, `handleChange` genérico con spread
- Guardado con `saving` state para deshabilitar botón durante petición
- `onSaved()` callback para que el padre recargue el listado

### ConfirmActionDialog
```jsx
<ConfirmActionDialog
  open={!!selected}
  loading={processing}
  title="..."
  description="..."
  confirmText="..."
  confirmColor="primary|error|success|warning"
  onClose={() => setSelected(null)}
  onConfirm={handleConfirm}
/>
```

### DocumentoTextoEditor
```jsx
<DocumentoTextoEditor
  value={form.descripcion}   // HTML string
  onChange={(html) => setForm(prev => ({ ...prev, descripcion: html }))}
/>
```
TipTap con StarterKit: bold, italic, strike, heading (1-3), bulletList, orderedList.

## Rutas admin
```
/admin                          → Dashboard
/admin/clientes                 → ClientesPage
/admin/users                    → UsersPage
/admin/presupuestos             → PresupuestosPage
/admin/presupuestos/:id/preview → PresupuestoPreview
/admin/facturas                 → FacturasPage
/admin/facturas/:id/preview     → FacturaPreview
/admin/emisores                 → EmisoresPage
/admin/series                   → SeriesPage
/admin/documento-textos         → DocumentoTextosPage
/admin/correos                  → CorreosPage (vista previa de los emails)
```

## Consumo de la API — formatos esperados
| Servicio | Formato respuesta |
|---|---|
| `getPresupuestos({ page, per_page, estado, search })` | paginación Laravel (`data`, `total`, `current_page`…) + `contadores: { todos, borrador, enviado, aceptado, facturado, rechazado, desactivado }` |
| `getFacturas({ page, per_page, estado, search })` | paginación Laravel (`data`, `total`…) |
| `getClientes({ page, per_page, search })` | `{ data: [...], meta: { total, … } }` · `getClientesSelect()` pide `per_page: 1000` |
| `getDashboard()` | `{ presupuestos, facturas, clientes, emisores, usuarios, documento_textos, series }` (ver registro 2026-10-09 dashboard) |
| `getEmisores()` | array plano |
| `getDocumentoTextos()` | array plano |
| `createXxx()` | devuelve el recurso creado — algunos con wrapper `data`, otros sin él |

## Tema
- Dark/light mode persistido en `localStorage('themeMode')`
- Usar `useThemeMode()` para acceder a `mode` y `toggleTheme`
- Usar `useTheme()` + `useMediaQuery()` de MUI para responsive

## Notas
- Rol `emisor`: layout y dashboard existen pero sin funcionalidad real (placeholder)
- El `AdminSidebar` controla la navegación — añadir nuevas rutas admin también ahí

## Registro de cambios

### 2026-10-09 — PDF de presupuesto (API)
Archivo: `api-facturacion/resources/views/pdf/presupuesto.blade.php`
- Eliminado el badge de **estado** de la cabecera del PDF (y su clase CSS `.status`). El estado es dato interno: se gestiona solo en la tabla de presupuestos del admin, no en el documento que recibe el cliente. Se mantiene la marca de agua `BORRADOR` cuando el estado es `borrador`.
- Columna "Descripción" renombrada a **"Trabajos a realizar"**.
- El importe ya no aparece en la primera fila junto a la descripción: esa celda queda vacía y el monto se muestra en una fila final **"Total presupuesto"** dentro de la misma tabla, en la columna Importe. Se eliminó la tabla `.totals` separada que duplicaba el total.

### 2026-10-09 — PDF de presupuesto: emisor en pie de página (API)
Archivo: `api-facturacion/resources/views/pdf/presupuesto.blade.php`
- Los datos del **emisor** salen de la parte superior y pasan a un **pie de página fijo** (`.footer`, `position: fixed`), que dompdf repite en todas las páginas. Va en 3 líneas centradas: nombre · NIF / dirección · CP población, provincia / Tel · Email. Solo se muestran los campos que tienen valor.
- `@page` pasa a tener margen inferior `110px` para reservar el hueco del pie (`bottom: -90px`, `height: 70px`).
- En la parte superior solo queda la tarjeta **"Datos del cliente"** (60% de ancho), que muestra **únicamente los campos que existen**: ya no hay guiones `-` de relleno. Nombre en negrita como título de la tarjeta; CP, población y provincia en una sola línea.
- Las líneas de cliente y emisor se montan en un bloque `@php` al inicio del contenido.

### 2026-10-09 — PDF de presupuesto: cabecera (API)
Archivo: `api-facturacion/resources/views/pdf/presupuesto.blade.php`
- Quitado el recuadro gris de la fecha: la clase `.document-box` se sustituye por `.document-date`, sin fondo ni borde. La fecha se mantiene como texto alineado a la derecha.
- Título en mayúsculas: `PRESUPUESTO` (además, `text-transform: uppercase` en `.title`).

### Lógica de presupuestos (referencia, vigente desde 2026-10-09)
- Estados guardados (enum BD): `borrador`, `enviado`, `aceptado`, `rechazado`, `desactivado`.
- **"Facturado" no se guarda**: se calcula a partir de `facturas.presupuesto_id`, que es la única fuente de verdad de la relación. Un presupuesto facturado sigue con `estado = aceptado` en BD.
  - Modelo `Presupuesto`: `$appends = ['facturado', 'editable']`.
    - `facturado` = tiene factura.
    - `editable` = `estado !== 'desactivado' && !facturado`.
  - Scope `estadoVisual($estado)`: `facturado` → `has('factura')`; cualquier otro → `where estado` + `doesntHave('factura')`.
  - Front: `getEstadoVisual(row)` en `features/presupuestos/presupuestoEstados.js` → `row.facturado ? 'facturado' : row.estado`.
- Flujo:
  - `store` → `borrador`.
  - `enviar` (borrador|rechazado → enviado). Compartir por email o WhatsApp también lo pasa a `enviado`.
  - `aceptar` / `rechazar` solo desde `enviado`.
  - `facturar` solo `aceptado` y sin factura.
  - `desactivar` si no hay factura.
- **Edición**: permitida en cualquier estado mientras `editable`. Si estaba `enviado`/`aceptado`, el estado no cambia y la respuesta incluye `requiere_reenvio: true`; el front muestra un aviso y abre el diálogo de compartir. La **fecha no puede cambiar de año** (422 en `fecha`), porque el número pertenece a la serie de ese año.
- **Facturación**: centralizada en `App\Services\FacturacionService::facturarPresupuesto($id, $datos = [])`, que usan tanto `POST /presupuestos/{id}/facturar` como `POST /facturas` con `presupuesto_id`.
  - Transacción con `lockForUpdate` sobre el presupuesto; el número de serie se genera dentro, así que si algo falla no se consume.
  - Cliente y emisor siempre los del presupuesto.
  - Errores de negocio → `App\Exceptions\FacturacionException` (se renderiza sola como `{ message }` con status 403/409/422).
  - Índice único `facturas.presupuesto_id` como red de seguridad contra dobles facturas.


### 2026-10-09 — Edición hasta facturar, "Facturado" calculado y nueva tabla de presupuestos

**API (`api-facturacion`)**
- Nueva migración `2026_10_09_000001_add_unique_presupuesto_id_to_facturas.php`: índice único en `facturas.presupuesto_id`. Hay que ejecutar `php artisan migrate`; fallará si ya existen dos facturas con el mismo presupuesto.
- `app/Models/Presupuesto.php`: atributos calculados `facturado` y `editable` (en `$appends`) y scope `estadoVisual`.
- Nuevo `app/Services/FacturacionService.php` y `app/Exceptions/FacturacionException.php`.
- `FacturaController`:
  - `fromPresupuesto` y `store` (con `presupuesto_id`) delegan en el servicio.
  - Eliminado el `update(['estado' => 'aceptado'])` que había tras crear la factura en `store`.
  - `index` carga `presupuesto.factura` para que `facturado` no lance una consulta por fila.
- `PresupuestoController`:
  - `index`:
    - Valida `per_page` (1-100), `estado` (incluye `facturado`) y `search` (nº, `nº/año`, nombre del cliente o texto de trabajos).
    - Ordena por año y número descendentes.
    - Añade `contadores` por estado visual, que respetan `search` pero no `estado`.
  - `update`:
    - Nueva regla `editable`: 409 si está facturado o desactivado.
    - Valida que la fecha sea del mismo año que el número.
    - Transacción con `lockForUpdate`.
    - Devuelve el presupuesto con `cliente`, `emisor`, `factura` y `requiere_reenvio`.
  - `buildPreviewPayload`: añade `facturado`, `editable` y `factura: { id, numero, anio, estado } | null`. El PDF no los usa.

**Front (`facturacion-front`)**
- Nuevo `features/presupuestos/presupuestoEstados.js`:
  - `ESTADOS_PRESUPUESTO` (etiqueta y color por estado visual) y `FILTROS_ESTADO`.
  - `getEstadoVisual`, `getEstadoConfig`.
  - `formatEuro` (formato es-ES) y `htmlToText`.
- `presupuestos.service.js`: `getPresupuestos` envía `estado` y `search`.
- `PresupuestosPage.jsx` rediseñada:
  - Búsqueda con retardo de 400 ms y filtros rápidos por estado con contador.
  - Paginación en el servidor: DataGrid `paginationMode="server"`; en móvil, `Pagination`.
  - Columnas: Nº · Cliente/trabajos (2ª línea con el resumen de trabajos o el enlace "↳ Factura N/AAAA") · Emisor (solo si hay más de un emisor) · Fecha · Importe (alineado a la derecha, es-ES) · Estado (chip; Facturado en color `secondary`) · Acciones.
  - Acciones: un botón con la acción principal del estado (Enviar / Aceptar / Facturar / Factura) y un menú ⋮ con el resto (Ver detalle, Editar si `editable`, Compartir, Marcar como rechazado, Desactivar).
  - Clic en la fila abre la vista previa. Las filas desactivadas se muestran atenuadas.
  - Móvil: tarjetas con nº y estado arriba, cliente y trabajos, fecha e importe grande, y las acciones.
  - Tras editar con `requiere_reenvio`, se muestra un aviso y se abre el diálogo de compartir.
- `PresupuestoForm.jsx`:
  - Aviso si el presupuesto ya se envió o aceptó.
  - Errores del API mostrados en un `Alert`, en lugar de `alert()`.
  - Fecha limitada al año del número (`min`/`max` y texto de ayuda).
  - El campo Estado muestra la etiqueta visual.
  - `onSaved(saved)` recibe ahora el presupuesto guardado.
- `PresupuestoPreview.jsx`: botón "Factura N/AAAA" junto a "Volver" si está facturado.
- `FacturaPreview.jsx` y `FacturasPage.jsx` (columna Origen): enlace al presupuesto de origen.
- `FacturaForm.jsx`: pide `getPresupuestos({ per_page: 100, estado: 'aceptado' })`, que ya devuelve solo los pendientes de facturar, y filtra por `!facturado`.

### 2026-10-09 — Dashboard admin con conteos y totales

**API**
- Nuevo `app/Http/Controllers/Api/DashboardController.php` y ruta `GET /dashboard` (bajo `auth:sanctum`). Respuesta:
  ```
  presupuestos: { total, importe (sin desactivados), por_estado: { borrador|enviado|aceptado|facturado|rechazado|desactivado: { total, importe } } }
  facturas:     { total, importe, desde_presupuesto, por_estado: { emitida|pagada|vencida: { total, importe } } }
  clientes:     { total, activos }
  emisores:     { total }            ← la tabla emisores no tiene columna `activo` (aunque el modelo la declare)
  usuarios:     { total, activos }
  documento_textos: { total, activos }
  series:       { total, anio_actual }
  ```
- Presupuestos por estado visual con el scope `estadoVisual`: "facturado" se cuenta aparte y no se repite en "aceptado".

**Front**
- Nuevo `features/dashboard/services/dashboard.service.js` con `getDashboard()`.
- `app/Dashboard.jsx` deja de ser un texto fijo y pasa a mostrar:
  - 4 indicadores clicables: Presupuestos (nº e importe presupuestado), Facturas (nº e importe facturado), Pendiente de cobro (importe y nº de facturas `emitida`) y Clientes (total y activos).
  - Desglose "Presupuestos por estado" (reutiliza `ESTADOS_PRESUPUESTO`) y "Facturas por estado", con nº de registros e importe en cada estado.
  - Fila "Configuración": emisores, usuarios, textos legales y series, cada uno enlazado a su pantalla.
  - Aviso si faltan series del año en curso (hacen falta 2: presupuesto y factura).

### 2026-10-09 — Formulario de clientes rediseñado
Archivo: `src/features/clientes/pages/ClienteForm.jsx`
- **Causa de los campos pequeños**: se usaba la sintaxis antigua de Grid (`<Grid item xs={12} sm={4}>`), que **MUI v7 ignora**, así que los campos no ocupaban el ancho previsto. Ahora se usa `<Grid size={{ xs: 12, sm: 4 }}>`.
  - **Patrón a seguir siempre**: `Grid` con la prop `size`, nunca `item`/`xs`/`sm` sueltos.
  - El resto de pantallas se migró en la entrada siguiente.
- Agrupado en 3 secciones (`Paper` outlined, componente local `Seccion`), cada una marcada como obligatoria u opcional:
  1. **Datos del cliente (obligatorio)**:
     - Tipo como `ToggleButtonGroup` con iconos (particular / comunidad / empresa).
     - Nombre `*`, cuya etiqueta cambia según el tipo: "Nombre y apellidos" / "Nombre de la comunidad" / "Razón social".
     - NIF/CIF (opcional), que se guarda en mayúsculas.
  2. **Dirección (opcional)**: dirección a ancho completo; debajo, CP · población · provincia.
  3. **Contacto (opcional)**: email y teléfono con iconos y un texto que explica que se usan para enviar por email o WhatsApp (teléfono con prefijo de país).
- Obligatorios según el API: `tipo` y `nombre`. El resto es `nullable`.
- Validación en el cliente: nombre obligatorio y formato de email. Los errores 422 de Laravel se muestran bajo cada campo y el mensaje general en un `Alert`, en lugar de `alert()`.

### 2026-10-09 — Migración de Grid a la sintaxis de MUI v7 en toda la app
Se sustituyó la sintaxis antigua (`<Grid item xs={..} sm={..}>`, que MUI v7 ignora) por la prop `size`, igual que en `ClienteForm`. 28 casos:
- `features/emisores/pages/EmisorForm.jsx` (9)
- `features/facturas/pages/FacturaForm.jsx` (9)
- `features/users/pages/UserForm.jsx` (4)
- `features/series/pages/SerieForm.jsx` (2)
- `features/facturas/pages/FacturaPreview.jsx` (2): bloque emisor/cliente
- `features/presupuestos/pages/PresupuestoPreview.jsx` (2): bloque emisor/cliente

Reglas de la conversión:
- Solo `xs` → `size={12}`.
- Varios breakpoints → `size={{ xs: 12, sm: 6, md: 4 }}`.

No se cambió nada más. Ya no queda ningún `<Grid item>` en `src/`.

### 2026-10-09 — Vistas previas de presupuesto y factura rediseñadas
**Componentes comunes nuevos**
- `common/documentPreview/DocumentSheet.jsx`:
  - El documento se pinta como una **hoja de papel que reproduce el PDF**, con colores claros fijos (`PAPER`) también en modo oscuro.
  - Marca de agua opcional.
  - `RichText` da estilo al HTML de TipTap (párrafos, listas, encabezados).
  - `PartyLines` muestra solo las líneas con datos.
  - `SheetFooter` es el pie con el emisor, como en el PDF de presupuesto.
- `common/documentPreview/PreviewShell.jsx`:
  - Barra superior fija (sticky) bajo el AppBar (`top: { xs: 64, sm: 72 }`) con volver, título, chip de estado y acciones.
  - Rejilla con el documento a la izquierda y un **panel interno** de 300px a la derecha (en móvil, el panel va encima).
  - Esqueleto de carga y estado de error con botón para volver.
- `common/ShareDialog.jsx`:
  - Diálogo de compartir reutilizable que muestra el email y el teléfono del cliente.
  - Desactiva "Enviar email" si el cliente no tiene email y avisa si no tiene teléfono.
- `features/facturas/facturaEstados.js`: `ESTADOS_FACTURA` y `getEstadoFacturaConfig`. `Dashboard.jsx` lo usa ahora en lugar de su copia local.

**`PresupuestoPreview.jsx`**
- La hoja reproduce el PDF actual:
  - "PRESUPUESTO" con la fecha a la derecha y sin número, igual que el PDF.
  - Tarjeta "Datos del cliente" (60%).
  - Tabla "Trabajos a realizar | Importe" con la fila final "Total presupuesto".
  - Observaciones, textos legales y pie con los datos del emisor.
  - Marca de agua BORRADOR si está en borrador.
- Panel interno:
  - Estado (visual, incluye Facturado), número, fecha e importe.
  - Botón "Ver factura" si está facturado.
  - Contacto del cliente con "Compartir".
  - Aviso de que las observaciones salen en el PDF.
  - Enlace "Ver el PDF real".
- Barra:
  - **Editar** (si `editable`): abre `PresupuestoForm` desde la propia vista previa. Tras guardar recarga y, si hace falta reenviar, abre el diálogo de compartir.
  - Ver PDF, Descargar y Compartir.
- Compartir ahora **pasa por `ShareDialog`**: antes "Enviar email" mandaba el correo directamente, sin confirmar. Si está en borrador o rechazado, el diálogo avisa de que pasará a "Enviado".
- El `presupuesto` que se pasa al formulario está memorizado con `useMemo`, porque `PresupuestoForm` recarga sus datos cuando cambia la referencia.

**`FacturaPreview.jsx`**
- La hoja reproduce el PDF de factura:
  - "FACTURA" con un recuadro de nº, fecha y estado.
  - Tarjetas de emisor y cliente.
  - Bloque de totales a la derecha (base, IVA y total destacado).
  - Recuadro con el IBAN como datos de pago.
  - Línea "Generada desde presupuesto…" y texto legal.
- Panel interno:
  - Estado, número, fecha y desglose económico.
  - **Marcar como pagada, ahora con `ConfirmActionDialog`** (antes se marcaba sin confirmar).
  - "Ver presupuesto" de origen.
  - Contacto del cliente con "Compartir".
- Los importes se muestran con `formatEuro` (es-ES) y los estados con su etiqueta: "Pendiente de cobro" en lugar de "emitida".

**Pendiente de decidir (no implementado)**
- ~~El PDF de factura no incluye concepto ni descripción de los trabajos.~~ Resuelto el 2026-10-10 con `facturas.descripcion` ("Trabajos realizados").
- ~~Las "observaciones internas" del presupuesto se imprimen en el PDF del cliente.~~ Resuelto el 2026-10-10 con `mostrar_observaciones`.

### 2026-10-10 — Observaciones del presupuesto: internas o visibles + espaciado del PDF

**API**
- Migración `2026_10_10_000001_add_mostrar_observaciones_to_presupuestos.php`: columna `presupuestos.mostrar_observaciones` (boolean, `default false`). Hay que ejecutar `php artisan migrate`.
  - **Los presupuestos existentes quedan con las observaciones ocultas en el PDF**; hay que marcarlas a mano si se quieren mostrar.
- Modelo `Presupuesto`: `mostrar_observaciones` en `$fillable` y cast `boolean`.
- `PresupuestoController`:
  - `store` y `update` validan `mostrar_observaciones` (boolean).
  - `buildPreviewPayload` lo incluye en `documento`.
- `pdf/presupuesto.blade.php`:
  - Las observaciones solo se imprimen si `mostrar_observaciones` es true y tienen texto (se ignora el HTML vacío de TipTap).
  - **Espaciado**: el bloque de observaciones va en `.notes-section` (`margin-top: 24px`) y los textos legales en `.legal-section` (`margin-top: 20px`).
  - Antes el recuadro de observaciones quedaba pegado al primer texto legal.

**Front**
- `PresupuestoForm.jsx`:
  - La sección pasa a llamarse "Observaciones", con una explicación: por defecto son internas.
  - Casilla "Mostrar las observaciones en el presupuesto (PDF que recibe el cliente)" (`form.mostrar_observaciones`).
- `PresupuestoPreview.jsx`:
  - La hoja muestra las observaciones solo si `mostrar_observaciones`, igual que el PDF. Separación de los textos legales ampliada a `mt: 3.5`.
  - Si son internas, aparecen en el panel lateral como "Observaciones internas" con el chip "No salen en el PDF".
  - Si se muestran, el panel avisa de que el cliente las verá.

**Siguiente paso acordado**: añadir a la factura los trabajos del presupuesto (`descripcion`) como "Trabajos realizados".

### 2026-10-10 — Formularios de presupuesto y factura mejorados (sin cambios de lógica)
**No cambia lo que se envía al API.**
- Presupuesto: `{ cliente_id, emisor_id, fecha, total, descripcion, observaciones, mostrar_observaciones, documento_texto_ids }`.
- Factura: `{ presupuesto_id|null, cliente_id, emisor_id, fecha, base_imponible, iva_porcentaje, iban }`.

**Nuevo `common/FormSection.jsx`**: secciones numeradas con la marca (obligatorio)/(opcional). Se usa en los dos formularios.

**`PresupuestoForm.jsx`**
- 5 pasos:
  1. Cliente y emisor.
  2. Fecha e importe.
  3. Trabajos a realizar.
  4. Observaciones (opcional).
  5. Textos legales (opcional).
- Cliente con `Autocomplete` que busca por nombre y muestra NIF y población. Avisa si el cliente no tiene email ni teléfono.
- Si el cliente del presupuesto está desactivado (no viene en `getClientesSelect`), se añade a las opciones para no perderlo al editar.
- Al crear: fecha de hoy por defecto y emisor preseleccionado si solo hay uno.
- La ayuda de la fecha indica con qué serie de año se numera. Al editar se limita al año de la numeración, como antes.
- Importe con el símbolo €, vista previa en formato es-ES y el aviso "sin IVA".
- Observaciones con interruptor (`Switch`) y chip "Solo interno" / "Visible en el PDF".
- Textos legales en dos columnas: "Disponibles" (casillas) y "Orden en el PDF" (flechas), con un contador de seleccionados.
- Validación en el cliente por campo: cliente, emisor, fecha (y su año), importe ≥ 0 y trabajos con texto. Los errores 422 del API también se muestran bajo cada campo.
- Mientras carga hay un `LinearProgress` y el botón de guardar está desactivado; antes se podía guardar el formulario vacío si los datos tardaban.
- El título muestra el número y el chip de estado al editar.
- El pie muestra el cliente y el importe.
- Un clic fuera del diálogo ya no lo cierra (solo Cancelar o Escape).

**`FacturaForm.jsx`**
- 3 pasos:
  1. Origen.
  2. Fecha e importes.
  3. Datos de pago (opcional).
- **Origen** con `ToggleButtonGroup`:
  - "Desde presupuesto (n)": `Autocomplete` de los aceptados pendientes, con nº, cliente, resumen de trabajos e importe. Muestra una tarjeta resumen del cliente y el emisor. Al elegirlo rellena cliente, emisor, base e IBAN, igual que antes.
  - "Factura manual": `Autocomplete` de cliente y desplegable de emisor; el IBAN se rellena al elegir el emisor, como antes.
  - Si no hay presupuestos pendientes, empieza en modo manual (y con el emisor preseleccionado si solo hay uno). Cambiar de modo limpia los datos del presupuesto.
- Importes:
  - Base con el símbolo €, desactivada en el modo presupuesto, como antes.
  - IVA con chips rápidos 21/10/4/0 y campo libre entero.
  - **Resumen calculado en vivo** (base, IVA y total) con el mismo redondeo que el API.
- IBAN en mayúsculas y monoespaciado.
- Validación por campo, errores 422 bajo cada campo, `LinearProgress` mientras carga, pie con el cliente y el total, y no se cierra con un clic fuera.

### 2026-10-10 — Editor de texto (TipTap): fuera el recuadro negro y otras correcciones
Archivo: `src/common/DocumentoTextoEditor.jsx`. Sus props siguen siendo compatibles: `value`, `onChange`; se añaden, opcionales, `placeholder`, `minHeight` y `error`.
- **Causa del recuadro negro**: el área editable de TipTap (`.ProseMirror`, un `contenteditable`) no tenía estilos. Al recibir el foco, el navegador le pintaba su borde negro por defecto, y como solo medía lo que ocupaba el texto (una línea), se veía como una franja dentro del recuadro.
  - Solución: `.ProseMirror { outline: none; min-height }`.
  - El foco se marca en todo el recuadro (`:focus-within`, borde y sombra del color primario), como en un `TextField`.
- Barra y área de escritura en **un único recuadro** (la barra arriba con fondo suave). Hacer clic en una zona vacía lleva el cursor al final del texto.
- **Placeholder** cuando el editor está vacío, sin dependencias nuevas: un `Typography` superpuesto que se muestra si `editor.isEmpty`.
- **Botones activos**: en TipTap v3 `useEditor` no repinta en cada cambio, así que los botones no se marcaban. Ahora se usa `useEditorState` para negrita, cursiva, títulos, listas, vacío y deshacer/rehacer.
- **Sincronización del valor**: `content` solo se aplicaba al crear el editor. Ahora, si `value` cambia desde fuera y el editor no tiene el foco, se aplica con `setContent(value, { emitUpdate: false })`. Esto afecta, por ejemplo, a la carga asíncrona al editar un presupuesto.
- Nuevos botones **Deshacer/Rehacer**. Los títulos se muestran como "H1/H2/H3". Los botones no roban el foco (`onMouseDown preventDefault`), así que se mantiene la selección.
- `error` pone el borde en rojo. `PresupuestoForm` lo usa en "Trabajos a realizar" y pasa placeholders a los dos editores.
- `DocumentoTextoForm.jsx`: quitado el borde del contenedor para no duplicar el del editor.
- Nota: `src/index.css` (plantilla de Vite) tiene reglas globales `button:focus { outline: 4px auto … }` y `button:hover { border-color }` que afectan a los botones MUI. En el editor se anulan con `outline: none`; no se han tocado a nivel global.

### 2026-10-10 — Facturas: trabajos realizados, IVA al facturar, PDF como el del presupuesto

**API**
- Migración `2026_10_10_000002_add_descripcion_to_facturas.php`: columna `facturas.descripcion` (longText, nullable) con los "Trabajos realizados". Hay que ejecutar `php artisan migrate`.
  - Es una **copia** guardada en la factura, para que el documento fiscal no cambie aunque se toque el presupuesto.
  - La migración rellena las facturas existentes que vienen de un presupuesto con su `descripcion`.
- `Factura`: `descripcion` en `$fillable`.
- `FacturacionService::facturarPresupuesto`: `descripcion` = `$datos['descripcion']` o, si no viene, la del presupuesto.
- `FacturaController`:
  - `store` valida `descripcion` como `required_without:presupuesto_id|nullable|string` (obligatoria en factura manual).
  - `fromPresupuesto(Request)` acepta ahora **`iva_porcentaje`** (entero 0-100) y **`fecha`**, ambos opcionales; sin ellos sigue siendo 21 % y hoy.
  - `buildPreviewPayload` incluye `documento.descripcion`.
- `pdf/factura.blade.php` rediseñado como el de presupuesto:
  - "FACTURA" con Nº y fecha a la derecha, sin recuadro y **sin estado** (dato interno).
  - Solo la tarjeta "Datos del cliente" (60%) arriba.
  - Tabla "Trabajos realizados | Importe": fila de trabajos (si hay texto) y debajo las filas Base imponible / IVA (x%) / **Total factura**.
  - Recuadro del IBAN y texto legal.
  - **Datos del emisor en el pie fijo** (`.footer`, `@page` con margen inferior de 110px).
  - **Quitado "Generada desde presupuesto X/AAAA"**, que ahora va solo en el panel interno de la vista previa.

**Front**
- Nuevo `features/presupuestos/components/FacturarDialog.jsx`:
  - Al pulsar "Facturar" en `PresupuestosPage` se elige la **fecha** y el **IVA** (chips 21/10/4/0 o un entero libre), con un resumen calculado de base, IVA y total.
  - Llama a `facturarPresupuesto(id, { iva_porcentaje, fecha })`.
  - `ConfirmActionDialog` sigue usándose para el resto de acciones.
- `presupuestos.service.js`: `facturarPresupuesto(id, data = {})`.
- `FacturaForm.jsx`:
  - Nuevo paso **2 · Trabajos realizados** (`DocumentoTextoEditor`, obligatorio). Al elegir un presupuesto se rellena con su descripción y se puede ajustar.
  - Los pasos pasan a ser: 1 Origen, 2 Trabajos, 3 Fecha e importes, 4 Datos de pago.
- `FacturasPage.jsx`:
  - **Fecha** formateada `DD/MM/YYYY`; antes salía el ISO `2026-10-09T00:00:00.000000Z`. También en las tarjetas de móvil.
  - Total con `formatEuro` y alineado a la derecha.
  - Estado con la etiqueta de `facturaEstados`.
- `FacturaPreview.jsx`:
  - La hoja reproduce el nuevo PDF: sin estado, cliente arriba, tabla de trabajos con totales, IBAN, texto legal y pie con el emisor.
  - El panel "Resumen" añade la fila **Origen** ("Generada desde presupuesto X/AAAA" o "Factura manual").

**Pendiente / ideas**: IVA por defecto por emisor (hoy, 21 % fijo como valor inicial en los formularios).

### 2026-10-10 — Editar IVA y fecha de facturas pendientes de cobro

**API**
- Nuevo `FacturaController::update` (ruta `PUT /facturas/{factura}` de `apiResource`, que ya existía pero no tenía método).
  - Body: `{ iva_porcentaje (entero 0-100), fecha }`. Ambos obligatorios.
  - Solo si `estado === 'emitida'`; si no, 409. Transacción con `lockForUpdate` para no chocar con "marcar pagada".
  - La **fecha debe ser del mismo año** que `anio` (422 en `fecha`), porque el número pertenece a la serie de ese año.
  - La base imponible no cambia. Se recalculan `iva_importe` (redondeo a 2 decimales) y `total`.
  - Devuelve la factura con `cliente`, `emisor` y `presupuesto`.

**Front**
- Nuevo `common/IvaFechaDialog.jsx`: el diálogo genérico de fecha + IVA que antes estaba dentro de `FacturarDialog`.
  - Props: `base`, `initialIva`, `initialFecha`, `anioFijo`, `header`, `info`, `error`, `confirmText`, `confirmIcon`, `loading`, `onConfirm({ iva_porcentaje, fecha })`.
- `features/presupuestos/components/FacturarDialog.jsx`: ahora es una capa fina sobre `IvaFechaDialog`; el comportamiento no cambia.
- Nuevo `features/facturas/components/EditarFacturaDialog.jsx`:
  - Usa `IvaFechaDialog` con `anioFijo = factura.anio` y los valores actuales.
  - Llama a `updateFactura` y muestra los errores del API dentro del diálogo.
  - Avisa de que hay que reenviar la factura si el cliente ya la tenía.
- `facturas.service.js`: `updateFactura(id, { iva_porcentaje, fecha })`.
- `FacturasPage.jsx`: icono "Editar IVA y fecha" en las facturas `emitida`, en escritorio y en móvil.
- `FacturaPreview.jsx`: botón "Editar IVA y fecha" en el panel Resumen si está `emitida`; al guardar recarga la vista previa.

**Nota fiscal**: en España, una factura ya entregada al cliente no se debería modificar, sino corregir con una **factura rectificativa**. Esta edición está pensada para corregir errores antes de enviarla o justo después. Si más adelante hace falta, se puede añadir un registro de cambios o bloquear la edición tras el envío.

### 2026-10-10 — Cabecera "Acciones" e icono de euro
- `PresupuestosPage.jsx` y `FacturasPage.jsx`: la columna `actions` del DataGrid tiene ahora `headerName: 'Acciones'` (antes vacía).
  - Siguen sin cabecera las tablas de clientes, usuarios, emisores y textos legales.
- Facturas: el icono `Paid` (moneda con símbolo $) de "marcar pagada" se sustituye por `Euro` (`@mui/icons-material/Euro`) en `FacturasPage.jsx` (tabla y tarjetas móvil) y `FacturaPreview.jsx`.
  - En la tabla de escritorio el botón tiene además el tooltip "Marcar como pagada".

### 2026-10-10 — Textos legales elegibles en las facturas (como en presupuestos)

**API**
- Migración `2026_10_10_000003_create_factura_documento_texto_table.php`: pivot `factura_documento_texto(factura_id, documento_texto_id, orden)`, igual que la de presupuestos. Hay que ejecutar `php artisan migrate`.
  - **Las facturas existentes reciben el mismo texto que imprimían antes** (el primer `documento_textos` de tipo `factura`), así su PDF no cambia.
- Modelo `Factura`:
  - Relación `documentoTextos()` (ordenada por `orden`).
  - `sincronizarTextos(?array $ids)`: guarda los textos en el orden recibido. Con `null` asigna el texto por defecto (el primer texto de factura **activo**); con `[]` no asigna ninguno.
- `FacturaController`:
  - `store`, `fromPresupuesto` y `update` aceptan `documento_texto_ids` (array; cada id debe ser de un texto con `tipo = 'factura'`).
  - En `update` solo se sustituyen si la clave viene en la petición, y únicamente mientras la factura está `emitida`.
  - `show` carga `documentoTextos`.
  - `buildPreviewPayload` devuelve **`textos_legales`** (array de HTML en orden) **en lugar de `texto_legal`**.
- `FacturacionService`: sincroniza `documento_texto_ids` dentro de la misma transacción.
- `pdf/factura.blade.php`: imprime todos los `textos_legales` en orden, en recuadros separados.

**Front**
- Nuevo `common/TextosLegalesSelector.jsx`, extraído de `PresupuestoForm`.
  - Dos columnas: "Disponibles" (casillas) y "Orden en el PDF" (flechas). `compact` las apila.
  - Marca "(inactivo)" en los textos desactivados que ya estaban asignados.
- `PresupuestoForm.jsx`: usa el componente común; el comportamiento no cambia.
- `FacturaForm.jsx`:
  - Nuevo paso **5 · Textos legales** (opcional). Carga los textos activos de tipo `factura` y marca el primero por defecto.
  - Envía `documento_texto_ids`.
- `IvaFechaDialog.jsx`: nuevas props `children` (campos extra entre el IVA y el resumen), `confirmDisabled` y `maxWidth`.
- `FacturarDialog.jsx` (facturar desde el listado de presupuestos): incluye el selector de textos de factura, con el primero marcado.
- `EditarFacturaDialog.jsx` → **"Editar factura"**: fecha, IVA y **textos legales**.
  - Carga los textos actuales con `getFactura(id)`, más los activos. Los asignados que se hayan desactivado siguen apareciendo.
  - Solo para facturas pendientes de cobro.
- `FacturaPreview.jsx`:
  - Pinta `textos_legales` (varios).
  - El botón del panel pasa a llamarse "Editar factura".
- `FacturasPage.jsx`: el tooltip del lápiz es "Editar factura (fecha, IVA y textos legales)".

**Idea pendiente**: preseleccionar automáticamente los textos según el tipo de cliente (particular / comunidad / empresa). Requeriría un campo `tipo_cliente` opcional en `documento_textos`.

### 2026-10-10 — Título en los textos legales y vista de su contenido
**Antes**, el "título" de un texto legal no existía: el front lo sacaba del primer `<strong>` del contenido (`getTituloDoc`), y si no había ninguno mostraba "Documento #id".

**API**
- Migración `2026_10_10_000004_add_titulo_to_documento_textos.php`: columna `documento_textos.titulo` (string 150, nullable). Hay que ejecutar `php artisan migrate`.
  - Rellena los textos existentes con lo que se mostraba hasta ahora: el primer `<strong>` o, si no hay, los primeros 60 caracteres del texto. Si queda vacío, pone "Texto #id".
- `DocumentoTexto`: `titulo` en `$fillable`.
- `DocumentoTextoController`: `store` y `update` validan `titulo` como `required|string|max:150`.
- **El título es interno: no se imprime en los PDF** (solo se imprime `contenido`).

**Front**
- `common/TextosLegalesSelector.jsx`:
  - `getTituloDoc(doc)` usa `doc.titulo` y, si no lo hay, sigue con el primer `<strong>` o "Texto #id".
  - Cada texto disponible tiene un botón de ojo, **"Ver contenido"**, que despliega (`Collapse`) el contenido tal como sale en el PDF, usando `DocumentoTextoPreview`.
  - Se aplica en todos los sitios donde se eligen textos: formulario de presupuesto, formulario de factura, diálogo de facturar y "Editar factura".
- `DocumentoTextoForm.jsx`:
  - Campo **Título** obligatorio, que explica que no se imprime. Si está vacío, un botón propone uno a partir del contenido ("Usar «…» como título").
  - Validación por campo (título y contenido); errores del API en un `Alert`, en lugar de `alert()`.
  - Placeholder en el editor y no se cierra con un clic fuera.
- `DocumentoTextosPage.jsx`:
  - Columna **"Título / contenido"** (título en negrita y resumen del contenido debajo), que sustituye a "Contenido".
  - Columna "Acciones" con **Ver contenido** (diálogo con el texto completo y botón para editarlo) y Editar.
  - Las tarjetas de móvil muestran el título y tienen el botón "Ver".

**Nota**: los presupuestos guardan la referencia al texto, no una copia: si se edita un texto legal, cambia también en sus PDF. Las **facturas** guardan una copia desde el 2026-10-10 (ver "Datos congelados en la factura").

### 2026-10-10 — Tooltips en acciones y estado clicable en las tablas
**`FacturasPage.jsx`**
- Nuevos helpers `renderAcciones(factura)` y `renderEstadoChip(factura, sx)`, compartidos por escritorio y móvil (antes las acciones estaban duplicadas y casi sin tooltips).
- **Tooltips en todas las acciones**:
  - Ver: "Ver factura (vista previa, PDF y compartir)".
  - Editar: "Editar factura (fecha, IVA y textos legales)".
  - Euro: "Marcar como pagada (ya no se podrá editar)".
- **El chip de estado es clicable** y abre la vista de la factura, con el tooltip "<estado> · Ver factura N/AAAA".
- **Clic en la fila** (DataGrid `onRowClick`) o en la tarjeta de móvil abre la vista de la factura, como en presupuestos. Las acciones, el estado y el enlace de origen usan `stopPropagation`.

**`PresupuestosPage.jsx`**
- **Chip de estado clicable** con tooltip:
  - Si está **Facturado**, abre **su factura** ("Facturado · Ver factura N/AAAA").
  - En cualquier otro estado, abre la vista del presupuesto.
- Tooltips explicativos en el botón de la acción principal:
  - Enviar: "Marcar como enviado y compartir el PDF…".
  - Aceptar: "…quedará pendiente de facturar".
  - Facturar: "Crear la factura eligiendo fecha, IVA y textos legales".
  - Factura: "Ver la factura de este presupuesto".
- El menú ⋮ tiene el tooltip "Más acciones: ver, editar, compartir, rechazar o desactivar".

### 2026-10-10 — Crear el primer administrador por consola (API)
- Nuevo comando **`php artisan app:crear-admin`** (`app/Console/Commands/CrearAdmin.php`; Laravel 12 lo registra solo desde `app/Console/Commands`).
  - Pide por consola, con `laravel/prompts`: **nombre**, **email** y **contraseña**. La contraseña se escribe dos veces y no se muestra mientras se teclea.
  - Validación al momento:
    - email con formato válido y que no esté ya registrado;
    - contraseña de al menos 8 caracteres y que coincida al repetirla.
  - Crea el usuario con **`role = admin`** y **`activo = true`**; la contraseña se guarda con `Hash::make`. El email se guarda en minúsculas.
  - Si ya existe algún admin, avisa y pide confirmación antes de crear otro.
  - Modo sin preguntas, para scripts o Docker: `--name= --email= --password=`. Pasa la misma validación. No se recomienda `--password`, porque queda en el historial de la terminal.
- `database/seeders/DevUserSeeder.php`: ya **no tiene datos fijos** (antes creaba `admin@local.test` / `password`). Ahora llama a `app:crear-admin`, así que `php artisan db:seed --class=DevUserSeeder` también pide los datos.
- Uso recomendado en producción, tras `php artisan migrate --force`: `php artisan app:crear-admin`.
- Nota: `DatabaseSeeder` sigue creando "Test User" con la factory (rol por defecto `emisor`). No se ha tocado; no conviene ejecutarlo en producción.

### 2026-10-10 — Datos congelados en la factura + texto legal para IVA 0 %

**API: copia de los datos al emitir la factura**
- Migración `2026_10_10_000005_add_datos_congelados_to_facturas.php`: columnas JSON en `facturas`.
  - `emisor_datos`: nombre, NIF, dirección, CP, población, provincia, email, teléfono e IBAN.
  - `cliente_datos`: tipo, nombre, NIF, dirección, CP, población, provincia, email y teléfono.
  - `textos_legales_datos`: `[{ id, titulo, contenido }]` en orden.
  - Las facturas existentes se rellenan con los datos actuales, que es lo más fiel que hay.
- Modelo `Factura`:
  - Casts `array` para las tres columnas y constantes `CAMPOS_CLIENTE` / `CAMPOS_EMISOR`.
  - `congelarEmisorYCliente()`: copia los datos del emisor y del cliente. **Solo se llama al crear la factura**, en `FacturacionService` y en `store` manual; después no cambian aunque se editen sus fichas.
  - `congelarTextos()`: copia el título y el contenido de los textos elegidos. `sincronizarTextos()` la llama siempre, así que también se actualiza al usar "Editar factura".
  - `datosCliente()`, `datosEmisor()` y `textosLegalesImpresos()` devuelven la copia o, si no existe, los datos actuales. En `datosEmisor()`, el `iban` de la propia factura tiene prioridad.
- `FacturaController::buildPreviewPayload` usa esos métodos, así que **el PDF y la vista previa muestran los datos congelados**.
- Siguen usando los datos actuales (a propósito):
  - el listado de facturas (nombre del cliente);
  - el envío por email o WhatsApp, que se manda al email o teléfono actual del cliente.

**API: IVA 0 %**
- Migración `2026_10_10_000006_insert_texto_iva_cero_inversion_sujeto_pasivo.php`: crea el texto legal de factura **"IVA 0 % · Inversión del sujeto pasivo"**, activo, con la mención al art. 84.Uno.2º.f) LIVA. No hace nada si ya existe uno con ese título.
- **Convención**: los textos de factura cuyo título empieza por **"IVA 0 %"** (`Factura::PREFIJO_TEXTO_IVA_CERO`) **nunca se marcan por defecto**. `sincronizarTextos(null)` los excluye.

**Front**
- `TextosLegalesSelector.jsx`: nuevas exportaciones:
  - `PREFIJO_TEXTO_IVA_CERO`;
  - `esTextoIvaCero(doc)`;
  - `textosPorDefecto(lista)`: el primer texto que no sea de IVA 0 %. Sustituye a `slice(0, 1)`.
- Nuevo `common/AvisoIvaCero.jsx`:
  - Si el IVA es 0 % y no hay ningún texto "IVA 0 %" elegido, muestra un aviso con un botón **"Añadir «IVA 0 % · …»"** por cada texto disponible.
  - Si no existe ninguno, explica cómo crearlo.
- `IvaFechaDialog.jsx`: `children` puede ser una función `({ iva }) => node`, para reaccionar al IVA elegido.
- El aviso aparece en:
  - `FacturaForm` (paso 3, bajo el IVA);
  - `FacturarDialog`;
  - `EditarFacturaDialog`.
- Los tres usan `textosPorDefecto`.
- Para añadir otros motivos (por ejemplo, exenta con su artículo), basta crear un texto legal de factura cuyo título empiece por "IVA 0 %".

### 2026-10-10 — Preparación para producción: seguridad, fallos, adaptación a dispositivos y despliegue en Hostinger

**1 · Seguridad (API)**
- `routes/api.php` reorganizado en tres bloques:
  - Público: `POST /login` con `throttle:login`. El PDF público firmado lleva `signed` y `throttle:30,1`; también el de presupuestos en `web.php`.
  - `auth:sanctum` + `activo`: `/me` y `/logout`.
  - `auth:sanctum` + `activo` + **`role:admin`**: todo lo demás. Antes cualquier usuario autenticado, incluido un `emisor`, podía usar todo el API, incluso crear admins.
- `RoleMiddleware` acepta varios roles (`role:admin,emisor`).
- Nuevo `EnsureUserIsActive` (alias `activo`): si el usuario está desactivado, responde 401 y borra el token usado.
- `AuthController::login`:
  - Comprueba la contraseña con `Hash::check` y luego `activo` (403 "Tu usuario está desactivado…").
  - Mismo mensaje si el email no existe o la contraseña es incorrecta.
- `AppServiceProvider`:
  - Limitador `login`: 5 intentos/min por email+IP y 20/min por IP. Responde 429 con mensaje en español.
  - `URL::forceScheme('https')` en producción.
  - `MAIL_OVERRIDE_TO_ADDRESS` ya se ignoraba en producción.
- `bootstrap/app.php`: `trustProxies(at: '*')` (Hostinger/CDN) para HTTPS y firmas válidas. Valor fijo porque `env()` no se lee ahí con la configuración cacheada.
- `config/sanctum.php`: `expiration` = `SANCTUM_EXPIRATION` (720 min por defecto).
  - `routes/console.php`: `sanctum:prune-expired --hours=24` diario (necesita el cron de `schedule:run`).
- `config/cors.php`: `allowed_origins` desde `CORS_ALLOWED_ORIGINS` (separados por comas; por defecto `http://localhost:5173`). `exposed_headers` = `Content-Disposition`.
  - El `.env` de desarrollo lleva `CORS_ALLOWED_ORIGINS=*`.
- `UserController`:
  - `role` debe ser `in:admin,emisor`.
  - Un admin no puede cambiarse el rol ni desactivarse a sí mismo (422).
  - Al desactivar, cambiar el rol o cambiar la contraseña de otro usuario se borran sus tokens.
  - `per_page` limitado a 1–100.
- Nuevo `.env.production.example`, una plantilla para Hostinger: MySQL, SMTP de Hostinger (465/`smtps`), `LOG_CHANNEL=daily` y `QUEUE_CONNECTION=sync`.
- `.env.example`: pasa a MySQL y añade `APP_TIMEZONE`, `CORS_ALLOWED_ORIGINS` y `SANCTUM_EXPIRATION`.

**2 · Fallos de uso**
- **Paginación** (antes solo se veían 10 o 15 registros):
  - `FacturaController::index`: `per_page` (1-100), `estado`, `search` (nº, nº/año o cliente); orden por año y número descendentes.
  - `ClienteController::index`: `per_page` hasta 1000; `search` por nombre, NIF, email o población; orden por nombre.
  - Front: `ClientesPage`, `UsersPage` y `FacturasPage` con paginación en el servidor (DataGrid `paginationMode="server"`; `Pagination` en las tarjetas).
  - `FacturasPage` con buscador y chips de estado.
  - `getClientesSelect()` pide `per_page: 1000`: **los buscadores de cliente de los formularios solo ofrecían 10**.
- **Variable del API**: el `.env` del front definía `VITE_API_URL`, pero el código lee `VITE_API_BASE_URL`, así que el build apuntaba al API local.
  - Corregido `.env`; nuevos `.env.example` y `.env.production.example`.
  - `.env` y `.env.production` añadidos a `.gitignore`. El `.env` ya estaba versionado: hay que hacer `git rm --cached .env`.
  - `src/lib/api.js` ya no tiene URL de respaldo y avisa en consola si falta la variable.
- **Login**:
  - El interceptor de 401 ignora la propia petición `/login` (antes recargaba la página y no se veía "Credenciales incorrectas").
  - Si la sesión caduca o el usuario se desactiva, guarda el mensaje en `sessionStorage` y `LoginPage` lo muestra.
  - `LoginPage` muestra el mensaje del API (401/403/429/422) o "No se pudo conectar…". Usa `autoComplete` y `autoFocus`.
- **Mensajes en español**:
  - Nuevo `lang/es/{validation,auth,pagination,passwords}.php` (con nombres legibles de los campos) y `lang/es.json`.
  - `config/app.php`: `locale` 'es', `timezone` `APP_TIMEZONE` (Europe/Madrid) y `faker_locale` es_ES. `.env` local con `APP_LOCALE=es`.
- `alert()` sustituidos por `Alert` en `UserForm`, `EmisorForm` y `SerieForm`, y por un Snackbar en `ClientesPage`. Muestran el error del API.

**3 · Adaptación a dispositivos y detalles**
- **Tarjetas hasta 900px**: Presupuestos y Facturas usan `down('md')`, así que en tablet ya no hay scroll horizontal. Se quitó `minWidth: 900` del DataGrid.
  - Por debajo de 1200px (`lg`), la fecha va bajo el número; en Facturas se ocultan además Emisor y Origen.
  - Clientes y Usuarios: sin `minWidth: 900`. En Clientes, población y provincia solo desde `lg`; nombre con tipo y NIF en una segunda línea.
- **Series**: tarjetas en móvil, chips de tipo y aviso si falta la serie de presupuesto o factura del año.
- **Emisores**: cabecera "Acciones" y tooltip.
- **Barra de la vista previa** (`PreviewToolbar`): en móvil, botones solo con icono (texto a `font-size: 0`, accesible para lectores de pantalla), sin chip de estado y sin saltos de línea.
- `IvaFechaDialog` a pantalla completa en móvil. `ShareDialog` con botones que bajan de línea si no caben.
- `AdminTopBar`:
  - Título corto ("Facturación") en móvil.
  - Tooltips en modo oscuro y en contraer menú.
  - El menú de cuenta muestra nombre, email y rol; se quitó "Mi cuenta", que no hacía nada.
- `AdminSidebar`: la sección activa se resalta (`selected` con `useLocation`) e icono propio para Usuarios.
- `EmisorLayout`: márgenes adaptables.
- **Rutas**:
  - `/` → `RootRedirect`: panel según el rol o login.
  - Ruta desconocida → `/`.
  - `LoginPage` redirige si ya hay sesión.
  - `/unauthorized` → `UnauthorizedPage`: tarjeta con "Ir a mi inicio" y "Cerrar sesión".
  - `FullPageLoader` sustituye a los "Cargando...".
- `index.html`: `lang="es"`, título "Facturación", `theme-color`, `noindex` y favicon propio (`public/favicon.svg`).
- `src/index.css`: eliminadas las reglas de la plantilla de Vite para `button` y `a`, que interferían con MUI; `overflow-x: hidden` en `body`.
- `public/.htaccess`, que Vite copia a `dist/`:
  - Fallback de SPA a `index.html` y HTTPS forzado.
  - `index.html` sin caché y assets con caché larga.
  - Cabeceras de seguridad y compresión.

**4 · Despliegue**: nueva guía **`DEPLOY-HOSTINGER.md`**, para hosting compartido de Hostinger con subdominios `api.` y `app.`. Incluye:
- Laravel fuera de `public_html` con enlace simbólico a `public/`, o `index.php` adaptado.
- `composer --no-dev`, `.env` y `key:generate`, `migrate --force`, `app:crear-admin` y cachés.
- Cron de `schedule:run`.
- Build local del front y subida de `dist/` (incluido `.htaccess`).
- SSL, comprobaciones, actualizaciones, copias de seguridad, problemas frecuentes y checklist de seguridad.

**Pendiente**: portal del emisor. Hoy `/emisor` es un marcador vacío y `users` no tiene `emisor_id`.

### 2026-10-10 — Login rediseñado y logotipo / favicon propios
- **Logotipo**: documento con líneas y una moneda verde con "€", sobre un fondo degradado azul.
  - `public/favicon.svg` sustituye al favicon anterior.
  - El mismo dibujo está como componente en **`common/AppLogo.jsx`** (`<AppLogo size={48} />`). Usa `useId` para el degradado, así que se pueden mostrar varios a la vez.
- **`features/auth/pages/LoginPage.jsx`** (la lógica no cambia: mensajes del API, aviso de sesión caducada y redirección si ya hay sesión):
  - **Escritorio (≥900px)**: pantalla partida.
    - A la izquierda, un panel de marca con degradado azul: logotipo, el titular "Presupuestos y facturas, en un solo lugar", 3 ventajas con iconos (presupuesto → factura, PDF por email o WhatsApp, control de cobros) y el ©.
    - A la derecha, el formulario.
  - **Móvil y tablet**: sin panel; logotipo y nombre encima del formulario, con un degradado suave arriba.
  - Formulario:
    - Iconos en email y contraseña.
    - **Mostrar u ocultar la contraseña**.
    - **Aviso de Bloq Mayús** activado.
    - Botón "Entrar" grande, desactivado hasta rellenar los dos campos.
    - El error se puede cerrar.
    - Nota: "¿Has olvidado la contraseña? Pide a un administrador…" (no hay recuperación por email).
  - Botón de modo claro u oscuro arriba a la derecha (`useThemeMode`).

### 2026-10-10 — Vistas previas: fuera "Ver PDF" y barra superior sin solapamientos
- `PresupuestoPreview.jsx` y `FacturaPreview.jsx`:
  - **Quitado el botón "Ver PDF"** (abría el PDF en otra pestaña). Se mantiene **"Descargar PDF"**, antes "Descargar". Quedan: Editar (si aplica), Descargar PDF y Compartir.
  - Presupuesto: el enlace del panel "Ver el PDF real" pasa a ser "Descargar el PDF real".
  - `handlePdf(false)` ya no se usa desde la barra, pero se conserva en el código.
- `common/documentPreview/PreviewShell.jsx` → `PreviewToolbar`:
  - **Problema**: a ~800px el botón "← PRESUPUESTOS" se montaba sobre el título y este se cortaba ("Presupu…").
  - Ahora:
    - Volver es un `IconButton` (flecha) con el tooltip "Volver a …".
    - El bloque del título tiene `flex: 1 1 260px`, así que ocupa el espacio libre.
    - En tablet y escritorio la barra usa `flexWrap: wrap`: si los botones no caben, bajan a una segunda línea alineados a la derecha.
    - En móvil sigue en una línea, con botones solo de icono y sin el chip de estado.

### 2026-10-10 — Envío por email y WhatsApp: correcciones, historial y pruebas

**API**
- Migración **`2026_10_10_000007_create_envios_table.php`**: tabla `envios`, polimórfica (`enviable_type` / `enviable_id`: Presupuesto o Factura).
  - Columnas: `canal` (email|whatsapp), `destino`, `estado` (enviado|error|enlace), `copia_emisor`, `error` (no se expone), `user_id` y timestamps.
  - Modelo `App\Models\Envio`; relación `envios()` (morphMany) en `Presupuesto` y `Factura`.
- **`App\Support\Telefono::analizar()`** → `{ tipo: movil|fijo|extranjero|invalido|vacio, numero }`.
  - España: 9 cifras; **móvil = 6/7**, **fijo = 8/9**. Admite +34, 0034 o 34 delante y devuelve `34XXXXXXXXX` para `wa.me`.
  - +XX de otro país → `extranjero` (se acepta tal cual).
- **`App\Mail\DocumentoEnviadoMail`**, un Mailable común:
  - **From** = `MAIL_FROM_ADDRESS` con el **nombre del emisor**; **Reply-To** = email del emisor.
  - Asunto: "Presupuesto N/AAAA · Emisor".
  - Vistas HTML (`emails/presupuesto-enviado`, `emails/factura-enviada`) y nuevas versiones **de texto plano** (`…-texto.blade.php`).
  - PDF adjunto.
- **`App\Services\EnvioDocumentoService`**:
  - `enviarEmail()`: envía, con BCC opcional al emisor, y registra en `envios` tanto si sale bien como si falla. Si falla, lanza `EnvioException` (502, mensaje genérico; el detalle solo con `APP_DEBUG` y en el log).
  - `enlaceWhatsapp()`: **422 si el teléfono es fijo o no válido**; sin número abre WhatsApp para elegir el contacto. Lo registra con estado `enlace`.
  - `enlacePublico()` (7 días, `DIAS_ENLACE`), `historial()` y `euros()`.
- `PresupuestoController` y `FacturaController`:
  - `enviar-email`: body opcional `{ email, copia_emisor }`.
  - `compartir-whatsapp`: body opcional `{ telefono }`. Si viene la clave `telefono` vacía, se abre WhatsApp sin número en lugar de usar el del cliente.
  - **Presupuesto**: pasa a "enviado" **solo después** de un envío correcto. Antes se marcaba aunque el email fallara. `prepareForSharing` se divide en `comprobarCompartible()` + `marcarEnviado()`.
  - **Factura**: el email y el mensaje usan los datos congelados del emisor y el cliente. El destinatario por defecto es el **contacto actual** del cliente. `preview` devuelve `contacto: { email, telefono }`.
  - Los dos `preview` devuelven **`envios`**, los últimos 10.
  - Mensaje de WhatsApp: "Hola X, <Emisor> te envía el presupuesto N/AAAA por un importe de 1.250,00 € (IVA no incluido)…" (en facturas, "IVA incluido"), con el enlace y su validez.
- Plantillas:
  - Presupuesto: "Importe (IVA no incluido)". Factura: "Total (IVA incluido)", con el IBAN de la factura o del emisor.
  - El pie muestra el destinatario real e invita a responder al correo.
- **Pruebas** (no cambian estados ni el historial):
  - `php artisan app:probar-email <email> [--presupuesto=ID] [--factura=ID]` envía el último presupuesto y la última factura (o los indicados) con el PDF real.
  - **Solo con `APP_ENV=local`**: `GET /dev/emails/presupuesto[/{id}]` y `/dev/emails/factura[/{id}]` muestran el email en el navegador. Las rutas están en `routes/web.php`.
  - Ambas usan `App\Support\EmailDePrueba`, que reutiliza los métodos privados de los controladores con `Closure::call` para generar el mismo PDF.

**Front**
- `ShareDialog` reescrito:
  - Email y móvil **editables** (por defecto, los del cliente; solo para ese envío).
  - Aviso en vivo **móvil / fijo / extranjero / no válido**; "Abrir WhatsApp" se desactiva con un fijo.
  - Casilla "Enviarme una copia oculta a <email del emisor>".
  - Los errores del API se muestran dentro del diálogo.
  - A pantalla completa en móvil.
- `abrirWhatsapp()`: abre la pestaña **en el mismo clic** y le asigna la URL al recibirla. Antes `window.open` iba después del `await` y Safari o el iPhone lo bloqueaban.
- `PresupuestosPage`:
  - Usa `ShareDialog`; se eliminó su diálogo propio.
  - **"Enviar" ya no llama a `/enviar`**: abre el diálogo y el API marca "enviado" al compartir.
- `PresupuestoPreview` / `FacturaPreview`:
  - `handleShare(canal, datos)` y nuevo panel **"Envíos"** (`HistorialEnvios`).
  - En la factura, la tarjeta del cliente muestra su contacto actual.
- `ClienteForm`: el teléfono indica al escribir si es móvil (WhatsApp) o fijo.

**Cómo probar en local** (el `.env` del API usa Mailtrap, así que los emails no llegan a nadie real):
1. `php artisan migrate` en el API.
2. Ver el diseño en el navegador: `http://api-facturacion.local/dev/emails/presupuesto` y `/dev/emails/factura`.
3. Envío real a la bandeja de Mailtrap: `php artisan app:probar-email prueba@ejemplo.com`, o desde la app con "Compartir → Enviar por email".
4. WhatsApp: probar con un cliente con móvil (`600…`), con un fijo (`91…` → botón desactivado) y con el campo vacío (WhatsApp sin destinatario).

### 2026-10-10 — `app:probar-email --dry-run` (API)
- `php artisan app:probar-email [email] [--presupuesto=ID] [--factura=ID] --dry-run` **no envía nada**. Guarda en `storage/app/pruebas-email/<AAAA-MM-DD_HHMMSS>/`:
  - `presupuesto.html` / `factura.html`: el email tal y como se vería.
  - `presupuesto.txt` / `factura.txt`: la versión en texto plano.
  - El PDF adjunto con su nombre real (`presupuesto-2026-0004.pdf`…).
  - `…-resumen.txt`: De (nombre del emisor y buzón), Para, Responder a (email del emisor), Asunto, Adjunto (tamaño) y Enlace al PDF.
- El resumen también se muestra como tabla en la consola.
- Con `--dry-run` el email es opcional (por defecto `cliente@ejemplo.com`, solo para mostrarlo). **Sin `--dry-run` es obligatorio** indicarlo, para no enviar por error a una dirección de ejemplo.
- `storage/app/` ya está en el `.gitignore` de Laravel, así que los archivos de prueba no se versionan.
- `DocumentoEnviadoMail` tiene ahora métodos de lectura para las pruebas: `contenidoPdf()`, `nombreArchivoPdf()` y `renderTexto()`.
- No cambia estados ni guarda nada en el historial de envíos. Funciona en cualquier entorno, también en producción, para revisar el email antes de activar el SMTP.

### 2026-10-10 — Visor web de las pruebas de email (API)
- Nuevo `app/Http/Controllers/PruebasEmailController.php` con vistas en `resources/views/pruebas-email/` (`index`, `ver` y `_estilos`). Rutas en `routes/web.php`, con `throttle:60,1`:
  - `GET /pruebas-email` → **listado** de todas las pruebas de `--dry-run`, con fecha y tipos, más accesos directos a la vista rápida `/dev/emails/...`. **Solo con `APP_ENV=local`** (en otros entornos, 404).
  - `GET /pruebas-email/{carpeta}` → **detalle de una prueba**. Para cada documento: la tabla resumen (De, Para, Responder a, Asunto, Adjunto, Enlace), el **email HTML** y el **PDF adjunto** en iframes uno al lado del otro (apilados en pantallas estrechas) y la versión en texto plano en un desplegable.
  - `GET /pruebas-email/{carpeta}/{archivo}` → sirve el `.html`, `.txt` o `.pdf` con `inline`, `no-store` y `noindex`.
- **Acceso**:
  - En local, libre.
  - **En cualquier otro entorno, solo con un enlace firmado y temporal** (`MINUTOS_ENLACE` = 120). Sin firma o caducado → 403.
  - Los archivos dentro de la página también van firmados.
  - Los nombres de carpeta (`AAAA-MM-DD_HHMMSS`) y de archivo se validan con expresiones regulares para que no se pueda salir de `storage/app/pruebas-email`.
- `app:probar-email --dry-run` imprime al final **la URL para verlo en el navegador** (en producción, el enlace firmado de 2 h, con el aviso de que contiene datos de clientes).

### 2026-10-10 — "Vista de correos" en el panel + listado de documentos en /pruebas-email

**API**
- Nuevo `Api/EmailPreviewController`, dentro del grupo `role:admin`:
  - `GET /presupuestos/{id}/email-preview` y `GET /facturas/{id}/email-preview` → `{ asunto, de, para, responder_a, adjunto, enlace_dias, html, texto }`.
  - **No envía nada ni cambia datos.** "Para" es el email del cliente o, si no tiene, `cliente@ejemplo.com`.
- `EmailDePrueba::presupuesto/factura($id, $destinatario, $conPdf = true)`: con `$conPdf = false` no genera el PDF, así la vista previa es más rápida.
- `/pruebas-email` (solo local, sin login): ahora lista también los **últimos 50 presupuestos y 50 facturas** (nº, cliente, fecha, importe, estado) con un botón **"Ver correo"** que abre `/dev/emails/{tipo}/{id}`. Las pruebas `--dry-run` guardadas siguen debajo.

**Front**
- Nueva pantalla **`features/correos/pages/CorreosPage.jsx`** (`/admin/correos`, entrada "Vista de correos" en el menú lateral) y servicio `features/correos/services/correos.service.js` (`getEmailPreview(tipo, id)`).
  - Izquierda:
    - pestañas **Presupuestos / Facturas**;
    - buscador por número o cliente y lista paginada de 15 en 15 en el servidor, con nº, estado, cliente, fecha, importe y la marca "sin email".
  - Derecha, al elegir uno, el correo como en un cliente de correo:
    - asunto, De, Para y Responder a;
    - chip con el **PDF adjunto**, que lo descarga;
    - selector **Correo / Texto plano**;
    - botón "Abrir" para verlo en una pestaña nueva;
    - el HTML en un `iframe` con `srcDoc` y `sandbox`, sin scripts.
  - Móvil y tablet: primero la lista; al elegir, el correo con "Volver a la lista".
- Disponible en **local y producción** para cualquier admin (requiere iniciar sesión, porque los correos contienen datos de clientes).

### 2026-10-10 — Versión 1.0: diagrama de arquitectura
- Nuevo **`docs/arquitectura-v1.svg`**, copiado también en `api-facturacion/docs/arquitectura-v1.svg`. Muestra:
  - personas y roles;
  - el front: pantallas, componentes comunes y aspectos técnicos;
  - el API: seguridad, controladores, servicios, documentos y consola;
  - la base de datos (tablas) y los servicios externos (SMTP y WhatsApp);
  - el **flujo de estados** del presupuesto y de la factura;
  - lo **pendiente** para siguientes versiones.
- Es un SVG: se abre en el navegador o en VS Code y se puede exportar a PNG desde el navegador. Se generó con un script de Python. Si cambia la arquitectura, hay que actualizar el SVG o regenerarlo.
- Git: no se ha hecho commit ni etiqueta (decisión del usuario). Comandos sugeridos en la respuesta de la sesión: commit + `git tag -a v1.0.0` en los dos repos y `git rm --cached .env` en el front.
