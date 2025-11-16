// pwa.js - Sistema simple de instalación PWA
(function() {
    'use strict';

    let deferredPrompt = null;

    /**
     * Inicializa el sistema PWA
     */
    function init() {
        // Si ya está instalado, no hacer nada
        if (window.matchMedia('(display-mode: standalone)').matches || 
            window.navigator.standalone === true) {
            console.log('✅ PWA ya instalada');
            return;
        }

        // Escuchar el evento de instalación
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('📱 PWA instalable detectada');
            e.preventDefault();
            deferredPrompt = e;
            showBanner();
        });

        // Escuchar cuando se instala
        window.addEventListener('appinstalled', () => {
            console.log('✅ PWA instalada');
            hideBanner();
            deferredPrompt = null;
        });
    }

    /**
     * Muestra el banner de instalación
     */
    function showBanner() {
        // Verificar si ya existe
        if (document.getElementById('pwaInstallBanner')) return;

        const banner = document.createElement('div');
        banner.id = 'pwaInstallBanner';
        banner.className = 'pwa-install-banner';
        banner.innerHTML = `
            <div class="pwa-banner-content">
                <div class="pwa-banner-icon">📱</div>
                <div class="pwa-banner-text">
                    <h3 class="pwa-banner-title">¡Instala FFTask!</h3>
                    <p class="pwa-banner-description">Instala la app para acceso rápido y uso sin conexión</p>
                </div>
                <div class="pwa-banner-actions">
                    <button class="pwa-install-btn" id="pwaInstallBtn">Instalar</button>
                    <button class="pwa-close-btn" id="pwaCloseBtn">Cerrar</button>
                </div>
            </div>
        `;

        document.body.appendChild(banner);

        // Event listeners
        document.getElementById('pwaInstallBtn').addEventListener('click', installApp);
        document.getElementById('pwaCloseBtn').addEventListener('click', hideBanner);

        // Mostrar con animación
        setTimeout(() => banner.classList.add('show'), 100);
    }

    /**
     * Instala la aplicación
     */
    async function installApp() {
        if (!deferredPrompt) {
            console.error('❌ No hay prompt disponible');
            return;
        }

        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            
            console.log(`Usuario ${outcome === 'accepted' ? 'aceptó' : 'rechazó'} la instalación`);
            
            deferredPrompt = null;
            hideBanner();
        } catch (error) {
            console.error('❌ Error al instalar:', error);
        }
    }

    /**
     * Oculta el banner
     */
    function hideBanner() {
        const banner = document.getElementById('pwaInstallBanner');
        if (banner) {
            banner.classList.remove('show');
            setTimeout(() => banner.remove(), 300);
        }
    }

    // API pública
    window.PWAInstall = {
        show: showBanner,
        hide: hideBanner,
        hasPrompt: () => !!deferredPrompt
    };

    // Auto-inicializar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
