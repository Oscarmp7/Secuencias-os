/**
 * sanitize.js
 *
 * Utilidades de sanitización de texto para minimizar inyección de HTML
 * y caracteres de control en datos enviados por formularios.
 */

const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char]);
}

/**
 * Sanitiza texto plano:
 * - Normaliza saltos de línea
 * - Elimina caracteres de control
 * - Remueve < y >
 * - Recorta longitud
 */
export function sanitizePlainText(value, { maxLen = 2000 } = {}) {
  if (value === null || value === undefined) return '';
  let text = String(value);
  text = text.replace(/\r\n?/g, '\n');
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  text = text.replace(/[<>]/g, '');
  text = text.trim();
  if (maxLen && text.length > maxLen) {
    text = text.slice(0, maxLen);
  }
  return text;
}

/**
 * Sanitiza texto para HTML (escape de entidades).
 */
export function sanitizeHtml(value, options = {}) {
  return escapeHtml(sanitizePlainText(value, options));
}

/**
 * Sanitiza URL (http/https) y elimina espacios/saltos de línea.
 */
export function sanitizeUrl(value, { maxLen = 2048 } = {}) {
  const text = sanitizePlainText(value, { maxLen }).replace(/\s+/g, '');
  if (!text) return '';
  if (!/^https?:\/\//i.test(text)) return '';
  return text;
}

/**
 * Sanitiza un objeto de formulario (texto plano).
 */
export function sanitizeFormData(formData) {
  const safe = { ...formData };
  const allowedInstruments = new Set([
    'keys',
    'drums',
    'guitars',
    'pads',
    'strings',
    'vocals',
    'fx',
    'samplers',
    'other',
  ]);

  safe.tipoAporte = sanitizePlainText(formData.tipoAporte, { maxLen: 50 });
  safe.nombreRecurso = sanitizePlainText(formData.nombreRecurso, { maxLen: 120 });
  safe.artista = sanitizePlainText(formData.artista, { maxLen: 120 });
  safe.album = sanitizePlainText(formData.album, { maxLen: 120 });
  safe.tonalidad = sanitizePlainText(formData.tonalidad, { maxLen: 20 });
  safe.bpm = formData.bpm;
  safe.compas = sanitizePlainText(formData.compas, { maxLen: 10 });
  safe.subcategoria = sanitizePlainText(formData.subcategoria, { maxLen: 80 });
  safe.descripcion = sanitizePlainText(formData.descripcion, { maxLen: 500 });
  safe.urlDescarga = sanitizeUrl(formData.urlDescarga);
  safe.downloadInfo = formData.downloadInfo ? {
    url: sanitizeUrl(formData.downloadInfo.url),
    isValid: !!formData.downloadInfo.isValid,
    service: formData.downloadInfo.service ? {
      id: sanitizePlainText(formData.downloadInfo.service.id, { maxLen: 40 }),
      name: sanitizePlainText(formData.downloadInfo.service.name, { maxLen: 80 }),
      icon: sanitizePlainText(formData.downloadInfo.service.icon, { maxLen: 40 }),
    } : null,
    fileId: sanitizePlainText(formData.downloadInfo.fileId, { maxLen: 200 }),
    canGenerateDirectLink: !!formData.downloadInfo.canGenerateDirectLink,
  } : null;
  safe.driveId = formData.driveId ? sanitizePlainText(formData.driveId, { maxLen: 120 }) : null;
  safe.submittedAt = sanitizePlainText(formData.submittedAt, { maxLen: 40 });
  safe.pageUrl = sanitizeUrl(formData.pageUrl);
  safe.userAgent = sanitizePlainText(formData.userAgent, { maxLen: 200 });
  safe.nombre = sanitizePlainText(formData.nombre, { maxLen: 120 });
  safe.email = sanitizePlainText(formData.email, { maxLen: 200 });
  safe.sugerencias = sanitizePlainText(formData.sugerencias, { maxLen: 1000 });
  safe.website = sanitizePlainText(formData.website, { maxLen: 80 });
  safe.instrumentos = Array.isArray(formData.instrumentos)
    ? formData.instrumentos.filter((item) => allowedInstruments.has(item))
    : [];

  return safe;
}

export default {
  sanitizePlainText,
  sanitizeHtml,
  sanitizeUrl,
  sanitizeFormData,
};
