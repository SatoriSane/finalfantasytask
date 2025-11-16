# 📱 Guía de Despliegue PWA

## ✅ Configuración Actual (Rutas Relativas)

El `manifest.json` usa rutas relativas que funcionan en **ambos entornos**:

```json
{
  "start_url": "./",
  "scope": "./"
}
```

### Por qué funciona:

#### 🏠 Localhost
- Manifest en: `http://localhost:8000/manifest.json`
- `start_url: ./` se resuelve a: `http://localhost:8000/`
- `scope: ./` se resuelve a: `http://localhost:8000/`
- ✅ **Funciona correctamente**

#### 🌐 GitHub Pages
- Manifest en: `https://satorisane.github.io/finalfantasytask/manifest.json`
- `start_url: ./` se resuelve a: `https://satorisane.github.io/finalfantasytask/`
- `scope: ./` se resuelve a: `https://satorisane.github.io/finalfantasytask/`
- ✅ **Funciona correctamente**

## 🔍 Cómo Verificar

### En Localhost:
1. Abre: `http://localhost:8000/pwa/test-manifest.html`
2. Verifica que las URLs se resuelvan correctamente
3. Mira la sección "Simulación GitHub Pages"

### En GitHub Pages (después del push):
1. Abre: `https://satorisane.github.io/finalfantasytask/`
2. Abre DevTools (F12) → Application → Manifest
3. Verifica:
   - `start_url`: debe ser `https://satorisane.github.io/finalfantasytask/`
   - `scope`: debe ser `https://satorisane.github.io/finalfantasytask/`
   - Todos los iconos deben cargar sin errores

## 🚀 Pasos para Desplegar

### 1. Verificar en Local
```bash
# Iniciar servidor
python3 -m http.server 8000

# Abrir en Chrome
http://localhost:8000/pwa/test-install.html
```

### 2. Hacer Push a GitHub
```bash
git add .
git commit -m "Fix: PWA con rutas relativas"
git push origin main
```

### 3. Verificar en GitHub Pages
```bash
# Esperar 1-2 minutos para que se despliegue
# Luego abrir:
https://satorisane.github.io/finalfantasytask/
```

### 4. Limpiar Cache del Navegador
```
1. Abrir DevTools (F12)
2. Application → Storage → Clear site data
3. Recargar la página (Ctrl+Shift+R)
```

## ⚠️ Problemas Comunes

### "La app no es instalable en GitHub Pages"

**Solución:**
1. Verifica que el Service Worker esté registrado:
   - DevTools → Application → Service Workers
   - Debe estar "activated and running"

2. Verifica el manifest:
   - DevTools → Application → Manifest
   - No debe haber errores en rojo

3. Limpia cache y recarga:
   - Application → Storage → Clear site data
   - Ctrl+Shift+R

### "Los iconos no cargan"

**Solución:**
- Verifica que la carpeta `icons/` esté en el repositorio
- Verifica que los archivos PNG existan
- Las rutas en manifest.json son relativas: `icons/icon-192x192.png`

## 🎯 Alternativa: Rutas Absolutas

Si prefieres usar rutas absolutas para GitHub Pages:

```json
{
  "start_url": "/finalfantasytask/",
  "scope": "/finalfantasytask/"
}
```

**Ventaja:** Más explícito
**Desventaja:** No funciona en localhost (necesitas cambiar para desarrollo)

## 💡 Recomendación

**Mantén las rutas relativas (`./`)** porque:
- ✅ Funciona en localhost
- ✅ Funciona en GitHub Pages
- ✅ Funciona en cualquier subdirectorio
- ✅ No necesitas cambiar nada al desplegar
- ✅ Más portable y flexible

## 🧪 Script de Prueba

Ejecuta esto en la consola de GitHub Pages para verificar:

```javascript
fetch('/finalfantasytask/manifest.json')
  .then(r => r.json())
  .then(m => {
    const base = new URL('/finalfantasytask/manifest.json', location.origin);
    const start = new URL(m.start_url, base);
    const scope = new URL(m.scope, base);
    console.log('✅ Manifest:', m.name);
    console.log('📍 start_url resuelto:', start.href);
    console.log('📍 scope resuelto:', scope.href);
    console.log('✅ Correcto?', 
      start.href === 'https://satorisane.github.io/finalfantasytask/' &&
      scope.href === 'https://satorisane.github.io/finalfantasytask/'
    );
  });
```

## 📚 Referencias

- [MDN: Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [web.dev: Add a web app manifest](https://web.dev/add-manifest/)
- [PWA Builder](https://www.pwabuilder.com/)
