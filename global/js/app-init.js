// global/js/app-init.js
// Inicializa el espacio de nombres global 'App' y sus sub-objetos principales.
(function() {
    window.App = window.App || {};
    window.App.ui = window.App.ui || {};
    // Sub-objetos esenciales
    window.App.ui.render = window.App.ui.render || {}; // Asegura que App.ui.render exista
    window.App.ui.events = window.App.ui.events || {}; // Asegura que App.ui.events exista
    window.App.state = window.App.state || {}; // Asegura que App.state exista
    window.App.utils = window.App.utils || {}; // Asegura que App.utils exista

    // ------------------- Coordinación con GitHub Sync -------------------
    /**
     * Procesa tareas iniciales DESPUÉS de que GitHub Sync haya verificado
     * Evita procesar con datos desactualizados que serán sobrescritos
     */
    const processInitialTasks = () => {
        console.log('[AppInit] 🚀 Procesando tareas iniciales...');
        
        // Procesar misiones programadas para hoy al iniciar
        if (window.App && App.state && App.state.processScheduledMissionsForToday) {
            App.state.processScheduledMissionsForToday();
        }

        // Mover tareas incompletas del día anterior a hoy
        if (window.App && App.state && App.state.rolloverUncompletedTasks) {
            App.state.rolloverUncompletedTasks();
        }

        console.log('[AppInit] ✅ Tareas iniciales completadas');
    };

    // ------------------- Inicialización Coordinada -------------------
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('[AppInit] 📱 DOMContentLoaded - Iniciando app...');

        // ✅ Esperar a que GitHub Sync complete su verificación inicial
        if (window.GitHubSync && window.GitHubSync.isConnected) {
            console.log('[AppInit] ⏳ Esperando verificación de GitHub Sync...');
            
            // Esperar máximo 5 segundos a que termine la sincronización inicial
            let attempts = 0;
            const maxAttempts = 50; // 50 * 100ms = 5 segundos
            
            while (window.GitHubSync.isSyncing && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            if (attempts >= maxAttempts) {
                console.warn('[AppInit] ⚠️ Timeout esperando GitHub Sync, continuando...');
            } else {
                console.log('[AppInit] ✅ GitHub Sync completado, procesando tareas');
            }
        }

        // Procesar tareas iniciales solo DESPUÉS de verificar sincronización
        processInitialTasks();

        // NOTA: processAllChallengesOnLoad se llama desde script.js después de cargar el estado
    });

    // ------------------- Service Worker & actualización -------------------
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('[ServiceWorker] ✅ Registrado:', reg.scope))
            .catch(err => console.warn('[ServiceWorker] ⚠️ Error registrando:', err));

        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data?.type === 'NEW_VERSION') {
                console.log('[ServiceWorker] 🆕 Nueva versión disponible');
                
                // Crear banner discreto para actualizar
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
                    console.log('[ServiceWorker] 🔄 Recargando para actualizar...');
                    location.reload();
                };
                document.body.appendChild(banner);
            }
        });
    }

    // ------------------- API Pública -------------------
    window.App.init = {
        /**
         * Fuerza el procesamiento de tareas iniciales
         * Útil para testing o llamadas manuales
         */
        forceProcessTasks: processInitialTasks
    };
})();