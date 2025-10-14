// app-state-today.js
// Maneja el estado y lógica de las tareas de hoy
(function(App) {
    if (!App.state) {
        console.error("App.state is not initialized. Make sure app-state.js is loaded first.");
        return;
    }

    const _get = () => App.state.get();
    const _save = () => App.state.saveState();

    function addQuickTask(taskData) {
        const state = _get();
        const today = App.utils.getFormattedDate();

        if (!state.tasksByDate[today]) {
            state.tasksByDate[today] = [];
        }

        // Create a temporary task directly for today, without creating a permanent mission
        const newTemporaryTask = {
            id: App.utils.genId("task"), // A unique ID for the task itself
            name: taskData.name,
            points: taskData.points || 0,
            missionId: null, // No associated mission
            completed: false,
            currentRepetitions: 0,
            dailyRepetitions: { max: 1 }
        };

        state.tasksByDate[today].push(newTemporaryTask);

        _save();
        // No need to emit 'missionsUpdated' since no mission was created/changed
        App.events.emit('todayTasksUpdated');
        App.events.emit('shownotifyMessage', `Tarea "${taskData.name}" añadida a Hoy.`);
    }

    function addTaskToToday(task) {
        const state = _get();
        const today = App.utils.getFormattedDate();
        if (!state.tasksByDate[today]) {
            state.tasksByDate[today] = [];
        }
        
        const exists = state.tasksByDate[today].some(t => t.missionId === task.missionId);
        if (exists) return;
        
        state.tasksByDate[today].push({
            id: App.utils.genId("task"),
            name: task.name,
            points: task.points,
            missionId: task.missionId,
            completed: false,
            currentRepetitions: 0,
            dailyRepetitions: { max: (task.dailyRepetitions && task.dailyRepetitions.max) || 1 }
        });

        // Registrar la aparición de la misión
        if (task.missionId) {
            App.state.trackMissionAppearance(task.missionId);
        }
        
        _save();
        App.events.emit('todayTasksUpdated');
    }

    function unscheduleTaskForToday(taskId) {
        const state = _get();
        const todayStr = App.utils.getFormattedDate();
        const tasks = state.tasksByDate[todayStr] || [];
        const task = tasks.find(t => t.id === taskId);

        if (task && task.missionId) {
            App.ui.general.showCustomConfirm(`¿Seguro que quieres quitar la misión "${task.name}" de hoy?`, (confirmed) => {
                if (confirmed) {
                    // Encontrar la misión programada correspondiente
                    const scheduledMission = state.scheduledMissions.find(sm => sm.missionId === task.missionId);
                    
                    if (scheduledMission) {
                        if (!scheduledMission.skippedDates) {
                            scheduledMission.skippedDates = [];
                        }
                        const todayFormatted = App.utils.getFormattedDate(new Date());
                        if (!scheduledMission.skippedDates.includes(todayFormatted)) {
                            scheduledMission.skippedDates.push(todayFormatted);
                        }
                    }
                    
                    // Eliminar la tarea de hoy
                    state.tasksByDate[todayStr] = tasks.filter(t => t.id !== taskId);
                    
                    _save();
                    App.events.emit('todayTasksUpdated');
                    App.events.emit('scheduledMissionsUpdated');
                    App.events.emit('missionsUpdated'); // Para actualizar iconos
                    App.events.emit('shownotifyMessage', `"${task.name}" ha sido desprogramada.`);
                } else {
                    App.events.emit('shownotifyMessage', `Acción cancelada.`);
                }
            });
        } else {
            console.warn(`No se pudo encontrar la tarea con ID: ${taskId} para desprogramar.`);
        }
    }

    function updateTemporaryTask(taskId, updatedData) {
        const state = _get();
        const today = App.utils.getFormattedDate();
        const task = (state.tasksByDate[today] || []).find(t => t.id === taskId);

        if (task) {
            task.name = updatedData.name;
            task.points = updatedData.points;
            _save();
            App.events.emit('todayTasksUpdated');
            App.events.emit('shownotifyMessage', `Tarea "${task.name}" actualizada.`);
        } else {
            console.warn(`No se pudo encontrar la tarea temporal con ID: ${taskId} para actualizar.`);
        }
    }

    // --- FUNCIONES AÑADIDAS PARA ORDENAR ---
    function saveTodayTaskOrder(order) {
        const state = _get();
        const today = App.utils.getFormattedDate();
        if (!state.todayOrder) {
            state.todayOrder = {};
        }
        state.todayOrder[today] = order;
        _save();
    }

    function getTodayTaskOrder() {
        const state = _get();
        const today = App.utils.getFormattedDate();
        return (state.todayOrder && state.todayOrder[today]) || null;
    }
    // --- FIN DE FUNCIONES AÑADIDAS ---

    Object.assign(App.state, {
        unscheduleTaskForToday: unscheduleTaskForToday,
        addQuickTask: addQuickTask,
        updateTemporaryTask: updateTemporaryTask,
        addTaskToToday: addTaskToToday,
        completeTaskRepetition: function(taskId) {
            const tasks = this.getTodayTasks();
            const task = tasks.find(t => t.id === taskId);

            if (!task || task.completed) {
                if (task && task.completed) {
                    App.events.emit('shownotifyMessage', `"${task.name}" ya está completada para hoy.`);
                }
                return false;
            }

            if (task.currentRepetitions >= task.dailyRepetitions.max) {
                App.events.emit('shownotifyMessage', `Ya has alcanzado el límite de repeticiones para "${task.name}" hoy.`);
                return false;
            }

            task.currentRepetitions += 1;

            const bonusMissionId = App.state.getBonusMissionForToday();
            let pointsAwarded = task.points;
            if (task.missionId && task.missionId === bonusMissionId) {
                pointsAwarded *= 2;
            }

            App.state.addPoints(pointsAwarded);
            App.state.addHistoryAction(`Misión: ${task.name} (${task.currentRepetitions}/${task.dailyRepetitions.max})`, pointsAwarded, 'tarea');

            if (task.currentRepetitions >= task.dailyRepetitions.max) {
                task.completed = true;
                // Registrar la finalización de la misión
                if (task.missionId) {
                    App.state.trackMissionCompletion(task.missionId);
                }
                
                // Auto-eliminar misiones de un solo día que han sido completadas
                if (App.state.autoDeleteCompletedSingleDayMissions) {
                    setTimeout(() => {
                        App.state.autoDeleteCompletedSingleDayMissions();
                    }, 100); // Pequeño delay para asegurar que el estado se haya guardado
                }
            } else {
                App.events.emit('shownotifyMessage', `¡${task.name} (${task.currentRepetitions}/${task.dailyRepetitions.max})! +${pointsAwarded}`);
            }

            _save();
            App.events.emit('pointsUpdated', _get().points);
            App.events.emit('historyUpdated');
            
            // Primero, emite este evento para iniciar la animación de la barra de progreso.
            App.events.emit('taskCompleted', taskId);
            
            // Luego, espera 0.5 segundos para que la animación termine y luego emite el evento
            // que hará que se re-renderice la lista y se reordene.
            setTimeout(() => {
                App.events.emit('todayTasksUpdated');
            }, 1000); // Mismo tiempo que la duración de la transición en CSS
            
            return true;
        },


        deleteTodayTask: function(taskId, skipConfirm = false) {
            const performDelete = () => {
                const state = _get();
                const todayStr = App.utils.getFormattedDate();
                const tasks = state.tasksByDate[todayStr];
                const taskIndex = tasks ? tasks.findIndex(t => t.id === taskId) : -1;

                if (taskIndex !== -1) {
                    const taskName = tasks[taskIndex].name;
                    tasks.splice(taskIndex, 1);
                    state.tasksByDate[todayStr] = tasks;
                    _save();
                    App.events.emit('todayTasksUpdated');
                    if (!skipConfirm) {
                        App.events.emit('shownotifyMessage', `Tarea "${taskName}" eliminada de Hoy.`);
                    }
                } else {
                    console.warn(`Intento de eliminar tarea con ID ${taskId} no encontrada.`);
                }
            };

            if (skipConfirm) {
                performDelete();
            } else {
                App.events.emit('showCustomConfirm', {
                    message: '¿Seguro que quieres eliminar esta tarea de la lista de hoy?',
                    callback: (confirmed) => {
                        if (confirmed) {
                            performDelete();
                        }
                    }
                });
            }
        },
        
        getTodayTasks: function() {
            return _get().tasksByDate[App.utils.getFormattedDate()] || [];
        },

        rolloverUncompletedTasks: function() {
            const state = _get();
            const today = App.utils.getFormattedDate();
            const yesterday = App.utils.getFormattedDate(App.utils.addDateUnit(new Date(), -1, 'day'));

            const yesterdayTasks = state.tasksByDate[yesterday] || [];
            if (yesterdayTasks.length === 0) return;

            const uncompletedTasks = yesterdayTasks.filter(task => !task.completed);
            if (uncompletedTasks.length === 0) return;

            const todayTasks = state.tasksByDate[today] || [];
            const todayTaskIds = new Set(todayTasks.map(t => t.id));

            const tasksToRollover = uncompletedTasks.filter(task => !todayTaskIds.has(task.id)).map(task => ({
                ...task,
                completed: false,
                currentRepetitions: 0
            }));

            if (tasksToRollover.length > 0) {
                state.tasksByDate[today] = [...tasksToRollover, ...todayTasks];
                _save();
                console.log(`${tasksToRollover.length} tarea(s) no completada(s) ha(n) sido movida(s) a hoy.`);
            }
        },
        
        // Añado las nuevas funciones al objeto principal de App.state
        saveTodayTaskOrder: saveTodayTaskOrder,
        getTodayTaskOrder: getTodayTaskOrder,
    });

})(window.App = window.App || {});