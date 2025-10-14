/* ===================================
   github-sync-ui.js - INTERFAZ SIMPLIFICADA
   Solo actualiza el botón y contador
   =================================== */

   (function() {
    'use strict';

    window.GitHubSyncUI = {
        /**
         * Actualiza el botón de sincronización
         */
        updateButton() {
            const btn = document.getElementById('githubSyncBtn');
            if (!btn) return;

            const status = window.GitHubSync.getStatus();
            const icon = btn.querySelector('.sync-icon');
            const text = btn.querySelector('.sync-text');

            // Limpiar clases
            btn.className = 'sync-btn';

            // Determinar estado
            if (status.isSyncing) {
                btn.classList.add('syncing');
                
                if (status.syncAction === 'export') {
                    btn.classList.add('uploading');
                    icon.textContent = '☁️↑';
                    text.textContent = 'Exportando...';
                } else if (status.syncAction === 'import') {
                    btn.classList.add('downloading');
                    icon.textContent = '☁️↓';
                    text.textContent = 'Importando...';
                } else if (status.syncAction === 'check') {
                    btn.classList.add('checking');
                    icon.textContent = '🔍';
                    text.textContent = 'Verificando...';
                }
            } else if (status.isConnected) {
                btn.classList.add('connected');
                icon.textContent = status.hasChanges ? '☁️●' : '☁️';
                text.textContent = status.hasChanges ? 'Pendiente' : `${status.nextCheckIn}s`;
                btn.title = status.hasChanges 
                    ? 'Cambios pendientes de exportar' 
                    : `Próxima verificación en ${status.nextCheckIn}s`;
            } else {
                btn.classList.add('disconnected');
                icon.textContent = '☁️';
                text.textContent = 'Sin conectar';
                btn.title = 'Haz clic para conectar con GitHub';
            }
        },

        /**
         * Renderiza el modal de conexión
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

        /**
         * Vista de conexión
         */
        getDisconnectedView() {
            return `
                <div class="sync-modal-header">
                    <h2>Sincronización Automática</h2>
                    <div class="sync-status-indicator disconnected">
                        <span>⚠️ No conectado</span>
                    </div>
                </div>

                <div class="sync-info-box">
                    <p>La sincronización automática:</p>
                    <ul>
                        <li>✅ Exporta tus cambios automáticamente</li>
                        <li>✅ Importa cambios de otros dispositivos</li>
                        <li>✅ Verifica cada 30 segundos</li>
                        <li>✅ Se activa cuando vuelves después de inactividad</li>
                    </ul>
                </div>

                <form class="sync-connect-form" id="githubConnectForm">
                    <div class="sync-form-group">
                        <label for="githubTokenInput">Token de GitHub</label>
                        <input 
                            type="password" 
                            id="githubTokenInput" 
                            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                            required
                        />
                        <div class="help-text">
                            Necesitas un Personal Access Token con permisos de <strong>gist</strong>.
                            <br>
                            <a href="https://github.com/settings/tokens/new?scopes=gist&description=FFTask%20Sync" target="_blank" rel="noopener">
                                Crear token aquí →
                            </a>
                        </div>
                    </div>
                    <button type="submit" class="primary" style="width: 100%;">
                        🔗 Conectar y Activar Auto-Sync
                    </button>
                </form>
            `;
        },

        /**
         * Vista conectada
         */
        getConnectedView(status) {
            return `
                <div class="sync-modal-header">
                    <h2>Sincronización Automática</h2>
                    <div class="sync-status-indicator connected">
                        <span>✅ Activa</span>
                    </div>
                </div>

                <div class="sync-status-info">
                    <div class="info-row">
                        <span class="info-label">Estado:</span>
                        <span class="info-value">${status.isSyncing ? '🔄 Sincronizando...' : '✅ Activo'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Próxima verificación:</span>
                        <span class="info-value">${status.nextCheckIn}s</span>
                    </div>
                    ${status.hasChanges ? `
                    <div class="info-row">
                        <span class="info-label">Cambios pendientes:</span>
                        <span class="info-value" style="color: #f59e0b;">⚠️ Se exportarán pronto</span>
                    </div>
                    ` : ''}
                </div>

                <div class="sync-info-box">
                    <h3>¿Cómo funciona?</h3>
                    <ul>
                        <li><strong>Exportación:</strong> Automática después de cada cambio</li>
                        <li><strong>Importación:</strong> Automática al detectar cambios remotos</li>
                        <li><strong>Verificación:</strong> Cada 30 segundos (si la app está visible)</li>
                        <li><strong>Después de inactividad:</strong> Verifica al volver</li>
                    </ul>
                </div>

                <button class="sync-option-btn danger" id="disconnectGithubBtn">
                    <span class="option-icon">🔌</span>
                    <div class="option-content">
                        <span class="option-title">Desconectar</span>
                        <span class="option-description">Desactivar sincronización automática</span>
                    </div>
                </button>
            `;
        },

        /**
         * Muestra estado de carga
         */
        showLoading(message = 'Procesando...') {
            const container = document.getElementById('githubSyncModalContent');
            if (!container) return;

            container.innerHTML = `
                <div class="sync-loading">
                    <div class="spinner"></div>
                    <span>${message}</span>
                </div>
            `;
        },

        /**
         * Muestra mensaje
         */
        showMessage(message, type = 'success') {
            const container = document.getElementById('githubSyncModalContent');
            if (!container) return;

            const icon = type === 'success' ? '✅' : '❌';
            const messageDiv = document.createElement('div');
            messageDiv.className = `sync-message ${type}`;
            messageDiv.innerHTML = `
                <span class="message-icon">${icon}</span>
                <span>${message}</span>
            `;

            container.insertBefore(messageDiv, container.firstChild);
            setTimeout(() => messageDiv.remove(), 5000);
        },

        /**
         * Abre el modal
         */
        openModal() {
            const modal = document.getElementById('githubSyncModal');
            if (!modal) return;

            this.renderModal();
            modal.classList.add('visible');
            modal.setAttribute('aria-hidden', 'false');
        },

        /**
         * Cierra el modal
         */
        closeModal() {
            const modal = document.getElementById('githubSyncModal');
            if (!modal) return;

            modal.classList.remove('visible');
            modal.setAttribute('aria-hidden', 'true');
        }
    };
})();