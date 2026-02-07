/**
 * downloadUtils.js
 * 
 * Utilidades para trabajar con URLs de descarga de múltiples servicios.
 * Soporta: Google Drive, Mega, TeraBox, MediaFire, Dropbox, OneDrive, Ufile, y otros.
 * 
 * Utilidades centralizadas para detectar servicios y generar URLs de descarga
 */

// ═══════════════════════════════════════════════════════════════════════════════
//   📋 CONFIGURACIÓN DE SERVICIOS SOPORTADOS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Servicios de almacenamiento soportados con sus patrones de URL
 */
export const SUPPORTED_SERVICES = {
  googleDrive: {
    name: 'Google Drive',
    icon: 'google-drive',
    domains: ['drive.google.com'],
    patterns: [
      /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
      /drive\.google\.com\/.*[?&]id=([a-zA-Z0-9_-]+)/,
      /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
      /drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/,
      /drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/,
    ],
    extractId: true,
    generateDownload: (id) => `https://drive.google.com/uc?export=download&id=${id}`,
  },
  mega: {
    name: 'MEGA',
    icon: 'mega',
    domains: ['mega.nz', 'mega.co.nz'],
    patterns: [
      /mega\.nz\/(file|folder)\/([a-zA-Z0-9_-]+)(#[a-zA-Z0-9_-]+)?/,
      /mega\.nz\/#!([a-zA-Z0-9_-]+)/,
      /mega\.co\.nz\/#!([a-zA-Z0-9_-]+)/,
    ],
    extractId: false, // MEGA usa el enlace completo
    generateDownload: null, // MEGA no permite descarga directa sin su app
  },
  terabox: {
    name: 'TeraBox',
    icon: 'terabox',
    domains: ['terabox.com', 'terabox.app', 'teraboxapp.com', '1024tera.com', 'freeterabox.com'],
    patterns: [
      /terabox\.com\/s\/([a-zA-Z0-9_-]+)/,
      /terabox\.app\/s\/([a-zA-Z0-9_-]+)/,
      /teraboxapp\.com\/s\/([a-zA-Z0-9_-]+)/,
      /1024tera\.com\/s\/([a-zA-Z0-9_-]+)/,
      /freeterabox\.com\/s\/([a-zA-Z0-9_-]+)/,
    ],
    extractId: false,
    generateDownload: null,
  },
  mediafire: {
    name: 'MediaFire',
    icon: 'mediafire',
    domains: ['mediafire.com'],
    patterns: [
      /mediafire\.com\/file\/([a-zA-Z0-9]+)/,
      /mediafire\.com\/\?([a-zA-Z0-9]+)/,
    ],
    extractId: true,
    generateDownload: null, // MediaFire requiere redirección
  },
  dropbox: {
    name: 'Dropbox',
    icon: 'dropbox',
    domains: ['dropbox.com', 'dl.dropboxusercontent.com'],
    patterns: [
      /dropbox\.com\/s\/([a-zA-Z0-9]+)/,
      /dropbox\.com\/scl\/fi\/([a-zA-Z0-9]+)/,
    ],
    extractId: false,
    // Dropbox: cambiar ?dl=0 por ?dl=1 para descarga directa
    generateDownload: (url) => url.replace(/\?dl=0/, '?dl=1').replace(/&dl=0/, '&dl=1'),
  },
  onedrive: {
    name: 'OneDrive',
    icon: 'onedrive',
    domains: ['onedrive.live.com', '1drv.ms'],
    patterns: [
      /onedrive\.live\.com\/.*[?&]id=([a-zA-Z0-9%!]+)/,
      /1drv\.ms\/([a-zA-Z0-9]+)/,
    ],
    extractId: false,
    generateDownload: null,
  },
  ufile: {
    name: 'Ufile.io',
    icon: 'ufile',
    domains: ['ufile.io'],
    patterns: [
      /ufile\.io\/([a-zA-Z0-9]+)/,
    ],
    extractId: true,
    generateDownload: null,
  },
  blogspot: {
    name: 'Blogspot',
    icon: 'blog',
    domains: ['blogspot.com', 'blogger.com'],
    patterns: [
      /blogspot\.com\/.+/,
      /blogger\.com\/.+/,
    ],
    extractId: false,
    generateDownload: null,
  },
  // Servicio genérico para otras URLs válidas
  other: {
    name: 'Enlace Directo',
    icon: 'link',
    domains: [], // Se usará como fallback
    patterns: [],
    extractId: false,
    generateDownload: null,
    isGeneric: true, // Flag para indicar que es genérico
  },
};

// Lista de dominios soportados (para validación rápida)
export const SUPPORTED_DOMAINS = Object.values(SUPPORTED_SERVICES)
  .filter(s => !s.isGeneric)
  .flatMap(service => service.domains);

// ═══════════════════════════════════════════════════════════════════════════════
//   🔍 FUNCIONES DE DETECCIÓN Y VALIDACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Detecta el servicio de almacenamiento de una URL.
 * 
 * @param {string} url - URL a analizar
 * @returns {object|null} - Información del servicio o null si no se reconoce
 * 
 * @example
 * detectService('https://mega.nz/file/abc123')
 * // Returns: { id: 'mega', name: 'MEGA', ... }
 */
export function detectService(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const cleanUrl = url.trim();
  const lowerUrl = cleanUrl.toLowerCase();

  // Verificar servicios conocidos por dominio
  for (const [serviceId, service] of Object.entries(SUPPORTED_SERVICES)) {
    if (service.isGeneric) continue;
    
    const matchesDomain = service.domains.some(domain => lowerUrl.includes(domain));
    if (matchesDomain) {
      return {
        id: serviceId,
        ...service,
      };
    }
  }

  // Si no coincide con ningún servicio conocido, usar servicio genérico
  // Solo si es una URL válida con http/https
  if (lowerUrl.startsWith('http://') || lowerUrl.startsWith('https://')) {
    return {
      id: 'other',
      ...SUPPORTED_SERVICES.other,
    };
  }

  return null;
}

/**
 * Valida si una URL es de un servicio de descarga soportado.
 * 
 * @param {string} url - URL a validar
 * @returns {boolean} - true si es una URL válida de un servicio soportado
 */
export function isValidDownloadUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const cleanUrl = url.trim();
  
  // Verificar que sea una URL válida
  try {
    new URL(cleanUrl);
  } catch {
    return false;
  }

  // Detectar el servicio
  const service = detectService(cleanUrl);
  if (!service) {
    return false;
  }

  // Para el servicio genérico, cualquier URL http/https válida es aceptada
  if (service.isGeneric) {
    return true;
  }

  // Verificar que coincida con algún patrón del servicio
  return service.patterns.some(pattern => pattern.test(cleanUrl));
}

