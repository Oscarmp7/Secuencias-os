/**
 * xlsxGenerator.js
 * 
 * Utilidad para generar archivos XLSX desde los datos del formulario.
 * Utiliza la librería xlsx (SheetJS) para crear el archivo en el navegador.
 */

import * as XLSX from 'xlsx';

/**
 * Genera un archivo XLSX desde los datos del formulario de contribución.
 * 
 * @param {Object} formData - Datos del formulario
 * @returns {Blob} - Archivo XLSX como Blob
 */
export function generateXlsxFromForm(formData) {
  // Crear workbook
  const wb = XLSX.utils.book_new();

  // Preparar datos según el tipo de aporte
  let sheetData = [];
  let sheetName = 'Aporte';

  if (formData.tipoAporte === 'secuencia') {
    sheetName = 'Secuencia';
    sheetData = [
      ['Campo', 'Valor'],
      ['Tipo de Aporte', 'Secuencia / Multitrack'],
      ['Nombre del Recurso', formData.nombreRecurso || ''],
      ['Artista', formData.artista || ''],
      ['Álbum', formData.album || ''],
      ['Tonalidad', formData.tonalidad || ''],
      ['BPM', formData.bpm || ''],
      ['Compás', formData.compas || ''],
      ['URL de Descarga', formData.urlDescarga || ''],
      ['Drive ID', formData.driveId || ''],
      ['Archivo Adjunto', formData.archivo?.name || 'No'],
      ['Nombre del Donante', formData.nombre || 'Anónimo'],
      ['Correo Electrónico', formData.email || ''],
      ['Comentarios', formData.sugerencias || ''],
      ['Fecha de Envío', new Date().toLocaleString('es-ES')],
    ];
  } else if (formData.tipoAporte === 'software') {
    sheetName = 'Software';
    sheetData = [
      ['Campo', 'Valor'],
      ['Tipo de Aporte', 'Software / Herramienta'],
      ['Nombre del Software', formData.nombreRecurso || ''],
      ['Subcategoría', formData.subcategoria || ''],
      ['Descripción', formData.descripcion || ''],
      ['URL de Descarga', formData.urlDescarga || ''],
      ['Drive ID', formData.driveId || ''],
      ['Archivo Adjunto', formData.archivo?.name || 'No'],
      ['Nombre del Donante', formData.nombre || 'Anónimo'],
      ['Correo Electrónico', formData.email || ''],
      ['Comentarios', formData.sugerencias || ''],
      ['Fecha de Envío', new Date().toLocaleString('es-ES')],
    ];
  } else if (formData.tipoAporte === 'sugerencia') {
    sheetName = 'Sugerencia';
    sheetData = [
      ['Campo', 'Valor'],
      ['Tipo de Aporte', 'Sugerencia / Comentario'],
      ['Nombre', formData.nombre || 'Anónimo'],
      ['Correo Electrónico', formData.email || ''],
      ['Sugerencia', formData.sugerencias || ''],
      ['Fecha de Envío', new Date().toLocaleString('es-ES')],
    ];
  }

  // Crear hoja de cálculo
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Ajustar ancho de columnas
  ws['!cols'] = [
    { wch: 20 }, // Columna A
    { wch: 50 }, // Columna B
  ];

  // Agregar hoja al workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Generar archivo como Blob
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  return blob;
}

/**
 * Descarga el archivo XLSX generado.
 * 
 * @param {Object} formData - Datos del formulario
 * @param {string} fileName - Nombre del archivo (opcional)
 */
export function downloadXlsx(formData, fileName) {
  const blob = generateXlsxFromForm(formData);
  const finalFileName = fileName || `aporte-${formData.tipoAporte}-${Date.now()}.xlsx`;

  // Crear enlace de descarga
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convierte el archivo XLSX a Base64 para envío por email.
 * 
 * @param {Object} formData - Datos del formulario
 * @returns {Promise<string>} - Archivo en Base64
 */
export async function generateXlsxBase64(formData) {
  const blob = generateXlsxFromForm(formData);
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Extraer solo la parte base64 (sin el prefijo data:...)
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default {
  generateXlsxFromForm,
  downloadXlsx,
  generateXlsxBase64,
};
