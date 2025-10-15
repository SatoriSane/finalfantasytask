
// features/feature-today.js
(function(App) {
    'use strict';

    // --- PRIVATE STATE ---
let _prevTaskProgress = {};
let _prevGlobalProgress = null;
let _currentCategoryFilter = null; // <--- estado del filtro

    // --- PRIVATE METHODS ---

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
    
        const tasks = App.state.getTodayTasks();
        const task = tasks.find(t => t.id === taskId);
    
        if (!task || !modal) return;
    
        taskIdInput.value = task.id;
        nameInput.value = task.name;
        pointsInput.value = task.points;
    
        // --- Campo de repeticiones máximas ---
        let repsInput = form.querySelector('#editTemporaryTaskReps');
        if (!repsInput) {
            const repsGroup = document.createElement('div');
            repsGroup.className = 'form-group';
            repsGroup.innerHTML = `
                <label for="editTemporaryTaskReps">Repeticiones máximas:</label>
                <input type="number" id="editTemporaryTaskReps" min="1" />
            `;
            // Insertar antes del bloque de botones (.modal-actions)
            const actions = form.querySelector('.modal-actions');
            if (actions) {
                form.insertBefore(repsGroup, actions);
            } else {
                form.appendChild(repsGroup);
            }
            repsInput = repsGroup.querySelector('input');
        }
        repsInput.value = (task.dailyRepetitions && task.dailyRepetitions.max) || 1;
    
        // --- Botón de eliminar tarea ---
        let deleteBtn = form.querySelector('.delete-temp-task-btn');
        if (!deleteBtn) {
            const actions = form.querySelector('.modal-actions');
            deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'delete-temp-task-btn danger';
            deleteBtn.textContent = 'Eliminar tarea';

            // Insertar ANTES del botón de guardar (a la izquierda)
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
                App.state.updateTemporaryTask(taskId, updatedData);
                closeHandler();
            }
        };
    
        deleteBtn.onclick = () => {
            if (confirm('¿Seguro que deseas eliminar esta tarea?')) {
                App.state.deleteTemporaryTask(taskId);
                closeHandler();
            }
        };
    
        closeBtn.onclick = closeHandler;
    }
    

    // --- PUBLIC API ---
    App.ui.today = {
        
        /**
         * @description Renderiza las tareas del día actual y actualiza la UI relacionada.
         */
        render: function() {
            const container = document.getElementById("todayTasksList");
            const todayTitleElement = document.getElementById("todayTitle");
            const totalPointsBtn = document.getElementById("totalPointsBtn");
        
            if (!container) {
                console.warn("Contenedor #todayTasksList no encontrado.");
                return;
            }
            container.innerHTML = "";
        
            if (todayTitleElement) {
                todayTitleElement.textContent = "Misiones de Hoy";
            }
        
            const state = App.state.getState();
            let todayTasks = App.state.getTodayTasks();

            if (_currentCategoryFilter) {
                todayTasks = todayTasks.filter(task => {
                    if (!task.missionId) return false;
                    const mission = App.state.getMissions().find(m => m.id === task.missionId);
                    return mission && mission.categoryId === _currentCategoryFilter;
                });
            
                // Botón “Ver todas”
                const header = document.getElementById("todayTitle");
                if (header && !document.getElementById("clearCategoryFilterBtn")) {
                    const btn = document.createElement("button");
                    btn.id = "clearCategoryFilterBtn";
                    btn.className = "clear-filter-btn";
                    btn.textContent = "Ver todas";
                    btn.addEventListener("click", () => {
                        _currentCategoryFilter = null; // quitar filtro
                        btn.remove();
                        this.render();
                    });
                    header.appendChild(btn);
                }
            } else {
                const existingBtn = document.getElementById("clearCategoryFilterBtn");
                if (existingBtn) existingBtn.remove(); // limpiar si ya no hay filtro
            }
            if (!todayTasks || todayTasks.length === 0) {
                container.innerHTML = `<p style="text-align:center; color:var(--ff-text-dark);">¡Hoy no tienes misiones programadas! Usa el botón ➕ para añadir una.</p>`;
                _renderGlobalPointsBar(0, 0, false);
                return;
            }
        
            // --- Calcular puntos totales y ganados ---
            let totalPoints = 0;
            let earnedPoints = 0;
            todayTasks.forEach(task => {
                const maxReps = task.dailyRepetitions ? task.dailyRepetitions.max : 1;
                const currentReps = task.currentRepetitions || 0;
                totalPoints += task.points * maxReps;
                earnedPoints += task.points * currentReps;
            });
        
            if (totalPointsBtn) {
                totalPointsBtn.querySelector("#pointsValue").textContent = state.points;
            }
        
            _renderGlobalPointsBar(totalPoints, earnedPoints, true);
        
            // --- Ordenar tareas según guardado ---
            const savedOrder = App.state.getTodayTaskOrder() || [];
            const completedTasks = todayTasks.filter(t => t.completed);
            const incompleteTasks = todayTasks.filter(t => !t.completed);
        
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
        
            todayTasks = orderedIncompleteTasks.concat(completedTasks);
        
            // --- Renderizar todas las tareas usando _renderTaskCard ---
            const bonusMissionId = App.state.getBonusMissionForToday();
            todayTasks.forEach(task => this._renderTaskCard(task, bonusMissionId));
        
            // --- Drag & Drop solo para tareas incompletas ---
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
                    App.state.saveTodayTaskOrder(newOrder);
                });
            });
        },
        
        filterByCategory: function(categoryId) {
            _currentCategoryFilter = categoryId; // guardar filtro
            this.render();
        },
        
        _renderTaskCard: function(task, bonusMissionId) {
            const container = document.getElementById("todayTasksList");
            const taskCard = document.createElement("div");
            taskCard.className = `task-card ${task.completed ? "completed" : ""}`;
            taskCard.dataset.taskId = task.id;
            taskCard.draggable = !task.completed;
        
            // Barra de progreso y badges de repeticiones
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
        
            // Nombre + descripción + badge categoría
            let descriptionIcon = '';
            let categoryBadge = '';
            if (task.missionId) {
                const mission = App.state.getMissions().find(m => m.id === task.missionId);
                if (mission && mission.description) {
                    descriptionIcon = `<span class="description-icon" title="Tiene descripción"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="description-icon-svg"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h12v2H4z"></path></svg></span>`;
                }
                const category = mission ? App.state.getCategoryById(mission.categoryId) : null;
                categoryBadge = category
                    ? `<span class="category-badge" data-cat-id="${category.id}" title="Propósito: ${category.name}">${category.name}</span>`
                    : `<span class="category-badge category-unknown" title="Sin propósito">Sin propósito</span>`;
            } else {
                categoryBadge = `<span class="category-badge category-temp" title="Tarea rápida (sin propósito)">Rápida</span>`;
            }
        
            const taskNameDiv = document.createElement("div");
            taskNameDiv.className = "task-name";
            taskNameDiv.innerHTML = `${task.name} ${descriptionIcon} ${categoryBadge}`;
            taskCard.appendChild(taskNameDiv);
        
            // Puntos
            const taskPointsSpan = document.createElement("span");
            taskPointsSpan.className = `task-points ${task.points >= 0 ? "positive" : "negative"}`;
            let pointsText = `${task.points >= 0 ? "＋" : "−"}${Math.abs(task.points)}`;
            if (task.missionId && task.missionId === bonusMissionId) pointsText += ` <span class="bonus-multiplier">x2</span>`;
            taskPointsSpan.innerHTML = pointsText;
            taskCard.appendChild(taskPointsSpan);
        
            // Botones de acción
            const actionsContainer = document.createElement("div");
            actionsContainer.className = "task-actions-reps";
            if (!task.completed) {
                const completeButton = document.createElement("button");
                completeButton.className = "task-btn-complete";
                completeButton.innerHTML = "✓";
                let buttonPoints = Math.abs(task.points);
                if (task.missionId && task.missionId === bonusMissionId) buttonPoints *= 2;
                completeButton.title = `Completar (${task.points >= 0 ? "＋" : "−"}${buttonPoints} puntos)`;
                completeButton.onclick = (e) => { e.stopPropagation(); App.state.completeTaskRepetition(task.id); };
                actionsContainer.appendChild(completeButton);
            } else {
                const completedMessage = document.createElement("span");
                completedMessage.className = "completed-message";
                completedMessage.innerHTML = " ¡Hecho!";
                actionsContainer.appendChild(completedMessage);
            }
            taskCard.appendChild(actionsContainer);
            // --- Listener para abrir modal de edición ---
            taskCard.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!task.completed) {
                    if (!task.missionId) {
                        // Tarea rápida
                        _openEditTemporaryTaskModal(task.id);
                    } else {
                        // Misión programada
                        App.ui.missions.openEditMissionModal(task.missionId);
                    }
                }
            });

            container.appendChild(taskCard);
        
            const badgeEl = taskCard.querySelector('.category-badge');
            if (badgeEl && badgeEl.dataset.catId) {
                badgeEl.addEventListener('click', (e) => {
                    e.stopPropagation(); // ❌ evita que se abra el modal de tarea
                    App.ui.today.filterByCategory(badgeEl.dataset.catId); // 🔹 mantiene el filtrado
                });
            }            
        },
        

        /**
         * @description Inicializa los listeners para la sección "Hoy".
         */
        initListeners: function() {
            // Listen for state changes
            App.events.on('todayTasksUpdated', () => this.render());
            App.events.on('stateRefreshed', () => this.render());
            App.events.on('taskCompleted', (taskId) => {
                const taskCard = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
                if (taskCard) {
                    const progressBar = taskCard.querySelector('.repetition-progress-bar');
                    if (progressBar) {
                        const task = App.state.getTodayTasks().find(t => t.id === taskId);
                        const newWidth = task.completed ? 100 : ((task.currentRepetitions || 0) / (task.dailyRepetitions.max || 1)) * 100;
                        progressBar.style.width = `${newWidth}%`;
                    }
                }
            });
            const showQuickAddBtn = document.getElementById('showQuickAddBtn');
            const quickAddForm = document.getElementById('quickAddForm');
            const quickAddNameInput = document.getElementById('quickAddNameInput');
            const quickAddPointsInput = document.getElementById('quickAddPointsInput');

            if (showQuickAddBtn) {
                showQuickAddBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    App.ui.general.toggleFormVisibility('quickAddFormContainer', quickAddNameInput);
                });
            }

            if (quickAddForm) {
                quickAddForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const taskName = quickAddNameInput.value.trim();
                    const taskPoints = parseInt(quickAddPointsInput.value, 10) || 0;

                    if (taskName) {
                        App.state.addQuickTask({
                            name: taskName,
                            points: taskPoints
                        });
                        quickAddNameInput.value = '';
                        quickAddPointsInput.value = '0';
                        App.ui.general.toggleFormVisibility('quickAddFormContainer', null, false);
                    }
                });
            }
        }
    };

})(window.App = window.App || {});