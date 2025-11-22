// features/feature-missions.js
(function(App) {
    'use strict';

    // --- PRIVATE VARIABLES ---
    let missionToSchedule = null;
    let _currentScheduleDateObj = null;
    let _currentScheduledProgramId = null;

    // --- PRIVATE METHODS ---

    /**
     * @description Actualiza la visualización de la fecha en el modal de programación.
     */
    function _updateScheduleDateDisplay() {
        const scheduleDateDisplay = document.getElementById('scheduleDateDisplay');
        const prevDayBtn = document.getElementById('prevDayBtn');
        const repeatEndDateInput = document.getElementById('repeatEndDate');
        const scheduledPointsSummary = document.getElementById('scheduledPointsSummary');
        const scheduledPointsValue = document.getElementById('scheduledPointsValue');

        if (!scheduleDateDisplay || !prevDayBtn || !repeatEndDateInput || !_currentScheduleDateObj) {
            console.error("_updateScheduleDateDisplay: Elementos o fecha actual no encontrados.");
            return;
        }

        const todayNormalized = App.utils.normalizeDateToStartOfDay(new Date());
        const currentNormalized = App.utils.normalizeDateToStartOfDay(_currentScheduleDateObj);

        if (!currentNormalized || !todayNormalized) {
            scheduleDateDisplay.innerHTML = "Fecha inválida";
            prevDayBtn.disabled = true;
            return;
        }

        const weekday = _currentScheduleDateObj.toLocaleDateString('es-ES', { weekday: 'long' }).toUpperCase();
        const dateStr = _currentScheduleDateObj.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        let relativeDateText = '';

        if (currentNormalized.getTime() === todayNormalized.getTime()) {
            relativeDateText = '(Hoy)';
            prevDayBtn.disabled = true;
        } else {
            prevDayBtn.disabled = false;
        }

        let finalDisplayHtml = `
            <div style="font-size: 1.5em; font-weight: bold; margin-bottom: 0.2em;">${weekday}</div>
            <div style="font-size: 0.9em; opacity: 0.8;">${dateStr}</div>
        `;

        if (relativeDateText) {
            finalDisplayHtml += `<div style="font-size: 0.9em; color: var(--ff-text-dark); margin-top: 0.2em;">${relativeDateText}</div>`;
        }

        scheduleDateDisplay.innerHTML = finalDisplayHtml;
        repeatEndDateInput.min = App.utils.getFormattedDate(_currentScheduleDateObj);
        
        // Actualizar la suma de puntos programados para esta fecha
        if (scheduledPointsSummary && scheduledPointsValue) {
            const totalPoints = App.state.getScheduledPointsForDate(_currentScheduleDateObj);
            if (totalPoints > 0) {
                scheduledPointsValue.textContent = totalPoints;
                scheduledPointsSummary.style.display = 'flex';
            } else {
                scheduledPointsSummary.style.display = 'none';
            }
        }
    }

    /**
     * @description Inicializa los listeners para el modal de edición de misiones.
     */
    function _initEditMissionModalListeners() {
        const editMissionModal = document.getElementById('editMissionModal');
        const closeBtn = document.getElementById('closeEditMissionModal');
        const form = document.getElementById('editMissionForm');
        const deleteBtn = document.getElementById('deleteMissionBtn');
        const saveButton = document.getElementById('saveMissionChanges');
        const cancelBtn = document.getElementById('cancelEditMissionBtn');

        if (!editMissionModal || !closeBtn || !form || !deleteBtn || !saveButton || !cancelBtn) {
            console.error('Elementos del modal de edición de misión no encontrados.');
            return;
        }

        const closeModal = App.ui.missions.closeEditMissionModal;

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);

        saveButton.addEventListener('click', () => {
            const missionId = document.getElementById('editMissionId').value;
            const updatedMission = {
                id: missionId,
                name: document.getElementById('editMissionName').value,
                description: document.getElementById('editMissionDescription').value,
                dailyRepetitions: { max: parseInt(document.getElementById('editMissionDailyReps').value, 10) || 1 },
                points: parseInt(document.getElementById('editMissionPoints').value, 10) || 0
            };
            
            // ⭐ NUEVO: Capturar hora y duración
            const scheduleTimeInput = document.getElementById('editMissionScheduleTime');
            const scheduleDurationInput = document.getElementById('editMissionScheduleDuration');
            const scheduleDurationUnitSelect = document.getElementById('editMissionScheduleDurationUnit');
            
            let scheduleTime = null;
            let scheduleDuration = null;
            
            if (scheduleTimeInput && scheduleTimeInput.value) {
                scheduleTime = { time: scheduleTimeInput.value };
            }
            
            if (scheduleDurationInput && scheduleDurationInput.value) {
                scheduleDuration = {
                    value: parseInt(scheduleDurationInput.value, 10),
                    unit: scheduleDurationUnitSelect ? scheduleDurationUnitSelect.value : 'minutes'
                };
            }
            
            // ⭐ AJUSTE AUTOMÁTICO DE PESO SEGÚN HORA PROGRAMADA
            let weightChanged = false;
            if (scheduleTime && scheduleTime.time) {
                // Usar la función centralizada para calcular peso
                const mission = App.state.getMissionById(missionId);
                if (mission) {
                    App.state.calculateAndAssignMissionWeight(mission, scheduleTime);
                    weightChanged = true;
                }
            }
            
            // Actualizar la misión
            App.state.updateMission(missionId, updatedMission);
            
            // ⭐ NUEVO: Si la misión está programada, actualizar scheduleTime y scheduleDuration
            const scheduledMission = App.state.getScheduledMissions().find(sm => sm.missionId === missionId);
            if (scheduledMission) {
                // Actualizar en scheduledMissions
                scheduledMission.scheduleTime = scheduleTime;
                scheduledMission.scheduleDuration = scheduleDuration;
                
                console.log(`📝 Actualizando hora y duración en scheduledMission:`, {
                    missionId,
                    scheduleTime,
                    scheduleDuration
                });
            }
            
            // ⭐ Actualizar en todas las tareas existentes de tasksByDate (siempre, no solo si hay scheduledMission)
            const state = App.state.getState();
            if (state.tasksByDate) {
                Object.keys(state.tasksByDate).forEach(dateKey => {
                    const tasksForDate = state.tasksByDate[dateKey];
                    if (Array.isArray(tasksForDate)) {
                        tasksForDate.forEach(task => {
                            if (task.missionId === missionId) {
                                task.scheduleTime = scheduleTime;
                                task.scheduleDuration = scheduleDuration;
                                console.log(`📝 Actualizando hora y duración en tarea ${task.id}:`, {
                                    scheduleTime,
                                    scheduleDuration
                                });
                            }
                        });
                    }
                });
            }
            
            // ⭐ Guardar el estado actualizado SIEMPRE
            App.state.saveState();
            
            // Si el peso cambió, limpiar orden manual
            if (weightChanged) {
                console.log('🔄 Forzando actualización de TODAY por cambio de peso');
                
                // Limpiar el orden guardado manualmente para que se use el nuevo peso
                const today = App.utils.getFormattedDate();
                const savedOrder = App.state.getTodayTaskOrder(today);
                if (savedOrder && savedOrder.length > 0) {
                    console.log('🗑️ Limpiando orden manual guardado para permitir reordenamiento por peso');
                    App.state.saveTodayTaskOrder([], today);
                }
            }
            
            // ⭐ SIEMPRE emitir eventos para actualizar la UI (no solo si weightChanged)
            console.log('🔄 Emitiendo eventos para actualizar UI');
            App.events.emit('scheduledMissionsUpdated');
            App.events.emit('todayTasksUpdated');
            
            closeModal();
        });

    }

    /**
     * @description Abre el modal de edición de misiones.
     */

    // --- PUBLIC API ---
    App.ui.missions = {
        /**
         * @description Renderiza las categorías y misiones en el Libro de Misiones.
         */
        render: function() {
            const container = document.getElementById("missionsGrid");
            if (!container) {
                console.warn("Contenedor #missionsGrid no encontrado, no se pueden renderizar las misiones.");
                return;
            }
            const expandedCategoryIds = new Set();
            container.querySelectorAll('.cat-header:not(.collapsed)').forEach(header => {
                expandedCategoryIds.add(header.dataset.categoryId);
            });

            container.innerHTML = "";

            const categories = App.state.getCategories();
            const missions = App.state.getMissions();

            if (categories.length === 0 && missions.length === 0) {
                container.innerHTML = `<p style="text-align:center; color:var(--ff-text-dark);">No hay propósitos. Agrega uno nuevo para empezar.</p>`;
                return;
            }
            categories.forEach(cat => {
                const categoryWrapper = document.createElement("div");
                categoryWrapper.className = "category-wrapper";

                const catHeader = document.createElement("div");
                const isExpanded = expandedCategoryIds.has(cat.id);
                catHeader.className = `cat-header collapsible ${isExpanded ? '' : 'collapsed'}`.trim();
                catHeader.dataset.categoryId = cat.id;

                // --- INICIO: Lógica de Long Press para Categorías ---
                let pressTimer = null;
                let longPressTriggered = false;

                const handlePressStart = (e) => {
                    if (e.target.closest('input, .edit-category-icon')) return;
                    longPressTriggered = false;
                    pressTimer = window.setTimeout(() => {
                        longPressTriggered = true;
                        if (navigator.vibrate) navigator.vibrate(50);
                        App.state.deleteCategory(cat.id);
                        pressTimer = null;
                    }, 800);
                };

                const handlePressEnd = (e) => {
                    clearTimeout(pressTimer);
                    pressTimer = null;
                    if (longPressTriggered) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                };
                
                const handlePressMove = (e) => {
                    if (pressTimer) {
                        clearTimeout(pressTimer);
                        pressTimer = null;
                    }
                };

                catHeader.addEventListener('mousedown', handlePressStart);
                catHeader.addEventListener('mouseup', handlePressEnd);
                catHeader.addEventListener('mouseleave', handlePressEnd);

                catHeader.addEventListener('touchstart', handlePressStart, { passive: true });
                catHeader.addEventListener('touchend', handlePressEnd);
                catHeader.addEventListener('touchcancel', handlePressEnd);
                catHeader.addEventListener('touchmove', handlePressMove, { passive: true });
                // --- FIN: Lógica de Long Press para Categorías ---

                catHeader.addEventListener('click', (e) => {
                    if (longPressTriggered) {
                        e.stopImmediatePropagation();
                        return;
                    }
                    if (!e.target.closest('input, .edit-category-icon')) {
                        catHeader.classList.toggle('collapsed');
                    }
                }, true);

                const arrowSpan = document.createElement("span");
                arrowSpan.className = "collapse-arrow";
                catHeader.appendChild(arrowSpan);

                const catNameWrapper = document.createElement("span");
                catNameWrapper.className = "category-name-wrapper";
                catHeader.appendChild(catNameWrapper);

                const catNameText = document.createElement("span");
                catNameText.textContent = cat.name;
                catNameText.className = "category-name-text";
                catNameWrapper.appendChild(catNameText);
                
                // --- INICIO: SVG de edición incrustado en el título ---
                const editIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                editIcon.setAttribute("viewBox", "0 0 24 24");
                editIcon.setAttribute("width", "16");
                editIcon.setAttribute("height", "16");
                editIcon.innerHTML = `<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
                editIcon.classList.add("edit-category-icon");
                catNameWrapper.appendChild(editIcon);

                editIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const originalName = catNameText.textContent.trim();
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.value = originalName;
                    input.className = 'edit-category-input';

                    catNameWrapper.replaceWith(input);
                    input.focus();
                    input.select();

                    const saveChanges = () => {
                        const newName = input.value.trim();
                        if (newName && newName !== originalName) {
                            App.state.updateCategoryName(cat.id, newName);
                        } else {
                            input.replaceWith(catNameWrapper);
                            catNameText.textContent = originalName;
                        }
                    };

                    input.addEventListener('blur', saveChanges);
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            saveChanges();
                            input.blur();
                        }
                    });
                });
                // --- FIN: SVG de edición incrustado en el título ---

                const buttonsWrapper = document.createElement("div");
                buttonsWrapper.style.marginLeft = 'auto';
                buttonsWrapper.style.display = 'flex';
                buttonsWrapper.style.alignItems = 'center';
                buttonsWrapper.style.gap = '0.5rem';

                const showFormBtn = document.createElement("button");
                showFormBtn.className = "add-mission-btn";
                showFormBtn.innerHTML = `<span class="icon">⚔️</span> `;
                showFormBtn.onclick = (e) => {
                    e.stopPropagation();
                    const header = e.target.closest('.cat-header');
                    const formContainer = document.getElementById(`addMissionForm-${cat.id}`);

                    if (header && header.classList.contains('collapsed')) {
                        header.classList.remove('collapsed');
                    }

                    if (formContainer) {
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

                catHeader.appendChild(buttonsWrapper);
                categoryWrapper.appendChild(catHeader);

                const missionListContainer = document.createElement("div");
                missionListContainer.className = "mission-list-container";
                missionListContainer.id = `missions-for-cat-${cat.id}`;
                categoryWrapper.appendChild(missionListContainer);

                const missionsForCat = missions.filter(m => m.categoryId === cat.id);
                if (missionsForCat.length === 0) {
                    const noMissionText = document.createElement("p");
                    noMissionText.style.textAlign = 'center';
                    noMissionText.style.color = 'var(--ff-text-dark)';
                    noMissionText.textContent = "No hay misiones para este propósito.";
                    missionListContainer.appendChild(noMissionText);
                } else {
                    missionsForCat.forEach(mission => {
                        const missionCard = document.createElement("div");
                        missionCard.className = 'mission-card';
                        missionCard.dataset.missionId = mission.id;

                        const isMissionScheduled = App.state.getScheduledMissionByOriginalMissionId(mission.id);
                        if (isMissionScheduled) {
                            missionCard.classList.add('is-scheduled-in-book');
                            missionCard.dataset.scheduledMissionProgramId = isMissionScheduled.id;
                        }

                        const missionName = document.createElement('span');
                        missionName.className = 'mission-name';
                        const descriptionIcon = mission.description ? `<span class="description-icon" title="Tiene descripción"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="description-icon-svg"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h12v2H4z"></path></svg></span>` : '';
                        missionName.innerHTML = `${mission.name} ${descriptionIcon}`;
                        missionCard.appendChild(missionName);

                        const pointsAndActionDiv = document.createElement("div");
                        pointsAndActionDiv.className = 'mission-points-actions';

                        const pointsSpan = document.createElement("span");
                        pointsSpan.className = `mission-points ${mission.points >= 0 ? "positive" : "negative"}`;

                        let displayPoints = mission.points;
                        if (isMissionScheduled && isMissionScheduled.points !== mission.points) {
                            displayPoints = isMissionScheduled.points;
                        }

                        pointsSpan.textContent = `${displayPoints >= 0 ? "＋" : "−"}${Math.abs(displayPoints)}`;
                        pointsAndActionDiv.appendChild(pointsSpan);

                        const scheduleButton = document.createElement("button");
                        scheduleButton.innerHTML = isMissionScheduled ? '📅' : '🗓️';
                        scheduleButton.className = "schedule-btn";
                        scheduleButton.title = isMissionScheduled ? `Misión Programada` : `Programar ${mission.name}`;
                        scheduleButton.onclick = (e) => {
                            e.stopPropagation();
                            App.ui.missions.openScheduleMissionModal(mission.id, isMissionScheduled ? isMissionScheduled.id : null);
                        };
                        pointsAndActionDiv.appendChild(scheduleButton);
                        missionCard.appendChild(pointsAndActionDiv);

                        missionCard.addEventListener('click', (e) => {
                            e.stopPropagation();
                            if (!e.target.closest('.schedule-btn')) {
                                App.ui.missions.openEditMissionModal(mission.id);
                            }
                        });

                        missionListContainer.appendChild(missionCard);
                    });
                }

                const addMissionFormContainer = document.createElement("div");
                addMissionFormContainer.id = `addMissionForm-${cat.id}`;
                addMissionFormContainer.className = "form-container";
                missionListContainer.prepend(addMissionFormContainer);

                const form = document.createElement("form");
                form.className = "add-mission-form";
                form.dataset.categoryId = cat.id;
                form.setAttribute("aria-label", "Agregar nueva misión");
                form.innerHTML = `
                    <input type="text" name="missionName" placeholder="Nombre de la misión" required />
                    <input type="number" name="missionPoints" placeholder="Puntos por repetición" />
                    <button type="submit" class="primary">➕</button>`;
                    form.onsubmit = (e) => {
                        e.preventDefault();
                        const nameInput = form.querySelector("input[name='missionName']");
                        const pointsInput = form.querySelector("input[name='missionPoints']");
                    
                        const name = nameInput ? nameInput.value.trim() : '';
                        // Si el usuario no introduce nada, usamos 1 por defecto
                        const points = pointsInput && pointsInput.value.trim() !== '' 
                            ? parseInt(pointsInput.value.trim(), 10) 
                            : 1;
                    
                        if (!name) {
                            App.events.emit('showAlert', "El nombre de la misión es requerido.");
                            return;
                        }
                        if (isNaN(points)) {
                            App.events.emit('showAlert', "Los puntos deben ser un número.");
                            return;
                        }
                    
                        App.state.addMission(name, points, cat.id);
                    
                        if (nameInput) nameInput.value = '';
                        if (pointsInput) pointsInput.value = '';
                    };
                    
                addMissionFormContainer.appendChild(form);
                container.appendChild(categoryWrapper);
            });
        },

        openScheduleMissionModal: function(missionId, scheduledProgramId = null) {
            missionToSchedule = App.state.getMissions().find(m => m.id === missionId);
            if (!missionToSchedule) {
                App.events.emit('showAlert', "La misión que intentas programar no fue encontrada.");
                return;
            }

            const scheduleMissionModal = document.getElementById('scheduleMissionModal');
            const scheduleMissionTitle = document.getElementById('scheduleMissionModalTitle');
            const repeatMissionToggle = document.getElementById('repeatMissionToggle');
            const repeatMissionStateLabel = document.getElementById('repeatMissionStateLabel');
            const repeatOptionsContainer = document.getElementById('repeatOptionsContainer');
            const repeatEndDateInput = document.getElementById('repeatEndDate');
            const missionToScheduleIdInput = document.getElementById('missionToScheduleId');
            const repeatIntervalInput = document.getElementById('repeatInterval');
            const repeatUnitSelect = document.getElementById('repeatUnit');
            const daysToggleContainer = document.getElementById('daysToggleContainer');
            const toggleContainer = document.querySelector('.toggle-container');
            const unscheduleMissionBtn = document.getElementById('unscheduleMissionBtn');

            if (!scheduleMissionModal || !scheduleMissionTitle || !repeatOptionsContainer ||
                !repeatUnitSelect || !daysToggleContainer || !repeatMissionToggle || !repeatMissionStateLabel || !toggleContainer || !unscheduleMissionBtn) {
                console.error("Elementos del modal de programación no encontrados.");
                return;
            }
            
            // Obtener referencias a los campos de hora y duración
            const scheduleTimeInput = document.getElementById('scheduleTime');
            const scheduleDurationInput = document.getElementById('scheduleDuration');
            const scheduleDurationUnitSelect = document.getElementById('scheduleDurationUnit');

            unscheduleMissionBtn.style.display = 'none';
            _currentScheduleDateObj = App.utils.normalizeDateToStartOfDay(new Date());
            repeatMissionToggle.classList.remove('active');
            repeatMissionToggle.setAttribute('aria-checked', 'false');
            toggleContainer.classList.remove('active');
            repeatMissionStateLabel.textContent = 'No repetir';
            repeatOptionsContainer.classList.remove('active');
            repeatEndDateInput.value = '';
            repeatIntervalInput.value = "1";
            repeatUnitSelect.value = 'day';
            daysToggleContainer.classList.add('hidden');
            daysToggleContainer.querySelectorAll('.day-btn').forEach(btn => btn.classList.remove('active'));
            
            // Limpiar campos de hora y duración
            if (scheduleTimeInput) scheduleTimeInput.value = '';
            if (scheduleDurationInput) scheduleDurationInput.value = '';
            if (scheduleDurationUnitSelect) scheduleDurationUnitSelect.value = 'minutes';

            _currentScheduledProgramId = scheduledProgramId;
            missionToScheduleIdInput.value = missionId;

            let scheduledMissionData = null;
            if (scheduledProgramId) {
                scheduledMissionData = App.state.getScheduledMissions().find(sm => sm.id === scheduledProgramId);
            }

            if (scheduledMissionData) {
                scheduleMissionTitle.textContent = `Programación para "${missionToSchedule.name}"`;
                unscheduleMissionBtn.style.display = 'block';
                _currentScheduleDateObj = App.utils.normalizeDateToStartOfDay(scheduledMissionData.scheduledDate);

                // Cargar hora y duración si existen
                if (scheduleTimeInput && scheduledMissionData.scheduleTime) {
                    scheduleTimeInput.value = scheduledMissionData.scheduleTime.time || '';
                }
                if (scheduleDurationInput && scheduledMissionData.scheduleDuration) {
                    scheduleDurationInput.value = scheduledMissionData.scheduleDuration.value || '';
                    if (scheduleDurationUnitSelect) {
                        scheduleDurationUnitSelect.value = scheduledMissionData.scheduleDuration.unit || 'minutes';
                    }
                }

                if (scheduledMissionData.isRecurring) {
                    repeatMissionToggle.classList.add('active');
                    repeatMissionToggle.setAttribute('aria-checked', 'true');
                    toggleContainer.classList.add('active');
                    repeatMissionStateLabel.textContent = 'Repetir misión';
                    repeatOptionsContainer.classList.add('active');
                    repeatIntervalInput.value = scheduledMissionData.repeatInterval || "1";
                    repeatUnitSelect.value = scheduledMissionData.repeatUnit || "day";
                    repeatEndDateInput.value = scheduledMissionData.repeatEndDate || '';

                    if (scheduledMissionData.repeatUnit === 'week' && scheduledMissionData.daysOfWeek) {
                        daysToggleContainer.classList.remove('hidden');
                        scheduledMissionData.daysOfWeek.forEach(day => {
                            const btn = daysToggleContainer.querySelector(`.day-btn[data-day="${day}"]`);
                            if (btn) btn.classList.add('active');
                        });
                    }
                }
            } else {
                scheduleMissionTitle.textContent = `Programar "${missionToSchedule.name}"`;
            }

            _updateScheduleDateDisplay();
            scheduleMissionModal.classList.add('visible');
        },

        closeScheduleMissionModal: function() {
            const scheduleMissionModal = document.getElementById('scheduleMissionModal');
            if (scheduleMissionModal) scheduleMissionModal.classList.remove('visible');

            _currentScheduleDateObj = null;
            missionToSchedule = null;
            _currentScheduledProgramId = null;
        },

        openEditMissionModal: function(missionId, isFromToday = false, todayTaskId = null) {
            const mission = App.state.getMissions().find(m => m.id === missionId);
            if (!mission) {
                App.events.emit('showAlert', 'Misión no encontrada.');
                return;
            }

            document.getElementById('editMissionId').value = mission.id;
            document.getElementById('editMissionName').value = mission.name;
            document.getElementById('editMissionDescription').value = mission.description || '';
            document.getElementById('editMissionDailyReps').value = mission.dailyRepetitions.max;
            document.getElementById('editMissionPoints').value = mission.points;
            
            // ⭐ NUEVO: Cargar hora y duración desde la tarea o desde scheduledMissions
            let scheduleTime = null;
            let scheduleDuration = null;
            
            // Si viene de today, intentar obtener los datos de la tarea
            if (isFromToday && todayTaskId) {
                const task = App.state.getTodayTasks().find(t => t.id === todayTaskId);
                if (task) {
                    scheduleTime = task.scheduleTime;
                    scheduleDuration = task.scheduleDuration;
                }
            }
            
            // Si no se encontró en la tarea, buscar en scheduledMissions
            if (!scheduleTime && !scheduleDuration) {
                const scheduledMission = App.state.getScheduledMissions().find(sm => sm.missionId === missionId);
                if (scheduledMission) {
                    scheduleTime = scheduledMission.scheduleTime;
                    scheduleDuration = scheduledMission.scheduleDuration;
                }
            }
            
            // Cargar los valores en los campos
            const scheduleTimeInput = document.getElementById('editMissionScheduleTime');
            const scheduleDurationInput = document.getElementById('editMissionScheduleDuration');
            const scheduleDurationUnitSelect = document.getElementById('editMissionScheduleDurationUnit');
            
            if (scheduleTimeInput) {
                scheduleTimeInput.value = scheduleTime?.time || '';
            }
            if (scheduleDurationInput && scheduleDurationUnitSelect) {
                scheduleDurationInput.value = scheduleDuration?.value || '';
                scheduleDurationUnitSelect.value = scheduleDuration?.unit || 'minutes';
            }

            const deleteBtn = document.getElementById('deleteMissionBtn');
            
            // Clonar y reemplazar el botón para eliminar listeners anteriores
            const newDeleteBtn = deleteBtn.cloneNode(true);
            deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);

            newDeleteBtn.addEventListener('click', () => {
                if (isFromToday && todayTaskId) {
                    // Si viene de "Hoy", desprograma la tarea y cierra el modal.
                    App.state.unscheduleTaskForToday(todayTaskId);
                    this.closeEditMissionModal();
                } else {
                    // Si viene de "Misiones", usa window.confirm para la confirmación.
                        App.state.deleteMission(missionId);
                        this.closeEditMissionModal();
                    
                }
            });

            const modal = document.getElementById('editMissionModal');
            modal.classList.add('visible');
            modal.setAttribute('aria-hidden', 'false');
        },

        closeEditMissionModal: function() {
            const modal = document.getElementById('editMissionModal');
            modal.classList.remove('visible');
            modal.setAttribute('aria-hidden', 'true');
        },

        initListeners: function() {
            App.events.on('missionsUpdated', () => this.render());
            App.events.on('stateRefreshed', () => this.render());

            const closeScheduleMissionModalBtn = document.getElementById('closeScheduleMissionModal');
            const prevDayBtn = document.getElementById('prevDayBtn');
            const nextDayBtn = document.getElementById('nextDayBtn');
            const repeatMissionToggle = document.getElementById('repeatMissionToggle');
            const repeatMissionStateLabel = document.getElementById('repeatMissionStateLabel');
            const cancelAdvancedScheduleBtn = document.getElementById('cancelAdvancedScheduleBtn');
            const confirmScheduleBtn = document.getElementById('confirmScheduleBtn');
            const unscheduleMissionBtn = document.getElementById('unscheduleMissionBtn');
            const missionToScheduleIdInput = document.getElementById('missionToScheduleId');
            const repeatIntervalInput = document.getElementById('repeatInterval');
            const repeatUnitSelect = document.getElementById('repeatUnit');
            const repeatEndDateInput = document.getElementById('repeatEndDate');
            const daysToggleContainer = document.getElementById('daysToggleContainer');
            const repeatOptionsContainer = document.getElementById('repeatOptionsContainer');
            const toggleContainer = document.querySelector('.toggle-container');
            const dailyRepetitionsMaxInput = document.getElementById('scheduleDailyRepetitionsMax');
            const scheduleTimeInput = document.getElementById('scheduleTime');
            const scheduleDurationInput = document.getElementById('scheduleDuration');
            const scheduleDurationUnitSelect = document.getElementById('scheduleDurationUnit');

            if (closeScheduleMissionModalBtn) closeScheduleMissionModalBtn.addEventListener('click', App.ui.missions.closeScheduleMissionModal);
            if (cancelAdvancedScheduleBtn) cancelAdvancedScheduleBtn.addEventListener('click', App.ui.missions.closeScheduleMissionModal);

            function getClosestScheduledDay(fromDate, direction, selectedDays) {
                let testDate = new Date(fromDate);
                for (let i = 1; i <= 7; i++) {
                    testDate = App.utils.addDateUnit(testDate, direction, 'day');
                    const testDay = testDate.getDay();
                    if (selectedDays.includes(testDay)) {
                        return testDate;
                    }
                }
                return fromDate;
            }

            function updateScheduledDateFromDaysToggle(selectedDays) {
                const today = App.utils.normalizeDateToStartOfDay(new Date());
                const todayDay = today.getDay();
                let newDate = today;

                if (selectedDays.length > 0) {
                    let minDaysToAdd = Infinity;
                    selectedDays.forEach(targetDay => {
                        let daysToAdd = (targetDay - todayDay + 7) % 7;
                        if (daysToAdd < minDaysToAdd) {
                            minDaysToAdd = daysToAdd;
                        }
                    });
                    if (minDaysToAdd !== Infinity) {
                        newDate = App.utils.addDateUnit(today, minDaysToAdd, 'day');
                    }
                } else {
                    newDate = today;
                }
                _currentScheduleDateObj = newDate;
                _updateScheduleDateDisplay();
            }

            if (prevDayBtn) prevDayBtn.addEventListener('click', () => {
                if (_currentScheduleDateObj) {
                    const isRecurring = repeatMissionToggle.classList.contains('active');
                    const isWeekly = repeatUnitSelect.value === 'week';
                    let selectedDays = Array.from(document.querySelectorAll('#daysToggleContainer .day-btn.active'))
                        .map(btn => parseInt(btn.dataset.day, 10));

                    if (isRecurring && isWeekly && selectedDays.length > 0) {
                        _currentScheduleDateObj = getClosestScheduledDay(_currentScheduleDateObj, -1, selectedDays);
                    } else {
                        _currentScheduleDateObj = App.utils.addDateUnit(_currentScheduleDateObj, -1, 'day');
                    }
                    _updateScheduleDateDisplay();
                }
            });

            if (nextDayBtn) nextDayBtn.addEventListener('click', () => {
                if (_currentScheduleDateObj) {
                    const isRecurring = repeatMissionToggle.classList.contains('active');
                    const isWeekly = repeatUnitSelect.value === 'week';
                    let selectedDays = Array.from(document.querySelectorAll('#daysToggleContainer .day-btn.active'))
                        .map(btn => parseInt(btn.dataset.day, 10));

                    if (isRecurring && isWeekly && selectedDays.length > 0) {
                        _currentScheduleDateObj = getClosestScheduledDay(_currentScheduleDateObj, 1, selectedDays);
                    } else {
                        _currentScheduleDateObj = App.utils.addDateUnit(_currentScheduleDateObj, 1, 'day');
                    }
                    _updateScheduleDateDisplay();
                }
            });

            if (repeatUnitSelect) repeatUnitSelect.addEventListener('change', () => {
                const isWeekly = repeatUnitSelect.value === 'week';
                const isRecurring = repeatMissionToggle.classList.contains('active');

                if (daysToggleContainer) {
                    daysToggleContainer.classList.toggle('hidden', !isWeekly);
                }

                if (isRecurring && isWeekly) {
                    const activeDayButtons = daysToggleContainer.querySelectorAll('.day-btn.active');
                    const selectedDays = Array.from(activeDayButtons).map(btn => parseInt(btn.dataset.day, 10));
                    updateScheduledDateFromDaysToggle(selectedDays);
                }
            });

            const handleToggleActivation = () => {
                const isChecked = repeatMissionToggle.classList.toggle('active');
                repeatMissionToggle.setAttribute('aria-checked', isChecked.toString());
                toggleContainer.classList.toggle('active', isChecked);
                repeatMissionStateLabel.textContent = isChecked ? 'Repetir misión' : 'No repetir';

                if (repeatOptionsContainer) {
                    repeatOptionsContainer.classList.toggle('active', isChecked);
                }
                if (!isChecked) {
                    repeatEndDateInput.value = '';
                    if (daysToggleContainer) daysToggleContainer.classList.add('hidden');
                } else {
                    if (repeatUnitSelect.value === 'week' && daysToggleContainer) {
                        daysToggleContainer.classList.remove('hidden');
                        const activeDayButtons = daysToggleContainer.querySelectorAll('.day-btn.active');
                        const selectedDays = Array.from(activeDayButtons).map(btn => parseInt(btn.dataset.day, 10));
                        updateScheduledDateFromDaysToggle(selectedDays);
                    }
                }
            };

            if (toggleContainer) {
                toggleContainer.addEventListener('click', handleToggleActivation);
                toggleContainer.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleToggleActivation();
                    }
                });
            }

            if (daysToggleContainer) {
                daysToggleContainer.addEventListener('click', (e) => {
                    if (e.target.classList.contains('day-btn')) {
                        e.target.classList.toggle('active');
                        const activeDayButtons = daysToggleContainer.querySelectorAll('.day-btn.active');
                        const selectedDays = Array.from(activeDayButtons).map(btn => parseInt(btn.dataset.day, 10));
                        updateScheduledDateFromDaysToggle(selectedDays);
                    }
                });
            }

            if (unscheduleMissionBtn) {
                unscheduleMissionBtn.addEventListener('click', () => {
                    App.state.deleteScheduledMission(_currentScheduledProgramId);
                    App.ui.missions.closeScheduleMissionModal();

                });
            }

            if (confirmScheduleBtn) confirmScheduleBtn.addEventListener('click', () => {
                const missionId = missionToScheduleIdInput.value;
                const date = _currentScheduleDateObj ? App.utils.getFormattedDate(_currentScheduleDateObj) : '';
                const isRecurring = repeatMissionToggle.classList.contains('active');

                let repeatOptions = null;

                if (isRecurring) {
                    const unit = repeatUnitSelect.value;
                    repeatOptions = {
                        interval: repeatIntervalInput.value || "1",
                        unit: unit,
                        endDate: repeatEndDateInput.value || null
                    };

                    if (unit === 'week') {
                        const selectedDays = Array.from(document.querySelectorAll('#daysToggleContainer .day-btn.active'))
                            .map(btn => btn.dataset.day);

                        if (selectedDays.length === 0) {
                            App.ui.events.showCustomAlert("Por favor, selecciona al menos un día de la semana para la repetición semanal.");
                            return;
                        }
                        repeatOptions.daysOfWeek = selectedDays;
                    }
                }

                // Capturar hora y duración (opcionales)
                let scheduleTime = null;
                let scheduleDuration = null;
                
                if (scheduleTimeInput && scheduleTimeInput.value) {
                    scheduleTime = {
                        time: scheduleTimeInput.value
                    };
                }
                
                if (scheduleDurationInput && scheduleDurationInput.value) {
                    scheduleDuration = {
                        value: parseInt(scheduleDurationInput.value, 10),
                        unit: scheduleDurationUnitSelect ? scheduleDurationUnitSelect.value : 'minutes'
                    };
                }

                if (missionId && date) {
                    if (_currentScheduledProgramId) {
                        App.state.deleteScheduledMission(_currentScheduledProgramId);
                    }
                    App.state.scheduleMission(missionId, date, isRecurring, repeatOptions, scheduleTime, scheduleDuration);
                    App.ui.missions.closeScheduleMissionModal();

                } else {
                    App.ui.events.showCustomAlert("Asegúrate de que la misión y la fecha estén seleccionadas.");
                }
            });

            _initEditMissionModalListeners();
        }
    };

})(window.App = window.App || {});
