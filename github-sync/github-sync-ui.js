/* ===================================
   github-sync-ui.js - INTERFAZ MEJORADA
   Maneja el modal y el botón con barra de progreso.
   =================================== */

   (function() {
    'use strict';

    // Cache de elementos del DOM
    let syncButton, syncIcon, syncText, syncProgressBar;

    const TIMING = {
        CHECK_INTERVAL_S: 30, // Debe coincidir con el de github-sync-state.js
    };

    /**
     * Busca y prepara los elementos del DOM una vez.
     */
    function initializeDOMElements() {
        syncButton = document.getElementById('githubSyncBtn');
        if (syncButton) {
            syncIcon = syncButton.querySelector('.sync-icon');
            syncText = syncButton.querySelector('.sync-text');
            // Crear y añadir la barra de progreso si no existe
            if (!syncButton.querySelector('.sync-progress-bar')) {
                syncProgressBar = document.createElement('div');
                syncProgressBar.className = 'sync-progress-bar';
                syncButton.appendChild(syncProgressBar);
            } else {
                syncProgressBar = syncButton.querySelector('.sync-progress-bar');
            }
        }
    }
    
    // Ejecutar al cargar el DOM
    document.addEventListener('DOMContentLoaded', initializeDOMElements);

    window.GitHubSyncUI = {
        /**
         * Actualiza el botón de sincronización con la nueva barra de progreso.
         */
        updateButton() {
            if (!syncButton) {
                initializeDOMElements(); // Intenta inicializar de nuevo si falló
                if (!syncButton) return;
            }

            const status = window.GitHubSync.getStatus();
            
            syncButton.className = 'sync-btn'; // Limpiar clases

            // ⭐ PRIORIDAD: Mostrar cuando UI está bloqueada por importación prioritaria
            if (status.uiBlocked) {
                syncButton.classList.add('syncing', 'priority');
                syncProgressBar.style.width = '0%';
                syncIcon.textContent = '🚨';
                syncText.textContent = 'Importando...';
                syncButton.title = 'Importando datos actualizados antes de permitir cambios';
            } else if (status.isSyncing) {
                syncButton.classList.add('syncing');
                syncProgressBar.style.width = '0%'; // Ocultar barra durante la acción

                if (status.syncAction === 'export') {
                    syncButton.classList.add('uploading');
                    syncIcon.textContent = '📤';
                    syncText.textContent = 'Exportando';
                } else if (status.syncAction === 'import') {
                    syncButton.classList.add('downloading');
                    syncIcon.textContent = '📥';
                    syncText.textContent = 'Importando';
                } else if (status.syncAction === 'check') {
                    syncButton.classList.add('checking');
                    syncIcon.textContent = '🔍';
                    syncText.textContent = 'Verificando';
                }
            } else if (status.isConnected) {
                syncButton.classList.add('connected');
                syncIcon.textContent = status.hasChanges ? '●' : '✓';
                syncText.textContent = status.hasChanges ? 'Pendiente' : 'Sincronizado';
                
                // --- LÓGICA DE LA BARRA DE PROGRESO ---
                const progressPercentage = (status.nextCheckIn / TIMING.CHECK_INTERVAL_S) * 100;
                syncProgressBar.style.width = `${Math.max(0, progressPercentage)}%`;
                
                syncButton.title = status.hasChanges 
                    ? 'Cambios pendientes de exportar' 
                    : `Próxima verificación en ${status.nextCheckIn}s`;

            } else {
                syncButton.classList.add('disconnected');
                syncIcon.textContent = '🔗';
                syncText.textContent = 'Conectar';
                syncProgressBar.style.width = '0%'; // Ocultar si no está conectado
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
                    <h2>Sincronización Automática</h2>
                    <div class="sync-status-indicator disconnected">
                        <span>⚠️ No conectado</span>
                    </div>
                </div>
                <div class="sync-info-box">
                    <p><strong>Sincronización en tiempo real</strong> entre todos tus dispositivos usando un Gist privado de GitHub.</p>
                    <ul style="margin-top: 0.75rem; font-size: 0.9rem;">
                        <li>⚡ Exportación instantánea al hacer cambios</li>
                        <li>🚨 Importación prioritaria al iniciar la app</li>
                        <li>🔒 Datos seguros en tu cuenta de GitHub</li>
                        <li>🔄 Sin pérdida de datos ni conflictos</li>
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
                    <button type="submit" class="primary" style="width: 100%;">🔗 Conectar y Activar</button>
                </form>
            `;
        },

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
                        <span class="info-value">${status.isSyncing ? '🔄 Sincronizando...' : 'Activo'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Próxima verificación:</span>
                        <span class="info-value">${status.nextCheckIn}s</span>
                    </div>
                    ${status.hasChanges ? `
                    <div class="info-row">
                        <span class="info-label">Cambios pendientes:</span>
                        <span class="info-value" style="color: #f59e0b;">⚡ Exportando ahora...</span>
                    </div>` : ''}
                </div>
                <div class="sync-info-box">
                    <h3>¿Cómo funciona?</h3>
                    <ul>
                        <li><strong>Exportación:</strong> ⚡ INSTANTÁNEA al hacer cualquier cambio.</li>
                        <li><strong>Importación:</strong> 🚨 PRIORITARIA al iniciar o volver a la app (antes de permitir cambios).</li>
                        <li><strong>Verificación:</strong> Cada 30s durante uso activo.</li>
                        <li><strong>Protección:</strong> Si el token expira, se desconecta automáticamente y te avisa.</li>
                    </ul>
                </div>
                <button class="sync-option-btn danger" id="disconnectGithubBtn">
                    <span class="option-icon">🔌</span>
                    <div class="option-content">
                        <span class="option-title">Desconectar</span>
                        <span class="option-description">Desactivar la sincronización automática.</span>
                    </div>
                </button>
            `;
        },

        showLoading(message = 'Procesando...') {
            const container = document.getElementById('githubSyncModalContent');
            if (!container) return;
            container.innerHTML = `<div class="sync-loading"><div class="spinner"></div><span>${message}</span></div>`;
        },

        showMessage(message, type = 'success') {
            const container = document.getElementById('githubSyncModalContent');
            if (!container) return;

            const icon = type === 'success' ? '✅' : '❌';
            const messageDiv = document.createElement('div');
            messageDiv.className = `sync-message ${type}`;
            messageDiv.innerHTML = `<span class="message-icon">${icon}</span><span>${message}</span>`;

            container.insertBefore(messageDiv, container.firstChild);
            setTimeout(() => messageDiv.remove(), 5000);
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

