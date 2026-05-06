
import api from '../../../lib/api';

export async function getDocumentoTextos(params = {}) {
  const res = await api.get('/documento-textos', { params });
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