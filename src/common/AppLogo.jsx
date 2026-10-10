// common/AppLogo.jsx
// Logotipo de la app (el mismo dibujo que public/favicon.svg): documento + moneda de euro.
import { useId } from 'react';
import { Box } from '@mui/material';

export default function AppLogo({ size = 48, sx }) {
  // id único para el degradado (puede haber varios logos en pantalla)
  const gradId = `logo-fondo-${useId().replace(/:/g, '')}`;

  return (
    <Box
      component="svg"
      viewBox="0 0 64 64"
      role="img"
      aria-label="Facturación"
      sx={{ width: size, height: size, display: 'block', flexShrink: 0, ...sx }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1e88e5" />
          <stop offset="1" stopColor="#0d47a1" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill={`url(#${gradId})`} />
      <path d="M18 11h19l11 11v29a3 3 0 0 1-3 3H18a3 3 0 0 1-3-3V14a3 3 0 0 1 3-3z" fill="#fff" />
      <path d="M37 11v8a3 3 0 0 0 3 3h8z" fill="#bbdefb" />
      <rect x="20" y="27" width="20" height="3.5" rx="1.75" fill="#90caf9" />
      <rect x="20" y="34" width="15" height="3.5" rx="1.75" fill="#90caf9" />
      <rect x="20" y="41" width="10" height="3.5" rx="1.75" fill="#90caf9" />
      <circle cx="46" cy="47" r="12" fill="#2e7d32" stroke="#fff" strokeWidth="3" />
      <text
        x="46"
        y="52.5"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="15"
        fontWeight="700"
        fill="#fff"
        textAnchor="middle"
      >
        €
      </text>
    </Box>
  );
}