/**
 * Extrae el ID del archivo de una URL (si el servicio lo soporta).
 * 
 * @param {string} url - URL del servicio
 * @returns {string|null} - ID del archivo o null
 */
export function extractFileId(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const cleanUrl = url.trim();
  const service = detectService(cleanUrl);

  if (!service) {
    return null;
  }

  for (const pattern of service.patterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Obtiene información completa de una URL de descarga.
 * 
 * @param {string} url - URL a analizar
 * @returns {object} - Información de la URL
 */
export function getDownloadInfo(url) {
  const service = detectService(url);
  const isValid = isValidDownloadUrl(url);
  const fileId = extractFileId(url);

  return {
    url: url?.trim() || '',
    isValid,
    service: service ? {
      id: service.id,
      name: service.name,
      icon: service.icon,
    } : null,
    fileId,
    canGenerateDirectLink: service?.generateDownload !== null,
  };
}

/**
 * Genera una URL de descarga directa si el servicio lo soporta.
 * 
 * @param {string} url - URL original
 * @returns {string|null} - URL de descarga directa o null
 */
export function generateDirectDownloadUrl(url) {
  const service = detectService(url);
  
  if (!service || !service.generateDownload) {
    return null;
  }

  // Para servicios que necesitan el ID
  if (service.extractId) {
    const fileId = extractFileId(url);
    if (!fileId) return null;
    return service.generateDownload(fileId);
  }

  // Para servicios que transforman la URL completa (como Dropbox)
  return service.generateDownload(url);
}

// ═══════════════════════════════════════════════════════════════════════════════
//   📝 FUNCIONES DE TEXTO Y UI
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Obtiene el nombre legible del servicio detectado.
 * 
 * @param {string} url - URL del servicio
 * @returns {string} - Nombre del servicio o 'Desconocido'
 */
export function getServiceName(url) {
  const service = detectService(url);
  return service?.name || 'Desconocido';
}

/**
 * Genera un texto descriptivo de los servicios soportados.
 * 
 * @returns {string} - Lista de servicios soportados
 */
export function getSupportedServicesText() {
  return Object.values(SUPPORTED_SERVICES)
    .map(s => s.name)
    .join(', ');
}

/**
 * Obtiene la lista de servicios soportados para mostrar en UI.
 * 
 * @returns {Array} - Array de objetos con id y name
 */
export function getSupportedServicesList() {
  return Object.entries(SUPPORTED_SERVICES).map(([id, service]) => ({
    id,
    name: service.name,
    icon: service.icon,
    domains: service.domains,
  }));
}

export default {
  // Nuevas funciones
  detectService,
  isValidDownloadUrl,
  extractFileId,
  getDownloadInfo,
  generateDirectDownloadUrl,
  getServiceName,
  getSupportedServicesText,
  getSupportedServicesList,
  // Constantes
  SUPPORTED_SERVICES,
  SUPPORTED_DOMAINS,
};
