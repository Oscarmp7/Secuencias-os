/**
 * driveUtils.js
 * 
 * Utilidades para trabajar con URLs de Google Drive.
 * Incluye funciones para extraer IDs, validar URLs y generar
 * enlaces de descarga directa.
 */

/**
 * Patrones de URL de Google Drive soportados:
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * - https://drive.google.com/uc?export=download&id=FILE_ID
 */
const DRIVE_PATTERNS = [
  // Patrón: /file/d/ID/view o /file/d/ID
  /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
  // Patrón: ?id=ID o &id=ID
  /drive\.google\.com\/.*[?&]id=([a-zA-Z0-9_-]+)/,
  // Patrón: /open?id=ID
  /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
  // Patrón: /uc?id=ID o /uc?export=download&id=ID
  /drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/,
];

/**
 * Extrae el ID del archivo de una URL de Google Drive.
 * 
 * @param {string} url - URL de Google Drive
 * @returns {string|null} - ID del archivo o null si no se encuentra
 * 
 * @example
 * extractDriveId('https://drive.google.com/file/d/1abc123/view')
 * // Returns: '1abc123'
 */
export function extractDriveId(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Limpiar espacios en blanco
  const cleanUrl = url.trim();

  // Probar cada patrón
  for (const pattern of DRIVE_PATTERNS) {
    const match = cleanUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Valida si una URL es de Google Drive.
 * 
 * @param {string} url - URL a validar
 * @returns {boolean} - true si es una URL válida de Google Drive
 */
export function isValidDriveUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Verificar que sea una URL de Google Drive
  const cleanUrl = url.trim().toLowerCase();
  if (!cleanUrl.includes('drive.google.com')) {
    return false;
  }

  // Verificar que podamos extraer un ID
  return extractDriveId(url) !== null;
}

/**
 * Genera la URL de descarga directa desde un DriveID.
 * 
 * @param {string} driveId - ID del archivo en Google Drive
 * @returns {string} - URL de descarga directa
 */
export function generateDownloadUrl(driveId) {
  if (!driveId) {
    return '';
  }
  return `https://drive.google.com/uc?export=download&id=${driveId}`;
}

/**
 * Genera la URL de vista previa desde un DriveID.
 * 
 * @param {string} driveId - ID del archivo en Google Drive
 * @returns {string} - URL de vista previa
 */
export function generatePreviewUrl(driveId) {
  if (!driveId) {
    return '';
  }
  return `https://drive.google.com/file/d/${driveId}/view`;
}

/**
 * Convierte cualquier URL de Google Drive a URL de descarga directa.
 * 
 * @param {string} url - URL de Google Drive (cualquier formato)
 * @returns {string|null} - URL de descarga directa o null si la URL no es válida
 */
export function convertToDownloadUrl(url) {
  const driveId = extractDriveId(url);
  if (!driveId) {
    return null;
  }
  return generateDownloadUrl(driveId);
}

export default {
  extractDriveId,
  isValidDriveUrl,
  generateDownloadUrl,
  generatePreviewUrl,
  convertToDownloadUrl,
};
