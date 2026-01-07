/* ===================================
   github-sync-ui.js - INTERFAZ MANUAL
   Maneja el modal y el botón de sincronización.
   =================================== */

   (function() {
    'use strict';

    // Cache de elementos del DOM
    let syncButton, syncIcon, syncText;

    /**
     * Busca y prepara los elementos del DOM una vez.
     */
    function initializeDOMElements() {
        syncButton = document.getElementById('githubSyncBtn');
        if (syncButton) {
            syncIcon = syncButton.querySelector('.sync-icon');
            syncText = syncButton.querySelector('.sync-text');
        }
    }
    
    // Ejecutar al cargar el DOM
    document.addEventListener('DOMContentLoaded', initializeDOMElements);

    window.GitHubSyncUI = {
        /**
         * Actualiza el botón de sincronización.
         */
        updateButton() {
            if (!syncButton) {
                initializeDOMElements();
                if (!syncButton) return;
            }

            const status = window.GitHubSync.getStatus();
            
            syncButton.className = 'sync-btn'; // Limpiar clases

            if (status.isSyncing) {
                syncButton.classList.add('syncing');

                if (status.syncAction === 'export') {
                    syncButton.classList.add('uploading');
                    syncIcon.textContent = '📤';
                    syncText.textContent = 'Exportando';
                } else if (status.syncAction === 'import') {
                    syncButton.classList.add('downloading');
                    syncIcon.textContent = '📥';
                    syncText.textContent = 'Importando';
                }
            } else if (status.isConnected) {
                syncButton.classList.add('connected');
                syncIcon.textContent = '✓';
                syncText.textContent = 'Sincronizado';
                syncButton.title = status.lastSync > 0 
                    ? `Última sync hace ${status.timeSinceSync}s` 
                    : 'Conectado - Click para sincronizar';
            } else {
                syncButton.classList.add('disconnected');
                syncIcon.textContent = '🔗';
                syncText.textContent = 'Conectar';
                syncButton.title = 'Haz clic para conectar con GitHub';
            }
        },

        /**
         * Renderiza el contenido del modal de conexión
         */
        renderModal() {
            const container = document.getElementById('githubSyncModalContent');
            if (!container) return;

            const status = window.GitHubSync.getStatus();

            if (status.isConnected) {
                container.innerHTML = this.getConnectedView(status);
            } else {
                container.innerHTML = this.getDisconnectedView();
            }
        },

        getDisconnectedView() {
            return `
                <div class="sync-modal-header">
                    <h2>Sincronización con GitHub Gist</h2>
                    <div class="sync-status-indicator disconnected">
                        <span>⚠️ No conectado</span>
                    </div>
                </div>
                <div class="sync-info-box">
                    <p><strong>Sincronización manual</strong> entre todos tus dispositivos usando un Gist privado de GitHub.</p>
                    <ul style="margin-top: 0.75rem; font-size: 0.9rem;">
                        <li>📤 <strong>Exportar:</strong> Guarda tus datos en GitHub cuando quieras</li>
                        <li>📥 <strong>Importar:</strong> Descarga datos desde GitHub cuando quieras</li>
                        <li>🔒 Datos seguros en tu cuenta de GitHub</li>
                        <li>✅ Control total sobre la sincronización</li>
                    </ul>
                </div>
                <form class="sync-connect-form" id="githubConnectForm">
                    <div class="sync-form-group">
                        <label for="githubTokenInput">Personal Access Token de GitHub</label>
                        <input type="password" id="githubTokenInput" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" required />
                        <div class="help-text">
                            Necesitas un token con permisos de <strong>gist</strong>.
                            <a href="https://github.com/settings/tokens/new?scopes=gist&description=FFTask%20Sync" target="_blank" rel="noopener">
                                Crear token aquí →
                            </a>
                            <br><small style="opacity: 0.8;">💡 Consejo: Selecciona "No expiration" para que no caduque.</small>
                        </div>
                    </div>
                    <button type="submit" class="primary" style="width: 100%;">🔗 Conectar</button>
                </form>
            `;
        },

        getConnectedView(status) {
            const lastSyncText = status.lastSync > 0 
                ? `Hace ${status.timeSinceSync}s` 
                : 'Nunca';
            
            // Detectar si hay cambios para importar o exportar
            const hasRemoteChanges = window.GitHubSyncImport?.hasChanges() || false;
            const localChanges = window.GitHubSyncCounter?.getCount() || 0;
            const hasLocalChanges = localChanges > 0;
            
            // Clases para los botones
            const importClass = hasRemoteChanges ? 'sync-action-btn has-changes' : 'sync-action-btn';
            const exportClass = hasLocalChanges ? 'sync-action-btn success has-changes' : 'sync-action-btn success';
            
            return `
                <div class="sync-modal-header">
                    <h2>Sincronización con GitHub Gist</h2>
                    <div class="sync-status-indicator connected">
                        <span>✅ Conectado</span>
                    </div>
                </div>
                <div class="sync-status-info">
                    <div class="info-row">
                        <span class="info-label">Estado:</span>
                        <span class="info-value">${status.isSyncing ? '🔄 Sincronizando...' : 'Listo'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Última sincronización:</span>
                        <span class="info-value">${lastSyncText}</span>
                    </div>
                </div>
                
                <div class="sync-actions" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1.5rem 0;">
                    <button class="${importClass}" id="importFromGistBtn" ${status.isSyncing ? 'disabled' : ''}>
                        <span style="font-size: 1.5rem;">📥</span>
                        <span style="font-weight: 600;">Importar</span>
                        <span style="font-size: 0.85rem; opacity: 0.9;">Descargar desde GitHub</span>
                        ${hasRemoteChanges ? '<span class="changes-badge">Cambios disponibles</span>' : ''}
                    </button>
                    <button class="${exportClass}" id="exportToGistBtn" ${status.isSyncing ? 'disabled' : ''}>
                        <span style="font-size: 1.5rem;">📤</span>
                        <span style="font-weight: 600;">Exportar</span>
                        <span style="font-size: 0.85rem; opacity: 0.9;">Guardar en GitHub</span>
                        ${hasLocalChanges ? `<span class="changes-badge">${localChanges} cambios</span>` : ''}
                    </button>
                </div>
                
                <div class="sync-info-box" style="margin-top: 1rem;">
                    <p style="font-size: 0.9rem; opacity: 0.9;">
                        <strong>💡 Consejo:</strong> Exporta después de hacer cambios importantes. 
                        Importa al abrir la app en otro dispositivo.
                    </p>
                </div>
                
                <button class="sync-option-btn danger" id="disconnectGithubBtn" style="margin-top: 1rem;">
                    <span class="option-icon">🔌</span>
                    <div class="option-content">
                        <span class="option-title">Desconectar</span>
                        <span class="option-description">Desactivar sincronización con GitHub</span>
                    </div>
                </button>
            `;
        },

        showLoading(message = 'Procesando...') {
            const container = document.getElementById('githubSyncModalContent');
            if (!container) return;
            container.innerHTML = `<div class="sync-loading"><div class="spinner"></div><span>${message}</span></div>`;
        },

        openModal() {
            const modal = document.getElementById('githubSyncModal');
            if (modal) {
                this.renderModal();
                modal.classList.add('visible');
                modal.setAttribute('aria-hidden', 'false');
            }
        },

        closeModal() {
            const modal = document.getElementById('githubSyncModal');
            if (modal) {
                modal.classList.remove('visible');
                modal.setAttribute('aria-hidden', 'true');
            }
        }
    };
})();

