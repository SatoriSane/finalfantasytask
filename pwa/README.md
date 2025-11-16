# Sistema de Instalación PWA

Sistema de notificación inteligente que detecta si la aplicación está instalada como PWA y muestra un banner de instalación personalizado.

## 📋 Características

### ✅ Detección Automática
- **Detecta si la app ya está instalada** (standalone mode, iOS standalone, Android TWA)
- **No muestra el banner** si la app ya está instalada
- **Detecta plataforma iOS** y muestra instrucciones específicas

### 🎨 Banner Personalizado
- **Diseño mobile-first** optimizado para pantallas pequeñas
- **Animaciones suaves** de entrada y salida
- **Responsive** con diferentes layouts según el tamaño de pantalla
- **Gradiente atractivo** con colores de la marca

### 🔘 Funcionalidad
- **Botón "Instalar"** (Android/Chrome) - Usa el prompt nativo del navegador
- **Botón "Ahora no"** - Cierra el banner y guarda la preferencia
- **Instrucciones iOS** - Muestra cómo instalar manualmente en iOS
- **Persistencia inteligente** - No molesta al usuario constantemente

### ⏰ Temporización
- **Aparece después de 2 segundos** de cargar la página
- **Reaparece en CADA recarga** si la app no está instalada
- **Solo se oculta permanentemente** cuando el usuario instala la app
- **No guarda el cierre** - el banner vuelve a aparecer en cada visita

## 🚀 Uso

### Inicialización Automática
El sistema se inicializa automáticamente cuando se carga la página. No requiere configuración adicional.

### API Pública
```javascript
// Mostrar el banner manualmente
window.PWAInstall.showBanner();

// Ocultar el banner
window.PWAInstall.hideBanner();

// Verificar si está instalada
const installed = window.PWAInstall.isInstalled();

// Obtener plataforma detectada
const platform = window.PWAInstall.getPlatform(); // 'ios', 'android', 'desktop', 'generic'

// Obtener navegador detectado
const browser = window.PWAInstall.getBrowser(); // 'chrome', 'firefox', 'safari', 'edge', 'unknown'

// Verificar si hay prompt nativo disponible
const hasPrompt = window.PWAInstall.hasPrompt();

// Resetear sesión (para testing)
window.PWAInstall.resetSession();
```

## 📱 Plataformas Soportadas

### Android / Chrome
- ✅ Botón de instalación automático
- ✅ Usa el prompt nativo del navegador
- ✅ Detección de instalación

### iOS / Safari
- ✅ Instrucciones de instalación manual
- ✅ Detección de modo standalone
- ✅ Banner adaptado sin botón de instalación
- ✅ Icono de compartir en las instrucciones

### Desktop (Windows, Mac, Linux)
- ✅ **Chrome/Edge**: Botón de instalación con prompt nativo
- ⚠️ **Firefox**: Soporte limitado, solo instrucciones manuales
- ✅ Detección automática de navegador
- ✅ Instrucciones específicas por navegador

### Otros Navegadores
- ✅ Detección básica de instalación
- ✅ Banner informativo con instrucciones genéricas
- ✅ Funciona en cualquier navegador moderno

## 🎯 Comportamiento

### Primera Visita
1. Usuario abre la app por primera vez
2. Espera 2 segundos
3. Muestra el banner de instalación

### Usuario Cierra el Banner
1. Banner se oculta temporalmente
2. **Vuelve a aparecer en la próxima recarga**
3. No se guarda el cierre (comportamiento por diseño)

### Usuario Hace Click en "Instalar"
1. Si hay prompt nativo disponible, se muestra
2. Si no hay prompt, se muestran instrucciones específicas de la plataforma
3. Usuario sigue las instrucciones para instalar

### Usuario Instala la App
1. Banner se oculta automáticamente
2. No vuelve a aparecer nunca
3. Detecta instalación en futuras visitas

## 🔧 Configuración

Puedes modificar la configuración en `pwa.js`:

```javascript
const CONFIG = {
    STORAGE_KEY: 'pwa_install_banner_closed',
    BANNER_ID: 'pwaInstallBanner',
    SHOW_DELAY: 2000, // Milisegundos antes de mostrar
    RESHOW_AFTER_CLOSE: false, // false = siempre mostrar en cada recarga
    INSTRUCTIONS: {
        ios: '...', // Instrucciones para iOS
        android: '...', // Instrucciones para Android
        desktop: '...', // Instrucciones para Desktop
        generic: '...' // Instrucciones genéricas
    }
};
```

**Nota:** Si cambias `RESHOW_AFTER_CLOSE` a `true`, el banner solo aparecerá una vez por sesión (se oculta hasta que se cierre el navegador).

## 📦 Archivos

- **pwa.css** - Estilos del banner (mobile-first)
- **pwa.js** - Lógica de detección e instalación
- **README.md** - Esta documentación

## 🎨 Personalización CSS

El banner usa las siguientes clases principales:

- `.pwa-install-banner` - Contenedor principal
- `.pwa-banner-content` - Contenido interno
- `.pwa-banner-icon` - Icono de la app
- `.pwa-banner-text` - Texto del banner
- `.pwa-install-btn` - Botón de instalar
- `.pwa-close-btn` - Botón de cerrar

### Modificar Colores
```css
.pwa-install-banner {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### Modificar Timing
```css
@keyframes slideUpBanner {
    /* Personalizar animación */
}
```

## 🐛 Debugging

### Consola del Navegador
El sistema registra eventos importantes:
- `✅ PWA Install Banner initialized`
- `📱 beforeinstallprompt event fired`
- `✅ PWA installed successfully`
- `⚠️ No hay prompt de instalación disponible`

### Testing
```javascript
// Resetear el banner para testing
window.PWAInstall.resetDismissal();

// Forzar mostrar el banner
window.PWAInstall.showBanner();

// Verificar estado de instalación
console.log(window.PWAInstall.isInstalled());
```

## ⚠️ Notas Importantes

1. **Service Worker Requerido**: La app debe tener un service worker registrado
2. **HTTPS Requerido**: PWAs solo funcionan en HTTPS (excepto localhost)
3. **Manifest Requerido**: Debe existir un archivo `manifest.json` válido
4. **iOS Limitaciones**: iOS no soporta el prompt automático de instalación

## 🔄 Actualizaciones Futuras

Posibles mejoras:
- [ ] Estadísticas de instalación
- [ ] A/B testing de mensajes
- [ ] Personalización por idioma
- [ ] Integración con analytics
- [ ] Notificaciones de actualización
