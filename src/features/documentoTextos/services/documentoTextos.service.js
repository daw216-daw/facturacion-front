
import api from '../../../lib/api';

export async function getDocumentoTextos() {
  const res = await api.get('/documento-textos');
  return res.data;
}

export async function updateDocumentoTexto(id, data) {
  const res = await api.put(`/documento-textos/${id}`, data);
  return res.data;
}

export async function createDocumentoTexto(data) {
  const res = await api.post('/documento-textos', data);
  return res.data;
}