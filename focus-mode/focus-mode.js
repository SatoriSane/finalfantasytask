// focus-mode.js - Modo de enfoque ADHD para concentrarse en una sola misión
// Archivo principal simplificado - La lógica está en módulos separados:
// - focus-utils.js: Validaciones y utilidades
// - focus-scheduled.js: Lógica de tareas programadas
// - focus-render.js: Funciones de renderizado
(function(App) {
    'use strict';

    // ⭐ STORAGE KEY para persistencia
    const FOCUS_MODE_STORAGE_KEY = 'focusModeState';

    // Estado privado del modo enfoque
    let _isActive = false;
    let _currentFocusTaskId = null;
    let _initialized = false;

    /**
     * Guarda el estado del modo focus en localStorage
     */
    function _saveFocusState() {
        const state = {
            isActive: _isActive,
            currentFocusTaskId: _currentFocusTaskId,
            timestamp: Date.now()
        };
        localStorage.setItem(FOCUS_MODE_STORAGE_KEY, JSON.stringify(state));
    }

    /**
     * Carga el estado del modo focus desde localStorage
     */
    function _loadFocusState() {
        try {
            const saved = localStorage.getItem(FOCUS_MODE_STORAGE_KEY);
            if (saved) {
                const state = JSON.parse(saved);
                // Solo restaurar si el timestamp es reciente (menos de 24 horas)
                const hoursSinceUpdate = (Date.now() - state.timestamp) / (1000 * 60 * 60);
                if (hoursSinceUpdate < 24) {
                    return state;
                }
            }
        } catch (error) {
            console.error('Error loading focus state:', error);
        }
        return null;
    }

    /**
     * Limpia el estado del modo focus del localStorage
     */
    function _clearFocusState() {
        localStorage.removeItem(FOCUS_MODE_STORAGE_KEY);
    }

    /**
     * Inicializa el modo de enfoque
     */
    function init() {
        try {
            _createFocusModeElements();
            _attachEventListeners();
            
            // ⭐ Restaurar estado si existe (para sincronización entre dispositivos)
            const savedState = _loadFocusState();
            if (savedState && savedState.isActive && savedState.currentFocusTaskId) {
                console.log('🔄 Restaurando estado del modo focus desde localStorage');
                // Auto-activar después de un pequeño delay para asegurar que App.state esté listo
                setTimeout(() => {
                    const task = App.state?.getTodayTasks()?.find(t => t.id === savedState.currentFocusTaskId);
                    if (task) {
                        console.log('✅ Auto-activando modo focus con tarea:', task.name);
                        _isActive = true;
                        _currentFocusTaskId = task.id;
                        
                        document.getElementById('focusModeOverlay')?.classList.add('active');
                        document.getElementById('focusModeContainer')?.classList.add('active');
                        document.body.classList.add('focus-mode-active');
                        
                        if (App.focusTimer) {
                            App.focusTimer.resumeInterval();
                            App.focusTimer.removeFabBadge();
                        }
                        
                        _renderFocusedMission(task);
                    } else {
                        console.warn('⚠️ No se encontró la tarea guardada, limpiando estado');
                        _clearFocusState();
                    }
                }, 500);
            }
            
            console.log('✅ Focus Mode initialized');
        } catch (error) {
            console.error('❌ Error initializing Focus Mode:', error);
        }
    }

    /**
     * Crea los elementos del DOM necesarios
     */
    function _createFocusModeElements() {
        if (!document.getElementById('focusModeOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'focusModeOverlay';
            overlay.className = 'focus-mode-overlay';
            document.body.appendChild(overlay);
        }

        if (!document.getElementById('focusModeContainer')) {
            const container = document.createElement('div');
            container.id = 'focusModeContainer';
            container.className = 'focus-mode-container';
            document.body.appendChild(container);
        }
    }

    /**
     * Adjunta event listeners
     */
    function _attachEventListeners() {
        const overlay = document.getElementById('focusModeOverlay');
        if (overlay) overlay.addEventListener('click', deactivate);

        if (App.events?.on) {
            App.events.on('taskCompleted', _handleTaskCompleted);
            App.events.on('todayTasksUpdated', _handleTasksUpdated);
        }
    }

    /**
     * Activa el modo de enfoque
     */
    function activate() {
        if (_isActive) return;

        const result = App.focusScheduled.getNextAvailableTask();
        
        if (!result.task && !result.nextScheduledTask) {
            const msg = 'No hay misiones pendientes para hoy. ¡Buen trabajo! 🎉';
            App.events?.emit ? App.events.emit('shownotifyMessage', msg) : alert(msg);
            return;
        }

        _isActive = true;

        if (App.focusTimer) {
            App.focusTimer.resumeInterval();
            App.focusTimer.removeFabBadge();
        }

        document.getElementById('focusModeOverlay')?.classList.add('active');
        document.getElementById('focusModeContainer')?.classList.add('active');
        document.body.classList.add('focus-mode-active');

        if (result.task) {
            _currentFocusTaskId = result.task.id;
            _renderFocusedMission(result.task);
        } else {
            _currentFocusTaskId = result.nextScheduledTask.id;
            _renderScheduledMission(result.nextScheduledTask, result.minutesUntilNext, result.hasOtherAvailableTasks);
        }

        // ⭐ Guardar estado para sincronización
        _saveFocusState();
        
        // ⭐ Emitir evento para que GitHub Sync detecte el cambio
        if (App.events?.emit) {
            App.events.emit('stateChanged', { source: 'focusMode', action: 'activate' });
        }
    }

    /**
     * Desactiva el modo de enfoque
     */
    function deactivate() {
        if (!_isActive) return;

        _isActive = false;
        _currentFocusTaskId = null;
        
        App.focusScheduled.stopScheduledCountdown();
        
        if (App.focusTimer) {
            App.focusTimer.pauseInterval();
            App.focusTimer.renderFabBadge();
        }

        document.getElementById('focusModeOverlay')?.classList.remove('active');
        document.getElementById('focusModeContainer')?.classList.remove('active');
        document.body.classList.remove('focus-mode-active');

        // ⭐ Limpiar estado guardado
        _clearFocusState();
        
        // ⭐ Emitir evento para que GitHub Sync detecte el cambio
        if (App.events?.emit) {
            App.events.emit('stateChanged', { source: 'focusMode', action: 'deactivate' });
        }
    }

    /**
     * Toggle del modo de enfoque
     */
    function toggle() {
        if (!_initialized) {
            init();
            _initialized = true;
        }
        
        if (!App?.state) {
            alert('El sistema aún no está listo. Por favor, espera un momento.');
            return;
        }
        
        _isActive ? deactivate() : activate();
    }

    /**
     * Renderiza una misión programada
     */
    function _renderScheduledMission(task, minutesUntil, hasOtherTasks) {
        const callbacks = {
            onStartEarly: (taskId) => {
                const task = App.state.getTodayTasks().find(t => t.id === taskId);
                if (task) _renderFocusedMission(task);
            },
            onSkip: (taskId) => {
                const result = App.focusScheduled.getNextAvailableTask(taskId);
                if (result.task) {
                    _currentFocusTaskId = result.task.id;
                    _renderFocusedMission(result.task);
                } else if (result.nextScheduledTask) {
                    _currentFocusTaskId = result.nextScheduledTask.id;
                    _renderScheduledMission(result.nextScheduledTask, result.minutesUntilNext, result.hasOtherAvailableTasks);
                } else {
                    App.focusRender.renderEmptyState({ onClose: deactivate });
                }
            },
            onClose: deactivate,
            onCountdownComplete: (task) => {
                if (_isActive && _currentFocusTaskId === task.id) {
                    _renderFocusedMission(task);
                }
            }
        };

        App.focusRender.renderScheduledMission(task, minutesUntil, hasOtherTasks, callbacks);
    }

    /**
     * Renderiza la misión enfocada
     */
    function _renderFocusedMission(task) {
        const callbacks = {
            onComplete: _handleCompleteClick,
            onClose: deactivate
        };

        App.focusRender.renderFocusedMission(task, callbacks);
    }

    /**
     * Maneja el click en el botón de completar
     */
    function _handleCompleteClick(taskId) {
        const btn = document.querySelector('.focus-action-btn');
        if (btn) btn.classList.add('completing');

        const todayTasks = App.state.getTodayTasks();
        const task = todayTasks.find(t => t.id === taskId);
        
        let bonusPoints = 0;
        if (App.focusTimer && task) {
            const hasBonus = App.focusTimer.hasBonusActive(taskId);
            if (hasBonus) {
                bonusPoints = task.points;
                console.log(`🎯 Bonus x2 aplicado! +${bonusPoints} puntos extra`);
            }
        }

        const success = App.state.completeTaskRepetition(taskId);

        if (success) {
            if (bonusPoints > 0) {
                App.state.addPoints(bonusPoints, { silentUI: false });
                App.events.emit('shownotifyMessage', `⚡ ¡BONUS x2! +${bonusPoints} puntos extra por completar a tiempo`);
            }
            
            const hasMoreReps = task && task.dailyRepetitions && task.dailyRepetitions.max > 1;
            const currentReps = task ? (task.currentRepetitions || 0) : 0;
            const maxReps = task ? (task.dailyRepetitions?.max || 1) : 1;
            const stillHasReps = hasMoreReps && currentReps < maxReps;
            
            if (stillHasReps) {
                if (App.focusTimer && task.scheduleDuration) {
                    App.focusTimer.stopTimer();
                    // Esperar un poco antes de reiniciar para que el usuario vea la celebración
                    setTimeout(() => {
                        App.focusTimer.startTimer(task);
                        // El timer ya tiene su propio delay de 2s y animación
                    }, 800);
                }
                
                App.focusRender.animateProgressBar(taskId);
                App.focusRender.showCelebration();
                
                setTimeout(() => {
                    if (btn) btn.classList.remove('completing');
                }, 600);
                
                return;
            } else {
                if (App.focusTimer) App.focusTimer.stopTimer();
            }
            
            App.focusRender.showCelebration();
            
            setTimeout(() => {
                const result = App.focusScheduled.getNextAvailableTask();
                
                if (result.task) {
                    _currentFocusTaskId = result.task.id;
                    _renderFocusedMission(result.task);
                } else if (result.nextScheduledTask) {
                    _currentFocusTaskId = result.nextScheduledTask.id;
                    _renderScheduledMission(result.nextScheduledTask, result.minutesUntilNext, result.hasOtherAvailableTasks);
                } else {
                    App.focusRender.renderEmptyState({ onClose: deactivate });
                }
            }, 800);
        }
    }

    /**
     * Maneja cuando se completa una tarea (evento externo)
     */
    function _handleTaskCompleted() {
        // Manejado por _handleCompleteClick
    }

    /**
     * Maneja cuando se actualizan las tareas
     */
    function _handleTasksUpdated() {
        if (!_isActive) return;

        const result = App.focusScheduled.getNextAvailableTask();
        
        if (!result.task && !result.nextScheduledTask) {
            App.focusRender.renderEmptyState({ onClose: deactivate });
        } else if (result.task && result.task.id !== _currentFocusTaskId) {
            _currentFocusTaskId = result.task.id;
            _renderFocusedMission(result.task);
        } else if (!result.task && result.nextScheduledTask) {
            if (result.nextScheduledTask.id !== _currentFocusTaskId) {
                _currentFocusTaskId = result.nextScheduledTask.id;
                _renderScheduledMission(result.nextScheduledTask, result.minutesUntilNext, result.hasOtherAvailableTasks);
            }
        }
    }

    // Exponer API pública
    App.focusMode = {
        init,
        activate,
        deactivate,
        toggle,
        isActive: () => _isActive
    };

    // Delegación de eventos para el botón de toggle
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'focusModeToggleBtn') {
            e.preventDefault();
            e.stopPropagation();
            toggle();
        } else if (e.target && e.target.closest('#focusModeToggleBtn')) {
            e.preventDefault();
            e.stopPropagation();
            toggle();
        }
    }, true);

})(window.App = window.App || {});
