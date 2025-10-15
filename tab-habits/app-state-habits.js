// app-state-habits.js - Sistema de Retos de Abstinencia con Estadísticas Dinámicas
(function(App) {
    if (!App.state) {
        console.error("App.state is not initialized. Make sure app-state.js is loaded first.");
        return;
    }

    const _saveStateToLocalStorage = () => {
        localStorage.setItem("pointsAppState", JSON.stringify(App.state.get()));
    };

    const calculateInitialInterval = (weeklyFrequency) => {
        if (weeklyFrequency <= 0) return 0;
        const msPerWeek = 7 * 24 * 60 * 60 * 1000;
        return Math.floor(msPerWeek / weeklyFrequency);
    };

    /**
     * Calcula el límite máximo de tickets que se pueden acumular en un día
     * basado en la frecuencia de consumo del usuario
     */
    const calculateDailyTicketLimit = (weeklyFrequency) => {
        if (weeklyFrequency <= 0) return 1;
        const dailyFrequency = weeklyFrequency / 7;
        // Redondear hacia arriba para ser generoso, mínimo 1 ticket
        return Math.max(1, Math.ceil(dailyFrequency));
    };


    /**
     * ✅ NUEVO: Calcula promedio reciente INCLUYENDO abstinencia actual
     * Se usa para mostrar estadísticas dinámicas al usuario
     */
    const calculateRecentAverageWithCurrent = (consumptionHistory, days, currentAbstinenceTime, initialInterval) => {
        if (consumptionHistory.length === 0) return initialInterval;
        
        const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
        const recentConsumptions = consumptionHistory.filter(c => 
            new Date(c.timestamp).getTime() >= cutoffTime
        );
        
        if (recentConsumptions.length === 0) {
            // Si no hay consumos recientes, el promedio es la abstinencia actual
            return currentAbstinenceTime > 0 ? currentAbstinenceTime : initialInterval;
        }
        
        let totalTime = 0;
        let intervals = 0;
        
        // Calcular intervalos entre consumos recientes
        for (let i = 1; i < recentConsumptions.length; i++) {
            const prevTime = new Date(recentConsumptions[i - 1].timestamp).getTime();
            const currentTime = new Date(recentConsumptions[i].timestamp).getTime();
            totalTime += (currentTime - prevTime);
            intervals++;
        }
        
        // Agregar abstinencia actual como intervalo adicional
        if (currentAbstinenceTime > 0) {
            totalTime += currentAbstinenceTime;
            intervals++;
        }
        
        return intervals > 0 ? Math.floor(totalTime / intervals) : initialInterval;
    };

    /**
     * Calcula promedio de período anterior (sin abstinencia actual)
     */
    const calculatePreviousAverage = (consumptionHistory, days, initialInterval) => {
        if (consumptionHistory.length <= 1) return initialInterval;
        
        const now = Date.now();
        const recentCutoff = now - (days * 24 * 60 * 60 * 1000);
        const previousCutoff = now - (2 * days * 24 * 60 * 60 * 1000);
        
        const previousConsumptions = consumptionHistory.filter(c => {
            const timestamp = new Date(c.timestamp).getTime();
            return timestamp >= previousCutoff && timestamp < recentCutoff;
        });
        
        if (previousConsumptions.length <= 1) return initialInterval;
        
        let totalTime = 0;
        for (let i = 1; i < previousConsumptions.length; i++) {
            const prevTime = new Date(previousConsumptions[i - 1].timestamp).getTime();
            const currentTime = new Date(previousConsumptions[i].timestamp).getTime();
            totalTime += (currentTime - prevTime);
        }
        
        return Math.floor(totalTime / (previousConsumptions.length - 1));
    };

    const calculatePercentageChange = (current, previous) => {
        if (previous === 0) return { percentage: 0, isImprovement: false };
        
        const percentage = Math.round(((current - previous) / previous) * 100);
        const isImprovement = percentage > 0;
        
        return { percentage: Math.abs(percentage), isImprovement };
    };

    const hasX2Bonus = (recentAverage, previousAverage) => {
        if (previousAverage === 0) return false;
        const percentage = ((recentAverage - previousAverage) / previousAverage) * 100;
        return percentage >= 1;
    };


    // --- Métodos principales ---
    Object.assign(App.state, {
        createAbstinenceChallenge: function(habitName, weeklyFrequency, successDays, baseTicketPoints = 10) {
            const currentState = App.state.get();
            
            const now = new Date();
            const initialInterval = calculateInitialInterval(weeklyFrequency);
            
            const simulatedHistory = [];
            const weekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            
            for (let i = 0; i < weeklyFrequency; i++) {
                const consumptionTime = new Date(weekAgo.getTime() + (i * initialInterval));
                simulatedHistory.push({
                    timestamp: consumptionTime.toISOString(),
                    type: 'simulated'
                });
            }

            const newChallenge = {
                id: App.utils.genId("abstinence"),
                name: habitName,
                type: "abstinence",
                weeklyFrequency,
                successDays,
                initialInterval,
                createdAt: now.toISOString(),
                isActive: true,
                consumptionHistory: simulatedHistory,
                lastConsumptionTime: now.toISOString(),
                abstinenceHistory: [],
                bestAbstinenceTime: 0,
                availableTickets: 1,
                lastTicketGeneratedTime: now.toISOString(),
                baseTicketPoints,
            };

            currentState.habits.challenges.push(newChallenge);
            
            _saveStateToLocalStorage();

            App.events.emit("habitsUpdated");
            App.events.emit("shownotifyMessage", `¡Reto "${habitName}" creado! 🎯`);
        },

        spendTicket: function(challengeId) {
            const state = App.state.get();
            const challenge = state.habits.challenges.find(c => c.id === challengeId);
            if (!challenge || !challenge.isActive || challenge.availableTickets <= 0) return;

            const now = new Date();
            const lastConsumption = new Date(challenge.lastConsumptionTime);
            const abstinenceDuration = now.getTime() - lastConsumption.getTime();
            
            if (abstinenceDuration > 0) {
                challenge.abstinenceHistory.push({
                    startTime: challenge.lastConsumptionTime,
                    endTime: now.toISOString(),
                    duration: abstinenceDuration
                });
                challenge.bestAbstinenceTime = Math.max(challenge.bestAbstinenceTime, abstinenceDuration);
            }

            challenge.consumptionHistory.push({
                timestamp: now.toISOString(),
                type: 'real'
            });
            
            challenge.lastConsumptionTime = now.toISOString();
            challenge.availableTickets--;

            App.events.emit("shownotifyMessage", `Consumo registrado. Te quedan ${challenge.availableTickets} tickets.`);
            _saveStateToLocalStorage();
            App.events.emit("habitsUpdated");
        },

        sellTicket: function(challengeId) {
            const state = App.state.get();
            const challenge = state.habits.challenges.find(c => c.id === challengeId);
            if (!challenge || !challenge.isActive || challenge.availableTickets <= 0) return;

            const stats = this.getChallengeStats(challengeId);
            let points = challenge.baseTicketPoints;
            
            if (stats && stats.hasX2Bonus) {
                points *= 2;
            }

            challenge.availableTickets--;
            App.state.addPoints(points);

            const bonusMsg = stats && stats.hasX2Bonus ? ' ¡Con bonus x2!' : '';
            App.events.emit("shownotifyMessage", `Ticket vendido por ${points} puntos.${bonusMsg}`);
            _saveStateToLocalStorage();
            App.events.emit("habitsUpdated");
        },

        sellConsumption: function(challengeId, finalPrice) {
            const state = App.state.get();
            const challenge = state.habits.challenges.find(c => c.id === challengeId);
            if (!challenge || !challenge.isActive || challenge.availableTickets <= 0) return;

            challenge.availableTickets--;
            App.state.addPoints(finalPrice);

            _saveStateToLocalStorage();
            App.events.emit("habitsUpdated");
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
                        App.events.emit("shownotifyMessage", `Reto "${challengeName}" eliminado.`);
                    }
                }
            );
        },

        getAbstinenceChallengeById: function(challengeId) {
            return App.state.get().habits.challenges.find(c => c.id === challengeId);
        },

        getDailyTicketLimit: function(challengeId) {
            const challenge = this.getAbstinenceChallengeById(challengeId);
            if (!challenge) return 1;
            return calculateDailyTicketLimit(challenge.weeklyFrequency);
        },

        getTotalAverage: function(challengeId) {
            const challenge = this.getAbstinenceChallengeById(challengeId);
            if (!challenge) return 0;
            // ✅ NOTA: Esta función solo se usa para estadísticas, NO para generación de tickets
            return calculateTotalAverage(challenge.consumptionHistory, challenge.initialInterval);
        },

        processAllChallengesOnLoad: function() {
            const state = App.state.get();
            if (!state.habits || !state.habits.challenges) {
                console.log("No abstinence challenges found to process");
                return;
            }
            
            const now = Date.now();
            let totalTicketsGenerated = 0;
            
            state.habits.challenges.forEach(challenge => {
                if (!challenge.isActive) return;
                
                // ✅ SISTEMA SIMPLE: Calcular desde el último ticket generado
                const lastTicketGen = new Date(challenge.lastTicketGeneratedTime).getTime();
                const timeSinceLastTicket = now - lastTicketGen;
                
                // ¿Cuántos tickets deberían generarse?
                const ticketsDue = Math.floor(timeSinceLastTicket / challenge.initialInterval);
                
                if (ticketsDue > 0) {
                    const dailyLimit = calculateDailyTicketLimit(challenge.weeklyFrequency);
                    const maxTicketsToAdd = Math.max(0, dailyLimit - challenge.availableTickets);
                    const ticketsToAdd = Math.min(ticketsDue, maxTicketsToAdd);
                    
                    if (ticketsToAdd > 0) {
                        challenge.availableTickets += ticketsToAdd;
                        
                        // Actualizar timestamp del último ticket generado
                        challenge.lastTicketGeneratedTime = new Date(
                            lastTicketGen + (ticketsDue * challenge.initialInterval)
                        ).toISOString();
                        
                        totalTicketsGenerated += ticketsToAdd;
                    }
                }
                
                // Verificar si el reto debe completarse
                const lastConsumption = new Date(challenge.lastConsumptionTime).getTime();
                const daysSinceLastConsumption = Math.floor((now - lastConsumption) / (24 * 60 * 60 * 1000));
                
                if (daysSinceLastConsumption >= challenge.successDays) {
                    challenge.isActive = false;
                }
            });
            
            if (totalTicketsGenerated > 0) {
                _saveStateToLocalStorage();
                const message = totalTicketsGenerated === 1 
                    ? "¡Bienvenido de vuelta! Se generó 1 ticket 🎫"
                    : `¡Bienvenido de vuelta! Se generaron ${totalTicketsGenerated} tickets 🎫`;
                
                setTimeout(() => {
                    App.events.emit("shownotifyMessage", message);
                    // ✅ Usar evento diferente para generación automática (no debe exportar a GitHub)
                    App.events.emit("habitsAutoUpdated");
                }, 500);
            }
        },


        getChallengeStats: function(challengeId) {
            const challenge = this.getAbstinenceChallengeById(challengeId);
            if (!challenge) return null;

            const currentAbstinenceTime = Date.now() - new Date(challenge.lastConsumptionTime).getTime();

            // Promedio reciente INCLUYE abstinencia actual (para mostrar progreso dinámico)
            const recentAverage = calculateRecentAverageWithCurrent(
                challenge.consumptionHistory, 
                challenge.successDays, 
                currentAbstinenceTime,
                challenge.initialInterval
            );
            
            // Promedio anterior NO incluye abstinencia actual (es histórico)
            const previousAverage = calculatePreviousAverage(
                challenge.consumptionHistory, 
                challenge.successDays, 
                challenge.initialInterval
            );
            
            const recentChange = calculatePercentageChange(recentAverage, previousAverage);
            const previousChange = calculatePercentageChange(previousAverage, challenge.initialInterval);
            const hasBonus = hasX2Bonus(recentAverage, previousAverage);

            return {
                initialInterval: challenge.initialInterval,
                recentAverage,
                previousAverage,
                recentChange,
                previousChange,
                hasX2Bonus: hasBonus,
                currentAbstinenceTime
            };
        }
    });
})(window.App = window.App || {});