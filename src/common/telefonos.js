// common/telefonos.js
// Misma lógica que App\Support\Telefono del API: distingue móviles (WhatsApp) de fijos.
// España: 9 cifras; móviles empiezan por 6 o 7, fijos por 8 o 9.
// Con + o 00 y otro prefijo de país → extranjero (no se puede saber si es móvil).

export const TIPO_TELEFONO = {
  MOVIL: 'movil',
  FIJO: 'fijo',
  EXTRANJERO: 'extranjero',
  INVALIDO: 'invalido',
  VACIO: 'vacio',
};

export function analizarTelefono(telefono) {
  const original = (telefono ?? '').trim();
  if (!original) return { tipo: TIPO_TELEFONO.VACIO, numero: null };

  let internacional = original.startsWith('+') || original.startsWith('00');
  let digitos = original.replace(/\D+/g, '');
  if (original.startsWith('00')) digitos = digitos.slice(2);

  // Español con prefijo (+34 / 0034 / 34 + 9 cifras)
  if (digitos.startsWith('34') && digitos.length === 11) {
    digitos = digitos.slice(2);
    internacional = false;
  }

  if (!internacional && digitos.length === 9) {
    if (['6', '7'].includes(digitos[0])) return { tipo: TIPO_TELEFONO.MOVIL, numero: `34${digitos}` };
    if (['8', '9'].includes(digitos[0])) return { tipo: TIPO_TELEFONO.FIJO, numero: `34${digitos}` };
    return { tipo: TIPO_TELEFONO.INVALIDO, numero: null };
  }

  if (internacional && digitos.length >= 8 && digitos.length <= 15) {
    return { tipo: TIPO_TELEFONO.EXTRANJERO, numero: digitos };
  }

  return { tipo: TIPO_TELEFONO.INVALIDO, numero: null };
}

// Texto de ayuda para un campo de teléfono (null si no hay nada que decir)
export function ayudaTelefono(telefono) {
  switch (analizarTelefono(telefono).tipo) {
    case TIPO_TELEFONO.MOVIL:
      return { severity: 'success', texto: 'Móvil: se puede enviar por WhatsApp' };
    case TIPO_TELEFONO.FIJO:
      return { severity: 'warning', texto: 'Teléfono fijo: no tiene WhatsApp' };
    case TIPO_TELEFONO.EXTRANJERO:
      return { severity: 'info', texto: 'Número extranjero: comprueba que tenga WhatsApp' };
    case TIPO_TELEFONO.INVALIDO:
      return { severity: 'error', texto: 'Número no válido (9 cifras, o con prefijo +34…)' };
    default:
      return null;
  }
}

export function puedeWhatsapp(telefono) {
  const { tipo } = analizarTelefono(telefono);
  // Vacío también vale: WhatsApp se abre para elegir el contacto
  return [TIPO_TELEFONO.MOVIL, TIPO_TELEFONO.EXTRANJERO, TIPO_TELEFONO.VACIO].includes(tipo);
}
