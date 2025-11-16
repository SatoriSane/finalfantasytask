// pwa.js - Sistema de notificación de instalación PWA
(function() {
    'use strict';

    // Configuración
    const CONFIG = {
        STORAGE_KEY: 'pwa_install_banner_closed',
        BANNER_ID: 'pwaInstallBanner',
        SHOW_DELAY: 2000, // Mostrar después de 2 segundos
        RESHOW_AFTER_CLOSE: false, // Siempre mostrar en cada recarga (no guardar cierre)
        INSTRUCTIONS: {
            ios: 'Toca el botón de compartir <span class="pwa-ios-share-icon">⎋</span> y luego "Añadir a pantalla de inicio"',
            android: 'Instala la app para acceder más rápido y usarla sin conexión',
            desktop: 'Instala la app en tu computadora para acceso rápido desde el escritorio',
            generic: 'Instala esta app para una mejor experiencia y acceso sin conexión'
        }
    };

    // Estado
    let deferredPrompt = null;
    let isInstalled = false;
    let platform = 'generic'; // 'ios', 'android', 'desktop', 'generic'
    let browser = 'unknown'; // 'chrome', 'firefox', 'safari', 'edge', 'unknown'

    /**
     * Inicializa el sistema PWA
     */
    function init() {
        try {
            // Detectar navegador y plataforma
            detectBrowser();
            detectPlatform();
            
            // Detectar si ya está instalado
            checkIfInstalled();
            
            // Si ya está instalado, verificar si estamos en el navegador o en la app
            if (isInstalled) {
                // Si estamos en modo standalone (app instalada), NO mostrar banner
                if (window.matchMedia('(display-mode: standalone)').matches) {
                    console.log('✅ PWA ya instalada y ejecutándose en modo standalone - No mostrar banner');
                    return;
                }
                
                // Si estamos en el navegador pero la app está instalada, mostrar opción de abrir
                console.log('✅ PWA instalada pero ejecutándose en navegador - Mostrando opción de abrir app');
                createInstalledBanner();
                return;
            }
            
            console.log('📱 Plataforma detectada:', platform);
            console.log('🌐 Navegador detectado:', browser);
            
            // Crear el banner
            createBanner();
            
            // Escuchar el evento beforeinstallprompt (solo para Android/Chrome)
            window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            
            // Escuchar cuando se instala la app
            window.addEventListener('appinstalled', handleAppInstalled);
            
            // Mostrar el banner después de un delay (SIEMPRE, en cada recarga)
            setTimeout(showBanner, CONFIG.SHOW_DELAY);
            
            console.log('✅ PWA Install Banner initialized');
        } catch (error) {
            console.error('❌ Error initializing PWA system:', error);
        }
    }

    /**
     * Detecta el navegador del usuario
     */
    function detectBrowser() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        
        // Detectar Firefox
        if (/Firefox/i.test(userAgent)) {
            browser = 'firefox';
            return;
        }
        
        // Detectar Chrome
        if (/Chrome/i.test(userAgent) && !/Edg/i.test(userAgent)) {
            browser = 'chrome';
            return;
        }
        
        // Detectar Edge
        if (/Edg/i.test(userAgent)) {
            browser = 'edge';
            return;
        }
        
        // Detectar Safari
        if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
            browser = 'safari';
            return;
        }
        
        browser = 'unknown';
    }

    /**
     * Detecta la plataforma del usuario
     */
    function detectPlatform() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        
        // Detectar iOS
        if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
            platform = 'ios';
            return;
        }
        
        // Detectar Android
        if (/android/i.test(userAgent)) {
            platform = 'android';
            return;
        }
        
        // Detectar Desktop (Windows, Mac, Linux)
        if (!/Mobi|Android/i.test(userAgent)) {
            platform = 'desktop';
            return;
        }
        
        // Fallback
        platform = 'generic';
    }

    /**
     * Verifica si la app ya está instalada
     */
    function checkIfInstalled() {
        // Método 1: display-mode standalone (funciona en la mayoría de navegadores)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            isInstalled = true;
            console.log('✅ Detectado: display-mode standalone');
            return;
        }
        
        // Método 2: iOS standalone
        if (window.navigator.standalone === true) {
            isInstalled = true;
            console.log('✅ Detectado: iOS standalone');
            return;
        }
        
        // Método 3: Android TWA (Trusted Web Activity)
        if (document.referrer.includes('android-app://')) {
            isInstalled = true;
            console.log('✅ Detectado: Android TWA');
            return;
        }
        
        // Método 4: Verificar si viene de app instalada
        if (window.matchMedia('(display-mode: fullscreen)').matches) {
            isInstalled = true;
            console.log('✅ Detectado: fullscreen mode');
            return;
        }
        
        // Método 5: Verificar si viene de minimal-ui
        if (window.matchMedia('(display-mode: minimal-ui)').matches) {
            isInstalled = true;
            console.log('✅ Detectado: minimal-ui mode');
            return;
        }
        
        // Método 6: Verificar localStorage (marca manual si se instaló)
        try {
            if (localStorage.getItem('pwa_installed') === 'true') {
                isInstalled = true;
                console.log('✅ Detectado: marca de instalación en localStorage');
                return;
            }
        } catch (error) {
            // Ignorar errores de localStorage
        }
        
        console.log('ℹ️ App no instalada - Banner se mostrará');
    }

    /**
     * Maneja el evento beforeinstallprompt
     */
    function handleBeforeInstallPrompt(e) {
        console.log('📱 beforeinstallprompt event fired');
        
        // Prevenir que el navegador muestre su propio banner
        e.preventDefault();
        
        // Guardar el evento para usarlo después
        deferredPrompt = e;
        
        // El banner ya se muestra automáticamente en init()
        // No necesitamos mostrarlo aquí de nuevo
    }

    /**
     * Maneja cuando se instala la app
     */
    function handleAppInstalled(e) {
        console.log('✅ PWA installed successfully');
        isInstalled = true;
        
        // Marcar como instalada en localStorage
        try {
            localStorage.setItem('pwa_installed', 'true');
        } catch (error) {
            console.error('Error guardando estado de instalación:', error);
        }
        
        hideBanner();
        deferredPrompt = null;
    }

    /**
     * Crea el banner cuando la app ya está instalada
     */
    function createInstalledBanner() {
        // Verificar si ya existe
        if (document.getElementById(CONFIG.BANNER_ID)) {
            return;
        }

        const banner = document.createElement('div');
        banner.id = CONFIG.BANNER_ID;
        banner.className = 'pwa-install-banner installed';
        
        banner.innerHTML = `
            <div class="pwa-banner-content">
                <div class="pwa-banner-icon">✅</div>
                <div class="pwa-banner-text">
                    <h3 class="pwa-banner-title">App Instalada</h3>
                    <p class="pwa-banner-description">FFTask ya está instalada en tu dispositivo</p>
                </div>
                <div class="pwa-banner-actions">
                    <button class="pwa-install-btn" id="pwaOpenBtn">Abrir App</button>
                    <button class="pwa-close-btn" id="pwaCloseBtn">Cerrar</button>
                </div>
            </div>
        `;

        document.body.appendChild(banner);

        // Adjuntar event listeners
        const openBtn = banner.querySelector('#pwaOpenBtn');
        const closeBtn = banner.querySelector('#pwaCloseBtn');

        if (openBtn) {
            openBtn.addEventListener('click', handleOpenApp);
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', handleCloseClick);
        }

        // Mostrar el banner después de un delay
        setTimeout(() => {
            banner.classList.add('show');
            document.body.classList.add('pwa-banner-visible');
        }, CONFIG.SHOW_DELAY);
    }

    /**
     * Crea el banner HTML
     */
    function createBanner() {
        // Verificar si ya existe
        if (document.getElementById(CONFIG.BANNER_ID)) {
            return;
        }

        const banner = document.createElement('div');
        banner.id = CONFIG.BANNER_ID;
        banner.className = 'pwa-install-banner';
        
        // Agregar clase según plataforma
        banner.classList.add(`${platform}-style`);

        // Determinar mensaje según navegador y plataforma
        let instructions = '';
        let showInstallButton = false;
        
        if (browser === 'firefox' && platform === 'desktop') {
            // Firefox Desktop NO soporta PWA
            instructions = '⚠️ Firefox no soporta instalación. Abre esta app desde Chrome o Edge para instalarla.';
            showInstallButton = false;
        } else if (browser === 'chrome' || browser === 'edge') {
            // Chrome/Edge soportan instalación
            instructions = CONFIG.INSTRUCTIONS[platform] || CONFIG.INSTRUCTIONS.generic;
            showInstallButton = true;
        } else if (platform === 'ios') {
            // iOS Safari
            instructions = CONFIG.INSTRUCTIONS.ios;
            showInstallButton = false;
        } else if (platform === 'android') {
            // Android otros navegadores
            instructions = CONFIG.INSTRUCTIONS.android;
            showInstallButton = false;
        } else {
            // Genérico
            instructions = CONFIG.INSTRUCTIONS.generic;
            showInstallButton = false;
        }

        banner.innerHTML = `
            <div class="pwa-banner-content">
                <div class="pwa-banner-icon">📱</div>
                <div class="pwa-banner-text">
                    <h3 class="pwa-banner-title">¡Instala FFTask!</h3>
                    <p class="pwa-banner-description">${instructions}</p>
                </div>
                <div class="pwa-banner-actions">
                    ${showInstallButton ? '<button class="pwa-install-btn" id="pwaInstallBtn">Instalar</button>' : ''}
                    <button class="pwa-close-btn" id="pwaCloseBtn">Cerrar</button>
                </div>
            </div>
        `;

        document.body.appendChild(banner);

        // Adjuntar event listeners
        attachEventListeners();
    }

    /**
     * Adjunta los event listeners al banner
     */
    function attachEventListeners() {
        const installBtn = document.getElementById('pwaInstallBtn');
        const closeBtn = document.getElementById('pwaCloseBtn');

        if (installBtn) {
            installBtn.addEventListener('click', handleInstallClick);
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', handleCloseClick);
        }
    }

    /**
     * Maneja el click en el botón de instalar
     */
    async function handleInstallClick() {
        // Si hay prompt disponible (Android/Chrome), usarlo
        if (deferredPrompt) {
            try {
                // Mostrar el prompt de instalación nativo
                deferredPrompt.prompt();

                // Esperar la respuesta del usuario
                const { outcome } = await deferredPrompt.userChoice;
                
                console.log(`👤 User response: ${outcome}`);

                if (outcome === 'accepted') {
                    console.log('✅ User accepted the install prompt');
                    
                    // Marcar como instalada
                    isInstalled = true;
                    try {
                        localStorage.setItem('pwa_installed', 'true');
                    } catch (error) {
                        console.error('Error guardando estado de instalación:', error);
                    }
                } else {
                    console.log('❌ User dismissed the install prompt');
                }

                // Limpiar el prompt
                deferredPrompt = null;
                
                // Ocultar el banner
                hideBanner();
            } catch (error) {
                console.error('Error showing install prompt:', error);
                showInstallInstructions();
            }
        } else {
            // No hay prompt disponible, mostrar instrucciones
            console.log('ℹ️ No hay prompt nativo disponible, mostrando instrucciones');
            showInstallInstructions();
        }
    }

    /**
     * Muestra instrucciones de instalación según la plataforma y navegador
     */
    function showInstallInstructions() {
        let message = '';
        
        // Instrucciones específicas por navegador
        if (browser === 'firefox') {
            if (platform === 'desktop') {
                // Firefox Desktop NO soporta instalación PWA
                message = 'FIREFOX DESKTOP - Sin Soporte PWA:\n\n';
                message += '❌ Firefox Desktop NO soporta instalación de PWA.\n\n';
                message += 'Opciones alternativas:\n';
                message += '1. ⭐ RECOMENDADO: Usa Chrome o Edge para instalar la app\n';
                message += '2. Añade esta página a marcadores (Ctrl+D)\n';
                message += '3. Crea un acceso directo en el escritorio\n\n';
                message += 'La app funciona igual en Firefox, solo no se puede "instalar" como aplicación independiente.';
            } else {
                // Firefox Android tiene mejor soporte
                message = 'FIREFOX ANDROID - Instalación:\n\n';
                message += '1. Abre el menú (⋮)\n';
                message += '2. Busca "Instalar" o "Añadir a pantalla de inicio"\n';
                message += '3. Confirma la instalación\n\n';
                message += 'Nota: Firefox Android tiene mejor soporte PWA que la versión Desktop.';
            }
        } else if (browser === 'chrome' || browser === 'edge') {
            message = `${browser.toUpperCase()} - Instalación:\n\n`;
            message += '1. Busca el icono de instalación (⊕) en la barra de direcciones\n';
            message += '2. O abre el menú (⋮) → "Instalar FFTask"\n';
            message += '3. Confirma la instalación\n';
            message += '4. La app se abrirá en una ventana independiente';
        } else if (platform === 'ios') {
            message = 'iOS SAFARI - Instalación:\n\n';
            message += '1. Toca el botón de compartir (⎋)\n';
            message += '2. Desplázate y selecciona "Añadir a pantalla de inicio"\n';
            message += '3. Edita el nombre si quieres\n';
            message += '4. Toca "Añadir"';
        } else if (platform === 'android') {
            message = 'ANDROID - Instalación:\n\n';
            message += '1. Abre el menú del navegador (⋮)\n';
            message += '2. Selecciona "Instalar app" o "Añadir a pantalla de inicio"\n';
            message += '3. Confirma la instalación';
        } else {
            message = 'INSTALACIÓN:\n\n';
            message += 'Para instalar esta app:\n';
            message += '1. Busca el icono de instalación en la barra de direcciones\n';
            message += '2. O busca la opción en el menú de tu navegador\n';
            message += '3. Recomendamos usar Chrome o Edge para mejor soporte';
        }
        
        alert(message);
    }

    /**
     * Maneja el click en el botón "Abrir App"
     */
    function handleOpenApp() {
        // Intentar abrir la app instalada
        // En la mayoría de casos, si ya estamos en la app instalada, solo cerramos el banner
        if (window.matchMedia('(display-mode: standalone)').matches) {
            // Ya estamos en la app instalada, solo cerrar el banner
            hideBanner();
            console.log('ℹ️ Ya estás en la app instalada');
        } else {
            // Estamos en el navegador, intentar abrir la app
            // Esto funciona en algunos navegadores
            const appUrl = window.location.origin + '/';
            window.open(appUrl, '_blank');
            hideBanner();
            console.log('ℹ️ Intentando abrir la app instalada');
        }
    }

    /**
     * Maneja el click en el botón de cerrar
     */
    function handleCloseClick() {
        hideBanner();
        
        // NO guardar en localStorage - el banner debe aparecer en cada recarga
        // Si CONFIG.RESHOW_AFTER_CLOSE es true, guardar temporalmente
        if (CONFIG.RESHOW_AFTER_CLOSE) {
            try {
                sessionStorage.setItem(CONFIG.STORAGE_KEY, 'true');
            } catch (error) {
                console.error('Error saving banner dismissal:', error);
            }
        }
        
        console.log('ℹ️ Banner cerrado (reaparecerá en la próxima recarga)');
    }

    /**
     * Muestra el banner (SIEMPRE, excepto si está instalada o cerrado en esta sesión)
     */
    function showBanner() {
        // No mostrar si ya está instalado (esta función solo se llama para banner de instalación)
        // El banner de "Abrir App" se maneja en createInstalledBanner()
        if (isInstalled) {
            console.log('ℹ️ App instalada, no mostrar banner de instalación');
            return;
        }

        // Verificar si el usuario cerró el banner en esta sesión
        if (CONFIG.RESHOW_AFTER_CLOSE) {
            try {
                const closedInSession = sessionStorage.getItem(CONFIG.STORAGE_KEY);
                if (closedInSession) {
                    console.log('ℹ️ Banner cerrado en esta sesión');
                    return;
                }
            } catch (error) {
                console.error('Error checking session storage:', error);
            }
        }

        // Mostrar el banner
        const banner = document.getElementById(CONFIG.BANNER_ID);
        if (banner) {
            banner.classList.add('show');
            document.body.classList.add('pwa-banner-visible');
            console.log('✅ Banner mostrado');
        }
    }

    /**
     * Oculta el banner
     */
    function hideBanner() {
        const banner = document.getElementById(CONFIG.BANNER_ID);
        if (banner) {
            banner.classList.remove('show');
            document.body.classList.remove('pwa-banner-visible');
        }
    }

    /**
     * API pública
     */
    window.PWAInstall = {
        init: init,
        showBanner: showBanner,
        hideBanner: hideBanner,
        isInstalled: () => isInstalled,
        getPlatform: () => platform,
        getBrowser: () => browser,
        hasPrompt: () => !!deferredPrompt,
        resetSession: () => {
            try {
                sessionStorage.removeItem(CONFIG.STORAGE_KEY);
                console.log('✅ Session reset');
            } catch (error) {
                console.error('Error resetting session:', error);
            }
        },
        resetInstallState: () => {
            try {
                localStorage.removeItem('pwa_installed');
                isInstalled = false;
                console.log('✅ Estado de instalación reseteado - Recarga la página para ver el banner');
            } catch (error) {
                console.error('Error resetting install state:', error);
            }
        }
    };

    // Auto-inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
