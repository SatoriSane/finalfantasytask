// focus-scheduled.js - Lógica para misiones programadas
(function(App) {
    'use strict';

    let _countdownInterval = null;

    /**
     * Obtiene la primera tarea incompleta disponible ahora (respetando el orden guardado)
     * PRIORIDAD: Tareas programadas <1h > Tareas sin hora/pasadas > Tareas programadas >1h
     * 
     * TOLERANCIA: 1 HORA (60 MINUTOS)
     * - Tareas programadas <1h: PRIORIDAD MÁXIMA - Vista programada con opciones
     * - Tareas SIN hora o con hora PASADA: Vista normal de completar
     * - Tareas programadas >1h: Última prioridad - Vista programada con opciones
     * 
     * COMPORTAMIENTO:
     * - Tareas programadas <1h (ej: 15 min, 30 min, 45 min): Vista programada con opciones
     *   - SIEMPRE aparecen PRIMERO
     *   - Muestra mensaje de espera, countdown y opciones
     *   - Permite "Iniciar Ahora" o "Hacer Otra Misión" (si hay disponibles)
     *   - Auto-cambia a vista normal cuando countdown llega a 0
     * - Tareas SIN hora: Vista normal de completar
     * - Tareas con hora PASADA: Vista normal de completar
     * - Tareas programadas >1h: Vista programada (solo si no hay otras)
     * 
     * Retorna un objeto con:
     * - task: la tarea disponible para completar ahora (o null si no hay)
     * - nextScheduledTask: la siguiente tarea programada (o null si no hay)
     * - minutesUntilNext: minutos hasta que esté disponible la siguiente
     * - hasOtherAvailableTasks: si hay otras tareas disponibles además de la programada
     */
    function getNextAvailableTask(skipTaskId = null) {
        const todayTasks = App.state.getTodayTasks();
        const incompleteTasks = todayTasks.filter(task => !task.completed);
        
        // Obtener el orden guardado
        const savedOrder = App.state.getTodayTaskOrder() || [];
        
        // Ordenar las tareas según el orden guardado
        const orderedTasks = [];
        const remainingTasks = new Set(incompleteTasks.map(t => t.id));
        
        // Primero agregar las tareas en el orden guardado
        savedOrder.forEach(id => {
            const task = incompleteTasks.find(t => t.id === id);
            if (task) {
                orderedTasks.push(task);
                remainingTasks.delete(id);
            }
        });
        
        // Luego agregar las tareas que no están en el orden guardado
        remainingTasks.forEach(id => {
            const task = incompleteTasks.find(t => t.id === id);
            if (task) orderedTasks.push(task);
        });
        
        // Filtrar la tarea a saltar si se especificó
        const tasksToConsider = skipTaskId 
            ? orderedTasks.filter(t => t.id !== skipTaskId)
            : orderedTasks;
        
        // PRIORIDAD 1: Buscar tareas programadas con hora FUTURA y <2h
        // Estas deben aparecer PRIMERO con vista programada
        const scheduledTasksNear = tasksToConsider
            .filter(task => {
                if (!task.scheduleTime || !task.scheduleTime.time) return false;
                const minutesUntil = App.focusUtils.getMinutesUntilAvailable(task);
                return minutesUntil > 0 && minutesUntil <= 60; // Futuras y <1h
            })
            .map(task => ({
                task,
                minutesUntil: App.focusUtils.getMinutesUntilAvailable(task)
            }))
            .sort((a, b) => a.minutesUntil - b.minutesUntil);
        
        if (scheduledTasksNear.length > 0) {
            const nextScheduled = scheduledTasksNear[0];
            
            // Verificar si hay otras tareas disponibles (sin hora o con hora pasada)
            const hasOtherAvailableTasks = orderedTasks.some(task => 
                task.id !== nextScheduled.task.id && 
                !task.completed &&
                App.focusUtils.isTaskAvailableNow(task)
            );
            
            console.log('🔍 Tarea programada <1h encontrada:', {
                taskId: nextScheduled.task.id,
                taskName: nextScheduled.task.name,
                minutesUntil: nextScheduled.minutesUntil,
                hasOtherAvailableTasks
            });
            
            return { 
                task: null, 
                nextScheduledTask: nextScheduled.task, 
                minutesUntilNext: nextScheduled.minutesUntil,
                hasOtherAvailableTasks
            };
        }
        
        // PRIORIDAD 2: Buscar tareas sin hora o con hora ya pasada
        const availableTask = tasksToConsider.find(task => App.focusUtils.isTaskAvailableNow(task));
        
        if (availableTask) {
            console.log('🔍 Tarea disponible encontrada:', {
                taskId: availableTask.id,
                taskName: availableTask.name,
                hasScheduleTime: !!availableTask.scheduleTime
            });
            
            return { 
                task: availableTask, 
                nextScheduledTask: null, 
                minutesUntilNext: 0,
                hasOtherAvailableTasks: false
            };
        }
        
        // PRIORIDAD 3: Buscar tareas programadas >1h (solo si no hay otras opciones)
        const scheduledTasksFar = tasksToConsider
            .filter(task => {
                if (!task.scheduleTime || !task.scheduleTime.time) return false;
                const minutesUntil = App.focusUtils.getMinutesUntilAvailable(task);
                return minutesUntil > 60; // >1h
            })
            .map(task => ({
                task,
                minutesUntil: App.focusUtils.getMinutesUntilAvailable(task)
            }))
            .sort((a, b) => a.minutesUntil - b.minutesUntil);
        
        if (scheduledTasksFar.length > 0) {
            const nextScheduled = scheduledTasksFar[0];
            
            const hasOtherAvailableTasks = orderedTasks.some(task => 
                task.id !== nextScheduled.task.id && 
                !task.completed &&
                App.focusUtils.isTaskAvailableNow(task)
            );
            
            console.log('🔍 Tarea programada >1h encontrada:', {
                taskId: nextScheduled.task.id,
                taskName: nextScheduled.task.name,
                minutesUntil: nextScheduled.minutesUntil,
                hasOtherAvailableTasks
            });
            
            return { 
                task: null, 
                nextScheduledTask: nextScheduled.task, 
                minutesUntilNext: nextScheduled.minutesUntil,
                hasOtherAvailableTasks
            };
        }
        
        // PRIORIDAD 3: Si no hay tareas programadas, tomar la primera sin hora
        const taskWithoutSchedule = tasksToConsider.find(task => !task.scheduleTime || !task.scheduleTime.time);
        
        if (taskWithoutSchedule) {
            return { 
                task: taskWithoutSchedule, 
                nextScheduledTask: null, 
                minutesUntilNext: 0,
                hasOtherAvailableTasks: false
            };
        }
        
        // No hay tareas
        return { 
            task: null, 
            nextScheduledTask: null, 
            minutesUntilNext: 0,
            hasOtherAvailableTasks: false
        };
    }

    /**
     * Inicia el countdown para una misión programada
     */
    function startScheduledCountdown(task, initialMinutes, onComplete) {
        // Limpiar intervalo anterior si existe
        if (_countdownInterval) {
            clearInterval(_countdownInterval);
        }

        let minutesLeft = initialMinutes;
        
        _countdownInterval = setInterval(() => {
            minutesLeft--;
            
            const countdownValue = document.querySelector('.countdown-value');
            if (countdownValue) {
                countdownValue.textContent = `${minutesLeft} min`;
            }
            
            // Si llegó el momento, cambiar a modo normal
            if (minutesLeft <= 0) {
                clearInterval(_countdownInterval);
                _countdownInterval = null;
                
                // Ejecutar callback si se proporciona
                if (onComplete) {
                    onComplete(task);
                }
            }
        }, 60000); // Actualizar cada minuto
    }

    /**
     * Detiene el countdown
     */
    function stopScheduledCountdown() {
        if (_countdownInterval) {
            clearInterval(_countdownInterval);
            _countdownInterval = null;
        }
    }

    // Exponer API pública
    App.focusScheduled = {
        getNextAvailableTask,
        startScheduledCountdown,
        stopScheduledCountdown
    };

})(window.App = window.App || {});
