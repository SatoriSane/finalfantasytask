// features/feature-today.js
(function(App) {
    'use strict';

    // --- PRIVATE STATE ---
    let _prevTaskProgress = {};
    let _prevGlobalProgress = null;

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

        modal.classList.add('visible');
        nameInput.focus();

        const closeHandler = () => {
            modal.classList.remove('visible');
            form.onsubmit = null; // Clean up listener
        };

        form.onsubmit = (e) => {
            e.preventDefault();
            const updatedData = {
                name: nameInput.value.trim(),
                points: parseInt(pointsInput.value, 10) || 0
            };
            if (updatedData.name) {
                App.state.updateTemporaryTask(taskId, updatedData);
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
            const todayTasks = App.state.getTodayTasks();

            if (!todayTasks || todayTasks.length === 0) {
                container.innerHTML = `<p style="text-align:center; color:var(--ff-text-dark);">¡Hoy no tienes misiones programadas! Usa el botón ➕ para añadir una.</p>`;
                _renderGlobalPointsBar(0, 0, false);
                return;
            }

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

            todayTasks.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));

            todayTasks.forEach(task => {
                const taskCard = document.createElement("div");
                taskCard.className = `task-card ${task.completed ? "completed" : ""}`;
                taskCard.dataset.taskId = task.id;
                taskCard.draggable = true;
                taskCard.setAttribute("aria-grabbed", "false");

                taskCard.addEventListener("dragstart", (e) => {
                    e.stopPropagation();
                    taskCard.classList.add("is-dragging-task");
                    e.dataTransfer.setData("text/plain", task.id);
                    e.dataTransfer.effectAllowed = "move";
                });
                taskCard.addEventListener("dragend", (e) => {
                    e.stopPropagation();
                    taskCard.classList.remove("is-dragging-task");
                    document.querySelectorAll(".drag-over-task").forEach(el => el.classList.remove("drag-over-task"));
                });

                taskCard.addEventListener("click", (e) => {
                    const missionCard = e.target.closest('.task-card');
                    if (!missionCard) return;

                    if (task.missionId) { // It's a permanent mission
                        App.ui.missions.openEditMissionModal(task.missionId, true, task.id);
                    } else { // It's a temporary task
                        _openEditTemporaryTaskModal(task.id);
                    }
                });

                const progressBar = document.createElement("div");
                progressBar.className = "repetition-progress-bar";
                taskCard.appendChild(progressBar);

                const maxReps = task.dailyRepetitions ? task.dailyRepetitions.max : 1;
                const currentReps = task.currentRepetitions || 0;
                const progressPercentage = task.completed ? 100 : (currentReps / maxReps) * 100;

                const prev = _prevTaskProgress[task.id] ?? progressPercentage;
                progressBar.style.width = prev + "%";
                if (progressPercentage !== prev) {
                    requestAnimationFrame(() => {
                        progressBar.style.width = `${progressPercentage}%`;
                    });
                }
                _prevTaskProgress[task.id] = progressPercentage;

                const taskNameDiv = document.createElement("span");
                taskNameDiv.className = "task-name";
                let descriptionIcon = '';
                if (task.missionId) {
                    const mission = App.state.getMissions().find(m => m.id === task.missionId);
                    if (mission && mission.description) {
                        descriptionIcon = `<span class="description-icon" title="Tiene descripción"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="description-icon-svg"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h12v2H4z"></path></svg></span>`;
                    }
                }
                taskNameDiv.innerHTML = `${task.name} ${descriptionIcon}`;
                taskCard.appendChild(taskNameDiv);

                const taskPointsSpan = document.createElement("span");
                taskPointsSpan.className = `task-points ${task.points >= 0 ? "positive" : "negative"}`;
                taskPointsSpan.textContent = `${task.points >= 0 ? "＋" : "−"}${Math.abs(task.points)}`;
                taskCard.appendChild(taskPointsSpan);

                const actionsContainer = document.createElement("div");
                actionsContainer.className = "task-actions-reps";
                if (maxReps > 1) {
                    const repCountSpan = document.createElement("span");
                    repCountSpan.className = "repetition-count";
                    repCountSpan.textContent = `${currentReps}/${maxReps}`;
                    actionsContainer.appendChild(repCountSpan);
                }

                if (!task.completed) {
                    const completeButton = document.createElement("button");
                    completeButton.className = "task-btn-complete";
                    completeButton.innerHTML = "✓";
                    completeButton.title = `Completar (${task.points >= 0 ? "＋" : "−"}${Math.abs(task.points)} puntos)`;
                    completeButton.onclick = (e) => {
                        e.stopPropagation();
                        App.state.completeTaskRepetition(task.id);
                    };
                    actionsContainer.appendChild(completeButton);
                } else {
                    const completedMessage = document.createElement("span");
                    completedMessage.className = "completed-message";
                    completedMessage.innerHTML = " ¡Hecho!";
                    actionsContainer.appendChild(completedMessage);
                }

                taskCard.appendChild(actionsContainer);
                container.appendChild(taskCard);
            });
        },

        /**
         * @description Inicializa los listeners para la sección "Hoy".
         */
        initListeners: function() {
            // Listen for state changes
            App.events.on('todayTasksUpdated', () => this.render());
            App.events.on('stateRefreshed', () => this.render());

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
