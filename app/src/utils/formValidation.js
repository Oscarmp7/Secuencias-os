/**
 * formValidation.js
 * 
 * Utilidades para validar el formulario de contribución de recursos.
 * Incluye validaciones de campos, archivos y control de frecuencia de envío.
 */

// ═══════════════════════════════════════════════════════════════════════════════
//   📋 CONSTANTES DE VALIDACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

// Tamaño máximo de archivo: 20MB
export const MAX_FILE_SIZE = 20 * 1024 * 1024;

// Tipos de archivo permitidos
export const ALLOWED_FILE_TYPES = ['.zip', '.rar'];
export const ALLOWED_MIME_TYPES = [
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/vnd.rar',
  'application/octet-stream', // Algunos navegadores usan esto para .rar
];

// Tiempo mínimo entre envíos (en milisegundos): 1 minuto
export const MIN_SUBMISSION_INTERVAL = 60 * 1000;

// Clave de localStorage para controlar envíos
const LAST_SUBMISSION_KEY = 'worshipbox_last_submission';

// Opciones de tonalidad
export const TONALIDAD_OPTIONS = [
  // Mayores
  { value: 'C', label: 'C (Do Mayor)' },
  { value: 'C#', label: 'C# (Do# Mayor)' },
  { value: 'D', label: 'D (Re Mayor)' },
  { value: 'D#', label: 'D# (Re# Mayor)' },
  { value: 'E', label: 'E (Mi Mayor)' },
  { value: 'F', label: 'F (Fa Mayor)' },
  { value: 'F#', label: 'F# (Fa# Mayor)' },
  { value: 'G', label: 'G (Sol Mayor)' },
  { value: 'G#', label: 'G# (Sol# Mayor)' },
  { value: 'A', label: 'A (La Mayor)' },
  { value: 'A#', label: 'A# (La# Mayor)' },
  { value: 'B', label: 'B (Si Mayor)' },
  // Menores
  { value: 'Cm', label: 'Cm (Do menor)' },
  { value: 'C#m', label: 'C#m (Do# menor)' },
  { value: 'Dm', label: 'Dm (Re menor)' },
  { value: 'D#m', label: 'D#m (Re# menor)' },
  { value: 'Em', label: 'Em (Mi menor)' },
  { value: 'Fm', label: 'Fm (Fa menor)' },
  { value: 'F#m', label: 'F#m (Fa# menor)' },
  { value: 'Gm', label: 'Gm (Sol menor)' },
  { value: 'G#m', label: 'G#m (Sol# menor)' },
  { value: 'Am', label: 'Am (La menor)' },
  { value: 'A#m', label: 'A#m (La# menor)' },
  { value: 'Bm', label: 'Bm (Si menor)' },
];

// Opciones de compás
export const COMPAS_OPTIONS = [
  { value: '4/4', label: '4/4' },
  { value: '3/4', label: '3/4' },
  { value: '6/8', label: '6/8' },
  { value: '2/4', label: '2/4' },
  { value: '12/8', label: '12/8' },
  { value: '5/4', label: '5/4' },
  { value: '7/8', label: '7/8' },
];

// Tipos de aporte
export const APORTE_TYPES = [
  { value: 'secuencia', label: 'Secuencia / Multitrack' },
  { value: 'software', label: 'Software / Herramienta' },
  { value: 'sugerencia', label: 'Sugerencia / Comentario' },
];

// Subcategorías de software
export const SOFTWARE_CATEGORIES = [
  { value: 'daws', label: 'DAWs (Digital Audio Workstations)' },
  { value: 'plugins', label: 'Plugins e Instrumentos Virtuales' },
  { value: 'utilidades', label: 'Utilidades' },
];

// ═══════════════════════════════════════════════════════════════════════════════
//   ✅ FUNCIONES DE VALIDACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Valida un archivo adjunto.
 * 
 * @param {File} file - Archivo a validar
 * @param {number} maxSize - Tamaño máximo en bytes (default: 20MB)
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateFile(file, maxSize = MAX_FILE_SIZE) {
  if (!file) {
    return { valid: true }; // El archivo es opcional si hay URL
  }

  // Validar tamaño
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `El archivo excede el tamaño máximo de ${maxSizeMB}MB`,
    };
  }

  // Validar tipo de archivo por extensión
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_FILE_TYPES.some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    return {
      valid: false,
      error: `Solo se permiten archivos comprimidos (${ALLOWED_FILE_TYPES.join(', ')})`,
    };
  }

  return { valid: true };
}

