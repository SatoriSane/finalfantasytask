(function(App) {
    if (!App.state) {
        console.error("App.state is not initialized. Make sure app-state.js is loaded first.");
        return;
    }

    const _get = () => App.state.get();
    const _save = () => App.state.saveState();


    const missionState = {
        addMission: function(name, points, categoryId, dailyRepetitionsMax) {
            if (!name || !categoryId) {
                App.ui.events.showCustomAlert("El nombre y la categoría son obligatorios.");
                return;
            }
            const state = _get();
            const newMission = {
                id: `m-${Date.now()}`,
                name,
                points: parseInt(points, 10) || 0,
                categoryId,
                dailyRepetitions: { max: parseInt(dailyRepetitionsMax, 10) || 1 }
            };
            state.missions.push(newMission);
            _save();
            App.events.emit('missionsUpdated');
            App.events.emit('showDiscreetMessage', `¡Misión "${name}" añadida!`);
        },

        deleteMission: function(missionId, skipConfirm = false) {
            const performDelete = () => {
                const state = _get();
                const missionName = state.missions.find(m => m.id === missionId)?.name || 'Misión';
                const missionIndex = state.missions.findIndex(m => m.id === missionId);
                if (missionIndex !== -1) {
                    state.missions.splice(missionIndex, 1);
                    state.scheduledMissions = state.scheduledMissions.filter(sm => sm.missionId !== missionId);
                    const today = App.utils.getFormattedDate();
                    if (state.tasksByDate[today]) {
                        state.tasksByDate[today] = state.tasksByDate[today].filter(t => t.missionId !== missionId);
                    }

                    _save();
                    App.events.emit('missionsUpdated');
                    App.events.emit('todayTasksUpdated');
                    App.events.emit('scheduledMissionsUpdated');
                    if (!skipConfirm) {
                        App.events.emit('showDiscreetMessage', `Misión "${missionName}" eliminada.`);
                    }
                }
            };

            if (skipConfirm) {
                performDelete();
            } else {
                App.events.emit('showCustomConfirm', {
                    message: '¿Estás seguro de que quieres eliminar esta misión?',
                    callback: (confirmed) => {
                        if (confirmed) {
                            performDelete();
                        }
                    }
                });
            }
        },

        updateMission: function(missionId, updatedData) {
            const state = _get();
            const mission = state.missions.find(m => m.id === missionId);
            if (mission) {
                Object.assign(mission, updatedData);

                // Sync changes with today's tasks if any
                const today = App.utils.getFormattedDate();
                if (state.tasksByDate[today]) {
                    const taskToUpdate = state.tasksByDate[today].find(t => t.missionId === missionId);
                    if (taskToUpdate) {
                        taskToUpdate.name = mission.name;
                        taskToUpdate.points = mission.points;
                        taskToUpdate.dailyRepetitions.max = mission.dailyRepetitions.max;
                    }
                }

                _save();
                App.events.emit('missionsUpdated');
                App.events.emit('todayTasksUpdated');
                App.events.emit('showDiscreetMessage', `Misión "${mission.name}" actualizada.`);
            } else {
                App.events.emit('showAlert', 'No se pudo encontrar la misión para actualizar.');
            }
        },

        scheduleMission: function(missionId, initialDateString, isRecurring, recurringType) {
            const state = _get();
            const missionToProgram = state.missions.find(m => m.id === missionId);
            if (!missionToProgram) {
                App.ui.events.showCustomAlert("La misión que intentas programar no fue encontrada.");
                return;
            }
            
            const scheduledData = {
                id: `sm-${Date.now()}`,
                missionId: missionToProgram.id,
                name: missionToProgram.name,
                points: missionToProgram.points,
                scheduledDate: initialDateString,
                isRecurring: isRecurring,
                dailyRepetitions: missionToProgram.dailyRepetitions,
                lastProcessedDate: null
            };

            // Si es recurrente, agregar propiedades de recurrencia
            if (isRecurring && recurringType) {
                scheduledData.repeatInterval = parseInt(recurringType.interval, 10) || 1;
                scheduledData.repeatUnit = recurringType.unit || 'day';
                scheduledData.repeatEndDate = recurringType.endDate || null;
                if (recurringType.daysOfWeek) {
                    scheduledData.daysOfWeek = recurringType.daysOfWeek;
                }
            }

            state.scheduledMissions.push(scheduledData);
            
            // Si se programa para hoy, resetear skippedForToday si existe
            const todayFormatted = App.utils.getFormattedDate(new Date());
            if (initialDateString === todayFormatted) {
                const todayTasks = state.tasksByDate[todayFormatted] || [];
                const existingTask = todayTasks.find(t => t.missionId === missionId);
                if (existingTask && existingTask.skippedForToday) {
                    existingTask.skippedForToday = false;
                }
            }
            
            _save();

            // Procesa las misiones programadas para hoy para asegurar que la nueva misión aparezca si es para hoy.
            App.state.processScheduledMissionsForToday();

            App.events.emit('scheduledMissionsUpdated');
            App.events.emit('missionsUpdated');
            App.events.emit('todayTasksUpdated');
            App.events.emit('showDiscreetMessage', `Misión "${missionToProgram.name}" programada.`);
        },

        deleteScheduledMission: function(scheduledMissionId, skipConfirm = false) {
            const performDelete = () => {
                const state = _get();
                const missionName = state.scheduledMissions.find(sm => sm.id === scheduledMissionId)?.name || 'Misión programada';
                state.scheduledMissions = state.scheduledMissions.filter(sm => sm.id !== scheduledMissionId);
                _save();
                App.events.emit('scheduledMissionsUpdated'); // Notifica que las misiones programadas han cambiado
                App.events.emit('missionsUpdated'); // Emitir para actualizar iconos en la UI
                App.events.emit('showDiscreetMessage', `"${missionName}" ha sido desprogramada.`);
            };

            if (skipConfirm) {
                performDelete();
            } else {
                App.events.emit('showCustomConfirm', {
                    message: '¿Estás seguro de que quieres desprogramar esta misión?',
                    callback: (confirmed) => {
                        if (confirmed) {
                            performDelete();
                        }
                    }
                });
            }
        },

        addCategory: function(name) {
            const state = _get();
            if (state.categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
                App.events.emit('showAlert', "Ya existe una categoría con ese nombre.");
                return;
            }
            const newCategory = { id: `cat-${Date.now()}`, name };
            state.categories.push(newCategory);
            _save();
            App.events.emit('missionsUpdated');
            App.events.emit('showDiscreetMessage', `Categoría "${name}" añadida.`);
        },

        deleteCategory: function(categoryId) {
            App.events.emit('showCustomConfirm', '¿Seguro que quieres eliminar esta categoría? Todas las misiones que contenga también se eliminarán.', (confirmed) => {
                if (confirmed) {
                    const state = _get();
                    const categoryName = state.categories.find(c => c.id === categoryId)?.name || 'Categoría';
                    
                    // Eliminar todas las misiones de esta categoría
                    const missionsToDelete = state.missions.filter(m => m.categoryId === categoryId);
                    missionsToDelete.forEach(mission => {
                        // Eliminar de tareas programadas
                        state.scheduledMissions = state.scheduledMissions.filter(sm => sm.missionId !== mission.id);
                        // Eliminar de tareas diarias
                        for (const date in state.tasksByDate) {
                            state.tasksByDate[date] = state.tasksByDate[date].filter(t => t.missionId !== mission.id);
                        }
                    });
                    
                    // Eliminar las misiones de la categoría
                    state.missions = state.missions.filter(m => m.categoryId !== categoryId);
                    // Eliminar la categoría
                    state.categories = state.categories.filter(c => c.id !== categoryId);
                    
                    _save();
                    App.events.emit('missionsUpdated');
                    App.events.emit('todayTasksUpdated');
                    App.events.emit('scheduledMissionsUpdated');
                    App.events.emit('showDiscreetMessage', `Categoría "${categoryName}" y sus misiones eliminadas.`);
                }
            });
        },

        getMissionById: (id) => _get().missions.find(m => m.id === id),
        getCategoryById: (id) => _get().categories.find(c => c.id === id),
        getCategories: () => _get().categories,
        getMissions: () => _get().missions,
        getScheduledMissions: () => _get().scheduledMissions,
        getScheduledMissionByOriginalMissionId: (id) => _get().scheduledMissions.find(sm => sm.missionId === id)
    };

    Object.assign(App.state, missionState);

})(window.App = window.App || {});
