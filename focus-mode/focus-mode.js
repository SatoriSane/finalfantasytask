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
        // Crear overlay si no existe
        if (!document.getElementById('focusModeOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'focusModeOverlay';
            overlay.className = 'focus-mode-overlay';
            document.body.appendChild(overlay);
        }

        // Crear contenedor principal si no existe
        if (!document.getElementById('focusModeContainer')) {
            const container = document.createElement('div');
            container.id = 'focusModeContainer';
            container.className = 'focus-mode-container';
            document.body.appendChild(container);
        }

        // El botón ya está en el HTML, no necesitamos crearlo
        // Solo verificamos que exista
        const focusBtn = document.getElementById('focusModeToggleBtn');
        if (focusBtn) {
            console.log('✅ Focus Mode button found in HTML');
        } else {
            console.warn('⚠️ Focus Mode button not found in HTML');
        }
    }

    /**
     * Adjunta event listeners
     */
    function _attachEventListeners() {
        try {
            // NO adjuntar listener al botón de toggle - se maneja con delegación de eventos
            console.log('✅ Focus Mode event listeners setup (toggle handled by delegation)');

            // Click en overlay para cerrar
            const overlay = document.getElementById('focusModeOverlay');
            if (overlay) {
                overlay.addEventListener('click', deactivate);
            }

            // Escuchar cuando se completan tareas (solo si App.events existe)
            if (window.App && window.App.events && typeof window.App.events.on === 'function') {
                App.events.on('taskCompleted', _handleTaskCompleted);
                App.events.on('todayTasksUpdated', _handleTasksUpdated);
            }
        } catch (error) {
            console.error('❌ Error attaching Focus Mode event listeners:', error);
        }
    }

    /**
     * Activa el modo de enfoque
     */
    function activate() {
        console.log('🎯 Activating Focus Mode...');
        
        if (_isActive) {
            console.log('⚠️ Focus Mode already active');
            return;
        }

        const firstIncompleteTask = _getFirstIncompleteTask();
        
        if (!firstIncompleteTask) {
            console.log('ℹ️ No incomplete tasks found');
            if (App.events && App.events.emit) {
                App.events.emit('shownotifyMessage', 'No hay misiones pendientes para hoy. ¡Buen trabajo! 🎉');
            } else {
                alert('No hay misiones pendientes para hoy. ¡Buen trabajo! 🎉');
            }
            return;
        }

        _isActive = true;
        _currentFocusTaskId = firstIncompleteTask.id;

        // Activar overlay y container
        const overlay = document.getElementById('focusModeOverlay');
        const container = document.getElementById('focusModeContainer');
        
        console.log('Overlay found:', !!overlay);
        console.log('Container found:', !!container);
        
        if (overlay) overlay.classList.add('active');
        if (container) container.classList.add('active');

        // Agregar clase al body para ocultar todo lo demás
        document.body.classList.add('focus-mode-active');

        // Renderizar la misión
        _renderFocusedMission(firstIncompleteTask);

        console.log('🎯 Focus Mode activated for task:', firstIncompleteTask.name);
    }

    /**
     * Desactiva el modo de enfoque
     */
    function deactivate() {
        if (!_isActive) return;

        _isActive = false;
        _currentFocusTaskId = null;

        // Desactivar overlay y container
        const overlay = document.getElementById('focusModeOverlay');
        const container = document.getElementById('focusModeContainer');
        
        if (overlay) overlay.classList.remove('active');
        if (container) container.classList.remove('active');

        // Quitar clase del body para restaurar todo
        document.body.classList.remove('focus-mode-active');

        console.log('🎯 Focus Mode deactivated');
    }

    /**
     * Toggle del modo de enfoque
     */
    function toggle() {
        console.log('🎯 Focus Mode toggle called');
        
        // Inicializar solo la primera vez que se llama
        if (!_initialized) {
            console.log('🎯 First time - initializing Focus Mode...');
            init();
            _initialized = true;
        }
        
        // Verificar que App.state esté disponible
        if (!window.App || !window.App.state) {
            console.error('❌ App.state not available');
            alert('El sistema aún no está listo. Por favor, espera un momento.');
            return;
        }
        
        if (_isActive) {
            deactivate();
        } else {
            activate();
        }
    }

    /**
     * Obtiene la primera tarea incompleta de hoy
     */
    function _getFirstIncompleteTask() {
        const todayTasks = App.state.getTodayTasks();
        return todayTasks.find(task => !task.completed);
    }

    /**
     * Obtiene el conteo de tareas incompletas
     */
    function _getIncompleteTasksCount() {
        const todayTasks = App.state.getTodayTasks();
        return todayTasks.filter(task => !task.completed).length;
    }

    /**
     * Renderiza la misión enfocada
     */
    function _renderFocusedMission(task) {
        const container = document.getElementById('focusModeContainer');
        if (!container) return;

        const state = App.state.get();
        const mission = task.missionId ? state.missions.find(m => m.id === task.missionId) : null;
        
        // Obtener información de categoría
        let categoryName = 'Sin propósito';
        if (task.categoryId) {
            const category = App.state.getCategoryById(task.categoryId);
            categoryName = category ? category.name : 'Sin propósito';
        } else if (mission && mission.categoryId) {
            const category = App.state.getCategoryById(mission.categoryId);
            categoryName = category ? category.name : 'Sin propósito';
        }

        // Calcular progreso de repeticiones
        const maxReps = task.dailyRepetitions ? task.dailyRepetitions.max : 1;
        const currentReps = task.currentRepetitions || 0;
        const progressPercentage = (currentReps / maxReps) * 100;

        // Calcular puntos (considerar bonus)
        const bonusMissionId = App.state.getBonusMissionForToday();
        let points = task.points;
        if (task.missionId && task.missionId === bonusMissionId) {
            points *= 2;
        }

        // Obtener descripción
        const description = mission && mission.description ? mission.description : null;

        container.innerHTML = `
            <div class="focus-mission-card${!description ? ' no-description' : ''}">
                <div class="focus-header">
                    <div class="focus-mission-label">Misión Actual</div>
                </div>
                
                <button class="focus-close-btn" aria-label="Cerrar modo zen">×</button>
                
                <div class="focus-content-wrapper">
                    <div class="focus-main-section">
                        <h1 class="focus-title">${task.name}</h1>
                    </div>
                    
                    ${description ? `<div class="focus-description">${description}</div>` : ''}
                    
                    ${maxReps > 1 ? `
                    <div class="focus-progress">
                        <div class="focus-progress-label">Progreso de Repeticiones</div>
                        <div class="focus-progress-bar">
                            <div class="focus-progress-fill" style="width: ${progressPercentage}%"></div>
                        </div>
                        <div class="focus-progress-text">${currentReps} / ${maxReps}</div>
                    </div>` : ''}
                    
                    <div class="focus-bottom-section">
                        <button class="focus-action-btn" data-task-id="${task.id}">
                            <span class="focus-action-icon">✓</span>
                            <span class="focus-action-text">Completar</span>
                            <span class="focus-action-points">+${points}</span>
                        </button>
                    </div>
                </div>
                
                <div class="focus-footer">
                    <span class="focus-category">${categoryName}</span>
                </div>
            </div>
        `;

        // Adjuntar event listeners
        const completeBtn = container.querySelector('.focus-action-btn');
        if (completeBtn) {
            completeBtn.addEventListener('click', () => _handleCompleteClick(task.id));
        }

        const closeBtn = container.querySelector('.focus-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', deactivate);
        }
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

        const closeBtn = container.querySelector('.focus-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', deactivate);
        }

        const exitBtn = container.querySelector('.focus-exit-btn');
        if (exitBtn) {
            exitBtn.addEventListener('click', deactivate);
        }
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

        // Crear confetti
        const colors = ['#58E478', '#667eea', '#764ba2', '#f093fb'];
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'focus-confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.top = '0';
                confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDelay = Math.random() * 0.3 + 's';
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
        const todayTasks = App.state.getTodayTasks();
        const task = todayTasks.find(t => t.id === taskId);
        
        if (!task) return;

        const maxReps = task.dailyRepetitions ? task.dailyRepetitions.max : 1;
        const currentReps = task.currentRepetitions || 0;
        const newPercentage = (currentReps / maxReps) * 100;

        // Animar la barra
        progressBar.style.width = newPercentage + '%';
        
        // Actualizar el texto
        progressText.textContent = `${currentReps} / ${maxReps}`;
        
        // Añadir efecto de pulso al texto
        progressText.style.animation = 'none';
        setTimeout(() => {
            progressText.style.animation = 'progressPulse 2s ease-in-out infinite';
        }, 10);
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
     * Maneja cuando se completa una tarea
     */
    function _handleTaskCompleted(taskId) {
        if (!_isActive) return;

        // Si la tarea completada es la que estamos mostrando
        if (_currentFocusTaskId === taskId) {
            // Ya se maneja en _handleCompleteClick
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

    // NO auto-inicializar - esperar a que el usuario haga click
    // Solo exponer la API pública
    console.log('🎯 Focus Mode script loaded (not initialized yet)');
    
    // Usar delegación de eventos para no interferir con otros event listeners
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
