/**
 * ContributeFormView.jsx
 * 
 * Formulario para que los usuarios puedan contribuir con recursos
 * (secuencias, software, sugerencias) a la plataforma.
 * 
 * Características:
 * - Validaciones en tiempo real
 * - Soporte para archivos adjuntos (zip, rar hasta 20MB)
 * - Extracción automática de DriveID desde URLs
 * - Control de frecuencia de envío (1 por minuto)
 * - Mensajes de agradecimiento personalizados
 * - Soporte completo para Dark/Light theme
 * - Diseño totalmente responsive
 */

import { memo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Gift,
  Upload,
  Music,
  Package,
  MessageSquare,
  Send,
  X,
  AlertCircle,
  CheckCircle,
  Link,
  FileArchive,
  User,
  Mail,
  Clock,
} from 'lucide-react';
import Swal from 'sweetalert2';

// Utilidades
import { 
  getDownloadInfo, 
  getSupportedServicesText,
} from '../../utils/downloadUtils';
import {
  validateContributeForm,
  validateFile,
  canSubmitForm,
  recordSubmission,
  formatRemainingTime,
  TONALIDAD_OPTIONS,
  COMPAS_OPTIONS,
  APORTE_TYPES,
  SOFTWARE_CATEGORIES,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
} from '../../utils/formValidation';
import { generateXlsxBase64 } from '../../utils/xlsxGenerator';
import {
  sendContributionForm,
  sendThankYouEmail,
  generateThankYouMessage,
} from '../../services/emailService';

// ═══════════════════════════════════════════════════════════════════════════════
//   🎨 ESTILOS BASE (clases reutilizables)
// ═══════════════════════════════════════════════════════════════════════════════

const inputBaseClass = `
  w-full px-4 py-3 rounded-lg
  bg-[var(--input-bg)] border border-[var(--input-border)]
  text-[var(--text)] placeholder-[var(--text-subtle)]
  focus:outline-none focus:border-[var(--input-border-focus)] focus:ring-2 focus:ring-[var(--accent-soft)]
  transition-all duration-200
`;

const labelClass = 'block text-sm font-medium text-[var(--text)] mb-2';
const errorClass = 'text-red-500 text-sm mt-1 flex items-center gap-1';
const cardClass = 'glass-card rounded-xl p-6 transition-all duration-200';

// ═══════════════════════════════════════════════════════════════════════════════
//   📋 COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

