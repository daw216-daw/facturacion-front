import {
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  CardActions,
  IconButton,
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';

export default function UserCard({
  user,
  onEdit,
  onDeactivate,
  onReactivate,
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={0.5}>
          <Typography variant="subtitle1" fontWeight={600}>
            {user.name}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {user.email}
          </Typography>

          <Chip
            size="small"
            label={user.role}
            sx={{ width: 'fit-content' }}
          />

          <Chip
            size="small"
            label={user.activo ? 'Activo' : 'Inactivo'}
            color={user.activo ? 'success' : 'default'}
            sx={{ width: 'fit-content' }}
          />
        </Stack>
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <IconButton size="small" onClick={() => onEdit(user)}>
          <EditIcon />
        </IconButton>

        {user.activo ? (
          <IconButton
            size="small"
            color="error"
            onClick={() => onDeactivate(user)}
          >
            <DeleteIcon />
          </IconButton>
        ) : (
          <IconButton
            size="small"
            color="success"
            onClick={() => onReactivate(user)}
          >
            <RestoreIcon />
          </IconButton>
        )}
      </CardActions>
    </Card>
  );
}
