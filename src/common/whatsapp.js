// common/whatsapp.js
// Abre WhatsApp con la URL que devuelve el API.
// La ventana se abre JUSTO al pulsar (antes de esperar al API): si se abre después,
// Safari/iPhone y otros navegadores la bloquean como ventana emergente.

export async function abrirWhatsapp(pedirEnlace) {
  const ventana = window.open('', '_blank');

  try {
    const respuesta = await pedirEnlace();
    const url = respuesta?.whatsapp_url;

    if (!url) throw new Error('El servidor no devolvió el enlace de WhatsApp');

    if (ventana && !ventana.closed) {
      ventana.opener = null;
      ventana.location.href = url;
    } else {
      // Si el navegador no permitió la ventana, se abre en la misma pestaña
      window.location.href = url;
    }

    return respuesta;
  } catch (error) {
    if (ventana && !ventana.closed) ventana.close();
    throw error;
  }
}
