// common/AvisoIvaCero.jsx
// Con IVA 0 % la ley exige indicar en la factura el motivo (inversión del sujeto pasivo, exención…).
// Si no hay ningún texto "IVA 0 %" elegido, avisa y ofrece añadirlo con un clic.
import { Alert, Button, Stack } from '@mui/material';

import { esTextoIvaCero, getTituloDoc } from './TextosLegalesSelector';

export default function AvisoIvaCero({ iva, disponibles = [], seleccionados = [], onChange }) {
  if (Number(iva) !== 0 || iva === null || iva === '') return null;

  const yaTieneMotivo = seleccionados.some(esTextoIvaCero);
  if (yaTieneMotivo) return null;

  const opciones = disponibles.filter(esTextoIvaCero);

  return (
    <Alert severity="warning">
      Con IVA 0 % la factura debe indicar el motivo (por ejemplo, inversión del sujeto pasivo).
      {opciones.length > 0 ? (
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" mt={1}>
          {opciones.map((doc) => (
            <Button
              key={doc.id}
              size="small"
              variant="outlined"
              color="warning"
              onClick={() => onChange([...seleccionados, doc])}
            >
              Añadir «{getTituloDoc(doc)}»
            </Button>
          ))}
        </Stack>
      ) : (
        <> Crea un texto legal de factura cuyo título empiece por «IVA 0 %» con la mención correspondiente.</>
      )}
    </Alert>
  );
}
