import {
    Card,
    CardContent,
    Typography,
    Stack,
    Chip,
} from '@mui/material';
import { IconButton, CardActions } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';




export default function ClienteCard({ cliente, onEdit, onDelete, onReactivate }) {
    return (
        <Card variant="outlined">
            <CardContent>
                <Stack spacing={0.5}>
                    <Typography variant="subtitle1" fontWeight={600}>
                        {cliente.nombre}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                        {cliente.email}
                    </Typography>

                    <Typography variant="body2">
                        📞 {cliente.telefono}
                    </Typography>

                    <Typography variant="body2">
                        📍 {cliente.poblacion} ({cliente.provincia})
                    </Typography>

                    <Chip
                        size="small"
                        label={cliente.activo ? 'Activo' : 'Inactivo'}
                        color={cliente.activo ? 'success' : 'default'}
                        sx={{ mt: 1, width: 'fit-content' }}
                    />
                </Stack>
            </CardContent>
            <CardActions sx={{ justifyContent: 'flex-end' }}>
                <IconButton size="small" onClick={() => onEdit(cliente)}>
                    <EditIcon />
                </IconButton>

                {cliente.activo ? (
                    <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDelete(cliente)}
                    >
                        <DeleteIcon />
                    </IconButton>
                ) : (
                    <IconButton
                        size="small"
                        color="success"
                        onClick={() => onReactivate(cliente)}
                    >
                        <RestoreIcon />
                    </IconButton>
                )}
            </CardActions>



        </Card>
    );
}
