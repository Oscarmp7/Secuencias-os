/**
 * src/data/index.js
 * 
 * Archivo índice para exportar todos los datos de la aplicación.
 * Centraliza las importaciones de los diferentes JSON de datos
 * para facilitar su uso en el resto de la app.
 */

// Importar datos de secuencias (artistas, álbumes, canciones)
import secuenciasData from './secuencias.json';

// Importar datos de software y herramientas
import softwareData from './software.json';

// Exportar datos de secuencias
export const secuencias = secuenciasData;
export const artists = secuenciasData.artists || [];
export const charts = secuenciasData.charts || [];
export const secuenciasStats = secuenciasData.stats || {};

// Exportar datos de software
export const software = softwareData;
export const softwareCategories = softwareData.categories || [];
export const softwareStats = softwareData.stats || {};

// Exportar todo como objeto por defecto
export default {
  secuencias: secuenciasData,
  software: softwareData,
};
