// common/documentPreview/PreviewShell.jsx
// Estructura común de las vistas previas: barra superior fija + documento + panel interno.
import {
  Alert,
  Box,
  Button,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

/* Estilo de botón "solo icono" en móvil: el texto se oculta (sigue disponible para lectores de pantalla) */
const botonCompactoXs = {
  '& .MuiButton-root': {
    minWidth: { xs: 40, sm: 64 },
    px: { xs: 1, sm: 1.5 },
    fontSize: { xs: 0, sm: '0.8125rem' },
  },
  '& .MuiButton-startIcon': {
    mr: { xs: 0, sm: 1 },
    ml: { xs: 0, sm: -0.5 },
  },
};

/* Barra superior: volver, título + estado y acciones */
export function PreviewToolbar({ backLabel, onBack, title, chip, actions }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        position: 'sticky',
        // Debajo del AppBar fijo del admin (56px móvil / 64px escritorio)
        top: { xs: 64, sm: 72 },
        zIndex: 5,
        mb: 2,
        px: { xs: 1, sm: 1.5 },
        py: { xs: 0.5, sm: 1 },
        display: 'flex',
        alignItems: 'center',
        columnGap: 1,
        rowGap: 1,
        // Móvil: una sola línea (botones solo icono). Tablet/escritorio: si no caben, los botones bajan de línea
        flexWrap: { xs: 'nowrap', sm: 'wrap' },
        backdropFilter: 'blur(6px)',
      }}
    >
      {/* Volver + título + estado: ocupa el espacio libre y nunca se monta con los botones */}
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ flex: '1 1 260px', minWidth: 0 }}
      >
        <Tooltip title={`Volver a ${backLabel.toLowerCase()}`}>
          <IconButton size="small" onClick={onBack} aria-label={`Volver a ${backLabel}`}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Typography
          variant="h6"
          fontWeight={700}
          noWrap
          sx={{ fontVariantNumeric: 'tabular-nums', fontSize: { xs: '1rem', sm: '1.2rem' }, minWidth: 0 }}
        >
          {title}
        </Typography>
        {/* En móvil el estado se ve en el panel Resumen */}
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexShrink: 0 }}>{chip}</Box>
      </Stack>

      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        sx={{ flexShrink: 0, flexWrap: 'nowrap', ml: 'auto', ...botonCompactoXs }}
      >
        {actions}
      </Stack>
    </Paper>
  );
}

/* Documento a la izquierda, panel interno a la derecha (debajo en móvil) */
export function PreviewLayout({ document, aside }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 300px' },
        gap: 2,
        alignItems: 'start',
        maxWidth: 1180,
        mx: 'auto',
      }}
    >
      <Box sx={{ minWidth: 0, order: { xs: 2, lg: 1 } }}>{document}</Box>
      <Stack spacing={2} sx={{ order: { xs: 1, lg: 2 }, position: { lg: 'sticky' }, top: { lg: 140 } }}>
        {aside}
      </Stack>
    </Box>
  );
}

/* Tarjeta del panel interno (no forma parte del documento del cliente) */
export function AsideCard({ title, children, action }) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle2" color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
          {title}
        </Typography>
        {action}
      </Stack>
      {children}
    </Paper>
  );
}

/* Fila etiqueta / valor del panel */
export function AsideRow({ label, children }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} py={0.5}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Box sx={{ textAlign: 'right', minWidth: 0 }}>{children}</Box>
    </Stack>
  );
}

export function PreviewSkeleton() {
  return (
    <Box sx={{ maxWidth: 1180, mx: 'auto' }}>
      <Skeleton variant="rounded" height={52} sx={{ mb: 2 }} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 300px' }, gap: 2 }}>
        <Skeleton variant="rounded" height={640} />
        <Skeleton variant="rounded" height={240} />
      </Box>
    </Box>
  );
}

export function PreviewError({ message, backLabel, onBack }) {
  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={onBack}>
            {backLabel}
          </Button>
        }
      >
        {message}
      </Alert>
    </Box>
  );
}
