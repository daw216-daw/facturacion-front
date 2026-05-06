# facturacion-front

React 19 · Vite 7 · MUI v7 · react-router-dom v7 · Axios · TipTap v3 · dayjs

## Estructura
```
src/
  app/
    App.jsx            ← RouterProvider + AuthContext check
    router.jsx         ← todas las rutas
    Dashboard.jsx      ← dashboard admin (placeholder)
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
VITE_API_BASE_URL=http://api-facturacion.local/api   # fallback si no existe
```

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
```

## Consumo de la API — formatos esperados
| Servicio | Formato respuesta |
|---|---|
| `getPresupuestos()` | `{ data: [...] }` — acceder con `result.data` |
| `getFacturas()` | `{ data: [...] }` — acceder con `result.data` |
| `getClientes()` | `{ data: [...], meta: {...} }` |
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
