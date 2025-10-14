/* ===================================
   github-sync-events.js - EVENTOS SIMPLIFICADOS
   Solo maneja conexión/desconexión
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
            window.GitHubSyncUI.showMessage('¡Conectado! Sincronización automática activada', 'success');
            window.GitHubSyncUI.updateButton();
            
            // Iniciar escucha de cambios de la app
            window.GitHubSync.listenToAppChanges();
        } catch (error) {
            window.GitHubSyncUI.renderModal();
            window.GitHubSyncUI.showMessage(`Error: ${error.message}`, 'error');
        }
    }

    /**
     * Desconectar
     */
    async function handleDisconnect() {
        if (!confirm('¿Desactivar la sincronización automática?')) {
            return;
        }

        window.GitHubSync.disconnect();
        window.GitHubSyncUI.renderModal();
        window.GitHubSyncUI.showMessage('Sincronización desactivada', 'success');
        window.GitHubSyncUI.updateButton();
    }

    // Inicializar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEventListeners);
    } else {
        initEventListeners();
    }
})();