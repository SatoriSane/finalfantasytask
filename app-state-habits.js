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
        let currentWaitTime = convertToMilliseconds(currentInterval.value, currentInterval.unit);
        let level = 1;
        let elapsedTime = 0;
        
        while (elapsedTime < totalMs) {
            elapsedTime += currentWaitTime;
            if (elapsedTime < totalMs) {
                level++;
                currentWaitTime = currentWaitTime * (1 + incrementPercent / 100);
            }
        }
        
        return { finalLevel: level, finalWaitTime: Math.round(currentWaitTime) };
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
                finalLevel: stats.finalLevel,
                finalWaitTime: stats.finalWaitTime,
                secondChanceUsed: false
            };
            
            App.state.get().habits.challenges.push(newChallenge);
                        _saveStateToLocalStorage();
            App.events.emit('habitsUpdated');
            App.events.emit('showDiscreetMessage', `¡Reto de abstinencia "${name}" creado!`);
        },

        // Process consumption (either allowed or early)
        processConsumption: function(challengeId) {
            const state = App.state.get();
            const challenge = state.habits.challenges.find(c => c.id === challengeId);
            if (!challenge || !challenge.isActive) return;

            const now = new Date();
            const nextAllowed = new Date(challenge.nextAllowedTime);
            const isAllowed = now >= nextAllowed;

            if (isAllowed) {
                // Level up - consumption allowed
                challenge.successfulConsumptions++;
                challenge.currentLevel++;
                const pointsEarned = Math.floor(challenge.firstLevelPoints * Math.pow(1 + challenge.incrementPercent / 100, challenge.currentLevel - 1));
                challenge.totalPoints += pointsEarned;
                
                // Calculate new wait time
                const currentWaitMs = convertToMilliseconds(challenge.currentInterval.value, challenge.currentInterval.unit);
                const newWaitMs = currentWaitMs * Math.pow(1 + challenge.incrementPercent / 100, challenge.currentLevel - 1);
                
                challenge.lastConsumption = now.toISOString();
                challenge.nextAllowedTime = new Date(now.getTime() + newWaitMs).toISOString();
                challenge.secondChanceUsed = false; // Reset on level up

                // Update global points and history
                App.state.addPoints(pointsEarned);
                App.state.addHistoryAction(`${challenge.name} - Nivel ${challenge.currentLevel}`, pointsEarned, 'abstinencia');
                
                if (App.ui.render.general) {
                    App.ui.render.general.showDiscreetMessage(`¡Nivel ${challenge.currentLevel}! +${pointsEarned} puntos 🎉`);
                }
            } else {
                // Level down - early consumption
                if (challenge.currentLevel > 1) {
                    challenge.currentLevel--;
                }
                challenge.regressionCount++;
                
                // Reset timer with current level's wait time
                const currentWaitMs = convertToMilliseconds(challenge.currentInterval.value, challenge.currentInterval.unit);
                const newWaitMs = currentWaitMs * Math.pow(1 + challenge.incrementPercent / 100, challenge.currentLevel - 1);
                
                challenge.lastConsumption = now.toISOString();
                challenge.nextAllowedTime = new Date(now.getTime() + newWaitMs).toISOString();
                challenge.secondChanceUsed = false; // Also reset on level down

                if (App.ui.render.general) {
                    App.ui.render.general.showDiscreetMessage(`Nivel ${challenge.currentLevel}. ¡No te rindas! 💪`);
                }
            }
            
                        _saveStateToLocalStorage();
            App.events.emit('habitsUpdated'); // This will also trigger points and history updates via saveState
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
        processAbstinenceChallenges: function() {
            const state = App.state.get();
            let needsRender = false;
            
            state.habits.challenges.forEach(challenge => {
                if (challenge.type === 'abstinence' && challenge.isActive) {
                    // Check if challenge duration has expired
                    const createdAt = new Date(challenge.createdAt);
                    const now = new Date();
                    const durationMs = convertToMilliseconds(challenge.totalDuration.value, challenge.totalDuration.unit);
                    
                    if (now.getTime() - createdAt.getTime() >= durationMs) {
                        challenge.isActive = false;
                        needsRender = true;
                        if (App.ui.render.general) {
                            App.ui.render.general.showDiscreetMessage(`¡Reto "${challenge.name}" completado! 🏆`);
                        }
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
