// ui-events.js
// Maneja los eventos de la interfaz de usuario (clics, envíos de formularios, modales).
(function(App) {
    let missionToSchedule = null; // Variable UI-específica para la misión seleccionada en el modal
    let _currentScheduleDateObj = null; // Variable para manejar el objeto Date de la misión a programar
    let _currentScheduledProgramId = null; // Para almacenar el ID de la programación existente si estamos editando

    /**
     * @description Función auxiliar genérica para configurar y mostrar modales personalizados.
     * @param {string} modalId El ID del elemento del modal (e.g., 'customAlertDialog').
     * @param {string} messageElementId El ID del elemento donde se muestra el mensaje del modal.
     * @param {Array<Object>} buttonConfigs Un array de objetos con configuraciones de botón:
     * - {string} id: El ID del botón.
     * - {boolean} [isConfirmAction]: Si es un botón de confirmación (true para 'Sí', false para 'No').
     * @param {string} message El mensaje a mostrar en el modal.
     * @param {function(boolean):void} [callback] La función a ejecutar con el resultado (true/false) para confirmaciones, o sin argumentos para alertas.
     * @returns {boolean} True si el modal se mostró correctamente, false si faltaron elementos y se usó la función nativa.
     */
    function _setupCustomModal(modalId, messageElementId, buttonConfigs, message, callback) {
        const modal = document.getElementById(modalId);
        const msgElement = document.getElementById(messageElementId);
        const buttons = buttonConfigs.map(config => ({
            element: document.getElementById(config.id),
            isConfirmAction: config.isConfirmAction
        }));

        const allElementsFound = [modal, msgElement, ...buttons.map(btn => btn.element)].every(el => el);

        if (!allElementsFound) {
            console.error(`Error: Uno o más elementos para el modal '${modalId}' no se encontraron. Cayendo a la función nativa.`);
            if (modalId === 'customAlertDialog') {
                App.ui.events.showCustomAlert("Alerta: " + message);
            } else {
                App.ui.events.showCustomConfirm("Confirmación: " + message, callback);
            }
            return false;
        }

        msgElement.textContent = message;
        modal.classList.add('visible');

        const closeHandler = (result) => {
            modal.classList.remove('visible');
            buttons.forEach(btn => {
                if (btn.element) btn.element.removeEventListener('click', btn.listener);
            });
            if (callback) callback(result);
        };

        buttons.forEach(btn => {
            const listener = () => {
                const result = (btn.isConfirmAction !== undefined) ? btn.isConfirmAction : undefined;
                closeHandler(result);
            };
            btn.listener = listener;
            btn.element.addEventListener('click', listener);
        });
        return true;
    }

    App.ui.events = {
        /**
         * @description Muestra un modal de alerta personalizado.
         * @param {string} message El mensaje a mostrar.
         */
        showCustomAlert: function(message) {
            _setupCustomModal(
                'customAlertDialog',
                'customAlertMessage',
                [
                    { id: 'customAlertCloseBtn' },
                    { id: 'closeAlertDialog' }
                ],
                message
            );
        },

        /**
         * @description Muestra un modal de confirmación personalizado.
         * @param {string} message El mensaje a mostrar.
         * @param {function(boolean):void} callback La función a ejecutar con el resultado de la confirmación (true/false).
         */
        showCustomConfirm: function(message, callback) {
            _setupCustomModal(
                'customConfirmDialog',
                'customConfirmMessage',
                [
                    { id: 'customConfirmYesBtn', isConfirmAction: true },
                    { id: 'customConfirmNoBtn', isConfirmAction: false },
                    { id: 'closeConfirmDialog', isConfirmAction: false }
                ],
                message,
                callback
            );
        },

        /**
         * @description Actualiza el display de la fecha en el modal de programación y el estado de los botones de navegación.
         */
        _updateScheduleDateDisplay: function() {
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
        },

        /**
         * @description Abre el modal para programar o editar una misión.
         * @param {string} missionId El ID de la misión original a programar/editar.
         * @param {string|null} [scheduledProgramId=null] El ID de la programación existente a editar. Si es null, se crea una nueva.
         */
        openScheduleMissionModal: function(missionId, scheduledProgramId = null) {
            missionToSchedule = App.state.getMissions().find(m => m.id === missionId);
            if (!missionToSchedule) {
                App.ui.events.showCustomAlert("La misión que intentas programar no fue encontrada.");
                return;
            }

            const scheduleMissionModal = document.getElementById('scheduleMissionModal');
            const scheduleMissionTitle = document.getElementById('scheduleMissionTitle');
            const repeatMissionToggle = document.getElementById('repeatMissionToggle');
            const repeatMissionStateLabel = document.getElementById('repeatMissionStateLabel');
            const repeatOptionsContainer = document.getElementById('repeatOptionsContainer');
            const repeatEndDateInput = document.getElementById('repeatEndDate');
            const missionToScheduleIdInput = document.getElementById('missionToScheduleId');
            const repeatIntervalInput = document.getElementById('repeatInterval');
            const repeatUnitSelect = document.getElementById('repeatUnit');
            const daysToggleContainer = document.getElementById('daysToggleContainer');
            const toggleContainer = document.querySelector('.toggle-container');
            // ⭐ Nuevo elemento para el input de repeticiones máximas diarias en el modal de programación
            const dailyRepetitionsMaxInput = document.getElementById('scheduleDailyRepetitionsMax');


            if (!scheduleMissionModal || !scheduleMissionTitle || !repeatOptionsContainer ||
                !repeatUnitSelect || !daysToggleContainer || !repeatMissionToggle || !repeatMissionStateLabel || !toggleContainer || !dailyRepetitionsMaxInput) {
                App.ui.events.showCustomAlert("Error al abrir el programador de misión. Elementos de la interfaz no encontrados.");
                console.error("Missing elements for schedule mission modal.");
                return;
            }

            // Reiniciar estado del modal
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
            dailyRepetitionsMaxInput.value = "1"; // ⭐ Default a 1 para nuevas programaciones

            _currentScheduledProgramId = scheduledProgramId;
            missionToScheduleIdInput.value = missionId;

            let scheduledMissionData = null;
            if (scheduledProgramId) {
                scheduledMissionData = App.state.getScheduledMissions().find(sm => sm.id === scheduledProgramId);
            }

            if (scheduledMissionData) {
                // Modo EDICIÓN: Rellenar con datos existentes
                scheduleMissionTitle.textContent = `Editar Programación para "${missionToSchedule.name}"`;
                _currentScheduleDateObj = App.utils.normalizeDateToStartOfDay(scheduledMissionData.scheduledDate);
                dailyRepetitionsMaxInput.value = scheduledMissionData.dailyRepetitions.max || "1"; // ⭐ Rellenar con el valor existente

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
                // Modo NUEVA PROGRAMACIÓN
                scheduleMissionTitle.textContent = `Programar "${missionToSchedule.name}"`;
            }

            App.ui.events._updateScheduleDateDisplay();
            scheduleMissionModal.classList.add('visible');
        },

        /**
         * @description Cierra el modal de programación de misiones y resetea su estado.
         */
        closeScheduleMissionModal: function() {
            const scheduleMissionModal = document.getElementById('scheduleMissionModal');
            if (scheduleMissionModal) scheduleMissionModal.classList.remove('visible');

            _currentScheduleDateObj = null;
            missionToSchedule = null;
            _currentScheduledProgramId = null;
        },

        /**
         * @description Muestra el modal de confirmación con las opciones de reinicio.
         */
        showResetOptionsModal: function() {
            const statsModal = document.getElementById('statsModal');
            const resetConfirmModal = document.getElementById('resetConfirmModal');

            if (statsModal) statsModal.classList.remove('visible');
            if (resetConfirmModal) resetConfirmModal.classList.add('visible');
            else {
                console.error("Modal de reinicio (#resetConfirmModal) no encontrado.");
                App.ui.events.showCustomAlert("Error: No se pudo abrir el modal de opciones de reinicio.");
            }
        },

        /**
         * @description Cierra el modal de confirmación de reinicio.
         */
        closeResetConfirmModal: function() {
            const resetConfirmModal = document.getElementById('resetConfirmModal');
            if (resetConfirmModal) resetConfirmModal.classList.remove('visible');
        },

        // --- Inicialización de Event Listeners ---
        /**
         * @description Inicializa los listeners para la navegación principal (tabs, botones globales).
         */
        _initGlobalNavListeners: function() {
            document.querySelectorAll('nav.tabs button').forEach(btn => {
                btn.addEventListener('click', () => {
                    const tabId = btn.getAttribute('aria-controls');
                    if (tabId && App.ui.render.general && typeof App.ui.render.general.switchTab === 'function') {
                        App.ui.render.general.switchTab(tabId);
                    } else if (tabId) {
                        console.error(`Error: App.ui.render.general.switchTab no está disponible para cambiar a la pestaña ${tabId}.`);
                    }
                });
            });

            const totalPointsBtn = document.getElementById('totalPointsBtn');
            const closeStatsModalBtn = document.getElementById('closeStatsModal');
            const openResetOptionsBtn = document.getElementById('openResetOptionsBtn');
            const closeResetConfirmModalBtn = document.getElementById('closeResetConfirmModal');

            if (totalPointsBtn) totalPointsBtn.addEventListener('click', () => {
                if (App.ui.render.general && typeof App.ui.render.general.renderStatsToday === 'function') {
                    App.ui.render.general.renderStatsToday();
                } else {
                    console.warn("App.ui.render.general.renderStatsToday no está disponible.");
                }
                document.getElementById('statsModal')?.classList.add('visible');
            });
            if (closeStatsModalBtn) closeStatsModalBtn.addEventListener('click', () => {
                document.getElementById('statsModal')?.classList.remove('visible');
            });

            if (openResetOptionsBtn) openResetOptionsBtn.addEventListener('click', App.ui.events.showResetOptionsModal);
            if (closeResetConfirmModalBtn) closeResetConfirmModalBtn.addEventListener('click', App.ui.events.closeResetConfirmModal);

            const toggleScheduledBtn = document.getElementById('toggleScheduledMissionsBtn');
            if (toggleScheduledBtn) {
                toggleScheduledBtn.addEventListener('click', () => {
                    const scheduledList = document.getElementById('scheduledMissionsList');
                    const isExpanded = toggleScheduledBtn.getAttribute('aria-expanded') === 'true';

                    toggleScheduledBtn.setAttribute('aria-expanded', !isExpanded);
                    if (!isExpanded) {
                        scheduledList.style.display = 'block';
                    } else {
                        scheduledList.style.display = 'none';
                    }
                });
            }
        },

        /**
         * @description Inicializa los listeners para los formularios de añadir (tarea, categoría, tienda).
         */
        _initFormListeners: function() {
            const showQuickAddFab = document.getElementById('showQuickAddFab');
            const quickAddForm = document.getElementById('quickAddForm');
            const quickAddNameInput = document.getElementById('quickAddNameInput');
            const quickAddPointsInput = document.getElementById('quickAddPointsInput');

            const showAddCategoryBtn = document.getElementById('showAddCategoryBtn');
            const addCategoryForm = document.getElementById('addCategoryForm');
            const categoryInput = document.getElementById('categoryInput');

            const showAddShopItemBtn = document.getElementById('showAddShopItemBtn');
            const addShopItemForm = document.getElementById('addShopItemForm');
            const shopItemName = document.getElementById('shopItemName');
            const shopItemCost = document.getElementById('shopItemCost');

            const toggleFormVisibility = (containerId, inputToFocus) => {
                const container = document.getElementById(containerId);
                if (!container) return;
                const isVisible = container.classList.contains('active');
                document.querySelectorAll('.form-container.active').forEach(f => f.classList.remove('active'));
                container.classList.toggle('active', !isVisible);
                if (containerId === 'quickAddFormContainer' && showQuickAddFab) {
                    showQuickAddFab.textContent = isVisible ? '➕' : '➖';
                }
                if (!isVisible && inputToFocus) inputToFocus.focus();
            };

            if (showQuickAddFab) showQuickAddFab.addEventListener('click', () => {
                toggleFormVisibility('quickAddFormContainer', quickAddNameInput);
            });

            if (quickAddForm) quickAddForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = quickAddNameInput.value.trim();
                const points = parseInt(quickAddPointsInput.value.trim(), 10);
                if (name && !isNaN(points)) {
                    // ⭐ Pasa dailyRepetitions.max a 1 para tareas rápidas
                    App.state.addTodayTask({ id: App.utils.genId("task"), name, points, missionId: null, completed: false });
                    quickAddForm.reset();
                } else {
                    App.ui.events.showCustomAlert("Por favor, introduce un nombre y puntos válidos.");
                }
            });

            if (showAddCategoryBtn) showAddCategoryBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFormVisibility('addCategoryFormContainer', categoryInput);
            });

            if (addCategoryForm) addCategoryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = categoryInput.value.trim();
                if (name) {
                    App.state.addCategory(name);
                    addCategoryForm.reset();
                } else {
                    App.ui.events.showCustomAlert("El nombre de la categoría no puede estar vacío.");
                }
            });

            if (showAddShopItemBtn) showAddShopItemBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFormVisibility('addShopItemFormContainer', shopItemName);
            });

            if (addShopItemForm) addShopItemForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = shopItemName.value.trim();
                const cost = parseInt(shopItemCost.value.trim(), 10);
                if (name && !isNaN(cost) && cost > 0) {
                    App.state.addShopItem(name, cost);
                    addShopItemForm.reset();
                } else {
                    App.ui.events.showCustomAlert("Por favor, introduce un nombre y un costo válido.");
                }
            });
        },

        /**
         * @description Inicializa los listeners para el modal de programación de misiones.
         */
        _initScheduleModalListeners: function() {
            const closeScheduleMissionModalBtn = document.getElementById('closeScheduleMissionModal');
            const prevDayBtn = document.getElementById('prevDayBtn');
            const nextDayBtn = document.getElementById('nextDayBtn');
            const repeatMissionToggle = document.getElementById('repeatMissionToggle');
            const repeatMissionStateLabel = document.getElementById('repeatMissionStateLabel');
            const cancelAdvancedScheduleBtn = document.getElementById('cancelAdvancedScheduleBtn');
            const confirmScheduleBtn = document.getElementById('confirmScheduleBtn');
            const missionToScheduleIdInput = document.getElementById('missionToScheduleId');
            const repeatIntervalInput = document.getElementById('repeatInterval');
            const repeatUnitSelect = document.getElementById('repeatUnit');
            const repeatEndDateInput = document.getElementById('repeatEndDate');
            const daysToggleContainer = document.getElementById('daysToggleContainer');
            const repeatOptionsContainer = document.getElementById('repeatOptionsContainer');
            const toggleContainer = document.querySelector('.toggle-container');
            const dailyRepetitionsMaxInput = document.getElementById('scheduleDailyRepetitionsMax'); // ⭐ Nuevo input


            if (closeScheduleMissionModalBtn) closeScheduleMissionModalBtn.addEventListener('click', App.ui.events.closeScheduleMissionModal);
            if (cancelAdvancedScheduleBtn) cancelAdvancedScheduleBtn.addEventListener('click', App.ui.events.closeScheduleMissionModal);

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
                App.ui.events._updateScheduleDateDisplay();
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
                    App.ui.events._updateScheduleDateDisplay();
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
                    App.ui.events._updateScheduleDateDisplay();
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

            if (confirmScheduleBtn) confirmScheduleBtn.addEventListener('click', () => {
                const missionId = missionToScheduleIdInput.value;
                const date = _currentScheduleDateObj ? App.utils.getFormattedDate(_currentScheduleDateObj) : '';
                const isRecurring = repeatMissionToggle.classList.contains('active');
                const dailyRepetitionsMax = parseInt(dailyRepetitionsMaxInput.value, 10); // ⭐ Obtener el valor del input

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
                    // ⭐ Pasa dailyRepetitionsMax a saveScheduledMission
                    App.state.saveScheduledMission(_currentScheduledProgramId, missionId, date, isRecurring, repeatOptions, dailyRepetitionsMax);
                } else {
                    App.ui.events.showCustomAlert("Asegúrate de que la misión y la fecha estén seleccionadas.");
                }
            });
        },

        /**
         * @description Inicializa los listeners para los botones de reinicio.
         */
        _initResetListeners: function() {
            const resetHistoryBtn = document.getElementById('resetHistoryBtn');
            const resetAppBtn = document.getElementById('resetAppBtn');

            if (resetHistoryBtn) resetHistoryBtn.addEventListener('click', () => {
                App.ui.events.closeResetConfirmModal();
                App.ui.events.showCustomConfirm('¿Seguro que quieres borrar SÓLO el historial? Tus misiones y tienda permanecerán. Esta acción es irreversible.', (confirmed) => {
                    if (confirmed) {
                        App.state.resetHistoryOnly();
                        App.ui.events.showCustomAlert('El historial ha sido reiniciado.');
                        if (App.ui.render.general && typeof App.ui.render.general.switchTab === 'function') {
                            App.ui.render.general.switchTab('tab-today');
                        } else {
                            console.warn("App.ui.render.general.switchTab no está disponible después del reinicio de historial.");
                        }
                    }
                });
            });

            if (resetAppBtn) resetAppBtn.addEventListener('click', () => {
                App.ui.events.closeResetConfirmModal();
                App.ui.events.showCustomConfirm('¡ADVERTENCIA! Estás a punto de ELIMINAR TODOS tus datos. ¿Estás absolutamente seguro?', (firstConfirm) => {
                    if (firstConfirm) {
                        App.ui.events.showCustomConfirm('¡ÚLTIMA ADVERTENCIA! Si continúas, PERDERÁS TODO. ¿Estás 100% seguro?', (secondConfirm) => {
                            if (secondConfirm) {
                                App.state.resetAllData();
                                App.ui.events.showCustomAlert('La aplicación ha sido reiniciada.');
                                if (App.ui.render.general && typeof App.ui.render.general.switchTab === 'function') {
                                    App.ui.render.general.switchTab('tab-today');
                                } else {
                                    console.warn("App.ui.render.general.switchTab no está disponible después del reinicio completo.");
                                }
                            }
                        });
                    }
                });
            });
        },

        /**
         * @description Inicializa todos los event listeners de la interfaz de usuario.
         */
        initEventListeners: function() {
            this._initGlobalNavListeners();
            this._initFormListeners();
            this._initScheduleModalListeners();
            this._initResetListeners();

            document.addEventListener('click', (e) => {
                if (e.target && !e.target.closest('.show-delete') && !e.target.classList.contains('delete-btn')) {
                    document.querySelectorAll('.show-delete').forEach(el => el.classList.remove('show-delete'));
                }
            });
        }
    };
})(window.App = window.App || {});
