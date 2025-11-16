# ✅ Checklist de Instalabilidad PWA

Esta guía te ayudará a verificar que tu PWA cumple con todos los requisitos para ser instalable en navegadores modernos.

## 🔍 Cómo Verificar en Chrome/Edge

### 1. Abrir DevTools
- Presiona `F12` o `Ctrl+Shift+I`
- Ve a la pestaña **Application** (Aplicación)

### 2. Verificar Manifest
- En el panel izquierdo, busca **Manifest**
- Verifica que se muestre:
  - ✅ Name: "Final Fantasy Task - Gestor de Tareas"
  - ✅ Short name: "FFTask"
  - ✅ Start URL: "/"
  - ✅ Display: "standalone"
  - ✅ Icons: Debe mostrar 4 iconos
  - ✅ Theme color: "#0A1128"

### 3. Verificar Service Worker
- En el panel izquierdo, busca **Service Workers**
- Verifica que:
  - ✅ Estado: **activated and is running**
  - ✅ Source: `service-worker.js`
  - ✅ Status: Verde (activo)

### 4. Verificar Instalabilidad
- En el panel izquierdo, busca **Manifest** nuevamente
- En la parte superior, busca el botón **"Install app"** o mensaje de instalabilidad
- Si hay errores, se mostrarán aquí

### 5. Lighthouse Audit
- Ve a la pestaña **Lighthouse**
- Selecciona **Progressive Web App**
- Click en **Generate report**
- Verifica que pase todas las pruebas de PWA

## 🔍 Cómo Verificar en Firefox

### 1. Abrir Consola de Desarrollador
- Presiona `F12`
- Ve a la pestaña **Console** (Consola)

### 2. Verificar Service Worker
- Escribe en la consola:
```javascript
navigator.serviceWorker.getRegistrations().then(regs => console.log(regs))
```
- Debe mostrar un array con al menos un service worker registrado

### 3. Verificar Manifest
- En la barra de direcciones, escribe: `about:debugging#/runtime/this-firefox`
- Busca tu aplicación en la lista
- Verifica que aparezca como "Service Worker"

### 4. Verificar Instalabilidad
- Firefox no muestra el botón de instalación tan prominentemente como Chrome
- Busca el icono de instalación en la barra de direcciones (puede ser un icono de casa o +)
- O ve al menú (☰) → "Instalar sitio como aplicación"

## 📋 Requisitos Mínimos para PWA Instalable

### ✅ Manifest.json
- [x] Archivo `manifest.json` presente y válido
- [x] Campo `name` o `short_name` presente
- [x] Campo `start_url` presente (debe ser `/` o `/index.html`)
- [x] Campo `display` con valor `standalone`, `fullscreen`, o `minimal-ui`
- [x] Campo `icons` con al menos un icono de 192x192 o mayor
- [x] Campo `icons` con al menos un icono de 512x512 (recomendado)
- [x] Icono con `purpose: "maskable"` (para Android)

### ✅ Service Worker
- [x] Service worker registrado correctamente
- [x] Service worker responde a eventos `fetch`
- [x] Service worker cachea recursos esenciales
- [x] Service worker funciona offline

### ✅ HTTPS
- [x] La app se sirve por HTTPS (o localhost para desarrollo)
- [x] Todos los recursos se cargan por HTTPS
- [x] No hay contenido mixto (HTTP en página HTTPS)

### ✅ Responsive
- [x] Meta viewport tag presente
- [x] Diseño responsive (funciona en móvil)
- [x] Touch-friendly (botones de tamaño adecuado)

## 🐛 Problemas Comunes y Soluciones

### ❌ "No matching service worker detected"
**Problema:** El service worker no está registrado o no responde a fetch.

**Solución:**
1. Verifica que `service-worker.js` esté en la raíz del proyecto
2. Verifica que el registro del SW esté en `index.html`
3. Recarga la página con `Ctrl+Shift+R` (hard reload)
4. Verifica la consola por errores

### ❌ "Manifest start_url is not cached by service worker"
**Problema:** El service worker no cachea la URL de inicio.

**Solución:**
1. Verifica que `APP_FILES` en `service-worker.js` incluya `/` o `index.html`
2. Incrementa `CACHE_NAME` para forzar actualización
3. En DevTools → Application → Clear storage → Clear site data
4. Recarga la página

