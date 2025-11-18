// tab-missions/app-state-missions.js
(function(App) {
    'use strict';

    if (!App.state) {
        console.error("App.state is not initialized. Make sure app-state.js is loaded first.");
        return;
    }

    const _get = () => App.state.get();
    const _save = () => App.state.saveState();

    /**
     * Calcula y asigna el peso (orderWeight) de una misión según su hora programada
     * @param {Object} mission - La misión a la que asignar peso
     * @param {Object|null} scheduleTime - Objeto con la hora programada {time: "HH:MM"} o null
     * @returns {number} - El peso asignado
     */
    function calculateAndAssignMissionWeight(mission, scheduleTime = null) {
        const state = _get();
        
        if (scheduleTime && scheduleTime.time) {
            // Si tiene hora, calcular peso cronológico
            const [hours, minutes] = scheduleTime.time.split(':').map(Number);
            // Fórmula: peso = 1000 - (horas * 37.5 + minutos * 0.625)
            // Distribuye 00:00 = 1000 hasta 23:59 = 100
            const calculatedWeight = Math.round(1000 - (hours * 37.5 + minutes * 0.625));
            mission.orderWeight = Math.max(100, Math.min(1000, calculatedWeight));
            console.log(`🕐 Peso cronológico asignado para hora ${scheduleTime.time}: ${mission.orderWeight}`);
        } else {
            // Si NO tiene hora, asignar peso máximo para que aparezca al principio
            const maxWeight = Math.max(...state.missions.map(m => m.orderWeight || 500), 1000);
            mission.orderWeight = maxWeight + 1;
            console.log(`✨ Peso máximo asignado (sin hora): ${mission.orderWeight}`);
        }
        
        return mission.orderWeight;
    }

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
                dailyRepetitions: { max: parseInt(dailyRepetitionsMax, 10) || 1 },
                orderWeight: 500 // Peso neutral por defecto (rango: 0-1000)
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


        scheduleMission: function(missionId, initialDateString, isRecurring, recurringType, scheduleTime, scheduleDuration) {
            const state = _get();
            const missionToProgram = state.missions.find(m => m.id === missionId);
            if (!missionToProgram) {
                App.ui.general.showCustomAlert("La misión que intentas programar no fue encontrada.");
                return;
            }
            
            // ⭐ Verificar si la misión ya estaba programada
            const wasAlreadyScheduled = state.scheduledMissions.some(sm => sm.missionId === missionId);
            
            // ⭐ Si es una misión nueva (no estaba programada), asignar peso automático
            if (!wasAlreadyScheduled) {
                calculateAndAssignMissionWeight(missionToProgram, scheduleTime);
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
                lastProcessedDate: null,
                scheduleTime: scheduleTime || null, // ⏰ Hora del día (opcional)
                scheduleDuration: scheduleDuration || null // ⏱️ Duración estimada (opcional)
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
        
            // ⭐ FIX: Actualizar scheduleTime y scheduleDuration en TODAS las tareas existentes
            // de esta misión en tasksByDate (no solo hoy)
            if (state.tasksByDate) {
                Object.keys(state.tasksByDate).forEach(dateKey => {
                    const tasksForDate = state.tasksByDate[dateKey];
                    if (Array.isArray(tasksForDate)) {
                        tasksForDate.forEach(task => {
                            if (task.missionId === missionId) {
                                // Actualizar hora y duración en todas las instancias de esta misión
                                task.scheduleTime = scheduleTime || null;
                                task.scheduleDuration = scheduleDuration || null;
                                
                                // Si es para hoy y estaba marcada como omitida, reactivarla
                                const todayFormatted = App.utils.getFormattedDate(new Date());
                                if (dateKey === todayFormatted && task.skippedForToday) {
                                    task.skippedForToday = false;
                                }
                            }
                        });
                    }
                });
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

        /**
         * Actualiza los pesos de orden de las misiones basándose en el orden actual de las tareas
         * @param {Array<string>} taskIds - Array de IDs de tareas en el orden deseado
         * @param {string} dateStr - Fecha de las tareas (formato YYYY-MM-DD)
         */
        updateMissionOrderWeights: function(taskIds, dateStr) {
            const state = _get();
            
            console.log('🔄 Actualizando pesos de orden:', {
                fecha: dateStr,
                totalTareas: taskIds.length,
                taskIds: taskIds
            });
            
            // Obtener las tareas de la fecha - puede ser string o Date
            const tasksForDate = App.state.getTasksForDate(dateStr);
            
            console.log(`  📦 Total de tareas para ${dateStr}: ${tasksForDate.length}`);
            console.log('  📋 IDs de tareas obtenidas:', tasksForDate.map(t => t.id));
            console.log('  📋 IDs de tareas que estamos buscando:', taskIds);
            
            // Calcular peso basado en posición: primera tarea = 1000, última = 100
            const maxWeight = 1000;
            const minWeight = 100;
            const weightRange = maxWeight - minWeight;
            
            let updatedCount = 0;
            const processedMissions = new Set(); // Para evitar actualizar la misma misión múltiples veces
            
            taskIds.forEach((taskId, index) => {
                // Buscar la tarea por ID en las tareas de esta fecha
                const task = tasksForDate.find(t => t.id === taskId);
                
                if (task) {
                    console.log(`  🔍 Tarea encontrada: ${task.name}, missionId: ${task.missionId || 'ninguno'}`);
                    
                    if (task.missionId && !processedMissions.has(task.missionId)) {
                        const mission = state.missions.find(m => m.id === task.missionId);
                        if (mission) {
                            // Calcular peso: posición 0 = 1000, última posición = 100
                            const weight = maxWeight - (index * (weightRange / Math.max(taskIds.length - 1, 1)));
                            const oldWeight = mission.orderWeight;
                            mission.orderWeight = Math.round(weight);
                            processedMissions.add(task.missionId);
                            updatedCount++;
                            
                            console.log(`  ✅ ${mission.name}: ${oldWeight} → ${mission.orderWeight} (posición ${index + 1})`);
                        } else {
                            console.log(`  ⚠️ Misión no encontrada para task.missionId: ${task.missionId}`);
                        }
                    } else if (!task.missionId) {
                        console.log(`  ℹ️ Tarea sin missionId (tarea temporal): ${task.name}`);
                    } else {
                        console.log(`  ⏭️ Misión ya procesada: ${task.missionId}`);
                    }
                } else {
                    console.log(`  ❌ Tarea no encontrada con ID: ${taskId}`);
                }
            });
            
            _save();
            console.log(`✨ Pesos actualizados: ${updatedCount} misiones`);
        },

        getMissionById: (id) => _get().missions.find(m => m.id === id),
        getCategoryById: (id) => _get().categories.find(c => c.id === id),
        getCategories: () => _get().categories,
        getMissions: () => _get().missions,
        getScheduledMissions: () => _get().scheduledMissions,
        getScheduledMissionByOriginalMissionId: (id) => _get().scheduledMissions.find(sm => sm.missionId === id),
        
        // ⭐ Función centralizada para calcular peso de misiones
        calculateAndAssignMissionWeight: calculateAndAssignMissionWeight,
    };

    Object.assign(App.state, missionState);

})(window.App = window.App || {});