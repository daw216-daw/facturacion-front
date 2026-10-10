// common/IvaFechaDialog.jsx
// Diálogo para elegir fecha e IVA de una factura con resumen calculado.
// Lo usan FacturarDialog (presupuesto → factura) y EditarFacturaDialog (factura pendiente de cobro).
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import { formatEuro } from '../features/presupuestos/presupuestoEstados';

const IVA_HABITUALES = [21, 10, 4, 0];

function Fila({ label, value, total = false }) {
  return (
    <Stack direction="row" justifyContent="space-between" py={0.25}>
      <Typography variant={total ? 'subtitle1' : 'body2'} fontWeight={total ? 700 : 400} color={total ? 'text.primary' : 'text.secondary'}>
        {label}
      </Typography>
      <Typography variant={total ? 'h6' : 'body2'} fontWeight={total ? 700 : 500} sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
    </Stack>
  );
}

/**
 * Props:
 * - base: base imponible (número)
 * - initialIva / initialFecha: valores al abrir (por defecto 21 y hoy)
 * - anioFijo: si se indica, la fecha queda limitada a ese año (numeración de la serie)
 * - header / info: contenido extra arriba / aviso abajo
 * - children: campos adicionales (p. ej. textos legales), entre el IVA y el resumen.
 *   Puede ser una función ({ iva }) => node para reaccionar al IVA elegido
 * - confirmDisabled: bloquea el botón (p. ej. mientras cargan datos)
 * - onConfirm({ iva_porcentaje, fecha })
 */
export default function IvaFechaDialog({
  open,
  title,
  header,
  info,
  base = 0,
  initialIva = 21,
  initialFecha,
  anioFijo,
  confirmText = 'Guardar',
  confirmIcon,
  error,
  loading = false,
  confirmDisabled = false,
  maxWidth = 'xs',
  children,
  onClose,
  onConfirm,
}) {
  const theme = useTheme();
  // En móvil a pantalla completa (con textos legales el contenido es largo)
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [iva, setIva] = useState(initialIva);
  const [fecha, setFecha] = useState(initialFecha ?? dayjs().format('YYYY-MM-DD'));

  useEffect(() => {
    if (open) {
      setIva(initialIva);
      setFecha(initialFecha ?? dayjs().format('YYYY-MM-DD'));
    }
  }, [open, initialIva, initialFecha]);

  const baseNum = Number(base) || 0;
  const ivaValido = iva !== '' && Number.isInteger(Number(iva)) && Number(iva) >= 0 && Number(iva) <= 100;
  const fechaValida = !!fecha && (!anioFijo || dayjs(fecha).year() === Number(anioFijo));
  // Mismo redondeo que el API
  const ivaImporte = ivaValido ? Math.round(baseNum * Number(iva)) / 100 : 0;
  const total = baseNum + ivaImporte;

  const ayudaFecha = anioFijo
    ? `Debe ser del año ${anioFijo} (el de la numeración de la factura)`
    : `Se numerará con la serie de facturas de ${fecha ? dayjs(fecha).year() : 'su año'}`;

  return (
    <Dialog open={open} onClose={() => !loading && onClose()} fullWidth maxWidth={maxWidth} fullScreen={fullScreen}>
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>
        {header && <Box mb={2}>{header}</Box>}

        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            fullWidth
            type="date"
            label="Fecha de la factura"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            error={!fechaValida}
            helperText={ayudaFecha}
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: anioFijo
                ? { min: `${anioFijo}-01-01`, max: `${anioFijo}-12-31` }
                : undefined,
            }}
          />

          <Box>
            <TextField
              fullWidth
              type="number"
              label="IVA"
              value={iva}
              onChange={(e) => setIva(e.target.value)}
              error={!ivaValido}
              helperText={!ivaValido ? 'Debe ser un número entero entre 0 y 100' : ' '}
              slotProps={{
                htmlInput: { min: 0, max: 100, step: 1 },
                input: { endAdornment: <InputAdornment position="end">%</InputAdornment> },
              }}
            />
            <Stack direction="row" spacing={1}>
              {IVA_HABITUALES.map((pct) => (
                <Chip
                  key={pct}
                  size="small"
                  label={`${pct}%`}
                  color={Number(iva) === pct ? 'primary' : 'default'}
                  variant={Number(iva) === pct ? 'filled' : 'outlined'}
                  onClick={() => setIva(pct)}
                />
              ))}
            </Stack>
          </Box>

          {/* children puede ser una función que recibe el IVA actual (p. ej. para avisar del IVA 0 %) */}
          {typeof children === 'function'
            ? children({ iva: ivaValido ? Number(iva) : null })
            : children}

          <Paper variant="outlined" sx={{ p: 1.5 }}>
            <Fila label="Base imponible" value={formatEuro(baseNum)} />
            <Fila label={`IVA (${ivaValido ? Number(iva) : '—'}%)`} value={formatEuro(ivaImporte)} />
            <Divider sx={{ my: 0.75 }} />
            <Fila label="Total factura" value={formatEuro(total)} total />
          </Paper>

          {info}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={confirmIcon}
          disabled={loading || confirmDisabled || !ivaValido || !fechaValida}
          onClick={() => onConfirm({ iva_porcentaje: Number(iva), fecha })}
        >
          {loading ? 'Guardando…' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
