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
     * Procesa tareas iniciales DESPUÉS de que GitHub Sync haya verificado.
     * Esto evita procesar datos que podrían ser sobrescritos por una importación.
     */
    const processInitialTasks = () => {
        log('🚀 Procesando tareas iniciales de la app...');
        
        if (window.App?.state?.processScheduledMissionsForToday) {
            App.state.processScheduledMissionsForToday();
        }

        if (window.App?.state?.rolloverUncompletedTasks) {
            App.state.rolloverUncompletedTasks();
        }

        log('✅ Tareas iniciales completadas.');
    };

    /**
     * Espera a que la sincronización inicial de GitHub termine si está en curso.
     * Incluye un timeout para no bloquear la app indefinidamente.
     */
    const waitForInitialSync = async () => {
        if (!window.GitHubSync?.isConnected) {
            log('GitHub no conectado, continuando sin esperar.');
            return;
        }

        log('⏳ Esperando la verificación inicial de GitHub Sync...');
        let attempts = 0;
        const maxAttempts = 50; // 50 * 100ms = 5 segundos de timeout

        while (window.GitHubSync.isSyncing && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (attempts >= maxAttempts) {
            log('⚠️ Timeout esperando a GitHub Sync. La app podría tener datos desactualizados.');
        } else {
            log('✅ Verificación de GitHub Sync completada.');
        }
    };

    // ------------------- INICIO COORDINADO DE LA APP -------------------
    document.addEventListener('DOMContentLoaded', async () => {
        log('📱 DOMContentLoaded - Orquestando inicio de la aplicación...');

        // 1. Inicializar el módulo de sincronización PRIMERO.
        await window.GitHubSync.init();

        // 2. Esperar a que la posible sincronización inicial termine.
        await waitForInitialSync();

        // 3. Ahora que los datos están (potencialmente) actualizados, procesar lógica de la app.
        processInitialTasks();

        // NOTA: La lógica de `processAllChallengesOnLoad` se mantiene donde esté (p. ej., script.js)
        // ya que depende de que otros estados se carguen primero.
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