const ContributeFormView = memo(function ContributeFormView({ onClose }) {
  const { t: _t } = useTranslation();
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    tipoAporte: '',
    nombreRecurso: '',
    artista: '',
    album: '',
    tonalidad: '',
    bpm: '',
    compas: '',
    subcategoria: '',
    descripcion: '',
    urlDescarga: '',
    archivo: null,
    nombre: '',
    email: '',
    sugerencias: '',
  });

  // Estado de validación y UI
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadInfo, setDownloadInfo] = useState({ isValid: false, service: null, fileId: null });
  const [submitCooldown, setSubmitCooldown] = useState(null);

  // Verificar cooldown al cargar
  useEffect(() => {
    const checkCooldown = () => {
      const { canSubmit, remainingTime } = canSubmitForm();
      if (!canSubmit) {
        setSubmitCooldown(remainingTime);
      }
    };
    checkCooldown();
    
    // Actualizar cada segundo si hay cooldown
    const interval = setInterval(() => {
      const { canSubmit, remainingTime } = canSubmitForm();
      if (canSubmit) {
        setSubmitCooldown(null);
      } else {
        setSubmitCooldown(remainingTime);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Analizar URL de descarga cuando cambia
  useEffect(() => {
    if (formData.urlDescarga) {
      const info = getDownloadInfo(formData.urlDescarga);
      setDownloadInfo(info);
    } else {
      setDownloadInfo({ isValid: false, service: null, fileId: null });
    }
  }, [formData.urlDescarga]);

  // Handler genérico para cambios en inputs
  const handleChange = useCallback((e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      const file = files?.[0] || null;
      setFormData(prev => ({ ...prev, archivo: file }));
      
      // Validar archivo inmediatamente
      if (file) {
        const validation = validateFile(file);
        if (!validation.valid) {
          setErrors(prev => ({ ...prev, archivo: validation.error }));
        } else {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.archivo;
            return newErrors;
          });
        }
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Marcar como tocado
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  // Handler para blur (validación al salir del campo)
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  // Limpiar archivo
  const clearFile = useCallback(() => {
    setFormData(prev => ({ ...prev, archivo: null }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.archivo;
      return newErrors;
    });
  }, []);

  // Enviar formulario
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    // Verificar cooldown
    const { canSubmit, remainingTime } = canSubmitForm();
    if (!canSubmit) {
      Swal.fire({
        icon: 'warning',
        title: 'Espera un momento',
        text: `Por favor espera ${formatRemainingTime(remainingTime)} antes de enviar otro formulario.`,
        confirmButtonColor: 'var(--accent)',
      });
      return;
    }

    // Validar formulario
    const validation = validateContributeForm(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      // Marcar todos los campos con error como tocados
      const newTouched = {};
      Object.keys(validation.errors).forEach(key => {
        newTouched[key] = true;
      });
      setTouched(prev => ({ ...prev, ...newTouched }));
      
      // Mostrar mensaje de error
      Swal.fire({
        icon: 'error',
        title: 'Formulario incompleto',
        text: 'Por favor, completa todos los campos obligatorios.',
        confirmButtonColor: 'var(--accent)',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar datos con información de descarga
      const dataToSend = {
        ...formData,
        downloadInfo: downloadInfo,
        // Mantener driveId por compatibilidad si es Google Drive
        driveId: downloadInfo.service?.id === 'googleDrive' ? downloadInfo.fileId : null,
      };

      // Generar XLSX
      const xlsxBase64 = await generateXlsxBase64(dataToSend);

      // Enviar formulario
      const result = await sendContributionForm(dataToSend, xlsxBase64);

      if (result.success) {
        // Registrar envío exitoso
        recordSubmission();

        // Enviar correo de agradecimiento si hay email
        if (formData.email) {
          await sendThankYouEmail({
            email: formData.email,
            nombre: formData.nombre,
            tipoAporte: formData.tipoAporte,
          });
        }

        // Mostrar mensaje de agradecimiento
        const thankYouMsg = generateThankYouMessage(formData.nombre, formData.tipoAporte);
        
        await Swal.fire({
          icon: 'success',
          title: thankYouMsg.title,
          text: thankYouMsg.message,
          confirmButtonColor: 'var(--accent)',
          confirmButtonText: '¡Entendido!',
        });

        // Cerrar formulario
        if (onClose) {
          onClose();
        }
      } else {
        throw new Error(result.error || 'Error al enviar');
      }
    } catch (error) {
      console.error('Error al enviar formulario:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al enviar',
        text: 'Hubo un problema al enviar tu aporte. Por favor, intenta de nuevo.',
        confirmButtonColor: 'var(--accent)',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, downloadInfo, onClose]);

  // Obtener icono según tipo de aporte
  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'secuencia': return <Music size={20} />;
      case 'software': return <Package size={20} />;
      case 'sugerencia': return <MessageSquare size={20} />;
      default: return <Gift size={20} />;
    }
  };

  return (
    <div className="min-h-full py-8 px-4">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--accent-soft)] mb-4">
          <Gift size={32} className="text-[var(--accent)]" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Aportar Recursos</h1>
        <p className="text-[var(--text-muted)]">
          Comparte secuencias, software o sugerencias con la comunidad
        </p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        
        {/* Tipo de Aporte */}
        <div className={cardClass}>
          <label className={labelClass}>
            ¿Qué tipo de aporte deseas hacer? *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {APORTE_TYPES.map((tipo) => (
              <button
                key={tipo.value}
                type="button"
                onClick={() => handleChange({ target: { name: 'tipoAporte', value: tipo.value } })}
                className={`tipo-aporte-btn ${formData.tipoAporte === tipo.value ? 'selected' : ''}`}
              >
                <span className="icon">
                  {getTipoIcon(tipo.value)}
                </span>
                <span className="label">
                  {tipo.label}
                </span>
              </button>
            ))}
          </div>
          {touched.tipoAporte && errors.tipoAporte && (
            <p className={errorClass}><AlertCircle size={14} /> {errors.tipoAporte}</p>
          )}
        </div>

        {/* Campos para Secuencia */}
        {formData.tipoAporte === 'secuencia' && (
          <div className={cardClass}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Music size={20} className="text-[var(--accent)]" />
              Información de la Secuencia
            </h3>
            
            <div className="space-y-4">
              {/* Nombre del recurso */}
              <div>
                <label htmlFor="nombreRecurso" className={labelClass}>Nombre de la canción *</label>
                <input
                  type="text"
                  id="nombreRecurso"
                  name="nombreRecurso"
                  value={formData.nombreRecurso}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Ej: Reckless Love"
                  className={inputBaseClass}
                />
                {touched.nombreRecurso && errors.nombreRecurso && (
                  <p className={errorClass}><AlertCircle size={14} /> {errors.nombreRecurso}</p>
                )}
              </div>

              {/* Artista y Álbum */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="artista" className={labelClass}>Artista *</label>
                  <input
                    type="text"
                    id="artista"
                    name="artista"
                    value={formData.artista}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Ej: Cory Asbury"
                    className={inputBaseClass}
                  />
                  {touched.artista && errors.artista && (
                    <p className={errorClass}><AlertCircle size={14} /> {errors.artista}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="album" className={labelClass}>Álbum (opcional)</label>
                  <input
                    type="text"
                    id="album"
                    name="album"
                    value={formData.album}
                    onChange={handleChange}
                    placeholder="Ej: Reckless Love"
                    className={inputBaseClass}
                  />
                </div>
              </div>

              {/* Tonalidad, BPM, Compás */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="tonalidad" className={labelClass}>Tonalidad *</label>
                  <select
                    id="tonalidad"
                    name="tonalidad"
                    value={formData.tonalidad}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={inputBaseClass}
                  >
                    <option value="">Seleccionar</option>
                    {TONALIDAD_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {touched.tonalidad && errors.tonalidad && (
                    <p className={errorClass}><AlertCircle size={14} /> {errors.tonalidad}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="bpm" className={labelClass}>Tempo (BPM) *</label>
                  <input
                    type="number"
                    id="bpm"
                    name="bpm"
                    value={formData.bpm}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="120"
                    min="20"
                    max="300"
                    className={inputBaseClass}
                  />
                  {touched.bpm && errors.bpm && (
                    <p className={errorClass}><AlertCircle size={14} /> {errors.bpm}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="compas" className={labelClass}>Compás *</label>
                  <select
                    id="compas"
                    name="compas"
                    value={formData.compas}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={inputBaseClass}
                  >
                    <option value="">Seleccionar</option>
                    {COMPAS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {touched.compas && errors.compas && (
                    <p className={errorClass}><AlertCircle size={14} /> {errors.compas}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Campos para Software */}
        {formData.tipoAporte === 'software' && (
          <div className={cardClass}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package size={20} className="text-[var(--accent)]" />
              Información del Software
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="nombreRecurso" className={labelClass}>Nombre del software *</label>
                <input
                  type="text"
                  id="nombreRecurso"
                  name="nombreRecurso"
                  value={formData.nombreRecurso}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Ej: Kontakt 7"
                  className={inputBaseClass}
                />
                {touched.nombreRecurso && errors.nombreRecurso && (
                  <p className={errorClass}><AlertCircle size={14} /> {errors.nombreRecurso}</p>
                )}
              </div>

              <div>
                <label htmlFor="subcategoria" className={labelClass}>Subcategoría *</label>
                <select
                  id="subcategoria"
                  name="subcategoria"
                  value={formData.subcategoria}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={inputBaseClass}
                >
                  <option value="">Seleccionar categoría</option>
                  {SOFTWARE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                {touched.subcategoria && errors.subcategoria && (
                  <p className={errorClass}><AlertCircle size={14} /> {errors.subcategoria}</p>
                )}
              </div>

              <div>
                <label htmlFor="descripcion" className={labelClass}>Descripción breve *</label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Describe brevemente el software y para qué sirve..."
                  rows="3"
                  className={inputBaseClass}
                />
                {touched.descripcion && errors.descripcion && (
                  <p className={errorClass}><AlertCircle size={14} /> {errors.descripcion}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* URL o Archivo (para secuencia y software) */}
        {(formData.tipoAporte === 'secuencia' || formData.tipoAporte === 'software') && (
          <div className={cardClass}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Upload size={20} className="text-[var(--accent)]" />
              Archivo del Recurso
            </h3>
            
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Proporciona una URL de descarga ({getSupportedServicesText()}) o adjunta un archivo comprimido ({ALLOWED_FILE_TYPES.join(', ')}, máx. {MAX_FILE_SIZE / 1024 / 1024}MB)
            </p>

            <div className="space-y-4">
              {/* URL de descarga */}
              <div>
                <label htmlFor="urlDescarga" className={labelClass}>
                  <Link size={16} className="inline mr-2" />
                  URL de Descarga
                </label>
                <input
                  type="url"
                  id="urlDescarga"
                  name="urlDescarga"
                  value={formData.urlDescarga}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="https://drive.google.com/... o https://mega.nz/..."
                  className={inputBaseClass}
                  disabled={!!formData.archivo}
                />
                {downloadInfo.isValid && downloadInfo.service && (
                  <p className="text-green-500 text-sm mt-1 flex items-center gap-1">
                    <CheckCircle size={14} /> {downloadInfo.service.name} detectado
                    {downloadInfo.fileId && <span className="text-[var(--text-subtle)]"> (ID: {downloadInfo.fileId.substring(0, 12)}...)</span>}
                  </p>
                )}
                {formData.urlDescarga && !downloadInfo.isValid && (
                  <p className={errorClass}>
                    <AlertCircle size={14} /> URL no válida. Servicios soportados: {getSupportedServicesText()}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 border-t border-[var(--border)]"></div>
                <span className="text-[var(--text-subtle)] text-sm">o</span>
                <div className="flex-1 border-t border-[var(--border)]"></div>
              </div>

              {/* Archivo adjunto */}
              <div>
                <label htmlFor="archivo" className={labelClass}>
                  <FileArchive size={16} className="inline mr-2" />
                  Archivo comprimido
                </label>
                {!formData.archivo ? (
                  <label
                    htmlFor="archivo"
                    className={`
                      flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer
                      ${formData.urlDescarga
                        ? 'border-[var(--border)] bg-[var(--surface)] opacity-50 cursor-not-allowed'
                        : 'border-[var(--input-border)] hover:border-[var(--accent)] hover:bg-[var(--hover)]'
                      }
                      transition-all duration-200
                    `}
                  >
                    <Upload size={32} className="text-[var(--text-subtle)] mb-2" />
                    <span className="text-[var(--text-muted)]">
                      Haz clic o arrastra un archivo aquí
                    </span>
                    <span className="text-[var(--text-subtle)] text-sm mt-1">
                      {ALLOWED_FILE_TYPES.join(', ')} (máx. {MAX_FILE_SIZE / 1024 / 1024}MB)
                    </span>
                    <input
                      type="file"
                      id="archivo"
                      name="archivo"
                      onChange={handleChange}
                      accept={ALLOWED_FILE_TYPES.join(',')}
                      className="hidden"
                      disabled={!!formData.urlDescarga}
                    />
                  </label>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
                    <FileArchive size={24} className="text-[var(--accent)]" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{formData.archivo.name}</p>
                      <p className="text-sm text-[var(--text-muted)]">
                        {(formData.archivo.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearFile}
                      className="p-2 hover:bg-[var(--hover)] rounded-lg transition-colors"
                    >
                      <X size={20} className="text-[var(--text-muted)]" />
                    </button>
                  </div>
                )}
                {errors.archivo && (
                  <p className={errorClass}><AlertCircle size={14} /> {errors.archivo}</p>
                )}
              </div>

              {errors.urlOArchivo && (
                <p className={errorClass}><AlertCircle size={14} /> {errors.urlOArchivo}</p>
              )}
            </div>
          </div>
        )}

        {/* Información del Donante - Solo mostrar cuando hay tipo seleccionado */}
        {formData.tipoAporte && (
          <div className={cardClass}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User size={20} className="text-[var(--accent)]" />
              Tu Información (opcional)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="nombre" className={labelClass}>
                <User size={16} className="inline mr-2" />
                Nombre
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Tu nombre"
                className={inputBaseClass}
              />
            </div>
            <div>
              <label htmlFor="email" className={labelClass}>
                <Mail size={16} className="inline mr-2" />
                Correo electrónico
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="tu@email.com"
                className={inputBaseClass}
              />
              {touched.email && errors.email && (
                <p className={errorClass}><AlertCircle size={14} /> {errors.email}</p>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Sugerencias/Comentarios - Solo mostrar cuando hay tipo seleccionado */}
        {formData.tipoAporte && (
          <div className={cardClass}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare size={20} className="text-[var(--accent)]" />
              {formData.tipoAporte === 'sugerencia' ? 'Tu Sugerencia' : 'Comentarios Adicionales'}
              {formData.tipoAporte === 'sugerencia' && ' *'}
            </h3>
          
          <textarea
            id="sugerencias"
            name="sugerencias"
            value={formData.sugerencias}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={
              formData.tipoAporte === 'sugerencia'
                ? 'Escribe tu sugerencia o comentario para el equipo de WorshipBox...'
                : '¿Tienes algo más que agregar? (opcional)'
            }
            rows="5"
            maxLength="1000"
            className={inputBaseClass}
          />
          <div className="flex justify-between mt-1">
            {touched.sugerencias && errors.sugerencias && (
              <p className={errorClass}><AlertCircle size={14} /> {errors.sugerencias}</p>
            )}
            <span className="text-sm text-[var(--text-subtle)] ml-auto">
              {formData.sugerencias.length}/1000
            </span>
          </div>
        </div>
        )}

        {/* Botón de envío - Solo mostrar cuando hay tipo seleccionado */}
        {formData.tipoAporte && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--hover)] transition-all duration-200"
            >
              Cancelar
            </button>
          )}
          
          <button
            type="submit"
            disabled={isSubmitting || submitCooldown}
            className={`
              flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-medium
              transition-all duration-200
              ${isSubmitting || submitCooldown
                ? 'bg-[var(--text-subtle)] cursor-not-allowed'
                : 'bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white'
              }
            `}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando...
              </>
            ) : submitCooldown ? (
              <>
                <Clock size={20} />
                Espera {formatRemainingTime(submitCooldown)}
              </>
            ) : (
              <>
                <Send size={20} />
                Enviar Aporte
              </>
            )}
          </button>
        </div>
        )}
      </form>
    </div>
  );
});

export default ContributeFormView;
