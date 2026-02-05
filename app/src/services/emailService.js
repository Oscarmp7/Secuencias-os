/**
 * emailService.js
 * 
 * Servicio para envío de correos usando EmailJS.
 * Maneja el envío de formularios y correos de agradecimiento.
 * 
 * CONFIGURACIÓN REQUERIDA:
 * Para usar este servicio, necesitas configurar una cuenta en EmailJS (https://www.emailjs.com/)
 * y definir las variables de entorno (Vite):
 * - VITE_EMAILJS_SERVICE_ID: ID del servicio de email configurado
 * - VITE_EMAILJS_TEMPLATE_FORM_ID: ID de la plantilla para formularios
 * - VITE_EMAILJS_TEMPLATE_THANKS_ID: ID de la plantilla de agradecimiento
 * - VITE_EMAILJS_PUBLIC_KEY: Clave pública de EmailJS
 * - VITE_EMAILJS_TO_EMAIL: Email de destino (opcional)
 * - VITE_CONTRIBUTE_ENDPOINT: Endpoint seguro (opcional)
 * - VITE_EMAILJS_ATTACH_XLSX: "false" para desactivar adjunto XLSX
 */

import emailjs from '@emailjs/browser';

// ═══════════════════════════════════════════════════════════════════════════════
//   ⚙️ CONFIGURACIÓN DE EMAILJS
// ═══════════════════════════════════════════════════════════════════════════════

// Configuración de EmailJS (Vite env)
const EMAILJS_CONFIG = {
  SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID || '',
  TEMPLATE_FORM_ID: import.meta.env.VITE_EMAILJS_TEMPLATE_FORM_ID || '',
  TEMPLATE_THANKS_ID: import.meta.env.VITE_EMAILJS_TEMPLATE_THANKS_ID || '',
  PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '',
};

// Email de destino (donde recibirás los aportes)
const WORSHIP_BOX_EMAIL = import.meta.env.VITE_EMAILJS_TO_EMAIL || 'worshipbox.ministry@gmail.com';

// Endpoint opcional para envío seguro (serverless/backend)
const CONTRIBUTE_ENDPOINT = import.meta.env.VITE_CONTRIBUTE_ENDPOINT || '';

// Adjuntar XLSX al EmailJS (puede fallar si el plan no soporta adjuntos)
const EMAILJS_ATTACH_XLSX = import.meta.env.VITE_EMAILJS_ATTACH_XLSX !== 'false';

// ═══════════════════════════════════════════════════════════════════════════════
//   📧 FUNCIONES DE ENVÍO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Inicializa EmailJS con la clave pública.
 * Debe llamarse una vez al cargar la aplicación.
 */
export function initEmailJS() {
  if (EMAILJS_CONFIG.PUBLIC_KEY) {
    emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
    return true;
  }
  console.warn('EmailJS no está configurado. Los correos no se enviarán.');
  return false;
}

/**
 * Verifica si EmailJS está configurado correctamente.
 */
export function isEmailJSConfigured() {
  return (
    !!EMAILJS_CONFIG.SERVICE_ID &&
    !!EMAILJS_CONFIG.TEMPLATE_FORM_ID &&
    !!EMAILJS_CONFIG.PUBLIC_KEY
  );
}

function isThanksEmailConfigured() {
  return isEmailJSConfigured() && !!EMAILJS_CONFIG.TEMPLATE_THANKS_ID;
}

