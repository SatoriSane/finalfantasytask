// global/js/app-state.js
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
        missionStats: {}, // NUEVO: Para rastrear apariciones y compleciones de misiones
        dailyBonusMission: null, // { date: "YYYY-MM-DD", missionId: "..." }
        habits: { // NUEVO: Sección de hábitos
            challenges: [], // Retos para dejar hábitos
            routines: [] // Rutinas para crear hábitos
        },
        lastDate: "",
        todayOrder: {}, // NUEVO: Para guardar el orden de las tareas de hoy.
    };

    function _saveStateToLocalStorage() {
        localStorage.setItem("pointsAppState", JSON.stringify(state));
    }

    /**
     * @description Determina si una misión programada debe ejecutarse en una fecha específica.
     * @param {object} scheduledMission - La misión programada.
     * @param {Date} date - La fecha a comprobar (objeto Date normalizado).
     * @returns {boolean} - True si la misión está programada para esa fecha.
     */
    function _isMissionScheduledForDate(scheduledMission, date) {
        const startDate = App.utils.normalizeDateToStartOfDay(scheduledMission.scheduledDate);
        if (!startDate || date < startDate) {
            return false; // La fecha es anterior al inicio de la programación.
        }

        const endDate = scheduledMission.repeatEndDate ? App.utils.normalizeDateToStartOfDay(scheduledMission.repeatEndDate) : null;
        if (endDate && date > endDate) {
            return false; // La fecha es posterior al final de la programación.
        }

        if (!scheduledMission.isRecurring) {
            return startDate.getTime() === date.getTime(); // No recurrente, solo coincide el día de inicio.
        }

        // Lógica de recurrencia
        switch (scheduledMission.repeatUnit) {
            case 'day':
                const diffDaysDaily = (date.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
                return diffDaysDaily % scheduledMission.repeatInterval === 0;
            case 'week':
                if (!scheduledMission.daysOfWeek || scheduledMission.daysOfWeek.length === 0) {
                    return false; // No hay días seleccionados para la repetición semanal.
                }
                const dayOfWeek = date.getDay();
                
                // Verificar que el día de la semana coincida con los días seleccionados
                if (!scheduledMission.daysOfWeek.includes(String(dayOfWeek))) {
                    return false;
                }
                
                // Calcular el número de semanas completas desde la fecha de inicio
                // Primero, encontrar el primer día de la semana de inicio (domingo = 0)
                const startDayOfWeek = startDate.getDay();
                const daysToFirstOccurrence = (dayOfWeek - startDayOfWeek + 7) % 7;
                const firstOccurrenceDate = new Date(startDate);
                firstOccurrenceDate.setDate(startDate.getDate() + daysToFirstOccurrence);
                
                // Si la fecha actual es antes de la primera ocurrencia, no aplica
                if (date < firstOccurrenceDate) {
                    return false;
                }
                
                // Calcular semanas desde la primera ocurrencia
                const diffDaysWeekly = Math.floor((date.getTime() - firstOccurrenceDate.getTime()) / (1000 * 3600 * 24));
                const diffWeeks = Math.floor(diffDaysWeekly / 7);
                
                // Verificar que el número de semanas sea múltiplo del intervalo
                return diffWeeks % scheduledMission.repeatInterval === 0;
            case 'month':
                let monthDiff = (date.getFullYear() - startDate.getFullYear()) * 12 + (date.getMonth() - startDate.getMonth());
                if (monthDiff < 0 || monthDiff % scheduledMission.repeatInterval !== 0) {
                    return false;
                }
                
                // Obtener el día programado originalmente
                const scheduledDay = startDate.getDate();
                
                // Obtener el último día del mes actual
                const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
                
                // Si el día programado existe en este mes, debe coincidir exactamente
                if (scheduledDay <= lastDayOfMonth) {
                    return date.getDate() === scheduledDay;
                }
                
                // Si el día programado no existe (ej: 31 en febrero), usar el último día del mes
                return date.getDate() === lastDayOfMonth;
            case 'year':
                let yearDiff = date.getFullYear() - startDate.getFullYear();
                return date.getMonth() === startDate.getMonth() && date.getDate() === startDate.getDate() && yearDiff >= 0 && yearDiff % scheduledMission.repeatInterval === 0;
            default:
                return false;
        }
    }

    App.state = {
        resetAllExceptHabits: function() {
            const currentState = App.state.get();
        
            const habits = currentState.habits || { challenges: [], routines: [] };
        
            const newState = {
                points: 0,
                missions: [],
                categories: [],
                history: [],
                scheduledMissions: [],
                shopItems: [],
                missionStats: {},
                dailyBonusMission: null,
                todayOrder: {},
                tasksByDate: {},
                habits: habits
            };
        
            App.state.loadState(newState);
            App.events.emit('stateRefreshed');
        },
        
        
        getState: function() {
            return state;
        },

        getPointsHistory: function() {
            return state.pointsHistory;
        },

// ============================================
// Record resistance to a temptation
// ============================================
recordResistance: function(challengeId, challengeName) {
    const challenge = this.getChallengeById(challengeId);
    if (challenge) {
        challenge.secondChanceUsed = true;
        this.addPoints(1);
        
        // ✅ MEJORADO: Usar tipo específico en lugar de texto genérico
        this.addHistoryAction(
            `Resistencia: ${challengeName}`, 
            1, 
            'habit_resistance'
        );
        
        this.saveState();
    }
},

        getTodayPoints: function() {
            const todayStr = App.utils.getFormattedDate();
            const todayHistory = state.history.find(h => h.date === todayStr);
            return todayHistory ? todayHistory.earned : 0;
        },
        get: () => state,

        loadState: function(importedState) {
            state = importedState;

            // --- Migración de challenges al nuevo sistema de tickets ---
            if (state.habits && Array.isArray(state.habits.challenges)) {
                state.habits.challenges.forEach(challenge => {
                    // Migrar campos antiguos al nuevo sistema
                    if (!challenge.lastTicketGeneratedTime && challenge.createdAt) {
                        // Migrar desde sistema antiguo
                        challenge.lastTicketGeneratedTime = challenge.createdAt;
                    }
                    
                    // Eliminar campos obsoletos del sistema antiguo
                    delete challenge.nextTicketTime;
                    delete challenge.nextAllowedTime;
                    delete challenge.availableConsumptions;
                });
            }
            // --- FIN DEL BLOQUE ---

            _saveStateToLocalStorage();
            App.events.emit('stateRefreshed');
        },

        processScheduledMissionsForToday: function() {
            const todayStr = App.utils.getFormattedDate();
            if (!state.tasksByDate[todayStr]) {
                state.tasksByDate[todayStr] = [];
            }
        
            const todayDateObj = App.utils.normalizeDateToStartOfDay(new Date());
        
            state.scheduledMissions.forEach(sm => {
                const isScheduledForToday = _isMissionScheduledForDate(sm, todayDateObj);
                if (!isScheduledForToday || (sm.skippedDates && sm.skippedDates.includes(todayStr))) {
                    return;
                }
        
                const existingTask = state.tasksByDate[todayStr].find(t => t.missionId === sm.missionId);
        
                if (!existingTask) {
                    // ⭐ CRÍTICO: Obtener categoryId de la misión original para preservarlo
                    const originalMission = state.missions.find(m => m.id === sm.missionId);
                    const categoryId = originalMission ? originalMission.categoryId : null;
                    
                    state.tasksByDate[todayStr].push({
                        id: App.utils.genId("task"),
                        name: sm.name,
                        points: sm.points,
                        missionId: sm.missionId,
                        categoryId: categoryId, // ⭐ NUEVO: Guardar categoryId directamente en la tarea
                        completed: false,
                        currentRepetitions: 0,
                        dailyRepetitions: { max: sm.dailyRepetitions ? sm.dailyRepetitions.max : 1 }
                    });
                    this.trackMissionAppearance(sm.missionId);
                }
            });
        },

        addPoints: function(amount, options = {}) {
            if (typeof amount === 'number' && !isNaN(amount)) {
                state.points += amount;
                
                // Solo emitir el evento si no se especificó silentUI
                if (!options.silentUI) {
                    App.events.emit('pointsUpdated', state.points);
                }
            }
        },
        getHabits: () => ({ ...state.habits }),

        getChallengeById: function(challengeId) {
            return state.habits.challenges.find(c => c.id === challengeId);
        },

        updateChallenge: function(challengeId, updates) {
            const challenge = this.getChallengeById(challengeId);
            if (challenge) {
                Object.assign(challenge, updates);
            }
        },

        saveState: function(options = {}) {
            _saveStateToLocalStorage();
            
            // Emitir evento genérico de cambio de estado si no se especifica silencio
            // Esto asegura que GitHub Sync detecte TODOS los cambios
            if (!options.silent) {
                App.events.emit('stateChanged', { timestamp: Date.now() });
            }
        },

        addHistoryAction: function(name, points, type) {
            const todayStr = App.utils.getFormattedDate();
            let histDay = state.history.find(h => h.date === todayStr);
            if (!histDay) {
                histDay = { date: todayStr, earned: 0, spent: 0, actions: [] };
                state.history.push(histDay);
            }
            histDay.earned += points;
            histDay.actions.push({ name, points, type });
        },

        processDailyTasks: function() {
            const today = App.utils.getFormattedDate();
            const yesterday = App.utils.getFormattedDate(App.utils.addDateUnit(new Date(), -1, 'day'));
            console.log(`Procesando tareas para el día: ${today}`);

            // 1. Inicializar la lista de tareas de hoy si no existe
            if (!state.tasksByDate[today]) {
                state.tasksByDate[today] = [];
            }

            // 2. Reiniciar el estado de compra de los items de la tienda
            state.shopItems.forEach(item => {
                if (item.purchasedTodayDate) {
                    const purchasedDateOnly = App.utils.getFormattedDate(new Date(item.purchasedTodayDate));
                    if (purchasedDateOnly !== today) {
                        item.purchasedTodayDate = null;
                    }
                }
            });

            // 3. Limpiar la misión con bonus del día anterior
            if (state.dailyBonusMission && state.dailyBonusMission.date !== today) {
                state.dailyBonusMission = null;
            }

            // 4. Actualizar la fecha de última carga y guardar
            state.lastDate = today;
            _saveStateToLocalStorage();
        },


        load: function() {
            console.log("App.state: Attempting to load state from localStorage...");
            const s = localStorage.getItem("pointsAppState");
            let dataLoadedSuccessfully = false;
        
            if (s) {
                try {
                    state = JSON.parse(s);
                    dataLoadedSuccessfully = true;
        
                    // --- Migración y retrocompatibilidad ---
                    if (typeof state.missionStats === 'undefined') {
                        state.missionStats = {};
                    }
                    if (typeof state.dailyBonusMission === 'undefined') {
                        state.dailyBonusMission = null;
                    }
                    if (typeof state.todayOrder === 'undefined') {
                        state.todayOrder = {};
                    }
                    
                    // ⭐ NUEVO: Migración de orderWeight para misiones existentes
                    if (state.missions && Array.isArray(state.missions)) {
                        state.missions.forEach(mission => {
                            if (typeof mission.orderWeight === 'undefined') {
                                mission.orderWeight = 500; // Peso neutral por defecto
                            }
                        });
                    }
        
                } catch (e) {
                    console.error("App.state: Error parsing localStorage data:", e);
                    this.resetAllData();
                    return false;
                }
            } else {
                console.log("App.state: No saved state found. Initializing default state.");
                this.resetAllData();
                dataLoadedSuccessfully = true;
            }
        
            // ⭐ NUEVO: Asegurar que "Propósito esporádico" siempre exista
            if (!state.categories.find(c => c.name === "Propósito esporádico")) {
                state.categories.push({
                    id: `cat-sporadic-${Date.now()}`,
                    name: "Propósito esporádico"
                });
                _saveStateToLocalStorage();
                console.log("App.state: Created default 'Propósito esporádico' category.");
            }
        
            const today = App.utils.getFormattedDate(new Date());
            if (state.lastDate !== today) {
                console.log(`App.state: New day detected. Processing daily tasks for ${today}.`);
                this.processDailyTasks();
            }
        
            this.processScheduledMissionsForToday();
        
            return dataLoadedSuccessfully;
        },

        resetAllData: function() {
            state = {
                points: 0,
                categories: [],
                missions: [],
                tasksByDate: {},
                scheduledMissions: [],
                shopItems: [],
                history: [],
                lastDate: "",
                missionStats: {}, // Reiniciar también las estadísticas
                dailyBonusMission: null,
                habits: {
                    challenges: [],
                    routines: []
                },
                todayOrder: {} // Reiniciar también el orden
            };
            localStorage.removeItem("pointsAppState");
            _saveStateToLocalStorage();
            App.events.emit('stateRefreshed');
        },

        resetHistoryOnly: function() {
            state.history = [];
            state.tasksByDate = {};
            _saveStateToLocalStorage();
            App.events.emit('historyUpdated');
            App.events.emit('todayTasksUpdated');
        },

        // --- Getters de Estado ---
        getHistory: () => [...state.history],
        getPoints: () => state.points,

        trackMissionAppearance: function(missionId) {
            const todayStr = App.utils.getFormattedDate();
            if (!state.missionStats[missionId]) {
                state.missionStats[missionId] = {
                    appearances: [],
                    completions: []
                };
            }
            if (!state.missionStats[missionId].appearances.includes(todayStr)) {
                state.missionStats[missionId].appearances.push(todayStr);
            }
        },

        getBonusMissionForToday: function() {
            const todayStr = App.utils.getFormattedDate();

            // Si ya existe un bonus para hoy y es válido (no es null), lo devuelve.
            if (state.dailyBonusMission && state.dailyBonusMission.date === todayStr && state.dailyBonusMission.missionId) {
                return state.dailyBonusMission.missionId;
            }

            const todayTasks = state.tasksByDate[todayStr] || [];
            const missionIdsForToday = [...new Set(todayTasks.map(t => t.missionId).filter(Boolean))];

            if (missionIdsForToday.length === 0) {
                return null;
            }

            const thirtyDaysAgo = App.utils.addDateUnit(new Date(), -30, 'day');
            let worstMissionId = null;
            let lowestRatio = Infinity;

            missionIdsForToday.forEach(missionId => {
                const stats = state.missionStats[missionId];
                if (!stats) return;

                const recentAppearances = stats.appearances.filter(dateStr => new Date(dateStr) >= thirtyDaysAgo).length;
                const recentCompletions = stats.completions.filter(dateStr => new Date(dateStr) >= thirtyDaysAgo).length;

                if (recentAppearances > 0) {
                    const ratio = recentCompletions / recentAppearances;
                    if (ratio < lowestRatio) {
                        lowestRatio = ratio;
                        worstMissionId = missionId;
                    }
                }
            });

            // --- LÓGICA DE RESPALDO ---
            // Si no se encontró ninguna misión con estadísticas (ej. datos importados),
            // se asigna el bonus a la primera misión de hoy para garantizar que siempre haya una.
            if (worstMissionId === null && missionIdsForToday.length > 0) {
                worstMissionId = missionIdsForToday[0];
            }

            state.dailyBonusMission = {
                date: todayStr,
                missionId: worstMissionId
            };

            return worstMissionId;
        },

        trackMissionCompletion: function(missionId) {
            const todayStr = App.utils.getFormattedDate();
            if (!state.missionStats[missionId]) {
                state.missionStats[missionId] = {
                    appearances: [],
                    completions: []
                };
            }
            if (!state.missionStats[missionId].completions.includes(todayStr)) {
                state.missionStats[missionId].completions.push(todayStr);
            }
        },

        recordResistance: function(challengeId, challengeName) {
            const challenge = this.getAbstinenceChallengeById(challengeId);
            if (challenge) {
                challenge.secondChanceUsed = true;
                this.addPoints(1);
                this.addHistoryAction(`Resistencia en ${challengeName}`, 1, 'abstinencia');
                this.saveState(); // This will trigger pointsUpdated, historyUpdated, and habitsUpdated events
            }
        },
        // --- Preferencias del usuario ---
        getLastSelectedCategory: function() {
            try {
                return localStorage.getItem("fftask_last_selected_category") || null;
            } catch (e) {
                console.warn("Error getting last selected category:", e);
                return null;
            }
        },

        setLastSelectedCategory: function(categoryId) {
            try {
                if (categoryId) {
                    localStorage.setItem("fftask_last_selected_category", categoryId);
                } else {
                    localStorage.removeItem("fftask_last_selected_category");
                }
            } catch (e) {
                console.warn("Error saving last selected category:", e);
            }
        },
        /**
         * Calcula la suma total de puntos de todas las misiones programadas para una fecha específica.
         * @param {Date|string} date - La fecha a consultar (objeto Date o string "YYYY-MM-DD")
         * @returns {number} - Suma total de puntos
         */
        getScheduledPointsForDate: function(date) {
            const dateObj = typeof date === 'string' ? App.utils.normalizeDateToStartOfDay(new Date(date)) : App.utils.normalizeDateToStartOfDay(date);
            if (!dateObj) return 0;
            
            const dateStr = App.utils.getFormattedDate(dateObj);
            let totalPoints = 0;
            
            // Contar tareas directas en tasksByDate
            const tasksForDate = (state.tasksByDate && state.tasksByDate[dateStr]) ? state.tasksByDate[dateStr] : [];
            tasksForDate.forEach(task => {
                totalPoints += (task.points || 0) * (task.dailyRepetitions?.max || 1);
            });
            
            // Crear un Set con los missionId que ya existen en tasksForDate para evitar duplicados
            const existingMissionIds = new Set(tasksForDate.filter(t => t.missionId).map(t => t.missionId));
            
            // Contar misiones programadas que aplican para esta fecha
            state.scheduledMissions.forEach(sm => {
                // Si ya existe en tasksByDate, no contarla de nuevo
                if (existingMissionIds.has(sm.missionId)) {
                    return;
                }
                
                // Verificar si está omitida para esta fecha
                if (sm.skippedDates && sm.skippedDates.includes(dateStr)) {
                    return;
                }
                
                // Verificar si la misión está programada para esta fecha
                if (_isMissionScheduledForDate(sm, dateObj)) {
                    totalPoints += (sm.points || 0) * (sm.dailyRepetitions?.max || 1);
                }
            });
            
            return totalPoints;
        },

        /**
         * Devuelve todas las misiones visibles en una fecha dada.
         * Incluye tanto tareas directas de tasksByDate como misiones programadas/recurrentes.
         */

        getTasksForDate: function(viewDate) {
            const viewDateObj = App.utils.normalizeDateToStartOfDay(viewDate);
            if (!viewDateObj) return [];
            const viewDateStr = App.utils.getFormattedDate(viewDateObj);

            const state = App.state.getState();
            
            // Obtener las tareas directas de tasksByDate
            const tasksForDate = (state.tasksByDate && state.tasksByDate[viewDateStr])
                ? [...state.tasksByDate[viewDateStr]]
                : [];

            // Crear un Set con los missionId que ya existen en tasksForDate
            // para evitar duplicados
            const existingMissionIds = new Set(
                tasksForDate
                    .filter(t => t.missionId)
                    .map(t => t.missionId)
            );

            const scheduled = state.scheduledMissions;
            if (!Array.isArray(scheduled)) return tasksForDate;

            scheduled.forEach(sch => {
                // ⭐ CRÍTICO: Si esta misión ya existe en tasksByDate, NO agregarla
                if (existingMissionIds.has(sch.missionId)) {
                    return; // Skip - ya existe
                }

                // Verificar si está omitida para esta fecha
                if (sch.skippedDates && sch.skippedDates.includes(viewDateStr)) {
                    return; // Skip - fue omitida
                }

                // Normaliza las fechas
                const startObj = App.utils.normalizeDateToStartOfDay(sch.scheduledDate);
                const endObj = sch.repeatEndDate ? App.utils.normalizeDateToStartOfDay(sch.repeatEndDate) : null;

                if (!sch.isRecurring) {
                    const schDateStr = App.utils.getFormattedDate(startObj);
                    if (schDateStr === viewDateStr) {
                        // Crear una tarea con ID único en lugar de usar el objeto de misión programada
                        tasksForDate.push({
                            id: `task-${sch.id}-${viewDateStr}`, // ID único por fecha
                            name: sch.name,
                            points: sch.points,
                            missionId: sch.missionId,
                            categoryId: sch.categoryId,
                            completed: false,
                            currentRepetitions: 0,
                            dailyRepetitions: sch.dailyRepetitions || { max: 1 },
                            fromScheduled: true
                        });
                    }
                    return;
                }

                // --- RECURRENCIA ---
                // Usar la función _isMissionScheduledForDate que tiene la lógica correcta
                if (_isMissionScheduledForDate(sch, viewDateObj)) {
                    // Crear una tarea con ID único en lugar de usar el objeto de misión programada
                    tasksForDate.push({
                        id: `task-${sch.id}-${viewDateStr}`, // ID único por fecha
                        name: sch.name,
                        points: sch.points,
                        missionId: sch.missionId,
                        categoryId: sch.categoryId,
                        completed: false,
                        currentRepetitions: 0,
                        dailyRepetitions: sch.dailyRepetitions || { max: 1 },
                        fromScheduled: true
                    });
                }
            });

            return tasksForDate;
        },

    };
})(window.App = window.App || {});