### ❌ "No matching service worker detected for the current page"
**Problema:** El scope del service worker no coincide con la página.

**Solución:**
1. Verifica que el service worker esté en la raíz
2. Verifica que `scope` en manifest.json sea `/`
3. No registres el SW con un scope diferente

### ❌ "Manifest does not have a maskable icon"
**Problema:** Falta icono maskable para Android.

**Solución:**
- Ya incluido en el manifest actualizado con `purpose: "maskable"`

### ❌ "No icon found with size >= 192x192"
**Problema:** Los iconos son muy pequeños.

**Solución:**
- Ya incluidos iconos SVG de 192x192 y 512x512 en el manifest

### ❌ "Page does not work offline"
**Problema:** El service worker no cachea correctamente.

**Solución:**
1. Verifica que todos los archivos en `APP_FILES` existan
2. Verifica la consola por errores 404
3. Incrementa la versión del cache
4. Desregistra el SW antiguo y registra uno nuevo

## 🧪 Cómo Probar la Instalación

### Chrome/Edge Desktop:
1. Busca el icono de instalación en la barra de direcciones (⊕ o 🖥️)
2. O ve al menú (⋮) → "Instalar FFTask"
3. Click en "Instalar"
4. La app se abrirá en una ventana independiente

### Chrome Android:
1. Abre el menú (⋮)
2. Selecciona "Instalar app" o "Añadir a pantalla de inicio"
3. Confirma la instalación
4. El icono aparecerá en tu pantalla de inicio

### Firefox Desktop:
1. Busca el icono en la barra de direcciones
2. O ve al menú (☰) → "Instalar sitio como aplicación"
3. Confirma la instalación

### Safari iOS:
1. Toca el botón de compartir (⎋)
2. Selecciona "Añadir a pantalla de inicio"
3. Edita el nombre si quieres
4. Toca "Añadir"

## 🔄 Después de Hacer Cambios

Si modificas el manifest o el service worker:

1. **Incrementa la versión del cache** en `service-worker.js`:
```javascript
const CACHE_NAME = 'final-fantasy-tasks-cache-v4.1'; // Incrementar
```

2. **Limpia el cache del navegador**:
- DevTools → Application → Clear storage → Clear site data
- O usa `Ctrl+Shift+Delete`

3. **Desregistra el service worker antiguo**:
```javascript
// En la consola:
navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(reg => reg.unregister());
});
```

4. **Recarga la página** con `Ctrl+Shift+R` (hard reload)

5. **Verifica de nuevo** con Lighthouse o DevTools

## 📊 Verificación Final

Antes de considerar la PWA lista para producción:

- [ ] Lighthouse PWA score >= 90
- [ ] Funciona offline (desconecta internet y prueba)
- [ ] Se instala correctamente en Chrome
- [ ] Se instala correctamente en Firefox
- [ ] Se instala correctamente en Safari iOS
- [ ] Se instala correctamente en Chrome Android
- [ ] Los iconos se ven correctamente
- [ ] El splash screen aparece al abrir
- [ ] La app funciona en modo standalone
- [ ] No hay errores en la consola
- [ ] Todos los recursos se cargan correctamente

## 🎯 Comandos Útiles para Debugging

### Verificar si hay Service Worker registrado:
```javascript
navigator.serviceWorker.getRegistrations().then(regs => {
    console.log('Service Workers registrados:', regs.length);
    regs.forEach(reg => console.log(reg));
});
```

### Verificar si la app está instalada:
```javascript
console.log('Display mode:', window.matchMedia('(display-mode: standalone)').matches);
console.log('iOS standalone:', window.navigator.standalone);
```

### Forzar actualización del Service Worker:
```javascript
navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(reg => reg.update());
});
```

### Ver el cache actual:
```javascript
caches.keys().then(keys => {
    console.log('Caches disponibles:', keys);
    keys.forEach(key => {
        caches.open(key).then(cache => {
            cache.keys().then(requests => {
                console.log(`Cache ${key}:`, requests.map(r => r.url));
            });
        });
    });
});
```

## 📚 Recursos Adicionales

- [PWA Checklist (web.dev)](https://web.dev/pwa-checklist/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
