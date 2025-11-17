// focus-mode.js - Modo de enfoque ADHD para concentrarse en una sola misión
// Archivo principal simplificado - La lógica está en módulos separados:
// - focus-utils.js: Validaciones y utilidades
// - focus-scheduled.js: Lógica de tareas programadas
// - focus-render.js: Funciones de renderizado
(function(App) {
    'use strict';

    // Estado privado del modo enfoque
    let _isActive = false;
    let _currentFocusTaskId = null;
    let _initialized = false;

    /**
     * Inicializa el modo de enfoque
     */
    function init() {
        try {
            _createFocusModeElements();
            _attachEventListeners();
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
                    setTimeout(() => {
                        App.focusTimer.startTimer(task);
                        setTimeout(() => App.focusTimer.updateTimerDisplay(task.id), 100);
                    }, 100);
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
