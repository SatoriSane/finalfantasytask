// app-state-habits.js - Abstinence Challenge System for ADHD Users
(function(App) {
    if (!App.state) {
        console.error("App.state is not initialized. Make sure app-state.js is loaded first.");
        return;
    }

    /** -------------------------
     * Utilidades internas
     * ------------------------- */
    const _saveStateToLocalStorage = () => {
        localStorage.setItem("pointsAppState", JSON.stringify(App.state.get()));
    };

    const convertToMilliseconds = (value, unit) => {
        const multipliers = {
            minutes: 60 * 1000,
            hours: 60 * 60 * 1000,
            days: 24 * 60 * 60 * 1000
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

    const calculatePointsForLevel = (firstLevelPoints, incrementPercent, level) => {
        return Math.floor(firstLevelPoints * Math.pow(1 + incrementPercent / 100, level - 1));
    };

    const updateBestStreak = (challenge, now) => {
        const currentStreakMs = now.getTime() - new Date(challenge.lastConsumptionTime).getTime();
        challenge.bestStreak = Math.max(challenge.bestStreak || 0, currentStreakMs);
        challenge.lastConsumptionTime = now.toISOString();
    };

    /** -------------------------
     * Métodos principales
     * ------------------------- */
    Object.assign(App.state, {
        createAbstinenceChallenge: function(name, currentInterval, totalDuration, incrementPercent, firstLevelPoints) {
            const now = new Date().toISOString();
            const stats = calculateFinalStats(currentInterval, incrementPercent, totalDuration);

            const newChallenge = {
                id: App.utils.genId("abstinence"),
                name,
                type: "abstinence",
                currentInterval,
                totalDuration,
                incrementPercent,
                firstLevelPoints,
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
                lastConsumptionTime: now,   // la racha empieza desde la creación
                bestStreak: 0               // mejor racha en milisegundos
            };

            App.state.get().habits.challenges.push(newChallenge);
            _saveStateToLocalStorage();

            App.events.emit("habitsUpdated");
            App.events.emit("showDiscreetMessage", `¡Reto de abstinencia "${name}" creado!`);
        },

        processConsumption: function(challengeId) {
            const state = App.state.get();
            const challenge = state.habits.challenges.find(c => c.id === challengeId);
            if (!challenge || !challenge.isActive) return;

            const now = new Date();
            // Llama a updateBestStreak para registrar la 'caída' y reiniciar la racha.
            updateBestStreak(challenge, now);

            if (challenge.availableConsumptions > 0) {
                challenge.availableConsumptions--;
                challenge.consumptionHistory.push({
                    level: challenge.currentLevel,
                    date: now.toISOString()
                });

                App.events.emit("showDiscreetMessage", `Consumo registrado. Te quedan ${challenge.availableConsumptions} disponibles.`);
            } else {
                challenge.temptationFalls++;

                const baseWaitMs = convertToMilliseconds(challenge.currentInterval.value, challenge.currentInterval.unit);
                const newWaitMs = baseWaitMs * Math.pow(1 + challenge.incrementPercent / 100, challenge.currentLevel - 1);

                challenge.nextAllowedTime = new Date(now.getTime() + newWaitMs).toISOString();
                App.events.emit("showDiscreetMessage", `No te rindas. ¡Puedes empezar de nuevo!`);
            }

            _saveStateToLocalStorage();
            App.events.emit("habitsUpdated");
        },

        sellConsumption: function(challengeId, pointsToAward) { // Acepta pointsToAward como argumento
            const state = App.state.get();
            const challenge = state.habits.challenges.find(c => c.id === challengeId);
            if (!challenge || !challenge.isActive || challenge.availableConsumptions === 0) return;

            challenge.availableConsumptions--;
            App.state.addPoints(pointsToAward); // Usa el valor pasado por argumento

            App.state.addHistoryAction(
                `Venta de consumo en "${challenge.name}" (Nivel ${challenge.currentLevel})`,
                pointsToAward,
                "venta"
            );

            // El mensaje ahora se maneja en feature-habits.js para mayor flexibilidad
            // App.events.emit("showDiscreetMessage", `¡Vendiste un consumo por ${pointsToAward} puntos! ¡Buen trabajo!`);

            _saveStateToLocalStorage();
            App.events.emit("habitsUpdated");
        },

        addAvailableConsumption: function(challengeId, completedLevel) {
            const state = App.state.get();
            const challenge = state.habits.challenges.find(c => c.id === challengeId);
            if (!challenge || !challenge.isActive) return;

            const pointsEarned = calculatePointsForLevel(challenge.firstLevelPoints, challenge.incrementPercent, completedLevel);

            challenge.availableConsumptions++;
            challenge.automaticLevelUps++;
            challenge.totalPoints += pointsEarned;

            App.state.addPoints(pointsEarned);
            App.state.addHistoryAction(`${challenge.name} - Nivel ${completedLevel}`, pointsEarned, "abstinencia");

            App.events.emit("showDiscreetMessage", `¡Nivel ${completedLevel} completado! ¡+${pointsEarned} puntos! 🎉`);
        },

        updateAbstinenceChallenge: function(updatedChallenge) {
            const challenges = App.state.get().habits.challenges;
            const index = challenges.findIndex(c => c.id === updatedChallenge.id);

            if (index > -1) {
                challenges[index] = updatedChallenge;
                _saveStateToLocalStorage();

                App.events.emit("habitsUpdated");
            }
        },

        deleteAbstinenceChallenge: function(challengeId) {
            App.ui.general.showCustomConfirm(
                "¿Seguro que quieres eliminar este reto de abstinencia? Perderás todo tu progreso.",
                confirmed => {
                    if (confirmed) {
                        const state = App.state.get();
                        const challengeName = state.habits.challenges.find(c => c.id === challengeId)?.name || "Reto";

                        state.habits.challenges = state.habits.challenges.filter(c => c.id !== challengeId);
                        _saveStateToLocalStorage();

                        App.events.emit("habitsUpdated");
                        App.events.emit("showDiscreetMessage", `Reto "${challengeName}" eliminado.`);
                    }
                }
            );
        },

        getAbstinenceChallengeById: function(challengeId) {
            return App.state.get().habits.challenges.find(c => c.id === challengeId);
        }
    });
})(window.App = window.App || {});
