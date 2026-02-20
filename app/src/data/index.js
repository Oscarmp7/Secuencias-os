/**
 * src/data/index.js
 *
 * Archivo indice para exportar todos los datos de la aplicacion.
 * La app usa secuencias.json como fuente principal.
 */

// Datos de secuencias
import secuenciasData from './secuencias.json';

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

