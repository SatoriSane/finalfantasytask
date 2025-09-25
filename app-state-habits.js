// app-state-habits.js - Abstinence Challenge System for ADHD Users
(function(App) {
    if (!App.state) {
        console.error("App.state is not initialized. Make sure app-state.js is loaded first.");
        return;
    }

    const _saveStateToLocalStorage = function() {
        localStorage.setItem("pointsAppState", JSON.stringify(App.state.get()));
    }

    const convertToMilliseconds = (value, unit) => {
        const multipliers = {
            'minutes': 60 * 1000,
            'hours': 60 * 60 * 1000,
            'days': 24 * 60 * 60 * 1000
        };
        return value * (multipliers[unit] || 1);
    };

    const calculateFinalStats = (currentInterval, incrementPercent, totalDuration) => {
        const totalMs = convertToMilliseconds(totalDuration.value, totalDuration.unit);
        let currentWaitMs = convertToMilliseconds(currentInterval.value, currentInterval.unit);
        let level = 1;
        let elapsedMs = 0;
    
        while (elapsedMs + currentWaitMs <= totalMs) {
            elapsedMs += currentWaitMs;
            level++;
            currentWaitMs *= (1 + incrementPercent / 100);
        }
    
        const remainingMs = totalMs - elapsedMs;
        const finalWaitTime = Math.min(currentWaitMs, remainingMs);
    
        return { finalLevel: level, finalWaitTime: Math.round(finalWaitTime) };
    };
    

    Object.assign(App.state, {
        createAbstinenceChallenge: function(name, currentInterval, totalDuration, incrementPercent, firstLevelPoints) {
            const now = new Date().toISOString();
            const stats = calculateFinalStats(currentInterval, incrementPercent, totalDuration);
            
            const newChallenge = {
                id: App.utils.genId("abstinence"),
                name: name,
                type: 'abstinence',
                currentInterval: currentInterval,
                totalDuration: totalDuration,
                incrementPercent: incrementPercent,
                firstLevelPoints: firstLevelPoints,
                currentLevel: 1,
                totalPoints: 0,
                createdAt: now,
                nextAllowedTime: new Date(Date.now() + convertToMilliseconds(currentInterval.value, currentInterval.unit)).toISOString(),
                isActive: true,
                finalLevel: stats.finalLevel,
                finalWaitTime: stats.finalWaitTime,
                availableConsumptions: 0,
                automaticLevelUps: 0,
                temptationFalls: 0,
                consumptionHistory: [],
                // --- CAMBIO: Inicializamos lastConsumptionTime y bestStreak con valores basados en tiempo ---
                lastConsumptionTime: now, // La racha empieza en el momento de creación
                bestStreak: 0 // La mejor racha se mide en milisegundos
            };
            
            App.state.get().habits.challenges.push(newChallenge);
            _saveStateToLocalStorage();
            App.events.emit('habitsUpdated');
            App.events.emit('showDiscreetMessage', `¡Reto de abstinencia "${name}" creado!`);
        },

        processConsumption: function(challengeId) {
            const state = App.state.get();
            const challenge = state.habits.challenges.find(c => c.id === challengeId);
            if (!challenge || !challenge.isActive) return;

            const now = new Date();
            const lastConsumptionDate = new Date(challenge.lastConsumptionTime);
            const currentStreakMs = now.getTime() - lastConsumptionDate.getTime();
            
            // --- CAMBIO CLAVE: Actualizamos la mejor racha antes de que la actual se reinicie ---
            challenge.bestStreak = Math.max(challenge.bestStreak, currentStreakMs);
            // Reiniciamos el tiempo de la última consumición para la nueva racha
            challenge.lastConsumptionTime = now.toISOString();

            if (challenge.availableConsumptions > 0) {
                challenge.availableConsumptions--;
                challenge.consumptionHistory.push({
                    level: challenge.currentLevel,
                    date: now.toISOString()
                });
                App.events.emit('showDiscreetMessage', `Consumo registrado. Te quedan ${challenge.availableConsumptions} disponibles.`);
            } else {
                challenge.temptationFalls++;
                // Lógica original para el cálculo del próximo tiempo de espera
                const currentWaitMs = convertToMilliseconds(
                    challenge.currentInterval.value,
                    challenge.currentInterval.unit
                );
                const newWaitMs = currentWaitMs * Math.pow(1 + challenge.incrementPercent / 100, challenge.currentLevel - 1);
                challenge.nextAllowedTime = new Date(now.getTime() + newWaitMs).toISOString();
                App.events.emit('showDiscreetMessage', `No te rindas. ¡Puedes empezar de nuevo!`);
            }
            
            _saveStateToLocalStorage();
            App.events.emit('habitsUpdated');
        },

        sellConsumption: function(challengeId) {
            const state = App.state.get();
            const challenge = state.habits.challenges.find(c => c.id === challengeId);
            if (!challenge || !challenge.isActive || challenge.availableConsumptions === 0) return;

            const pointsForCurrentLevel = Math.floor(challenge.firstLevelPoints * Math.pow(1 + challenge.incrementPercent / 100, challenge.currentLevel - 1));
            
            // --- CAMBIO: El cálculo de la mejor racha ya estaba aquí, se mantiene ---
            const now = new Date();
            const currentStreakMs = now.getTime() - new Date(challenge.lastConsumptionTime).getTime();
            challenge.bestStreak = Math.max(challenge.bestStreak || 0, currentStreakMs);
            
            challenge.availableConsumptions--;
            App.state.addPoints(pointsForCurrentLevel);
            
            App.state.addHistoryAction(`Venta de consumo en "${challenge.name}" (Nivel ${challenge.currentLevel})`, pointsForCurrentLevel, 'venta');
            
            App.events.emit('showDiscreetMessage', `¡Vendiste un consumo por ${pointsForCurrentLevel} puntos! ¡Buen trabajo!`);
            
            _saveStateToLocalStorage();
            App.events.emit('habitsUpdated');
        },


        addAvailableConsumption: function(challengeId, completedLevel) {
            const state = App.state.get();
            const challenge = state.habits.challenges.find(c => c.id === challengeId);
            if (!challenge || !challenge.isActive) return;

            const pointsEarned = Math.floor(challenge.firstLevelPoints * Math.pow(1 + challenge.incrementPercent / 100, completedLevel - 1));
            
            // --- CAMBIO: Se elimina la lógica de racha aquí, ya no es un contador ---
            // La racha se mide por el tiempo desde la última consumición, no por niveles superados.

            challenge.availableConsumptions++;
            challenge.automaticLevelUps++;
            challenge.totalPoints += pointsEarned;
            App.state.addPoints(pointsEarned);
            App.state.addHistoryAction(`${challenge.name} - Nivel ${completedLevel}`, pointsEarned, 'abstinencia');

            App.events.emit('showDiscreetMessage', `¡Nivel ${completedLevel} completado! ¡+${pointsEarned} puntos! 🎉`);
        },
        
        updateAbstinenceChallenge: function(updatedChallenge) {
            const challengeIndex = App.state.get().habits.challenges.findIndex(c => c.id === updatedChallenge.id);
            if (challengeIndex > -1) {
                App.state.get().habits.challenges[challengeIndex] = updatedChallenge;
                _saveStateToLocalStorage();
                App.events.emit('habitsUpdated');
            }
        },

        deleteAbstinenceChallenge: function(challengeId) {
            App.ui.general.showCustomConfirm('¿Seguro que quieres eliminar este reto de abstinencia? Perderás todo tu progreso.', (confirmed) => {
                if (confirmed) {
                    const state = App.state.get();
                    const challengeName = state.habits.challenges.find(c => c.id === challengeId)?.name || 'Reto';
                    state.habits.challenges = state.habits.challenges.filter(c => c.id !== challengeId);
                    _saveStateToLocalStorage();
                    App.events.emit('habitsUpdated');
                    App.events.emit('showDiscreetMessage', `Reto "${challengeName}" eliminado.`);
                }
            });
        },

        getAbstinenceChallengeById: function(challengeId) {
            return App.state.get().habits.challenges.find(c => c.id === challengeId);
        }
    });

})(window.App = window.App || {});