async function sendContributionToEndpoint(payload) {
  const response = await fetch(CONTRIBUTE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Endpoint error (${response.status}): ${text || 'Sin detalle'}`);
  }

  return { success: true };
}

/**
 * Envía el formulario de contribución al correo de WorshipBox.
 * 
 * @param {Object} formData - Datos del formulario
 * @param {string} xlsxBase64 - Archivo XLSX en Base64 (opcional)
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function sendContributionForm(formData, xlsxBase64 = null) {
  // Si EmailJS no está configurado y no hay endpoint, simular envío exitoso (para desarrollo)
  if (!isEmailJSConfigured() && !CONTRIBUTE_ENDPOINT) {
    console.log('📧 Simulando envío de formulario (EmailJS no configurado):', formData);
    console.info(
      '💡 Para habilitar el envío real, configura las variables de entorno VITE_EMAILJS_* en tu proveedor de hosting (Vercel, etc.)'
    );
    return { success: true, simulated: true };
  }

  // Log de diagnóstico en consola
  console.log('📧 Enviando formulario...', {
    emailjsConfigured: isEmailJSConfigured(),
    hasEndpoint: !!CONTRIBUTE_ENDPOINT,
    hasXlsx: !!xlsxBase64,
  });

  try {
    // Si existe endpoint seguro, usarlo primero
    if (CONTRIBUTE_ENDPOINT) {
      return await sendContributionToEndpoint({
        ...formData,
        xlsxBase64: xlsxBase64 || null,
      });
    }

    // Preparar parámetros para la plantilla
    const templateParams = {
      to_email: WORSHIP_BOX_EMAIL,
      tipo_aporte: formData.tipoAporte || 'No especificado',
      nombre_recurso: formData.nombreRecurso || 'No especificado',
      artista: formData.artista || '',
      album: formData.album || '',
      tonalidad: formData.tonalidad || '',
      bpm: formData.bpm || '',
      compas: formData.compas || '',
      subcategoria: formData.subcategoria || '',
      descripcion: formData.descripcion || '',
      url_descarga: formData.urlDescarga || '',
      drive_id: formData.driveId || '',
      servicio_descarga: formData.downloadInfo?.service?.name || '',
      id_descarga: formData.downloadInfo?.fileId || '',
      nombre_donante: formData.nombre || 'Anónimo',
      email_donante: formData.email || 'No proporcionado',
      sugerencias: formData.sugerencias || '',
      fecha_envio: new Date().toLocaleString('es-ES'),
      // Archivo XLSX adjunto (si está disponible y permitido)
      attachment: EMAILJS_ATTACH_XLSX ? (xlsxBase64 || '') : '',
    };

    let response;
    try {
      response = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_FORM_ID,
        templateParams
      );
    } catch (error) {
      // Si falla por adjunto, reintentar sin attachment
      if (xlsxBase64) {
        const retryParams = { ...templateParams, attachment: '' };
        response = await emailjs.send(
          EMAILJS_CONFIG.SERVICE_ID,
          EMAILJS_CONFIG.TEMPLATE_FORM_ID,
          retryParams
        );
      } else {
        throw error;
      }
    }

    if (response.status === 200) {
      return { success: true };
    } else {
      return { success: false, error: 'Error al enviar el formulario' };
    }
  } catch (error) {
    console.error('Error enviando formulario:', error);
    return { success: false, error: error.message || 'Error desconocido' };
  }
}

/**
 * Envía un correo de agradecimiento al donante.
 * 
 * @param {Object} params - Parámetros del correo
 * @param {string} params.email - Email del destinatario
 * @param {string} params.nombre - Nombre del destinatario (opcional)
 * @param {string} params.tipoAporte - Tipo de aporte realizado
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function sendThankYouEmail({ email, nombre, tipoAporte }) {
  // Validar que hay email
  if (!email) {
    return { success: false, error: 'No hay email de destinatario' };
  }

  // Si EmailJS no está configurado, simular envío exitoso
  if (!isThanksEmailConfigured()) {
    console.log('📧 Simulando envío de agradecimiento a:', email);
    return { success: true, simulated: true };
  }

  try {
    // Preparar saludo personalizado
    const saludo = nombre ? `Estimado/a ${nombre}` : 'Estimado/a hermano/a';
    
    // Descripción del tipo de aporte
    const tipoDescripcion = {
      secuencia: 'secuencia musical',
      software: 'software/herramienta',
      sugerencia: 'sugerencia',
    }[tipoAporte] || 'aporte';

    const templateParams = {
      to_email: email,
      saludo: saludo,
      nombre: nombre || 'Hermano/a',
      tipo_aporte: tipoDescripcion,
      // Contenido del mensaje de agradecimiento
      mensaje: `
Queremos agradecerte sinceramente por tu valiosa contribución a nuestra plataforma. 
Tu ${tipoDescripcion} será de gran ayuda para la comunidad y permitirá que más personas 
puedan acceder a recursos útiles para su ministerio.

Si tienes más recursos que compartir o sugerencias para mejorar nuestra plataforma, 
no dudes en enviarlos. Juntos podemos seguir construyendo esta comunidad para el 
beneficio de todos.

¡Gracias nuevamente por tu generosidad y apoyo!

Bendiciones,
El equipo de WorshipBox
      `.trim(),
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_THANKS_ID,
      templateParams
    );

    if (response.status === 200) {
      return { success: true };
    } else {
      return { success: false, error: 'Error al enviar el correo' };
    }
  } catch (error) {
    console.error('Error enviando correo de agradecimiento:', error);
    return { success: false, error: error.message || 'Error desconocido' };
  }
}

/**
 * Genera el mensaje de agradecimiento para mostrar en pop-up.
 * 
 * @param {string} nombre - Nombre del donante (opcional)
 * @param {string} tipoAporte - Tipo de aporte
 * @returns {{ title: string, message: string }}
 */
export function generateThankYouMessage(nombre, tipoAporte) {
  const saludo = nombre ? `¡Gracias, ${nombre}!` : '¡Gracias por tu aporte!';
  
  const tipoDescripcion = {
    secuencia: 'secuencia musical',
    software: 'software/herramienta',
    sugerencia: 'sugerencia',
  }[tipoAporte] || 'aporte';

  return {
    title: saludo,
    message: `Tu ${tipoDescripcion} es muy valiosa para la comunidad. Si tienes más recursos o sugerencias, ¡no dudes en compartirlos!`,
  };
}

export default {
  initEmailJS,
  isEmailJSConfigured,
  sendContributionForm,
  sendThankYouEmail,
  generateThankYouMessage,
};
