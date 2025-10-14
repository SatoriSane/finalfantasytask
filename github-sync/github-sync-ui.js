/* ===================================
   github-sync-ui.js - INTERFAZ DE USUARIO
   Renderizado de componentes de sincronización
   =================================== */

   (function() {
    'use strict';

    window.GitHubSyncUI = {
        /**
         * Actualiza el botón de estado en el header
         */
        updateSyncButton() {
            const btn = document.getElementById('githubSyncBtn');
            if (!btn) return;

            const syncInfo = window.GitHubSync.getSyncInfo();
            const icon = btn.querySelector('.sync-icon');
            const text = btn.querySelector('.sync-text');

            // Remover clases de estado previas
            btn.classList.remove('disconnected', 'connected', 'syncing', 'uploading', 'downloading', 'warning');

            if (syncInfo.isSyncing) {
                // Mostrando sincronización en progreso
                btn.classList.add('syncing');
                
                if (syncInfo.syncDirection === 'upload') {
                    btn.classList.add('uploading');
                    icon.textContent = '☁️↑';
                    text.textContent = 'Subiendo...';
                } else if (syncInfo.syncDirection === 'download') {
                    btn.classList.add('downloading');
                    icon.textContent = '☁️↓';
                    text.textContent = 'Bajando...';
                }
            } else if (syncInfo.hasRemoteChanges || syncInfo.autoSyncBlocked) {
                // ⚠️ ALERTA: Hay cambios remotos sin importar
                btn.classList.add('warning');
                icon.textContent = '⚠️';
                text.textContent = 'Importar primero';
                btn.title = 'Hay cambios remotos más recientes. Importa antes de continuar.';
            } else if (syncInfo.isConnected) {
                btn.classList.add('connected');
                icon.textContent = syncInfo.hasPendingChanges ? '☁️●' : '☁️';
                text.textContent = syncInfo.hasPendingChanges ? 'Pendiente' : 'Conectado';
                btn.title = syncInfo.hasPendingChanges ? 'Hay cambios pendientes de subir' : 'Sincronizado con GitHub';
            } else {
                btn.classList.add('disconnected');
                icon.textContent = '☁️';
                text.textContent = 'Sin conectar';
                btn.title = 'Conectar con GitHub para sincronizar';
            }
        },

        /**
         * Renderiza el contenido del modal según el estado
         */
        renderModalContent() {
            const container = document.getElementById('githubSyncModalContent');
            if (!container) return;

            const syncInfo = window.GitHubSync.getSyncInfo();

            if (syncInfo.isConnected) {
                container.innerHTML = this.getConnectedView(syncInfo);
            } else {
                container.innerHTML = this.getDisconnectedView();
            }
        },

        /**
         * Vista cuando está desconectado
         */
        getDisconnectedView() {
            return `
                <div class="sync-modal-header">
                    <h2>Sincronización con GitHub</h2>
                    <div class="sync-status-indicator disconnected">
                        <span>⚠️</span>
                        <span>No conectado</span>
                    </div>
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
                        🔗 Conectar con GitHub
                    </button>
                </form>
            `;
        },

        /**
         * Vista cuando está conectado
         */
        getConnectedView(syncInfo) {
            const autoSyncStatus = window.GitHubSync.autoSyncEnabled ? 'Activada' : 'Desactivada';
            const autoSyncIcon = window.GitHubSync.autoSyncEnabled ? '🟢' : '🔴';
            
            return `
                <div class="sync-modal-header">
                    <h2>Sincronización con GitHub</h2>
                    <div class="sync-status-indicator connected">
                        <span>✅</span>
                        <span>Conectado</span>
                    </div>
                </div>

                ${syncInfo.hasRemoteChanges || syncInfo.autoSyncBlocked ? `
                <div class="sync-alert-box warning">
                    <div class="alert-icon">⚠️</div>
                    <div class="alert-content">
                        <div class="alert-title">Cambios remotos detectados</div>
                        <div class="alert-message">
                            Hay una versión más reciente en GitHub desde otro dispositivo. 
                            <strong>Importa primero</strong> para evitar sobrescribir datos.
                        </div>
                    </div>
                    <button class="view-changes-btn" id="viewRemoteChangesBtn" style="margin-top: 10px;">
                        🔍 Ver qué cambió
                    </button>
                </div>
                ` : ''}

                <div class="sync-status-info">
                    <div class="info-row">
                        <span class="info-label">Auto-exportación:</span>
                        <span class="info-value">${autoSyncIcon} ${autoSyncStatus} ${syncInfo.autoSyncBlocked ? '(Bloqueada)' : ''}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Última sincronización:</span>
                        <span class="info-value">${syncInfo.lastSync}</span>
                    </div>
                    ${syncInfo.hasPendingChanges && !syncInfo.autoSyncBlocked ? `
                    <div class="info-row">
                        <span class="info-label">Estado:</span>
                        <span class="info-value" style="color: #f59e0b;">⚠️ Cambios pendientes</span>
                    </div>
                    ` : ''}
                    ${syncInfo.hasGist ? `
                    <div class="info-row">
                        <span class="info-label">Gist ID:</span>
                        <span class="info-value" style="font-size: 0.75rem; word-break: break-all;">${syncInfo.gistId}</span>
                    </div>
                    ` : ''}
                </div>

                <div class="sync-options">
                    <button class="sync-option-btn" id="toggleAutoSyncBtn">
                        <span class="option-icon">${window.GitHubSync.autoSyncEnabled ? '⏸️' : '▶️'}</span>
                        <div class="option-content">
                            <span class="option-title">${window.GitHubSync.autoSyncEnabled ? 'Desactivar' : 'Activar'} Auto-Sync</span>
                            <span class="option-description">Sincronización automática en momentos clave</span>
                        </div>
                    </button>

                    <button class="sync-option-btn" id="exportToGistBtn">
                        <span class="option-icon">☁️↑</span>
                        <div class="option-content">
                            <span class="option-title">Exportar ahora</span>
                            <span class="option-description">Forzar subida inmediata a GitHub</span>
                        </div>
                    </button>

                    ${syncInfo.hasGist ? `
                    <button class="sync-option-btn" id="importFromGistBtn">
                        <span class="option-icon">☁️↓</span>
                        <div class="option-content">
                            <span class="option-title">Importar ahora</span>
                            <span class="option-description">Forzar descarga desde GitHub</span>
                        </div>
                    </button>
                    ` : ''}

                    <button class="sync-option-btn danger" id="disconnectGithubBtn">
                        <span class="option-icon">🔌</span>
                        <div class="option-content">
                            <span class="option-title">Desconectar</span>
                            <span class="option-description">Eliminar credenciales de GitHub de este dispositivo</span>
                        </div>
                    </button>
                </div>
            `;
        },

        /**
         * Muestra un mensaje de carga
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
         * Muestra un mensaje de éxito
         */
        showSuccess(message) {
            const container = document.getElementById('githubSyncModalContent');
            if (!container) return;

            const messageDiv = document.createElement('div');
            messageDiv.className = 'sync-message success';
            messageDiv.innerHTML = `
                <span class="message-icon">✅</span>
                <span>${message}</span>
            `;

            container.insertBefore(messageDiv, container.firstChild);

            setTimeout(() => {
                messageDiv.remove();
            }, 5000);
        },

        /**
         * Muestra un mensaje de error
         */
        showError(message) {
            const container = document.getElementById('githubSyncModalContent');
            if (!container) return;

            const messageDiv = document.createElement('div');
            messageDiv.className = 'sync-message error';
            messageDiv.innerHTML = `
                <span class="message-icon">❌</span>
                <span>${message}</span>
            `;

            container.insertBefore(messageDiv, container.firstChild);

            setTimeout(() => {
                messageDiv.remove();
            }, 5000);
        },

        /**
         * Abre el modal de sincronización
         */
        openModal() {
            const modal = document.getElementById('githubSyncModal');
            if (!modal) {
                console.error('GitHub Sync: No se encontró el modal githubSyncModal');
                return;
            }

            console.log('GitHub Sync: Abriendo modal');
            this.renderModalContent();
            modal.classList.add('visible');
            modal.setAttribute('aria-hidden', 'false');
        },

        /**
         * Cierra el modal de sincronización
         */
        closeModal() {
            const modal = document.getElementById('githubSyncModal');
            if (!modal) return;

            console.log('GitHub Sync: Cerrando modal');
            modal.classList.remove('visible');
            modal.setAttribute('aria-hidden', 'true');
        },

        /**
         * Muestra modal con detalles de cambios remotos
         */
        showRemoteChangesModal(remoteData) {
            if (!remoteData) {
                console.warn('No hay datos remotos para mostrar');
                return;
            }

            const changes = window.GitHubSync.compareLocalWithRemote();
            if (!changes) {
                console.warn('No se pudieron comparar los datos');
                return;
            }

            const modal = document.getElementById('githubSyncModal');
            const container = document.getElementById('githubSyncModalContent');
            if (!modal || !container) return;

            // Formatear fecha
            const remoteDate = new Date(changes.timestamp.remote).toLocaleString('es-ES', {
                dateStyle: 'medium',
                timeStyle: 'short'
            });

            // Construir lista de cambios
            let changesHTML = '';
            if (changes.differences.length === 0) {
                changesHTML = '<p class="no-changes">No se detectaron diferencias específicas, pero la versión remota es más reciente.</p>';
            } else {
                changesHTML = '<ul class="changes-list">';
                changes.differences.forEach(diff => {
                    const icon = diff.type === 'added' ? '➕' : diff.type === 'deleted' ? '❌' : '🔄';
                    const color = diff.type === 'added' ? '#10b981' : diff.type === 'deleted' ? '#ef4444' : '#f59e0b';
                    changesHTML += `
                        <li style="border-left: 3px solid ${color};">
                            <span class="change-icon">${icon}</span>
                            <span class="change-description">${diff.description}</span>
                        </li>
                    `;
                });
                changesHTML += '</ul>';
            }

            container.innerHTML = `
                <div class="sync-modal-header">
                    <h2>⚠️ Cambios Remotos Detectados</h2>
                    <div class="sync-status-indicator warning">
                        <span>⚠️</span>
                        <span>Requiere acción</span>
                    </div>
                </div>

                <div class="sync-alert-box warning">
                    <div class="alert-icon">📡</div>
                    <div class="alert-content">
                        <div class="alert-title">Otro dispositivo actualizó la nube</div>
                        <div class="alert-message">
                            Se detectaron cambios en GitHub desde otro dispositivo el <strong>${remoteDate}</strong>.
                            Debes importar estos cambios antes de continuar trabajando para evitar pérdida de datos.
                        </div>
                    </div>
                </div>

                <div class="remote-changes-details">
                    <h3>Qué cambió en la nube:</h3>
                    ${changesHTML}
                </div>

                <div class="remote-changes-info">
                    <div class="info-row">
                        <span class="info-label">Dispositivo remoto:</span>
                        <span class="info-value" style="font-size: 0.75rem; word-break: break-all;">${changes.device.remote || 'Desconocido'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Fecha remota:</span>
                        <span class="info-value">${remoteDate}</span>
                    </div>
                </div>

                <div class="remote-changes-actions">
                    <button class="sync-action-btn primary" id="importRemoteChangesBtn">
                        <span class="option-icon">☁️↓</span>
                        <div class="option-content">
                            <span class="option-title">Importar Cambios</span>
                            <span class="option-description">Actualizar con los datos de la nube (recomendado)</span>
                        </div>
                    </button>

                    <button class="sync-action-btn secondary" id="ignoreRemoteChangesBtn">
                        <span class="option-icon">⏭️</span>
                        <div class="option-content">
                            <span class="option-title">Ignorar por Ahora</span>
                            <span class="option-description">Continuar sin importar (no recomendado)</span>
                        </div>
                    </button>
                </div>
            `;

            // Event listeners para los botones
            const importBtn = container.querySelector('#importRemoteChangesBtn');
            const ignoreBtn = container.querySelector('#ignoreRemoteChangesBtn');

            if (importBtn) {
                importBtn.addEventListener('click', async () => {
                    this.showLoading('Importando cambios desde GitHub...');
                    try {
                        await window.GitHubSync.importFromGist();
                        this.showSuccess('¡Datos importados exitosamente! Recargando...');
                    } catch (error) {
                        this.renderModalContent();
                        this.showError(`Error al importar: ${error.message}`);
                    }
                });
            }

            if (ignoreBtn) {
                ignoreBtn.addEventListener('click', () => {
                    // Solo cerrar el modal, mantener el bloqueo
                    this.closeModal();
                    // Mostrar notificación de advertencia
                    if (typeof window.showNotification === 'function') {
                        window.showNotification('⚠️ Advertencia: Hay cambios remotos sin importar. La sincronización automática está bloqueada.', 'warning');
                    }
                });
            }

            // Abrir el modal
            modal.classList.add('visible');
            modal.setAttribute('aria-hidden', 'false');
        }
    };
})();