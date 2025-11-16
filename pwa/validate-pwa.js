// validate-pwa.js - Script para validar la instalabilidad de la PWA
// Ejecuta este script en la consola del navegador para verificar todos los requisitos

(async function validatePWA() {
    console.log('%c🔍 VALIDACIÓN DE PWA - FFTask', 'font-size: 20px; font-weight: bold; color: #00E4FF;');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00E4FF;');
    
    const results = {
        passed: [],
        failed: [],
        warnings: []
    };

    // 1. Verificar HTTPS
    console.log('\n%c📡 1. Verificando HTTPS...', 'font-weight: bold; color: #667eea;');
    if (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        results.passed.push('✅ HTTPS o localhost detectado');
        console.log('✅ HTTPS o localhost detectado');
    } else {
        results.failed.push('❌ La app debe servirse por HTTPS (o localhost para desarrollo)');
        console.log('❌ La app debe servirse por HTTPS');
    }

    // 2. Verificar Service Worker
    console.log('\n%c⚙️ 2. Verificando Service Worker...', 'font-weight: bold; color: #667eea;');
    if ('serviceWorker' in navigator) {
        results.passed.push('✅ API de Service Worker soportada');
        console.log('✅ API de Service Worker soportada');
        
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            if (registrations.length > 0) {
                results.passed.push(`✅ ${registrations.length} Service Worker(s) registrado(s)`);
                console.log(`✅ ${registrations.length} Service Worker(s) registrado(s)`);
                
                registrations.forEach((reg, index) => {
                    console.log(`   SW ${index + 1}:`, {
                        scope: reg.scope,
                        state: reg.active?.state,
                        scriptURL: reg.active?.scriptURL
                    });
                });
            } else {
                results.failed.push('❌ No hay Service Workers registrados');
                console.log('❌ No hay Service Workers registrados');
            }
        } catch (error) {
            results.failed.push('❌ Error al verificar Service Workers: ' + error.message);
            console.error('❌ Error:', error);
        }
    } else {
        results.failed.push('❌ Service Worker no soportado en este navegador');
        console.log('❌ Service Worker no soportado');
    }

    // 3. Verificar Manifest
    console.log('\n%c📄 3. Verificando Manifest...', 'font-weight: bold; color: #667eea;');
    try {
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (manifestLink) {
            results.passed.push('✅ Link al manifest encontrado');
            console.log('✅ Link al manifest encontrado:', manifestLink.href);
            
            try {
                const response = await fetch(manifestLink.href);
                const manifest = await response.json();
                
                console.log('📋 Contenido del manifest:', manifest);
                
                // Verificar campos requeridos
                if (manifest.name || manifest.short_name) {
                    results.passed.push('✅ Nombre presente en manifest');
                    console.log('✅ Nombre:', manifest.name || manifest.short_name);
                } else {
                    results.failed.push('❌ Falta nombre en manifest');
                }
                
                if (manifest.start_url) {
                    results.passed.push('✅ start_url presente');
                    console.log('✅ start_url:', manifest.start_url);
                } else {
                    results.failed.push('❌ Falta start_url en manifest');
                }
                
                if (manifest.display) {
                    results.passed.push('✅ display presente');
                    console.log('✅ display:', manifest.display);
                } else {
                    results.warnings.push('⚠️ Falta campo display (recomendado: standalone)');
                }
                
                if (manifest.icons && manifest.icons.length > 0) {
                    results.passed.push(`✅ ${manifest.icons.length} icono(s) definido(s)`);
                    console.log(`✅ ${manifest.icons.length} icono(s):`);
                    
                    const has192 = manifest.icons.some(icon => icon.sizes.includes('192'));
                    const has512 = manifest.icons.some(icon => icon.sizes.includes('512'));
                    const hasMaskable = manifest.icons.some(icon => icon.purpose?.includes('maskable'));
                    
                    if (has192) {
                        results.passed.push('✅ Icono 192x192 presente');
                        console.log('   ✅ Icono 192x192 presente');
                    } else {
                        results.failed.push('❌ Falta icono 192x192');
                    }
                    
                    if (has512) {
                        results.passed.push('✅ Icono 512x512 presente');
                        console.log('   ✅ Icono 512x512 presente');
                    } else {
                        results.warnings.push('⚠️ Falta icono 512x512 (recomendado)');
                    }
                    
                    if (hasMaskable) {
                        results.passed.push('✅ Icono maskable presente');
                        console.log('   ✅ Icono maskable presente');
                    } else {
                        results.warnings.push('⚠️ Falta icono maskable (recomendado para Android)');
                    }
                    
                    manifest.icons.forEach((icon, i) => {
                        console.log(`   ${i + 1}. ${icon.sizes} - ${icon.type} - ${icon.purpose || 'any'}`);
                    });
                } else {
                    results.failed.push('❌ No hay iconos definidos en manifest');
                }
                
                if (manifest.theme_color) {
                    results.passed.push('✅ theme_color presente');
                    console.log('✅ theme_color:', manifest.theme_color);
                } else {
                    results.warnings.push('⚠️ Falta theme_color (recomendado)');
                }
                
                if (manifest.background_color) {
                    results.passed.push('✅ background_color presente');
                    console.log('✅ background_color:', manifest.background_color);
                } else {
                    results.warnings.push('⚠️ Falta background_color (recomendado)');
                }
                
            } catch (error) {
                results.failed.push('❌ Error al cargar manifest: ' + error.message);
                console.error('❌ Error al cargar manifest:', error);
            }
        } else {
            results.failed.push('❌ No se encontró link al manifest en el HTML');
            console.log('❌ No se encontró <link rel="manifest">');
        }
    } catch (error) {
        results.failed.push('❌ Error al verificar manifest: ' + error.message);
        console.error('❌ Error:', error);
    }

    // 4. Verificar Viewport
    console.log('\n%c📱 4. Verificando Viewport...', 'font-weight: bold; color: #667eea;');
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        results.passed.push('✅ Meta viewport presente');
        console.log('✅ Meta viewport:', viewport.content);
    } else {
        results.failed.push('❌ Falta meta viewport');
        console.log('❌ Falta <meta name="viewport">');
    }

    // 5. Verificar si está instalada
    console.log('\n%c💻 5. Verificando Estado de Instalación...', 'font-weight: bold; color: #667eea;');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = window.navigator.standalone === true;
    const isInstalled = isStandalone || isIOSStandalone;
    
    if (isInstalled) {
        results.passed.push('✅ App ejecutándose en modo standalone (instalada)');
        console.log('✅ App instalada y ejecutándose en modo standalone');
    } else {
        console.log('ℹ️ App ejecutándose en navegador (no instalada)');
    }

    // 6. Verificar beforeinstallprompt
    console.log('\n%c🎯 6. Verificando Prompt de Instalación...', 'font-weight: bold; color: #667eea;');
    if (window.deferredPrompt || window.PWAInstall?.hasPrompt()) {
        results.passed.push('✅ Prompt de instalación disponible');
        console.log('✅ Prompt de instalación disponible');
    } else {
        console.log('ℹ️ Prompt de instalación no disponible (puede ser normal si ya está instalada o el navegador no lo soporta)');
    }

    // 7. Verificar Platform Detection
    console.log('\n%c🌐 7. Verificando Detección de Plataforma...', 'font-weight: bold; color: #667eea;');
    if (window.PWAInstall) {
        const platform = window.PWAInstall.getPlatform();
        results.passed.push(`✅ Plataforma detectada: ${platform}`);
        console.log(`✅ Plataforma detectada: ${platform}`);
        console.log(`✅ API PWAInstall disponible`);
    } else {
        results.warnings.push('⚠️ API PWAInstall no disponible');
        console.log('⚠️ API PWAInstall no disponible');
    }

    // 8. Verificar Cache
    console.log('\n%c💾 8. Verificando Cache...', 'font-weight: bold; color: #667eea;');
    try {
        const cacheNames = await caches.keys();
        if (cacheNames.length > 0) {
            results.passed.push(`✅ ${cacheNames.length} cache(s) encontrado(s)`);
            console.log(`✅ ${cacheNames.length} cache(s):`);
            
            for (const cacheName of cacheNames) {
                const cache = await caches.open(cacheName);
                const requests = await cache.keys();
                console.log(`   📦 ${cacheName}: ${requests.length} recursos`);
            }
        } else {
            results.warnings.push('⚠️ No hay caches creados aún');
            console.log('⚠️ No hay caches creados');
        }
    } catch (error) {
        results.warnings.push('⚠️ Error al verificar cache: ' + error.message);
        console.error('⚠️ Error:', error);
    }

    // Resumen Final
    console.log('\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00E4FF;');
    console.log('%c📊 RESUMEN DE VALIDACIÓN', 'font-size: 18px; font-weight: bold; color: #00E4FF;');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00E4FF;');
    
    console.log(`\n%c✅ Pruebas Pasadas: ${results.passed.length}`, 'color: #58E478; font-weight: bold;');
    results.passed.forEach(msg => console.log(`%c${msg}`, 'color: #58E478;'));
    
    if (results.warnings.length > 0) {
        console.log(`\n%c⚠️ Advertencias: ${results.warnings.length}`, 'color: #FFA500; font-weight: bold;');
        results.warnings.forEach(msg => console.log(`%c${msg}`, 'color: #FFA500;'));
    }
    
    if (results.failed.length > 0) {
        console.log(`\n%c❌ Pruebas Fallidas: ${results.failed.length}`, 'color: #FF4444; font-weight: bold;');
        results.failed.forEach(msg => console.log(`%c${msg}`, 'color: #FF4444;'));
    }
    
    // Conclusión
    console.log('\n%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00E4FF;');
    if (results.failed.length === 0) {
        console.log('%c🎉 ¡PWA LISTA PARA INSTALAR!', 'font-size: 16px; font-weight: bold; color: #58E478;');
        console.log('%cLa aplicación cumple con todos los requisitos básicos.', 'color: #58E478;');
        if (results.warnings.length > 0) {
            console.log('%cHay algunas advertencias que podrías considerar mejorar.', 'color: #FFA500;');
        }
    } else {
        console.log('%c⚠️ PWA NO INSTALABLE', 'font-size: 16px; font-weight: bold; color: #FF4444;');
        console.log('%cCorrige los errores marcados arriba para hacer la app instalable.', 'color: #FF4444;');
    }
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00E4FF;');
    
    // Instrucciones
    console.log('\n%c💡 PRÓXIMOS PASOS:', 'font-weight: bold; color: #667eea;');
    console.log('1. Corrige cualquier error marcado en rojo');
    console.log('2. Considera las advertencias en naranja');
    console.log('3. Recarga la página con Ctrl+Shift+R');
    console.log('4. Ejecuta este script de nuevo');
    console.log('5. Usa Lighthouse para una auditoría completa');
    
    return {
        passed: results.passed.length,
        warnings: results.warnings.length,
        failed: results.failed.length,
        installable: results.failed.length === 0
    };
})();
