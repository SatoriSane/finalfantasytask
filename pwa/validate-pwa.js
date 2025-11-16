// validate-pwa.js - Validador simple de PWA
// Ejecuta en consola del navegador para verificar la PWA

(async function validatePWA() {
    console.log('%c🔍 Validación PWA - FFTask', 'font-size: 18px; font-weight: bold; color: #667eea;');
    
    let passed = 0, failed = 0;

    // 1. HTTPS
    console.log('\n📡 HTTPS...');
    if (location.protocol === 'https:' || location.hostname === 'localhost') {
        console.log('✅ OK');
        passed++;
    } else {
        console.log('❌ Requiere HTTPS');
        failed++;
    }

    // 2. Service Worker
    console.log('\n⚙️ Service Worker...');
    if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        if (regs.length > 0) {
            console.log(`✅ ${regs.length} registrado(s)`);
            passed++;
        } else {
            console.log('❌ No registrado');
            failed++;
        }
    } else {
        console.log('❌ No soportado');
        failed++;
    }

    // 3. Manifest
    console.log('\n📄 Manifest...');
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
        try {
            const res = await fetch(manifestLink.href);
            const manifest = await res.json();
            const has192 = manifest.icons?.some(i => i.sizes.includes('192'));
            const has512 = manifest.icons?.some(i => i.sizes.includes('512'));
            
            if (manifest.name && manifest.start_url && has192 && has512) {
                console.log('✅ Completo');
                passed++;
            } else {
                console.log('❌ Faltan campos requeridos');
                failed++;
            }
        } catch (e) {
            console.log('❌ Error al cargar:', e.message);
            failed++;
        }
    } else {
        console.log('❌ No encontrado');
        failed++;
    }

    // 4. Viewport
    console.log('\n📱 Viewport...');
    if (document.querySelector('meta[name="viewport"]')) {
        console.log('✅ OK');
        passed++;
    } else {
        console.log('❌ Falta meta viewport');
        failed++;
    }

    // 5. Estado de instalación
    console.log('\n💻 Estado...');
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone === true;
    console.log(isInstalled ? '✅ Instalada' : 'ℹ️ No instalada (normal)');

    // 6. Prompt de instalación
    console.log('\n🎯 Prompt...');
    if (window.PWAInstall?.hasPrompt()) {
        console.log('✅ Disponible');
    } else {
        console.log('ℹ️ No disponible (normal si ya está instalada)');
    }

    // 7. API PWA
    console.log('\n🌐 API...');
    if (window.PWAInstall) {
        console.log('✅ Disponible');
        passed++;
    } else {
        console.log('❌ No cargada');
        failed++;
    }

    // Resumen
    console.log('\n' + '='.repeat(40));
    console.log(`%c📊 Resultado: ${passed} ✅ | ${failed} ❌`, 'font-weight: bold;');
    
    if (failed === 0) {
        console.log('%c🎉 PWA lista para instalar', 'color: #58E478; font-weight: bold;');
    } else {
        console.log('%c⚠️ Corrige los errores marcados', 'color: #FF4444; font-weight: bold;');
    }
    console.log('='.repeat(40));
    
    return { passed, failed, installable: failed === 0 };
})();
