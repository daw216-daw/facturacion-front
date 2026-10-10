// common/TextosLegalesSelector.jsx
// Selección y orden de textos legales (documento_textos) para un presupuesto o una factura.
// value: array de textos seleccionados (en orden) · onChange(nuevoArray)
import { useState } from 'react';
import {
  Box,
  Checkbox,
  Collapse,
  FormControlLabel,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import DocumentoTextoPreview from '../features/documentoTextos/components/DocumentoTextoPreview';

// Título del texto: el campo `titulo`; si no lo tiene, el primer <strong> del contenido
export function getTituloDoc(doc) {
  if (doc?.titulo?.trim()) return doc.titulo.trim();
  const match = doc?.contenido?.match(/<strong>(.*?)<\/strong>/);
  return match ? match[1].replace(/<[^>]*>/g, '') : `Texto #${doc?.id}`;
}

// Textos para IVA 0 % (inversión del sujeto pasivo, exenta…): su título empieza por "IVA 0 %".
// Nunca se marcan por defecto; se proponen cuando la factura lleva IVA 0 %.
export const PREFIJO_TEXTO_IVA_CERO = 'IVA 0 %';

export function esTextoIvaCero(doc) {
  return (doc?.titulo ?? '').trim().toUpperCase().startsWith(PREFIJO_TEXTO_IVA_CERO.toUpperCase());
}

// Selección inicial en facturas: el primer texto activo que no sea de IVA 0 %
export function textosPorDefecto(lista = []) {
  const primero = lista.find((doc) => !esTextoIvaCero(doc));
  return primero ? [primero] : [];
}

/* Botón para mostrar / ocultar el contenido de un texto */
function VerContenidoButton({ abierto, onClick }) {
  return (
    <Tooltip title={abierto ? 'Ocultar contenido' : 'Ver contenido'}>
      <IconButton size="small" onClick={onClick} aria-expanded={abierto}>
        {abierto ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
}

export default function TextosLegalesSelector({
  disponibles = [],
  value = [],
  onChange,
  emptyText = 'No hay textos legales activos.',
  compact = false,
}) {
  const [abiertos, setAbiertos] = useState([]); // ids con el contenido desplegado

  const isSelected = (doc) => value.some((d) => d.id === doc.id);
  const isAbierto = (doc) => abiertos.includes(doc.id);
  const toggleAbierto = (doc) =>
    setAbiertos((prev) => (prev.includes(doc.id) ? prev.filter((id) => id !== doc.id) : [...prev, doc.id]));

  const toggle = (doc) => {
    onChange(isSelected(doc) ? value.filter((d) => d.id !== doc.id) : [...value, doc]);
  };

  const mover = (index, delta) => {
    const destino = index + delta;
    if (destino < 0 || destino >= value.length) return;
    const arr = [...value];
    [arr[index], arr[destino]] = [arr[destino], arr[index]];
    onChange(arr);
  };

  if (disponibles.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyText}
      </Typography>
    );
  }

  const columna = compact ? 12 : { xs: 12, md: 6 };

  return (
    <Grid container spacing={2}>
      {/* Disponibles */}
      <Grid size={columna}>
        <Typography variant="body2" fontWeight={600} mb={1}>
          Disponibles
        </Typography>
        <Stack spacing={0.5}>
          {disponibles.map((doc) => (
            <Box key={doc.id}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <FormControlLabel
                  sx={{ mr: 0, minWidth: 0 }}
                  control={
                    <Checkbox
                      checked={isSelected(doc)}
                      onChange={() => toggle(doc)}
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      {getTituloDoc(doc)}
                      {doc.activo === false && (
                        <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                          (inactivo)
                        </Typography>
                      )}
                    </Typography>
                  }
                />
                <VerContenidoButton abierto={isAbierto(doc)} onClick={() => toggleAbierto(doc)} />
              </Stack>

              {/* Contenido tal y como saldrá en el PDF */}
              <Collapse in={isAbierto(doc)} unmountOnExit>
                <Box sx={{ ml: 4, mb: 1, fontSize: 13 }}>
                  <DocumentoTextoPreview html={doc.contenido} />
                </Box>
              </Collapse>
            </Box>
          ))}
        </Stack>
      </Grid>

      {/* Orden en el PDF */}
      <Grid size={columna}>
        <Typography variant="body2" fontWeight={600} mb={1}>
          Orden en el PDF
        </Typography>

        {value.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Ninguno seleccionado.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {value.map((doc, index) => (
              <Box
                key={doc.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 0.75,
                  pl: 1.25,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20 }}>
                  {index + 1}.
                </Typography>
                <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }} noWrap>
                  {getTituloDoc(doc)}
                </Typography>
                <Tooltip title="Subir">
                  <span>
                    <IconButton size="small" onClick={() => mover(index, -1)} disabled={index === 0}>
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Bajar">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => mover(index, 1)}
                      disabled={index === value.length - 1}
                    >
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            ))}
          </Stack>
        )}
      </Grid>
    </Grid>
  );
}
