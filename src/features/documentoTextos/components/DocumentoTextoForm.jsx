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
  const [saving, setSaving] = useState(false);

  /* ─────────────────────────────
     Sincronizar al cambiar registro
     ───────────────────────────── */
  useEffect(() => {
    setTipo(texto?.tipo || 'presupuesto');
    setContenido(texto?.contenido || '');
  }, [texto]);

  /* ─────────────────────────────
     Guardar (CREATE / UPDATE)
     ───────────────────────────── */
  const handleSave = async () => {
    try {
      setSaving(true);

      if (isEdit) {
        await updateDocumentoTexto(texto.id, { contenido });
      } else {
        await createDocumentoTexto({
          tipo,
          contenido,
        });
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
        {/* ───────────── TIPO ───────────── */}
        <Box mb={3}>
          <TextField
            select
            fullWidth
            label="Tipo de documento"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            disabled={isEdit}
            helperText={
              isEdit
                ? 'El tipo no se puede modificar'
                : 'Selecciona dónde se usará este texto'
            }
          >
            <MenuItem value="presupuesto">Presupuesto</MenuItem>
            <MenuItem value="factura">Factura</MenuItem>
          </TextField>
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
