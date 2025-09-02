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
            App.state.updateMission(missionId, updatedMission);
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
                container.innerHTML = `<p style="text-align:center; color:var(--ff-text-dark);">No hay categorías. Agrega una nueva para empezar.</p>`;
                return;
            }

            categories.forEach(cat => {
                const categoryWrapper = document.createElement("div");
                categoryWrapper.className = "category-wrapper";

                const catHeader = document.createElement("div");
                const isExpanded = expandedCategoryIds.has(cat.id);
                catHeader.className = `cat-header collapsible ${isExpanded ? '' : 'collapsed'}`.trim();
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

                    if (App.state.getCategories().some(c => c.id === draggedId)) {
                        if (draggedId !== targetId) {
                            App.state.reorderCategory(draggedId, targetId);
                        }
                    } else { 
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

                let pressTimer = null;
                let longPressTriggered = false;
                let startX, startY;
                const moveThreshold = 10; // pixels

                const cancelLongPress = () => {
                    clearTimeout(pressTimer);
                    pressTimer = null;
                };

                const handlePressStart = (e) => {
                    if (e.target.closest('button')) return;

                    longPressTriggered = false;
                    if (e.type === 'touchstart') {
                        startX = e.touches[0].clientX;
                        startY = e.touches[0].clientY;
                    }

                    pressTimer = window.setTimeout(() => {
                        longPressTriggered = true;
                        if (navigator.vibrate) navigator.vibrate(50);
                        App.state.deleteCategory(cat.id);
                        pressTimer = null;
                    }, 800);
                };

                const handlePressMove = (e) => {
                    if (!pressTimer) return;

                    if (e.type === 'touchmove') {
                        const moveX = Math.abs(e.touches[0].clientX - startX);
                        const moveY = Math.abs(e.touches[0].clientY - startY);
                        if (moveX > moveThreshold || moveY > moveThreshold) {
                            cancelLongPress();
                        }
                    }
                };

                const handlePressEnd = (e) => {
                    cancelLongPress();
                    if (longPressTriggered) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                };

                catHeader.addEventListener('mousedown', handlePressStart);
                catHeader.addEventListener('mouseup', handlePressEnd);
                catHeader.addEventListener('mouseleave', cancelLongPress);

                catHeader.addEventListener('touchstart', handlePressStart, { passive: true });
                catHeader.addEventListener('touchend', handlePressEnd);
                catHeader.addEventListener('touchcancel', cancelLongPress);
                catHeader.addEventListener('touchmove', handlePressMove, { passive: true });

                catHeader.addEventListener('click', (e) => {
                    if (longPressTriggered) {
                        e.stopImmediatePropagation();
                        return;
                    }
                    if (!e.target.closest('button')) {
                        catHeader.classList.toggle('collapsed');
                    }
                }, true);

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

                missionListContainer.addEventListener('dragover', (e) => e.preventDefault());
                missionListContainer.addEventListener('drop', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                        const draggedData = JSON.parse(e.dataTransfer.getData('text/plain'));
                        const draggedMissionId = draggedData.missionId;
                        const draggedFromCategoryId = draggedData.categoryId;
                        const targetCategoryId = cat.id;

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
                        missionCard.className = 'mission-card';
                        missionCard.dataset.missionId = mission.id;
                        missionCard.draggable = true;
                        missionCard.setAttribute('aria-grabbed', 'false');

                        const isMissionScheduled = App.state.getScheduledMissionByOriginalMissionId(mission.id);
                        if (isMissionScheduled) {
                            missionCard.classList.add('is-scheduled-in-book');
                            missionCard.dataset.scheduledMissionProgramId = isMissionScheduled.id;
                        }

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
                                const targetMissionId = mission.id;
                                const targetCategoryId = cat.id;

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
                    <input type="number" name="missionPoints" placeholder="Puntos por repetición" required />
                    <button type="submit" class="primary">➕</button>`;
                form.onsubmit = (e) => {
                    e.preventDefault();
                    const nameInput = form.querySelector("input[name='missionName']");
                    const pointsInput = form.querySelector("input[name='missionPoints']");

                    const name = nameInput ? nameInput.value.trim() : '';
                    const points = pointsInput ? parseInt(pointsInput.value.trim(), 10) : NaN;

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

            _currentScheduledProgramId = scheduledProgramId;
            missionToScheduleIdInput.value = missionId;

            let scheduledMissionData = null;
            if (scheduledProgramId) {
                scheduledMissionData = App.state.getScheduledMissions().find(sm => sm.id === scheduledProgramId);
            }

            if (scheduledMissionData) {
                scheduleMissionTitle.textContent = `Editar Programación para "${missionToSchedule.name}"`;
                unscheduleMissionBtn.style.display = 'block';
                _currentScheduleDateObj = App.utils.normalizeDateToStartOfDay(scheduledMissionData.scheduledDate);

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

                if (missionId && date) {
                    if (_currentScheduledProgramId) {
                        App.state.deleteScheduledMission(_currentScheduledProgramId);
                    }
                    App.state.scheduleMission(missionId, date, isRecurring, repeatOptions);
                    App.ui.missions.closeScheduleMissionModal();

                } else {
                    App.ui.events.showCustomAlert("Asegúrate de que la misión y la fecha estén seleccionadas.");
                }
            });

            _initEditMissionModalListeners();
        }
    };

})(window.App = window.App || {});
