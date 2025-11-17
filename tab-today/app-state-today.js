// app-state-today.js
// Maneja el estado y lógica de las tareas de cualquier fecha
(function(App) {
    if (!App.state) {
        console.error("App.state is not initialized. Make sure app-state.js is loaded first.");
        return;
    }

    const _get = () => App.state.get();
    const _save = () => App.state.saveState();

    function addQuickTask({ name, points = 0, categoryId = null, targetDate = null }) {
        if (!name) return;
    
        const state = App.state.get();
    
        // ⭐ MEJORADO: Asegurar que "Propósito esporádico" siempre exista
        let sporadicCat = state.categories.find(c => c.name === "Propósito esporádico");
        if (!sporadicCat) {
            App.state.addCategory("Propósito esporádico");
            sporadicCat = state.categories.find(c => c.name === "Propósito esporádico");
        }
    
        let catId = categoryId || state.lastQuickAddCategoryId || null;
        
        // Si no hay categoryId, usar "Propósito esporádico" como fallback
        if (!catId) {
            catId = sporadicCat.id;
        }
    
        const dailyRepetitionsMax = 1;
        App.state.addMission(name, points, catId, dailyRepetitionsMax);
        const newMission = state.missions[state.missions.length - 1];
    
        const scheduleDate = targetDate || App.utils.getFormattedDate();
    
        // Solo programar la misión
        App.state.scheduleMission(newMission.id, scheduleDate, false);
    
        // Obtener el estado actualizado después de programar
        const updatedState = App.state.get();
        const tasks = updatedState.tasksByDate[scheduleDate] || [];
        
        // Buscar la tarea recién creada (la última que coincida con el missionId)
        const newTaskIndex = tasks.findIndex(t => t.missionId === newMission.id);
        
        if (newTaskIndex !== -1 && newTaskIndex !== 0) {
            // Mover la tarea al principio
            const newTask = tasks.splice(newTaskIndex, 1)[0];
            tasks.unshift(newTask);
            updatedState.tasksByDate[scheduleDate] = tasks;
            
            // Actualizar el orden guardado
            const newOrder = tasks.filter(t => !t.completed).map(t => t.id);
            App.state.saveTodayTaskOrder(newOrder, scheduleDate);
        }
    
        state.lastQuickAddCategoryId = catId;
        App.state.saveState();
    
        App.events.emit('todayTasksUpdated'); // ⭐ Evento correcto para actualizar la vista Today
        App.events.emit('missionsUpdated');
        App.events.emit('shownotifyMessage', `Misión "${name}" añadida para ${scheduleDate === App.utils.getFormattedDate() ? 'Hoy' : scheduleDate}.`);
    }
    


    function unscheduleTaskForToday(taskId) {
        const state = _get();
        const todayStr = App.utils.getFormattedDate();
        const tasks = state.tasksByDate[todayStr] || [];
        const task = tasks.find(t => t.id === taskId);

        if (task && task.missionId) {
            App.ui.general.showCustomConfirm(`¿Seguro que quieres quitar la misión "${task.name}" de hoy?`, (confirmed) => {
                if (confirmed) {
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
                    
                    state.tasksByDate[todayStr] = tasks.filter(t => t.id !== taskId);
                    
                    _save();
                    App.events.emit('todayTasksUpdated');
                    App.events.emit('scheduledMissionsUpdated');
                    App.events.emit('missionsUpdated');
                    App.events.emit('shownotifyMessage', `"${task.name}" ha sido desprogramada.`);
                } else {
                    App.events.emit('shownotifyMessage', `Acción cancelada.`);
                }
            });
        } else {
            console.warn(`No se pudo encontrar la tarea con ID: ${taskId} para desprogramar.`);
        }
    }

    function updateTemporaryTask(taskId, updatedData, targetDate = null) {
        const state = _get();
        const dateStr = targetDate || App.utils.getFormattedDate();
        const task = (state.tasksByDate[dateStr] || []).find(t => t.id === taskId);
    
        if (task) {
            if (typeof updatedData.name === 'string') task.name = updatedData.name;
            if (typeof updatedData.points === 'number') task.points = updatedData.points;
    
            if (updatedData.dailyRepetitions && typeof updatedData.dailyRepetitions.max === 'number') {
                const newMax = Math.max(1, parseInt(updatedData.dailyRepetitions.max, 10) || 1);
                task.dailyRepetitions = task.dailyRepetitions || { max: 1 };
    
                if ((task.currentRepetitions || 0) > newMax) {
                    task.currentRepetitions = newMax;
                }
                task.dailyRepetitions.max = newMax;
    
                if (task.completed && (task.currentRepetitions || 0) < task.dailyRepetitions.max) {
                    task.completed = false;
                }
            }
    
            _save();
            App.events.emit('todayTasksUpdated');
            App.events.emit('shownotifyMessage', `Tarea "${task.name}" actualizada.`);
        } else {
            console.warn(`No se pudo encontrar la tarea temporal con ID: ${taskId} para actualizar.`);
        }
    }
    
    function deleteTemporaryTask(taskId, targetDate = null) {
        if (typeof App.state.deleteTodayTask === 'function') {
            App.state.deleteTodayTask(taskId, true, targetDate);
        } else {
            const state = _get();
            const dateStr = targetDate || App.utils.getFormattedDate();
            const tasks = state.tasksByDate[dateStr] || [];
            const idx = tasks.findIndex(t => t.id === taskId);
            if (idx !== -1) {
                const name = tasks[idx].name;
                tasks.splice(idx, 1);
                state.tasksByDate[dateStr] = tasks;
                _save();
                App.events.emit('todayTasksUpdated');
                App.events.emit('shownotifyMessage', `Tarea "${name}" eliminada.`);
            } else {
                console.warn(`Intento de eliminar tarea temporal no encontrada: ${taskId}`);
            }
        }
    }

    function saveTodayTaskOrder(order, dateStr = null) {
        const state = _get();
        const targetDate = dateStr || App.utils.getFormattedDate();
        if (!state.todayOrder) {
            state.todayOrder = {};
        }
        state.todayOrder[targetDate] = order;
        
        console.log('💾 Guardando orden de tareas:', {
            fecha: targetDate,
            totalTareas: order.length,
            orden: order
        });
        
        // ⭐ NUEVO: Actualizar los pesos de orden de las misiones
        // Esto hace que el orden de hoy influya en días futuros
        if (App.state.updateMissionOrderWeights) {
            console.log('🎯 Llamando a updateMissionOrderWeights...');
            App.state.updateMissionOrderWeights(order, targetDate);
        } else {
            console.error('❌ App.state.updateMissionOrderWeights no está disponible');
        }
        
        _save();
    }

    function getTodayTaskOrder(dateStr = null) {
        const state = _get();
        const targetDate = dateStr || App.utils.getFormattedDate();
        return (state.todayOrder && state.todayOrder[targetDate]) || null;
    }

    function recordTaskRepetition(taskId, targetDate = null) {
        const state = _get();
        const dateStr = targetDate || App.utils.getFormattedDate();
        const tasks = state.tasksByDate[dateStr] || [];
        const task = tasks.find(t => t.id === taskId);

        if (!task || task.completed) {
            return false;
        }

        if (task.currentRepetitions >= task.dailyRepetitions.max) {
            return false;
        }

        task.currentRepetitions += 1;

        if (task.currentRepetitions >= task.dailyRepetitions.max) {
            task.completed = true;
            if (task.missionId) {
                App.state.trackMissionCompletion(task.missionId);
            }
        }
        
        _save();
        App.events.emit('taskCompleted', taskId);
        setTimeout(() => App.events.emit('todayTasksUpdated'), 1000);
        return true;
    }

    Object.assign(App.state, {
        unscheduleTaskForToday: unscheduleTaskForToday,
        addQuickTask: addQuickTask,
        updateTemporaryTask: updateTemporaryTask,
        deleteTemporaryTask: deleteTemporaryTask,
        recordTaskRepetition: recordTaskRepetition,

        completeTaskRepetition: function(taskId, options = {}) {
            const state = _get();
            const targetDate = options.targetDate || App.utils.getFormattedDate();
            const tasks = state.tasksByDate[targetDate] || [];
            const task = tasks.find(t => t.id === taskId);
        
            if (!task || task.completed) {
                if (task && task.completed) {
                    App.events.emit('shownotifyMessage', `"${task.name}" ya está completada.`);
                }
                return false;
            }
        
            if (task.currentRepetitions >= task.dailyRepetitions.max) {
                App.events.emit('shownotifyMessage', `Ya has alcanzado el límite de repeticiones para "${task.name}".`);
                return false;
            }
        
            task.currentRepetitions += 1;
        
            const bonusMissionId = App.state.getBonusMissionForToday();
            let pointsAwarded = task.points;
            if (task.missionId && task.missionId === bonusMissionId) {
                pointsAwarded *= 2;
            }
        
            App.state.addPoints(pointsAwarded, { 
                silentUI: options.silentUI || false 
            });
            
            App.state.addHistoryAction(
                `Misión: ${task.name} (${task.currentRepetitions}/${task.dailyRepetitions.max})`, 
                pointsAwarded, 
                'tarea'
            );
        
            if (task.currentRepetitions >= task.dailyRepetitions.max) {
                task.completed = true;
                if (task.missionId) {
                    App.state.trackMissionCompletion(task.missionId);
                }
        
                if (App.state.autoDeleteCompletedSingleDayMissions) {
                    setTimeout(() => {
                        App.state.autoDeleteCompletedSingleDayMissions();
                    }, 100);
                }
            } else {
                if (!options.silentUI) {
                    App.events.emit('shownotifyMessage', `¡${task.name} (${task.currentRepetitions}/${task.dailyRepetitions.max})! +${pointsAwarded}`);
                }
            }
        
            _save();
            
            App.events.emit('historyUpdated');
            App.events.emit('taskCompleted', taskId);
            setTimeout(() => App.events.emit('todayTasksUpdated'), 1000);
            
            return true;
        },
        
        deleteTodayTask: function(taskId, skipConfirm = false, targetDate = null) {
            const performDelete = () => {
                const state = _get();
                const dateStr = targetDate || App.utils.getFormattedDate();
                const tasks = state.tasksByDate[dateStr];
                const taskIndex = tasks ? tasks.findIndex(t => t.id === taskId) : -1;
    
                if (taskIndex !== -1) {
                    const taskName = tasks[taskIndex].name;
                    tasks.splice(taskIndex, 1);
                    state.tasksByDate[dateStr] = tasks;
                    _save();
                    App.events.emit('todayTasksUpdated');
                    if (!skipConfirm) {
                        App.events.emit('shownotifyMessage', `Tarea "${taskName}" eliminada.`);
                    }
                } else {
                    console.warn(`Intento de eliminar tarea con ID ${taskId} no encontrada.`);
                }
            };
    
            if (skipConfirm) {
                performDelete();
            } else {
                App.events.emit('showCustomConfirm', {
                    message: '¿Seguro que quieres eliminar esta tarea?',
                    callback: (confirmed) => {
                        if (confirmed) {
                            performDelete();
                        }
                    }
                });
            }
        },
    
        getTodayTasks: function(targetDate = null) {
            const dateStr = targetDate || App.utils.getFormattedDate();
            return _get().tasksByDate[dateStr] || [];
        },
        
        saveTodayTaskOrder: saveTodayTaskOrder,
        getTodayTaskOrder: getTodayTaskOrder,
    });

})(window.App = window.App || {});