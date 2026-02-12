/**
 * src/data/index.js
 *
 * Archivo indice para exportar todos los datos de la aplicacion.
 * Para la app publica usamos secuencias-public.json.
 * secuencias.json queda como dataset completo para uso interno.
 */

// Datos de secuencias (publicos)
import secuenciasData from './secuencias-public.json';

// Datos de software y herramientas
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
