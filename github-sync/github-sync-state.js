/* ===================================
   github-sync-state.js - GESTIÓN DE ESTADO
   Sistema de sincronización automática con GitHub
   Versión Unificada (Trigger por Contador de 2s)
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
        CHECK_INTERVAL_S: 30,       // Intervalo normal de verificación en segundos (30s)
        IMMEDIATE_CHECK_S: 2,       // Intervalo para verificación inmediata (2s)
        DEBOUNCE_EXPORT: 2000,
        POST_EXPORT_PAUSE: 10000,
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
    
        exportTimer: null,
        counterInterval: null,
        skipNextCheck: false,
        nextCheckIn: TIMING.CHECK_INTERVAL_S,
    
        /**
         * Inicializa el sistema. Ahora es llamado explícitamente por app-init.js
         */
        async init() {
            log('▶ init() → Iniciando sistema de sincronización...');
            this.loadState();
        
            if (this.isConnected) {
                log('🔗 Usuario ya conectado, iniciando monitoreo y verificación unificada.');
                
                // ✅ LLAMADA SIMPLE: Programa la primera verificación para 2 segundos.
                this.scheduleImmediateCheck();
                
                this.startActivityMonitoring();
                this.startAutoCheck();
                this.listenToAppChanges();
                log('✅ Sistema de monitoreo iniciado.');
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

            // ✅ LLAMADA SIMPLE: Programa la verificación para 2 segundos después del login.
            this.scheduleImmediateCheck();

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
            
            document.addEventListener('visibilitychange', () => {
                this.isPageVisible = !document.hidden;
                
                if (this.isPageVisible) {
                    log('👋 Usuario volvió a la página. Programando verificación en 2s...');
                    this.scheduleImmediateCheck();
                    this.lastActivity = Date.now();
                }
            });
        
            const updateActivity = () => {
                this.lastActivity = Date.now();
            };
        
            ['mousemove', 'scroll', 'keydown', 'click', 'touchstart']
                .forEach(event => document.addEventListener(event, updateActivity, { passive: true }));
        },
    
        /**
         * Inicia verificación automática (Mecanismo Unificado)
         */
        startAutoCheck() {
            log(`⏱ Iniciando verificación unificada (periódica: ${TIMING.CHECK_INTERVAL_S}s)...`);
            
            if (this.counterInterval) return;

            this.counterInterval = setInterval(async () => {
                if (this.isPageVisible && !this.isSyncing) {
                    this.nextCheckIn--;
                    
                    if (this.nextCheckIn <= 0) {
                        if (!this.skipNextCheck) {
                           await this.checkAndImport();
                        } else {
                           log('⏭ Check saltado por bandera skipNextCheck.');
                        }
                        
                        this.nextCheckIn = TIMING.CHECK_INTERVAL_S;
                    }
                    
                    this.updateUI();
                }
            }, 1000);
        },

        /**
         * Programa una verificación para ejecutarse en 2 segundos.
         */
        scheduleImmediateCheck() {
            if (!this.isConnected || !this.gistId) {
                return;
            }
            
            if (!this.isSyncing) {
                log(`🚀 Verificación programada para ${TIMING.IMMEDIATE_CHECK_S}s.`);
                this.nextCheckIn = TIMING.IMMEDIATE_CHECK_S;
                this.updateUI();
            } else {
                log('⏳ Sincronización en curso, omitiendo programación inmediata.');
            }
        },
    
        /**
         * Verifica cambios remotos e importa automáticamente
         */
        async checkAndImport() {
            if (!this.isConnected || !this.gistId || this.isSyncing) {
                if (this.isSyncing) log('⏳ Ya hay una sincronización en curso, omitiendo...');
                return;
            }
    
            try {
                this.isSyncing = true;
                this.syncAction = 'check';
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
                    log('📥 Cambios detectados desde otro dispositivo.');
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
    
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (!keepKeys.includes(key)) {
                    localStorage.removeItem(key);
                }
            }
    
            Object.entries(backup.data).forEach(([key, value]) => {
                localStorage.setItem(key, value);
            });
    
            const now = new Date().toISOString();
            this.lastImport = now;
            localStorage.setItem(STORAGE.LAST_IMPORT, now);
            
            log('✅ Datos importados correctamente. Recargando página...');
            setTimeout(() => window.location.reload(), 500);
        },
    
        /**
         * Marca que el usuario hizo cambios y programa una exportación
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
                    
                    this.nextCheckIn = TIMING.CHECK_INTERVAL_S;
                    
                    setTimeout(() => {
                        this.skipNextCheck = false;
                        log('▶ Pausa post-exportación finalizada. Próximo check normal habilitado.');
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
         * Recopila datos de la app para el backup
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
                'shopItemsUpdated',
                'pointsUpdated',
                'habitsAutoUpdated' // Escuchar también este
            ];
            events.forEach(event => {
                window.App?.events?.on(event, (data) => {
        
                    if (event === 'habitsAutoUpdated' || 
                       (event === 'pointsUpdated' && data?.source === 'autoTicket') ||
                       (event === 'habitsUpdated' && data?.autoGenerated === true)) {
                        log(`🎟 Ignorado evento automático: ${event}.`);
                        return;
                    }
        
                    log(`📢 Cambio detectado por usuario: ${event}`);
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

    // La auto-inicialización se ha movido a app-init.js para centralizar el arranque.
    // Esto hace que GitHubSync sea un módulo más puro y que app-init.js sea el orquestador.
})();
