/* ===================================
   github-sync-events.js - MANEJO DE EVENTOS
   Event handlers para sincronización con GitHub
   =================================== */

   (function() {
    'use strict';

    /**
     * Inicializa todos los event listeners
     */
    function initEventListeners() {
        // Botón de sincronización en el header
        const syncBtn = document.getElementById('githubSyncBtn');
        if (syncBtn) {
            syncBtn.addEventListener('click', handleSyncButtonClick);
            console.log('GitHub Sync: Event listener agregado al botón');
        } else {
            console.warn('GitHub Sync: No se encontró el botón githubSyncBtn');
        }

        // Cerrar modal
        const closeBtn = document.getElementById('closeGithubSyncModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                window.GitHubSyncUI.closeModal();
            });
        }

        // Cerrar modal al hacer clic fuera
        const modal = document.getElementById('githubSyncModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    window.GitHubSyncUI.closeModal();
                }
            });
        }

        // Event delegation para botones dinámicos
        const modalContent = document.getElementById('githubSyncModalContent');
        if (modalContent) {
            modalContent.addEventListener('click', handleModalContentClick);
            modalContent.addEventListener('submit', handleFormSubmit);
        }
    }

    /**
     * Maneja el clic en el botón de sincronización del header
     */
    function handleSyncButtonClick() {
        console.log('GitHub Sync: Botón clickeado');
        window.GitHubSyncUI.openModal();
    }

    /**
     * Maneja clics en el contenido del modal (event delegation)
     */
    function handleModalContentClick(e) {
        const target = e.target.closest('button');
        if (!target) return;

        const btnId = target.id;

        switch (btnId) {
            case 'toggleAutoSyncBtn':
                handleToggleAutoSync();
                break;
            case 'exportToGistBtn':
                handleExportToGist();
                break;
            case 'importFromGistBtn':
                handleImportFromGist();
                break;
            case 'disconnectGithubBtn':
                handleDisconnect();
                break;
            case 'viewRemoteChangesBtn':
                handleViewRemoteChanges();
                break;
        }
    }

    /**
     * Maneja el envío de formularios (event delegation)
     */
    function handleFormSubmit(e) {
        if (e.target.id === 'githubConnectForm') {
            e.preventDefault();
            handleConnect();
        }
    }

    /**
     * Maneja la conexión con GitHub
     */
    async function handleConnect() {
        const tokenInput = document.getElementById('githubTokenInput');
        if (!tokenInput) return;

        const token = tokenInput.value.trim();

        if (!token) {
            window.GitHubSyncUI.showError('Por favor, ingresa un token válido');
            return;
        }

        window.GitHubSyncUI.showLoading('Conectando con GitHub y buscando backups...');

        try {
            await window.GitHubSync.connect(token);
            
            // Actualizar UI
            window.GitHubSyncUI.renderModalContent();
            window.GitHubSyncUI.updateSyncButton();
            
            // Mostrar mensaje según si se encontró un Gist existente
            const syncInfo = window.GitHubSync.getSyncInfo();
            if (syncInfo.hasGist) {
                // ✅ Verificar si hay cambios remotos al conectar
                if (syncInfo.hasRemoteChanges) {
                    window.GitHubSyncUI.showSuccess('¡Conectado! Hay un backup más reciente. Importa para actualizar.');
                } else {
                    window.GitHubSyncUI.showSuccess('¡Conectado! Se encontró un backup existente de FFTask.');
                }
            } else {
                window.GitHubSyncUI.showSuccess('¡Conectado exitosamente! No se encontraron backups previos.');
            }
        } catch (error) {
            window.GitHubSyncUI.renderModalContent();
            window.GitHubSyncUI.showError(`Error al conectar: ${error.message}`);
        }
    }

    /**
     * Maneja la exportación a Gist
     */
    async function handleExportToGist() {
        // ✅ Verificar si hay cambios remotos antes de exportar
        const syncInfo = window.GitHubSync.getSyncInfo();
        if (syncInfo.hasRemoteChanges || syncInfo.autoSyncBlocked) {
            const confirmed = await showConfirmDialog(
                '⚠️ Advertencia: Cambios Remotos Detectados',
                'Hay una versión más reciente en GitHub. Si exportas ahora, sobrescribirás esos cambios.\n\n¿Estás seguro de que quieres continuar?'
            );

            if (!confirmed) return;

            // Desbloquear exportación forzada
            window.GitHubSync.hasRemoteChanges = false;
            window.GitHubSync.autoSyncBlocked = false;
        } else {
            const confirmed = await showConfirmDialog(
                '¿Exportar datos a GitHub?',
                'Se creará o actualizará un backup privado en GitHub Gist con todos tus datos.'
            );

            if (!confirmed) return;
        }

        window.GitHubSyncUI.showLoading('Exportando datos a GitHub...');

        try {
            await window.GitHubSync.exportToGist();
            
            // Actualizar UI
            window.GitHubSyncUI.renderModalContent();
            window.GitHubSyncUI.updateSyncButton();
            window.GitHubSyncUI.showSuccess('¡Datos exportados exitosamente a GitHub!');
        } catch (error) {
            window.GitHubSyncUI.renderModalContent();
            window.GitHubSyncUI.showError(`Error al exportar: ${error.message}`);
        }
    }

    /**
     * Maneja la importación desde Gist
     */
    async function handleImportFromGist() {
        const confirmed = await showConfirmDialog(
            '¿Importar datos desde GitHub?',
            '⚠️ ADVERTENCIA: Esto reemplazará TODOS tus datos actuales con los del backup. Esta acción no se puede deshacer.'
        );

        if (!confirmed) return;

        window.GitHubSyncUI.showLoading('Importando datos desde GitHub...');

        try {
            await window.GitHubSync.importFromGist();
            
            // La página se recargará automáticamente después de importar
            window.GitHubSyncUI.showSuccess('¡Datos importados exitosamente! Recargando...');
        } catch (error) {
            window.GitHubSyncUI.renderModalContent();
            window.GitHubSyncUI.showError(`Error al importar: ${error.message}`);
        }
    }

    /**
     * Maneja activar/desactivar auto-sync
     */
    function handleToggleAutoSync() {
        window.GitHubSync.autoSyncEnabled = !window.GitHubSync.autoSyncEnabled;
        
        if (window.GitHubSync.autoSyncEnabled) {
            // ✅ Verificar cambios remotos antes de iniciar auto-sync
            window.GitHubSync.checkRemoteChanges().then(hasChanges => {
                if (!hasChanges) {
                    window.GitHubSync.startAutoSync();
                    window.GitHubSyncUI.renderModalContent();
                    window.GitHubSyncUI.showSuccess('Auto-sincronización activada ✅');
                } else {
                    window.GitHubSync.autoSyncEnabled = false;
                    window.GitHubSync.autoSyncBlocked = true;
                    window.GitHubSyncUI.renderModalContent();
                    window.GitHubSyncUI.showError('No se puede activar: hay cambios remotos. Importa primero.');
                }
            });
        } else {
            window.GitHubSync.stopAutoSync();
            window.GitHubSyncUI.renderModalContent();
            window.GitHubSyncUI.showSuccess('Auto-sincronización desactivada ⏸️');
        }
        
        window.GitHubSyncUI.updateSyncButton();
    }

    /**
     * Maneja la desconexión de GitHub
     */
    async function handleDisconnect() {
        const confirmed = await showConfirmDialog(
            '¿Desconectar de GitHub?',
            'Se eliminarán las credenciales de GitHub de este dispositivo. Tus backups en GitHub no se eliminarán.'
        );

        if (!confirmed) return;

        window.GitHubSync.disconnect();
        
        // Actualizar UI
        window.GitHubSyncUI.renderModalContent();
        window.GitHubSyncUI.updateSyncButton();
        window.GitHubSyncUI.showSuccess('Desconectado de GitHub');
    }

    /**
     * Maneja la visualización de cambios remotos
     */
    function handleViewRemoteChanges() {
        if (window.GitHubSync.remoteData) {
            window.GitHubSyncUI.showRemoteChangesModal(window.GitHubSync.remoteData);
        } else {
            window.GitHubSyncUI.showError('No hay cambios remotos para mostrar');
        }
    }

    /**
     * Muestra un diálogo de confirmación
     */
    function showConfirmDialog(title, message) {
        return new Promise((resolve) => {
            // Usar el sistema de confirmación existente de la app si está disponible
            if (window.App && window.App.ui && window.App.ui.showConfirm) {
                window.App.ui.showConfirm(message, title, (confirmed) => {
                    resolve(confirmed);
                });
            } else {
                // Fallback a confirm nativo
                resolve(confirm(`${title}\n\n${message}`));
            }
        });
    }

    // Inicializar inmediatamente o cuando el DOM esté listo
    function init() {
        initEventListeners();
        if (window.GitHubSyncUI) {
            window.GitHubSyncUI.updateSyncButton();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM ya está listo, inicializar inmediatamente
        init();
    }
})();