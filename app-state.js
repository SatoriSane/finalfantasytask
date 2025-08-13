// app-state.js
// Maneja el estado de la aplicación y la lógica que lo modifica.
(function(App) {
    let state = {
        points: 0,
        categories: [],
        missions: [],
        tasksByDate: {},
        scheduledMissions: [],
        shopItems: [],
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

    App.state = {
        /**
         * @description Devuelve una copia del estado actual de la aplicación.
         * @returns {object} Una copia inmutable del estado.
         */
        get: () => ({ ...state
        }),

        /**
         * @description Carga el estado de la aplicación desde localStorage,
         * maneja la migración de misiones programadas y el reseteo diario de la tienda.
         * Esta función NO actualiza la UI directamente.
         */
        load: function() {
            console.log("App.state: Attempting to load state from localStorage...");
            const s = localStorage.getItem("pointsAppState");
            const today = App.utils.getFormattedDate(new Date()); // today siempre será válido aquí.
            let dataLoadedSuccessfully = false;

            if (s) {
                try {
                    let loadedState = JSON.parse(s);
                    // Asegura que todas las propiedades existan, útil para actualizaciones de esquema
                    loadedState.points = loadedState.points !== undefined ? loadedState.points : 0;
                    loadedState.categories = loadedState.categories || [];
                    loadedState.missions = loadedState.missions || [];
                    loadedState.tasksByDate = loadedState.tasksByDate || {};
                    loadedState.scheduledMissions = loadedState.scheduledMissions || [];
                    loadedState.shopItems = loadedState.shopItems || [];
                    loadedState.history = loadedState.history || [];
                    loadedState.lastDate = loadedState.lastDate || "";

                    // Asegurarse de que purchasedTodayDate exista para todos los items al cargar
                    loadedState.shopItems.forEach(item => {
                        if (typeof item.purchasedTodayDate === 'undefined') item.purchasedTodayDate = null;
                    });

                    state = loadedState; // Asigna el estado cargado
                    dataLoadedSuccessfully = true;
                    console.log("App.state: State loaded successfully:", state);
                } catch (e) {
                    console.error("App.state: Error parsing localStorage data:", e);
                    // Reset state to default if parsing fails
                    state = {
                        points: 0,
                        categories: [],
                        missions: [],
                        tasksByDate: {},
                        scheduledMissions: [],
                        shopItems: [],
                        history: [],
                        lastDate: ""
                    };
                    _saveStateToLocalStorage(); // Guarda el estado vacío para evitar futuros errores
                    return false; // Indicamos que la carga falló
                }
            } else {
                console.log("App.state: No saved state found in localStorage. Initializing default state.");
                dataLoadedSuccessfully = true; // El estado por defecto se considera cargado con éxito
            }

            // Solo procede con el procesamiento diario si la carga inicial de datos fue exitosa
            // Y si es un nuevo día (o es la primera carga y no hay lastDate)
            if (dataLoadedSuccessfully && (state.lastDate !== today || state.lastDate === "")) {
                console.log(`App.state: Nuevo día detectado o primera carga: ${today}. Procesando...`);

                // Resetea el 'purchasedTodayDate' de los ítems de la tienda para el nuevo día
                state.shopItems.forEach(item => {
                    if (item.purchasedTodayDate && item.purchasedTodayDate !== today) {
                        item.purchasedTodayDate = null;
                    }
                });

                // Asegurar que exista un array para las tareas de hoy
                if (!state.tasksByDate[today]) {
                    state.tasksByDate[today] = [];
                }

                const newScheduledMissions = [];
                const missionsToAddToTodayTasks = [];
                const todayDateObj = App.utils.normalizeDateToStartOfDay(new Date());

                state.scheduledMissions.forEach(scheduledMis => {
                    const scheduledDateObj = App.utils.normalizeDateToStartOfDay(scheduledMis.scheduledDate);
                    if (!scheduledDateObj) {
                        console.warn(`App.state: Saltando misión programada con fecha inválida (o nula): ${scheduledMis.name}`);
                        return;
                    }

                    const repeatEndDateObj = scheduledMis.repeatEndDate ? App.utils.normalizeDateToStartOfDay(scheduledMis.repeatEndDate) : null;

                    if (scheduledMis.isRecurring) {
                        let currentOccurrenceDate = scheduledDateObj;

                        // Avanza la fecha de la misión recurrente hasta hoy o el futuro
                        while (currentOccurrenceDate && currentOccurrenceDate < todayDateObj && (!repeatEndDateObj || currentOccurrenceDate <= repeatEndDateObj)) {
                            currentOccurrenceDate = App.utils.addDateUnit(currentOccurrenceDate, parseInt(scheduledMis.repeatInterval), scheduledMis.repeatUnit);
                            if (!currentOccurrenceDate) break; // Si la fecha se vuelve inválida, rompe el bucle
                        }

                        // Si la misión sigue siendo válida después de avanzar
                        if (currentOccurrenceDate && (!repeatEndDateObj || currentOccurrenceDate <= repeatEndDateObj)) {
                            if (currentOccurrenceDate.getTime() === todayDateObj.getTime()) {
                                // Si la ocurrencia es para hoy, añadirla a las tareas de hoy
                                // *** YA NO EVITAMOS DUPLICADOS AQUÍ DURANTE LA CARGA DIARIA ***
                                missionsToAddToTodayTasks.push({
                                    id: App.utils.genId("task"),
                                    name: scheduledMis.name,
                                    points: scheduledMis.points,
                                    missionId: scheduledMis.missionId,
                                    completed: false
                                });
                                
                                // Calcular la PRÓXIMA ocurrencia después de hoy para volver a programarla
                                currentOccurrenceDate = App.utils.addDateUnit(currentOccurrenceDate, parseInt(scheduledMis.repeatInterval), scheduledMis.repeatUnit);
                                if (currentOccurrenceDate && (!repeatEndDateObj || currentOccurrenceDate <= repeatEndDateObj)) {
                                    newScheduledMissions.push({
                                        ...scheduledMis,
                                        scheduledDate: App.utils.getFormattedDate(currentOccurrenceDate)
                                    });
                                } else {
                                    console.log(`Misión recurrente ${scheduledMis.name} finalizada después de pasar por hoy o por fecha inválida.`);
                                }
                            } else {
                                // Si la ocurrencia es para el futuro, mantenerla como está
                                newScheduledMissions.push({
                                    ...scheduledMis,
                                    scheduledDate: App.utils.getFormattedDate(currentOccurrenceDate)
                                });
                            }
                        } else {
                            console.log(`Misión recurrente ${scheduledMis.name} ha terminado o se ha vuelto inválida. Se elimina.`);
                        }
                    } else { // Lógica para misiones no recurrentes
                        if (scheduledDateObj.getTime() === todayDateObj.getTime()) {
                            // Si es una misión única para hoy, añadirla
                            // *** YA NO EVITAMOS DUPLICADOS AQUÍ DURANTE LA CARGA DIARIA ***
                            missionsToAddToTodayTasks.push({
                                id: App.utils.genId("task"),
                                name: scheduledMis.name,
                                points: scheduledMis.points,
                                missionId: scheduledMis.missionId,
                                completed: false
                            });
                        } else if (scheduledDateObj > todayDateObj) {
                            // Si es una misión única para el futuro, mantenerla
                            newScheduledMissions.push(scheduledMis);
                        } else {
                            // Si es una misión única del pasado, eliminarla
                            console.log(`Misión no recurrente ${scheduledMis.name} (programada para ${scheduledMis.scheduledDate}) está en el pasado. Se elimina.`);
                        }
                    }
                });

                state.scheduledMissions = newScheduledMissions;

                // Arrastrar tareas no completadas de ayer a hoy (si la fecha de ayer es válida)
                const yesterday = App.utils.getFormattedDate(App.utils.addDateUnit(new Date(), -1, 'day'));
                if (yesterday && state.tasksByDate[yesterday]) {
                    const uncompletedYesterdayTasks = state.tasksByDate[yesterday].filter(task => !task.completed);
                    if (uncompletedYesterdayTasks.length > 0) {
                        console.log(`App.state: Arrastrando ${uncompletedYesterdayTasks.length} tareas no completadas de ayer a hoy.`);
                        uncompletedYesterdayTasks.forEach(task => {
                            // *** YA NO EVITAMOS DUPLICADOS AQUÍ AL ARRASTRAR DE AYER ***
                            missionsToAddToTodayTasks.push({
                                id: App.utils.genId("task"),
                                name: task.name,
                                points: task.points,
                                missionId: task.missionId,
                                completed: false
                            });
                        });
                    }
                }

                // Añadir todas las misiones y tareas arrastradas a la lista de hoy.
                // Eliminamos la deduplicación final para permitir varias instancias de la misma misión.
                state.tasksByDate[today].push(...missionsToAddToTodayTasks);
                // COMENTADO: state.tasksByDate[today] = Array.from(new Map(state.tasksByDate[today].map(task => [task.missionId, task])).values());
                
                state.lastDate = today; // Actualizar la última fecha de procesamiento
                _saveStateToLocalStorage(); // Guarda el estado después del procesamiento diario
                console.log("App.state: Final state after load and daily processing:", state);
            } else if (dataLoadedSuccessfully) {
                 // Si los datos se cargaron con éxito pero no es un nuevo día, solo aseguramos que lastDate esté correctamente puesto
                 if (state.lastDate === "") {
                     state.lastDate = today;
                     _saveStateToLocalStorage();
                 }
            }
            return dataLoadedSuccessfully; // Retorno final de la función load
        },

        // --- Funciones de Modificación de Estado ---
        completeTask: function(taskId) {
            const tasks = state.tasksByDate[App.utils.getFormattedDate()];
            const task = tasks ? tasks.find(t => t.id === taskId) : null;
            if (!task || task.completed) return;

            const pts = task.points;
            state.points += pts;
            const todayStr = App.utils.getFormattedDate();
            let histDay = state.history.find(h => h.date === todayStr);
            if (!histDay) {
                histDay = { date: todayStr, earned: 0, spent: 0, actions: [] };
                state.history.push(histDay);
            }
            if (pts >= 0) { histDay.earned += pts; } else { histDay.spent += Math.abs(pts); }
            histDay.actions.push({ name: task.name, points: pts, type: 'tarea', missionId: task.missionId });

            task.completed = true;
            _saveStateToLocalStorage();
            App.ui.render.updatePointsDisplay(); // Llamada consistente a render
            App.ui.render.renderTodayTasks(); // Llamada consistente a render
            App.ui.render.showMotivationMessage(App.utils.getMotivationMessage(pts)); // Mensaje de celebración
        },

        deleteTodayTask: function(taskId) {
            App.ui.events.showCustomConfirm('¿Seguro que quieres eliminar esta tarea de la lista de hoy?', (confirmed) => {
                if (confirmed) {
                    const tasks = state.tasksByDate[App.utils.getFormattedDate()];
                    const taskIndex = tasks ? tasks.findIndex(t => t.id === taskId) : -1;
                    if (taskIndex !== -1) {
                        const taskName = tasks[taskIndex].name;
                        tasks.splice(taskIndex, 1); // Eliminar solo una instancia
                        state.tasksByDate[App.utils.getFormattedDate()] = tasks; // Actualizar el array si se modificó
                        _saveStateToLocalStorage();
                        App.ui.render.renderTodayTasks();
                        App.ui.render.showDiscreetMessage(`Tarea "${taskName}" eliminada de Hoy.`); // Mensaje discreto
                    } else {
                        console.warn(`Intento de eliminar tarea con ID ${taskId} no encontrada.`);
                    }
                }
            });
        },

        addCategory: function(name) {
            state.categories.push({ id: App.utils.genId("category"), name });
            _saveStateToLocalStorage();
            App.ui.render.renderMissions();
            App.ui.render.showDiscreetMessage(`¡Categoría "${name}" creada!`); // Mensaje discreto
        },

        deleteCategory: function(categoryId) {
            App.ui.events.showCustomConfirm('¡CUIDADO! ¿Seguro que quieres eliminar esta categoría? Se borrarán TODAS las misiones que contiene, de las listas de tareas y de las programadas.', (confirmed) => {
                if (confirmed) {
                    const missionsInCategory = state.missions.filter(m => m.categoryId === categoryId).map(m => m.id);
                    const categoryName = state.categories.find(c => c.id === categoryId)?.name || 'Categoría'; // Obtener nombre
                    
                    for (const date in state.tasksByDate) {
                        state.tasksByDate[date] = state.tasksByDate[date].filter(t => !missionsInCategory.includes(t.missionId));
                    }
                    state.scheduledMissions = state.scheduledMissions.filter(sm => !missionsInCategory.includes(sm.missionId));
                    state.missions = state.missions.filter(c => c.categoryId !== categoryId);
                    state.categories = state.categories.filter(c => c.id !== categoryId);
                    _saveStateToLocalStorage();
                    App.ui.render.renderMissions();
                    App.ui.render.renderTodayTasks();
                    App.ui.render.renderScheduledMissions();
                    App.ui.render.showDiscreetMessage(`Categoría "${categoryName}" eliminada.`); // Mensaje discreto
                }
            });
        },

        addMission: function(categoryId, name, points) {
            state.missions.push({ id: App.utils.genId("mission"), name, points, categoryId });
            _saveStateToLocalStorage();
            App.ui.render.renderMissions();
            App.ui.render.showDiscreetMessage(`¡Misión "${name}" añadida al Libro de Misiones!`); // Mensaje discreto
        },

        deleteMission: function(missionId) {
            App.ui.events.showCustomConfirm('¿Seguro que quieres eliminar esta misión del Libro de Misiones? (Se borrará de todas las listas de tareas y de las programadas, pero no del historial si ya la completaste antes)', (confirmed) => {
                if (confirmed) {
                    const missionName = state.missions.find(m => m.id === missionId)?.name || 'Misión'; // Obtener nombre
                    state.missions = state.missions.filter(m => m.id !== missionId);
                    for (const date in state.tasksByDate) {
                        state.tasksByDate[date] = state.tasksByDate[date].filter(t => t.missionId !== missionId);
                    }
                    state.scheduledMissions = state.scheduledMissions.filter(sm => sm.missionId !== missionId);
                    _saveStateToLocalStorage();
                    App.ui.render.renderMissions();
                    App.ui.render.renderTodayTasks();
                    App.ui.render.renderScheduledMissions();
                    App.ui.render.showDiscreetMessage(`Misión "${missionName}" eliminada.`); // Mensaje discreto
                }
            });
        },

        /**
         * @description Programa una misión para una fecha específica o de forma recurrente.
         * Si se programa para "Hoy", la añade directamente a las tareas del día.
         * @param {string} missionId El ID de la misión a programar.
         * @param {string} initialDateString La fecha de inicio en formato YYYY-MM-DD.
         * @param {boolean} isRecurring Indica si la misión es recurrente.
         * @param {object} [repeatOptions=null] Opciones de repetición si es recurrente.
         */
        programMission: function(missionId, initialDateString, isRecurring, repeatOptions) {
            const missionToProgram = state.missions.find(m => m.id === missionId);
            if (!missionToProgram) {
                console.warn(`programMission: Misión con ID ${missionId} no encontrada.`);
                App.ui.events.showCustomAlert("La misión que intentas programar no fue encontrada.");
                return;
            }

            if (!initialDateString) {
                App.ui.events.showCustomAlert("Por favor, selecciona una fecha de inicio.");
                return;
            }

            const newScheduledMission = {
                id: App.utils.genId("scheduled"),
                missionId: missionToProgram.id,
                name: missionToProgram.name,
                points: missionToProgram.points,
                scheduledDate: initialDateString,
                isRecurring: isRecurring,
                ...(isRecurring && repeatOptions ? {
                    repeatInterval: parseInt(repeatOptions.interval),
                    repeatUnit: repeatOptions.unit,
                    repeatEndDate: repeatOptions.endDate || null
                } : {})
            };

            state.scheduledMissions.push(newScheduledMission);

            const todayFormatted = App.utils.getFormattedDate(new Date());
            if (initialDateString === todayFormatted) {
                if (!state.tasksByDate[todayFormatted]) {
                    state.tasksByDate[todayFormatted] = [];
                }
                // *** SE PERMITEN DUPLICADOS AQUÍ ***
                state.tasksByDate[todayFormatted].push({
                    id: App.utils.genId("task"), // Nuevo ID para esta instancia de tarea del día
                    name: missionToProgram.name,
                    points: missionToProgram.points,
                    missionId: missionToProgram.id, // Referencia al ID de la misión original
                    completed: false
                });
                App.ui.render.renderTodayTasks(); // Renderizar las tareas de hoy inmediatamente
                App.ui.render.showDiscreetMessage(`¡Misión "${missionToProgram.name}" añadida a Hoy!`); // Notificación veraz
            } else {
                App.ui.render.showDiscreetMessage(`¡Misión "${missionToProgram.name}" programada para ${initialDateString}!`); // Notificación veraz para otras fechas
            }

            _saveStateToLocalStorage();
            App.ui.render.renderScheduledMissions();
            App.ui.events.closeScheduleMissionModal();
        },

        getMissionTodayCount: function(missionId) {
            const todayTasks = this.getTodayTasks();
            return todayTasks.filter(task => task.missionId === missionId).length;
        },

        deleteScheduledMission: function(scheduledMissionId) {
            App.ui.events.showCustomConfirm('¿Seguro que quieres eliminar esta misión de tus misiones programadas?', (confirmed) => {
                if (confirmed) {
                    const missionName = state.scheduledMissions.find(sm => sm.id === scheduledMissionId)?.name || 'Misión Programada';
                    state.scheduledMissions = state.scheduledMissions.filter(sm => sm.id !== scheduledMissionId);
                    _saveStateToLocalStorage();
                    App.ui.render.renderScheduledMissions();
                    App.ui.render.showDiscreetMessage(`Misión "${missionName}" desprogramada.`); // Mensaje discreto
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
                App.ui.render.renderMissions();
            }
        },
        reorderMission: function(draggedMissionId, targetMissionId, draggedFromCategoryId, targetCategoryId) {
            const missions = state.missions;
            const draggedMissionIndex = missions.findIndex(m => m.id === draggedMissionId);
            let targetMissionIndex = missions.findIndex(m => m.id === targetMissionId);

            if (targetMissionId === targetCategoryId) { // Si se arrastra a la misma categoría, buscar la posición dentro de esa categoría
                const targetCategoryMissions = missions.filter(m => m.categoryId === targetCategoryId);
                if (targetCategoryMissions.length > 0) {
                    // Si el objetivo es la categoría misma (no una misión dentro), mover al final de esa categoría.
                    // Si el targetId coincide con el categoryId, es un drop en la categoría vacía o al final.
                    // En este caso, el targetIndex debe ser al final de las misiones de esa categoría.
                    targetMissionIndex = missions.findIndex(m => m.id === targetCategoryMissions[targetCategoryMissions.length - 1].id) + 1;
                } else {
                    // Si la categoría está vacía, simplemente añadirla.
                    targetMissionIndex = missions.length; // Podría ser cualquier posición al final del array total
                }
            } else if (targetMissionId) { // Si el objetivo es otra misión
                targetMissionIndex = missions.findIndex(m => m.id === targetMissionId);
            } else { // Si no hay targetId (ej. arrastrar a un área vacía, aunque esto debería ser manejado por drag/drop de categorías/contenedores)
                targetMissionIndex = missions.length;
            }

            if (draggedMissionIndex !== -1 && targetMissionIndex !== -1) {
                const [draggedMission] = missions.splice(draggedMissionIndex, 1);
                draggedMission.categoryId = targetCategoryId; // Asigna la nueva categoría

                // Ajustar targetIndex si el arrastrado estaba antes del objetivo y en la misma categoría
                if (draggedFromCategoryId === targetCategoryId && draggedMissionIndex < targetMissionIndex) {
                    targetMissionIndex--;
                }

                missions.splice(targetMissionIndex, 0, draggedMission);
                _saveStateToLocalStorage();
                App.ui.render.renderMissions();
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
            App.ui.render.renderTodayTasks();
        },

        addShopItem: function(name, cost) {
            state.shopItems.push({ id: App.utils.genId("shop"), name, cost, purchasedTodayDate: null });
            _saveStateToLocalStorage();
            App.ui.render.renderShopItems();
            App.ui.render.showDiscreetMessage(`¡Producto "${name}" añadido a la tienda!`); // Mensaje discreto
        },

        buyShopItem: function(itemId) {
            const item = state.shopItems.find(item => item.id === itemId);
            if (!item) return;

            if (item.purchasedTodayDate === App.utils.getFormattedDate()) {
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
                    const todayStr = App.utils.getFormattedDate();
                    let histDay = state.history.find(h => h.date === todayStr);
                    if (!histDay) {
                        histDay = { date: todayStr, earned: 0, spent: 0, actions: [] };
                        state.history.push(histDay);
                    }
                    histDay.spent += item.cost;
                    histDay.actions.push({ name: `Comprado: ${item.name}`, points: -item.cost, type: 'gasto' });

                    item.purchasedTodayDate = todayStr;
                    _saveStateToLocalStorage();
                    App.ui.render.updatePointsDisplay(); // Llamada consistente a render
                    App.ui.render.renderShopItems(); // Llamada consistente a render
                    App.ui.render.renderHistory(); // Llamada consistente a render
                    App.ui.render.showMotivationMessage(`¡"${item.name}" comprado! 💰`); // Mensaje de celebración
                }
            });
        },

        deleteShopItem: function(itemId) {
            App.ui.events.showCustomConfirm('¿Seguro que quieres eliminar este producto de la tienda?', (confirmed) => {
                if (confirmed) {
                    const itemName = state.shopItems.find(item => item.id === itemId)?.name || 'Producto';
                    state.shopItems = state.shopItems.filter(item => item.id !== itemId);
                    _saveStateToLocalStorage();
                    App.ui.render.renderShopItems();
                    App.ui.render.showDiscreetMessage(`"${itemName}" eliminado de la tienda.`); // Mensaje discreto
                }
            });
        },

        addTodayTask: function(task) {
            const today = App.utils.getFormattedDate();
            if (!state.tasksByDate[today]) {
                state.tasksByDate[today] = [];
            }
            // *** SE PERMITEN DUPLICADOS AQUÍ ***
            state.tasksByDate[today].push(task);
            _saveStateToLocalStorage();
            App.ui.render.renderTodayTasks();
            App.ui.render.showDiscreetMessage(`¡"${task.name}" añadido a Hoy!`); // Notificación veraz
        },

        resetAllData: function() {
            state = {
                points: 0, categories: [], missions: [], tasksByDate: {},
                scheduledMissions: [], shopItems: [], history: [], lastDate: ""
            };
            localStorage.removeItem("pointsAppState");
            _saveStateToLocalStorage();
            App.ui.render.updatePointsDisplay();
            App.ui.render.renderTodayTasks();
            App.ui.render.renderMissions();
            App.ui.render.renderScheduledMissions();
            App.ui.render.renderHistory();
            App.ui.render.renderShopItems();
        },

        resetHistoryOnly: function() {
            state.history = [];
            state.tasksByDate = {};
            _saveStateToLocalStorage();
            App.ui.render.renderHistory();
            App.ui.render.renderTodayTasks();
        },

        getTodayTasks: () => state.tasksByDate[App.utils.getFormattedDate()] || [],
        getCategories: () => [...state.categories],
        getMissions: () => [...state.missions],
        getScheduledMissions: () => [...state.scheduledMissions],
        getShopItems: () => [...state.shopItems],
        getHistory: () => [...state.history],
        getPoints: () => state.points,
        getMissionById: (missionId) => state.missions.find(m => m.id === missionId)
    };
})(window.App = window.App || {});
