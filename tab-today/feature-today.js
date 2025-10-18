
// tab-today/feature-today.js
(function(App) {
    'use strict';

    // --- PRIVATE STATE ---
let _prevGlobalProgress = null;
// --- PRIVATE STATE ---
let _currentCategoryFilter = null;
let _currentViewDate = null; // siempre almacenada como string YYYY-MM-DD

// --- PRIVATE METHODS ---

/**
 * Obtiene la fecha que se está visualizando actualmente (por defecto: hoy)
 * @returns {string} Fecha actual en formato YYYY-MM-DD
 */
function _getCurrentViewDate() {
    if (!_currentViewDate) {
        _currentViewDate = App.utils.getFormattedDate(); // hoy por defecto
    }
    return _currentViewDate;
}

/**
 * Navega a una fecha específica (string YYYY-MM-DD)
 */
function _navigateToDate(dateString) {
    _currentViewDate = dateString;
    App.ui.today.render();
}

/**
 * Navega un día hacia atrás
 */
function _navigatePrevDay() {
    const currentDate = App.utils.normalizeDateToStartOfDay(_getCurrentViewDate());
    const prevDate = App.utils.addDateUnit(currentDate, -1, 'day');
    _navigateToDate(App.utils.getFormattedDate(prevDate));
}

/**
 * Navega un día hacia adelante
 */
function _navigateNextDay() {
    const currentDate = App.utils.normalizeDateToStartOfDay(_getCurrentViewDate());
    const nextDate = App.utils.addDateUnit(currentDate, 1, 'day');
    _navigateToDate(App.utils.getFormattedDate(nextDate));
}

/**
 * Verifica si la fecha visualizada es hoy
 */
function _isViewingToday() {
    return _getCurrentViewDate() === App.utils.getFormattedDate();
}

/**
 * Formatea la fecha para mostrar en el título
 */
function _formatDateTitle(dateString) {
    const today = App.utils.getFormattedDate();
    const tomorrow = App.utils.getFormattedDate(
        App.utils.addDateUnit(App.utils.normalizeDateToStartOfDay(new Date()), 1, 'day')
    );
    const yesterday = App.utils.getFormattedDate(
        App.utils.addDateUnit(App.utils.normalizeDateToStartOfDay(new Date()), -1, 'day')
    );
    
    if (dateString === today) return "Misiones de Hoy";
    if (dateString === tomorrow) return "Mañana";
    if (dateString === yesterday) return "Ayer";
    
    const date = App.utils.normalizeDateToStartOfDay(dateString);
    
    // Obtener día de la semana
    const weekdayOptions = { weekday: 'long' };
    const weekday = date.toLocaleDateString('es-ES', weekdayOptions);
    
    // Obtener día y mes
    const dateOptions = { day: 'numeric', month: 'long' };
    const dateFormatted = date.toLocaleDateString('es-ES', dateOptions);
    
    // Retornar con salto de línea
    return `${weekday}<br>${dateFormatted}`;
}

    /**
     * @description Renderiza la barra de progreso de puntos global para el día de hoy.
     * @param {number} totalPoints - Puntos totales posibles para hoy.
     * @param {number} earnedPoints - Puntos ganados hasta ahora.
     * @param {boolean} allowAnimate - Si se debe animar la barra.
     */
    function _renderGlobalPointsBar(totalPoints, earnedPoints, allowAnimate) {
        let wrapper = document.querySelector(".today-points-bar-wrapper");
        if (!wrapper) {
            const tabToday = document.getElementById("tab-today");
            wrapper = document.createElement("div");
            wrapper.className = "today-points-bar-wrapper";
            tabToday.insertBefore(wrapper, tabToday.firstChild);
        }

        let progressDiv = wrapper.querySelector(".points-progress");
        let netPointsValue = wrapper.querySelector(".net-points-value");

        if (!progressDiv) {
            wrapper.innerHTML = `
                <span class="points-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2L9.19 8.68L2 9.27L7.54 13.91L5.75 21.02L12 17.5L18.25 21.02L16.46 13.91L22 9.27L14.81 8.68L12 2Z"></path>
                    </svg>
                </span>
                <div class="net-points-bar">
                    <div class="points-progress"></div>
                </div>
                <span class="net-points-value"></span>
            `;
            progressDiv = wrapper.querySelector(".points-progress");
            netPointsValue = wrapper.querySelector(".net-points-value");
        }

        netPointsValue.textContent = `${earnedPoints} / ${totalPoints}`;

        const newWidth = totalPoints === 0 ? 0 : (earnedPoints / totalPoints) * 100;
        const prev = _prevGlobalProgress ?? newWidth;
        progressDiv.style.width = prev + "%";

        if (allowAnimate && newWidth !== prev) {
            requestAnimationFrame(() => {
                progressDiv.style.width = `${newWidth}%`;
            });
        }
        _prevGlobalProgress = newWidth;
    }


    function _openEditTemporaryTaskModal(taskId) {
        const modal = document.getElementById('editTemporaryTaskModal');
        const form = document.getElementById('editTemporaryTaskForm');
        const taskIdInput = document.getElementById('editTemporaryTaskId');
        const nameInput = document.getElementById('editTemporaryTaskName');
        const pointsInput = document.getElementById('editTemporaryTaskPoints');
        const closeBtn = modal.querySelector('.modal-close-btn');
    
        const viewDate = _getCurrentViewDate();
        const state = App.state.get();
        const tasks = state.tasksByDate[viewDate] || [];
        const task = tasks.find(t => t.id === taskId);
    
        if (!task || !modal) return;
    
        taskIdInput.value = task.id;
        nameInput.value = task.name;
        pointsInput.value = task.points;
    
        let repsInput = form.querySelector('#editTemporaryTaskReps');
        if (!repsInput) {
            const repsGroup = document.createElement('div');
            repsGroup.className = 'form-group';
            repsGroup.innerHTML = `
                <label for="editTemporaryTaskReps">Repeticiones máximas:</label>
                <input type="number" id="editTemporaryTaskReps" min="1" />
            `;
            const actions = form.querySelector('.modal-actions');
            if (actions) {
                form.insertBefore(repsGroup, actions);
            } else {
                form.appendChild(repsGroup);
            }
            repsInput = repsGroup.querySelector('input');
        }
        repsInput.value = (task.dailyRepetitions && task.dailyRepetitions.max) || 1;
    
        let deleteBtn = form.querySelector('.delete-temp-task-btn');
        if (!deleteBtn) {
            const actions = form.querySelector('.modal-actions');
            deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'delete-temp-task-btn danger';
            deleteBtn.textContent = 'Eliminar tarea';

            if (actions) {
                const saveBtn = actions.querySelector('button[type="submit"]');
                if (saveBtn) {
                    actions.insertBefore(deleteBtn, saveBtn);
                } else {
                    actions.appendChild(deleteBtn);
                }
            } else {
                form.appendChild(deleteBtn);
            }
        }
    
        modal.classList.add('visible');
        nameInput.focus();
    
        const closeHandler = () => {
            modal.classList.remove('visible');
            form.onsubmit = null;
            deleteBtn.onclick = null;
        };
    
        form.onsubmit = (e) => {
            e.preventDefault();
            const updatedData = {
                name: nameInput.value.trim(),
                points: parseInt(pointsInput.value, 10) || 0,
                dailyRepetitions: { max: parseInt(repsInput.value, 10) || 1 }
            };
            if (updatedData.name) {
                App.state.updateTemporaryTask(taskId, updatedData, viewDate);
                closeHandler();
            }
        };
    
        deleteBtn.onclick = () => {
            if (confirm('¿Seguro que deseas eliminar esta tarea?')) {
                App.state.deleteTemporaryTask(taskId, viewDate);
                closeHandler();
            }
        };
    
        closeBtn.onclick = closeHandler;
    }


function _openQuickMissionModal() {
    const modal = document.getElementById('quickMissionModal');
    const form = document.getElementById('quickMissionForm');
    const purposeGrid = document.getElementById('quickMissionPurposeGrid');
    const nameInput = document.getElementById('quickMissionName');
    const pointsInput = document.getElementById('quickMissionPoints');
    
    // ⭐ FIX: Seleccionar AMBOS botones de cancelar
    const closeXBtn = modal.querySelector('.modal-close-btn');
    const cancelFormBtn = modal.querySelector('.modal-actions .cancel-btn');

    if (!modal || !form) return;

    let selectedCategoryId = App.state.getLastSelectedCategory?.() || null;

    // Asegurar que "Propósito esporádico" existe
    const state = App.state.get();
    let sporadicCat = state.categories.find(c => c.name === "Propósito esporádico");
    if (!sporadicCat) {
        App.state.addCategory("Propósito esporádico");
        sporadicCat = state.categories.find(c => c.name === "Propósito esporádico");
    }
    
    const categories = App.state.getCategories();
    
    // Si no hay ninguna categoría seleccionada y no hay otras categorías además de esporádico,
    // preseleccionar "Propósito esporádico"
    if (!selectedCategoryId && categories.length === 1 && sporadicCat) {
        selectedCategoryId = sporadicCat.id;
    }
    
    purposeGrid.innerHTML = '';

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quick-mission-purpose-btn';
        
        if (cat.name === "Propósito esporádico") {
            btn.textContent = `⚡ ${cat.name}`;
            btn.title = "Para tareas ocasionales sin propósito específico";
        } else {
            btn.textContent = cat.name;
        }

        if (cat.id === selectedCategoryId) {
            btn.classList.add('selected');
        }

        btn.onclick = () => {
            purposeGrid.querySelectorAll('.quick-mission-purpose-btn')
                .forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedCategoryId = cat.id;
            App.state.setLastSelectedCategory?.(cat.id);
        };

        purposeGrid.appendChild(btn);
    });

    modal.classList.remove('hidden');
    modal.classList.add('visible');
    nameInput.value = '';
    pointsInput.value = 1;

    // ⭐ MEJORADO: Función de cierre que limpia todos los eventos
    const closeHandler = () => {
        modal.classList.remove('visible');
        modal.classList.add('hidden');
        form.onsubmit = null;
        
        // Limpiar eventos de ambos botones
        if (closeXBtn) closeXBtn.onclick = null;
        if (cancelFormBtn) cancelFormBtn.onclick = null;
    };
    
    // ⭐ FIX: Asignar el evento a AMBOS botones
    if (closeXBtn) {
        closeXBtn.onclick = closeHandler;
    }
    if (cancelFormBtn) {
        cancelFormBtn.onclick = closeHandler;
    }

    form.onsubmit = (e) => {
        e.preventDefault();
        const missionName = nameInput.value.trim();
        const points = parseInt(pointsInput.value, 10) || 1;

        if (!selectedCategoryId || !missionName) {
            alert("Por favor completa todos los campos y elige un propósito.");
            return;
        }

        const targetDate = _getCurrentViewDate();

        App.state.addQuickTask({
            name: missionName,
            points: points,
            categoryId: selectedCategoryId,
            targetDate: targetDate
        });

        closeHandler();
    };
}
      
    // --- PUBLIC API ---
    App.ui.today = {
        
        render: function() {
            const container = document.getElementById("todayTasksList");
            const todayTitleElement = document.getElementById("todayTitle");
            const totalPointsBtn = document.getElementById("totalPointsBtn");
            const state = App.state.get();
    
            if (!container) {
                console.warn("Contenedor #todayTasksList no encontrado.");
                return;
            }
    
            container.innerHTML = "";
            const viewDate = _getCurrentViewDate();
            const formattedTitle = _formatDateTitle(viewDate);
    
            if (todayTitleElement) {
                todayTitleElement.innerHTML = `
                    <button id="prevDayBtnToday" class="date-nav-btn" aria-label="Día anterior">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <span class="today-title-text">${formattedTitle}</span>
                    <button id="nextDayBtnToday" class="date-nav-btn" aria-label="Día siguiente">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                `;
                
                document.getElementById('prevDayBtnToday').addEventListener('click', () => _navigatePrevDay());
                document.getElementById('nextDayBtnToday').addEventListener('click', () => _navigateNextDay());
            }
            
        
            let viewDateTasks = App.state.getTasksForDate(viewDate);

            if (_currentCategoryFilter) {
                viewDateTasks = viewDateTasks.filter(task => {
                    if (!task.missionId) return false;
                    const mission = App.state.getMissions().find(m => m.id === task.missionId);
                    return mission && mission.categoryId === _currentCategoryFilter;
                });
            
                const header = document.getElementById("todayTitle");
                if (header && !document.getElementById("clearCategoryFilterBtn")) {
                    const btn = document.createElement("button");
                    btn.id = "clearCategoryFilterBtn";
                    btn.className = "clear-filter-btn";
                    btn.textContent = "Ver todas";
                    btn.addEventListener("click", () => {
                        _currentCategoryFilter = null;
                        btn.remove();
                        this.render();
                    });
                    header.appendChild(btn);
                }
            } else {
                const existingBtn = document.getElementById("clearCategoryFilterBtn");
                if (existingBtn) existingBtn.remove();
            }

            if (!viewDateTasks || viewDateTasks.length === 0) {
                container.innerHTML = `<p style="text-align:center; color:var(--ff-text-dark);">No hay misiones registradas para esta fecha.</p>`;
                _renderGlobalPointsBar(0, 0, false);
                return;
            }
        
            let totalPoints = 0;
            let earnedPoints = 0;
            viewDateTasks.forEach(task => {
                const maxReps = task.dailyRepetitions ? task.dailyRepetitions.max : 1;
                const currentReps = task.currentRepetitions || 0;
                totalPoints += task.points * maxReps;
                earnedPoints += task.points * currentReps;
            });
        
            if (totalPointsBtn) {
                totalPointsBtn.querySelector("#pointsValue").textContent = state.points;
            }
        
            _renderGlobalPointsBar(totalPoints, earnedPoints, true);
        
            const savedOrder = App.state.getTodayTaskOrder(viewDate) || [];
            const completedTasks = viewDateTasks.filter(t => t.completed);
            const incompleteTasks = viewDateTasks.filter(t => !t.completed);
        
            const orderedIncompleteTasks = [];
            const remainingIncompleteTasks = new Set(incompleteTasks.map(t => t.id));
        
            savedOrder.forEach(id => {
                const task = incompleteTasks.find(t => t.id === id);
                if (task) {
                    orderedIncompleteTasks.push(task);
                    remainingIncompleteTasks.delete(id);
                }
            });
        
            remainingIncompleteTasks.forEach(id => {
                const task = incompleteTasks.find(t => t.id === id);
                if (task) orderedIncompleteTasks.push(task);
            });
        
            viewDateTasks = orderedIncompleteTasks.concat(completedTasks);
        
            const bonusMissionId = App.state.getBonusMissionForToday();
            viewDateTasks.forEach(task => this._renderTaskCard(task, bonusMissionId));
        
            // Drag & Drop para todas las fechas
            const taskCards = container.querySelectorAll('.task-card:not(.completed)');
            taskCards.forEach(taskCard => {
                taskCard.draggable = true;
                taskCard.setAttribute("aria-grabbed", "false");
        
                taskCard.addEventListener("dragstart", e => {
                    e.stopPropagation();
                    taskCard.classList.add("is-dragging-task");
                    e.dataTransfer.setData("text/plain", taskCard.dataset.taskId);
                    e.dataTransfer.effectAllowed = "move";
                });
        
                taskCard.addEventListener("dragend", e => {
                    e.stopPropagation();
                    taskCard.classList.remove("is-dragging-task");
                    document.querySelectorAll(".drag-over-task").forEach(el => el.classList.remove("drag-over-task"));
                });
        
                taskCard.addEventListener("dragover", e => {
                    e.preventDefault();
                    e.stopPropagation();
                    const targetCard = e.target.closest('.task-card');
                    if (!targetCard) return;
                    document.querySelectorAll(".drag-over-task").forEach(el => el.classList.remove("drag-over-task"));
                    targetCard.classList.add("drag-over-task");
                });
        
                taskCard.addEventListener("dragleave", e => {
                    e.stopPropagation();
                    const targetCard = e.target.closest('.task-card');
                    if (targetCard) targetCard.classList.remove("drag-over-task");
                });
        
                taskCard.addEventListener("drop", e => {
                    e.preventDefault();
                    e.stopPropagation();
                    const draggedTaskId = e.dataTransfer.getData("text/plain");
                    const droppedOnCard = e.target.closest('.task-card');
                    if (!draggedTaskId || !droppedOnCard) return;
        
                    const draggedTaskCard = container.querySelector(`.task-card[data-task-id="${draggedTaskId}"]`);
                    if (draggedTaskCard === droppedOnCard) {
                        droppedOnCard.classList.remove("drag-over-task");
                        return;
                    }
        
                    const allCards = Array.from(container.querySelectorAll('.task-card:not(.completed)'));
                    const droppedIndex = allCards.indexOf(droppedOnCard);
                    const draggedIndex = allCards.indexOf(draggedTaskCard);
        
                    if (draggedIndex < droppedIndex) {
                        container.insertBefore(draggedTaskCard, droppedOnCard.nextSibling);
                    } else {
                        container.insertBefore(draggedTaskCard, droppedOnCard);
                    }
                    droppedOnCard.classList.remove("drag-over-task");
        
                    const newOrder = Array.from(container.querySelectorAll('.task-card:not(.completed)')).map(card => card.dataset.taskId);
                    App.state.saveTodayTaskOrder(newOrder, viewDate);
                });
            });
        },
        
        filterByCategory: function(categoryId) {
            _currentCategoryFilter = categoryId;
            this.render();
        },
        
    
        _renderTaskCard: function(task, bonusMissionId) {
            const container = document.getElementById("todayTasksList");
            const taskCard = document.createElement("div");
            
            taskCard.className = `task-card ${task.completed ? "completed" : ""}`;
            taskCard.dataset.taskId = task.id;
            taskCard.draggable = !task.completed;
        
            const maxReps = task.dailyRepetitions ? task.dailyRepetitions.max : 1;
            const currentReps = task.currentRepetitions || 0;
            const progressPercentage = task.completed ? 100 : (currentReps / maxReps) * 100;
        
            const progressBar = document.createElement("div");
            progressBar.className = "repetition-progress-bar";
            progressBar.style.width = `${progressPercentage}%`;
            taskCard.appendChild(progressBar);
        
            if (maxReps > 1) {
                const badge = document.createElement("div");
                badge.className = "repetition-badge";
                badge.textContent = `${currentReps}/${maxReps}`;
                taskCard.appendChild(badge);
            }
        
            let descriptionIcon = '';
            let categoryBadge = '';
            if (task.missionId) {
                const mission = App.state.getMissions().find(m => m.id === task.missionId);
                
                // Descripción (solo si la misión aún existe)
                if (mission && mission.description) {
                    descriptionIcon = `<span class="description-icon" title="Tiene descripción"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="description-icon-svg"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h12v2H4z"></path></svg></span>`;
                }
                
                // ⭐ MEJORADO: Buscar categoryId en múltiples lugares
                let categoryId = task.categoryId; // 1. Primero en la tarea misma
                
                if (!categoryId && mission) {
                    categoryId = mission.categoryId; // 2. Si no, en la misión original
                }
                
                if (!categoryId) {
                    // 3. Como último recurso, buscar en scheduledMissions
                    const scheduled = App.state.getScheduledMissions().find(sm => sm.missionId === task.missionId);
                    if (scheduled) {
                        categoryId = scheduled.categoryId;
                    }
                }
                
                const category = categoryId ? App.state.getCategoryById(categoryId) : null;
                categoryBadge = category
                    ? `<span class="category-badge" data-cat-id="${category.id}" title="Propósito: ${category.name}">${category.name}</span>`
                    : `<span class="category-badge category-unknown" title="Sin propósito">Sin propósito</span>`;
                    
            } else {
                // ⭐ NUEVO: Para tareas sin missionId, verificar si tienen categoryId
                if (task.categoryId) {
                    const category = App.state.getCategoryById(task.categoryId);
                    categoryBadge = category
                        ? `<span class="category-badge" data-cat-id="${category.id}" title="Propósito: ${category.name}">${category.name}</span>`
                        : `<span class="category-badge category-temp" title="Tarea rápida">Rápida</span>`;
                } else {
                    categoryBadge = `<span class="category-badge category-temp" title="Tarea rápida (sin propósito)">Rápida</span>`;
                }
            }
        
            const taskNameDiv = document.createElement("div");
            taskNameDiv.className = "task-name";
            taskNameDiv.innerHTML = `${task.name} ${descriptionIcon} ${categoryBadge}`;
            taskCard.appendChild(taskNameDiv);
        
            const actionsContainer = document.createElement("div");
            actionsContainer.className = "task-actions-reps";
            
            if (!task.completed) {
                const completeButton = document.createElement("button");
                completeButton.className = "task-btn-complete";
                
                let buttonPoints = Math.abs(task.points);
                if (task.missionId && task.missionId === bonusMissionId) buttonPoints *= 2;
                
                completeButton.innerHTML = `
                    <span class="btn-check">✓</span>
                    <span class="btn-points-badge ${task.points >= 0 ? "positive" : "negative"}">+${buttonPoints}</span>
                `;
                
                completeButton.title = `Completar (${task.points >= 0 ? "＋" : "−"}${buttonPoints} puntos)`;

                completeButton.onclick = (e) => {
                    e.stopPropagation();
                
                    const badge = completeButton.querySelector('.btn-points-badge');
                    const totalPointsBtn = document.querySelector('#totalPointsBtn');
                    const pointsValueEl = document.querySelector('#pointsValue');
                    if (!badge || !totalPointsBtn || !pointsValueEl) return;
                
                    const maxReps = task.dailyRepetitions ? task.dailyRepetitions.max : 1;
                    const currentReps = task.currentRepetitions || 0;
                    const isLastRepetition = (currentReps + 1) >= maxReps;
                
                    const startRect = badge.getBoundingClientRect();
                    badge.style.opacity = '0';
                    badge.style.transform = 'scale(0)';
                
                    const viewDate = _getCurrentViewDate();
                    const taskUpdated = App.state.completeTaskRepetition(task.id, { 
                        silentUI: true,
                        targetDate: viewDate
                    });
                    
                    if (!taskUpdated) {
                        badge.style.visibility = 'visible';
                        return;
                    }
                
                    const flyingBadge = badge.cloneNode(true);
                    const endRect = totalPointsBtn.getBoundingClientRect();
                
                    flyingBadge.style.visibility = 'visible';
                    flyingBadge.style.opacity = '1';
                    flyingBadge.style.position = 'fixed';
                    flyingBadge.style.left = `${startRect.left}px`;
                    flyingBadge.style.top = `${startRect.top}px`;
                    flyingBadge.style.margin = '0';
                    flyingBadge.style.zIndex = '9999';
                    
                    const deltaX = (endRect.left + endRect.width / 2) - (startRect.left + startRect.width / 2);
                    const deltaY = (endRect.top + endRect.height / 2) - (startRect.top + startRect.height / 2);
                    
                    flyingBadge.style.setProperty('--fly-x', `${deltaX}px`);
                    flyingBadge.style.setProperty('--fly-y', `${deltaY}px`);
                
                    document.body.appendChild(flyingBadge);
                    void flyingBadge.offsetWidth;
                    flyingBadge.classList.add('flying');
                
                    if (!isLastRepetition) {
                        setTimeout(() => {
                            requestAnimationFrame(() => {
                                const freshBadge = completeButton.querySelector('.btn-points-badge');
                                if (!freshBadge) return;
                    
                                freshBadge.style.opacity = '1';
                                freshBadge.style.transform = 'scale(0)';
                                void freshBadge.offsetWidth;
                    
                                freshBadge.classList.add('rebirth');
                    
                                freshBadge.addEventListener('animationend', function cleanupRebirth() {
                                    freshBadge.classList.remove('rebirth');
                                    freshBadge.style.transform = '';
                                    freshBadge.removeEventListener('animationend', cleanupRebirth);
                                });
                            });
                        }, 1200);
                    }

                    setTimeout(() => {
                        App.ui.general.updatePointsDisplay(App.state.getPoints());
                    }, 400);
                
                    flyingBadge.addEventListener('animationend', () => {
                        flyingBadge.remove();
                    }, { once: true });
                };
                
                actionsContainer.appendChild(completeButton);
            } else {
                const completedMessage = document.createElement("span");
                completedMessage.className = "completed-message";
                completedMessage.innerHTML = "¡Hecho!";
                actionsContainer.appendChild(completedMessage);
            }
            taskCard.appendChild(actionsContainer);
            
            taskCard.addEventListener('click', (e) => {
                e.stopPropagation();
                if (task.completed) return;
            
                if (!task.missionId) {
                    _openEditTemporaryTaskModal(task.id);
                } else {
                    const mission = App.state.getMissions().find(m => m.id === task.missionId);
                    if (mission) {
                        App.ui.missions.openEditMissionModal(task.missionId, true, task.id);
                    } else {
                        console.warn('Misión huérfana, convirtiendo en tarea rápida...');
                        task.isTemp = true;
                        task.missionId = null;
                        const viewDate = _getCurrentViewDate();
                        App.state.updateTodayTask(task.id, task, viewDate);
                        _openEditTemporaryTaskModal(task.id);
                        App.events.emit('showToast', 'Esta misión ya no existe, ahora es editable como tarea rápida.');
                    }
                }
            });

            container.appendChild(taskCard);
        
            const badgeEl = taskCard.querySelector('.category-badge');
            if (badgeEl && badgeEl.dataset.catId) {
                badgeEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    App.ui.today.filterByCategory(badgeEl.dataset.catId);
                });
            }
        },
        

        /**
         * @description Inicializa los listeners para la sección "Hoy".
         */
        initListeners: function() {
            App.events.on('todayTasksUpdated', () => this.render());
            App.events.on('stateRefreshed', () => this.render());
            App.events.on('taskCompleted', (taskId) => {
                const taskCard = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
                if (taskCard) {
                    const progressBar = taskCard.querySelector('.repetition-progress-bar');
                    if (progressBar) {
                        const viewDate = _getCurrentViewDate();
                        const state = App.state.get();
                        const tasks = state.tasksByDate[viewDate] || [];
                        const task = tasks.find(t => t.id === taskId);
                        if (task) {
                            const newWidth = task.completed ? 100 : ((task.currentRepetitions || 0) / (task.dailyRepetitions.max || 1)) * 100;
                            progressBar.style.width = `${newWidth}%`;
                        }
                    }
                }
            });
        
            const showQuickAddBtn = document.getElementById('showQuickAddBtn');
            if (showQuickAddBtn) {
                showQuickAddBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    _openQuickMissionModal();
                });
            }
        },

        resetToToday: function() {
            _currentViewDate = null;
            this.render();
        }
    };

})(window.App = window.App || {});