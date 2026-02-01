import { Card, CardContent, Typography, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

export default function EmisorCard({ emisor, onEdit }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography fontWeight={600}>{emisor.nombre}</Typography>
        <Typography variant="body2">{emisor.nif}</Typography>
        <Typography variant="body2">{emisor.email}</Typography>

        <IconButton size="small" onClick={onEdit}>
          <EditIcon />
        </IconButton>
      </CardContent>
    </Card>
  );
}
