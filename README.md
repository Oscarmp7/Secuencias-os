# 🎵 Secuencias OS

<div align="center">

![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Tu biblioteca de secuencias y charts musicales**

[Demo en Vivo](https://oscarmp7.github.io/Secuencias-os/) · [Reportar Bug](../../issues) · [Solicitar Feature](../../issues)

</div>

---

## 📖 Descripción

**Secuencias OS** es una aplicación web moderna que permite explorar y descargar secuencias musicales y charts de una extensa biblioteca. Diseñada con una interfaz elegante estilo Spotify, ofrece una experiencia de usuario fluida tanto en desktop como en dispositivos móviles.

### ✨ Características

- 🎤 **772 Artistas** con su catálogo completo
- 💿 **2,154 Álbumes** organizados por artista
- 🎶 **6,289 Secuencias** disponibles para descarga
- 📄 **9,787 Charts** en formato PDF
- 🔍 **Búsqueda en tiempo real** por artista, álbum o canción
- 📱 **Diseño 100% responsive** optimizado para móviles
- 🌙 **Tema oscuro** elegante y moderno
- ⚡ **Rendimiento optimizado** con carga instantánea

---

## 🚀 Inicio Rápido

### Prerrequisitos

- [Node.js](https://nodejs.org/) v18 o superior
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/secuencias-os.git

# Entrar al directorio
cd secuencias-os

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### Build para Producción

```bash
# Generar build optimizado
npm run build

# Previsualizar build
npm run preview
```

---

## 🛠️ Stack Tecnológico

| Tecnología | Propósito |
|------------|-----------|
| **React 19** | Biblioteca UI con hooks modernos |
| **Vite 7** | Bundler ultrarrápido con HMR |
| **Tailwind CSS 3** | Framework CSS utility-first |
| **Lucide React** | Iconos SVG elegantes |
| **ESLint** | Linting y calidad de código |

---

## 📁 Estructura del Proyecto

```
secuencias-os/
├── public/
│   └── data.json          # Base de datos de artistas, álbumes y canciones
├── src/
│   ├── App.jsx            # Componente principal (documentado para principiantes)
│   ├── App.css            # Estilos específicos del componente
│   ├── index.css          # Estilos globales y animaciones
│   └── main.jsx           # Punto de entrada de React
├── index.html             # Template HTML
├── tailwind.config.js     # Configuración de Tailwind
├── vite.config.js         # Configuración de Vite
└── package.json           # Dependencias y scripts
```

---

## 📚 Documentación del Código

El código fuente está **extensivamente documentado** con comentarios explicativos diseñados para desarrolladores principiantes en React. Cada concepto importante está explicado:

- ✅ Hooks de React (`useState`, `useMemo`, `useEffect`)
- ✅ Renderizado condicional
- ✅ Manejo de eventos
- ✅ Clases de Tailwind CSS
- ✅ Patrones de diseño responsive
- ✅ Optimización de rendimiento

---

## 📱 Responsive Design

La aplicación implementa un diseño completamente responsive:

| Breakpoint | Comportamiento |
|------------|----------------|
| `< 768px` | Sidebar como overlay deslizante, botones compactos |
| `≥ 768px` | Sidebar fijo lateral, interfaz completa |
| `≥ 1024px` | Layout optimizado para pantallas grandes |

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Para cambios importantes:

1. Haz fork del repositorio
2. Crea una rama (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m 'Añadir nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

---

## 📄 Licencia

Distribuido bajo la licencia MIT. Ver `LICENSE` para más información.

---

## 👨‍💻 Autor

Desarrollado con ❤️ para la comunidad musical

---

<div align="center">

**⭐ Si este proyecto te fue útil, considera darle una estrella ⭐**

</div>
