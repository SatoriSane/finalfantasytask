// focus-timer-bonus.js - Sistema de cuenta atrás con bonus x2 para misiones con duración estimada
(function(App) {
    'use strict';

    // Estado del timer
    const STORAGE_KEY = 'focusTimerState';
    let _activeTimer = null;
    let _intervalId = null;
    let _fabIntervalId = null;

    /**
     * Estructura del timer activo:
     * {
     *   taskId: string,
     *   startTime: timestamp,
     *   durationMs: number (duración total en milisegundos),
     *   bonusActive: boolean
     * }
     */

    /**
     * Inicia un timer para una tarea con duración estimada
     */
    function startTimer(task) {
        if (!task.scheduleDuration || !task.scheduleDuration.value) {
            return null; // No hay duración estimada
        }

        // Convertir duración a milisegundos
        const durationValue = task.scheduleDuration.value;
        const durationUnit = task.scheduleDuration.unit;
        const durationMs = durationUnit === 'hours' 
            ? durationValue * 60 * 60 * 1000 
            : durationValue * 60 * 1000;

        // Agregar clase de inicio para animación
        const timerElement = document.querySelector('.focus-timer-container');
        if (timerElement) {
            timerElement.classList.add('timer-starting');
        }

        // Esperar 2 segundos antes de iniciar el countdown
        setTimeout(() => {
            _activeTimer = {
                taskId: task.id,
                startTime: Date.now(),
                durationMs: durationMs,
                bonusActive: true
            };

            _saveTimerState();
            _startInterval();
            _startFabInterval(); // Iniciar intervalo del FAB

            // Remover clase de inicio y agregar clase de activo
            if (timerElement) {
                timerElement.classList.remove('timer-starting');
                timerElement.classList.add('timer-started');
            }
        }, 2000);

        return _activeTimer;
    }

    /**
     * Detiene el timer actual (solo cuando se completa la tarea)
     */
    function stopTimer() {
        if (_intervalId) {
            clearInterval(_intervalId);
            _intervalId = null;
        }
        if (_fabIntervalId) {
            clearInterval(_fabIntervalId);
            _fabIntervalId = null;
        }
        _activeTimer = null;
        _clearTimerState();
        removeFabBadge();
    }

    /**
     * Pausa el intervalo de actualización (cuando se sale del modo focus)
     * pero mantiene el timer activo en segundo plano
     */
    function pauseInterval() {
        if (_intervalId) {
            clearInterval(_intervalId);
            _intervalId = null;
        }
    }

    /**
     * Reanuda el intervalo de actualización
     */
    function resumeInterval() {
        if (_activeTimer && !_intervalId) {
            _startInterval();
        }
    }

    /**
     * Obtiene el estado actual del timer para una tarea
     */
    function getTimerState(taskId) {
        _loadTimerState();

        if (!_activeTimer || _activeTimer.taskId !== taskId) {
            return null;
        }

        const elapsed = Date.now() - _activeTimer.startTime;
        const remaining = Math.max(0, _activeTimer.durationMs - elapsed);
        const bonusActive = remaining > 0;

        // Si el tiempo se acabó, actualizar el estado
        if (!bonusActive && _activeTimer.bonusActive) {
            _activeTimer.bonusActive = false;
            _saveTimerState();
        }

        return {
            taskId: _activeTimer.taskId,
            remainingMs: remaining,
            totalMs: _activeTimer.durationMs,
            bonusActive: bonusActive,
            percentage: (remaining / _activeTimer.durationMs) * 100
        };
    }

    /**
     * Verifica si una tarea tiene bonus activo
     */
    function hasBonusActive(taskId) {
        const state = getTimerState(taskId);
        return state ? state.bonusActive : false;
    }

    /**
     * Calcula los puntos con bonus si aplica
     */
    function calculatePoints(task, basePoints) {
        const hasBonus = hasBonusActive(task.id);
        return hasBonus ? basePoints * 2 : basePoints;
    }

    /**
     * Formatea el tiempo restante en formato legible
     */
    function formatTimeRemaining(ms) {
        if (ms <= 0) return '00:00';

        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    /**
     * Renderiza el componente visual del timer
     */
    function renderTimer(container, task) {
        const state = getTimerState(task.id);
        
        if (!state) {
            return ''; // No hay timer para esta tarea
        }

        const timeText = formatTimeRemaining(state.remainingMs);
        const bonusClass = state.bonusActive ? 'active' : 'expired';
        const message = state.bonusActive ? 'Bonus ×2' : 'Expirado';

        return `
            <div class="focus-timer-container ${bonusClass}">
                <span class="focus-timer-time">${timeText}</span>
                <span class="focus-timer-message">${message}</span>
            </div>
        `;
    }

    /**
     * Actualiza el display del timer en el DOM
     */
    function updateTimerDisplay(taskId) {
        const timerElement = document.querySelector('.focus-timer-container');
        if (!timerElement) return;

        const state = getTimerState(taskId);
        if (!state) return;

        const timeText = formatTimeRemaining(state.remainingMs);
        const timeDisplay = timerElement.querySelector('.focus-timer-time');
        const messageDisplay = timerElement.querySelector('.focus-timer-message');

        if (timeDisplay) timeDisplay.textContent = timeText;

        // Actualizar estado visual si el bonus expiró
        if (!state.bonusActive && timerElement.classList.contains('active')) {
            timerElement.classList.remove('active');
            timerElement.classList.add('expired');
            
            // Actualizar mensaje
            if (messageDisplay) messageDisplay.textContent = 'Expirado';
            
            // Actualizar puntos del botón inmediatamente
            _updateButtonPoints(taskId, false);
            
            // Notificar al usuario
            if (App.events?.emit) {
                App.events.emit('shownotifyMessage', '⏱️ El tiempo del bonus ha expirado');
            }
        } else if (state.bonusActive && timerElement.classList.contains('expired')) {
            // Si el timer se reinició (nueva repetición), restaurar estado activo
            timerElement.classList.remove('expired');
            timerElement.classList.add('active');
            
            // Actualizar mensaje
            if (messageDisplay) messageDisplay.textContent = 'Bonus ×2';
            
            // Actualizar puntos del botón inmediatamente
            _updateButtonPoints(taskId, true);
        }
    }

    /**
     * Actualiza los puntos mostrados en el botón de completar
     */
    function _updateButtonPoints(taskId, hasBonus) {
        const button = document.querySelector('.focus-action-btn');
        if (!button) return;

        const pointsSpan = button.querySelector('.focus-action-points');
        if (!pointsSpan) return;

        // Obtener los puntos base de la tarea
        const todayTasks = App.state?.getTodayTasks ? App.state.getTodayTasks() : [];
        const task = todayTasks.find(t => t.id === taskId);
        if (!task) return;

        // Calcular puntos con o sin bonus
        const bonusMissionId = App.state?.getBonusMissionForToday ? App.state.getBonusMissionForToday() : null;
        let basePoints = Math.abs(task.points);
        if (task.missionId === bonusMissionId) basePoints *= 2;

        const displayPoints = hasBonus ? basePoints * 2 : basePoints;
        pointsSpan.textContent = `+${displayPoints}`;
    }

    /**
     * Renderiza el badge del timer en el FAB
     */
    function renderFabBadge() {
        const fab = document.getElementById('focusModeToggleBtn');
        if (!fab) return;

        // Eliminar badge existente si hay
        const existingBadge = fab.querySelector('.focus-fab-timer-badge');
        if (existingBadge) {
            existingBadge.remove();
        }

        // Si no hay timer activo, no mostrar badge
        _loadTimerState();
        if (!_activeTimer) return;

        const state = getTimerState(_activeTimer.taskId);
        if (!state) return;

        // Crear badge
        const badge = document.createElement('div');
        badge.className = `focus-fab-timer-badge ${state.bonusActive ? '' : 'expired'}`;
        badge.textContent = formatTimeRemaining(state.remainingMs);
        fab.appendChild(badge);
    }

    /**
     * Actualiza el badge del FAB
     */
    function updateFabBadge() {
        const badge = document.querySelector('.focus-fab-timer-badge');
        if (!badge || !_activeTimer) return;

        const state = getTimerState(_activeTimer.taskId);
        if (!state) {
            badge.remove();
            return;
        }

        badge.textContent = formatTimeRemaining(state.remainingMs);
        
        // Actualizar clase si expiró
        if (!state.bonusActive && !badge.classList.contains('expired')) {
            badge.classList.add('expired');
        }
    }

    /**
     * Elimina el badge del FAB
     */
    function removeFabBadge() {
        const badge = document.querySelector('.focus-fab-timer-badge');
        if (badge) {
            badge.remove();
        }
    }

    /**
     * Inicia el intervalo de actualización del timer en el modo focus
     */
    function _startInterval() {
        if (_intervalId) {
            clearInterval(_intervalId);
        }

        _intervalId = setInterval(() => {
            if (_activeTimer) {
                updateTimerDisplay(_activeTimer.taskId);
                
                // Si el timer expiró, detener el intervalo
                const state = getTimerState(_activeTimer.taskId);
                if (state && !state.bonusActive) {
                    clearInterval(_intervalId);
                    _intervalId = null;
                }
            }
        }, 1000); // Actualizar cada segundo
    }

    /**
     * Inicia el intervalo de actualización del badge del FAB
     */
    function _startFabInterval() {
        if (_fabIntervalId) {
            clearInterval(_fabIntervalId);
        }

        _fabIntervalId = setInterval(() => {
            if (_activeTimer) {
                updateFabBadge();
            }
        }, 1000); // Actualizar cada segundo
    }

    /**
     * Guarda el estado del timer en localStorage
     */
    function _saveTimerState() {
        if (_activeTimer) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(_activeTimer));
        }
    }

    /**
     * Carga el estado del timer desde localStorage
     */
    function _loadTimerState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                _activeTimer = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading timer state:', error);
            _activeTimer = null;
        }
    }

    /**
     * Limpia el estado del timer del localStorage
     */
    function _clearTimerState() {
        localStorage.removeItem(STORAGE_KEY);
    }

    /**
     * Inicializa el sistema de timer (restaura estado si existe)
     */
    function init() {
        _loadTimerState();
        
        // Si hay un timer activo, reiniciar intervalos y mostrar badge
        if (_activeTimer) {
            const state = getTimerState(_activeTimer.taskId);
            if (state) {
                renderFabBadge();
                _startFabInterval(); // Iniciar intervalo del FAB
            } else {
                // Timer expirado, limpiar
                stopTimer();
            }
        }
    }

    // API pública
    App.focusTimer = {
        startTimer,
        stopTimer,
        pauseInterval,
        resumeInterval,
        getTimerState,
        hasBonusActive,
        calculatePoints,
        formatTimeRemaining,
        renderTimer,
        updateTimerDisplay,
        renderFabBadge,
        updateFabBadge,
        removeFabBadge,
        init
    };

    // Auto-inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(window.App = window.App || {});
