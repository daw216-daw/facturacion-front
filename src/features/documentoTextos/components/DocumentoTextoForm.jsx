import { useState, useEffect } from 'react';
import {
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

export default function DocumentoTextoForm({ texto, onClose, onSaved }) {
  const isEdit = Boolean(texto?.id);

  const [tipo, setTipo] = useState(texto?.tipo || 'presupuesto');
  const [contenido, setContenido] = useState(texto?.contenido || '');
  const [activo, setActivo] = useState(texto?.activo ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTipo(texto?.tipo || 'presupuesto');
    setContenido(texto?.contenido || '');
    setActivo(texto?.activo ?? true);
  }, [texto]);

  const handleSave = async () => {
    try {
      setSaving(true);

      if (isEdit) {
        await updateDocumentoTexto(texto.id, { contenido, activo });
      } else {
        await createDocumentoTexto({ tipo, contenido, activo });
      }

      onSaved();
    } catch (e) {
      console.error(e);
      alert('Error al guardar el texto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open fullWidth maxWidth="md" onClose={onClose}>
      {/* ───────────── TITLE ───────────── */}
      <DialogTitle>
        {isEdit ? 'Editar texto legal' : 'Nuevo texto legal'}
      </DialogTitle>

      <DialogContent dividers>
        {/* ───────────── TIPO + ACTIVO ───────────── */}
        <Box mb={3} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
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

        {/* ───────────── EDITOR ───────────── */}
        <Typography variant="subtitle2" mb={1}>
          Contenido del documento
        </Typography>

        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            p: 1,
            mb: 3,
          }}
        >
          <DocumentoTextoEditor
            value={contenido}
            onChange={setContenido}
          />
        </Box>

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
          disabled={saving || !contenido.trim()}
        >
          {isEdit ? 'Guardar cambios' : 'Crear texto'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
