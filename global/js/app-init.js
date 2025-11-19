// global/js/app-init.js
// Inicializa el espacio de nombres global 'App' y coordina el arranque.
(function() {
    'use strict';

    // Asegura que el objeto global App y sus propiedades existan
    window.App = window.App || {};
    window.App.ui = window.App.ui || {};
    window.App.ui.render = window.App.ui.render || {};
    window.App.ui.events = window.App.ui.events || {};
    window.App.state = window.App.state || {};
    window.App.utils = window.App.utils || {};
    
    const log = (...msg) => console.log('[AppInit]', ...msg);

    /**
     * Procesa tareas iniciales de la app
     */
    const processInitialTasks = () => {
        log('🚀 Procesando tareas iniciales...');
        
        if (window.App?.state?.processScheduledMissionsForToday) {
            App.state.processScheduledMissionsForToday();
        }

        log('✅ Tareas iniciales completadas.');
    };

    // ------------------- INICIO COORDINADO DE LA APP -------------------
    document.addEventListener('DOMContentLoaded', async () => {
        log('📱 DOMContentLoaded - Iniciando aplicación...');

        // 1. Inicializar GitHub Sync (importará automáticamente si es necesario)
        if (window.GitHubSync) {
            await window.GitHubSync.init();
        }

        // 2. Procesar lógica de la app
        processInitialTasks();
    });

    // ------------------- Service Worker & Actualización -------------------
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('[ServiceWorker] ✅ Registrado:', reg.scope))
            .catch(err => console.warn('[ServiceWorker] ⚠️ Error registrando:', err));

        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data?.type === 'NEW_VERSION') {
                log('[ServiceWorker] 🆕 Nueva versión disponible. Mostrando banner.');
                
                const banner = document.createElement('div');
                banner.textContent = '¡Nueva versión disponible! Toca para actualizar.';
                banner.style.cssText = `
                    position: fixed;
                    bottom: 1rem;
                    left: 50%;
                    transform: translateX(-50%);
                    background: var(--ff-accent);
                    color: var(--ff-bg-dark);
                    padding: 0.8rem 1.2rem;
                    border-radius: var(--border-radius-md);
                    cursor: pointer;
                    z-index: 1000;
                    font-weight: 700;
                    text-align: center;
                    box-shadow: var(--shadow-md);
                `;
                banner.onclick = () => {
                    log('[ServiceWorker] 🔄 Recargando para instalar la nueva versión...');
                    location.reload();
                };
                document.body.appendChild(banner);
            }
        });
    }

    // API pública por si se necesita forzar
    window.App.init = {
        forceProcessTasks: processInitialTasks
    };

})();