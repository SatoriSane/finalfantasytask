/* ===================================
   github-sync-state.js - GESTIÓN SIMPLIFICADA
   Sistema de sincronización automática con GitHub
   
   LÓGICA SIMPLE:
   1. IMPORTAR: Antes de que el usuario interactúe (si >30s desde última sync)
   2. EXPORTAR: Inmediatamente al detectar cambios (con agrupación inteligente de 500ms)
   
   SEGURIDAD:
   - Exportación inmediata con agrupación para evitar pérdida de datos
   - Importación just-in-time antes de interactuar
   - Sin race conditions ni verificaciones periódicas innecesarias
   =================================== */

(function() {
    'use strict';
    
    const STORAGE = {
        TOKEN: 'fftask_github_token',
        GIST_ID: 'fftask_gist_id',
        LAST_SYNC: 'fftask_last_sync'
    };
    
    const TIMING = {
        IMPORT_THRESHOLD: 30000,    // Importar si >30s desde última sync (30000ms)
        EXPORT_GROUP_WINDOW: 500,   // Agrupar cambios en ventana de 500ms
    };
    
    const log = (...msg) => console.log('[GitHubSync]', ...msg);
    
    window.GitHubSync = {
        token: null,
        gistId: null,
        isConnected: false,
        
        isSyncing: false,
        syncAction: null,  // 'import' o 'export'
        lastSync: 0,       // Timestamp de última sincronización
        
        exportTimer: null,
        interactionListenerActive: false,

        /**
         * Inicializa el sistema
         */
        async init() {
            log('▶ Iniciando sistema de sincronización simplificado...');
            this.loadState();
        
            if (this.isConnected) {
                log('🔗 Conectado. Configurando listeners...');
                
                // Actualizar UI para mostrar estado conectado
                this.updateUI();
                
                // Importar datos frescos al iniciar
                await this.importIfNeeded();
                
                // Configurar listeners
                this.setupInteractionListener();
                this.setupChangeListener();
                
                log('✅ Sistema listo.');
            } else {
                log('⚠️ No conectado a GitHub.');
                // Actualizar UI para mostrar estado desconectado
                this.updateUI();
            }
        },
    
        /**
         * Carga estado desde localStorage
         */
        loadState() {
            this.token = localStorage.getItem(STORAGE.TOKEN);
            this.gistId = localStorage.getItem(STORAGE.GIST_ID);
            const lastSyncStr = localStorage.getItem(STORAGE.LAST_SYNC);
            this.lastSync = lastSyncStr ? parseInt(lastSyncStr, 10) : 0;
            this.isConnected = !!(this.token && this.gistId);
            
            log('Estado cargado:', {
                connected: this.isConnected,
                lastSync: this.lastSync ? new Date(this.lastSync).toLocaleString() : 'nunca'
            });
        },
    
        /**
         * Conecta con GitHub
         */
        async connect(token) {
            if (!token?.trim()) throw new Error('Token inválido');
            log('🔐 Conectando con GitHub...');

            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) throw new Error('Token inválido');

            this.token = token;
            localStorage.setItem(STORAGE.TOKEN, token);
            log('✅ Token validado. Buscando o creando Gist...');

            await this.findOrCreateGist();
            
            if (!this.gistId) {
                throw new Error('No se pudo crear o encontrar el Gist');
            }

            this.isConnected = true;
            log('📁 Gist listo:', this.gistId);

            // Actualizar UI para mostrar estado conectado
            this.updateUI();

            // Importar datos al conectar
            await this.importFromGist();

            // Configurar listeners
            this.setupInteractionListener();
            this.setupChangeListener();
            
            log('🟢 Sincronización activada.');
            return true;
        },
    
        /**
         * Busca o crea un Gist
         */
        async findOrCreateGist() {
            try {
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
                        log('📂 Gist existente encontrado:', this.gistId);
                        return;
                    }
                }
    
                log('⚙️ No se encontró Gist, creando uno nuevo...');
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
                    log('✅ Gist creado con éxito:', this.gistId);
                } else {
                    throw new Error(`Error al crear Gist: ${createResponse.status}`);
                }
            } catch (error) {
                console.error('[GitHubSync] ❌ Error al buscar/crear Gist:', error);
                throw error;
            }
        },

        /**
         * REGLA 1: Importar si han pasado >30s desde última sync
         */
        async importIfNeeded() {
            const timeSinceSync = Date.now() - this.lastSync;
            
            if (timeSinceSync > TIMING.IMPORT_THRESHOLD) {
                log(`📥 Han pasado ${Math.round(timeSinceSync/1000)}s desde última sync. Importando...`);
                await this.importFromGist();
            } else {
                log(`✅ Datos frescos (última sync hace ${Math.round(timeSinceSync/1000)}s)`);
            }
        },

        /**
         * Importa datos desde el Gist
         */
        async importFromGist() {
            if (!this.isConnected || !this.gistId || this.isSyncing) return;
            
            try {
                this.isSyncing = true;
                this.syncAction = 'import';
                this.updateUI();

                log('📥 Importando desde Gist...');
                const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

                if (!response.ok) {
                    if (response.status === 401 || response.status === 404) {
                        log('❌ Token o Gist inválido');
                        this.handleInvalidAuth();
                    }
                    return;
                }
                
                const gist = await response.json();
                const content = gist.files['fftask-backup.json']?.content;
                
                if (!content) {
                    log('⚠️ No se encontró contenido en el Gist');
                    return;
                }

                const backup = JSON.parse(content);
                
                if (!backup?.data) {
                    log('⚠️ Backup sin datos');
                    return;
                }

                // Comparar datos actuales con los del backup
                const hasChanges = this.hasDataChanges(backup.data);
                
                if (!hasChanges) {
                    // No hay cambios, solo actualizar timestamp
                    this.lastSync = Date.now();
                    localStorage.setItem(STORAGE.LAST_SYNC, this.lastSync.toString());
                    log('✅ Datos ya están sincronizados. No es necesario recargar.');
                    return;
                }

                log('📝 Cambios detectados. Aplicando actualización...');

                // Limpiar localStorage excepto datos de sincronización
                const keepKeys = Object.values(STORAGE);
                for (let i = localStorage.length - 1; i >= 0; i--) {
                    const key = localStorage.key(i);
                    if (!keepKeys.includes(key)) {
                        localStorage.removeItem(key);
                    }
                }

                // Importar nuevos datos
                Object.entries(backup.data).forEach(([key, value]) => {
                    localStorage.setItem(key, value);
                });

                // Actualizar timestamp
                this.lastSync = Date.now();
                localStorage.setItem(STORAGE.LAST_SYNC, this.lastSync.toString());
                
                log('✅ Datos importados. Recargando...');
                setTimeout(() => window.location.reload(), 500);
            } catch (error) {
                console.error('[GitHubSync] ❌ Error al importar:', error);
            } finally {
                this.isSyncing = false;
                this.syncAction = null;
                this.updateUI();
            }
        },

        /**
         * REGLA 2: Exportar inmediatamente con agrupación inteligente
         */
        scheduleExport() {
            // Cancelar timer anterior si existe
            clearTimeout(this.exportTimer);
            
            // Agrupar cambios en ventana de 500ms
            this.exportTimer = setTimeout(async () => {
                await this.exportToGist();
            }, TIMING.EXPORT_GROUP_WINDOW);
            
            log(`📦 Cambio detectado. Exportando en ${TIMING.EXPORT_GROUP_WINDOW}ms...`);
        },

        /**
         * Exporta datos al Gist
         */
        async exportToGist() {
            if (!this.isConnected || !this.gistId || this.isSyncing) return;
            
            try {
                this.isSyncing = true;
                this.syncAction = 'export';
                this.exportTimer = null; // Limpiar timer
                this.updateUI();

                log('�� Exportando al Gist...');
                const data = this.collectAppData();

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
                    this.lastSync = Date.now();
                    localStorage.setItem(STORAGE.LAST_SYNC, this.lastSync.toString());
                    log('✅ Datos exportados correctamente.');
                } else {
                    if (response.status === 401 || response.status === 404) {
                        log('❌ Token o Gist inválido');
                        this.handleInvalidAuth();
                    }
                }
            } catch (error) {
                console.error('[GitHubSync] ❌ Error al exportar:', error);
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
         * Compara datos del backup con los datos locales actuales
         * Retorna true si hay diferencias, false si son idénticos
         */
        hasDataChanges(backupData) {
            const excludeKeys = Object.values(STORAGE);
            
            // Obtener datos locales actuales
            const currentData = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!excludeKeys.includes(key)) {
                    currentData[key] = localStorage.getItem(key);
                }
            }
            
            // Comparar número de claves
            const backupKeys = Object.keys(backupData);
            const currentKeys = Object.keys(currentData);
            
            if (backupKeys.length !== currentKeys.length) {
                log(`📊 Diferencia en cantidad de claves: backup=${backupKeys.length}, local=${currentKeys.length}`);
                return true;
            }
            
            // Comparar cada clave y valor
            for (const key of backupKeys) {
                if (!(key in currentData)) {
                    log(`📊 Clave nueva en backup: ${key}`);
                    return true;
                }
                
                if (backupData[key] !== currentData[key]) {
                    log(`📊 Valor diferente en clave: ${key}`);
                    return true;
                }
            }
            
            // Verificar claves que existen localmente pero no en backup
            for (const key of currentKeys) {
                if (!(key in backupData)) {
                    log(`📊 Clave local no existe en backup: ${key}`);
                    return true;
                }
            }
            
            return false;
        },

        /**
         * Configura listener para detectar interacción del usuario
         */
        setupInteractionListener() {
            if (this.interactionListenerActive) return;
            
            const events = ['click', 'keydown', 'touchstart'];
            const handler = async () => {
                // Importar si es necesario antes de la interacción
                await this.importIfNeeded();
                
                // Reactivar listener para próxima interacción
                setTimeout(() => {
                    events.forEach(event => {
                        document.addEventListener(event, handler, { once: true, capture: true });
                    });
                }, 1000);
            };
            
            events.forEach(event => {
                document.addEventListener(event, handler, { once: true, capture: true });
            });
            
            this.interactionListenerActive = true;
            log('👂 Listener de interacción activado');
        },

        /**
         * Configura listener para detectar cambios en la app
         */
        setupChangeListener() {
            log('🎧 Escuchando cambios en la app...');
            
            // Eventos de la app
            const events = [
                'todayTasksUpdated',
                'missionsUpdated',
                'habitsUpdated',
                'shopItemsUpdated',
                'pointsUpdated',
                'stateChanged'
            ];
            
            events.forEach(event => {
                window.App?.events?.on(event, (data) => {
                    // Ignorar eventos automáticos
                    if (data?.autoGenerated || data?.source === 'autoTicket') {
                        return;
                    }
                    
                    log(`📢 Cambio detectado: ${event}`);
                    this.scheduleExport();
                });
            });
        },

        /**
         * Maneja autenticación inválida
         */
        handleInvalidAuth() {
            if (window.App?.events) {
                App.events.emit('shownotifyMessage', 
                    '⚠️ Error de sincronización: Token inválido. Reconecta GitHub Sync.');
            }
            
            setTimeout(() => {
                this.disconnect();
                this.updateUI();
            }, 2000);
        },

        /**
         * Actualiza UI
         */
        updateUI() {
            window.GitHubSyncUI?.updateButton?.();
        },
    
        /**
         * Desconecta GitHub Sync
         */
        disconnect() {
            log('🔌 Desconectando...');
            
            clearTimeout(this.exportTimer);
            
            this.token = null;
            this.gistId = null;
            this.lastSync = 0;
            this.isConnected = false;
            this.interactionListenerActive = false;
            
            Object.values(STORAGE).forEach(key => localStorage.removeItem(key));
            
            log('✅ Desconectado.');
        },
    
        /**
         * Obtiene estado actual
         */
        getStatus() {
            const timeSinceSync = Date.now() - this.lastSync;
            
            return {
                isConnected: this.isConnected,
                isSyncing: this.isSyncing,
                syncAction: this.syncAction,
                hasChanges: !!this.exportTimer, // Hay cambios pendientes si hay un timer activo
                lastSync: this.lastSync,
                timeSinceSync: Math.round(timeSinceSync / 1000) // en segundos
            };
        }
    };
    
    // Auto-inicialización
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            await window.GitHubSync.init();
        });
    } else {
        window.GitHubSync.init();
    }
})();
