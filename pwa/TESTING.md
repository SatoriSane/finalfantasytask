# Guía de Testing - Sistema PWA

## 🧪 Cómo Probar el Banner de Instalación

### Opción 1: Testing en Navegador Desktop (Chrome/Edge)

1. **Abrir Chrome DevTools**
   - Presiona `F12` o `Ctrl+Shift+I` (Windows/Linux)
   - Presiona `Cmd+Option+I` (Mac)

2. **Activar Modo Responsive**
   - Presiona `Ctrl+Shift+M` (Windows/Linux) o `Cmd+Shift+M` (Mac)
   - O haz click en el icono de dispositivo móvil en DevTools

3. **Simular Dispositivo Móvil**
   - Selecciona un dispositivo móvil del dropdown (ej: iPhone 12, Pixel 5)
   - O configura dimensiones personalizadas (ej: 375x667)

4. **Limpiar Estado (Primera Vez)**
   ```javascript
   // En la consola de DevTools:
   localStorage.removeItem('pwa_install_banner_dismissed');
   location.reload();
   ```

5. **Observar el Banner**
   - Después de 2 segundos, debe aparecer el banner en la parte inferior
   - Debe tener animación de deslizamiento hacia arriba

### Opción 2: Testing en Dispositivo Móvil Real

#### Android (Chrome)

1. **Acceder a la App**
   - Abre Chrome en tu dispositivo Android
   - Navega a la URL de tu app (debe ser HTTPS o localhost)

2. **Verificar Requisitos**
   - La app debe estar servida por HTTPS
   - Debe tener un Service Worker registrado
   - Debe tener un manifest.json válido

3. **Ver el Banner**
   - Espera 2 segundos después de cargar
   - Debe aparecer el banner con el botón "Instalar"

4. **Probar Instalación**
   - Haz click en "Instalar"
   - Debe aparecer el prompt nativo de Android
   - Acepta la instalación
   - El banner debe desaparecer

#### iOS (Safari)

1. **Acceder a la App**
   - Abre Safari en tu iPhone/iPad
   - Navega a la URL de tu app

2. **Ver el Banner**
   - Espera 2 segundos después de cargar
   - Debe aparecer el banner con instrucciones de iOS
   - NO debe tener botón "Instalar" (iOS no lo soporta)

3. **Seguir Instrucciones**
   - Toca el botón de compartir (⎋)
   - Selecciona "Añadir a pantalla de inicio"
   - Confirma la instalación

## 🔍 Escenarios de Prueba

### Escenario 1: Primera Visita
**Esperado:**
- ✅ Banner aparece después de 2 segundos
- ✅ Animación de entrada suave
- ✅ Botones funcionan correctamente

**Verificar:**
```javascript
// En consola:
console.log(window.PWAInstall.isInstalled()); // false
```

### Escenario 2: Cerrar Banner
**Pasos:**
1. Espera a que aparezca el banner
2. Haz click en "Ahora no"

**Esperado:**
- ✅ Banner desaparece con animación
- ✅ Se guarda en localStorage
- ✅ No aparece al recargar la página

**Verificar:**
```javascript
// En consola:
localStorage.getItem('pwa_install_banner_dismissed'); // Debe tener un timestamp
```

### Escenario 3: Instalar App (Android)
**Pasos:**
1. Espera a que aparezca el banner
2. Haz click en "Instalar"
3. Acepta el prompt nativo

**Esperado:**
- ✅ Prompt nativo aparece
- ✅ Banner desaparece después de instalar
- ✅ App se instala en el dispositivo

**Verificar:**
```javascript
// Después de instalar, recargar y verificar:
console.log(window.PWAInstall.isInstalled()); // true
```

### Escenario 4: App Ya Instalada
**Pasos:**
1. Instala la app
2. Abre la app desde el icono instalado

**Esperado:**
- ✅ Banner NO aparece
- ✅ Consola muestra "PWA ya instalada"

**Verificar:**
```javascript
// En consola:
console.log(window.matchMedia('(display-mode: standalone)').matches); // true
```

### Escenario 5: Reaparición Después de 7 Días
**Pasos:**
1. Cierra el banner
2. Modifica el timestamp en localStorage

