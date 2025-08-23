// ui-render-today.js
// Maneja la renderización específica de la pestaña "Hoy".
(function(App) {
    App.ui.render = App.ui.render || {};
    App.ui.render.today = {
        // Estado previo para evitar animación al render inicial
        _prevTaskProgress: {},
        _prevGlobalProgress: null,

        /**
         * @description Renderiza las tareas del día actual y actualiza el título de la pestaña "Hoy".
         */
        renderTodayTasks: function() {
            const container = document.getElementById("todayTasksList");
            const todayTitleElement = document.getElementById("todayTitle");
            const totalPointsBtn = document.getElementById("totalPointsBtn");

            if (!container) {
                console.warn("Contenedor #todayTasksList no encontrado, no se pueden renderizar las tareas de hoy.");
                return;
            }
            container.innerHTML = "";

            // --- Actualizar título ---
            if (todayTitleElement) {
                todayTitleElement.textContent = "Misiones de Hoy";
            }

            const state = App.state.getState();
            const todayTasks = App.state.getTodayTasks();

            if (!todayTasks || todayTasks.length === 0) {
                container.innerHTML = `<p style="text-align:center; color:var(--ff-text-dark);">¡Hoy no tienes misiones programadas! Usa el botón ➕ para añadir una.</p>`;
                this.renderGlobalPointsBar(0, 0, false);
                return;
            }

            // --- Calcular puntos totales y ganados de hoy ---
            let totalPoints = 0;
            let earnedPoints = 0;
            todayTasks.forEach(task => {
                const maxReps = task.dailyRepetitions ? task.dailyRepetitions.max : 1;
                const currentReps = task.currentRepetitions || 0;
                totalPoints += task.points * maxReps;
                earnedPoints += task.points * currentReps;
            });

            // --- Actualizar puntos globales en navbar ---
            if (totalPointsBtn) {
                totalPointsBtn.querySelector("#pointsValue").textContent = state.points;
            }

            // --- Renderizar barra global (hoy) ---
            this.renderGlobalPointsBar(totalPoints, earnedPoints, true);

            // --- Ordenar tareas: incompletas primero ---
            todayTasks.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));

            todayTasks.forEach(task => {
                const taskCard = document.createElement("div");
                taskCard.className = `task-card ${task.completed ? "completed" : ""}`;
                taskCard.dataset.taskId = task.id;
                taskCard.draggable = true;
                taskCard.setAttribute("aria-grabbed", "false");

                // Drag & Drop
                taskCard.addEventListener("dragstart", (e) => {
                    e.stopPropagation();
                    taskCard.classList.add("is-dragging-task");
                    e.dataTransfer.setData("text/plain", task.id);
                    e.dataTransfer.effectAllowed = "move";
                });
                taskCard.addEventListener("dragenter", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!taskCard.classList.contains("is-dragging-task")) {
                        taskCard.classList.add("drag-over-task");
                    }
                });
                taskCard.addEventListener("dragover", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = "move";
                });
                taskCard.addEventListener("dragleave", (e) => {
                    e.stopPropagation();
                    taskCard.classList.remove("drag-over-task");
                });
                taskCard.addEventListener("drop", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    taskCard.classList.remove("drag-over-task");
                    const draggedId = e.dataTransfer.getData("text/plain");
                    const targetId = task.id;
                    if (draggedId !== targetId) App.state.reorderTodayTask(draggedId, targetId);
                });
                taskCard.addEventListener("dragend", (e) => {
                    e.stopPropagation();
                    taskCard.classList.remove("is-dragging-task");
                    taskCard.setAttribute("aria-grabbed", "false");
                    document.querySelectorAll(".drag-over-task").forEach(el => el.classList.remove("drag-over-task"));
                });

                // Doble clic para mostrar botón eliminar
                taskCard.addEventListener("dblclick", (e) => {
                    e.stopPropagation();
                    document.querySelectorAll(".task-card.show-delete").forEach(el => el.classList.remove("show-delete"));
                    taskCard.classList.add("show-delete");
                });

                // Barra de progreso por tarea
                const progressBar = document.createElement("div");
                progressBar.className = "repetition-progress-bar";
                taskCard.appendChild(progressBar);

                const maxReps = task.dailyRepetitions ? task.dailyRepetitions.max : 1;
                const currentReps = task.currentRepetitions || 0;
                const progressPercentage = task.completed ? 100 : (currentReps / maxReps) * 100;

                // Animación solo si aumenta el progreso (no al render inicial)
                const prev = this._prevTaskProgress[task.id] ?? progressPercentage;
                progressBar.style.width = prev + "%";
                if (progressPercentage !== prev) {
                    requestAnimationFrame(() => {
                        progressBar.style.width = `${progressPercentage}%`;
                    });
                }
                this._prevTaskProgress[task.id] = progressPercentage;

                // Nombre
                const taskNameDiv = document.createElement("span");
                taskNameDiv.className = "task-name";
                taskNameDiv.textContent = task.name;
                taskCard.appendChild(taskNameDiv);

                // Puntos de la tarea
                const taskPointsSpan = document.createElement("span");
                taskPointsSpan.className = `task-points ${task.points >= 0 ? "positive" : "negative"}`;
                taskPointsSpan.textContent = `${task.points >= 0 ? "＋" : "−"}${Math.abs(task.points)}`;
                taskCard.appendChild(taskPointsSpan);

                // Contenedor de acciones y repeticiones
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

                // Botón eliminar
                const deleteBtn = document.createElement("button");
                deleteBtn.innerHTML = "❌";
                deleteBtn.className = "delete-btn";
                deleteBtn.title = "Eliminar tarea de Hoy";
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    App.state.deleteTodayTask(task.id);
                };
                taskCard.appendChild(deleteBtn);

                container.appendChild(taskCard);
            });
        },

        // Renderizado de la barra global
        renderGlobalPointsBar: function(totalPoints, earnedPoints, allowAnimate) {
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
            const prev = this._prevGlobalProgress ?? newWidth;
            progressDiv.style.width = prev + "%";

            if (allowAnimate && newWidth !== prev) {
                requestAnimationFrame(() => {
                    progressDiv.style.width = `${newWidth}%`;
                });
            }
            this._prevGlobalProgress = newWidth;
        }
    };
})(window.App = window.App || {});
