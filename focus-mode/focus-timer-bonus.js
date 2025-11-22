// focus-timer-bonus.js - Sistema de cuenta atrás con bonus x2 para misiones con duración estimada
(function(App) {
    'use strict';

    // Estado del timer
    const STORAGE_KEY = 'focusTimerState';
    const BONUS_TRANSFER_KEY = 'focusBonusTransfer';
    let _activeTimer = null;
    let _intervalId = null;
    let _fabIntervalId = null;
    let _bonusTransferMs = 0; // Tiempo bonus a transferir a la siguiente tarea

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
     * Inicia un timer para una tarea con duración estimada o con tiempo transferido
     * @param {Object} task - La tarea para la cual iniciar el timer
     * @param {boolean} showTransferAnimation - Si es true, muestra animación de transferencia
     */
    function startTimer(task, showTransferAnimation = false) {
        // ⭐ NUEVO: Cargar tiempo bonus transferido primero
        _loadBonusTransfer();
        const hasTransfer = _bonusTransferMs > 0;
        
        // Si no hay duración Y no hay tiempo transferido, no crear timer
        if (!task.scheduleDuration && !hasTransfer) {
            return null;
        }
        
        // Si no hay duración pero SÍ hay tiempo transferido, usar solo el tiempo transferido
        if (!task.scheduleDuration && hasTransfer) {
            console.log(`⚡ Tarea sin duración pero con tiempo transferido: ${formatTimeRemaining(_bonusTransferMs)}`);
        }

        // ⭐ CRÍTICO: Si ya existe un timer activo para esta tarea, NO reiniciarlo
        _loadTimerState();
        if (_activeTimer && _activeTimer.taskId === task.id) {
            console.log('⏱️ Timer ya existe para esta tarea, continuando desde donde estaba...');
            // Reiniciar solo los intervalos de actualización
            _startInterval();
            _startFabInterval();
            return { taskId: task.id, existing: true };
        }

        // Convertir duración a milisegundos (si existe)
        let originalDurationMs = 0;
        
        if (task.scheduleDuration && task.scheduleDuration.value) {
            const durationValue = task.scheduleDuration.value;
            const durationUnit = task.scheduleDuration.unit;
            originalDurationMs = durationUnit === 'hours' 
                ? durationValue * 60 * 60 * 1000 
                : durationValue * 60 * 1000;
        }
        
        // Calcular duración total (original + transferido)
        const totalDurationMs = originalDurationMs + (hasTransfer ? _bonusTransferMs : 0);
        
        // Si después de todo no hay duración, salir
        if (totalDurationMs === 0) {
            return null;
        }

        // ⭐ FLUJO CORRECTO:
        // 1. Crear timer con tiempo ORIGINAL primero
        // 2. Renderizar HTML (muestra tiempo original)
        // 3. Animar la transferencia
        // 4. Actualizar timer a tiempo TOTAL
        
        // Crear el timer con tiempo ORIGINAL (no total)
        _activeTimer = {
            taskId: task.id,
            startTime: Date.now(),
            durationMs: originalDurationMs, // ⭐ Iniciar con tiempo ORIGINAL
            bonusActive: true
        };

        _saveTimerState();
        _startInterval();
        _startFabInterval();
        
        // Si hay transferencia con animación, ejecutarla DESPUÉS de que el HTML esté renderizado
        if (hasTransfer && showTransferAnimation) {
            // Esperar un frame para que el HTML se renderice con tiempo original
            setTimeout(() => {
                _animateTransferAndUpdate(task, originalDurationMs, _bonusTransferMs, totalDurationMs);
                _bonusTransferMs = 0;
                _clearBonusTransfer();
            }, 100);
        } else {
            // Si hay transferencia pero sin animación, actualizar directamente al tiempo total
            if (hasTransfer) {
                _activeTimer.durationMs = totalDurationMs;
                _saveTimerState();
                _bonusTransferMs = 0;
                _clearBonusTransfer();
            }
        }

        // Retornar un objeto temporal para indicar que el timer se está iniciando
        return { taskId: task.id, starting: true, hasTransfer: hasTransfer };
    }

    /**
     * Anima la transferencia de tiempo bonus Y actualiza el timer al tiempo total
     * PASO 1: Mostrar tiempo original (2s)
     * PASO 2: Animación de transferencia sutil (1.5s)
     * PASO 3: Actualizar timer a tiempo total y mostrar con pulso (0.6s)
     */
    function _animateTransferAndUpdate(task, originalMs, transferMs, totalMs) {
        const timerElement = document.querySelector('.focus-timer-container');
        if (!timerElement) {
            console.warn('⚠️ No se encontró .focus-timer-container para animar');
            return;
        }
        
        const timeDisplay = timerElement.querySelector('.focus-timer-time');
        if (!timeDisplay) {
            console.warn('⚠️ No se encontró .focus-timer-time para animar');
            return;
        }
        
        // PASO 1: Mostrar tiempo ORIGINAL con animación de inicio
        timerElement.classList.add('timer-starting');
        console.log(`🎬 PASO 1: Mostrando tiempo original ${formatTimeRemaining(originalMs)}`);
        
        setTimeout(() => {
            timerElement.classList.remove('timer-starting');
            
            // PASO 2: Mostrar animación de transferencia SUTIL (no tapa toda la pantalla)
            console.log(`🎬 PASO 2: Mostrando animación de transferencia +${formatTimeRemaining(transferMs)}`);
            _showSubtleTransferAnimation(transferMs, () => {
                
                // PASO 3: ACTUALIZAR el timer al tiempo TOTAL
                console.log(`🎬 PASO 3: Actualizando timer a tiempo total ${formatTimeRemaining(totalMs)}`);
                
                // ⭐ CRÍTICO: Actualizar la duración del timer activo
                if (_activeTimer && _activeTimer.taskId === task.id) {
                    _activeTimer.durationMs = totalMs;
                    // Mantener el mismo startTime para que el countdown sea correcto
                    _saveTimerState();
                }
                
                // Mostrar tiempo TOTAL con pulso de confirmación
                timerElement.classList.add('timer-started');
                timeDisplay.textContent = formatTimeRemaining(totalMs);
                
                setTimeout(() => {
                    timerElement.classList.remove('timer-started');
                    console.log('✅ Animación de transferencia completada y timer actualizado');
                    
                    // Forzar actualización del display
                    updateTimerDisplay(task.id);
                }, 600);
            });
        }, 2000);
    }

    /**
     * Detiene el timer actual y captura el tiempo bonus restante para transferir
     * @param {boolean} captureBonus - Si es true, guarda el tiempo restante para la siguiente tarea
     */
    function stopTimer(captureBonus = false) {
        // Capturar tiempo bonus restante antes de detener
        if (captureBonus && _activeTimer) {
            const state = getTimerState(_activeTimer.taskId);
            if (state && state.bonusActive && state.remainingMs > 0) {
                _bonusTransferMs = state.remainingMs;
                _saveBonusTransfer();
                console.log(`⏱️ Tiempo bonus capturado para transferir: ${formatTimeRemaining(_bonusTransferMs)}`);
            }
        }
        
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
            _startFabInterval(); // ⭐ También reiniciar intervalo del FAB
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
        // ⭐ NUEVO: Verificar si hay timer activo (puede ser por duración o por tiempo transferido)
        let state = getTimerState(task.id);
        
        // Si no hay estado de timer, verificar si la tarea tiene duración o hay tiempo transferido
        if (!state) {
            _loadBonusTransfer();
            const hasTransfer = _bonusTransferMs > 0;
            
            if (!task.scheduleDuration && !hasTransfer) {
                return ''; // No hay duración ni tiempo transferido, no mostrar timer
            }
        }

        state = getTimerState(task.id);
        
        let timeText, bonusClass, message;
        
        if (!state) {
            // Si no hay estado aún (timer no iniciado), calcular tiempo inicial
            let durationMs = 0;
            
            // Calcular duración de la tarea (si tiene)
            if (task.scheduleDuration && task.scheduleDuration.value) {
                const durationValue = task.scheduleDuration.value;
                const durationUnit = task.scheduleDuration.unit;
                durationMs = durationUnit === 'hours' 
                    ? durationValue * 60 * 60 * 1000 
                    : durationValue * 60 * 1000;
            }
            
            // Sumar tiempo bonus transferido (si hay)
            _loadBonusTransfer();
            if (_bonusTransferMs > 0) {
                durationMs += _bonusTransferMs;
            }
            
            timeText = formatTimeRemaining(durationMs);
            bonusClass = 'active';
            message = 'Bonus ×2';
        } else {
            timeText = formatTimeRemaining(state.remainingMs);
            bonusClass = state.bonusActive ? 'active' : 'expired';
            message = state.bonusActive ? 'Bonus ×2' : 'Expirado';
        }

        // ⭐ Verificar estado de la alarma
        const alarmEnabled = App.focusAlarm ? App.focusAlarm.isEnabled() : false;

        return `
            <div class="focus-timer-wrapper">
                <div class="focus-timer-container ${bonusClass}">
                    <span class="focus-timer-time">${timeText}</span>
                    <span class="focus-timer-message">${message}</span>
                </div>
                <label class="focus-alarm-toggle" 
                       title="${alarmEnabled ? 'Notificar al finalizar' : 'Sin notificación'}">
                    <input type="checkbox" class="alarm-checkbox" ${alarmEnabled ? 'checked' : ''}>
                    <span class="alarm-switch"></span>
                    <span class="alarm-label">Notificar al finalizar</span>
                </label>
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
            
            // ⭐ Disparar alarma si está habilitada
            if (App.focusAlarm && App.focusAlarm.isEnabled()) {
                const todayTasks = App.state?.getTodayTasks ? App.state.getTodayTasks() : [];
                const task = todayTasks.find(t => t.id === taskId);
                if (task) {
                    App.focusAlarm.trigger(task.name);
                }
            }
            
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
     * Solo se muestra cuando el focus mode está CERRADO y hay un timer activo
     */
    function renderFabBadge() {
        const fab = document.getElementById('focusModeToggleBtn');
        if (!fab) return;

        // Eliminar badge existente si hay
        const existingBadge = fab.querySelector('.focus-fab-timer-badge');
        if (existingBadge) {
            existingBadge.remove();
        }

        // ⭐ Solo mostrar badge si el focus mode está CERRADO
        if (App.focusMode && App.focusMode.isActive && App.focusMode.isActive()) {
            return; // Focus mode activo, no mostrar badge
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

        // Actualizar cada 100ms para evitar saltos de segundos
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
        }, 100); // Actualizar cada 100ms para suavidad
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
     * Guarda el tiempo bonus a transferir
     */
    function _saveBonusTransfer() {
        if (_bonusTransferMs > 0) {
            localStorage.setItem(BONUS_TRANSFER_KEY, _bonusTransferMs.toString());
        }
    }

    /**
     * Carga el tiempo bonus a transferir
     */
    function _loadBonusTransfer() {
        try {
            const saved = localStorage.getItem(BONUS_TRANSFER_KEY);
            if (saved) {
                _bonusTransferMs = parseInt(saved, 10);
            }
        } catch (error) {
            console.error('Error loading bonus transfer:', error);
            _bonusTransferMs = 0;
        }
    }

    /**
     * Limpia el tiempo bonus transferido
     */
    function _clearBonusTransfer() {
        localStorage.removeItem(BONUS_TRANSFER_KEY);
    }

    /**
     * Obtiene el tiempo bonus disponible para transferir
     */
    function getBonusTransfer() {
        _loadBonusTransfer();
        return _bonusTransferMs;
    }

    /**
     * ⚠️ DEPRECADO: Ya no se convierte tiempo a puntos, siempre se transfiere como countdown
     * Esta función se mantiene por compatibilidad pero siempre retorna 0
     */
    function convertBonusToPoints() {
        console.warn('⚠️ convertBonusToPoints está deprecado - el tiempo siempre se transfiere como countdown');
        return 0;
    }

    /**
     * Muestra animación SUTIL de transferencia (no tapa toda la pantalla)
     */
    function _showSubtleTransferAnimation(transferMs, onComplete) {
        const timerElement = document.querySelector('.focus-timer-container');
        if (!timerElement) {
            onComplete();
            return;
        }
        
        // Crear badge de transferencia encima del timer (no modal fullscreen)
        const transferBadge = document.createElement('div');
        transferBadge.className = 'bonus-transfer-badge';
        transferBadge.innerHTML = `
            <div class="transfer-badge-icon">⚡</div>
            <div class="transfer-badge-time">+${formatTimeRemaining(transferMs)}</div>
        `;
        
        // Insertar después del timer
        timerElement.parentNode.insertBefore(transferBadge, timerElement.nextSibling);
        
        // Animar entrada
        setTimeout(() => transferBadge.classList.add('active'), 50);
        
        // Animar salida y remover
        setTimeout(() => {
            transferBadge.classList.remove('active');
            transferBadge.classList.add('fade-out');
            
            setTimeout(() => {
                transferBadge.remove();
                onComplete();
            }, 400);
        }, 1500);
    }

    /**
     * Muestra animación COMPLETA de transferencia (modal fullscreen - DEPRECADA)
     * Mantenida por compatibilidad pero ya no se usa
     */
    function _showTransferAnimation(transferMs, onComplete) {
        const container = document.getElementById('focusModeContainer');
        if (!container) {
            onComplete();
            return;
        }
        
        // Crear elemento de animación
        const animation = document.createElement('div');
        animation.className = 'bonus-transfer-animation';
        animation.innerHTML = `
            <div class="transfer-icon">⚡</div>
            <div class="transfer-time">+${formatTimeRemaining(transferMs)}</div>
            <div class="transfer-message">Tiempo bonus transferido</div>
        `;
        
        document.body.appendChild(animation);
        
        // Animar y remover
        setTimeout(() => {
            animation.classList.add('active');
        }, 50);
        
        setTimeout(() => {
            animation.classList.add('fade-out');
        }, 2000);
        
        setTimeout(() => {
            animation.remove();
            onComplete();
        }, 2500);
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

    /**
     * Verifica si hay un timer activo para una tarea específica
     */
    function hasActiveTimer(taskId) {
        _loadTimerState();
        return _activeTimer && _activeTimer.taskId === taskId;
    }

    // API pública
    App.focusTimer = {
        startTimer,
        stopTimer,
        pauseInterval,
        resumeInterval,
        getTimerState,
        hasBonusActive,
        hasActiveTimer,
        calculatePoints,
        formatTimeRemaining,
        renderTimer,
        updateTimerDisplay,
        renderFabBadge,
        updateFabBadge,
        removeFabBadge,
        getBonusTransfer,
        convertBonusToPoints,
        init
    };

    // Auto-inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(window.App = window.App || {});
