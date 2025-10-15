/* ===================================
   github-sync-state.js - GESTIÓN DE ESTADO
   Sistema de sincronización automática con GitHub
   =================================== */

   (function() {
    'use strict';

    // Constantes
    const STORAGE = {
        TOKEN: 'fftask_github_token',
        GIST_ID: 'fftask_gist_id',
        LAST_IMPORT: 'fftask_last_import',
        DEVICE_ID: 'fftask_device_id'
    };

    const TIMING = {
        CHECK_INTERVAL: 30000,        // 30 segundos
        INACTIVITY_THRESHOLD: 60000,  // 1 minuto de inactividad
        DEBOUNCE_EXPORT: 2000,        // 2 segundos después del cambio
        POST_EXPORT_PAUSE: 10000      // 10 segundos después de exportar
    };

    // Estado global
    window.GitHubSync = {
        // Credenciales
        token: null,
        gistId: null,
        deviceId: null,
        isConnected: false,

        // Estado de sincronización
        isSyncing: false,
        syncAction: null,              // 'export' | 'import' | 'check' | null
        lastImport: null,
        
        // Control de actividad
        lastActivity: Date.now(),
        isPageVisible: true,
        hasUserChanges: false,
        
        // Timers
        checkTimer: null,
        exportTimer: null,
        skipNextCheck: false,
        
        // Contador
        nextCheckIn: 0,

        /**
         * Inicializa el sistema
         */
        init() {
            this.loadState();
            
            if (this.isConnected) {
                this.startActivityMonitoring();
                this.startAutoCheck();
            }
        },

        /**
         * Carga estado desde localStorage
         */
        loadState() {
            this.token = localStorage.getItem(STORAGE.TOKEN);
            this.gistId = localStorage.getItem(STORAGE.GIST_ID);
            this.deviceId = localStorage.getItem(STORAGE.DEVICE_ID);
            this.lastImport = localStorage.getItem(STORAGE.LAST_IMPORT);
            this.isConnected = !!this.token;

            if (!this.deviceId) {
                this.deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                localStorage.setItem(STORAGE.DEVICE_ID, this.deviceId);
            }
        },

        /**
         * Conecta con GitHub
         */
        async connect(token) {
            if (!token?.trim()) throw new Error('Token inválido');

            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) throw new Error('Token inválido');

            this.token = token;
            localStorage.setItem(STORAGE.TOKEN, token);
            this.isConnected = true;

            await this.findOrCreateGist();
            
            // Verificar inmediatamente si hay datos remotos
            await this.checkAndImport();
            
            // Iniciar monitoreo
            this.startActivityMonitoring();
            this.startAutoCheck();

            return true;
        },

        /**
         * Busca o crea un Gist
         */
        async findOrCreateGist() {
            try {
                // Buscar Gist existente
                const response = await fetch('https://api.github.com/gists', {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

                if (response.ok) {
                    const gists = await response.json();
                    const fftaskGist = gists.find(g => g.files?.['fftask-backup.json']);

                    if (fftaskGist) {
                        this.gistId = fftaskGist.id;
                        localStorage.setItem(STORAGE.GIST_ID, fftaskGist.id);
                        return;
                    }
                }

                // Si no existe, crear uno vacío
                const createResponse = await fetch('https://api.github.com/gists', {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        description: 'FFTask Backup',
                        public: false,
                        files: {
                            'fftask-backup.json': {
                                content: JSON.stringify({
                                    version: '1.0',
                                    timestamp: new Date().toISOString(),
                                    deviceId: this.deviceId,
                                    data: {}
                                }, null, 2)
                            }
                        }
                    })
                });

                if (createResponse.ok) {
                    const result = await createResponse.json();
                    this.gistId = result.id;
                    localStorage.setItem(STORAGE.GIST_ID, result.id);
                }
            } catch (error) {
                console.error('Error al buscar/crear Gist:', error);
            }
        },

        /**
         * Monitorea actividad del usuario
         */
        startActivityMonitoring() {
            // Detectar visibilidad de página
            document.addEventListener('visibilitychange', () => {
                this.isPageVisible = !document.hidden;
                
                if (this.isPageVisible) {
                    const inactiveTime = Date.now() - this.lastActivity;
                    
                    // Si estuvo inactivo más del umbral, verificar inmediatamente
                    if (inactiveTime > TIMING.INACTIVITY_THRESHOLD) {
                        this.checkAndImport();
                    }
                    
                    this.lastActivity = Date.now();
                }
            });

            // Detectar actividad del usuario
            const updateActivity = () => {
                const now = Date.now();
                const wasInactive = (now - this.lastActivity) > TIMING.INACTIVITY_THRESHOLD;
                
                this.lastActivity = now;
                
                // Si volvió después de inactividad, verificar
                if (wasInactive && this.isPageVisible) {
                    this.checkAndImport();
                }
            };

            ['mousemove', 'scroll', 'keydown', 'click', 'touchstart'].forEach(event => {
                document.addEventListener(event, updateActivity, { passive: true });
            });
        },

        /**
         * Inicia verificación automática cada 30 segundos
         */
        startAutoCheck() {
            // Contador visual
            this.nextCheckIn = 30;
            
            const updateCounter = setInterval(() => {
                if (this.isPageVisible && !this.isSyncing) {
                    this.nextCheckIn--;
                    this.updateUI();
                    
                    if (this.nextCheckIn <= 0) {
                        this.nextCheckIn = 30;
                    }
                }
            }, 1000);

            // Verificación cada 30 segundos
            this.checkTimer = setInterval(() => {
                if (this.isPageVisible && !this.skipNextCheck) {
                    this.checkAndImport();
                }
                
                this.skipNextCheck = false;
            }, TIMING.CHECK_INTERVAL);

            // Guardar referencia del contador
            this.counterInterval = updateCounter;
        },

        /**
         * Verifica cambios remotos e importa automáticamente si es necesario
         */
        async checkAndImport() {
            if (!this.isConnected || !this.gistId || this.isSyncing) return;

            try {
                this.isSyncing = true;
                this.syncAction = 'check';
                this.nextCheckIn = 30;
                this.updateUI();

                const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

                if (!response.ok) return;

                const gist = await response.json();
                const content = gist.files['fftask-backup.json']?.content;
                if (!content) return;

                const backup = JSON.parse(content);
                
                // Verificar si es más reciente y de otro dispositivo
                const isDifferentDevice = backup.deviceId !== this.deviceId;
                const isNewer = new Date(backup.timestamp) > new Date(this.lastImport || 0);

                if (isDifferentDevice && isNewer) {
                    // Importar automáticamente
                    await this.importData(backup);
                }
            } catch (error) {
                console.error('Error al verificar cambios:', error);
            } finally {
                this.isSyncing = false;
                this.syncAction = null;
                this.updateUI();
            }
        },

        /**
         * Importa datos automáticamente
         */
        async importData(backup) {
            if (!backup?.data) return;

            this.syncAction = 'import';
            this.updateUI();

            const keepKeys = Object.values(STORAGE);

            // Limpiar datos actuales (excepto credenciales)
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (!keepKeys.includes(key)) {
                    localStorage.removeItem(key);
                }
            }

            // Restaurar datos
            Object.entries(backup.data).forEach(([key, value]) => {
                localStorage.setItem(key, value);
            });

            // Actualizar timestamp de importación
            const now = new Date().toISOString();
            this.lastImport = now;
            localStorage.setItem(STORAGE.LAST_IMPORT, now);

            console.log('✅ Datos importados automáticamente');
            
            // Recargar página para reflejar cambios
            setTimeout(() => window.location.reload(), 500);
        },

        /**
         * Marca que el usuario hizo cambios
         */
        markUserChanges() {
            this.hasUserChanges = true;

            // Debounce: esperar 2 segundos antes de exportar
            clearTimeout(this.exportTimer);
            this.exportTimer = setTimeout(() => {
                if (this.isConnected && this.gistId) {
                    this.exportData();
                }
            }, TIMING.DEBOUNCE_EXPORT);
        },

        /**
         * Exporta datos automáticamente
         */
        async exportData() {
            if (!this.isConnected || !this.gistId || this.isSyncing) return;

            try {
                this.isSyncing = true;
                this.syncAction = 'export';
                this.updateUI();

                const data = this.collectAppData();
                data.deviceId = this.deviceId;

                const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        files: {
                            'fftask-backup.json': {
                                content: JSON.stringify(data, null, 2)
                            }
                        }
                    })
                });

                if (response.ok) {
                    const now = new Date().toISOString();
                    this.lastImport = now;
                    localStorage.setItem(STORAGE.LAST_IMPORT, now);
                    this.hasUserChanges = false;

                    // Pausar verificación por 10 segundos
                    this.skipNextCheck = true;
                    this.nextCheckIn = 30;
                    setTimeout(() => {
                        this.skipNextCheck = false;
                    }, TIMING.POST_EXPORT_PAUSE);

                    console.log('✅ Datos exportados automáticamente');
                }
            } catch (error) {
                console.error('Error al exportar:', error);
            } finally {
                this.isSyncing = false;
                this.syncAction = null;
                this.updateUI();
            }
        },

        /**
         * Recopila datos de la app
         */
        collectAppData() {
            const excludeKeys = Object.values(STORAGE);
            const data = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                data: {}
            };

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!excludeKeys.includes(key)) {
                    data.data[key] = localStorage.getItem(key);
                }
            }

            return data;
        },

        /**
         * Escucha eventos de cambios en la app
         */
        listenToAppChanges() {
            const events = [
                'todayTasksUpdated',      // Tareas de hoy (crear, editar, eliminar, completar)
                'missionsUpdated',        // Misiones y categorías
                'habitsUpdated',          // Retos de abstinencia
                'shopItemsUpdated',       // Productos de la tienda
                'pointsUpdated'           // Cambios en puntos (muy importante)
            ];

            events.forEach(event => {
                window.App?.events?.on(event, () => this.markUserChanges());
            });
        },

        /**
         * Actualiza la UI
         */
        updateUI() {
            window.GitHubSyncUI?.updateButton?.();
        },

        /**
         * Desconecta
         */
        disconnect() {
            clearInterval(this.checkTimer);
            clearInterval(this.counterInterval);
            clearTimeout(this.exportTimer);

            this.token = null;
            this.gistId = null;
            this.lastImport = null;
            this.isConnected = false;

            Object.values(STORAGE).forEach(key => localStorage.removeItem(key));
        },

        /**
         * Obtiene información de estado
         */
        getStatus() {
            return {
                isConnected: this.isConnected,
                isSyncing: this.isSyncing,
                syncAction: this.syncAction,
                nextCheckIn: this.nextCheckIn,
                hasChanges: this.hasUserChanges
            };
        }
    };

    // Inicializar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.GitHubSync.init());
    } else {
        window.GitHubSync.init();
    }
})();