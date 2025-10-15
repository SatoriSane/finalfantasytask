/* ===================================
   github-sync-state.js - GESTIÓN DE ESTADO
   Sistema de sincronización automática con GitHub
   Versión Robusta con verificación garantizada
   =================================== */

   (function() {
    'use strict';
    
    const STORAGE = {
        TOKEN: 'fftask_github_token',
        GIST_ID: 'fftask_gist_id',
        LAST_IMPORT: 'fftask_last_import',
        DEVICE_ID: 'fftask_device_id'
    };
    
    const TIMING = {
        CHECK_INTERVAL: 30000,
        DEBOUNCE_EXPORT: 2000,
        POST_EXPORT_PAUSE: 10000,
        FORCE_CHECK_TIMEOUT: 5000,  // Timeout para verificación forzada
        FORCE_CHECK_RETRY: 1000     // Intervalo entre reintentos
    };
    
    const log = (...msg) => console.log('[GitHubSync]', ...msg);
    
    window.GitHubSync = {
        token: null,
        gistId: null,
        deviceId: null,
        isConnected: false,
    
        isSyncing: false,
        syncAction: null,
        lastImport: null,
    
        lastActivity: Date.now(),
        isPageVisible: true,
        hasUserChanges: false,
    
        checkTimer: null,
        exportTimer: null,
        counterInterval: null,
        skipNextCheck: false,
        nextCheckIn: 0,
    
        /**
         * Inicializa el sistema
         */
        async init() {
            log('▶ init() → Iniciando sistema de sincronización...');
            this.loadState();
        
            if (this.isConnected) {
                log('🔗 Usuario ya conectado, iniciando monitoreo y verificación automática.');
                
                // ✅ VERIFICACIÓN INMEDIATA Y FORZADA AL INICIAR
                // Se ejecuta ANTES de iniciar los timers para evitar conflictos
                log('🔄 Verificación PRIORITARIA al abrir la aplicación');
                await this.forceCheckAndImport();
                
                // Una vez completada la verificación inicial, inicia el monitoreo
                this.startActivityMonitoring();
                this.startAutoCheck();
                this.listenToAppChanges();
                log('✅ Sistema de monitoreo iniciado después de verificación inicial');
            } else {
                log('⚠️ No conectado a GitHub todavía.');
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
            this.isConnected = !!(this.token && this.gistId);
    
            if (!this.deviceId) {
                this.deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                localStorage.setItem(STORAGE.DEVICE_ID, this.deviceId);
                log('🆕 Nuevo deviceId generado:', this.deviceId);
            } else {
                log('ℹ Device ID cargado:', this.deviceId);
            }
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

            // ✅ VERIFICACIÓN INMEDIATA Y FORZADA DESPUÉS DEL LOGIN
            log('🔄 Verificación PRIORITARIA después del login');
            await this.forceCheckAndImport();

            this.startActivityMonitoring();
            this.startAutoCheck();
            this.listenToAppChanges();
            log('🟢 Sincronización automática iniciada.');
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
         * Monitorea actividad del usuario
         */
        startActivityMonitoring() {
            log('👀 Iniciando monitoreo de actividad...');
            
            // Detecta cuando el usuario vuelve a la pestaña
            document.addEventListener('visibilitychange', async () => {
                this.isPageVisible = !document.hidden;
                
                if (this.isPageVisible) {
                    // ✅ VERIFICACIÓN FORZADA cuando vuelve a la pestaña
                    log('👋 Usuario volvió a la página. Verificando cambios remotos...');
                    await this.forceCheckAndImport();
                    this.lastActivity = Date.now();
                }
            });
        
            // Actualiza timestamp de actividad
            const updateActivity = () => {
                this.lastActivity = Date.now();
            };
        
            ['mousemove', 'scroll', 'keydown', 'click', 'touchstart']
                .forEach(event => document.addEventListener(event, updateActivity, { passive: true }));
        },
    
        /**
         * Inicia verificación automática
         */
        startAutoCheck() {
            log('⏱ Iniciando verificación automática cada 30s...');
            this.nextCheckIn = 30;
            
            // Contador visual
            this.counterInterval = setInterval(() => {
                if (this.isPageVisible && !this.isSyncing) {
                    this.nextCheckIn--;
                    this.updateUI();
                    if (this.nextCheckIn <= 0) this.nextCheckIn = 30;
                }
            }, 1000);
    
            // Verificación automática
            this.checkTimer = setInterval(() => {
                if (this.isPageVisible && !this.skipNextCheck) {
                    this.checkAndImport();
                }
                this.skipNextCheck = false;
            }, TIMING.CHECK_INTERVAL);
        },
    
        /**
         * Verificación FORZADA - Prioriza verificaciones críticas
         * Se usa en: inicio de app, return to tab, login
         * 
         * Esta función garantiza que la verificación se ejecute incluso si
         * hay operaciones en curso, esperando un máximo de 5 segundos
         */
        async forceCheckAndImport() {
            if (!this.isConnected || !this.gistId) {
                log('⚠️ No se puede verificar: no conectado o sin Gist');
                return;
            }

            // Si ya hay sincronización en curso, espera con timeout
            const maxAttempts = TIMING.FORCE_CHECK_TIMEOUT / TIMING.FORCE_CHECK_RETRY;
            let attempts = 0;
            
            while (this.isSyncing && attempts < maxAttempts) {
                log(`⏳ Sincronización en curso, esperando... (intento ${attempts + 1}/${maxAttempts})`);
                await new Promise(resolve => setTimeout(resolve, TIMING.FORCE_CHECK_RETRY));
                attempts++;
            }

            // Si después del timeout sigue ocupado, aborta para evitar bloqueos
            if (this.isSyncing) {
                log('⚠️ No se pudo forzar verificación: sincronización bloqueada después de 5s');
                return;
            }

            // Resetea el timer de verificación automática
            this.nextCheckIn = 30;
            
            log('🚀 Ejecutando verificación forzada...');
            return this.checkAndImport();
        },
    
        /**
         * Verifica cambios remotos e importa automáticamente
         */
        async checkAndImport() {
            if (!this.isConnected || !this.gistId || this.isSyncing) {
                if (this.isSyncing) {
                    log('⏳ Ya hay una sincronización en curso, omitiendo...');
                }
                return;
            }
    
            try {
                this.isSyncing = true;
                this.syncAction = 'check';
                this.nextCheckIn = 30;
                this.updateUI();
    
                log('🔍 Verificando cambios remotos...');
                const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
    
                if (!response.ok) {
                    log('⚠️ Error al obtener Gist:', response.status);
                    return;
                }
                
                const gist = await response.json();
                const content = gist.files['fftask-backup.json']?.content;
                
                if (!content) {
                    log('⚠️ No se encontró contenido en el Gist');
                    return;
                }
    
                const backup = JSON.parse(content);
                const isDifferentDevice = backup.deviceId !== this.deviceId;
                const isNewer = new Date(backup.timestamp) > new Date(this.lastImport || 0);
    
                if (isDifferentDevice && isNewer) {
                    log('📥 Cambios detectados desde otro dispositivo:');
                    log('   - Device remoto:', backup.deviceId);
                    log('   - Device local:', this.deviceId);
                    log('   - Timestamp remoto:', backup.timestamp);
                    log('   - Última importación:', this.lastImport || 'nunca');
                    await this.importData(backup);
                } else {
                    log('✅ No hay cambios nuevos.');
                }
            } catch (error) {
                console.error('[GitHubSync] ❌ Error al verificar cambios:', error);
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
            if (!backup?.data) {
                log('⚠️ Backup sin datos, omitiendo importación');
                return;
            }
            
            this.syncAction = 'import';
            this.updateUI();
    
            log('⬇️ Importando datos desde Gist...');
            const keepKeys = Object.values(STORAGE);
    
            // Limpiar localStorage excepto datos de sincronización
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
    
            // Actualizar timestamp de importación
            const now = new Date().toISOString();
            this.lastImport = now;
            localStorage.setItem(STORAGE.LAST_IMPORT, now);
            
            log('✅ Datos importados correctamente. Recargando página...');
            setTimeout(() => window.location.reload(), 500);
        },
    
        /**
         * Marca que el usuario hizo cambios
         */
        markUserChanges() {
            this.hasUserChanges = true;
            clearTimeout(this.exportTimer);
            log('📦 Cambio detectado → exportación programada en 2s.');
            
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
    
                log('📤 Exportando datos actualizados al Gist...');
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
                    this.skipNextCheck = true;
                    this.nextCheckIn = 30;
                    
                    // Pausa temporal de verificaciones después de exportar
                    setTimeout(() => {
                        this.skipNextCheck = false;
                    }, TIMING.POST_EXPORT_PAUSE);
                    
                    log('✅ Datos exportados correctamente.');
                } else {
                    log('⚠️ Fallo al exportar datos:', response.status);
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
                deviceId: this.deviceId,
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
            log('🎧 Escuchando eventos de la app...');
            const events = [
                'todayTasksUpdated',
                'missionsUpdated',
                'habitsUpdated',
                'habitsAutoUpdated',
                'shopItemsUpdated',
                'pointsUpdated'
            ];
        
            events.forEach(event => {
                window.App?.events?.on(event, (data) => {
        
                    // 🚫 Ignorar generación automática de tickets
                    if (event === 'habitsAutoUpdated') {
                        log('🎟 Ignorado: generación automática de tickets.');
                        return;
                    }
        
                    // 🚫 Ignorar actualizaciones automáticas de puntos
                    if (event === 'pointsUpdated' && data?.source === 'autoTicket') {
                        log('🎟 Ignorado: actualización automática de puntos.');
                        return;
                    }
        
                    // 🚫 Ignorar actualizaciones automáticas de hábitos
                    if (event === 'habitsUpdated' && data?.autoGenerated === true) {
                        log('🎟 Ignorado: actualización automática de hábitos.');
                        return;
                    }
        
                    log(`📢 Cambio detectado: ${event}`);
                    this.markUserChanges();
                });
            });
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
            log('🔌 Desconectando GitHub Sync...');
            
            clearInterval(this.checkTimer);
            clearInterval(this.counterInterval);
            clearTimeout(this.exportTimer);
            
            this.token = null;
            this.gistId = null;
            this.lastImport = null;
            this.isConnected = false;
            
            Object.values(STORAGE).forEach(key => localStorage.removeItem(key));
            
            log('✅ Desconectado correctamente.');
        },
    
        /**
         * Obtiene estado actual
         */
        getStatus() {
            return {
                isConnected: this.isConnected,
                isSyncing: this.isSyncing,
                syncAction: this.syncAction,
                nextCheckIn: this.nextCheckIn,
                hasChanges: this.hasUserChanges,
                deviceId: this.deviceId,
                lastImport: this.lastImport
            };
        }
    };
    
    // Auto-inicialización con soporte async
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            await window.GitHubSync.init();
        });
    } else {
        window.GitHubSync.init();
    }
})();