import { createTheme } from '@mui/material/styles';

// Paleta por panel: el del emisor usa otros colores para distinguirse
// a simple vista del panel de administración.
const PALETAS = {
  admin: { primary: '#1976d2', secondary: '#9c27b0' },
  emisor: { primary: '#00897b', secondary: '#f9a825' },
};

export function getTheme(mode = 'light', variante = 'admin') {
  const { primary, secondary } = PALETAS[variante] ?? PALETAS.admin;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: primary,
      },
      secondary: {
        main: secondary,
      },
    },
    shape: {
      borderRadius: 8,
    },
  });
}
