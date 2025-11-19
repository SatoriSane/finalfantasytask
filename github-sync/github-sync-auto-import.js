/* ===================================
   github-sync-auto-import.js - DETECTOR DE CAMBIOS REMOTOS
   
   Verifica periódicamente si hay cambios en el Gist remoto
   y avisa al usuario en el botón githubSyncBtn
   =================================== */

(function() {
    'use strict';

    const CONFIG = {
        CHECK_INTERVAL: 30000,  // Verificar cada 30 segundos
    };

    const log = (...msg) => console.log('[GitHubSync:Import]', ...msg);
    const STORAGE_KEY = 'fftask_github_remote_changes';

    let checkInterval = null;
    let hasRemoteChanges = false;

    /**
     * Inicializa el detector de cambios remotos
     */
    function init() {
        if (!window.GitHubSync?.isConnected) {
            return;
        }

        log('▶ Detector de cambios remotos activado');

        // Restaurar estado desde localStorage
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState === 'true') {
            hasRemoteChanges = true;
            log('📊 Estado restaurado: hay cambios remotos pendientes');
            updateButton();
        }

        // Verificar inmediatamente
        checkRemoteChanges();

        // Luego verificar cada 30 segundos
        checkInterval = setInterval(checkRemoteChanges, CONFIG.CHECK_INTERVAL);

        log(`👂 Verificación cada ${CONFIG.CHECK_INTERVAL/1000}s`);
    }

    /**
     * Verifica si hay cambios en el Gist remoto
     */
    async function checkRemoteChanges() {
        if (!window.GitHubSync?.isConnected) {
            return;
        }

        try {
            const response = await fetch(`https://api.github.com/gists/${window.GitHubSync.gistId}`, {
                headers: {
                    'Authorization': `token ${window.GitHubSync.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) return;

            const gist = await response.json();
            const content = gist.files['fftask-backup.json']?.content;
            
            if (!content) return;

            const backup = JSON.parse(content);
            
            if (!backup?.data) return;

            // Comparar con datos locales usando la función de github-sync-state.js
            const hasChanges = window.GitHubSync.hasDataChanges(backup.data);
            
            if (hasChanges && !hasRemoteChanges) {
                // Nuevos cambios detectados
                hasRemoteChanges = true;
                localStorage.setItem(STORAGE_KEY, 'true');
                log('📥 Cambios remotos detectados');
                updateButton();
            } else if (!hasChanges && hasRemoteChanges) {
                // Ya no hay cambios (usuario importó manualmente o desde otro dispositivo)
                hasRemoteChanges = false;
                localStorage.removeItem(STORAGE_KEY);
                log('✅ Cambios remotos ya sincronizados');
                updateButton();
            }
        } catch (error) {
            log('⚠️ Error al verificar cambios remotos:', error.message);
        }
    }

    /**
     * Actualiza el botón con indicador de cambios remotos
     */
    function updateButton() {
        const syncButton = document.getElementById('githubSyncBtn');
        if (!syncButton) return;

        const syncIcon = syncButton.querySelector('.sync-icon');
        const syncText = syncButton.querySelector('.sync-text');
        
        if (!syncIcon || !syncText) return;

        // Verificar si también hay cambios locales
        const localChanges = window.GitHubSyncCounter?.getCount() || 0;

        if (hasRemoteChanges && localChanges > 0) {
            // Hay cambios locales Y remotos (conflicto potencial)
            syncIcon.textContent = '⚠️';
            syncText.textContent = `${localChanges} ↑ / 1 ↓`;
            syncButton.title = `${localChanges} cambios para exportar, hay cambios para importar`;
            syncButton.style.borderColor = '#f59e0b';
            syncButton.style.background = 'rgba(245, 158, 11, 0.15)';
        } else if (hasRemoteChanges) {
            // Solo cambios remotos
            syncIcon.textContent = '📥';
            syncText.textContent = 'Hay cambios remotos';
            syncButton.title = 'Hay cambios disponibles para importar desde GitHub';
            syncButton.style.borderColor = '#3b82f6';
            syncButton.style.background = 'rgba(59, 130, 246, 0.1)';
        } else if (localChanges > 0) {
            // Solo cambios locales - dejar que github-sync-auto-export.js lo maneje
            if (window.GitHubSyncCounter) {
                // No hacer nada, el otro script ya lo maneja
            }
        } else {
            // Sin cambios - dejar que github-sync-ui.js lo maneje
            if (window.GitHubSyncUI) {
                window.GitHubSyncUI.updateButton();
            }
        }
    }

    /**
     * Resetea estado después de importar
     */
    function onImportComplete() {
        hasRemoteChanges = false;
        localStorage.removeItem(STORAGE_KEY);
        log('✅ Cambios remotos importados. Estado reseteado.');
        
        // Verificar inmediatamente por si hay más cambios
        setTimeout(checkRemoteChanges, 1000);
        
        updateButton();
    }

    /**
     * Fuerza una verificación inmediata
     */
    function forceCheck() {
        log('🔄 Verificación forzada');
        checkRemoteChanges();
    }

    /**
     * API pública
     */
    window.GitHubSyncImport = {
        hasChanges() {
            return hasRemoteChanges;
        },

        reset() {
            onImportComplete();
        },

        forceCheck,

        disable() {
            if (checkInterval) {
                clearInterval(checkInterval);
                log('🔇 Detector desactivado');
            }
        }
    };

    // Auto-inicialización
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(init, 1000);
        });
    } else {
        setTimeout(init, 1000);
    }
})();
