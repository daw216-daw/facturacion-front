import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  useTheme,
  useMediaQuery,
  Typography,
  Box,
  Paper,
  Checkbox,
  FormControlLabel,
  IconButton,
  Stack,
  Divider,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import { createPresupuesto, updatePresupuesto, getPresupuesto } from '../services/presupuestos.service';
import { getClientesSelect } from '../../clientes/services/clientes.service';
import { getEmisores } from '../../emisores/services/emisores.service';
import { getDocumentoTextos } from '../../documentoTextos/services/documentoTextos.service';
import DocumentoTextoEditor from '../../../common/DocumentoTextoEditor';

export default function PresupuestoForm({
  open,
  onClose,
  onSaved,
  presupuesto = null,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [clientes, setClientes] = useState([]);
  const [emisores, setEmisores] = useState([]);
  const [docsDisponibles, setDocsDisponibles] = useState([]);
  const [docsSeleccionados, setDocsSeleccionados] = useState([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    cliente_id: '',
    emisor_id: '',
    fecha: '',
    total: '',
    descripcion: '',
    observaciones: '',
  });

  useEffect(() => {
    if (!open) return;

    getClientesSelect().then(setClientes);
    getEmisores().then(setEmisores);
    getDocumentoTextos({ tipo: 'presupuesto', activos: true }).then(setDocsDisponibles);

    if (presupuesto) {
      getPresupuesto(presupuesto.id).then((full) => {
        setForm({
          cliente_id: full.cliente_id,
          emisor_id: full.emisor_id,
          fecha: full.fecha ? dayjs(full.fecha).format('YYYY-MM-DD') : '',
          total: full.total,
          descripcion: full.descripcion || '',
          observaciones: full.observaciones || '',
        });

        const seleccionados = (full.documento_textos ?? [])
          .slice()
          .sort((a, b) => (a.pivot?.orden ?? 0) - (b.pivot?.orden ?? 0));
        setDocsSeleccionados(seleccionados);
      });
    } else {
      setForm({ cliente_id: '', emisor_id: '', fecha: '', total: '', descripcion: '', observaciones: '' });
      setDocsSeleccionados([]);
    }
  }, [open, presupuesto]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const isSelected = (doc) => docsSeleccionados.some((d) => d.id === doc.id);

  const toggleDoc = (doc) => {
    if (isSelected(doc)) {
      setDocsSeleccionados((prev) => prev.filter((d) => d.id !== doc.id));
    } else {
      setDocsSeleccionados((prev) => [...prev, doc]);
    }
  };

  const moverArriba = (index) => {
    if (index === 0) return;
    setDocsSeleccionados((prev) => {
      const arr = [...prev];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr;
    });
  };

  const moverAbajo = (index) => {
    setDocsSeleccionados((prev) => {
      if (index >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr;
    });
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      const payload = {
        ...form,
        documento_texto_ids: docsSeleccionados.map((d) => d.id),
      };

      if (presupuesto) {
        await updatePresupuesto(presupuesto.id, payload);
      } else {
        await createPresupuesto(payload);
      }

      onSaved?.();
      onClose();
    } catch (e) {
      console.error(e);
      alert('Error al guardar el presupuesto');
    } finally {
      setSaving(false);
    }
  };

  const getTituloDoc = (doc) => {
    const match = doc.contenido?.match(/<strong>(.*?)<\/strong>/);
    return match ? match[1] : `Documento #${doc.id}`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
        {presupuesto ? 'Editar presupuesto' : 'Nuevo presupuesto'}
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={3}>

          {/* DATOS GENERALES */}
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={600} mb={2} color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
              Datos generales
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Emisor"
                  name="emisor_id"
                  value={form.emisor_id}
                  onChange={handleChange}
                  required
                >
                  {emisores.map((e) => (
                    <MenuItem key={e.id} value={e.id}>
                      {e.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Cliente"
                  name="cliente_id"
                  value={form.cliente_id}
                  onChange={handleChange}
                  required
                >
                  {clientes.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha"
                  name="fecha"
                  InputLabelProps={{ shrink: true }}
                  value={form.fecha}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Total (€)"
                  name="total"
                  value={form.total}
                  onChange={handleChange}
                  required
                  inputProps={{ min: 0, step: '0.01' }}
                />
              </Grid>

              {presupuesto && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Estado"
                    value={presupuesto.estado}
                    disabled
                  />
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* DESCRIPCIÓN */}
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={600} mb={2} color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
              Descripción / trabajos a realizar
            </Typography>

            <DocumentoTextoEditor
              value={form.descripcion}
              onChange={(html) => setForm((prev) => ({ ...prev, descripcion: html }))}
            />
          </Paper>

          {/* OBSERVACIONES */}
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={600} mb={2} color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
              Observaciones internas
            </Typography>

            <DocumentoTextoEditor
              value={form.observaciones}
              onChange={(html) => setForm((prev) => ({ ...prev, observaciones: html }))}
            />
          </Paper>

          {/* TEXTOS LEGALES */}
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={600} mb={0.5} color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
              Textos legales del documento
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Selecciona los textos que aparecerán en el PDF y ordénalos con las flechas.
            </Typography>

            {docsDisponibles.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay textos legales activos para presupuestos.
              </Typography>
            ) : (
              <Stack spacing={0.5}>
                {docsDisponibles.map((doc) => (
                  <FormControlLabel
                    key={doc.id}
                    control={
                      <Checkbox
                        checked={isSelected(doc)}
                        onChange={() => toggleDoc(doc)}
                        size="small"
                      />
                    }
                    label={
                      <Typography variant="body2">
                        {getTituloDoc(doc)}
                        <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                          (ID #{doc.id})
                        </Typography>
                      </Typography>
                    }
                  />
                ))}
              </Stack>
            )}

            {docsSeleccionados.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" fontWeight={600} mb={1}>
                  Orden en el PDF:
                </Typography>
                <Stack spacing={1}>
                  {docsSeleccionados.map((doc, index) => (
                    <Box
                      key={doc.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        bgcolor: 'action.hover',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 24, textAlign: 'center' }}>
                        {index + 1}.
                      </Typography>
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {getTituloDoc(doc)}
                      </Typography>
                      <IconButton size="small" onClick={() => moverArriba(index)} disabled={index === 0}>
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => moverAbajo(index)} disabled={index === docsSeleccionados.length - 1}>
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              </>
            )}
          </Paper>

        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving}
          size="large"
        >
          {presupuesto ? 'Guardar cambios' : 'Crear presupuesto'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
