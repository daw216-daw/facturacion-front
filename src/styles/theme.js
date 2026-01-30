import { createTheme } from '@mui/material/styles';

export function getTheme(mode = 'light') {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#9c27b0',
      },
    },
    shape: {
      borderRadius: 8,
    },
  });
}
