// focus-scheduled.js - Lógica para misiones programadas
(function(App) {
    'use strict';

    let _countdownInterval = null;

    /**
     * Obtiene la primera tarea incompleta disponible ahora (respetando el orden guardado)
     * 
     * NUEVA PRIORIDAD (según especificación del usuario):
     * 1. Misiones programadas con hora que YA PASÓ (contador corre inmediatamente)
     * 2. Misiones programadas para dentro de MENOS de 1 hora (pregunta si quiere iniciar ahora)
     * 3. La misión sin completar que esté en PRIMERA POSICIÓN en la lista de misiones para hoy
     * 4. La misión sin completar programada para dentro de MÁS de 1 hora (más cercana a la hora actual)
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
        
        // ⭐ PRIORIDAD 1: Misiones programadas con hora que YA PASÓ
        // Estas se ejecutan inmediatamente (vista normal de completar)
        const tasksWithPastTime = tasksToConsider.filter(task => {
            if (!task.scheduleTime || !task.scheduleTime.time) return false;
            const minutesUntil = App.focusUtils.getMinutesUntilAvailable(task);
            return minutesUntil <= 0; // Hora ya pasó
        });
        
        if (tasksWithPastTime.length > 0) {
            const selectedTask = tasksWithPastTime[0];
            console.log('🔍 PRIORIDAD 1: Tarea con hora pasada encontrada:', {
                taskId: selectedTask.id,
                taskName: selectedTask.name,
                scheduleTime: selectedTask.scheduleTime.time
            });
            
            return { 
                task: selectedTask, 
                nextScheduledTask: null, 
                minutesUntilNext: 0,
                hasOtherAvailableTasks: false
            };
        }
        
        // ⭐ PRIORIDAD 2: Misiones programadas para dentro de MENOS de 1 hora
        // Pregunta si quiere iniciar ahora (vista programada con opciones)
        const tasksScheduledSoon = tasksToConsider
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
        
        if (tasksScheduledSoon.length > 0) {
            const nextScheduled = tasksScheduledSoon[0];
            
            // Verificar si hay otras tareas disponibles
            const hasOtherAvailableTasks = tasksToConsider.some(task => 
                task.id !== nextScheduled.task.id && 
                !task.completed &&
                (!task.scheduleTime || !task.scheduleTime.time)
            );
            
            console.log('🔍 PRIORIDAD 2: Tarea programada <1h encontrada:', {
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
        
        // ⭐ PRIORIDAD 3: La misión sin completar en PRIMERA POSICIÓN en la lista
        // (sin importar si tiene hora programada o no, siempre que no sea futura)
        const firstTaskInList = tasksToConsider.find(task => {
            // Si no tiene hora programada, es válida
            if (!task.scheduleTime || !task.scheduleTime.time) return true;
            
            // Si tiene hora programada, solo es válida si ya pasó
            const minutesUntil = App.focusUtils.getMinutesUntilAvailable(task);
            return minutesUntil <= 0;
        });
        
        if (firstTaskInList) {
            console.log('🔍 PRIORIDAD 3: Primera tarea en lista encontrada:', {
                taskId: firstTaskInList.id,
                taskName: firstTaskInList.name,
                hasScheduleTime: !!firstTaskInList.scheduleTime
            });
            
            return { 
                task: firstTaskInList, 
                nextScheduledTask: null, 
                minutesUntilNext: 0,
                hasOtherAvailableTasks: false
            };
        }
        
        // ⭐ PRIORIDAD 4: Misión programada para dentro de MÁS de 1 hora (más cercana)
        const tasksScheduledLater = tasksToConsider
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
        
        if (tasksScheduledLater.length > 0) {
            const nextScheduled = tasksScheduledLater[0];
            
            console.log('🔍 PRIORIDAD 4: Tarea programada >1h encontrada:', {
                taskId: nextScheduled.task.id,
                taskName: nextScheduled.task.name,
                minutesUntil: nextScheduled.minutesUntil
            });
            
            return { 
                task: null, 
                nextScheduledTask: nextScheduled.task, 
                minutesUntilNext: nextScheduled.minutesUntil,
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
