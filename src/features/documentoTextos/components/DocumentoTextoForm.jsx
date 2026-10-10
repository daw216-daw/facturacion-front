import { useState, useEffect } from 'react';
import {
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Divider,
  Box,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
} from '@mui/material';

import DocumentoTextoEditor from '../../../common/DocumentoTextoEditor';
import DocumentoTextoPreview from './DocumentoTextoPreview';
import {
  updateDocumentoTexto,
  createDocumentoTexto,
} from '../services/documentoTextos.service';

// Título propuesto a partir del contenido: primer texto en negrita o inicio del texto
function sugerirTitulo(html = '') {
  const negrita = html.match(/<strong>(.*?)<\/strong>/i);
  const base = (negrita ? negrita[1] : html)
    .replace(/<\/(p|li|h[1-6])>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return base.length > 60 ? `${base.slice(0, 57)}…` : base;
}

export default function DocumentoTextoForm({ texto, onClose, onSaved }) {
  const isEdit = Boolean(texto?.id);

  const [tipo, setTipo] = useState(texto?.tipo || 'presupuesto');
  const [titulo, setTitulo] = useState(texto?.titulo || '');
  const [contenido, setContenido] = useState(texto?.contenido || '');
  const [activo, setActivo] = useState(texto?.activo ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    setTipo(texto?.tipo || 'presupuesto');
    setTitulo(texto?.titulo || '');
    setContenido(texto?.contenido || '');
    setActivo(texto?.activo ?? true);
    setError('');
    setFieldErrors({});
  }, [texto]);

  const contenidoVacio = !contenido.replace(/<[^>]*>/g, '').trim();
  const sugerencia = sugerirTitulo(contenido);

  const handleSave = async () => {
    const errores = {};
    if (!titulo.trim()) errores.titulo = 'Pon un título para reconocer el texto';
    if (contenidoVacio) errores.contenido = 'Escribe el contenido del texto';
    setFieldErrors(errores);
    if (Object.keys(errores).length) return;

    try {
      setSaving(true);
      setError('');

      if (isEdit) {
        await updateDocumentoTexto(texto.id, { titulo: titulo.trim(), contenido, activo });
      } else {
        await createDocumentoTexto({ tipo, titulo: titulo.trim(), contenido, activo });
      }

      onSaved();
    } catch (e) {
      console.error(e);
      const apiErrors = e.response?.data?.errors;
      if (apiErrors) {
        setFieldErrors(
          Object.fromEntries(Object.entries(apiErrors).map(([campo, msgs]) => [campo, msgs[0]]))
        );
      }
      setError(e.response?.data?.message || 'Error al guardar el texto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open fullWidth maxWidth="md" onClose={(_, reason) => reason !== 'backdropClick' && !saving && onClose()}>
      {/* ───────────── TITLE ───────────── */}
      <DialogTitle>
        {isEdit ? 'Editar texto legal' : 'Nuevo texto legal'}
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* ───────────── TIPO + ACTIVO ───────────── */}
        <Box mb={2} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <TextField
            select
            label="Tipo de documento"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            disabled={isEdit}
            helperText={isEdit ? 'El tipo no se puede modificar' : 'Dónde se usará este texto'}
            sx={{ flex: 1, minWidth: 200 }}
          >
            <MenuItem value="presupuesto">Presupuesto</MenuItem>
            <MenuItem value="factura">Factura</MenuItem>
          </TextField>

          <Box sx={{ pt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  color="success"
                />
              }
              label={activo ? 'Activo' : 'Inactivo'}
            />
          </Box>
        </Box>

        {/* ───────────── TÍTULO ───────────── */}
        <TextField
          fullWidth
          required
          label="Título"
          value={titulo}
          onChange={(e) => {
            setTitulo(e.target.value);
            if (fieldErrors.titulo) setFieldErrors((prev) => ({ ...prev, titulo: undefined }));
          }}
          placeholder="Ej.: IVA no incluido · Particulares"
          error={!!fieldErrors.titulo}
          helperText={
            fieldErrors.titulo ||
            'Nombre interno para reconocerlo al elegirlo en presupuestos y facturas. No se imprime en el PDF.'
          }
          slotProps={{ htmlInput: { maxLength: 150 } }}
          sx={{ mb: 1 }}
        />

        {!titulo.trim() && sugerencia && (
          <Button size="small" onClick={() => setTitulo(sugerencia)} sx={{ mb: 2 }}>
            Usar «{sugerencia}» como título
          </Button>
        )}

        {/* ───────────── EDITOR ───────────── */}
        <Typography variant="subtitle2" mt={2} mb={1}>
          Contenido del documento *
        </Typography>

        <Box sx={{ mb: 1 }}>
          <DocumentoTextoEditor
            value={contenido}
            onChange={(html) => {
              setContenido(html);
              if (fieldErrors.contenido) setFieldErrors((prev) => ({ ...prev, contenido: undefined }));
            }}
            placeholder="Texto que aparecerá en el PDF…"
            error={!!fieldErrors.contenido}
          />
        </Box>
        {fieldErrors.contenido && (
          <Typography variant="caption" color="error" display="block">
            {fieldErrors.contenido}
          </Typography>
        )}

        <Divider sx={{ my: 3 }} />

        {/* ───────────── PREVIEW ───────────── */}
        <Typography variant="subtitle2" mb={1}>
          Vista previa
        </Typography>

        <DocumentoTextoPreview html={contenido} />
      </DialogContent>

      {/* ───────────── ACTIONS ───────────── */}
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
        >
          {isEdit ? 'Guardar cambios' : 'Crear texto'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
