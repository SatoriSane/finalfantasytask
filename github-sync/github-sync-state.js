/* ===================================
   github-sync-state.js - GESTIÓN DE ESTADO
   Sistema de sincronización automática con GitHub (optimizado)
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
        INACTIVITY_THRESHOLD: 60000,
        DEBOUNCE_EXPORT: 2000,
        POST_EXPORT_PAUSE: 10000
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
        skipNextCheck: false,
        nextCheckIn: 0,
    
        /**
         * Inicializa el sistema
         */
        init() {
            log('▶ init() → Iniciando sistema de sincronización...');
            this.loadState();
    
            if (this.isConnected) {
                log('🔗 Usuario ya conectado, iniciando monitoreo y verificación automática.');
                this.startActivityMonitoring();
                this.startAutoCheck();
                this.listenToAppChanges();
    
                // ✅ Verificación inmediata si hace más de CHECK_INTERVAL desde la última importación
                const lastImportTime = new Date(this.lastImport || 0).getTime();
                const now = Date.now();
                if ((now - lastImportTime) > TIMING.CHECK_INTERVAL) {
                    log('⏱ Ha pasado más de 30s desde la última importación → check inmediato');
                    this.checkMeta();
                }
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
            this.isConnected = !!this.token;
    
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
            this.isConnected = true;
            log('✅ Conectado correctamente. Buscando o creando Gist...');
    
            await this.findOrCreateGist();
            log('📁 Gist listo:', this.gistId);
    
            await this.checkMeta();
    
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
                            },
                            'fftask-meta.json': {
                                content: JSON.stringify({
                                    timestamp: new Date().toISOString(),
                                    deviceId: this.deviceId
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
                }
            } catch (error) {
                console.error('[GitHubSync] ❌ Error al buscar/crear Gist:', error);
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
                    const inactiveTime = Date.now() - this.lastActivity;
                    if (inactiveTime > TIMING.INACTIVITY_THRESHOLD) {
                        log('💤 Usuario volvió tras inactividad. Revisando cambios...');
                        this.checkMeta();
                    }
                    this.lastActivity = Date.now();
                }
            });
    
            const updateActivity = () => {
                const now = Date.now();
                const wasInactive = (now - this.lastActivity) > TIMING.INACTIVITY_THRESHOLD;
                this.lastActivity = now;
                if (wasInactive && this.isPageVisible) {
                    log('👋 Actividad detectada después de pausa. Verificando...');
                    this.checkMeta();
                }
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
            this.counterInterval = setInterval(() => {
                if (this.isPageVisible && !this.isSyncing) {
                    this.nextCheckIn--;
                    this.updateUI();
                    if (this.nextCheckIn <= 0) this.nextCheckIn = 30;
                }
            }, 1000);
    
            this.checkTimer = setInterval(() => {
                if (this.isPageVisible && !this.skipNextCheck) {
                    this.checkMeta();
                }
                this.skipNextCheck = false;
            }, TIMING.CHECK_INTERVAL);
        },
    
        /**
         * Verifica cambios usando solo el archivo meta
         */
        async checkMeta() {
            if (!this.isConnected || !this.gistId || this.isSyncing) return;
    
            try {
                this.isSyncing = true;
                this.syncAction = 'check';
                this.nextCheckIn = 30;
                this.updateUI();
    
                log('🔍 Verificando cambios remotos (meta)...');
                const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
    
                if (!response.ok) return;
                const gist = await response.json();
                const metaContent = gist.files['fftask-meta.json']?.content;
                if (!metaContent) return;
    
                const meta = JSON.parse(metaContent);
                const isDifferentDevice = meta.deviceId !== this.deviceId;
                const isNewer = new Date(meta.timestamp) > new Date(this.lastImport || 0);
    
                if (isDifferentDevice || isNewer) {
                    log('📥 Cambios detectados según meta, descargando backup completo...');
                    await this.checkAndImport();
                } else {
                    log('✅ No hay cambios nuevos según meta.');
                }
            } catch (error) {
                console.error('[GitHubSync] ❌ Error al verificar meta:', error);
            } finally {
                this.isSyncing = false;
                this.syncAction = null;
                this.updateUI();
            }
        },
    
        /**
         * Verifica cambios remotos e importa automáticamente (backup completo)
         */
        async checkAndImport() {
            if (!this.isConnected || !this.gistId || this.isSyncing) return;
    
            try {
                this.isSyncing = true;
                this.syncAction = 'check';
                this.nextCheckIn = 30;
                this.updateUI();
    
                log('🔍 Descargando backup completo...');
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
                const isDifferentDevice = backup.deviceId !== this.deviceId;
                const isNewer = new Date(backup.timestamp) > new Date(this.lastImport || 0);
    
                if (isDifferentDevice || isNewer) {
                    log('📥 Cambios detectados desde otro dispositivo, iniciando importación...');
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
            if (!backup?.data) return;
            this.syncAction = 'import';
            this.updateUI();
    
            log('⬇️ Importando datos desde Gist...');
            const keepKeys = Object.values(STORAGE);
    
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (!keepKeys.includes(key)) localStorage.removeItem(key);
            }
    
            Object.entries(backup.data).forEach(([key, value]) => {
                localStorage.setItem(key, value);
            });
    
            const now = new Date().toISOString();
            this.lastImport = now;
            localStorage.setItem(STORAGE.LAST_IMPORT, now);
            log('✅ Datos importados correctamente. Recargando en 0.5s...');
    
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
    
                const contentBackup = JSON.stringify(data, null, 2);
                const meta = JSON.stringify({ timestamp: new Date().toISOString(), deviceId: this.deviceId }, null, 2);
    
                const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        files: {
                            'fftask-backup.json': { content: contentBackup },
                            'fftask-meta.json': { content: meta }
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
                    setTimeout(() => this.skipNextCheck = false, TIMING.POST_EXPORT_PAUSE);
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
            const data = { version: '1.0', timestamp: new Date().toISOString(), data: {} };
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!excludeKeys.includes(key)) {
                    data.data[key] = localStorage.getItem(key);
                }
            }
            return data;
        },
    
        /**
         * Escucha eventos de cambios en la app (excepto tickets)
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
    
                    if (event === 'habitsAutoUpdated') {
                        log('🎟 Ignorado: generación automática de tickets (habitsAutoUpdated).');
                        return;
                    }
    
                    if (event === 'pointsUpdated' && data?.source === 'autoTicket') {
                        log('🎟 Ignorado: actualización automática de puntos por ticket.');
                        return;
                    }
    
                    if (event === 'habitsUpdated' && data?.autoGenerated === true) {
                        log('🎟 Ignorado: actualización automática de hábitos.');
                        return;
                    }
    
                    log(`📢 Cambio detectado en la app: ${event}`);
                    this.markUserChanges();
                });
            });
        },
    
        updateUI() {
            window.GitHubSyncUI?.updateButton?.();
        },
    
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
        },
    
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
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.GitHubSync.init());
    } else {
        window.GitHubSync.init();
    }
    
    })();
    