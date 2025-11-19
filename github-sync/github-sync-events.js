/* ===================================
   github-sync-events.js - EVENTOS MANUALES
   Maneja conexión, desconexión, importar y exportar
   =================================== */

   (function() {
    'use strict';

    /**
     * Inicializa event listeners
     */
    function initEventListeners() {
        // Botón principal - abrir modal
        document.getElementById('githubSyncBtn')?.addEventListener('click', () => {
            window.GitHubSyncUI.openModal();
        });

        // Cerrar modal
        const modal = document.getElementById('githubSyncModal');
        modal?.addEventListener('click', (e) => {
            if (e.target.id === 'githubSyncModal' || e.target.closest('.modal-close-btn')) {
                window.GitHubSyncUI.closeModal();
            }
        });

        // Delegación de eventos para contenido dinámico
        document.getElementById('githubSyncModalContent')?.addEventListener('click', handleModalClick);
        document.getElementById('githubSyncModalContent')?.addEventListener('submit', handleFormSubmit);
    }

    /**
     * Maneja clicks en el modal
     */
    async function handleModalClick(e) {
        const target = e.target.closest('button');
        if (!target) return;

        if (target.id === 'disconnectGithubBtn') {
            e.preventDefault();
            await handleDisconnect();
        } else if (target.id === 'importFromGistBtn') {
            e.preventDefault();
            await handleImport();
        } else if (target.id === 'exportToGistBtn') {
            e.preventDefault();
            await handleExport();
        }
    }

    /**
     * Maneja envío del formulario de conexión
     */
    async function handleFormSubmit(e) {
        if (e.target.id !== 'githubConnectForm') return;
        
        e.preventDefault();
        
        const token = document.getElementById('githubTokenInput')?.value?.trim();
        
        if (!token) {
            window.GitHubSyncUI.showMessage('Ingresa un token válido', 'error');
            return;
        }

        window.GitHubSyncUI.showLoading('Conectando con GitHub...');

        try {
            await window.GitHubSync.connect(token);
            
            window.GitHubSyncUI.renderModal();
            window.GitHubSyncUI.showMessage('¡Conectado! Usa los botones para sincronizar', 'success');
            window.GitHubSyncUI.updateButton();
        } catch (error) {
            window.GitHubSyncUI.renderModal();
            window.GitHubSyncUI.showMessage(`Error: ${error.message}`, 'error');
        }
    }

    /**
     * Importar desde Gist
     */
    async function handleImport() {
        window.GitHubSyncUI.showLoading('Importando desde GitHub...');

        try {
            await window.GitHubSync.importFromGist();
            
            // Resetear detector de cambios remotos
            if (window.GitHubSyncImport) {
                window.GitHubSyncImport.reset();
            }
            
            // Si llega aquí, no hubo cambios o hubo error
            // Si hubo cambios, la página ya se recargó
            window.GitHubSyncUI.renderModal();
            window.GitHubSyncUI.updateButton();
        } catch (error) {
            window.GitHubSyncUI.renderModal();
            window.GitHubSyncUI.showMessage(`Error al importar: ${error.message}`, 'error');
        }
    }

    /**
     * Exportar a Gist
     */
    async function handleExport() {
        window.GitHubSyncUI.showLoading('Exportando a GitHub...');

        try {
            await window.GitHubSync.exportToGist();
            
            // Resetear contador de cambios
            if (window.GitHubSyncCounter) {
                window.GitHubSyncCounter.reset();
            }
            
            window.GitHubSyncUI.renderModal();
            window.GitHubSyncUI.showMessage('✅ Datos exportados correctamente', 'success');
            window.GitHubSyncUI.updateButton();
        } catch (error) {
            window.GitHubSyncUI.renderModal();
            window.GitHubSyncUI.showMessage(`Error al exportar: ${error.message}`, 'error');
        }
    }

    /**
     * Desconectar
     */
    async function handleDisconnect() {
        if (!confirm('¿Desconectar GitHub Sync?')) {
            return;
        }

        window.GitHubSync.disconnect();
        window.GitHubSyncUI.renderModal();
        window.GitHubSyncUI.showMessage('Desconectado de GitHub', 'success');
        window.GitHubSyncUI.updateButton();
    }

    // Inicializar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEventListeners);
    } else {
        initEventListeners();
    }
})();