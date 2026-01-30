import { Box, Typography } from '@mui/material';

export default function Dashboard() {
  return (
    <Box
      sx={{
        width: '100%',
        px: { xs: 1, sm: 2, md: 3 },
      }}
    >
      <Typography
        variant="h5"
        sx={{
          fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' },
        }}
      >
        Dashboard admin (OK)
      </Typography>
    </Box>
  );
}
