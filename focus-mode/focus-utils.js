// focus-utils.js - Utilidades y validaciones para el modo focus
(function(App) {
    'use strict';

    /**
     * Verifica si una tarea está disponible para completar ahora
     * Una tarea está disponible si:
     * - No tiene hora programada
     * - Su hora programada YA PASÓ (diffMinutes <= 0)
     */
    function isTaskAvailableNow(task) {
        // Si no tiene hora programada, está disponible
        if (!task.scheduleTime || !task.scheduleTime.time) {
            return true;
        }

        try {
            const timeString = task.scheduleTime.time;
            
            // Validar formato
            if (typeof timeString !== 'string' || !timeString.includes(':')) {
                return true; // Si el formato es inválido, considerarla disponible
            }

            // Parsear la hora programada (formato "HH:MM")
            const [hours, minutes] = timeString.split(':').map(Number);
            
            // Validar números
            if (isNaN(hours) || isNaN(minutes)) {
                return true;
            }

            const now = new Date();
            const scheduledTime = new Date();
            scheduledTime.setHours(hours, minutes, 0, 0);

            // Calcular diferencia en minutos
            const diffMinutes = (scheduledTime - now) / (1000 * 60);

            // Disponible SOLO si ya pasó la hora (diffMinutes <= 0)
            // Si aún falta tiempo (diffMinutes > 0), NO está disponible
            return diffMinutes <= 0;
        } catch (error) {
            console.warn('Error parsing schedule time:', error);
            return true; // En caso de error, considerarla disponible
        }
    }
    
    /**
     * Verifica si una tarea tiene hora programada y aún no ha llegado
     * (cualquier tiempo futuro, sin importar cuánto falte)
     */
    function isTaskScheduledForFuture(task) {
        if (!task.scheduleTime || !task.scheduleTime.time) {
            return false;
        }

        try {
            const timeString = task.scheduleTime.time;
            
            if (typeof timeString !== 'string' || !timeString.includes(':')) {
                return false;
            }

            const [hours, minutes] = timeString.split(':').map(Number);
            
            if (isNaN(hours) || isNaN(minutes)) {
                return false;
            }

            const now = new Date();
            const scheduledTime = new Date();
            scheduledTime.setHours(hours, minutes, 0, 0);

            const diffMinutes = (scheduledTime - now) / (1000 * 60);

            // Es futura si aún falta tiempo (diffMinutes > 0)
            // Sin importar cuánto falte (1 min, 30 min, 2h, 5h, etc.)
            return diffMinutes > 0;
        } catch (error) {
            return false;
        }
    }

    /**
     * Calcula cuántos minutos faltan para que una tarea esté disponible
     */
    function getMinutesUntilAvailable(task) {
        if (!task.scheduleTime || !task.scheduleTime.time) {
            return 0;
        }

        try {
            const timeString = task.scheduleTime.time;
            
            // Validar formato
            if (typeof timeString !== 'string' || !timeString.includes(':')) {
                return 0;
            }

            const [hours, minutes] = timeString.split(':').map(Number);
            
            // Validar números
            if (isNaN(hours) || isNaN(minutes)) {
                return 0;
            }

            const now = new Date();
            const scheduledTime = new Date();
            scheduledTime.setHours(hours, minutes, 0, 0);

            const diffMinutes = Math.ceil((scheduledTime - now) / (1000 * 60));
            return Math.max(0, diffMinutes);
        } catch (error) {
            console.warn('Error calculating minutes until available:', error);
            return 0;
        }
    }

    /**
     * Obtiene datos de la tarea para renderizar
     */
    function getTaskData(task) {
        const state = App.state.get();
        const mission = task.missionId ? state.missions.find(m => m.id === task.missionId) : null;
        
        // Categoría
        let categoryName = 'Sin propósito';
        const categoryId = task.categoryId || mission?.categoryId;
        if (categoryId) {
            const category = App.state.getCategoryById(categoryId);
            categoryName = category?.name || 'Sin propósito';
        }

        // Progreso
        const maxReps = task.dailyRepetitions?.max || 1;
        const currentReps = task.currentRepetitions || 0;
        const progressPercentage = (currentReps / maxReps) * 100;

        // Puntos (con bonus)
        const bonusMissionId = App.state.getBonusMissionForToday();
        const points = (task.missionId === bonusMissionId) ? task.points * 2 : task.points;

        return {
            categoryName,
            description: mission?.description || null,
            maxReps,
            currentReps,
            progressPercentage,
            points
        };
    }

    // Exponer API pública
    App.focusUtils = {
        isTaskAvailableNow,
        isTaskScheduledForFuture,
        getMinutesUntilAvailable,
        getTaskData
    };

})(window.App = window.App || {});
