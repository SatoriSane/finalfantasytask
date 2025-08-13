// ui-events.js
// Maneja los eventos de la interfaz de usuario (clics, envíos de formularios, modales).
(function(App) {
    let missionToSchedule = null; // Variable UI-específica para la misión seleccionada en el modal
    let _currentScheduleDateObj = null; // NUEVA variable para manejar el objeto Date de la misión a programar

    App.ui.events = {
        /**
         * @description Muestra un modal de alerta personalizado.
         * @param {string} message El mensaje a mostrar.
         */
        showCustomAlert: function(message) {
            const modal = document.getElementById('customAlertDialog');
            const msgElement = document.getElementById('customAlertMessage');
            const closeBtn = document.getElementById('customAlertCloseBtn');
            const manualCloseBtn = document.getElementById('closeAlertDialog'); // También el botón X

            if (!modal || !msgElement || !closeBtn || !manualCloseBtn) {
                console.error("No se pudo encontrar uno o más elementos del modal de alerta personalizado. Cayendo a alert() del navegador.");
                alert("Alerta: " + message);
                return;
            }

            msgElement.textContent = message;
            modal.classList.add('visible');

            const closeHandler = () => {
                modal.classList.remove('visible');
                closeBtn.removeEventListener('click', closeHandler);
                manualCloseBtn.removeEventListener('click', closeHandler); // Asegurarse de remover este también
            };
            closeBtn.addEventListener('click', closeHandler);
            manualCloseBtn.addEventListener('click', closeHandler);
        },

        /**
         * @description Muestra un modal de confirmación personalizado.
         * @param {string} message El mensaje a mostrar.
         * @param {function(boolean):void} callback La función a ejecutar con el resultado de la confirmación (true/false).
         */
        showCustomConfirm: function(message, callback) {
            const modal = document.getElementById('customConfirmDialog');
            const msgElement = document.getElementById('customConfirmMessage');
            const yesBtn = document.getElementById('customConfirmYesBtn');
            const noBtn = document.getElementById('customConfirmNoBtn');
            const manualCloseBtn = document.getElementById('closeConfirmDialog'); // Botón X del confirm

            if (!modal || !msgElement || !yesBtn || !noBtn || !manualCloseBtn) {
                console.error("No se pudo encontrar uno o más elementos del modal de confirmación personalizado. Cayendo a confirm() del navegador.");
                const confirmed = confirm("Confirmación: " + message);
                callback(confirmed);
                return;
            }

            msgElement.textContent = message;
            modal.classList.add('visible');

            const confirmHandler = (result) => {
                modal.classList.remove('visible');
                yesBtn.removeEventListener('click', yesHandler);
                noBtn.removeEventListener('click', noHandler);
                manualCloseBtn.removeEventListener('click', noHandler); // El botón X también actúa como 'no'
                callback(result);
            };

            const yesHandler = () => confirmHandler(true);
            const noHandler = () => confirmHandler(false);

            yesBtn.addEventListener('click', yesHandler);
            noBtn.addEventListener('click', noHandler);
            manualCloseBtn.addEventListener('click', noHandler);
        },

        /**
         * @description Actualiza el display de la fecha en el modal de programación y el estado de los botones de navegación.
         */
        _updateScheduleDateDisplay: function() {
            const scheduleDateDisplay = document.getElementById('scheduleDateDisplay');
            const prevDayBtn = document.getElementById('prevDayBtn');
            const nextDayBtn = document.getElementById('nextDayBtn');
            const repeatEndDateInput = document.getElementById('repeatEndDate'); // Necesitamos este para el 'min'

            if (!scheduleDateDisplay || !prevDayBtn || !nextDayBtn || !repeatEndDateInput || !_currentScheduleDateObj) {
                console.error("_updateScheduleDateDisplay: Elementos o fecha actual no encontrados.");
                return;
            }

            const todayNormalized = App.utils.normalizeDateToStartOfDay(new Date());
            const currentNormalized = App.utils.normalizeDateToStartOfDay(_currentScheduleDateObj);

            if (!currentNormalized || !todayNormalized) {
                scheduleDateDisplay.innerHTML = "Fecha inválida"; // Usamos innerHTML para permitir <br>
                prevDayBtn.disabled = true;
                nextDayBtn.disabled = true;
                return;
            }

            // Formato principal de la fecha: "día_abreviado. DD/MM/AAAA"
            let mainDateString = _currentScheduleDateObj.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).replace('.', '').replace(',', '');
            let relativeDateText = ''; // Para contener "(Hoy)" o "(Mañana)"

            const tomorrowNormalized = App.utils.addDateUnit(todayNormalized, 1, 'day');
            
            // Determinar si es "Hoy" o "Mañana" y establecer el texto relativo
            if (currentNormalized.getTime() === todayNormalized.getTime()) {
                relativeDateText = '(Hoy)';
                prevDayBtn.disabled = true; // No permitir ir antes de hoy
            } else if (currentNormalized.getTime() === tomorrowNormalized.getTime()) {
                relativeDateText = '(Mañana)';
                prevDayBtn.disabled = false;
            } else {
                prevDayBtn.disabled = false;
            }

            // Construir el HTML final para el display
            let finalDisplayHtml = mainDateString;
            if (relativeDateText) {
                // Añadir un salto de línea y el texto relativo en <small> para un tamaño menor
                finalDisplayHtml += `<br><small>${relativeDateText}</small>`;
            }
            
            scheduleDateDisplay.innerHTML = finalDisplayHtml; // Actualizar con el HTML generado

            // Actualizar la fecha mínima del input de fin de repetición
            repeatEndDateInput.min = App.utils.getFormattedDate(_currentScheduleDateObj);
        }
,

        /**
         * @description Abre el modal para programar una misión.
         * @param {string} missionId El ID de la misión a programar.
         */
        openScheduleMissionModal: function(missionId) {
            missionToSchedule = App.state.getMissions().find(m => m.id === missionId);
            if (!missionToSchedule) {
                console.warn(`openScheduleMissionModal: Misión con ID ${missionId} no encontrada.`);
                App.ui.events.showCustomAlert("La misión que intentas programar no fue encontrada.");
                return;
            }

            const scheduleMissionModal = document.getElementById('scheduleMissionModal');
            const scheduleMissionTitle = document.getElementById('scheduleMissionTitle');
            const repeatMissionCheckbox = document.getElementById('repeatMissionCheckbox');
            const repeatOptionsContainer = document.getElementById('repeatOptionsContainer');
            const repeatEndDateInput = document.getElementById('repeatEndDate');
            const missionToScheduleIdInput = document.getElementById('missionToScheduleId');
            const repeatIntervalInput = document.getElementById('repeatInterval');
            const repeatUnitSelect = document.getElementById('repeatUnit');

            if (!scheduleMissionModal || !scheduleMissionTitle || !repeatMissionCheckbox || 
                !repeatOptionsContainer || !repeatEndDateInput || !missionToScheduleIdInput ||
                !repeatIntervalInput || !repeatUnitSelect) {
                console.error("openScheduleMissionModal: Uno o más elementos del modal de programación de misión no encontrados. No se puede abrir el modal.");
                App.ui.events.showCustomAlert("Error al abrir el programador de misión. Elementos de la interfaz no encontrados.");
                return;
            }

            // Actualizar el título del modal con el nombre de la misión
            scheduleMissionTitle.textContent = `Fecha para ${missionToSchedule.name}`;

            // Inicializar la fecha actual del modal a hoy
            _currentScheduleDateObj = App.utils.normalizeDateToStartOfDay(new Date());

            // Renderizar la fecha inicial y el estado de los botones de navegación
            App.ui.events._updateScheduleDateDisplay();

            // Resetear el estado de recurrencia a no seleccionada por defecto
            repeatMissionCheckbox.checked = false;
            repeatOptionsContainer.classList.remove('active'); // Ocultar opciones de recurrencia por defecto
            repeatEndDateInput.value = ''; // Resetear el valor de fin al abrir
            repeatIntervalInput.value = "1"; // Reset a valor por defecto
            repeatUnitSelect.value = 'day'; // Reset a valor por defecto

            missionToScheduleIdInput.value = missionId;
            scheduleMissionModal.classList.add('visible');
        },

        /**
         * @description Cierra el modal de programación de misiones y resetea su estado.
         */
        closeScheduleMissionModal: function() {
            const scheduleMissionModal = document.getElementById('scheduleMissionModal');
            const scheduleMissionTitle = document.getElementById('scheduleMissionTitle');
            const scheduleDateDisplay = document.getElementById('scheduleDateDisplay');
            const missionToScheduleIdInput = document.getElementById('missionToScheduleId');
            const repeatMissionCheckbox = document.getElementById('repeatMissionCheckbox');
            const repeatOptionsContainer = document.getElementById('repeatOptionsContainer');
            const repeatIntervalInput = document.getElementById('repeatInterval');
            const repeatUnitSelect = document.getElementById('repeatUnit');
            const repeatEndDateInput = document.getElementById('repeatEndDate');
            const prevDayBtn = document.getElementById('prevDayBtn');
            const nextDayBtn = document.getElementById('nextDayBtn');


            if (scheduleMissionModal) scheduleMissionModal.classList.remove('visible');

            // Resetear el contenido del modal
            if (scheduleMissionTitle) scheduleMissionTitle.textContent = "Programar Misión"; // Título genérico
            if (scheduleDateDisplay) scheduleDateDisplay.textContent = '';
            if (missionToScheduleIdInput) missionToScheduleIdInput.value = '';
            if (repeatMissionCheckbox) repeatMissionCheckbox.checked = false;
            if (repeatOptionsContainer) repeatOptionsContainer.classList.remove('active');
            if (repeatIntervalInput) repeatIntervalInput.value = "1";
            if (repeatUnitSelect) repeatUnitSelect.value = 'day';
            if (repeatEndDateInput) repeatEndDateInput.value = '';

            if (prevDayBtn) prevDayBtn.disabled = false; // Resetear estado de botones
            if (nextDayBtn) nextDayBtn.disabled = false;

            _currentScheduleDateObj = null; // Limpiar la variable de la fecha
            missionToSchedule = null;
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
         * @description Inicializa todos los event listeners de la interfaz de usuario.
         */
        initEventListeners: function() {
            // Escucha clics en los botones de navegación de pestañas
            document.querySelectorAll('nav.tabs button').forEach(btn => {
                btn.addEventListener('click', () => {
                    const tabId = btn.getAttribute('aria-controls');
                    if (tabId) App.ui.render.switchTab(tabId);
                });
            });

            // Obtener todos los elementos importantes al inicio
            const elements = {
                totalPointsBtn: document.getElementById('totalPointsBtn'),
                closeStatsModalBtn: document.getElementById('closeStatsModal'),
                openResetOptionsBtn: document.getElementById('openResetOptionsBtn'),
                closeResetConfirmModalBtn: document.getElementById('closeResetConfirmModal'),
                showQuickAddFab: document.getElementById('showQuickAddFab'),
                quickAddForm: document.getElementById('quickAddForm'),
                quickAddNameInput: document.getElementById('quickAddNameInput'),
                quickAddPointsInput: document.getElementById('quickAddPointsInput'),
                showAddCategoryBtn: document.getElementById('showAddCategoryBtn'),
                addCategoryForm: document.getElementById('addCategoryForm'),
                categoryInput: document.getElementById('categoryInput'),
                showAddShopItemBtn: document.getElementById('showAddShopItemBtn'),
                addShopItemForm: document.getElementById('addShopItemForm'),
                shopItemName: document.getElementById('shopItemName'),
                shopItemCost: document.getElementById('shopItemCost'),
                closeScheduleMissionModalBtn: document.getElementById('closeScheduleMissionModal'),
                scheduleDateDisplay: document.getElementById('scheduleDateDisplay'), // Añadido
                prevDayBtn: document.getElementById('prevDayBtn'), // Nuevo
                nextDayBtn: document.getElementById('nextDayBtn'), // Nuevo
                repeatMissionCheckbox: document.getElementById('repeatMissionCheckbox'),
                cancelAdvancedScheduleBtn: document.getElementById('cancelAdvancedScheduleBtn'),
                confirmScheduleBtn: document.getElementById('confirmScheduleBtn'),
                missionToScheduleIdInput: document.getElementById('missionToScheduleId'),
                // scheduleDateInput ha sido ELIMINADO de aquí
                repeatIntervalInput: document.getElementById('repeatInterval'),
                repeatUnitSelect: document.getElementById('repeatUnit'),
                repeatEndDateInput: document.getElementById('repeatEndDate'),
                resetHistoryBtn: document.getElementById('resetHistoryBtn'),
                resetAppBtn: document.getElementById('resetAppBtn'),
            };

            // Event listener para el botón de estadísticas totales
            if (elements.totalPointsBtn) elements.totalPointsBtn.addEventListener('click', () => {
                App.ui.render.renderStatsToday();
                const statsModal = document.getElementById('statsModal');
                if (statsModal) statsModal.classList.add('visible');
            });
            if (elements.closeStatsModalBtn) elements.closeStatsModalBtn.addEventListener('click', () => {
                const statsModal = document.getElementById('statsModal');
                if (statsModal) statsModal.classList.remove('visible');
            });

            if (elements.openResetOptionsBtn) elements.openResetOptionsBtn.addEventListener('click', App.ui.events.showResetOptionsModal);
            if (elements.closeResetConfirmModalBtn) elements.closeResetConfirmModalBtn.addEventListener('click', App.ui.events.closeResetConfirmModal);

            // Event listener para el botón FAB de añadir tarea rápida
            if (elements.showQuickAddFab) elements.showQuickAddFab.addEventListener('click', () => {
                const container = document.getElementById('quickAddFormContainer');
                if (!container) { console.warn("Contenedor quickAddFormContainer no encontrado."); return; }
                const isVisible = container.classList.contains('active');
                document.querySelectorAll('.form-container.active').forEach(f => f.classList.remove('active')); // Ocultar otros
                container.classList.toggle('active');
                elements.showQuickAddFab.textContent = isVisible ? '➕' : '➖';
                if (!isVisible && elements.quickAddNameInput) {
                    elements.quickAddNameInput.focus();
                }
            });

            // Event listener para el formulario de añadir tarea rápida
            if (elements.quickAddForm) elements.quickAddForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = elements.quickAddNameInput ? elements.quickAddNameInput.value.trim() : '';
                const points = elements.quickAddPointsInput ? parseInt(elements.quickAddPointsInput.value.trim(), 10) : NaN;

                if (name && !isNaN(points)) {
                    App.state.addTodayTask({ id: App.utils.genId("task"), name, points, completed: false });
                    if (elements.quickAddNameInput) elements.quickAddNameInput.value = '';
                    if (elements.quickAddPointsInput) elements.quickAddPointsInput.value = '';
                } else {
                    App.ui.events.showCustomAlert("Por favor, introduce un nombre y puntos válidos para la tarea (los puntos deben ser un número).");
                }
            });

            // Event listener para el botón de mostrar/ocultar el formulario de añadir categoría
            if (elements.showAddCategoryBtn) elements.showAddCategoryBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const formContainer = document.getElementById('addCategoryFormContainer');
                if (!formContainer) { console.warn("Contenedor addCategoryFormContainer no encontrado."); return; }
                const isVisible = formContainer.classList.contains('active');
                document.querySelectorAll('.form-container.active').forEach(f => f.classList.remove('active')); // Ocultar otros
                formContainer.classList.toggle('active', !isVisible);
                if (!isVisible && elements.categoryInput) elements.categoryInput.focus();
            });

            // Event listener para el formulario de añadir categoría
            if (elements.addCategoryForm) elements.addCategoryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = elements.categoryInput ? elements.categoryInput.value.trim() : '';
                if (name) {
                    App.state.addCategory(name);
                    if (elements.categoryInput) elements.categoryInput.value = '';
                } else {
                    App.ui.events.showCustomAlert("El nombre de la categoría no puede estar vacío.");
                }
            });

            // Event listener para el botón de mostrar/ocultar el formulario de añadir producto en la tienda
            if (elements.showAddShopItemBtn) elements.showAddShopItemBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const formContainer = document.getElementById('addShopItemFormContainer');
                if (!formContainer) { console.warn("Contenedor addShopItemFormContainer no encontrado."); return; }
                const isVisible = formContainer.classList.contains('active');
                document.querySelectorAll('.form-container.active').forEach(f => f.classList.remove('active')); // Ocultar otros
                formContainer.classList.toggle('active', !isVisible);
                if (!isVisible && elements.shopItemName) elements.shopItemName.focus();
            });

            // Event listener para el formulario de añadir producto en la tienda
            if (elements.addShopItemForm) elements.addShopItemForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = elements.shopItemName ? elements.shopItemName.value.trim() : '';
                const cost = elements.shopItemCost ? parseInt(elements.shopItemCost.value.trim(), 10) : NaN;

                if (name && !isNaN(cost) && cost > 0) {
                    App.state.addShopItem(name, cost);
                    if (elements.shopItemName) elements.shopItemName.value = '';
                    if (elements.shopItemCost) elements.shopItemCost.value = '';
                } else {
                    App.ui.events.showCustomAlert("Por favor, introduce un nombre y un costo válido (número positivo) para el producto.");
                }
            });

            // Event listeners para el modal de Programar Misión
            if (elements.closeScheduleMissionModalBtn) elements.closeScheduleMissionModalBtn.addEventListener('click', App.ui.events.closeScheduleMissionModal);

            // NUEVOS: Event listeners para los botones de navegación de días
            if (elements.prevDayBtn) elements.prevDayBtn.addEventListener('click', () => {
                if (_currentScheduleDateObj) {
                    _currentScheduleDateObj = App.utils.addDateUnit(_currentScheduleDateObj, -1, 'day');
                    App.ui.events._updateScheduleDateDisplay();
                }
            });

            if (elements.nextDayBtn) elements.nextDayBtn.addEventListener('click', () => {
                if (_currentScheduleDateObj) {
                    _currentScheduleDateObj = App.utils.addDateUnit(_currentScheduleDateObj, 1, 'day');
                    App.ui.events._updateScheduleDateDisplay();
                }
            });

            if (elements.repeatMissionCheckbox) elements.repeatMissionCheckbox.addEventListener('change', (e) => {
                const repeatOptionsContainer = document.getElementById('repeatOptionsContainer');
                if (repeatOptionsContainer) repeatOptionsContainer.classList.toggle('active', e.target.checked);
                // Si desactiva la repetición, limpiar la fecha de fin de repetición
                if (!e.target.checked && elements.repeatEndDateInput) {
                    elements.repeatEndDateInput.value = '';
                }
            });

            if (elements.cancelAdvancedScheduleBtn) elements.cancelAdvancedScheduleBtn.addEventListener('click', App.ui.events.closeScheduleMissionModal);

            if (elements.confirmScheduleBtn) elements.confirmScheduleBtn.addEventListener('click', () => {
                const missionId = elements.missionToScheduleIdInput ? elements.missionToScheduleIdInput.value : '';
                // Usamos _currentScheduleDateObj para obtener la fecha formateada
                const date = _currentScheduleDateObj ? App.utils.getFormattedDate(_currentScheduleDateObj) : ''; 
                const isRecurring = elements.repeatMissionCheckbox ? elements.repeatMissionCheckbox.checked : false;
                let repeatOptions = null;

                if (isRecurring) {
                    repeatOptions = {
                        interval: elements.repeatIntervalInput ? elements.repeatIntervalInput.value : "1",
                        unit: elements.repeatUnitSelect ? elements.repeatUnitSelect.value : 'day',
                        endDate: elements.repeatEndDateInput ? elements.repeatEndDateInput.value || null : null
                    };
                }
                if (missionId && date) {
                    App.state.programMission(missionId, date, isRecurring, repeatOptions);
                } else {
                    App.ui.events.showCustomAlert("Por favor, asegúrate de que la misión y la fecha estén seleccionadas para confirmar la programación.");
                }
            });

            // Event listener para el botón de reiniciar SOLO EL HISTORIAL
            if (elements.resetHistoryBtn) elements.resetHistoryBtn.addEventListener('click', () => {
                App.ui.events.closeResetConfirmModal();
                App.ui.events.showCustomConfirm('¿Seguro que quieres borrar ÚNICAMENTE tu historial de puntos y tareas de los días (Hoy y anteriores)? Tus categorías, misiones y artículos de tienda PERMANECERÁN. ¡Esta acción es irreversible!', (confirmed) => {
                    if (confirmed) {
                        App.state.resetHistoryOnly();
                        App.ui.events.showCustomAlert('El historial ha sido reiniciado. Tus puntos actuales, categorías, misiones y artículos de tienda se han mantenido. ¡Una nueva página en tu aventura!');
                        App.ui.render.switchTab('tab-today');
                    }
                });
            });

            // Event listener para el botón de reiniciar la aplicación COMPLETAMENTE
            if (elements.resetAppBtn) elements.resetAppBtn.addEventListener('click', () => {
                App.ui.events.closeResetConfirmModal();
                App.ui.events.showCustomConfirm('¡ADVERTENCIA! Estás a punto de ELIMINAR TODOS tus datos (puntos, misiones, historial, etc.). Esta acción es IRREVERSIBLE. ¿Estás absolutamente seguro?', (firstConfirm) => {
                    if (firstConfirm) {
                        App.ui.events.showCustomConfirm('¡ÚLTIMA ADVERTENCIA! Si continúas, PERDERÁS TODO. ¿Estás 100% seguro de que quieres reiniciar la aplicación?', (secondConfirm) => {
                            if (secondConfirm) {
                                App.state.resetAllData();
                                App.ui.events.showCustomAlert('La aplicación ha sido reiniciada. Todos tus datos han sido borrados. ¡Empieza una nueva aventura!');
                                App.ui.render.switchTab('tab-today');
                            }
                        });
                    }
                });
            });

            // Event listener global para ocultar botones de eliminación al hacer clic fuera
            document.addEventListener('click', (e) => {
                // Solo si el target no es un elemento '.show-delete' ni un '.delete-btn' ni un descendiente de ellos
                // ni una tarea completada, ya que no tienen botón de eliminar
                if (e.target && !e.target.closest('.show-delete') &&
                    !e.target.classList.contains('delete-btn') &&
                    !e.target.closest('.task-card.completed')) {
                    document.querySelectorAll('.show-delete').forEach(el => el.classList.remove('show-delete'));
                }
            });
        }
    };
})(window.App = window.App || {});
