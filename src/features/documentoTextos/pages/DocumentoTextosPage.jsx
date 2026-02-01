import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  Divider,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';

import { getDocumentoTextos } from '../services/documentoTextos.service';
import DocumentoTextoForm from '../components/DocumentoTextoForm';

function getChipColor(tipo) {
  return tipo === 'presupuesto' ? 'primary' : 'success';
}

function getTipoLabel(tipo) {
  return tipo === 'presupuesto'
    ? 'Texto legal de presupuesto'
    : 'Texto legal de factura';
}

export default function DocumentoTextosPage() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);

  const loadData = async () => {
    const data = await getDocumentoTextos();
    setRows(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* HEADER */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={600}>
            Textos legales
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configura los textos legales que aparecerán en presupuestos y facturas
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() =>
            setSelected({
              tipo: 'presupuesto',
              contenido: '',
            })
          }
        >
          Nuevo texto legal
        </Button>
      </Box>

      {/* LISTADO */}
      <Grid container spacing={3}>
        {rows.map((item) => (
          <Grid item xs={12} md={6} key={item.id}>
            <Card
              variant="outlined"
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                {/* CABECERA CARD */}
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Box>
                    <Typography fontWeight={600}>
                      {getTipoLabel(item.tipo)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID #{item.id}
                    </Typography>
                  </Box>

                  <Chip
                    label={item.tipo.toUpperCase()}
                    color={getChipColor(item.tipo)}
                    size="small"
                  />
                </Stack>

                {/* PREVIEW */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    backgroundColor: 'background.default',
                    maxHeight: 140,
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <Box
                    sx={{
                      fontSize: '0.9rem',
                      lineHeight: 1.5,
                      '& h1, & h2': {
                        fontSize: '1rem',
                        fontWeight: 600,
                        mb: 1,
                      },
                      '& p': {
                        mb: 1,
                        color: 'text.secondary',
                      },
                    }}
                    dangerouslySetInnerHTML={{
                      __html: item.contenido || '<em>Sin contenido</em>',
                    }}
                  />

                  {/* FADE */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 40,
                      background:
                        'linear-gradient(transparent, rgba(255,255,255,0.95))',
                    }}
                  />
                </Box>
              </CardContent>

              <Divider />

              {/* ACCIONES */}
              <Box
                sx={{
                  p: 2,
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => setSelected(item)}
                >
                  Editar
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* MODAL CREATE / EDIT */}
      {selected && (
        <DocumentoTextoForm
          texto={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            loadData();
          }}
        />
      )}
    </Box>
  );
}
