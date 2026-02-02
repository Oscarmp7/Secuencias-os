# 📁 Estructura de Google Drive para Worship Box

Esta guía te ayudará a organizar tu nuevo Google Drive de manera que sea compatible con el flujo de trabajo de Worship Box.

---

## 🎯 Estructura Recomendada

```
📁 Worship Box
│
├── 📁 Secuencias/
│   ├── 📁 A/
│   │   ├── 📁 Aaron Shust/
│   │   │   ├── 📁 Anything Worth Saying (2005)/
│   │   │   │   ├── 🎵 My Savior My God.zip
│   │   │   │   ├── 🎵 Change The Way.zip
│   │   │   │   └── ...
│   │   │   ├── 📁 Remix Worship Vol. 1 (2010)/
│   │   │   └── ...
│   │   ├── 📁 Abba Padre/
│   │   └── ...
│   ├── 📁 B/
│   │   ├── 📁 Bethel Music/
│   │   │   ├── 📁 You Make Me Brave (2014)/
│   │   │   └── ...
│   │   └── ...
│   ├── 📁 C/
│   └── ... (A-Z)
│
├── 📁 Charts/
│   ├── 📁 A/
│   │   ├── 📁 Aaron Shust/
│   │   │   ├── 📄 My Savior My God - G.pdf
│   │   │   ├── 📄 My Savior My God - A.pdf
│   │   │   └── ...
│   │   └── ...
│   ├── 📁 B/
│   └── ... (A-Z)
│
├── 📁 Por Procesar/
│   ├── 📁 Secuencias Nuevas/
│   │   └── (archivos pendientes de organizar)
│   └── 📁 Charts Nuevos/
│       └── (archivos pendientes de organizar)
│
├── 📁 Backups/
│   ├── 📁 2025/
│   │   ├── data-backup-2025-01-15.json
│   │   └── ...
│   └── ...
│
└── 📁 Recursos/
    ├── 📁 Logos/
    ├── 📁 Documentación/
    └── 📁 Templates/
```

---

## 📝 Convenciones de Nomenclatura

### Para Carpetas de Artistas
```
{Nombre del Artista}/
```
- Usa el nombre oficial del artista
- Primera letra mayúscula para cada palabra
- Ejemplo: `Hillsong United`, `Marcos Witt`, `Elevation Worship`

### Para Carpetas de Álbumes
```
{Nombre del Álbum} ({Año})/
```
- Incluye el año entre paréntesis
- Ejemplo: `Oceans EP (2013)`, `God Is Able (2011)`

### Para Archivos de Secuencias
```
{Nombre de la Canción}.zip
```
- Si hay múltiples tonalidades:
  - `Oceans - G.zip`
  - `Oceans - Bb.zip`
- Si hay múltiples BPM:
  - `Way Maker - 68bpm.zip`
  - `Way Maker - 72bpm.zip`

### Para Archivos de Charts
```
{Nombre de la Canción} - {Tonalidad}.pdf
```
- Ejemplo: `Reckless Love - Bb.pdf`
- Para charts con múltiples páginas: `How Great Is Our God - G (Completo).pdf`

---

## 🔄 Flujo de Trabajo para Agregar Contenido

### Método 1: Agregar Secuencias Individuales

1. **Sube el archivo** a la carpeta correspondiente en Google Drive:
   ```
   Secuencias/{Letra}/{Artista}/{Album}/ → archivo.zip
   ```

2. **Obtén el DriveID** del archivo:
   - Click derecho → "Obtener enlace"
   - El enlace será algo como: `https://drive.google.com/file/d/1ABC123xyz/view`
   - El DriveID es: `1ABC123xyz`

3. **Abre el Excel** (`app/data/worship-box-data.xlsx`)

4. **Agrega una nueva fila** en la hoja "Secuencias":
   | Accion | Artista | Album | Cancion | DriveID |
   |--------|---------|-------|---------|---------|
   | Agregar | Hillsong | Oceans EP | Oceans | 1ABC123xyz |

5. **Ejecuta el importador**:
   ```bash
   cd app
   node tools/data-manager.cjs --import
   ```

### Método 2: Agregar Múltiples Archivos

1. **Sube todos los archivos** organizados en carpetas

2. **Ejecuta el script de extracción** (extract-data.cjs) para generar IDs

3. **Edita el Excel** marcando solo los nuevos con "Agregar"

4. **Importa los cambios**

---

## 🔗 Configuración de Permisos de Google Drive

Para que los usuarios puedan descargar, configura los permisos así:

### Opción A: Carpeta Pública (Recomendada)
1. Click derecho en la carpeta "Secuencias" → "Compartir"
2. Selecciona "Cualquier persona con el enlace"
3. Permisos: "Lector"
4. Repite para "Charts"

