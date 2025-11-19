/* ===================================
   github-sync-state.js - CONTROL MANUAL
   Sistema de sincronización manual con GitHub Gist
   
   FILOSOFÍA:
   - El usuario decide cuándo importar y exportar
   - Sin automatizaciones complejas
   - Sin race conditions
   - Control total sobre la sincronización
   =================================== */

(function() {
    'use strict';
    
    const STORAGE = {
        TOKEN: 'fftask_github_token',
        GIST_ID: 'fftask_gist_id',
        LAST_SYNC: 'fftask_last_sync'
    };
    
    const log = (...msg) => console.log('[GitHubSync]', ...msg);
    
    window.GitHubSync = {
        token: null,
        gistId: null,
        isConnected: false,
        
        isSyncing: false,
        syncAction: null,  // 'import' o 'export'
        lastSync: 0,       // Timestamp de última sincronización

        /**
         * Inicializa el sistema
         */
        async init() {
            log('▶ Iniciando sistema de sincronización manual...');
            this.loadState();
            this.updateUI();
            
            if (this.isConnected) {
                log('✅ Conectado a GitHub Gist.');
            } else {
                log('⚠️ No conectado. Usa el modal para conectar.');
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
            this.updateUI();
            
            log('✅ Conectado exitosamente.');
            log('💡 Usa los botones Importar/Exportar para sincronizar.');
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
         * Importa datos desde el Gist (MANUAL)
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

                // Comparar datos antes de importar
                const hasChanges = this.hasDataChanges(backup.data);
                
                if (!hasChanges) {
                    // No hay cambios, solo actualizar timestamp
                    this.lastSync = Date.now();
                    localStorage.setItem(STORAGE.LAST_SYNC, this.lastSync.toString());
                    
                    // Limpiar estado de cambios remotos (ya están sincronizados)
                    localStorage.removeItem('fftask_github_remote_changes');
                    
                    log('✅ Datos ya están sincronizados. No es necesario recargar.');
                    return;
                }

                log('📝 Cambios detectados. Importando datos...');

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
                
                // Limpiar estado de cambios remotos ANTES de recargar
                localStorage.removeItem('fftask_github_remote_changes');
                
                // Actualizar snapshot para que no detecte cambios después de importar
                const newSnapshot = this.takeSnapshotForCounter();
                localStorage.setItem('fftask_github_snapshot', newSnapshot);
                localStorage.removeItem('fftask_github_changes_count');
                
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
         * Exporta datos al Gist (MANUAL)
         */
        async exportToGist() {
            if (!this.isConnected || !this.gistId || this.isSyncing) return;
            
            try {
                this.isSyncing = true;
                this.syncAction = 'export';
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
            const excludeKeys = [
                ...Object.values(STORAGE),
                'fftask_github_snapshot',        // Snapshot del contador de exportación
                'fftask_github_remote_changes',  // Estado del detector de importación
                'fftask_github_changes_count'    // Contador de cambios locales
            ];
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
         * Compara datos del Gist con datos locales
         * Retorna true si hay diferencias, false si son idénticos
         */
        hasDataChanges(gistData) {
            const excludeKeys = [
                ...Object.values(STORAGE),
                'fftask_github_snapshot',        // Snapshot del contador de exportación
                'fftask_github_remote_changes',  // Estado del detector de importación
                'fftask_github_changes_count'    // Contador de cambios locales
            ];
            
            // Obtener datos locales actuales
            const currentData = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!excludeKeys.includes(key)) {
                    currentData[key] = localStorage.getItem(key);
                }
            }
            
            // Comparar número de claves
            const gistKeys = Object.keys(gistData);
            const currentKeys = Object.keys(currentData);
            
            if (gistKeys.length !== currentKeys.length) {
                // Encontrar qué claves son diferentes
                const onlyInGist = gistKeys.filter(k => !currentKeys.includes(k));
                const onlyInLocal = currentKeys.filter(k => !gistKeys.includes(k));
                
                log(`📊 Diferencia en cantidad de claves: gist=${gistKeys.length}, local=${currentKeys.length}`);
                if (onlyInGist.length > 0) log(`   Solo en Gist: ${onlyInGist.join(', ')}`);
                if (onlyInLocal.length > 0) log(`   Solo en Local: ${onlyInLocal.join(', ')}`);
                
                return true;
            }
            
            // Comparar cada clave y valor
            for (const key of gistKeys) {
                if (!(key in currentData)) {
                    log(`📊 Clave nueva en gist: ${key}`);
                    return true;
                }
                
                if (gistData[key] !== currentData[key]) {
                    log(`📊 Valor diferente en clave: ${key}`);
                    return true;
                }
            }
            
            // Verificar claves que existen localmente pero no en gist
            for (const key of currentKeys) {
                if (!(key in gistData)) {
                    log(`📊 Clave local no existe en gist: ${key}`);
                    return true;
                }
            }
            
            return false;
        },

        /**
         * Toma snapshot para el contador (igual lógica que github-sync-auto-export.js)
         */
        takeSnapshotForCounter() {
            const excludeKeys = [
                'fftask_github_token', 
                'fftask_gist_id', 
                'fftask_last_sync',
                'fftask_github_changes_count',
                'fftask_github_snapshot',
                'fftask_github_remote_changes'
            ];
            const snapshot = {};
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!excludeKeys.includes(key)) {
                    snapshot[key] = localStorage.getItem(key);
                }
            }
            
            return JSON.stringify(snapshot);
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
            this.token = null;
            this.gistId = null;
            this.lastSync = 0;
            this.isConnected = false;
            
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
                hasChanges: false,
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
