// common/documentPreview/HistorialEnvios.jsx
// Panel "Envíos" de la vista previa: cuándo, por qué canal y a quién se envió el documento.
import { Chip, Stack, Typography } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import dayjs from 'dayjs';

import { AsideCard } from './PreviewShell';

const ESTADOS = {
  enviado: { label: 'Enviado', color: 'success' },
  error: { label: 'Error', color: 'error' },
  enlace: { label: 'WhatsApp abierto', color: 'default' },
};

export default function HistorialEnvios({ envios = [] }) {
  return (
    <AsideCard title="Envíos">
      {envios.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Todavía no se ha enviado.
        </Typography>
      ) : (
        <Stack spacing={1.25}>
          {envios.map((e) => {
            const estado = ESTADOS[e.estado] ?? { label: e.estado, color: 'default' };
            return (
              <Stack key={e.id} direction="row" spacing={1} alignItems="flex-start">
                {e.canal === 'whatsapp'
                  ? <WhatsAppIcon fontSize="small" color="success" sx={{ mt: 0.25 }} />
                  : <EmailIcon fontSize="small" color="primary" sx={{ mt: 0.25 }} />}
                <Stack sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" noWrap title={e.destino || ''}>
                    {e.destino || (e.canal === 'whatsapp' ? 'Contacto elegido en WhatsApp' : '—')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {e.fecha ? dayjs(e.fecha).format('DD/MM/YYYY HH:mm') : ''}
                    {e.usuario ? ` · ${e.usuario}` : ''}
                    {e.copia_emisor ? ' · con copia' : ''}
                  </Typography>
                </Stack>
                <Chip size="small" label={estado.label} color={estado.color} variant="outlined" />
              </Stack>
            );
          })}
        </Stack>
      )}
    </AsideCard>
  );
}
