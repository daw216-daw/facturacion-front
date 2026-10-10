// common/documentPreview/DocumentSheet.jsx
// Piezas para pintar un documento (presupuesto / factura) como una hoja de papel,
// imitando los PDF de api-facturacion/resources/views/pdf/*.blade.php.
// La hoja usa siempre colores claros (como el papel), también en modo oscuro.
import { Box, Paper, Typography } from '@mui/material';

export const PAPER = {
  bg: '#ffffff',
  text: '#1f2937',
  title: '#111827',
  muted: '#6b7280',
  border: '#d1d5db',
  soft: '#f9fafb',
  header: '#111827',
};

/* Hoja A4 aproximada con sombra */
export function DocumentSheet({ children, watermark }) {
  return (
    <Paper
      elevation={3}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        bgcolor: PAPER.bg,
        color: PAPER.text,
        p: { xs: 2.5, sm: 5 },
        minHeight: { md: 1000 },
        display: 'flex',
        flexDirection: 'column',
        fontSize: 14,
        lineHeight: 1.5,
      }}
    >
      {watermark && (
        <Typography
          aria-hidden
          sx={{
            position: 'absolute',
            top: '38%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-28deg)',
            fontSize: { xs: 56, sm: 96 },
            fontWeight: 800,
            color: 'rgba(220, 38, 38, 0.10)',
            pointerEvents: 'none',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {watermark}
        </Typography>
      )}

      {children}
    </Paper>
  );
}

export function SheetTitle({ children }) {
  return (
    <Typography
      component="h1"
      sx={{
        fontSize: { xs: 24, sm: 30 },
        fontWeight: 800,
        letterSpacing: 1,
        textTransform: 'uppercase',
        color: PAPER.title,
        lineHeight: 1.1,
      }}
    >
      {children}
    </Typography>
  );
}

export function SheetSectionTitle({ children }) {
  return (
    <Typography
      sx={{
        mt: 3,
        mb: 1,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        color: PAPER.title,
      }}
    >
      {children}
    </Typography>
  );
}

export function SheetCard({ title, children, soft = false, sx }) {
  return (
    <Box
      sx={{
        border: `1px solid ${PAPER.border}`,
        borderRadius: 2,
        p: 1.5,
        bgcolor: soft ? PAPER.soft : PAPER.bg,
        ...sx,
      }}
    >
      {title && (
        <Typography sx={{ fontWeight: 700, color: PAPER.title, mb: 0.5 }}>
          {title}
        </Typography>
      )}
      {children}
    </Box>
  );
}

/* HTML de TipTap con estilos parecidos a .rich-text del PDF */
export function RichText({ html, sx }) {
  if (!html?.trim()) return null;

  return (
    <Box
      sx={{
        color: PAPER.text,
        '& p': { m: 0, mb: 1 },
        '& p:last-child': { mb: 0 },
        '& ul, & ol': { m: 0, mb: 1, pl: 2.5 },
        '& li': { mb: 0.5 },
        '& h1, & h2, & h3': { m: 0, mb: 1, color: PAPER.title, fontWeight: 700 },
        '& h1': { fontSize: 20 },
        '& h2': { fontSize: 17 },
        '& h3': { fontSize: 15 },
        ...sx,
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/* Datos de una persona/empresa: solo las líneas que existen */
export function PartyLines({ data, showContact = true }) {
  if (!data) return null;

  const localidad = [
    [data.cp, data.poblacion].filter(Boolean).join(' '),
    data.provincia,
  ].filter(Boolean).join(', ');

  const lineas = [
    data.nif && `NIF: ${data.nif}`,
    data.direccion,
    localidad,
    showContact && data.email && `Email: ${data.email}`,
    showContact && data.telefono && `Tel: ${data.telefono}`,
  ].filter(Boolean);

  return lineas.map((linea) => (
    <Typography key={linea} sx={{ fontSize: 14, color: PAPER.text }}>
      {linea}
    </Typography>
  ));
}

/* Pie de página con los datos del emisor (como el PDF de presupuesto) */
export function SheetFooter({ emisor }) {
  if (!emisor) return null;

  const localidad = [
    [emisor.cp, emisor.poblacion].filter(Boolean).join(' '),
    emisor.provincia,
  ].filter(Boolean).join(', ');

  const lineas = [
    [emisor.nombre, emisor.nif && `NIF: ${emisor.nif}`].filter(Boolean).join(' · '),
    [emisor.direccion, localidad].filter(Boolean).join(' · '),
    [emisor.telefono && `Tel: ${emisor.telefono}`, emisor.email && `Email: ${emisor.email}`].filter(Boolean).join(' · '),
  ].filter(Boolean);

  if (lineas.length === 0) return null;

  return (
    <Box
      sx={{
        mt: 'auto',
        pt: 1.5,
        borderTop: `1px solid ${PAPER.border}`,
        textAlign: 'center',
        fontSize: 12,
        color: PAPER.muted,
      }}
    >
      {lineas.map((linea, i) => (
        <Typography
          key={linea}
          sx={{ fontSize: 12, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? PAPER.title : PAPER.muted }}
        >
          {linea}
        </Typography>
      ))}
    </Box>
  );
}
