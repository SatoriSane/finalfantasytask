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
        habits: { // NUEVO: Sección de hábitos
            challenges: [], // Retos para dejar hábitos
            routines: []    // Rutinas para crear hábitos
        },
        lastDate: ""
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
                const diffDays = (date.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
                return diffDays % scheduledMission.repeatInterval === 0;
            case 'week':
                if (!scheduledMission.daysOfWeek || scheduledMission.daysOfWeek.length === 0) {
                    return false; // No hay días seleccionados para la repetición semanal.
                }
                const dayOfWeek = date.getDay();
                const diffWeeks = Math.floor(((date.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) / 7);
                return scheduledMission.daysOfWeek.includes(String(dayOfWeek)) && (diffWeeks % scheduledMission.repeatInterval === 0);
            case 'month':
                let monthDiff = (date.getFullYear() - startDate.getFullYear()) * 12 + (date.getMonth() - startDate.getMonth());
                return date.getDate() === startDate.getDate() && monthDiff >= 0 && monthDiff % scheduledMission.repeatInterval === 0;
            case 'year':
                let yearDiff = date.getFullYear() - startDate.getFullYear();
                return date.getMonth() === startDate.getMonth() && date.getDate() === startDate.getDate() && yearDiff >= 0 && yearDiff % scheduledMission.repeatInterval === 0;
            default:
                return false;
        }
    }

    App.state = {
        getState: function() {
            return state;
        },

        getPointsHistory: function() {
            return state.pointsHistory;
        },

        // Record resistance to a temptation
        recordResistance: function(challengeId, challengeName) {
            this.addPoints(1);
            this.addHistoryAction(`Resistencia a ${challengeName}`, 1, 'resistencia');
            if (App.ui && App.ui.general && App.ui.general.showDiscreetMessage) {
                App.ui.general.showDiscreetMessage('¡+1 punto por resistir! 💪');
            }
        },

        getTodayPoints: function() {
            const todayStr = App.utils.getFormattedDate();
            const todayHistory = state.history.find(h => h.date === todayStr);
            return todayHistory ? todayHistory.earned : 0;
        },
        get: () => state,

        processScheduledMissionsForToday: function() {
            const todayStr = App.utils.getFormattedDate();
            if (!state.tasksByDate[todayStr]) {
                state.tasksByDate[todayStr] = [];
            }

            const todayDateObj = App.utils.normalizeDateToStartOfDay(new Date());

            state.scheduledMissions.forEach(sm => {
                const isScheduledForToday = _isMissionScheduledForDate(sm, todayDateObj);
                // Comprobar si la misión ha sido omitida para hoy
                if (!isScheduledForToday || (sm.skippedDates && sm.skippedDates.includes(todayStr))) {
                    return; // No está programada o ha sido omitida, continuar.
                }

                const existingTask = state.tasksByDate[todayStr].find(t => t.missionId === sm.missionId);

                if (!existingTask) {
                    // Si no existe, añadirla a la lista de hoy.
                    state.tasksByDate[todayStr].push({
                        id: App.utils.genId("task"),
                        name: sm.name,
                        points: sm.points,
                        missionId: sm.missionId,
                        completed: false,
                        currentRepetitions: 0,
                        dailyRepetitions: { max: sm.dailyRepetitions ? sm.dailyRepetitions.max : 1 }
                    });
                }
            });
        },

        addPoints: function(amount) {
            if (typeof amount === 'number' && !isNaN(amount)) {
                state.points += amount;
                App.events.emit('pointsUpdated', state.points);
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

        saveState: function() {
            _saveStateToLocalStorage();
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

            // 2. Traspasar tareas no completadas de ayer
            const yesterdayTasks = state.tasksByDate[yesterday] || [];
            const uncompletedTasks = yesterdayTasks.filter(task => !task.completed);
            if (uncompletedTasks.length > 0) {
                const todayTaskMissionIds = new Set(state.tasksByDate[today].map(t => t.missionId));
                uncompletedTasks.forEach(task => {
                    if (task.missionId && !todayTaskMissionIds.has(task.missionId)) {
                        state.tasksByDate[today].push({
                            ...task,
                            id: App.utils.genId("task"), // Nuevo ID para la nueva instancia de tarea
                            completed: false,
                            currentRepetitions: 0
                        });
                    }
                });
                console.log(`${uncompletedTasks.length} tarea(s) no completada(s) ha(n) sido movida(s) a hoy.`);
            }


            // 4. Reiniciar el estado de compra de los items de la tienda
            state.shopItems.forEach(item => {
                if (item.purchasedTodayDate) {
                    const purchasedDateOnly = App.utils.getFormattedDate(new Date(item.purchasedTodayDate));
                    if (purchasedDateOnly !== today) {
                        item.purchasedTodayDate = null;
                    }
                }
            });

            // 5. Actualizar la fecha de última carga y guardar
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
                    console.log("App.state: State loaded successfully.");
                } catch (e) {
                    console.error("App.state: Error parsing localStorage data:", e);
                    this.resetAllData(); // Reinicia si hay un error de parseo
                    return false;
                }
            } else {
                console.log("App.state: No saved state found. Initializing default state.");
                this.resetAllData();
                dataLoadedSuccessfully = true;
            }

            const today = App.utils.getFormattedDate(new Date());
            if (state.lastDate !== today) {
                console.log(`App.state: New day detected. Processing daily tasks for ${today}.`);
                this.processDailyTasks();
            }
            
            // Siempre procesar misiones programadas para hoy, incluso si no es un día nuevo
            this.processScheduledMissionsForToday();

            return dataLoadedSuccessfully;
        },




        resetAllData: function() {
            state = {
                points: 0, categories: [], missions: [], tasksByDate: {},
                scheduledMissions: [], shopItems: [], history: [], lastDate: "",
                habits: { challenges: [], routines: [] }
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

        recordResistance: function(challengeId, challengeName) {
            const challenge = this.getAbstinenceChallengeById(challengeId);
            if (challenge) {
                challenge.secondChanceUsed = true;
                this.addPoints(1);
                this.addHistoryAction(`Resistencia en ${challengeName}`, 1, 'abstinencia');
                this.saveState(); // This will trigger pointsUpdated, historyUpdated, and habitsUpdated events
            }
        },

        startChallengeProcessor: function() {
            setInterval(() => this.processChallengeStreaks(), 5000);
        }
    };
})(window.App = window.App || {});
