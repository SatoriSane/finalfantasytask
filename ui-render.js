// ui-render.js
// Maneja la renderización de los componentes de la interfaz de usuario.
(function(App) {
    App.ui.render = {
        /**
         * @description Controla la visibilidad de las pestañas y llama a la función de renderizado para la pestaña activa.
         * @param {string} tabId El ID de la pestaña a activar.
         */
        switchTab: function(tabId) {
            document.querySelectorAll('main section').forEach(sec => {
                sec.classList.remove('active');
                sec.setAttribute('aria-hidden', 'true');
            });
            document.querySelectorAll('nav.tabs button').forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
                btn.setAttribute('tabindex', '-1');
            });

            const tabContent = document.getElementById(tabId);
            const tabButton = document.querySelector(`[aria-controls="${tabId}"]`);

            if (tabContent) {
                tabContent.classList.add('active');
                tabContent.setAttribute('aria-hidden', 'false');
            }
            if (tabButton) {
                tabButton.classList.add('active');
                tabButton.setAttribute('aria-selected', 'true');
                tabButton.setAttribute('tabindex', '0');
            }

            // Llamar a las funciones de renderizado solo si los elementos contenedores existen
            if (tabId === 'tab-today') { App.ui.render.renderTodayTasks(); }
            if (tabId === 'tab-missions') { App.ui.render.renderMissions(); }
            if (tabId === 'tab-scheduled') { App.ui.render.renderScheduledMissions(); }
            if (tabId === 'tab-history') { App.ui.render.renderHistory(); }
            if (tabId === 'tab-shop') { App.ui.render.renderShopItems(); }
        },

        /**
         * @description Actualiza el valor de los puntos mostrados en la interfaz.
         */
        updatePointsDisplay: function() {
            const pointsValueElement = document.getElementById("pointsValue");
            if (pointsValueElement) {
                pointsValueElement.textContent = App.state.getPoints();
            } else {
                console.warn("Elemento #pointsValue no encontrado en la UI.");
            }
        },

        /**
         * @description Renderiza las tareas del día actual.
         */
        renderTodayTasks: function() {
            const container = document.getElementById("todayTasksList");
            const todayTitleElement = document.getElementById("todayTitle"); // Obtener el elemento del título

            if (!container) {
                console.warn("Contenedor #todayTasksList no encontrado, no se pueden renderizar las tareas de hoy.");
                return;
            }
            container.innerHTML = ""; // Limpiar contenido existente

            // Actualizar el título de la pestaña "Hoy" con la fecha completa, sin el prefijo "Misiones de Hoy:"
            const todayFormattedWithDay = App.utils.getFormattedDateWithDayOfWeek(new Date());
            if (todayTitleElement) {
                todayTitleElement.textContent = todayFormattedWithDay; // Solo la fecha formateada
            }

            const todayTasks = App.state.getTodayTasks();
            if (todayTasks.length === 0) {
                container.innerHTML = `<p style="text-align:center; color:var(--ff-text-dark);">¡Hoy no tienes misiones programadas! Usa el botón ➕ para añadir una.</p>`;
                return;
            }

            todayTasks.forEach(task => {
                const taskCard = document.createElement("div");
                taskCard.className = `task-card ${task.completed ? "completed" : ""}`;
                taskCard.dataset.taskId = task.id;

                taskCard.draggable = true;
                taskCard.setAttribute('aria-grabbed', 'false');

                // Eventos de Drag and Drop para tareas de Hoy
                taskCard.addEventListener('dragstart', (e) => {
                    e.stopPropagation();
                    taskCard.classList.add('is-dragging-task');
                    e.dataTransfer.setData('text/plain', task.id);
                    e.dataTransfer.effectAllowed = 'move';
                });
                taskCard.addEventListener('dragenter', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!taskCard.classList.contains('is-dragging-task')) {
                        taskCard.classList.add('drag-over-task');
                    }
                });
                taskCard.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = 'move';
                });
                taskCard.addEventListener('dragleave', (e) => {
                    e.stopPropagation();
                    taskCard.classList.remove('drag-over-task');
                });
                taskCard.addEventListener('drop', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    taskCard.classList.remove('drag-over-task');
                    const draggedId = e.dataTransfer.getData('text/plain');
                    const targetId = task.id;

                    if (draggedId !== targetId) {
                        App.state.reorderTodayTask(draggedId, targetId);
                    }
                });
                taskCard.addEventListener('dragend', (e) => {
                    e.stopPropagation();
                    taskCard.classList.remove('is-dragging-task');
                    taskCard.setAttribute('aria-grabbed', 'false');
                    document.querySelectorAll('.drag-over-task').forEach(el => el.classList.remove('drag-over-task'));
                });

                // Evento de doble clic para mostrar el botón de eliminar
                taskCard.addEventListener('dblclick', (e) => {
                    e.stopPropagation();
                    // Ocultar cualquier otro botón de eliminar visible
                    document.querySelectorAll('.task-card.show-delete').forEach(el => el.classList.remove('show-delete'));
                    // Mostrar el botón de eliminar de esta tarjeta
                    taskCard.classList.add('show-delete');
                });

                const taskNameDiv = document.createElement("span");
                taskNameDiv.className = "task-name";
                taskNameDiv.textContent = task.name;
                taskCard.appendChild(taskNameDiv);

                const taskPointsSpan = document.createElement("span");
                taskPointsSpan.className = `task-points ${task.points >= 0 ? "positive" : "negative"}`;
                taskPointsSpan.textContent = `${task.points >= 0 ? "＋" : "−"}${Math.abs(task.points)}`;
                taskCard.appendChild(taskPointsSpan);

                if (!task.completed) {
                    const completeButton = document.createElement("button");
                    completeButton.className = "task-btn-complete";
                    completeButton.innerHTML = "✓";
                    completeButton.onclick = (e) => {
                        e.stopPropagation();
                        App.state.completeTask(task.id);
                    };
                    taskCard.appendChild(completeButton);
                } else {
                    const completedMessage = document.createElement("span");
                    completedMessage.className = "completed-message";
                    completedMessage.innerHTML = " ¡Hecho!";
                    taskCard.appendChild(completedMessage);
                }

                // Botón de eliminar
                const deleteBtn = document.createElement("button");
                deleteBtn.innerHTML = '❌';
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

        /**
         * @description Renderiza las categorías y misiones en el Libro de Misiones.
         */
        renderMissions: function() {
            const container = document.getElementById("missionsGrid");
            if (!container) {
                console.warn("Contenedor #missionsGrid no encontrado, no se pueden renderizar las misiones.");
                return;
            }
            container.innerHTML = "";

            const categories = App.state.getCategories();
            const missions = App.state.getMissions();

            if (categories.length === 0 && missions.length === 0) {
                container.innerHTML = `<p style="text-align:center; color:var(--ff-text-dark);">No hay categorías. Agrega una nueva para empezar.</p>`;
                return;
            }

            categories.forEach(cat => {
                const categoryWrapper = document.createElement("div");
                categoryWrapper.className = "category-wrapper";

                const catHeader = document.createElement("div");
                catHeader.className = "cat-header collapsible";
                catHeader.dataset.categoryId = cat.id;
                catHeader.draggable = true;
                catHeader.setAttribute('aria-grabbed', 'false');

                // Eventos de Drag and Drop para categorías
                catHeader.addEventListener('dragstart', (e) => {
                    e.stopPropagation();
                    catHeader.setAttribute('aria-grabbed', 'true');
                    catHeader.classList.add('is-dragging');
                    e.dataTransfer.setData('text/plain', cat.id);
                    e.dataTransfer.effectAllowed = 'move';
                });
                catHeader.addEventListener('dragenter', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!catHeader.classList.contains('is-dragging')) {
                        catHeader.classList.add('drag-over');
                    }
                });
                catHeader.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = 'move';
                });
                catHeader.addEventListener('dragleave', (e) => {
                    e.stopPropagation();
                    catHeader.classList.remove('drag-over');
                });
                catHeader.addEventListener('drop', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    catHeader.classList.remove('drag-over');
                    const draggedId = e.dataTransfer.getData('text/plain');
                    const targetId = cat.id;

                    // Reordena categoría (si draggedId es una categoría)
                    if (App.state.getCategories().some(c => c.id === draggedId)) {
                        if (draggedId !== targetId) {
                            App.state.reorderCategory(draggedId, targetId);
                        }
                    } else { // Si es una misión arrastrada a una categoría
                        try {
                            const draggedData = JSON.parse(draggedId);
                            if (draggedData.missionId && draggedData.categoryId) {
                                App.state.reorderMission(draggedData.missionId, targetId, draggedData.categoryId, targetId);
                            }
                        } catch (error) {
                            console.error("Error al parsear datos de arrastre para misión a categoría:", error);
                        }
                    }
                });
                catHeader.addEventListener('dragend', (e) => {
                    e.stopPropagation();
                    catHeader.classList.remove('is-dragging');
                    catHeader.setAttribute('aria-grabbed', 'false');
                    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
                });

                // Eventos de click y doble click para categorías
                catHeader.addEventListener('click', (e) => {
                    if (e.target.tagName !== 'BUTTON') { // Para no colapsar si se hace click en un botón dentro del header
                        e.stopPropagation();
                        catHeader.classList.toggle('collapsed');
                    }
                });
                catHeader.addEventListener('dblclick', (e) => {
                    e.stopPropagation();
                    document.querySelectorAll('.cat-header.show-delete').forEach(el => el.classList.remove('show-delete'));
                    catHeader.classList.add('show-delete');
                });

                const arrowSpan = document.createElement("span");
                arrowSpan.className = "collapse-arrow";
                catHeader.appendChild(arrowSpan);

                const catNameSpan = document.createElement("span");
                catNameSpan.textContent = cat.name;
                catHeader.appendChild(catNameSpan);

                const buttonsWrapper = document.createElement("div");
                buttonsWrapper.style.marginLeft = 'auto';
                buttonsWrapper.style.display = 'flex';
                buttonsWrapper.style.alignItems = 'center';
                buttonsWrapper.style.gap = '0.5rem';

                const showFormBtn = document.createElement("button");
                showFormBtn.className = "discreet-btn";
                showFormBtn.innerHTML = `<span class="icon">⚔️</span> Nueva Misión`;
                showFormBtn.onclick = (e) => {
                    e.stopPropagation();
                    const formContainer = document.getElementById(`addMissionForm-${cat.id}`);
                    if (formContainer) { // Chequeo de existencia
                        const isVisible = formContainer.classList.contains("active");
                        document.querySelectorAll('.form-container.active').forEach(f => f.classList.remove('active'));
                        formContainer.classList.toggle("active", !isVisible);
                        if (!isVisible) {
                            const nameInput = formContainer.querySelector("input[type='text']");
                            if (nameInput) nameInput.focus();
                        }
                    } else {
                        console.warn(`Formulario de añadir misión para categoría ${cat.id} no encontrado.`);
                    }
                };
                buttonsWrapper.appendChild(showFormBtn);

                const deleteCatBtn = document.createElement("button");
                deleteCatBtn.innerHTML = '❌';
                deleteCatBtn.className = "delete-btn";
                deleteCatBtn.title = "Eliminar categoría";
                deleteCatBtn.onclick = (e) => {
                    e.stopPropagation();
                    App.state.deleteCategory(cat.id);
                };
                buttonsWrapper.appendChild(deleteCatBtn);
                catHeader.appendChild(buttonsWrapper);
                categoryWrapper.appendChild(catHeader);

                const missionListContainer = document.createElement("div");
                missionListContainer.className = "mission-list-container";
                missionListContainer.id = `missions-for-cat-${cat.id}`;
                categoryWrapper.appendChild(missionListContainer);

                // Eventos de Drag and Drop para lista de misiones (como contenedor para drop)
                missionListContainer.addEventListener('dragover', (e) => e.preventDefault());
                missionListContainer.addEventListener('drop', (e) => {
                    e.preventDefault();
                    e.stopPropagation(); // Evita que el drop se propague a la categoría padre
                    try {
                        const draggedData = JSON.parse(e.dataTransfer.getData('text/plain'));
                        const draggedMissionId = draggedData.missionId;
                        const draggedFromCategoryId = draggedData.categoryId;
                        const targetCategoryId = cat.id; // La ID de la categoría donde se dejó

                        // Si es una misión arrastrada sobre el contenedor vacío de una categoría
                        if (draggedMissionId && draggedFromCategoryId) {
                            App.state.reorderMission(draggedMissionId, targetCategoryId, draggedFromCategoryId, targetCategoryId);
                        }
                    } catch (error) {
                        console.error("Error al parsear datos de arrastre para drop en misiónListContainer:", error);
                    }
                });

                const missionsForCat = missions.filter(m => m.categoryId === cat.id);
                if (missionsForCat.length === 0) {
                    const noMissionText = document.createElement("p");
                    noMissionText.style.textAlign = 'center';
                    noMissionText.style.color = 'var(--ff-text-dark)';
                    noMissionText.textContent = "No hay misiones en esta categoría.";
                    missionListContainer.appendChild(noMissionText);
                } else {
                    missionsForCat.forEach(mission => {
                        const missionCard = document.createElement("div");
                        missionCard.className = "mission-card";
                        missionCard.dataset.missionId = mission.id;
                        missionCard.draggable = true;
                        missionCard.setAttribute('aria-grabbed', 'false');

                        // Eventos de Drag and Drop para misiones individuales
                        missionCard.addEventListener('dragstart', (e) => {
                            e.stopPropagation();
                            missionCard.setAttribute('aria-grabbed', 'true');
                            missionCard.classList.add('is-dragging-mission');
                            e.dataTransfer.setData('text/plain', JSON.stringify({
                                missionId: mission.id,
                                categoryId: cat.id
                            }));
                            e.dataTransfer.effectAllowed = 'move';
                        });
                        missionCard.addEventListener('dragenter', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!missionCard.classList.contains('is-dragging-mission')) {
                                missionCard.classList.add('drag-over-mission');
                            }
                        });
                        missionCard.addEventListener('dragover', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.dataTransfer.dropEffect = 'move';
                        });
                        missionCard.addEventListener('dragleave', (e) => {
                            e.stopPropagation();
                            missionCard.classList.remove('drag-over-mission');
                        });
                        missionCard.addEventListener('drop', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            missionCard.classList.remove('drag-over-mission');
                            try {
                                const draggedData = JSON.parse(e.dataTransfer.getData('text/plain'));
                                const draggedMissionId = draggedData.missionId;
                                const draggedFromCategoryId = draggedData.categoryId;
                                const targetMissionId = mission.id; // La misión sobre la que se soltó
                                const targetCategoryId = cat.id; // La categoría de la misión sobre la que se soltó

                                if (draggedMissionId !== targetMissionId) {
                                    App.state.reorderMission(draggedMissionId, targetMissionId, draggedFromCategoryId, targetCategoryId);
                                }
                            } catch (error) {
                                console.error("Error al parsear datos de arrastre para misión a misión:", error);
                            }
                        });
                        missionCard.addEventListener('dragend', (e) => {
                            e.stopPropagation();
                            missionCard.classList.remove('is-dragging-mission');
                            missionCard.setAttribute('aria-grabbed', 'false');
                            document.querySelectorAll('.drag-over-mission').forEach(el => el.classList.remove('drag-over-mission'));
                        });

                        missionCard.addEventListener('dblclick', (e) => {
                            e.stopPropagation();
                            document.querySelectorAll('.mission-card.show-delete').forEach(el => el.classList.remove('show-delete'));
                            missionCard.classList.add('show-delete');
                        });

                        const missionNameDiv = document.createElement("span");
                        missionNameDiv.className = "mission-name";
                        missionNameDiv.textContent = mission.name;
                        missionCard.appendChild(missionNameDiv);

                        const pointsAndActionDiv = document.createElement("div");
                        pointsAndActionDiv.className = "points-and-action";

                        const pointsSpan = document.createElement("span");
                        pointsSpan.className = `mission-points ${mission.points >= 0 ? "positive" : "negative"}`;
                        pointsSpan.textContent = `${mission.points >= 0 ? "＋" : "−"}${Math.abs(mission.points)}`;
                        pointsAndActionDiv.appendChild(pointsSpan);

                        const scheduleButton = document.createElement("button");
                        // Usamos el emoji 📅 como acordamos
                        scheduleButton.innerHTML = '📅';
                        scheduleButton.className = "schedule-btn"; // Usamos la clase para el estilo grande
                        scheduleButton.title = `Programar ${mission.name}`;
                        scheduleButton.onclick = (e) => {
                            e.stopPropagation();
                            App.ui.events.openScheduleMissionModal(mission.id);
                        };
                        pointsAndActionDiv.appendChild(scheduleButton);
                        missionCard.appendChild(pointsAndActionDiv);

                        const deleteBtn = document.createElement("button");
                        deleteBtn.innerHTML = '❌';
                        deleteBtn.className = "delete-btn";
                        deleteBtn.title = "Eliminar misión";
                        deleteBtn.onclick = (e) => {
                            e.stopPropagation();
                            App.state.deleteMission(mission.id);
                        };
                        missionCard.appendChild(deleteBtn);
                        missionListContainer.appendChild(missionCard);
                    });
                }
                
                // Formulario para añadir misión
                const addMissionFormContainer = document.createElement("div");
                addMissionFormContainer.id = `addMissionForm-${cat.id}`;
                addMissionFormContainer.className = "form-container";
                const form = document.createElement("form");
                form.className = "add-mission-form";
                form.dataset.categoryId = cat.id;
                form.setAttribute("aria-label", "Agregar nueva misión");
                form.innerHTML = `
                    <input type="text" name="missionName" placeholder="Nombre de la misión" required />
                    <input type="number" name="missionPoints" placeholder="Puntos" required />
                    <button type="submit" class="primary">➕</button>`;
                form.onsubmit = (e) => {
                    e.preventDefault();
                    const nameInput = form.querySelector("input[name='missionName']");
                    const pointsInput = form.querySelector("input[name='missionPoints']");

                    const name = nameInput ? nameInput.value.trim() : '';
                    const points = pointsInput ? parseInt(pointsInput.value.trim(), 10) : NaN;

                    if (!name) {
                        App.ui.events.showCustomAlert("El nombre de la misión es requerido.");
                        return;
                    }
                    if (isNaN(points)) {
                        App.ui.events.showCustomAlert("Los puntos deben ser un número.");
                        return;
                    }

                    App.state.addMission(cat.id, name, points);
                    if (nameInput) nameInput.value = '';
                    if (pointsInput) pointsInput.value = '';
                };
                addMissionFormContainer.appendChild(form);
                categoryWrapper.appendChild(addMissionFormContainer);
                container.appendChild(categoryWrapper);
            });
        },

        /**
         * @description Renderiza las misiones programadas.
         */
        renderScheduledMissions: function() {
            const container = document.getElementById("scheduledMissionsList");
            if (!container) {
                console.warn("Contenedor #scheduledMissionsList no encontrado, no se pueden renderizar las misiones programadas.");
                return;
            }
            container.innerHTML = "";

            const scheduledMissions = App.state.getScheduledMissions();
            if (scheduledMissions.length === 0) {
                container.innerHTML = `<p style="text-align:center; color:var(--ff-text-dark);">No hay misiones programadas. ¡Planifica tu aventura!</p>`;
                return;
            }

            const allMissionsToDisplay = [];
            const MAX_DISPLAY_OCCURRENCES = 30;
            const todayNormalized = App.utils.normalizeDateToStartOfDay(new Date());
            if (!todayNormalized) { // Fallback si la normalización de hoy falla (muy improbable)
                console.error("No se pudo obtener la fecha de hoy normalizada para misiones programadas.");
                return;
            }

            scheduledMissions.forEach(scheduledMis => {
                // Agregar la misión programada original
                allMissionsToDisplay.push({ ...scheduledMis,
                    isActualScheduled: true, // Indica que es la misión programada original
                    displayId: App.utils.genId("disp-") // ID único para el renderizado
                });

                if (scheduledMis.isRecurring) {
                    const initialScheduledDateObj = App.utils.normalizeDateToStartOfDay(scheduledMis.scheduledDate);
                    if (!initialScheduledDateObj) { // Saltar si la fecha programada inicial es inválida
                        console.warn(`renderScheduledMissions: Misión recurrente "${scheduledMis.name}" tiene fecha inicial inválida. Se omitirá la generación de ocurrencias.`);
                        return;
                    }

                    let currentGeneratedDate = initialScheduledDateObj;
                    const repeatEndDateObj = scheduledMis.repeatEndDate ? App.utils.normalizeDateToStartOfDay(scheduledMis.repeatEndDate) : null;

                    let count = 0;
                    // Generar futuras ocurrencias para mostrar
                    while (count < MAX_DISPLAY_OCCURRENCES) {
                        currentGeneratedDate = App.utils.addDateUnit(currentGeneratedDate, scheduledMis.repeatInterval, scheduledMis.repeatUnit);
                        
                        // Si addDateUnit devuelve null (fecha inválida), o si la fecha excede el fin de repetición, romper
                        if (!currentGeneratedDate || (repeatEndDateObj && currentGeneratedDate <= repeatEndDateObj && currentGeneratedDate < todayNormalized)) {
                            // Si la fecha generada es del pasado y está dentro del rango de repetición, saltarla.
                            // Si excede repeatEndDate, romper.
                            break;
                        }

                        const normalizedGeneratedDate = App.utils.normalizeDateToStartOfDay(currentGeneratedDate);
                        if (!normalizedGeneratedDate) {
                            console.warn(`renderScheduledMissions: Normalización de fecha generada inválida para misión recurrente "${scheduledMis.name}". Interrumpiendo generación.`);
                            break;
                        }

                        // Solo añadir ocurrencias que son hoy o en el futuro Y no exceden repeatEndDate
                        if (normalizedGeneratedDate >= todayNormalized && (!repeatEndDateObj || normalizedGeneratedDate <= repeatEndDateObj)) {
                            allMissionsToDisplay.push({
                                ...scheduledMis,
                                id: scheduledMis.id, // Mantiene el ID original de la misión programada
                                displayId: App.utils.genId("disp-"), // Un nuevo ID para la visualización de la ocurrencia
                                scheduledDate: App.utils.getFormattedDate(normalizedGeneratedDate),
                                isActualScheduled: false // Indica que es una ocurrencia generada, no la original
                            });
                        }
                        count++;
                    }
                }
            });

            // Filtrar y ordenar todas las misiones y ocurrencias generadas
            const filteredAndSortedDisplayMissions = allMissionsToDisplay
                .filter(m => {
                    const mDateNormalized = App.utils.normalizeDateToStartOfDay(m.scheduledDate);
                    return mDateNormalized && mDateNormalized >= todayNormalized;
                })
                .sort((a, b) => {
                    const dateA = App.utils.normalizeDateToStartOfDay(a.scheduledDate);
                    const dateB = App.utils.normalizeDateToStartOfDay(b.scheduledDate);
                    if (!dateA || !dateB) return 0; // Manejar fechas inválidas en la ordenación
                    return dateA.getTime() - dateB.getTime();
                });

            const groupedMissions = {};
            filteredAndSortedDisplayMissions.forEach(mission => {
                if (!groupedMissions[mission.scheduledDate]) {
                    groupedMissions[mission.scheduledDate] = [];
                }
                groupedMissions[mission.scheduledDate].push(mission);
            });

            for (const date in groupedMissions) {
                const dateHeader = document.createElement("div");
                dateHeader.className = "date-group-header";

                let displayDate = App.utils.getFormattedDateWithDayOfWeek(date); // Usar la nueva función aquí

                const todayFormatted = App.utils.getFormattedDate(new Date());
                const tomorrowDateObj = App.utils.addDateUnit(App.utils.normalizeDateToStartOfDay(new Date()), 1, 'day'); // Pasa Date() a addDateUnit para que funcione con tu utils
                const tomorrowFormatted = tomorrowDateObj ? App.utils.getFormattedDate(tomorrowDateObj) : null;


                if (date === todayFormatted) {
                    displayDate = `Hoy, ${displayDate}`;
                } else if (tomorrowFormatted && date === tomorrowFormatted) {
                    displayDate = `Mañana, ${displayDate}`;
                }
                dateHeader.textContent = `Misiones para: ${displayDate}`;
                container.appendChild(dateHeader);

                groupedMissions[date].forEach(scheduledMis => {
                    const card = document.createElement("div");
                    card.className = "scheduled-mission-card";
                    // Usar displayId para el dataset si existe, de lo contrario el ID original.
                    card.dataset.scheduledMissionId = scheduledMis.displayId || scheduledMis.id; 

                    const nameSpan = document.createElement("span");
                    nameSpan.className = "scheduled-mission-name";
                    nameSpan.textContent = scheduledMis.name;
                    card.appendChild(nameSpan);

                    const recurrenceInfo = document.createElement("span");
                    recurrenceInfo.className = "recurrence-info";
                    if (scheduledMis.isRecurring) {
                        let infoText = `cada ${scheduledMis.repeatInterval} ${scheduledMis.repeatUnit}(s)`;
                        if (scheduledMis.repeatEndDate) {
                            infoText += ` hasta ${App.utils.getFormattedDateWithDayOfWeek(scheduledMis.repeatEndDate)}`; // Formatear también aquí
                        }
                        recurrenceInfo.textContent = `(${infoText})`;
                        nameSpan.appendChild(recurrenceInfo);
                    }

                    const pointsSpan = document.createElement("span");
                    pointsSpan.className = `scheduled-mission-points ${scheduledMis.points >= 0 ? "positive" : "negative"}`;
                    pointsSpan.textContent = `${scheduledMis.points >= 0 ? "＋" : "−"}${Math.abs(scheduledMis.points)}`;
                    card.appendChild(pointsSpan);

                    if (scheduledMis.isActualScheduled) { // Solo mostrar botón de eliminar para la misión original
                        const deleteBtn = document.createElement("button");
                        deleteBtn.innerHTML = '❌';
                        deleteBtn.className = "delete-btn";
                        deleteBtn.title = "Eliminar misión programada";
                        deleteBtn.onclick = () => App.state.deleteScheduledMission(scheduledMis.id); // Eliminar por el ID original
                        card.appendChild(deleteBtn);
                    }
                    container.appendChild(card);
                });
            }
        },

        /**
         * @description Renderiza el historial de puntos.
         */
        renderHistory: function() {
            const container = document.getElementById("historyBody");
            if (!container) {
                console.warn("Contenedor #historyBody no encontrado, no se puede renderizar el historial.");
                return;
            }
            container.innerHTML = "";

            const history = App.state.getHistory();
            if (history.length === 0) {
                const row = document.createElement("tr");
                row.innerHTML = `<td colspan="4" style="text-align:center; color:var(--ff-text-dark);">No hay historial de puntos.</td>`;
                container.appendChild(row);
                return;
            }

            [...history].reverse().forEach(histDay => {
                const row = document.createElement("tr");
                row.className = "history-main-row";
                const net = histDay.earned - histDay.spent;
                // Usar la nueva función para formatear la fecha del historial
                const dateObjForHistory = App.utils.normalizeDateToStartOfDay(histDay.date);
                const displayDate = dateObjForHistory ? dateObjForHistory.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).replace('.', '').replace(',', '') : 'Fecha inválida';                row.innerHTML = `
                    <td>${displayDate}</td>
                    <td class="positive">＋${histDay.earned}</td>
                    <td class="negative">−${histDay.spent}</td>
                    <td class="${net >= 0 ? 'positive' : 'negative'}">${net}</td>
                `;
                const detailRow = document.createElement("tr");
                detailRow.className = "history-details-container";
                const detailCell = document.createElement("td");
                detailCell.setAttribute("colspan", "4");
                
                // Asegurarse de que histDay.actions es un array antes de mapear
                const actionsHtml = Array.isArray(histDay.actions) 
                    ? histDay.actions.map(action => `<li>${action.name} (${action.points >= 0 ? "＋" : "−"}${Math.abs(action.points)})</li>`).join('')
                    : ''; // Cadena vacía si no es un array
                
                detailCell.innerHTML = `<strong>Acciones:</strong><ul>${actionsHtml}</ul>`;
                detailRow.appendChild(detailCell);

                row.addEventListener('click', () => {
                    const isVisible = detailRow.style.display === 'table-row';
                    detailRow.style.display = isVisible ? 'none' : 'table-row';
                });

                container.appendChild(row);
                container.appendChild(detailRow);
            });
        },

        /**
         * @description Renderiza los productos de la tienda.
         */
        renderShopItems: function() {
            const container = document.getElementById("shopList");
            if (!container) {
                console.warn("Contenedor #shopList no encontrado, no se pueden renderizar los productos de la tienda.");
                return;
            }
            container.innerHTML = "";

            const today = App.utils.getFormattedDate();
            const shopItems = App.state.getShopItems();

            if (shopItems.length === 0) {
                container.innerHTML = `<p style="text-align:center; color:var(--ff-text-dark);">No hay productos en la tienda. Agrega uno nuevo.</p>`;
                return;
            }

            shopItems.forEach((item) => {
                const card = document.createElement("div");
                card.className = `shop-card ${item.purchasedTodayDate === today ? 'purchased' : ''}`;
                card.dataset.shopItemId = item.id;

                card.addEventListener('dblclick', (e) => {
                    e.stopPropagation();
                    document.querySelectorAll('.show-delete').forEach(el => el.classList.remove('show-delete'));
                    card.classList.add('show-delete');
                });

                const nameSpan = document.createElement("span");
                nameSpan.className = "shop-item-name";
                nameSpan.textContent = item.name;
                card.appendChild(nameSpan);

                const costWrapper = document.createElement("div");
                costWrapper.className = "shop-item-cost-wrapper";

                const costSpan = document.createElement("span");
                costSpan.className = "shop-item-cost negative";
                costSpan.textContent = `−${item.cost}`;
                costWrapper.appendChild(costSpan);

                const buyBtn = document.createElement("button");
                buyBtn.className = "icon-btn";
                buyBtn.innerHTML = '💸';
                buyBtn.title = `Comprar ${item.name}`;
                buyBtn.disabled = item.purchasedTodayDate === today;
                buyBtn.onclick = (e) => {
                    e.stopPropagation();
                    App.state.buyShopItem(item.id);
                };
                costWrapper.appendChild(buyBtn);
                card.appendChild(costWrapper);

                const deleteBtn = document.createElement("button");
                deleteBtn.innerHTML = '❌';
                deleteBtn.className = "delete-btn";
                deleteBtn.title = "Eliminar producto de la tienda";
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    App.state.deleteShopItem(item.id);
                };
                card.appendChild(deleteBtn);
                container.appendChild(card);
            });
        },

        /**
         * @description Renderiza las estadísticas de puntos ganados, gastados y netos para el día actual.
         */
        renderStatsToday: function() {
            const todayStr = App.utils.getFormattedDate();
            const history = App.state.getHistory();
            const histDay = history.find(h => h.date === todayStr);
            const earned = histDay ? histDay.earned : 0;
            const spent = histDay ? histDay.spent : 0;
            const net = earned - spent;

            const pointsEarnedEl = document.getElementById("pointsEarned");
            const pointsSpentEl = document.getElementById("pointsSpent");
            const pointsNetEl = document.getElementById("pointsNet");

            if (pointsEarnedEl) {
                pointsEarnedEl.textContent = `${earned}`;
                pointsEarnedEl.className = "stats-value " + (earned > 0 ? "positive" : "");
            } else { console.warn("Elemento #pointsEarned no encontrado."); }

            if (pointsSpentEl) {
                pointsSpentEl.textContent = `${spent}`;
                pointsSpentEl.className = "stats-value " + (spent > 0 ? "negative" : "");
            } else { console.warn("Elemento #pointsSpent no encontrado."); }

            if (pointsNetEl) {
                pointsNetEl.textContent = `${net}`;
                pointsNetEl.className = "stats-value " + (net > 0 ? "positive" : (net < 0 ? "negative" : ""));
            } else { console.warn("Elemento #pointsNet no encontrado."); }
        },

        /**
         * @description Muestra un mensaje temporal de motivación/celebración (para logros).
         * @param {string} message El mensaje a mostrar.
         */
        showMotivationMessage: function(message) {
            const container = document.getElementById('motivationMessagesContainer');
            if (!container) {
                console.warn("Contenedor #motivationMessagesContainer no encontrado, no se puede mostrar el mensaje de motivación.");
                return;
            }
            const msgElement = document.createElement('div');
            msgElement.className = 'motivation-message'; // Clase para mensajes de celebración
            msgElement.textContent = message;

            container.appendChild(msgElement);

            // Eliminar el mensaje después de la animación para limpiar el DOM
            msgElement.addEventListener('animationend', () => {
                msgElement.remove();
            });
        },

        /**
         * @description Muestra un mensaje temporal discreto (para confirmaciones generales).
         * Aparece en la parte superior central.
         * @param {string} message El mensaje a mostrar.
         */
        showDiscreetMessage: function(message) {
            const container = document.getElementById('discreetMessagesContainer'); // ¡APUNTA AL NUEVO CONTENEDOR!
            if (!container) {
                console.warn("Contenedor #discreetMessagesContainer no encontrado, no se puede mostrar el mensaje discreto.");
                return;
            }

            // Eliminar cualquier mensaje discreto anterior para evitar superposiciones
            const existingMessage = container.querySelector('.discreet-message');
            if (existingMessage) {
                existingMessage.remove(); // Elimina el mensaje anterior inmediatamente
            }

            const msgElement = document.createElement('div');
            msgElement.className = 'discreet-message'; // Clase para mensajes discretos
            msgElement.textContent = message;

            container.appendChild(msgElement);

            // Forzar reflow para que la transición CSS funcione correctamente
            void msgElement.offsetWidth;
            msgElement.classList.add('show'); // Añadir clase para activar la transición de visibilidad

            // Eliminar el mensaje después de un tiempo (ej. 3 segundos)
            setTimeout(() => {
                msgElement.classList.remove('show');
                // Asegurarse de que el elemento se elimina solo después de que la transición de salida ha terminado
                msgElement.addEventListener('transitionend', () => {
                    msgElement.remove();
                }, { once: true });
            }, 3000); // Duración en milisegundos que el mensaje es visible
        }
    };
})(window.App = window.App || {});
