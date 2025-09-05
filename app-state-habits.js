// app-state-habits.js - Abstinence Challenge System for ADHD Users
(function(App) {
    if (!App.state) {
        console.error("App.state is not initialized. Make sure app-state.js is loaded first.");
        return;
    }

    const _saveStateToLocalStorage = function() {
        localStorage.setItem("pointsAppState", JSON.stringify(App.state.get()));
    }

    // Helper function to convert time units to milliseconds
    const convertToMilliseconds = (value, unit) => {
        const multipliers = {
            'minutes': 60 * 1000,
            'hours': 60 * 60 * 1000,
            'days': 24 * 60 * 60 * 1000
        };
        return value * (multipliers[unit] || 1);
    };

    // Calculate final level and wait time for a challenge
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
    
        // Ajustar finalWaitTime para no exceder totalDuration
        const remainingMs = totalMs - elapsedMs;
        const finalWaitTime = Math.min(currentWaitMs, remainingMs);
    
        return { finalLevel: level, finalWaitTime: Math.round(finalWaitTime) };
    };
    

    Object.assign(App.state, {
        // Create new abstinence challenge
        createAbstinenceChallenge: function(name, currentInterval, totalDuration, incrementPercent, firstLevelPoints) {
            const now = new Date().toISOString();
            const stats = calculateFinalStats(currentInterval, incrementPercent, totalDuration);
            
            const newChallenge = {
                id: App.utils.genId("abstinence"),
                name: name,
                type: 'abstinence',
                currentInterval: currentInterval, // {value: number, unit: 'minutes'|'hours'|'days'}
                totalDuration: totalDuration, // {value: number, unit: 'days'|'weeks'|'months'}
                incrementPercent: incrementPercent,
                firstLevelPoints: firstLevelPoints,
                currentLevel: 1,
                totalPoints: 0,
                regressionCount: 0,
                successfulConsumptions: 0,
                createdAt: now,
                lastConsumption: now,
                nextAllowedTime: new Date(Date.now() + convertToMilliseconds(currentInterval.value, currentInterval.unit)).toISOString(),
                isActive: true,
                isAvailableToConsume: false, // Button starts as "Esperando"
                finalLevel: stats.finalLevel,
                finalWaitTime: stats.finalWaitTime,
                secondChanceUsed: false,
                automaticLevelUps: 0, // Count automatic level advances
                temptationFalls: 0, // Count temptation falls
                consumptionHistory: [] // To track consumption evolution
            };
            
            App.state.get().habits.challenges.push(newChallenge);
                        _saveStateToLocalStorage();
            App.events.emit('habitsUpdated');
            App.events.emit('showDiscreetMessage', `¡Reto de abstinencia "${name}" creado!`);
        },

        // Process consumption when button is clicked
        processConsumption: function(challengeId) {
            const state = App.state.get();
            const challenge = state.habits.challenges.find(c => c.id === challengeId);
            if (!challenge || !challenge.isActive) return;

            const now = new Date();

            if (challenge.isAvailableToConsume) {
                // Consumption allowed - log it, and reset availability for this level.
                challenge.successfulConsumptions++;
                challenge.lastConsumption = now.toISOString();
                challenge.isAvailableToConsume = false; // Button goes back to "Waiting"
                challenge.secondChanceUsed = false;

                // Log the consumption event for statistics
                challenge.consumptionHistory.push({ level: challenge.currentLevel, date: now.toISOString() });

                // CRITICAL: Start the timer for the NEXT level from now
                const currentWaitMs = convertToMilliseconds(challenge.currentInterval.value, challenge.currentInterval.unit);
                const nextWaitMs = currentWaitMs * Math.pow(1 + challenge.incrementPercent / 100, challenge.currentLevel - 1);
                challenge.nextAllowedTime = new Date(now.getTime() + nextWaitMs).toISOString();

                if (App.ui && App.ui.general && App.ui.general.showDiscreetMessage) {
                    App.ui.general.showDiscreetMessage('Consumo registrado. ¡A por el siguiente nivel!');
                }
            } else {
                // Early consumption (temptation) - level down and reset timer
                if (challenge.currentLevel > 1) {
                    challenge.currentLevel--;
                }
                challenge.temptationFalls = (challenge.temptationFalls || 0) + 1;

                // Reset timer with the new (lower) level's wait time
                const currentWaitMs = convertToMilliseconds(challenge.currentInterval.value, challenge.currentInterval.unit);
                const newWaitMs = currentWaitMs * Math.pow(1 + challenge.incrementPercent / 100, challenge.currentLevel - 1);

                challenge.lastConsumption = now.toISOString();
                challenge.nextAllowedTime = new Date(now.getTime() + newWaitMs).toISOString();
                challenge.isAvailableToConsume = false; // Button remains in waiting state
                challenge.secondChanceUsed = false;

                if (App.ui && App.ui.general && App.ui.general.showDiscreetMessage) {
                    App.ui.general.showDiscreetMessage(`Caíste en la tentación. Nivel ${challenge.currentLevel}. ¡No te rindas!`);
                }
            }
            
            _saveStateToLocalStorage();
            App.events.emit('habitsUpdated');
        },

        // Delete abstinence challenge
        deleteAbstinenceChallenge: function(challengeId) {
                        App.ui.general.showCustomConfirm('¿Seguro que quieres eliminar este reto de abstinencia?', (confirmed) => {
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


        // Get challenge by ID
        getAbstinenceChallengeById: function(challengeId) {
            return App.state.get().habits.challenges.find(c => c.id === challengeId);
        },

        // Process all abstinence challenges (called periodically)
 // app-state-habits.js

// ... (resto del código del archivo sin cambios) ...

        // Process all abstinence challenges (called periodically)
        // VERSIÓN MEJORADA CON LÓGICA DE "CATCH-UP"
        processAbstinenceChallenges: function() {
            const state = App.state.get();
            let needsRender = false;
            const now = new Date(); // Obtenemos la hora actual una sola vez para ser consistentes
            
            state.habits.challenges.forEach(challenge => {
                // Nos aseguramos de que el reto está activo y es del tipo correcto
                if (challenge.type !== 'abstinence' || !challenge.isActive) {
                    return; // 'return' dentro de un forEach es como 'continue' en un bucle normal
                }

                // --- BUCLE DE ACTUALIZACIÓN (CATCH-UP) ---
                // Mientras el tiempo límite del reto haya pasado y el botón no esté disponible...
                // Este bucle se ejecutará tantas veces como niveles se hayan superado mientras la app estaba cerrada.
                while (now >= new Date(challenge.nextAllowedTime)) {
                    // If the button is already available, the timer for the next level runs,
                    // but we don't level up until the user consumes.
                    if (challenge.isAvailableToConsume) break;

                    // Comprobación de finalización DENTRO del bucle:
                    const createdAt = new Date(challenge.createdAt);
                    const durationMs = convertToMilliseconds(challenge.totalDuration.value, challenge.totalDuration.unit);
                    if (new Date(challenge.nextAllowedTime).getTime() - createdAt.getTime() >= durationMs) {
                        challenge.isActive = false;
                        needsRender = true;
                        App.events.emit('showDiscreetMessage', `¡Reto "${challenge.name}" completado! 🏆`);
                        break; // Salimos del 'while' para este reto
                    }

                    // --- SUBIDA DE NIVEL ---
                    challenge.currentLevel++;
                    challenge.automaticLevelUps = (challenge.automaticLevelUps || 0) + 1;
                    challenge.isAvailableToConsume = true; // ¡CLAVE! El botón se vuelve disponible.

                    // Otorgamos los puntos del nivel que ACABA de superar
                    const pointsEarned = Math.floor(challenge.firstLevelPoints * Math.pow(1 + challenge.incrementPercent / 100, challenge.currentLevel - 2));
                    challenge.totalPoints += pointsEarned;
                    App.state.addPoints(pointsEarned);
                    App.state.addHistoryAction(`${challenge.name} - Nivel ${challenge.currentLevel - 1}`, pointsEarned, 'abstinencia');

                    // Calculamos el tiempo de espera para el SIGUIENTE nivel
                    const currentWaitMs = convertToMilliseconds(challenge.currentInterval.value, challenge.currentInterval.unit);
                    const newWaitMs = currentWaitMs * Math.pow(1 + challenge.incrementPercent / 100, challenge.currentLevel - 1);

                    // Actualizamos el 'nextAllowedTime' para la siguiente iteración del bucle.
                    const lastAllowedTime = new Date(challenge.nextAllowedTime);
                    challenge.nextAllowedTime = new Date(lastAllowedTime.getTime() + newWaitMs).toISOString();

                    needsRender = true;
                    App.events.emit('showDiscreetMessage', `¡Nivel ${challenge.currentLevel - 1}! +${pointsEarned} puntos 🎉`);
                }

                 // Comprobación final de duración (por si el bucle no se ejecutó)
                const createdAtFinal = new Date(challenge.createdAt);
                const durationMsFinal = convertToMilliseconds(challenge.totalDuration.value, challenge.totalDuration.unit);
                if (challenge.isActive && (now.getTime() - createdAtFinal.getTime() >= durationMsFinal)) {
                    challenge.isActive = false;
                    needsRender = true;
                    if (App.ui && App.ui.general && App.ui.general.showDiscreetMessage) {
                        App.ui.general.showDiscreetMessage(`¡Reto "${challenge.name}" completado! 🏆`);
                    }
                }
            });
            
            if (needsRender) {
                _saveStateToLocalStorage();
                App.events.emit('habitsUpdated');
                return true;
            }
            return false;
        },

// ... (resto del archivo, como la función startAbstinenceProcessor, que no necesita cambios)

        // Start the abstinence challenge processor
        startAbstinenceProcessor: function() {
            setInterval(() => {
                const needsRender = this.processAbstinenceChallenges();
                if (needsRender && document.getElementById('tab-habits').classList.contains('active')) {
                    if (App.ui.render.habits) App.ui.render.habits.renderHabits();
                }
            }, 5000); // Check every 5 seconds
        }
    });

})(window.App = window.App || {});
