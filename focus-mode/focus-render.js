// focus-render.js - Funciones de renderizado para el modo focus
(function(App) {
    'use strict';

    /**
     * Renderiza una misión programada para el futuro con opciones de esperar o iniciar
     */
    function renderScheduledMission(task, minutesUntil, hasOtherTasks, callbacks) {
        const container = document.getElementById('focusModeContainer');
        if (!container) return;

        const data = App.focusUtils.getTaskData(task);
        const timeText = task.scheduleTime?.time || '';
        
        // Mensaje según si hay otras tareas disponibles
        const waitMessage = hasOtherTasks 
            ? 'Esta misión está programada para más tarde. Puedes iniciarla ahora o hacer otra misión mientras esperas.'
            : 'Esta misión está programada para más tarde. Puedes iniciarla ahora o esperar hasta la hora programada.';
        
        container.innerHTML = `
            <div class="focus-mission-card scheduled-mission${!data.description ? ' no-description' : ''}">
                <div class="focus-header">
                    <div class="focus-mission-label">⏰ Misión Programada</div>
                </div>
                
                <button class="focus-close-btn" aria-label="Cerrar modo zen">×</button>
                
                <div class="focus-content-wrapper">
                    <div class="focus-content-inner">
                        <div class="focus-main-section">
                            <h1 class="focus-title">${task.name}</h1>
                        </div>
                        
                        ${data.description ? `<div class="focus-description">${data.description}</div>` : ''}
                        
                        <div class="scheduled-message">
                            <span class="scheduled-message-icon">⏱️</span>
                            ${waitMessage}
                        </div>
                        
                        <div class="focus-scheduled-info">
                            <div class="scheduled-time-display">
                                <span class="scheduled-icon">⏰</span>
                                <span class="scheduled-time">${timeText}</span>
                            </div>
                            <div class="scheduled-countdown">
                                <span class="countdown-label">Comienza en</span>
                                <span class="countdown-value">${minutesUntil} min</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="focus-bottom-section">
                        <button class="focus-action-btn focus-start-early-btn" data-task-id="${task.id}">
                            <span class="focus-action-icon">▶</span>
                            <span class="focus-action-text">Iniciar Ahora</span>
                            <span class="focus-action-points">+${data.points}</span>
                        </button>
                        
                        ${hasOtherTasks ? `
                        <button class="focus-action-btn focus-skip-btn" data-task-id="${task.id}">
                            <span class="focus-action-icon">⏭️</span>
                            <span class="focus-action-text">Hacer Otra Misión</span>
                        </button>
                        ` : ''}
                    </div>
                </div>
                
                <div class="focus-footer">
                    <span class="focus-category">${data.categoryName}</span>
                </div>
            </div>
        `;

        // Adjuntar event listeners
        attachScheduledMissionEventListeners(task.id, hasOtherTasks, callbacks);
        
        // Iniciar countdown que actualiza cada minuto
        App.focusScheduled.startScheduledCountdown(task, minutesUntil, callbacks.onCountdownComplete);
    }

    /**
     * Adjunta event listeners a una misión programada
     */
    function attachScheduledMissionEventListeners(taskId, hasOtherTasks, callbacks) {
        const container = document.getElementById('focusModeContainer');
        
        // Botón "Iniciar Ahora"
        container?.querySelector('.focus-start-early-btn')?.addEventListener('click', () => {
            App.focusScheduled.stopScheduledCountdown();
            if (callbacks.onStartEarly) {
                callbacks.onStartEarly(taskId);
            }
        });
        
        // Botón "Hacer Otra Misión" (solo si hay otras tareas disponibles)
        if (hasOtherTasks) {
            container?.querySelector('.focus-skip-btn')?.addEventListener('click', () => {
                App.focusScheduled.stopScheduledCountdown();
                if (callbacks.onSkip) {
                    callbacks.onSkip(taskId);
                }
            });
        }
        
        // Botón cerrar
        container?.querySelector('.focus-close-btn')?.addEventListener('click', () => {
            App.focusScheduled.stopScheduledCountdown();
            if (callbacks.onClose) {
                callbacks.onClose();
            }
        });
    }

    /**
     * Renderiza la misión enfocada
     */
    function renderFocusedMission(task, callbacks) {
        const container = document.getElementById('focusModeContainer');
        if (!container) return;

        const data = App.focusUtils.getTaskData(task);
        
        // Verificar si ya hay un timer activo para esta tarea
        let timerHTML = '';
        let hasTimer = false;
        if (App.focusTimer && task.scheduleDuration) {
            hasTimer = true;
            const existingTimer = App.focusTimer.getTimerState(task.id);
            
            // Solo iniciar un nuevo timer si no existe uno activo para esta tarea
            if (!existingTimer) {
                App.focusTimer.startTimer(task);
            } else {
                // ⭐ Si existe un timer, reiniciar los intervalos de actualización
                console.log('🔄 Timer existente detectado, reiniciando intervalos...');
                App.focusTimer.resumeInterval();
            }
            
            timerHTML = App.focusTimer.renderTimer(container, task);
        }
        
        // Calcular puntos con bonus si aplica
        const displayPoints = App.focusTimer ? App.focusTimer.calculatePoints(task, data.points) : data.points;

        container.innerHTML = `
            <div class="focus-mission-card${!data.description ? ' no-description' : ''}">
                <div class="focus-header">
                    <div class="focus-mission-label">Misión Actual</div>
                </div>
                
                <button class="focus-close-btn" aria-label="Cerrar modo zen">×</button>
                
                <div class="focus-content-wrapper">
                    <div class="focus-content-inner">
                        <div class="focus-main-section">
                            <h1 class="focus-title">${task.name}</h1>
                        </div>
                        
                        ${data.description ? `<div class="focus-description">${data.description}</div>` : ''}
                        
                        ${data.maxReps > 1 ? `
                        <div class="focus-progress">
                            <div class="focus-progress-label">
                                <span>Repeticiones</span>
                                <span class="focus-progress-text">${data.currentReps} / ${data.maxReps}</span>
                            </div>
                            <div class="focus-progress-bar">
                                <div class="focus-progress-fill" style="width: ${data.progressPercentage}%"></div>
                            </div>
                        </div>` : ''}
                        
                        ${timerHTML}
                    </div>
                    
                    <div class="focus-bottom-section">
                        <button class="focus-action-btn" data-task-id="${task.id}">
                            <span class="focus-action-icon">✓</span>
                            <span class="focus-action-text">Completar</span>
                            <span class="focus-action-points">+${displayPoints}</span>
                        </button>
                    </div>
                </div>
                
                <div class="focus-footer">
                    <span class="focus-category">${data.categoryName}</span>
                </div>
            </div>
        `;

        // Adjuntar event listeners
        attachMissionEventListeners(task.id, callbacks);
        
        // ⭐ Adjuntar event listener del botón de alarma si hay timer
        if (hasTimer) {
            attachAlarmButtonListener();
        }
    }

    /**
     * Adjunta event listeners a la misión renderizada
     */
    function attachMissionEventListeners(taskId, callbacks) {
        const container = document.getElementById('focusModeContainer');
        container?.querySelector('.focus-action-btn')?.addEventListener('click', () => {
            if (callbacks.onComplete) {
                callbacks.onComplete(taskId);
            }
        });
        container?.querySelector('.focus-close-btn')?.addEventListener('click', () => {
            if (callbacks.onClose) {
                callbacks.onClose();
            }
        });
    }

    /**
     * Adjunta event listener al toggle de alarma
     */
    function attachAlarmButtonListener() {
        const alarmCheckbox = document.querySelector('.alarm-checkbox');
        if (!alarmCheckbox || !App.focusAlarm) return;
        
        alarmCheckbox.addEventListener('change', async (e) => {
            // El checkbox ya cambió visualmente, solo actualizamos el estado
            const enabled = await App.focusAlarm.toggle();
            
            // Si el toggle falló (ej: permisos denegados), revertir el checkbox
            if (enabled !== e.target.checked) {
                e.target.checked = enabled;
            }
        });
    }

    /**
     * Renderiza el estado vacío (sin misiones)
     */
    function renderEmptyState(callbacks) {
        const container = document.getElementById('focusModeContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="focus-mission-card no-description">
                <div class="focus-header">
                    <div class="focus-mission-label">Misión Actual</div>
                </div>
                
                <button class="focus-close-btn" aria-label="Cerrar modo zen">×</button>
                
                <div class="focus-content-wrapper">
                    <div class="focus-content-inner">
                        <div class="focus-main-section">
                            <div class="focus-empty-icon">🎉</div>
                            <h1 class="focus-title">¡Todo Completado!</h1>
                            <p class="focus-empty-message">
                                No tienes misiones pendientes para hoy.<br>
                                ¡Excelente trabajo! Disfruta tu tiempo libre.
                            </p>
                        </div>
                    </div>
                    
                    <div class="focus-bottom-section">
                        <button class="focus-action-btn focus-exit-btn">
                            <span class="focus-action-icon">🚪</span>
                            <span class="focus-action-text">Salir del Modo Zen</span>
                        </button>
                    </div>
                </div>
                
                <div class="focus-footer">
                    <span class="focus-category">Todas las misiones completadas</span>
                </div>
            </div>
        `;

        container.querySelector('.focus-close-btn')?.addEventListener('click', () => {
            if (callbacks.onClose) {
                callbacks.onClose();
            }
        });
        container.querySelector('.focus-exit-btn')?.addEventListener('click', () => {
            if (callbacks.onClose) {
                callbacks.onClose();
            }
        });
    }

    /**
     * Muestra celebración al completar
     */
    function showCelebration() {
        const celebration = document.createElement('div');
        celebration.className = 'focus-celebration';
        celebration.innerHTML = `
            <div class="focus-celebration-icon">✨</div>
            <div class="focus-celebration-text">¡Completado!</div>
        `;
        document.body.appendChild(celebration);

        // Crear confetti usando clases CSS
        const confettiClasses = ['confetti-green', 'confetti-purple', 'confetti-pink', 'confetti-light'];
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                const colorClass = confettiClasses[Math.floor(Math.random() * confettiClasses.length)];
                confetti.className = `focus-confetti ${colorClass}`;
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.animationDuration = (Math.random() * 0.5 + 1) + 's';
                document.body.appendChild(confetti);

                setTimeout(() => confetti.remove(), 1500);
            }, i * 30);
        }

        setTimeout(() => celebration.remove(), 800);
    }

    /**
     * Anima la barra de progreso
     */
    function animateProgressBar(taskId) {
        const progressBar = document.querySelector('.focus-progress-fill');
        const progressText = document.querySelector('.focus-progress-text');
        
        if (!progressBar || !progressText) return;

        // Obtener la tarea actualizada
        const task = App.state.getTodayTasks().find(t => t.id === taskId);
        if (!task) return;

        const maxReps = task.dailyRepetitions?.max || 1;
        const currentReps = task.currentRepetitions || 0;
        const newPercentage = (currentReps / maxReps) * 100;

        // Animar la barra (el CSS maneja la transición)
        progressBar.style.width = newPercentage + '%';
        progressText.textContent = `${currentReps} / ${maxReps}`;
    }

    // Exponer API pública
    App.focusRender = {
        renderScheduledMission,
        renderFocusedMission,
        renderEmptyState,
        showCelebration,
        animateProgressBar
    };

})(window.App = window.App || {});