```javascript
// Simular que pasaron 8 días:
const eightDaysAgo = Date.now() - (8 * 24 * 60 * 60 * 1000);
localStorage.setItem('pwa_install_banner_dismissed', eightDaysAgo.toString());
location.reload();
```

**Esperado:**
- ✅ Banner aparece de nuevo

## 🛠️ Comandos Útiles para Testing

### Resetear Todo
```javascript
// Limpiar localStorage y recargar
window.PWAInstall.resetDismissal();
location.reload();
```

### Forzar Mostrar Banner
```javascript
// Mostrar banner manualmente
window.PWAInstall.showBanner();
```

### Verificar Estado
```javascript
// Ver si está instalada
console.log('Instalada:', window.PWAInstall.isInstalled());

// Ver si hay prompt disponible
console.log('Prompt disponible:', !!window.deferredPrompt);

// Ver display mode
console.log('Display mode:', window.matchMedia('(display-mode: standalone)').matches);
```

### Simular Diferentes Tiempos
```javascript
// Simular que se cerró hace 1 día
const oneDayAgo = Date.now() - (1 * 24 * 60 * 60 * 1000);
localStorage.setItem('pwa_install_banner_dismissed', oneDayAgo.toString());

// Simular que se cerró hace 8 días (debe reaparecer)
const eightDaysAgo = Date.now() - (8 * 24 * 60 * 60 * 1000);
localStorage.setItem('pwa_install_banner_dismissed', eightDaysAgo.toString());
```

## 📱 Testing en Diferentes Dispositivos

### Pantallas Pequeñas (< 400px)
- ✅ Banner debe reorganizar botones en fila
- ✅ Texto debe ser legible
- ✅ Botones deben ser touch-friendly

### Pantallas Medianas (400px - 600px)
- ✅ Layout estándar con botones en columna
- ✅ Espaciado adecuado

### Pantallas Grandes (> 600px)
- ✅ Banner centrado con max-width: 600px
- ✅ Diseño optimizado

## 🐛 Problemas Comunes

### Banner No Aparece
**Posibles causas:**
1. App ya instalada → Verificar `window.PWAInstall.isInstalled()`
2. Banner cerrado recientemente → Verificar localStorage
3. No hay Service Worker → Verificar consola
4. No hay manifest.json → Verificar Network tab

**Solución:**
```javascript
// Resetear y verificar
window.PWAInstall.resetDismissal();
location.reload();
```

### Botón "Instalar" No Funciona
**Posibles causas:**
1. Evento `beforeinstallprompt` no se disparó
2. Navegador no soporta instalación
3. App ya instalada

**Verificar:**
```javascript
// En consola, buscar:
// "📱 beforeinstallprompt event fired"
```

### Banner Aparece en App Instalada
**Posibles causas:**
1. Detección de instalación falló
2. App abierta en navegador (no standalone)

**Verificar:**
```javascript
console.log(window.matchMedia('(display-mode: standalone)').matches);
console.log(window.navigator.standalone); // iOS
```

## ✅ Checklist de Testing

- [ ] Banner aparece después de 2 segundos
- [ ] Animación de entrada funciona
- [ ] Botón "Instalar" funciona (Android)
- [ ] Botón "Ahora no" cierra el banner
- [ ] Banner no aparece si se cerró recientemente
- [ ] Banner no aparece si app está instalada
- [ ] Instrucciones iOS se muestran correctamente
- [ ] Responsive funciona en diferentes tamaños
- [ ] localStorage guarda preferencias
- [ ] Banner reaparece después de 7 días
- [ ] Detección de instalación funciona
- [ ] API pública funciona correctamente

## 📊 Métricas a Observar

1. **Tasa de Aparición**: ¿Cuántas veces aparece el banner?
2. **Tasa de Cierre**: ¿Cuántos usuarios cierran el banner?
3. **Tasa de Instalación**: ¿Cuántos usuarios instalan la app?
4. **Tiempo hasta Acción**: ¿Cuánto tardan en decidir?

## 🔄 Testing Automatizado (Futuro)

Para implementar tests automatizados, considera:
- Puppeteer para simular interacciones
- Jest para unit tests
- Cypress para E2E tests
- Lighthouse para auditoría PWA