/**
 * Valida el formulario completo de contribución.
 * 
 * @param {Object} formData - Datos del formulario
 * @returns {{ valid: boolean, errors: Object }}
 */
export function validateContributeForm(formData) {
  const errors = {};

  // Validar tipo de aporte (obligatorio)
  if (!formData.tipoAporte) {
    errors.tipoAporte = 'Selecciona el tipo de aporte';
  }

  // Validaciones según el tipo de aporte
  if (formData.tipoAporte === 'secuencia') {
    // Campos obligatorios para secuencias
    if (!formData.nombreRecurso?.trim()) {
      errors.nombreRecurso = 'El nombre del recurso es obligatorio';
    }
    if (!formData.artista?.trim()) {
      errors.artista = 'El artista es obligatorio';
    }
    if (!formData.tonalidad) {
      errors.tonalidad = 'La tonalidad es obligatoria';
    }
    if (!formData.bpm || formData.bpm < 20 || formData.bpm > 300) {
      errors.bpm = 'El BPM debe estar entre 20 y 300';
    }
    if (!formData.compas) {
      errors.compas = 'El compás es obligatorio';
    }

    // URL o archivo obligatorio
    if (!formData.urlDescarga?.trim() && !formData.archivo) {
      errors.urlOArchivo = 'Debes proporcionar una URL de descarga o adjuntar un archivo';
    }
  } else if (formData.tipoAporte === 'software') {
    // Campos obligatorios para software
    if (!formData.nombreRecurso?.trim()) {
      errors.nombreRecurso = 'El nombre del software es obligatorio';
    }
    if (!formData.subcategoria) {
      errors.subcategoria = 'La subcategoría es obligatoria';
    }
    if (!formData.descripcion?.trim()) {
      errors.descripcion = 'La descripción es obligatoria';
    }

    // URL o archivo obligatorio
    if (!formData.urlDescarga?.trim() && !formData.archivo) {
      errors.urlOArchivo = 'Debes proporcionar una URL de descarga o adjuntar un archivo';
    }
  } else if (formData.tipoAporte === 'sugerencia') {
    // Para sugerencias, el comentario es obligatorio
    if (!formData.sugerencias?.trim()) {
      errors.sugerencias = 'Escribe tu sugerencia o comentario';
    }
  }

  // Validar archivo si se proporciona
  if (formData.archivo) {
    const fileValidation = validateFile(formData.archivo);
    if (!fileValidation.valid) {
      errors.archivo = fileValidation.error;
    }
  }

  // Validar email si se proporciona
  if (formData.email && !isValidEmail(formData.email)) {
    errors.email = 'El correo electrónico no es válido';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Valida un email.
 * 
 * @param {string} email - Email a validar
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// ═══════════════════════════════════════════════════════════════════════════════
//   ⏱️ CONTROL DE FRECUENCIA DE ENVÍO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Verifica si el usuario puede enviar un nuevo formulario.
 * 
 * @returns {{ canSubmit: boolean, remainingTime?: number }}
 */
export function canSubmitForm() {
  try {
    const lastSubmission = localStorage.getItem(LAST_SUBMISSION_KEY);
    
    if (!lastSubmission) {
      return { canSubmit: true };
    }

    const lastTime = parseInt(lastSubmission, 10);
    const now = Date.now();
    const elapsed = now - lastTime;

    if (elapsed >= MIN_SUBMISSION_INTERVAL) {
      return { canSubmit: true };
    }

    return {
      canSubmit: false,
      remainingTime: Math.ceil((MIN_SUBMISSION_INTERVAL - elapsed) / 1000),
    };
  } catch {
    // Si localStorage no está disponible, permitir envío
    return { canSubmit: true };
  }
}

/**
 * Registra un envío exitoso.
 */
export function recordSubmission() {
  try {
    localStorage.setItem(LAST_SUBMISSION_KEY, Date.now().toString());
  } catch {
    // Ignorar errores de localStorage
  }
}

/**
 * Formatea el tiempo restante en un mensaje legible.
 * 
 * @param {number} seconds - Segundos restantes
 * @returns {string}
 */
export function formatRemainingTime(seconds) {
  if (seconds < 60) {
    return `${seconds} segundo${seconds !== 1 ? 's' : ''}`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
}

export default {
  validateFile,
  validateContributeForm,
  isValidEmail,
  canSubmitForm,
  recordSubmission,
  formatRemainingTime,
  TONALIDAD_OPTIONS,
  COMPAS_OPTIONS,
  APORTE_TYPES,
  SOFTWARE_CATEGORIES,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
};
