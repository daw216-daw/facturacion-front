import {Box} from '@mui/material';

export default function DocumentoTextoPreview({ html }) {
  return (
    <Box
      sx={{
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 1,
        p: 2,
        backgroundColor: 'background.paper',
        fontSize: '0.95rem',
        lineHeight: 1.6,
        '& h1': { fontSize: '1.6rem', fontWeight: 600 },
        '& h2': { fontSize: '1.3rem', fontWeight: 600 },
        '& h3': { fontSize: '1.1rem', fontWeight: 600 },
        '& p': { mb: 1 },
        '& ul, & ol': { pl: 3, mb: 1 },
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
