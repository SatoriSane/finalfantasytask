// focus-mode.js - Modo de enfoque ADHD para concentrarse en una sola misión
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
            // Crear elementos del DOM si no existen
            _createFocusModeElements();
            
            // Escuchar eventos
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

        const firstIncompleteTask = _getFirstIncompleteTask();
        
        if (!firstIncompleteTask) {
            const msg = 'No hay misiones pendientes para hoy. ¡Buen trabajo! 🎉';
            App.events?.emit ? App.events.emit('shownotifyMessage', msg) : alert(msg);
            return;
        }

        _isActive = true;
        _currentFocusTaskId = firstIncompleteTask.id;

        document.getElementById('focusModeOverlay')?.classList.add('active');
        document.getElementById('focusModeContainer')?.classList.add('active');
        document.body.classList.add('focus-mode-active');

        _renderFocusedMission(firstIncompleteTask);
    }

    /**
     * Desactiva el modo de enfoque
     */
    function deactivate() {
        if (!_isActive) return;

        _isActive = false;
        _currentFocusTaskId = null;

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
     * Obtiene la primera tarea incompleta de hoy (respetando el orden guardado)
     */
    function _getFirstIncompleteTask() {
        const todayTasks = App.state.getTodayTasks();
        const incompleteTasks = todayTasks.filter(task => !task.completed);
        
        // Obtener el orden guardado
        const savedOrder = App.state.getTodayTaskOrder() || [];
        
        // Ordenar las tareas según el orden guardado
        const orderedTasks = [];
        const remainingTasks = new Set(incompleteTasks.map(t => t.id));
        
        // Primero agregar las tareas en el orden guardado
        savedOrder.forEach(id => {
            const task = incompleteTasks.find(t => t.id === id);
            if (task) {
                orderedTasks.push(task);
                remainingTasks.delete(id);
            }
        });
        
        // Luego agregar las tareas que no están en el orden guardado
        remainingTasks.forEach(id => {
            const task = incompleteTasks.find(t => t.id === id);
            if (task) orderedTasks.push(task);
        });
        
        return orderedTasks[0] || null;
    }


    /**
     * Obtiene datos de la tarea para renderizar
     */
    function _getTaskData(task) {
        const state = App.state.get();
        const mission = task.missionId ? state.missions.find(m => m.id === task.missionId) : null;
        
        // Categoría
        let categoryName = 'Sin propósito';
        const categoryId = task.categoryId || mission?.categoryId;
        if (categoryId) {
            const category = App.state.getCategoryById(categoryId);
            categoryName = category?.name || 'Sin propósito';
        }

        // Progreso
        const maxReps = task.dailyRepetitions?.max || 1;
        const currentReps = task.currentRepetitions || 0;
        const progressPercentage = (currentReps / maxReps) * 100;

        // Puntos (con bonus)
        const bonusMissionId = App.state.getBonusMissionForToday();
        const points = (task.missionId === bonusMissionId) ? task.points * 2 : task.points;

        return {
            categoryName,
            description: mission?.description || null,
            maxReps,
            currentReps,
            progressPercentage,
            points
        };
    }

    /**
     * Renderiza la misión enfocada
     */
    function _renderFocusedMission(task) {
        const container = document.getElementById('focusModeContainer');
        if (!container) return;

        const data = _getTaskData(task);

        container.innerHTML = `
            <div class="focus-mission-card${!data.description ? ' no-description' : ''}">
                <div class="focus-header">
                    <div class="focus-mission-label">Misión Actual</div>
                </div>
                
                <button class="focus-close-btn" aria-label="Cerrar modo zen">×</button>
                
                <div class="focus-content-wrapper">
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
                    
                    <div class="focus-bottom-section">
                        <button class="focus-action-btn" data-task-id="${task.id}">
                            <span class="focus-action-icon">✓</span>
                            <span class="focus-action-text">Completar</span>
                            <span class="focus-action-points">+${data.points}</span>
                        </button>
                    </div>
                </div>
                
                <div class="focus-footer">
                    <span class="focus-category">${data.categoryName}</span>
                </div>
            </div>
        `;

        // Adjuntar event listeners
        _attachMissionEventListeners(task.id);
    }

    /**
     * Adjunta event listeners a la misión renderizada
     */
    function _attachMissionEventListeners(taskId) {
        const container = document.getElementById('focusModeContainer');
        container?.querySelector('.focus-action-btn')?.addEventListener('click', () => _handleCompleteClick(taskId));
        container?.querySelector('.focus-close-btn')?.addEventListener('click', deactivate);
    }

    /**
     * Renderiza el estado vacío (sin misiones)
     */
    function _renderEmptyState() {
        const container = document.getElementById('focusModeContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="focus-mission-card no-description">
                <div class="focus-header">
                    <div class="focus-mission-label">Misión Actual</div>
                </div>
                
                <button class="focus-close-btn" aria-label="Cerrar modo zen">×</button>
                
                <div class="focus-content-wrapper">
                    <div class="focus-main-section">
                        <div class="focus-empty-icon">🎉</div>
                        <h1 class="focus-title">¡Todo Completado!</h1>
                        <p class="focus-empty-message">
                            No tienes misiones pendientes para hoy.<br>
                            ¡Excelente trabajo! Disfruta tu tiempo libre.
                        </p>
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

        container.querySelector('.focus-close-btn')?.addEventListener('click', deactivate);
        container.querySelector('.focus-exit-btn')?.addEventListener('click', deactivate);
    }

    /**
     * Muestra celebración al completar
     */
    function _showCelebration() {
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
    function _animateProgressBar(taskId) {
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

    /**
     * Maneja el click en el botón de completar
     */
    function _handleCompleteClick(taskId) {
        const btn = document.querySelector('.focus-action-btn');
        if (btn) {
            btn.classList.add('completing');
        }

        // Completar la tarea
        const success = App.state.completeTaskRepetition(taskId);

        if (success) {
            // Verificar si la tarea tiene repeticiones
            const todayTasks = App.state.getTodayTasks();
            const task = todayTasks.find(t => t.id === taskId);
            
            if (task && task.dailyRepetitions && task.dailyRepetitions.max > 1) {
                const currentReps = task.currentRepetitions || 0;
                const maxReps = task.dailyRepetitions.max;
                
                // Si aún quedan repeticiones, animar la barra
                if (currentReps < maxReps) {
                    _animateProgressBar(taskId);
                    
                    // Mostrar celebración pequeña
                    _showCelebration();
                    
                    // Quitar clase completing del botón
                    setTimeout(() => {
                        if (btn) btn.classList.remove('completing');
                    }, 600);
                    
                    return; // No avanzar a la siguiente misión
                }
            }
            
            // Si no hay más repeticiones o la tarea está completa, mostrar celebración y avanzar
            _showCelebration();
            
            setTimeout(() => {
                // Verificar si hay más tareas
                const nextTask = _getFirstIncompleteTask();
                
                if (nextTask) {
                    // Renderizar la siguiente misión
                    _currentFocusTaskId = nextTask.id;
                    _renderFocusedMission(nextTask);
                } else {
                    // No hay más misiones, mostrar estado vacío
                    _renderEmptyState();
                }
            }, 800);
        }
    }


    /**
     * Maneja cuando se actualizan las tareas
     */
    function _handleTasksUpdated() {
        if (!_isActive) return;

        // Verificar si la tarea actual todavía existe
        const currentTask = _getFirstIncompleteTask();
        
        if (!currentTask) {
            // No hay más tareas, mostrar estado vacío
            _renderEmptyState();
        } else if (currentTask.id !== _currentFocusTaskId) {
            // La tarea cambió, actualizar
            _currentFocusTaskId = currentTask.id;
            _renderFocusedMission(currentTask);
        }
    }

    // Exponer API pública
    App.focusMode = {
        init: init,
        activate: activate,
        deactivate: deactivate,
        toggle: toggle,
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
    }, true); // Usar capture phase para capturar antes que otros handlers

})(window.App = window.App || {});
