/**
 * emailService.js
 * 
 * Servicio para envío de correos usando EmailJS.
 * Maneja el envío de formularios y correos de agradecimiento.
 * 
 * CONFIGURACIÓN REQUERIDA:
 * Para usar este servicio, necesitas configurar una cuenta en EmailJS (https://www.emailjs.com/)
 * y crear las siguientes variables de entorno o constantes:
 * - EMAILJS_SERVICE_ID: ID del servicio de email configurado
 * - EMAILJS_TEMPLATE_ID: ID de la plantilla para formularios
 * - EMAILJS_TEMPLATE_THANKS_ID: ID de la plantilla de agradecimiento
 * - EMAILJS_PUBLIC_KEY: Clave pública de EmailJS
 */

import emailjs from '@emailjs/browser';

// ═══════════════════════════════════════════════════════════════════════════════
//   ⚙️ CONFIGURACIÓN DE EMAILJS
// ═══════════════════════════════════════════════════════════════════════════════

// IMPORTANTE: Reemplaza estos valores con tu configuración de EmailJS
// Puedes obtenerlos en: https://dashboard.emailjs.com/
const EMAILJS_CONFIG = {
  SERVICE_ID: 'YOUR_SERVICE_ID',      // Ej: 'service_abc123'
  TEMPLATE_FORM_ID: 'YOUR_TEMPLATE_ID', // Plantilla para recibir formularios
  TEMPLATE_THANKS_ID: 'YOUR_THANKS_TEMPLATE_ID', // Plantilla de agradecimiento
  PUBLIC_KEY: 'YOUR_PUBLIC_KEY',      // Clave pública
};

// Email de destino (donde recibirás los aportes)
const WORSHIP_BOX_EMAIL = 'worshipbox@example.com'; // Cambiar por el email real

// ═══════════════════════════════════════════════════════════════════════════════
//   📧 FUNCIONES DE ENVÍO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Inicializa EmailJS con la clave pública.
 * Debe llamarse una vez al cargar la aplicación.
 */
export function initEmailJS() {
  if (EMAILJS_CONFIG.PUBLIC_KEY && EMAILJS_CONFIG.PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
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
    EMAILJS_CONFIG.SERVICE_ID !== 'YOUR_SERVICE_ID' &&
    EMAILJS_CONFIG.PUBLIC_KEY !== 'YOUR_PUBLIC_KEY'
  );
}

/**
 * Envía el formulario de contribución al correo de WorshipBox.
 * 
 * @param {Object} formData - Datos del formulario
 * @param {string} xlsxBase64 - Archivo XLSX en Base64 (opcional)
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function sendContributionForm(formData, xlsxBase64 = null) {
  // Si EmailJS no está configurado, simular envío exitoso (para desarrollo)
  if (!isEmailJSConfigured()) {
    console.log('📧 Simulando envío de formulario (EmailJS no configurado):', formData);
    return { success: true, simulated: true };
  }

  try {
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
      tiene_archivo: formData.archivo ? 'Sí' : 'No',
      nombre_archivo: formData.archivo?.name || '',
      nombre_donante: formData.nombre || 'Anónimo',
      email_donante: formData.email || 'No proporcionado',
      sugerencias: formData.sugerencias || '',
      fecha_envio: new Date().toLocaleString('es-ES'),
      // Archivo XLSX adjunto (si está disponible)
      attachment: xlsxBase64 || '',
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_FORM_ID,
      templateParams
    );

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
  if (!isEmailJSConfigured()) {
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