### Opción B: Por Archivo (Más Control)
- Cada archivo debe tener permiso de "Lector" para "Cualquier persona con el enlace"

---

## 🏷️ Sistema de Tonalidades

Usa estas abreviaturas consistentes:

| Tonalidad | Abreviatura |
|-----------|-------------|
| Do Mayor | C |
| Do# Mayor | C# |
| Re Mayor | D |
| Re# Mayor | D# / Eb |
| Mi Mayor | E |
| Fa Mayor | F |
| Fa# Mayor | F# |
| Sol Mayor | G |
| Sol# Mayor | G# / Ab |
| La Mayor | A |
| La# Mayor | A# / Bb |
| Si Mayor | B |

Para tonalidades menores, agrega "m": `Am`, `Dm`, `Em`, etc.

---

## 📊 Campos del Sistema

### Campos para Secuencias

| Campo | Descripción | Ejemplo | Obligatorio |
|-------|-------------|---------|-------------|
| Artista | Nombre del artista | "Hillsong United" | ✅ |
| Album | Nombre del álbum | "Oceans EP" | ✅ |
| Cancion | Nombre de la canción | "Oceans" | ✅ |
| DriveID | ID del archivo en Drive | "1ABC123xyz" | ✅ |
| Compas | Compás musical | "4/4" | ❌ |
| BPM | Beats por minuto | 68 | ❌ |
| Tonalidad | Tonalidad de la secuencia | "G" | ❌ |
| Duracion | Duración de la canción | "8:45" | ❌ |
| TipoSecuencia | Tipo de archivo | "Original" | ❌ |
| Comentarios | Notas adicionales | "Versión acústica" | ❌ |

### Campos para Charts

| Campo | Descripción | Ejemplo | Obligatorio |
|-------|-------------|---------|-------------|
| Artista | Nombre del artista | "Elevation Worship" | ✅ |
| Chart | Nombre del chart | "Graves Into Gardens" | ✅ |
| DriveID | ID del archivo en Drive | "1DEF456abc" | ✅ |
| Tonalidad | Tonalidad del chart | "Bb" | ❌ |
| Compas | Compás musical | "4/4" | ❌ |
| Comentarios | Notas adicionales | "Con acordes de piano" | ❌ |

---

## ⚠️ Acciones del Excel

| Acción | Efecto |
|--------|--------|
| *(vacío)* | No hace nada, mantiene el registro actual |
| `Agregar` | Agrega el registro si no existe |
| `Eliminar` | Elimina el registro del data.json |
| `Principal` | Marca como versión principal y elimina variantes |

---

## 🔧 Comandos del Gestor de Datos

```bash
# Navegar a la carpeta
cd app

# Instalar dependencia (solo la primera vez)
npm install xlsx

# Menú interactivo
node tools/data-manager.cjs

# Comandos directos
node tools/data-manager.cjs --export        # Exportar a Excel
node tools/data-manager.cjs --import        # Importar desde Excel
node tools/data-manager.cjs --add-fields    # Agregar campos nuevos
node tools/data-manager.cjs --find-duplicates  # Buscar duplicados
```

---

## 💡 Tips y Mejores Prácticas

1. **Siempre haz backup antes de importar**
   - El sistema lo hace automáticamente, pero puedes hacer uno manual

2. **Organiza antes de subir**
   - Renombra archivos correctamente antes de subirlos a Drive
   - Usa la estructura de carpetas desde el inicio

3. **Verifica los enlaces**
   - Después de agregar archivos, prueba que se puedan descargar
   - Usa el script `check-links.cjs` para verificar

4. **Mantén un registro**
   - Usa la carpeta "Por Procesar" para archivos pendientes
   - Mueve a la ubicación final solo cuando estén listos

5. **Nomenclatura consistente**
   - Decide un formato y mantenlo
   - Revisa duplicados periódicamente

---

## 📁 Crear la Estructura Inicial

### En Google Drive:

1. Crea la carpeta raíz: `Worship Box`
2. Dentro, crea las subcarpetas principales:
   - `Secuencias`
   - `Charts`
   - `Por Procesar`
   - `Backups`
   - `Recursos`

3. Dentro de `Secuencias` y `Charts`, crea carpetas A-Z:
   ```
   A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z
   ```

4. Comparte `Secuencias` y `Charts` con permiso de "Lector" para cualquier persona con el enlace

---

## 📞 ¿Necesitas Ayuda?

Si tienes problemas:
1. Revisa que los permisos de Drive estén correctos
2. Verifica que el DriveID sea correcto
3. Asegúrate de que xlsx esté instalado (`npm install xlsx`)
4. Revisa el reporte de errores después de importar
