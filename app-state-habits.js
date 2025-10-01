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
     * ✅ ORIGINAL: Calcula promedio total SIN abstinencia actual
     * Se usa para calcular el nextTicketTime
     */
    const calculateTotalAverage = (consumptionHistory, initialInterval) => {
        if (consumptionHistory.length <= 1) return initialInterval;
        
        let totalTime = 0;
        for (let i = 1; i < consumptionHistory.length; i++) {
            const prevTime = new Date(consumptionHistory[i - 1].timestamp).getTime();
            const currentTime = new Date(consumptionHistory[i].timestamp).getTime();
            totalTime += (currentTime - prevTime);
        }
        
        return Math.floor(totalTime / (consumptionHistory.length - 1));
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
                nextTicketTime: new Date(now.getTime() + initialInterval).toISOString(),
                baseTicketPoints: baseTicketPoints
            };

            currentState.habits.challenges.push(newChallenge);
            
            _saveStateToLocalStorage();

            App.events.emit("habitsUpdated");
            App.events.emit("showDiscreetMessage", `¡Reto "${habitName}" creado! 🎯`);
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

            App.events.emit("showDiscreetMessage", `Consumo registrado. Te quedan ${challenge.availableTickets} tickets.`);
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
            App.events.emit("showDiscreetMessage", `Ticket vendido por ${points} puntos.${bonusMsg}`);
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

        addTicket: function(challengeId) {
            const state = App.state.get();
            const challenge = state.habits.challenges.find(c => c.id === challengeId);
            if (!challenge || !challenge.isActive) return;
            
            // Calcular límite diario de tickets
            const dailyLimit = calculateDailyTicketLimit(challenge.weeklyFrequency);
            
            // Solo agregar ticket si no se ha alcanzado el límite
            if (challenge.availableTickets >= dailyLimit) {
                // Programar el próximo intento para más tarde
                const totalAverage = calculateTotalAverage(challenge.consumptionHistory, challenge.initialInterval);
                const now = new Date();
                challenge.nextTicketTime = new Date(now.getTime() + totalAverage).toISOString();
                
                App.events.emit("showDiscreetMessage", `🚫 Límite de tickets alcanzado (${dailyLimit}/día). Usa los que tienes.`);
                _saveStateToLocalStorage();
                App.events.emit("habitsUpdated");
                return;
            }

            challenge.availableTickets++;
            
            // ✅ Usa calculateTotalAverage (SIN abstinencia actual)
            const totalAverage = calculateTotalAverage(challenge.consumptionHistory, challenge.initialInterval);
            const now = new Date();
            challenge.nextTicketTime = new Date(now.getTime() + totalAverage).toISOString();

            const isNearLimit = challenge.availableTickets >= dailyLimit - 1;
            const message = isNearLimit 
                ? `🎫 Ticket disponible! (${challenge.availableTickets}/${dailyLimit} - cerca del límite)`
                : `¡Nuevo ticket disponible! 🎫 (${challenge.availableTickets}/${dailyLimit})`;
                
            App.events.emit("showDiscreetMessage", message);
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
                        App.events.emit("showDiscreetMessage", `Reto "${challengeName}" eliminado.`);
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

        /**
         * ✅ ACTUALIZADO: Usa calculateRecentAverageWithCurrent para estadísticas dinámicas
         */
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