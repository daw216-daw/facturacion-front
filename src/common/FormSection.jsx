// common/FormSection.jsx
// Bloque de formulario con número de paso, título, marca obligatorio/opcional y descripción.
import { Box, Paper, Stack, Typography } from '@mui/material';

export default function FormSection({
  step,
  title,
  optional = false,
  description,
  action,
  children,
}) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} mb={description ? 0.5 : 2}>
        <Stack direction="row" alignItems="center" spacing={1.25}>
          {step != null && (
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {step}
            </Box>
          )}
          <Typography
            variant="subtitle2"
            fontWeight={700}
            textTransform="uppercase"
            letterSpacing={0.5}
          >
            {title}
          </Typography>
          <Typography variant="caption" color={optional ? 'text.disabled' : 'error.main'}>
            {optional ? '(opcional)' : '(obligatorio)'}
          </Typography>
        </Stack>
        {action}
      </Stack>

      {description && (
        <Typography variant="body2" color="text.secondary" mb={2} ml={step != null ? 4.5 : 0}>
          {description}
        </Typography>
      )}

      {children}
    </Paper>
  );
}
