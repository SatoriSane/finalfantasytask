// app-state.js
// Maneja el estado de la aplicación y la lógica que lo modifica.
(function(App) {
    let state = {
        points: 0,
        categories: [],
        missions: [],
        tasksByDate: {}, // { "YYYY-MM-DD": [{ id, name, points, missionId, completed, currentRepetitions, dailyRepetitions: { max } }] }
        scheduledMissions: [], // Cada misión programada ahora tendrá dailyRepetitions: { max }
        shopItems: [], // ⭐ Restaurado: Items de la tienda
        history: [],
        lastDate: ""
    };

    /**
     * @description Guarda el estado actual de la aplicación en localStorage.
     * NO NOTIFICA A LA UI DIRECTAMENTE AQUÍ.
     * @private
     */
    function _saveStateToLocalStorage() {
        localStorage.setItem("pointsAppState", JSON.stringify(state));
    }

    /**
     * @description Calcula la próxima ocurrencia de una misión recurrente.
     * @param {Date|string} startDate La fecha a partir de la cual buscar (objeto Date o string YYYY-MM-DD).
     * @param {number} repeatInterval El intervalo de repetición (ej. 1).
     * @param {string} repeatUnit La unidad de repetición (ej. 'day', 'week', 'month').
     * @param {string|null} repeatEndDate La fecha de fin de repetición en formato YYYY-MM-DD, o null.
     * @param {Array<string>|null} daysOfWeek Array de números de día (0-6) para repeticiones semanales, o null.
     * @returns {Date|null} La próxima fecha de ocurrencia válida como objeto Date, o null si no hay más ocurrencias.
     */
    function _findNextScheduledOccurrence(startDate, repeatInterval, repeatUnit, repeatEndDate, daysOfWeek) {
        let current = App.utils.normalizeDateToStartOfDay(startDate);
        const endDate = repeatEndDate ? App.utils.normalizeDateToStartOfDay(repeatEndDate) : null;
        const today = App.utils.normalizeDateToStartOfDay(new Date());

        // Manejo de días de la semana para repetición semanal
        if (repeatUnit === 'week' && daysOfWeek && daysOfWeek.length > 0) {
            const selectedDays = daysOfWeek.map(day => parseInt(day, 10));

            if (!current) return null;

            let searchDate = new Date(current);
            let foundValidDay = false;
            let counter = 0;

            while (!foundValidDay && counter < 365) {
                if (selectedDays.includes(searchDate.getDay()) && searchDate >= App.utils.normalizeDateToStartOfDay(startDate)) {
                    foundValidDay = true;
                    break;
                }
                searchDate = App.utils.addDateUnit(searchDate, 1, 'day');
                counter++;
                if (!searchDate) return null;
            }

            if (!foundValidDay) return null;

            current = searchDate;

            while (current < today && (!endDate || current <= endDate)) {
                let daysToNextSelected = 0;
                let currentDay = current.getDay();
                let foundNextDayInCycle = false;

                for (let i = 1; i <= 7; i++) {
                    const nextDayCandidate = (currentDay + i) % 7;
                    if (selectedDays.includes(nextDayCandidate)) {
                        daysToNextSelected = i;
                        foundNextDayInCycle = true;
                        break;
                    }
                }
                if (!foundNextDayInCycle) return null;
                current = App.utils.addDateUnit(current, daysToNextSelected, 'day');
            }

            if (endDate && current > endDate) return null;

            return current;

        } else {
            let tempDate = App.utils.normalizeDateToStartOfDay(startDate);
            if (!tempDate) return null;

            while (tempDate < today && (!endDate || tempDate <= endDate)) {
                tempDate = App.utils.addDateUnit(tempDate, parseInt(repeatInterval), repeatUnit);
                if (!tempDate) return null;
            }
            if (endDate && tempDate > endDate) return null;
            return tempDate;
        }
    }

    /**
     * @description Añade una tarea a la lista de "Hoy" si aún no existe (basado en missionId).
     * @param {object} task La tarea a añadir (debe contener name, points, missionId, dailyRepetitions).
     */
    function _addTaskToTodayIfNotExists(task) {
        const today = App.utils.getFormattedDate();
        if (!state.tasksByDate[today]) state.tasksByDate[today] = [];

        // Comprueba si ya existe una tarea con el mismo missionId para hoy
        const exists = state.tasksByDate[today].some(t => t.missionId === task.missionId);
        if (!exists) {
            state.tasksByDate[today].push({
                id: App.utils.genId("task"), // Generar un nuevo ID para la tarea de hoy
                name: task.name,
                points: task.points,
                missionId: task.missionId,
                completed: false,
                currentRepetitions: 0,
                dailyRepetitions: { max: task.dailyRepetitions.max || 1 }
            });
        }
    }

    App.state = {
        /**
         * @description Devuelve una copia del estado actual de la aplicación.
         * @returns {object} Una copia inmutable del estado.
         */
        // --- Métodos de acceso ---
        getState: function() {
            return { ...state };
        },

        getTodayPoints: function() {
            const todayStr = App.utils.getFormattedDate();
            const todayHistory = state.history.find(h => h.date === todayStr);
            return todayHistory ? todayHistory.earned : 0;
        },
        get: () => ({ ...state }),

        /**
         * @description Carga el estado de la aplicación desde localStorage,
         * maneja la migración de misiones programadas y el reseteo diario de la tienda.
         * Esta función NO actualiza la UI directamente.
         */
        load: function() {
            console.log("App.state: Attempting to load state from localStorage...");
            const s = localStorage.getItem("pointsAppState");
            const today = App.utils.getFormattedDate(new Date());
            let dataLoadedSuccessfully = false;

            if (s) {
                try {
                    let loadedState = JSON.parse(s);
                    loadedState.points = loadedState.points !== undefined ? loadedState.points : 0;
                    loadedState.categories = loadedState.categories || [];
                    loadedState.missions = loadedState.missions || [];
                    loadedState.tasksByDate = loadedState.tasksByDate || {};
                    loadedState.scheduledMissions = loadedState.scheduledMissions || [];
                    loadedState.shopItems = loadedState.shopItems || [];
                    loadedState.history = loadedState.history || [];
                    loadedState.lastDate = loadedState.lastDate || "";

                    // Migración: Eliminar dailyRepetitions de las misiones base (si existía del modelo antiguo)
                    loadedState.missions.forEach(mission => {
                        if (typeof mission.dailyRepetitions !== 'undefined') {
                            delete mission.dailyRepetitions;
                        }
                    });

                    // Migración: Asegurarse de que 'dailyRepetitions' exista en scheduledMissions
                    // Si no existe, se asigna un valor por defecto { max: 1 }
                    loadedState.scheduledMissions.forEach(sm => {
                        if (typeof sm.dailyRepetitions === 'undefined' || typeof sm.dailyRepetitions.max === 'undefined') {
                            sm.dailyRepetitions = { max: 1 };
                        }
                        if (sm.isRecurring && sm.repeatUnit === 'week' && typeof sm.daysOfWeek === 'undefined') {
                            const scheduledDay = App.utils.normalizeDateToStartOfDay(sm.scheduledDate).getDay().toString();
                            sm.daysOfWeek = [scheduledDay];
                        }
                    });

                    // Migración: Asegurar currentRepetitions y dailyRepetitions en tasksByDate
                    for (const date in loadedState.tasksByDate) {
                        loadedState.tasksByDate[date].forEach(task => {
                            if (typeof task.currentRepetitions === 'undefined') {
                                task.currentRepetitions = task.completed ? 1 : 0;
                            }
                            if (typeof task.dailyRepetitions === 'undefined' || typeof task.dailyRepetitions.max === 'undefined') {
                                const scheduledMissionForTask = loadedState.scheduledMissions.find(sm => sm.missionId === task.missionId);
                                task.dailyRepetitions = scheduledMissionForTask ? { max: scheduledMissionForTask.dailyRepetitions.max } : { max: 1 };
                            }
                        });
                    }

                    // ⭐ Asegurarse de que purchasedTodayDate exista para todos los items al cargar
                    // ⭐ Y migrar a formato ISO si es necesario para el ordenamiento por tiempo.
                    loadedState.shopItems.forEach(item => {
                        if (typeof item.purchasedTodayDate === 'undefined') {
                            item.purchasedTodayDate = null;
                        } else if (item.purchasedTodayDate && typeof item.purchasedTodayDate === 'string' && item.purchasedTodayDate.length === 10) {
                            // Si es solo una fecha YYYY-MM-DD, convertirla a ISO string con hora 00:00:00
                            item.purchasedTodayDate = new Date(item.purchasedTodayDate + 'T00:00:00.000Z').toISOString();
                        }
                    });

                    state = loadedState;
                    dataLoadedSuccessfully = true;
                    console.log("App.state: State loaded successfully:", state);
                } catch (e) {
                    console.error("App.state: Error parsing localStorage data:", e);
                    state = {
                        points: 0, categories: [], missions: [], tasksByDate: {},
                        scheduledMissions: [], shopItems: [], history: [], lastDate: ""
                    };
                    _saveStateToLocalStorage();
                    return false;
                }
            } else {
                console.log("App.state: No saved state found in localStorage. Initializing default state.");
                dataLoadedSuccessfully = true;
            }

            if (dataLoadedSuccessfully && (state.lastDate !== today || state.lastDate === "")) {
                console.log(`App.state: Nuevo día detectado o primera carga: ${today}. Procesando...`);

                // ⭐ Resetea el 'purchasedTodayDate' de los ítems de la tienda para el nuevo día
                state.shopItems.forEach(item => {
                    if (item.purchasedTodayDate) {
                        // Compara solo la parte de la fecha del ISO string con la fecha actual
                        const purchasedDateOnly = App.utils.getFormattedDate(new Date(item.purchasedTodayDate));
                        if (purchasedDateOnly !== today) {
                            item.purchasedTodayDate = null;
                        }
                    }
                });

                // Asegúrate de que tasksByDate[today] exista antes de añadir tareas.
                if (!state.tasksByDate[today]) {
                    state.tasksByDate[today] = [];
                }

                const newScheduledMissions = [];
                const todayDateObj = App.utils.normalizeDateToStartOfDay(new Date());

                state.scheduledMissions.forEach(scheduledMis => {
                    const repeatEndDateObj = scheduledMis.repeatEndDate ? App.utils.normalizeDateToStartOfDay(scheduledMis.repeatEndDate) : null;

                    if (scheduledMis.isRecurring) {
                        let nextOccurrence = _findNextScheduledOccurrence(
                            scheduledMis.scheduledDate, scheduledMis.repeatInterval,
                            scheduledMis.repeatUnit, scheduledMis.repeatEndDate, scheduledMis.daysOfWeek
                        );

                        if (nextOccurrence) {
                            const normalizedNextOccurrence = App.utils.normalizeDateToStartOfDay(nextOccurrence);

                            if (normalizedNextOccurrence.getTime() === todayDateObj.getTime()) {
                                // ⭐ Usa _addTaskToTodayIfNotExists para añadir tareas recurrentes
                                _addTaskToTodayIfNotExists({
                                    name: scheduledMis.name,
                                    points: scheduledMis.points,
                                    missionId: scheduledMis.missionId,
                                    dailyRepetitions: scheduledMis.dailyRepetitions
                                });

                                let futureScheduledDate = _findNextScheduledOccurrence(
                                    App.utils.addDateUnit(todayDateObj, 1, 'day'),
                                    scheduledMis.repeatInterval, scheduledMis.repeatUnit,
                                    scheduledMis.repeatEndDate, scheduledMis.daysOfWeek
                                );

                                if (futureScheduledDate && (!repeatEndDateObj || futureScheduledDate <= repeatEndDateObj)) {
                                    newScheduledMissions.push({
                                        ...scheduledMis,
                                        scheduledDate: App.utils.getFormattedDate(futureScheduledDate)
                                    });
                                } else {
                                    console.log(`Misión recurrente ${scheduledMis.name} finalizada.`);
                                }
                            } else if (normalizedNextOccurrence > todayDateObj) {
                                newScheduledMissions.push({
                                    ...scheduledMis,
                                    scheduledDate: App.utils.getFormattedDate(normalizedNextOccurrence)
                                });
                            }
                        } else {
                            console.log(`Misión recurrente ${scheduledMis.name} no tiene futuras ocurrencias válidas o ha terminado. Se elimina.`);
                        }
                    } else { // Misiones no recurrentes
                        const scheduledDateObj = App.utils.normalizeDateToStartOfDay(scheduledMis.scheduledDate);
                        if (!scheduledDateObj) {
                            console.warn(`App.state: Saltando misión no recurrente con fecha inválida (o nula): ${scheduledMis.name}`);
                            return;
                        }
                        if (scheduledDateObj.getTime() === todayDateObj.getTime()) {
                            // Ya usa _addTaskToTodayIfNotExists
                            _addTaskToTodayIfNotExists({
                                name: scheduledMis.name,
                                points: scheduledMis.points,
                                missionId: scheduledMis.missionId,
                                dailyRepetitions: scheduledMis.dailyRepetitions
                            });
                        } else if (scheduledDateObj > todayDateObj) {
                            newScheduledMissions.push(scheduledMis);
                        } else {
                            console.log(`Misión no recurrente ${scheduledMis.name} del pasado. Se elimina.`);
                        }
                    }
                });

                state.scheduledMissions = newScheduledMissions;

                const yesterday = App.utils.getFormattedDate(App.utils.addDateUnit(new Date(), -1, 'day'));
                if (yesterday && state.tasksByDate[yesterday]) {
                    const uncompletedYesterdayTasks = state.tasksByDate[yesterday].filter(task => !task.completed);
                    if (uncompletedYesterdayTasks.length > 0) {
                        console.log(`App.state: Arrastrando ${uncompletedYesterdayTasks.length} tareas no completadas de ayer a hoy.`);
                        uncompletedYesterdayTasks.forEach(task => {
                            // ⭐ Usa _addTaskToTodayIfNotExists para arrastrar tareas de ayer
                            _addTaskToTodayIfNotExists({
                                name: task.name,
                                points: task.points,
                                missionId: task.missionId,
                                dailyRepetitions: { max: task.dailyRepetitions.max }
                            });
                        });
                    }
                }

                // La línea `state.tasksByDate[today].push(...missionsToAddToTodayTasks);`
                // se elimina ya que ahora _addTaskToTodayIfNotExists lo maneja directamente.
                
                state.lastDate = today;
                _saveStateToLocalStorage();
                console.log("App.state: Final state after load and daily processing:", state);
            } else if (dataLoadedSuccessfully) {
                if (state.lastDate === "") {
                    state.lastDate = today;
                    _saveStateToLocalStorage();
                }
            }
            return dataLoadedSuccessfully;
        },

        /**
         * @description Completa una repetición para una tarea del día, otorgando puntos.
         * Si se alcanza el máximo de repeticiones, la tarea se marca como completada por hoy.
         * @param {string} taskId El ID de la tarea del día a la que añadir una repetición.
         * @returns {boolean} True si se añadió una repetición y se otorgaron puntos, false si no se pudo.
         */
        completeTaskRepetition: function(taskId) {
            const tasks = state.tasksByDate[App.utils.getFormattedDate()];
            const task = tasks ? tasks.find(t => t.id === taskId) : null;
            if (!task || task.completed) {
                if (task && task.completed) {
                    App.ui.events.showDiscreetMessage(`"${task.name}" ya está completada para hoy.`);
                }
                return false;
            }

            if (task.currentRepetitions >= task.dailyRepetitions.max) {
                App.ui.events.showDiscreetMessage(`Ya has alcanzado el límite de repeticiones para "${task.name}" hoy.`);
                return false;
            }

            task.currentRepetitions += 1;
            let pointsAwarded = task.points;

            state.points += pointsAwarded;

            const todayStr = App.utils.getFormattedDate();
            let histDay = state.history.find(h => h.date === todayStr);
            if (!histDay) {
                histDay = { date: todayStr, earned: 0, spent: 0, actions: [] };
                state.history.push(histDay);
            }
            histDay.earned += pointsAwarded;
            histDay.actions.push({ name: `Misión: ${task.name} (${task.currentRepetitions}/${task.dailyRepetitions.max})`, points: pointsAwarded, type: 'tarea', missionId: task.missionId });

            if (task.currentRepetitions >= task.dailyRepetitions.max) {
                 task.completed = true;
                 App.ui.render.general.showMotivationMessage(App.utils.getMotivationMessage(task.points));
            } else {
                 App.ui.render.general.showDiscreetMessage(`¡${task.name} (${task.currentRepetitions}/${task.dailyRepetitions.max})! +${task.points}`);
            }

            _saveStateToLocalStorage();
            if (App.ui.render.general) App.ui.render.general.updatePointsDisplay();
            if (App.ui.render.today) App.ui.render.today.renderTodayTasks();
            if (App.ui.render.history) App.ui.render.history.renderHistory();
            return true;
        },

        deleteTodayTask: function(taskId) {
            App.ui.events.showCustomConfirm('¿Seguro que quieres eliminar esta tarea de la lista de hoy? (Los puntos ya obtenidos no se revertirán automáticamente)', (confirmed) => {
                if (confirmed) {
                    const tasks = state.tasksByDate[App.utils.getFormattedDate()];
                    const taskIndex = tasks ? tasks.findIndex(t => t.id === taskId) : -1;
                    if (taskIndex !== -1) {
                        const taskName = tasks[taskIndex].name;
                        tasks.splice(taskIndex, 1);
                        state.tasksByDate[App.utils.getFormattedDate()] = tasks;
                        _saveStateToLocalStorage();
                        if (App.ui.render.today) App.ui.render.today.renderTodayTasks();
                        if (App.ui.render.general) App.ui.render.general.showDiscreetMessage(`Tarea "${taskName}" eliminada de Hoy.`);
                    } else {
                        console.warn(`Intento de eliminar tarea con ID ${taskId} no encontrada.`);
                    }
                }
            });
        },

        addCategory: function(name) {
            state.categories.push({ id: App.utils.genId("category"), name });
            _saveStateToLocalStorage();
            if (App.ui.render.missions) App.ui.render.missions.renderMissions();
            if (App.ui.render.general) App.ui.render.general.showDiscreetMessage(`¡Categoría "${name}" creada!`);
        },

        deleteCategory: function(categoryId) {
            App.ui.events.showCustomConfirm('¡CUIDADO! ¿Seguro que quieres eliminar esta categoría? Se borrarán TODAS las misiones que contiene, de las listas de tareas y de las programadas.', (confirmed) => {
                if (confirmed) {
                    const missionsInCategory = state.missions.filter(m => m.categoryId === categoryId).map(m => m.id);
                    const categoryName = state.categories.find(c => c.id === categoryId)?.name || 'Categoría';

                    for (const date in state.tasksByDate) {
                        state.tasksByDate[date] = state.tasksByDate[date].filter(t => !missionsInCategory.includes(t.missionId));
                    }
                    state.scheduledMissions = state.scheduledMissions.filter(sm => !missionsInCategory.includes(sm.missionId));
                    state.missions = state.missions.filter(c => c.categoryId !== categoryId);
                    state.categories = state.categories.filter(c => c.id !== categoryId);
                    _saveStateToLocalStorage();
                    if (App.ui.render.missions) App.ui.render.missions.renderMissions();
                    if (App.ui.render.today) App.ui.render.today.renderTodayTasks();
                    if (App.ui.render.scheduled) App.ui.render.scheduled.renderScheduledMissions();
                    if (App.ui.render.general) App.ui.render.general.showDiscreetMessage(`Categoría "${categoryName}" eliminada.`);
                }
            });
        },

        /**
         * @description Añade una nueva misión (sin configuración de repeticiones).
         * @param {string} categoryId El ID de la categoría a la que pertenece la misión.
         * @param {string} name El nombre de la misión.
         * @param {number} points Los puntos que otorga la misión por cada repetición.
         */
        addMission: function(categoryId, name, points) {
            state.missions.push({
                id: App.utils.genId("mission"),
                name,
                points,
                categoryId
            });
            _saveStateToLocalStorage();
            if (App.ui.render.missions) App.ui.render.missions.renderMissions();
            if (App.ui.render.general) App.ui.render.general.showDiscreetMessage(`¡Misión "${name}" añadida al Libro de Misiones!`);
        },

        deleteMission: function(missionId) {
            App.ui.events.showCustomConfirm('¿Seguro que quieres eliminar esta misión del Libro de Misiones? (Se borrará de todas las listas de tareas y de las programadas, pero no del historial si ya la completaste antes)', (confirmed) => {
                if (confirmed) {
                    const missionName = state.missions.find(m => m.id === missionId)?.name || 'Misión';
                    state.missions = state.missions.filter(m => m.id !== missionId);
                    for (const date in state.tasksByDate) {
                        state.tasksByDate[date] = state.tasksByDate[date].filter(t => t.missionId !== missionId);
                    }
                    state.scheduledMissions = state.scheduledMissions.filter(sm => sm.missionId !== missionId);
                    _saveStateToLocalStorage();
                    if (App.ui.render.missions) App.ui.render.missions.renderMissions();
                    if (App.ui.render.today) App.ui.render.today.renderTodayTasks();
                    if (App.ui.render.scheduled) App.ui.render.scheduled.renderScheduledMissions();
                    if (App.ui.render.general) App.ui.render.general.showDiscreetMessage(`Misión "${missionName}" eliminada.`);
                }
            });
        },

        /**
         * @description Guarda (crea o actualiza) una misión programada.
         * Si se programa para "Hoy", la añade directamente a las tareas del día.
         * @param {string|null} scheduledMissionId El ID de la programación existente a actualizar, o null para crear una nueva.
         * @param {string} missionId El ID de la misión original a programar.
         * @param {string} initialDateString La fecha de inicio en formato YYYY-MM-DD.
         * @param {boolean} isRecurring Indica si la misión es recurrente.
         * @param {object} [repeatOptions=null] Opciones de repetición si es recurrente.
         * @param {Array<string>} [repeatOptions.daysOfWeek] Array de números de día (0-6) para repeticiones semanales.
         * @param {number} dailyRepetitionsMax El número máximo de repeticiones diarias para esta programación.
         */
        saveScheduledMission: function(scheduledMissionId, missionId, initialDateString, isRecurring, repeatOptions, dailyRepetitionsMax) {
            const missionToProgram = state.missions.find(m => m.id === missionId);
            if (!missionToProgram) {
                console.warn(`saveScheduledMission: Misión con ID ${missionId} no encontrada.`);
                App.ui.events.showCustomAlert("La misión que intentas programar no fue encontrada.");
                return;
            }
            if (!initialDateString) {
                App.ui.events.showCustomAlert("Por favor, selecciona una fecha de inicio.");
                return;
            }
            if (isNaN(dailyRepetitionsMax) || dailyRepetitionsMax < 1) {
                App.ui.events.showCustomAlert("El máximo de repeticiones debe ser un número válido (mínimo 1).");
                return;
            }

            const scheduledData = {
                missionId: missionToProgram.id,
                name: missionToProgram.name,
                points: missionToProgram.points,
                scheduledDate: initialDateString,
                isRecurring: isRecurring,
                dailyRepetitions: { max: dailyRepetitionsMax },
                ...(isRecurring && repeatOptions ? {
                    repeatInterval: parseInt(repeatOptions.interval),
                    repeatUnit: repeatOptions.unit,
                    repeatEndDate: repeatOptions.endDate || null,
                    daysOfWeek: repeatOptions.daysOfWeek || null
                } : {})
            };

            if (scheduledMissionId) {
                const index = state.scheduledMissions.findIndex(sm => sm.id === scheduledMissionId);
                if (index !== -1) {
                    state.scheduledMissions[index] = { id: scheduledMissionId, ...scheduledData };
                    App.ui.events.showCustomAlert(`Programación para "${missionToProgram.name}" actualizada.`);
                } else {
                    console.warn(`saveScheduledMission: No se encontró programación con ID ${scheduledMissionId} para actualizar.`);
                    scheduledData.id = App.utils.genId("scheduled");
                    state.scheduledMissions.push(scheduledData);
                    App.ui.events.showCustomAlert(`¡Misión "${missionToProgram.name}" programada!`);
                }
            } else {
                scheduledData.id = App.utils.genId("scheduled");
                state.scheduledMissions.push(scheduledData);
                App.ui.events.showCustomAlert(`¡Misión "${missionToProgram.name}" programada!`);
            }

            const todayFormatted = App.utils.getFormattedDate(new Date());
            if (initialDateString === todayFormatted) {
                // ⭐ Usa _addTaskToTodayIfNotExists aquí también
                _addTaskToTodayIfNotExists({
                    name: missionToProgram.name,
                    points: missionToProgram.points,
                    missionId: missionToProgram.id,
                    dailyRepetitions: { max: dailyRepetitionsMax }
                });
                if (App.ui.render.today) App.ui.render.today.renderTodayTasks();
                
            }

            _saveStateToLocalStorage();
            if (App.ui.render.missions) App.ui.render.missions.renderMissions();
            if (App.ui.render.scheduled) App.ui.render.scheduled.renderScheduledMissions();
            App.ui.events.closeScheduleMissionModal();
        },

        getMissionTodayCount: function(missionId) {
            const todayTasks = this.getTodayTasks();
            const task = todayTasks.find(t => t.missionId === missionId);
            return task ? task.currentRepetitions : 0;
        },

        deleteScheduledMission: function(scheduledMissionId) {
            App.ui.events.showCustomConfirm('¿Seguro que quieres eliminar esta misión de tus misiones programadas?', (confirmed) => {
                if (confirmed) {
                    const missionName = state.scheduledMissions.find(sm => sm.id === scheduledMissionId)?.name || 'Misión Programada';
                    state.scheduledMissions = state.scheduledMissions.filter(sm => sm.id !== scheduledMissionId);
                    _saveStateToLocalStorage();
                    if (App.ui.render.scheduled) App.ui.render.scheduled.renderScheduledMissions();
                    if (App.ui.render.missions) App.ui.render.missions.renderMissions();
                    if (App.ui.render.general) App.ui.render.general.showDiscreetMessage(`Misión "${missionName}" desprogramada.`);
                }
            });
        },
        reorderCategory: function(draggedCategoryId, targetCategoryId) {
            const categories = state.categories;
            const draggedIndex = categories.findIndex(cat => cat.id === draggedCategoryId);
            const targetIndex = categories.findIndex(cat => cat.id === targetCategoryId);

            if (draggedIndex !== -1 && targetIndex !== -1) {
                const [draggedCategory] = categories.splice(draggedIndex, 1);
                categories.splice(targetIndex, 0, draggedCategory);
                _saveStateToLocalStorage();
                if (App.ui.render.missions) App.ui.render.missions.renderMissions();
            }
        },
        reorderMission: function(draggedMissionId, targetMissionId, draggedFromCategoryId, targetCategoryId) {
            const missions = state.missions;
            const draggedMissionIndex = missions.findIndex(m => m.id === draggedMissionId);
            let targetMissionIndex = missions.findIndex(m => m.id === targetMissionId);

            if (targetMissionId === targetCategoryId) {
                const targetCategoryMissions = missions.filter(m => m.categoryId === targetCategoryId);
                if (targetCategoryMissions.length > 0) {
                    targetMissionIndex = missions.findIndex(m => m.id === targetCategoryMissions[targetCategoryMissions.length - 1].id) + 1;
                } else {
                    targetMissionIndex = missions.length;
                }
            } else if (targetMissionId) {
                targetMissionIndex = missions.findIndex(m => m.id === targetMissionId);
            } else {
                targetMissionIndex = missions.length;
            }

            if (draggedMissionIndex !== -1 && targetMissionIndex !== -1) {
                const [draggedMission] = missions.splice(draggedMissionIndex, 1);
                draggedMission.categoryId = targetCategoryId;

                if (draggedFromCategoryId === targetCategoryId && draggedMissionIndex < targetMissionIndex) {
                    targetMissionIndex--;
                }

                missions.splice(targetMissionIndex, 0, draggedMission);
                _saveStateToLocalStorage();
                if (App.ui.render.missions) App.ui.render.missions.renderMissions();
            }
        },
        reorderTodayTask: function(draggedId, targetId) {
            const today = App.utils.getFormattedDate(new Date());
            let tasks = state.tasksByDate[today];

            if (!tasks) return;

            const draggedIndex = App.utils.findTaskIndexById(tasks, draggedId);
            const targetIndex = App.utils.findTaskIndexById(tasks, targetId);

            if (draggedIndex === -1 || targetIndex === -1) {
                console.error("Reorder failed: dragged or target task not found.");
                return;
            }

            const [draggedTask] = tasks.splice(draggedIndex, 1);
            tasks.splice(targetIndex, 0, draggedTask);

            state.tasksByDate[today] = tasks;
            _saveStateToLocalStorage();
            if (App.ui.render.today) App.ui.render.today.renderTodayTasks();
        },

        /**
         * @description Añade un nuevo producto a la tienda.
         * @param {string} name El nombre del producto.
         * @param {number} cost El costo en puntos del producto.
         */
        addShopItem: function(name, cost) {
            state.shopItems.push({ id: App.utils.genId("shop"), name, cost, purchasedTodayDate: null });
            _saveStateToLocalStorage();
            // Llama a la función de renderizado correcta desde el módulo
            if (App.ui.render.shop) App.ui.render.shop.renderShopItems();
            if (App.ui.render.general) App.ui.render.general.showDiscreetMessage(`¡Producto "${name}" añadido a la tienda!`);
        },

        /**
         * @description Permite al usuario comprar un producto de la tienda.
         * @param {string} itemId El ID del producto a comprar.
         * @returns {void}
         */
        buyShopItem: function(itemId) {
            const item = state.shopItems.find(item => item.id === itemId);
            if (!item) return;
        
            // Obtener solo la parte de la fecha para la comparación diaria
            const todayStr = App.utils.getFormattedDate(); 
            const itemPurchasedDateOnly = item.purchasedTodayDate ? App.utils.getFormattedDate(new Date(item.purchasedTodayDate)) : null;

            if (itemPurchasedDateOnly === todayStr) {
                App.ui.events.showCustomAlert('Este artículo ya fue comprado hoy. Estará disponible de nuevo mañana.');
                return;
            }
        
            if (state.points < item.cost) {
                App.ui.events.showCustomAlert('No tienes suficientes puntos para comprar este artículo.');
                return;
            }
        
            App.ui.events.showCustomConfirm(`¿Estás seguro de que quieres comprar "${item.name}" por ${item.cost} puntos?`, (confirmed) => {
                if (confirmed) {
                    state.points -= item.cost;
                    
                    let histDay = state.history.find(h => h.date === todayStr);
                    if (!histDay) {
                        histDay = { date: todayStr, earned: 0, spent: 0, actions: [] };
                        state.history.push(histDay);
                    }
                    histDay.spent += item.cost;
                    histDay.actions.push({ name: `Comprado: ${item.name}`, points: -item.cost, type: 'gasto' });
        
                    // ⭐ Almacenar la fecha y hora exactas en formato ISO.
                    item.purchasedTodayDate = new Date().toISOString(); 
                    // Ya no necesitamos 'justBought', la lógica de UI identificará el más reciente por la fecha.
        
                    _saveStateToLocalStorage();
        
                    if (App.ui.render.general) App.ui.render.general.updatePointsDisplay();
                    if (App.ui.render.shop) App.ui.render.shop.renderShopItems();
                    if (App.ui.render.history) App.ui.render.history.renderHistory();
                    if (App.ui.render.general) App.ui.render.general.showMotivationMessage(`¡"${item.name}" logrado! 🎉`);
                }
            });
        },
        

        /**
         * @description Elimina un producto de la tienda.
         * @param {string} itemId El ID del producto a eliminar.
         */
        deleteShopItem: function(itemId) {
            App.ui.events.showCustomConfirm('¿Seguro que quieres eliminar este producto de la tienda?', (confirmed) => {
                if (confirmed) {
                    const itemName = state.shopItems.find(item => item.id === itemId)?.name || 'Producto';
                    state.shopItems = state.shopItems.filter(item => item.id !== itemId);
                    _saveStateToLocalStorage();
                    // Llama a la función de renderizado correcta desde el módulo
                    if (App.ui.render.shop) App.ui.render.shop.renderShopItems();
                    if (App.ui.render.general) App.ui.render.general.showDiscreetMessage(`"${itemName}" eliminado de la tienda.`);
                }
            });
        },

        addTodayTask: function(task) {
            const today = App.utils.getFormattedDate();
            if (!state.tasksByDate[today]) {
                state.tasksByDate[today] = [];
            }
            // Para quick add, la tarea tendrá 1 repetición máxima por defecto
            const taskToAdd = {
                ...task,
                currentRepetitions: 0,
                dailyRepetitions: { max: 1 } // Default a 1 para quick add
            };
            // ⭐ Usa _addTaskToTodayIfNotExists aquí también
            _addTaskToTodayIfNotExists(taskToAdd);
            _saveStateToLocalStorage();
            if (App.ui.render.today) App.ui.render.today.renderTodayTasks();
            if (App.ui.render.general) App.ui.render.general.showDiscreetMessage(`¡"${task.name}" añadido a Hoy!`);
        },

        resetAllData: function() {
            state = {
                points: 0, categories: [], missions: [], tasksByDate: {},
                scheduledMissions: [], shopItems: [], history: [], lastDate: ""
            };
            localStorage.removeItem("pointsAppState");
            _saveStateToLocalStorage();
            if (App.ui.render.general) App.ui.render.general.updatePointsDisplay();
            if (App.ui.render.today) App.ui.render.today.renderTodayTasks();
            if (App.ui.render.missions) App.ui.render.missions.renderMissions();
            if (App.ui.render.scheduled) App.ui.render.scheduled.renderScheduledMissions();
            if (App.ui.render.history) App.ui.render.history.renderHistory();
            if (App.ui.render.shop) App.ui.render.shop.renderShopItems();
        },

        resetHistoryOnly: function() {
            state.history = [];
            state.tasksByDate = {};
            _saveStateToLocalStorage();
            if (App.ui.render.history) App.ui.render.history.renderHistory();
            if (App.ui.render.today) App.ui.render.today.renderTodayTasks();
        },

        // --- Getters de Estado ---
        getTodayTasks: () => state.tasksByDate[App.utils.getFormattedDate()] || [],
        getCategories: () => [...state.categories],
        getMissions: () => [...state.missions],
        getScheduledMissions: () => [...state.scheduledMissions],
        getShopItems: () => [...state.shopItems],
        getHistory: () => [...state.history],
        getPoints: () => state.points,
        getMissionById: (missionId) => state.missions.find(m => m.id === missionId),

        /**
         * @description Busca una misión programada por el ID de la misión original.
         * Esto es útil para saber si una misión del "Libro de Misiones" ya tiene una programación activa.
         * @param {string} originalMissionId El ID de la misión original (del libro de misiones).
         * @returns {object|undefined} La misión programada encontrada, o undefined si no existe.
         */
        getScheduledMissionByOriginalMissionId: (originalMissionId) => {
            return state.scheduledMissions.find(sm => sm.missionId === originalMissionId);
        }
    };
})(window.App = window.App || {});
