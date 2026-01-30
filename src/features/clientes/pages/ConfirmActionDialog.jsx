import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';

export default function ConfirmActionDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirmar acción',
  description = '¿Estás seguro de que deseas continuar?',
  confirmText = 'Confirmar',
  confirmColor = 'primary', // primary | error | success | warning
  loading = false,
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>
        <Typography>{description}</Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>

        <Button
          variant="contained"
          color={confirmColor}
          onClick={onConfirm}
          disabled={loading}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
