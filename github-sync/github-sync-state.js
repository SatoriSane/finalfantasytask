/* ===================================
   github-sync-state.js - GESTIÓN DE ESTADO
   Manejo de autenticación y sincronización con GitHub Gist
   =================================== */

   (function() {
    'use strict';

    const STORAGE_KEY = 'fftask_github_token';
    const GIST_ID_KEY = 'fftask_gist_id';
    const LAST_SYNC_KEY = 'fftask_last_sync';
    const LAST_EXPORT_KEY = 'fftask_last_export';
    const PENDING_CHANGES_KEY = 'fftask_pending_changes';
    const DEVICE_ID_KEY = 'fftask_device_id';

    // Configuración de auto-sync
    const AUTO_SYNC_CONFIG = {
        EXPORT_INTERVAL: 5 * 60 * 1000, // 5 minutos
        CHECK_REMOTE_INTERVAL: 30 * 1000, // 30 segundos - verificar cambios remotos (más rápido)
        DEBOUNCE_DELAY: 2000, // 2 segundos para agrupar cambios
        POST_EXPORT_PAUSE: 10000, // 10 segundos de pausa después de exportar
        INITIAL_CHECK_DELAY: 1000 // 1 segundo - verificación inicial al cargar
    };

    // Estado global de sincronización
    window.GitHubSync = {
        token: null,
        gistId: null,
        lastSync: null,
        lastExport: null,
        deviceId: null, // ID único del dispositivo
        isConnected: false,
        isSyncing: false,
        syncDirection: null, // 'upload' | 'download' | null
        hasPendingChanges: false,
        hasRemoteChanges: false, // Hay cambios remotos más recientes
        remoteData: null, // Datos remotos para comparación
        autoSyncEnabled: true,
        autoSyncBlocked: false, // Bloquear auto-sync hasta importar
        skipNextRemoteCheck: false, // Saltar próxima verificación (post-export)
        debounceTimer: null,
        intervalTimer: null,
        checkRemoteTimer: null, // Timer para verificar cambios remotos

        /**
         * Inicializa el sistema de sincronización
         */
        init() {
            this.ensureDeviceId();
            this.loadStoredCredentials();
            console.log('GitHub Sync inicializado:', this.isConnected ? 'Conectado' : 'Desconectado');
        },

        /**
         * Asegura que exista un ID único para este dispositivo
         */
        ensureDeviceId() {
            this.deviceId = localStorage.getItem(DEVICE_ID_KEY);
            if (!this.deviceId) {
                // Generar ID único: timestamp + random
                this.deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                localStorage.setItem(DEVICE_ID_KEY, this.deviceId);
                console.log('Nuevo Device ID generado:', this.deviceId);
            } else {
                console.log('Device ID cargado:', this.deviceId);
            }
        },

        /**
         * Carga las credenciales almacenadas en localStorage
         */
        loadStoredCredentials() {
            this.token = localStorage.getItem(STORAGE_KEY);
            this.gistId = localStorage.getItem(GIST_ID_KEY);
            this.lastSync = localStorage.getItem(LAST_SYNC_KEY);
            this.lastExport = localStorage.getItem(LAST_EXPORT_KEY);
            this.hasPendingChanges = localStorage.getItem(PENDING_CHANGES_KEY) === 'true';
            this.isConnected = !!this.token;

            // Iniciar auto-sync si está conectado
            if (this.isConnected && this.autoSyncEnabled) {
                // ✅ Verificar cambios remotos INMEDIATAMENTE al cargar (con pequeño delay para no bloquear UI)
                setTimeout(() => {
                    this.checkRemoteChanges().then(() => {
                        if (!this.hasRemoteChanges) {
                            this.startAutoSync();
                        } else {
                            console.warn('Auto-sync bloqueado: hay cambios remotos pendientes de importar');
                            this.autoSyncBlocked = true;
                            this.updateSyncUI();
                            this.showRemoteChangesModal();
                        }
                    });
                }, AUTO_SYNC_CONFIG.INITIAL_CHECK_DELAY);
            }
        },

        /**
         * Conecta con GitHub usando un token personal
         * @param {string} token - Token de GitHub
         * @returns {Promise<boolean>}
         */
        async connect(token) {
            if (!token || token.trim() === '') {
                throw new Error('El token no puede estar vacío');
            }

            // Validar el token haciendo una petición a la API
            try {
                const response = await fetch('https://api.github.com/user', {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Token inválido o sin permisos');
                }

                // Guardar el token
                this.token = token;
                localStorage.setItem(STORAGE_KEY, token);
                this.isConnected = true;

                // Buscar automáticamente el Gist de FFTask existente
                await this.findExistingGist();

                // Verificar si hay cambios remotos
                await this.checkRemoteChanges();

                // Iniciar auto-sync solo si no hay cambios remotos
                if (this.autoSyncEnabled && !this.hasRemoteChanges) {
                    this.startAutoSync();
                } else if (this.hasRemoteChanges) {
                    console.warn('Auto-sync bloqueado: hay cambios remotos pendientes de importar');
                    this.autoSyncBlocked = true;
                    this.showRemoteChangesModal();
                }

                console.log('Conectado exitosamente a GitHub');
                return true;
            } catch (error) {
                console.error('Error al conectar con GitHub:', error);
                throw error;
            }
        },

        /**
         * Busca un Gist existente de FFTask para este usuario
         * @returns {Promise<void>}
         */
        async findExistingGist() {
            try {
                const response = await fetch('https://api.github.com/gists', {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

                if (!response.ok) {
                    console.warn('No se pudieron obtener los Gists del usuario');
                    return;
                }

                const gists = await response.json();
                
                // Buscar un Gist que contenga el archivo fftask-backup.json
                const fftaskGist = gists.find(gist => 
                    gist.files && gist.files['fftask-backup.json']
                );

                if (fftaskGist) {
                    this.gistId = fftaskGist.id;
                    localStorage.setItem(GIST_ID_KEY, fftaskGist.id);
                    console.log('Gist de FFTask encontrado:', fftaskGist.id);
                } else {
                    console.log('No se encontró un Gist existente de FFTask');
                }
            } catch (error) {
                console.warn('Error al buscar Gist existente:', error);
                // No lanzar error, solo advertir
            }
        },

        /**
         * Verifica si hay cambios remotos más recientes de OTRO dispositivo
         * @returns {Promise<boolean>}
         */
        async checkRemoteChanges() {
            if (!this.isConnected || !this.gistId) {
                this.hasRemoteChanges = false;
                this.remoteData = null;
                return false;
            }

            try {
                const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

                if (!response.ok) {
                    this.hasRemoteChanges = false;
                    this.remoteData = null;
                    return false;
                }

                const gist = await response.json();
                const fileContent = gist.files['fftask-backup.json']?.content;
                
                if (!fileContent) {
                    this.hasRemoteChanges = false;
                    this.remoteData = null;
                    return false;
                }

                const remoteBackup = JSON.parse(fileContent);
                const remoteDeviceId = remoteBackup.deviceId;
                const remoteTimestamp = new Date(remoteBackup.timestamp).getTime();
                const localTimestamp = this.lastExport ? new Date(this.lastExport).getTime() : 0;

                // ✅ CLAVE: Solo considerar cambios remotos si vienen de OTRO dispositivo
                const isDifferentDevice = remoteDeviceId !== this.deviceId;
                const isNewer = remoteTimestamp > localTimestamp + 5000; // 5 segundos de margen

                this.hasRemoteChanges = isDifferentDevice && isNewer;

                if (this.hasRemoteChanges) {
                    this.remoteData = remoteBackup;
                    console.warn('⚠️ Cambios remotos detectados de OTRO dispositivo');
                    console.log('Remote Device:', remoteDeviceId);
                    console.log('Local Device:', this.deviceId);
                    console.log('Remote Time:', new Date(remoteTimestamp).toISOString());
                    console.log('Local Time:', new Date(localTimestamp).toISOString());
                } else {
                    this.remoteData = null;
                    if (isDifferentDevice === false && isNewer) {
                        console.log('✅ Cambio remoto ignorado: mismo dispositivo');
                    }
                }

                return this.hasRemoteChanges;
            } catch (error) {
                console.error('Error al verificar cambios remotos:', error);
                this.hasRemoteChanges = false;
                this.remoteData = null;
                return false;
            }
        },

        /**
         * Desconecta de GitHub y elimina las credenciales
         */
        disconnect() {
            // Detener auto-sync
            this.stopAutoSync();

            this.token = null;
            this.gistId = null;
            this.lastSync = null;
            this.lastExport = null;
            this.isConnected = false;
            this.hasPendingChanges = false;
            this.hasRemoteChanges = false;
            this.autoSyncBlocked = false;

            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(GIST_ID_KEY);
            localStorage.removeItem(LAST_SYNC_KEY);
            localStorage.removeItem(LAST_EXPORT_KEY);
            localStorage.removeItem(PENDING_CHANGES_KEY);

            console.log('Desconectado de GitHub');
        },

        /**
         * Exporta todos los datos de la app a un Gist
         * @returns {Promise<object>}
         */
        async exportToGist() {
            if (!this.isConnected) {
                throw new Error('No estás conectado a GitHub');
            }

            try {
                // Recopilar todos los datos de la app
                const appData = this.collectAppData();
                
                // Agregar Device ID al backup
                appData.deviceId = this.deviceId;
                
                // Crear o actualizar el Gist
                const gistData = {
                    description: `FFTask Backup - ${new Date().toLocaleString('es-ES')}`,
                    public: false,
                    files: {
                        'fftask-backup.json': {
                            content: JSON.stringify(appData, null, 2)
                        }
                    }
                };

                let response;
                if (this.gistId) {
                    // Actualizar Gist existente
                    response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `token ${this.token}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(gistData)
                    });
                } else {
                    // Crear nuevo Gist
                    response = await fetch('https://api.github.com/gists', {
                        method: 'POST',
                        headers: {
                            'Authorization': `token ${this.token}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(gistData)
                    });
                }

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Error al crear/actualizar el Gist');
                }

                const result = await response.json();
                
                // Guardar el ID del Gist
                this.gistId = result.id;
                localStorage.setItem(GIST_ID_KEY, result.id);
                
                // ✅ Actualizar AMBOS timestamps: lastSync Y lastExport
                const now = new Date().toISOString();
                this.lastSync = now;
                this.lastExport = now;
                localStorage.setItem(LAST_SYNC_KEY, now);
                localStorage.setItem(LAST_EXPORT_KEY, now);

                // ✅ Limpiar cambios pendientes
                this.hasPendingChanges = false;
                localStorage.setItem(PENDING_CHANGES_KEY, 'false');

                // ✅ Pausar verificación remota por 10 segundos después de exportar
                this.skipNextRemoteCheck = true;
                setTimeout(() => {
                    this.skipNextRemoteCheck = false;
                    console.log('Verificación remota reactivada');
                }, AUTO_SYNC_CONFIG.POST_EXPORT_PAUSE);

                // Limpiar datos remotos guardados
                this.remoteData = null;

                console.log('Datos exportados exitosamente al Gist:', result.id);
                return result;
            } catch (error) {
                console.error('Error al exportar a Gist:', error);
                throw error;
            }
        },

        /**
         * Importa datos desde un Gist
         * @param {boolean} autoReload - Si debe recargar la página automáticamente
         * @returns {Promise<object>}
         */
        async importFromGist(autoReload = true) {
            if (!this.isConnected) {
                throw new Error('No estás conectado a GitHub');
            }

            if (!this.gistId) {
                throw new Error('No hay un Gist asociado. Primero debes exportar datos.');
            }

            try {
                const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

                if (!response.ok) {
                    throw new Error('No se pudo obtener el Gist');
                }

                const gist = await response.json();
                const fileContent = gist.files['fftask-backup.json']?.content;

                if (!fileContent) {
                    throw new Error('El Gist no contiene datos válidos');
                }

                const appData = JSON.parse(fileContent);
                
                // Restaurar los datos en la app
                this.restoreAppData(appData, autoReload);

                // ✅ Actualizar AMBOS timestamps después de importar
                const now = new Date().toISOString();
                this.lastSync = now;
                this.lastExport = now; // Marcar como si acabáramos de exportar
                localStorage.setItem(LAST_SYNC_KEY, now);
                localStorage.setItem(LAST_EXPORT_KEY, now);

                // ✅ Desbloquear auto-sync después de importar
                this.hasRemoteChanges = false;
                this.autoSyncBlocked = false;
                this.remoteData = null;

                // ✅ Iniciar auto-sync si estaba bloqueado
                if (this.autoSyncEnabled && !this.intervalTimer) {
                    this.startAutoSync();
                }

                console.log('Datos importados exitosamente desde el Gist');
                return appData;
            } catch (error) {
                console.error('Error al importar desde Gist:', error);
                throw error;
            }
        },

        /**
         * Recopila todos los datos de la app para exportar
         * @returns {object}
         */
        collectAppData() {
            const data = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                data: {}
            };

            // Claves a excluir del backup
            const excludeKeys = [STORAGE_KEY, GIST_ID_KEY, LAST_SYNC_KEY, LAST_EXPORT_KEY, PENDING_CHANGES_KEY];

            // Recopilar todos los datos del localStorage excepto credenciales de sync
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                
                if (!excludeKeys.includes(key)) {
                    try {
                        const value = localStorage.getItem(key);
                        data.data[key] = value;
                    } catch (error) {
                        console.warn(`No se pudo recopilar el dato: ${key}`, error);
                    }
                }
            }

            return data;
        },

        /**
         * Restaura los datos de la app desde un backup
         * @param {object} appData - Datos a restaurar
         * @param {boolean} autoReload - Si debe recargar la página automáticamente
         */
        restoreAppData(appData, autoReload = true) {
            if (!appData || !appData.data) {
                throw new Error('Datos de backup inválidos');
            }

            // Limpiar datos actuales (excepto credenciales de GitHub)
            const keysToKeep = [STORAGE_KEY, GIST_ID_KEY, LAST_SYNC_KEY, LAST_EXPORT_KEY, PENDING_CHANGES_KEY];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!keysToKeep.includes(key)) {
                    try {
                        localStorage.removeItem(key);
                    } catch (error) {
                        console.warn(`No se pudo eliminar el dato: ${key}`, error);
                    }
                }
            }

            // Restaurar datos del backup
            Object.keys(appData.data).forEach(key => {
                try {
                    localStorage.setItem(key, appData.data[key]);
                } catch (error) {
                    console.warn(`No se pudo restaurar el dato: ${key}`, error);
                }
            });

            console.log('Datos restaurados exitosamente');

            // Recargar la página solo si se solicita (importación manual)
            if (autoReload) {
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            }
        },

        /**
         * Obtiene información del estado de sincronización
         * @returns {object}
         */
        getSyncInfo() {
            return {
                isConnected: this.isConnected,
                hasGist: !!this.gistId,
                lastSync: this.lastSync ? new Date(this.lastSync).toLocaleString('es-ES') : 'Nunca',
                gistId: this.gistId,
                isSyncing: this.isSyncing,
                syncDirection: this.syncDirection,
                hasPendingChanges: this.hasPendingChanges,
                hasRemoteChanges: this.hasRemoteChanges,
                autoSyncBlocked: this.autoSyncBlocked
            };
        },

        /**
         * Marca que hay cambios pendientes de exportar
         */
        markPendingChanges() {
            this.hasPendingChanges = true;
            localStorage.setItem(PENDING_CHANGES_KEY, 'true');

            // Debounce: esperar 2 segundos antes de exportar
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }

            this.debounceTimer = setTimeout(() => {
                if (this.isConnected && this.gistId && this.autoSyncEnabled) {
                    this.autoExport();
                }
            }, AUTO_SYNC_CONFIG.DEBOUNCE_DELAY);
        },

        /**
         * Exportación automática (con verificación de seguridad)
         */
        async autoExport() {
            if (!this.isConnected || !this.gistId || this.isSyncing) {
                return;
            }

            // SEGURIDAD: No exportar si hay cambios remotos sin importar
            if (this.autoSyncBlocked || this.hasRemoteChanges) {
                console.warn('⚠️ Auto-exportación bloqueada: importa los cambios remotos primero');
                this.updateSyncUI();
                return;
            }

            try {
                console.log('Auto-sync: Exportando cambios...');
                this.isSyncing = true;
                this.syncDirection = 'upload';
                this.updateSyncUI();

                await this.exportToGist();

                console.log('Auto-sync: Exportación completada');
            } catch (error) {
                console.error('Auto-sync: Error en exportación', error);
            } finally {
                this.isSyncing = false;
                this.syncDirection = null;
                this.updateSyncUI();
            }
        },

        /**
         * Inicia la sincronización automática
         */
        startAutoSync() {
            console.log('Auto-sync: Iniciado (exportación + verificación remota)');

            // ✅ NO hay exportación periódica - solo se exporta cuando el usuario hace cambios
            // La exportación se activa mediante markPendingChanges() que escucha eventos de la app

            // ✅ Verificar cambios remotos cada 30 segundos (con protección post-export)
            this.checkRemoteTimer = setInterval(() => {
                // Saltar verificación si acabamos de exportar
                if (this.skipNextRemoteCheck) {
                    console.log('Verificación remota omitida (post-export)');
                    return;
                }

                this.checkRemoteChanges().then(hasChanges => {
                    if (hasChanges) {
                        console.warn('⚠️ Cambios remotos detectados - Bloqueando auto-exportación');
                        this.autoSyncBlocked = true;
                        this.updateSyncUI();
                        
                        // Mostrar modal al usuario
                        this.showRemoteChangesModal();
                    }
                });
            }, AUTO_SYNC_CONFIG.CHECK_REMOTE_INTERVAL);

            // Exportar antes de cerrar
            window.addEventListener('beforeunload', () => {
                if (this.hasPendingChanges && this.isConnected && this.gistId && !this.autoSyncBlocked) {
                    // Exportación síncrona de emergencia
                    navigator.sendBeacon && this.exportToGist();
                }
            });

            // Escuchar eventos de cambios en la app
            this.listenToAppChanges();
        },

        /**
         * Detiene la sincronización automática
         */
        stopAutoSync() {
            console.log('Auto-sync: Detenido');
            if (this.intervalTimer) {
                clearInterval(this.intervalTimer);
                this.intervalTimer = null;
            }
            if (this.checkRemoteTimer) {
                clearInterval(this.checkRemoteTimer);
                this.checkRemoteTimer = null;
            }
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = null;
            }
        },

        /**
         * Escucha eventos de cambios en la app
         */
        listenToAppChanges() {
            // Eventos que indican cambios en los datos
            const changeEvents = [
                'tasksUpdated',
                'missionsUpdated',
                'habitsUpdated',
                'shopUpdated',
                'pointsUpdated'
            ];

            changeEvents.forEach(eventName => {
                if (window.App && window.App.events) {
                    window.App.events.on(eventName, () => {
                        this.markPendingChanges();
                    });
                }
            });
        },

        /**
         * Actualiza la UI de sincronización
         */
        updateSyncUI() {
            if (window.GitHubSyncUI && window.GitHubSyncUI.updateSyncButton) {
                window.GitHubSyncUI.updateSyncButton();
            }
        },

        /**
         * Muestra modal con detalles de cambios remotos detectados
         */
        showRemoteChangesModal() {
            if (window.GitHubSyncUI && window.GitHubSyncUI.showRemoteChangesModal) {
                window.GitHubSyncUI.showRemoteChangesModal(this.remoteData);
            } else {
                // Fallback: notificación simple
                if (typeof window.showNotification === 'function') {
                    window.showNotification('⚠️ Cambios remotos detectados. Importa antes de continuar.', 'warning');
                } else {
                    console.warn('⚠️ IMPORTANTE: Hay cambios remotos más recientes en GitHub. Importa antes de continuar trabajando.');
                }
            }
        },

        /**
         * Compara datos locales con remotos y retorna diferencias
         * @returns {object}
         */
        compareLocalWithRemote() {
            if (!this.remoteData) {
                return null;
            }

            const localData = this.collectAppData();
            const changes = {
                timestamp: {
                    local: localData.timestamp,
                    remote: this.remoteData.timestamp
                },
                device: {
                    local: this.deviceId,
                    remote: this.remoteData.deviceId
                },
                differences: []
            };

            // Comparar claves de datos
            const localKeys = Object.keys(localData.data || {});
            const remoteKeys = Object.keys(this.remoteData.data || {});
            
            // Claves solo en remoto (nuevas)
            const newKeys = remoteKeys.filter(k => !localKeys.includes(k));
            if (newKeys.length > 0) {
                changes.differences.push({
                    type: 'added',
                    description: `${newKeys.length} dato(s) nuevo(s) en la nube`,
                    keys: newKeys
                });
            }

            // Claves solo en local (eliminadas en remoto)
            const deletedKeys = localKeys.filter(k => !remoteKeys.includes(k));
            if (deletedKeys.length > 0) {
                changes.differences.push({
                    type: 'deleted',
                    description: `${deletedKeys.length} dato(s) eliminado(s) en la nube`,
                    keys: deletedKeys
                });
            }

            // Claves modificadas
            const modifiedKeys = localKeys.filter(k => {
                if (!remoteKeys.includes(k)) return false;
                return localData.data[k] !== this.remoteData.data[k];
            });
            if (modifiedKeys.length > 0) {
                changes.differences.push({
                    type: 'modified',
                    description: `${modifiedKeys.length} dato(s) modificado(s) en la nube`,
                    keys: modifiedKeys
                });
            }

            return changes;
        }
    };

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.GitHubSync.init();
        });
    } else {
        window.GitHubSync.init();
    }
})();