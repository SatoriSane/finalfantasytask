// tab-missions/app-state-missions.js
(function(App) {
    'use strict';

    if (!App.state) {
        console.error("App.state is not initialized. Make sure app-state.js is loaded first.");
        return;
    }

    const _get = () => App.state.get();
    const _save = () => App.state.saveState();


    const missionState = {
        addMission: function(name, points, categoryId, dailyRepetitionsMax) {
            if (!name || !categoryId) {
                App.ui.general.showCustomAlert("El nombre y la categoría son obligatorios.");
                return null; // retorno explícito si falla
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
            App.events.emit('shownotifyMessage', `¡Misión "${name}" añadida!!!`);
        
            return newMission.id; // <-- solo devolvemos el id
        },
        
        

        
        deleteMission: function(missionId, skipConfirm = false) {
            const performDelete = () => {
                const state = _get();
                const missionName = state.missions.find(m => m.id === missionId)?.name || 'Misión';
                const missionIndex = state.missions.findIndex(m => m.id === missionId);
                if (missionIndex !== -1) {
                    state.missions.splice(missionIndex, 1);
                    state.scheduledMissions = state.scheduledMissions.filter(sm => sm.missionId !== missionId);
                    
                    // NO eliminar tareas de hoy - las tareas de hoy deben persistir
                    // incluso si se elimina la misión del libro de misiones
                    
                    _save();
                    App.events.emit('missionsUpdated');
                    App.events.emit('todayTasksUpdated');
                    App.events.emit('scheduledMissionsUpdated');
                    if (!skipConfirm) {
                        App.events.emit('shownotifyMessage', `Misión "${missionName}" eliminada.`);
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

        updateCategoryName: function(categoryId, newName) {
            const state = _get();
            const category = state.categories.find(c => c.id === categoryId);
            if (category) {
                category.name = newName;
                _save();
                App.events.emit('missionsUpdated');
                App.events.emit('shownotifyMessage', `Nombre de categoría actualizado a "${newName}".`);
            }
        },

        updateMission: function(missionId, updatedData) {
            const state = _get();
            const mission = state.missions.find(m => m.id === missionId);
            if (mission) {
                // 1. Actualiza la misión original (plantilla)
                Object.assign(mission, updatedData);

                // 2. Sincroniza los cambios con las tareas de HOY
                const today = App.utils.getFormattedDate();
                if (state.tasksByDate[today]) {
                    const taskToUpdate = state.tasksByDate[today].find(t => t.missionId === missionId);
                    if (taskToUpdate) {
                        taskToUpdate.name = mission.name;
                        taskToUpdate.points = mission.points;
                        taskToUpdate.dailyRepetitions.max = mission.dailyRepetitions.max;
                    }
                }

                // 3. Sincroniza los cambios con TODAS las misiones programadas (futuras)
                state.scheduledMissions.forEach(scheduled => {
                    if (scheduled.missionId === missionId) {
                        scheduled.name = mission.name;
                        scheduled.points = mission.points;
                        scheduled.dailyRepetitions = mission.dailyRepetitions;
                    }
                });

                _save();
                App.events.emit('missionsUpdated');
                App.events.emit('todayTasksUpdated');
                App.events.emit('scheduledMissionsUpdated'); // Notifica a la agenda que actualice
                App.events.emit('shownotifyMessage', `Misión "${mission.name}" actualizada.`);
            } else {
                App.events.emit('showAlert', 'No se pudo encontrar la misión para actualizar.');
            }
        },


        scheduleMission: function(missionId, initialDateString, isRecurring, recurringType) {
            const state = _get();
            const missionToProgram = state.missions.find(m => m.id === missionId);
            if (!missionToProgram) {
                App.ui.general.showCustomAlert("La misión que intentas programar no fue encontrada.");
                return;
            }
        
            const scheduledData = {
                id: `sm-${Date.now()}`,
                missionId: missionToProgram.id,
                name: missionToProgram.name,
                points: missionToProgram.points,
                categoryId: missionToProgram.categoryId, // ⭐ NUEVO: Preservar categoryId
                scheduledDate: initialDateString,
                isRecurring: isRecurring,
                dailyRepetitions: missionToProgram.dailyRepetitions,
                lastProcessedDate: null
            };
        
            if (isRecurring && recurringType) {
                scheduledData.repeatInterval = parseInt(recurringType.interval, 10) || 1;
                scheduledData.repeatUnit = recurringType.unit || 'day';
                scheduledData.repeatEndDate = recurringType.endDate || null;
                if (recurringType.daysOfWeek) {
                    scheduledData.daysOfWeek = recurringType.daysOfWeek;
                }
            }
        
            state.scheduledMissions.push(scheduledData);
        
            const todayFormatted = App.utils.getFormattedDate(new Date());
            if (initialDateString === todayFormatted) {
                const todayTasks = state.tasksByDate[todayFormatted] || [];
                const existingTask = todayTasks.find(t => t.missionId === missionId);
                if (existingTask && existingTask.skippedForToday) {
                    existingTask.skippedForToday = false;
                }
            }
        
            _save();
            App.state.processScheduledMissionsForToday();
            App.events.emit('scheduledMissionsUpdated');
            App.events.emit('missionsUpdated');
            App.events.emit('todayTasksUpdated');
            App.events.emit('shownotifyMessage', `Misión "${missionToProgram.name}" programada.`);
        },

        deleteScheduledMission: function(scheduledMissionId, skipConfirm = false) {
            const performDelete = () => {
                const state = _get();
                const missionName = state.scheduledMissions.find(sm => sm.id === scheduledMissionId)?.name || 'Misión programada';
                state.scheduledMissions = state.scheduledMissions.filter(sm => sm.id !== scheduledMissionId);
                _save();
                App.events.emit('scheduledMissionsUpdated');
                App.events.emit('missionsUpdated');
                App.events.emit('shownotifyMessage', `"${missionName}" ha sido desprogramada.`);
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
            App.events.emit('shownotifyMessage', `Categoría "${name}" añadida.`);
        },

        deleteCategory: function(categoryId, skipConfirm = false) {
            const performDelete = () => {
                const state = _get();
                const categoryName = state.categories.find(c => c.id === categoryId)?.name || 'Categoría';

                const missionsToDelete = state.missions.filter(m => m.categoryId === categoryId);
                missionsToDelete.forEach(mission => {
                    state.scheduledMissions = state.scheduledMissions.filter(sm => sm.missionId !== mission.id);
                    for (const date in state.tasksByDate) {
                        state.tasksByDate[date] = state.tasksByDate[date].filter(t => t.missionId !== mission.id);
                    }
                });

                state.missions = state.missions.filter(m => m.categoryId !== categoryId);
                state.categories = state.categories.filter(c => c.id !== categoryId);

                _save();
                App.events.emit('missionsUpdated');
                App.events.emit('todayTasksUpdated');
                App.events.emit('scheduledMissionsUpdated');
                if (!skipConfirm) {
                    App.events.emit('shownotifyMessage', `Categoría "${categoryName}" y sus misiones eliminadas.`);
                }
            };

            if (skipConfirm) {
                performDelete();
            } else {
                App.events.emit('showCustomConfirm', {
                    message: '¿Seguro que quieres eliminar esta categoría? Todas las misiones que contenga también se eliminarán.',
                    callback: (confirmed) => {
                        if (confirmed) {
                            performDelete();
                        }
                    }
                });
            }
        },

        // Función para verificar si una misión fue programada solo para un día específico
        isSingleDayMission: function(missionId, targetDate) {
            const state = _get();
            const scheduledMissions = state.scheduledMissions.filter(sm => sm.missionId === missionId);
            
            if (scheduledMissions.length === 0) return false;
            
            // Si hay múltiples programaciones, no es de un solo día
            if (scheduledMissions.length > 1) return false;
            
            const scheduled = scheduledMissions[0];
            
            // Si es recurrente, no es de un solo día
            if (scheduled.isRecurring) return false;
            
            // Verificar si la fecha programada coincide con la fecha objetivo
            return scheduled.scheduledDate === targetDate;
        },
        
        // Función para auto-eliminar misiones de un solo día que han sido completadas
        autoDeleteCompletedSingleDayMissions: function() {
            const state = _get();
            const today = App.utils.getFormattedDate();
            const todayTasks = state.tasksByDate[today] || [];
            
            // Buscar tareas completadas que correspondan a misiones de un solo día
            const completedTasks = todayTasks.filter(task => 
                task.completed && 
                task.missionId && 
                this.isSingleDayMission(task.missionId, today)
            );
            
            let deletedCount = 0;
            completedTasks.forEach(task => {
                const mission = state.missions.find(m => m.id === task.missionId);
                if (mission) {
                    // Eliminar la misión del libro de misiones
                    const missionIndex = state.missions.findIndex(m => m.id === task.missionId);
                    if (missionIndex !== -1) {
                        state.missions.splice(missionIndex, 1);
                        // También eliminar la programación
                        state.scheduledMissions = state.scheduledMissions.filter(sm => sm.missionId !== task.missionId);
                        deletedCount++;
                        console.log(`Auto-eliminada misión de un día completada: "${mission.name}"`);
                    }
                }
            });
            
            if (deletedCount > 0) {
                _save();
                App.events.emit('missionsUpdated');
                App.events.emit('scheduledMissionsUpdated');
            }
            
            return deletedCount;
        },

        getMissionById: (id) => _get().missions.find(m => m.id === id),
        getCategoryById: (id) => _get().categories.find(c => c.id === id),
        getCategories: () => _get().categories,
        getMissions: () => _get().missions,
        getScheduledMissions: () => _get().scheduledMissions,
        getScheduledMissionByOriginalMissionId: (id) => _get().scheduledMissions.find(sm => sm.missionId === id),
    };

    Object.assign(App.state, missionState);

})(window.App = window.App || {});