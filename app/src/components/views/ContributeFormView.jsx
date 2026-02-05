/**
 * ContributeFormView.jsx
 * 
 * Formulario para que los usuarios puedan contribuir con recursos
 * (secuencias, software, sugerencias) a la plataforma.
 * 
 * Características:
 * - Validaciones en tiempo real
 * - URL de descarga obligatoria (Google Drive, MEGA, TeraBox, etc.)
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
  AlertCircle,
  CheckCircle,
  Link,
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
  canSubmitForm,
  recordSubmission,
  formatRemainingTime,
  TONALIDAD_OPTIONS,
  COMPAS_OPTIONS,
  APORTE_TYPES,
  SOFTWARE_CATEGORIES,
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
  const { t } = useTranslation();
  
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
    nombre: '',
    email: '',
    sugerencias: '',
    website: '',
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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Marcar como tocado
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  // Handler para blur (validación al salir del campo)
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  // Enviar formulario
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    // Verificar cooldown
    const { canSubmit, remainingTime } = canSubmitForm();
    if (!canSubmit) {
      Swal.fire({
        icon: 'warning',
        title: t('contribute.errors.formIncomplete'),
        text: t('contribute.errors.waitToSubmit', { time: formatRemainingTime(remainingTime) }),
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
        title: t('contribute.errors.formIncomplete'),
        text: t('contribute.errors.completeRequired'),
        confirmButtonColor: 'var(--accent)',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar datos con información de descarga
      const { website, ...cleanData } = formData;
      const dataToSend = {
        ...cleanData,
        downloadInfo,
        // Mantener driveId por compatibilidad si es Google Drive
        driveId: downloadInfo.service?.id === 'googleDrive' ? downloadInfo.fileId : null,
        submittedAt: new Date().toISOString(),
        pageUrl: window.location?.href || '',
        userAgent: navigator?.userAgent || '',
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

        // Mapear tipo de aporte a clave de traducción
        const tipoKey = {
          secuencia: 'sequence',
          software: 'software',
          sugerencia: 'suggestion',
        }[formData.tipoAporte] || 'contribution';

        // Mostrar mensaje de agradecimiento con opción de hacer otro aporte
        const successTitle = formData.nombre 
          ? `${t('contribute.success.title').replace('!', '')}, ${formData.nombre}!`
          : t('contribute.success.title');
        
        const result = await Swal.fire({
          icon: 'success',
          title: successTitle,
          text: t('contribute.success.message', { type: t(`contribute.type${tipoKey.charAt(0).toUpperCase() + tipoKey.slice(1)}`) }),
          showCancelButton: true,
          confirmButtonColor: 'var(--accent)',
          cancelButtonColor: 'var(--accent-secondary)',
          confirmButtonText: `✓ ${t('actions.submit')}`,
          cancelButtonText: `🎁 ${t('contribute.title')}`,
          reverseButtons: true,
        });

        // Si el usuario quiere hacer otro aporte, resetear el formulario
        if (result.dismiss === Swal.DismissReason.cancel) {
          // Resetear formulario pero mantener nombre y email
          setFormData(prev => ({
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
            nombre: prev.nombre,
            email: prev.email,
            sugerencias: '',
            website: '',
          }));
          setErrors({});
          setTouched({});
          setDownloadInfo({ isValid: false, service: null, fileId: null });
          // Scroll al inicio del formulario
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          // Cerrar formulario
          if (onClose) {
            onClose();
          }
        }
      } else {
        throw new Error(result.error || 'Error al enviar');
      }
    } catch (error) {
      console.error('Error al enviar formulario:', error);
      Swal.fire({
        icon: 'error',
        title: t('contribute.errors.formIncomplete'),
        text: t('contribute.errors.submitError'),
        confirmButtonColor: 'var(--accent)',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, downloadInfo, onClose, t]);

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
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{t('contribute.title')}</h1>
        <p className="text-[var(--text-muted)]">
          {t('contribute.subtitle')}
        </p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        {/* Honeypot anti-spam (debe permanecer vacío) */}
        <input
          type="text"
          name="website"
          value={formData.website}
          onChange={handleChange}
          autoComplete="off"
          tabIndex="-1"
          aria-hidden="true"
          className="hidden"
        />
        
        {/* Tipo de Aporte */}
        <div className={cardClass}>
          <label className={labelClass}>
            {t('contribute.typeQuestion')} *
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
                  {tipo.value === 'secuencia' ? t('contribute.typeSequence') :
                   tipo.value === 'software' ? t('contribute.typeSoftware') :
                   t('contribute.typeSuggestion')}
                </span>
              </button>
            ))}
          </div>
          {touched.tipoAporte && errors.tipoAporte && (
            <p className={errorClass}><AlertCircle size={14} /> {t('contribute.errors.selectType')}</p>
          )}
        </div>

        {/* Campos para Secuencia */}
        {formData.tipoAporte === 'secuencia' && (
          <div className={cardClass}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Music size={20} className="text-[var(--accent)]" />
              {t('contribute.sequenceInfo')}
            </h3>
            
            <div className="space-y-4">
              {/* Nombre del recurso */}
              <div>
                <label htmlFor="nombreRecurso" className={labelClass}>{t('contribute.songName')} *</label>
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
                  <p className={errorClass}><AlertCircle size={14} /> {t('contribute.errors.resourceNameRequired')}</p>
                )}
              </div>

              {/* Artista y Álbum */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="artista" className={labelClass}>{t('contribute.artist')} *</label>
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
                    <p className={errorClass}><AlertCircle size={14} /> {t('contribute.errors.artistRequired')}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="album" className={labelClass}>{t('contribute.album')} *</label>
                  <input
                    type="text"
                    id="album"
                    name="album"
                    value={formData.album}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Ej: Reckless Love"
                    className={inputBaseClass}
                  />
                  {touched.album && errors.album && (
                    <p className={errorClass}><AlertCircle size={14} /> {t('contribute.errors.albumRequired')}</p>
                  )}
                </div>
              </div>

              {/* Tonalidad, BPM, Compás */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="tonalidad" className={labelClass}>{t('contribute.key')} *</label>
                  <select
                    id="tonalidad"
                    name="tonalidad"
                    value={formData.tonalidad}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={inputBaseClass}
                  >
                    <option value="">{t('contribute.select')}</option>
                    {TONALIDAD_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {touched.tonalidad && errors.tonalidad && (
                    <p className={errorClass}><AlertCircle size={14} /> {t('contribute.errors.keyRequired')}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="bpm" className={labelClass}>{t('contribute.tempo')} *</label>
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
                    <p className={errorClass}><AlertCircle size={14} /> {t('contribute.errors.bpmRange')}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="compas" className={labelClass}>{t('contribute.timeSignature')} *</label>
                  <select
                    id="compas"
                    name="compas"
                    value={formData.compas}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={inputBaseClass}
                  >
                    <option value="">{t('contribute.select')}</option>
                    {COMPAS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {touched.compas && errors.compas && (
                    <p className={errorClass}><AlertCircle size={14} /> {t('contribute.errors.timeSignatureRequired')}</p>
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
              {t('contribute.softwareInfo')}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="nombreRecurso" className={labelClass}>{t('contribute.softwareName')} *</label>
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
                  <p className={errorClass}><AlertCircle size={14} /> {t('contribute.errors.resourceNameRequired')}</p>
                )}
              </div>

              <div>
                <label htmlFor="subcategoria" className={labelClass}>{t('contribute.subcategory')} *</label>
                <select
                  id="subcategoria"
                  name="subcategoria"
                  value={formData.subcategoria}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={inputBaseClass}
                >
                  <option value="">{t('contribute.selectCategory')}</option>
                  {SOFTWARE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                {touched.subcategoria && errors.subcategoria && (
                  <p className={errorClass}><AlertCircle size={14} /> {t('contribute.errors.subcategoryRequired')}</p>
                )}
              </div>

              <div>
                <label htmlFor="descripcion" className={labelClass}>{t('contribute.description')} *</label>
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
                  <p className={errorClass}><AlertCircle size={14} /> {t('contribute.errors.descriptionRequired')}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* URL de Descarga (para secuencia y software) */}
        {(formData.tipoAporte === 'secuencia' || formData.tipoAporte === 'software') && (
          <div className={cardClass}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Upload size={20} className="text-[var(--accent)]" />
              {t('contribute.resourceFile')}
            </h3>
            
            <p className="text-sm text-[var(--text-muted)] mb-4">
              {t('contribute.resourceFileHint')} ({getSupportedServicesText()})
            </p>

            <div className="space-y-4">
              {/* URL de descarga */}
              <div>
                <label htmlFor="urlDescarga" className={labelClass}>
                  <Link size={16} className="inline mr-2" />
                  {t('contribute.downloadUrl')}
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
                />
                {downloadInfo.isValid && downloadInfo.service && (
                  <p className="text-green-500 text-sm mt-1 flex items-center gap-1">
                    <CheckCircle size={14} /> {downloadInfo.service.name} {t('contribute.detected')}
                    {downloadInfo.fileId && <span className="text-[var(--text-subtle)]"> (ID: {downloadInfo.fileId.substring(0, 12)}...)</span>}
                  </p>
                )}
                {formData.urlDescarga && !downloadInfo.isValid && (
                  <p className={errorClass}>
                    <AlertCircle size={14} /> {t('contribute.invalidUrl')} {getSupportedServicesText()}
                  </p>
                )}
                {touched.urlDescarga && errors.urlDescarga && !formData.urlDescarga && (
                  <p className={errorClass}><AlertCircle size={14} /> {t('contribute.errors.urlRequired')}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Información del Donante - Solo mostrar cuando hay tipo seleccionado */}
        {formData.tipoAporte && (
          <div className={cardClass}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User size={20} className="text-[var(--accent)]" />
              {t('contribute.yourInfo')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="nombre" className={labelClass}>
                <User size={16} className="inline mr-2" />
                {t('contribute.name')}
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
                {t('contribute.email')}
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
                <p className={errorClass}><AlertCircle size={14} /> {t('contribute.errors.invalidEmail')}</p>
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
              {formData.tipoAporte === 'sugerencia' ? t('contribute.yourSuggestion') : t('contribute.comments')}
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
              <p className={errorClass}><AlertCircle size={14} /> {t('contribute.errors.suggestionRequired')}</p>
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
              {t('actions.cancel')}
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
                {t('actions.sending')}
              </>
            ) : submitCooldown ? (
              <>
                <Clock size={20} />
                {t('contribute.waitMessage', { time: formatRemainingTime(submitCooldown) })}
              </>
            ) : (
              <>
                <Send size={20} />
                {t('contribute.submitButton')}
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
