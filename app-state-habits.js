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
                isAvailableToConsume: false, // Button starts as "Esperando"
                finalLevel: stats.finalLevel,
                finalWaitTime: stats.finalWaitTime,
                secondChanceUsed: false,
                automaticLevelUps: 0, // Count automatic level advances
                temptationFalls: 0 // Count temptation falls
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
                // Consumption allowed - just record consumption and reset availability
                challenge.successfulConsumptions++;
                challenge.lastConsumption = now.toISOString();
                challenge.isAvailableToConsume = false; // Button goes back to "Esperando"
                challenge.secondChanceUsed = false;
                
                if (App.ui && App.ui.general && App.ui.general.showDiscreetMessage) {
                    App.ui.general.showDiscreetMessage('Consumo registrado. Timer continúa...');
                }
            } else {
                // Early consumption (temptation) - level down and reset timer
                if (challenge.currentLevel > 1) {
                    challenge.currentLevel--;
                }
                challenge.temptationFalls = (challenge.temptationFalls || 0) + 1; // Track temptation falls
                
                // Reset timer with current level's wait time
                const currentWaitMs = convertToMilliseconds(challenge.currentInterval.value, challenge.currentInterval.unit);
                const newWaitMs = currentWaitMs * Math.pow(1 + challenge.incrementPercent / 100, challenge.currentLevel - 1);
                
                challenge.lastConsumption = now.toISOString();
                challenge.nextAllowedTime = new Date(now.getTime() + newWaitMs).toISOString();
                challenge.isAvailableToConsume = false;
                challenge.secondChanceUsed = false;

                if (App.ui && App.ui.general && App.ui.general.showDiscreetMessage) {
                    App.ui.general.showDiscreetMessage(`Nivel ${challenge.currentLevel}. ¡No te rindas! 💪`);
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
        processAbstinenceChallenges: function() {
            const state = App.state.get();
            let needsRender = false;
            
            state.habits.challenges.forEach(challenge => {
                if (challenge.type === 'abstinence' && challenge.isActive) {
                    const now = new Date();
                    const nextAllowed = new Date(challenge.nextAllowedTime);
                    
                    // Auto level up when timer reaches 0
                    if (now >= nextAllowed) {
                        challenge.currentLevel++;
                        challenge.isAvailableToConsume = true;
                        challenge.automaticLevelUps = (challenge.automaticLevelUps || 0) + 1; // Track automatic level ups
                        
                        // Award points for level up
                        const pointsEarned = Math.floor(challenge.firstLevelPoints * Math.pow(1 + challenge.incrementPercent / 100, challenge.currentLevel - 1));
                        challenge.totalPoints += pointsEarned;
                        
                        // Calculate next level's wait time and set new timer
                        const currentWaitMs = convertToMilliseconds(challenge.currentInterval.value, challenge.currentInterval.unit);
                        const newWaitMs = currentWaitMs * Math.pow(1 + challenge.incrementPercent / 100, challenge.currentLevel - 1);
                        challenge.nextAllowedTime = new Date(now.getTime() + newWaitMs).toISOString();
                        
                        // Update global points and history
                        App.state.addPoints(pointsEarned);
                        App.state.addHistoryAction(`${challenge.name} - Nivel ${challenge.currentLevel}`, pointsEarned, 'abstinencia');
                        
                        needsRender = true;
                        
                        if (App.ui && App.ui.general && App.ui.general.showDiscreetMessage) {
                            App.ui.general.showDiscreetMessage(`¡Nivel ${challenge.currentLevel}! +${pointsEarned} puntos 🎉`);
                        }
                    }
                    
                    // Check if challenge duration has expired
                    const createdAt = new Date(challenge.createdAt);
                    const durationMs = convertToMilliseconds(challenge.totalDuration.value, challenge.totalDuration.unit);
                    
                    if (now.getTime() - createdAt.getTime() >= durationMs) {
                        challenge.isActive = false;
                        needsRender = true;
                        if (App.ui && App.ui.general && App.ui.general.showDiscreetMessage) {
                            App.ui.general.showDiscreetMessage(`¡Reto "${challenge.name}" completado! 🏆`);
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
