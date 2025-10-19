// tab-analytics/feature-incomplete-missions.js
// Gestión del modal de misiones incompletas
(function(App) {
    'use strict';

    /**
     * Obtiene lista de misiones incompletas para el periodo actual
     */
    function _getIncompleteMissions() {
        if (!App.ui.analytics || !App.ui.analytics.getDateRange) {
            return [];
        }

        const state = App.state.get();
        const { startDate, endDate } = App.ui.analytics.getDateRange();
        const incompleteMissions = [];

        if (state.tasksByDate) {
            Object.keys(state.tasksByDate).forEach(dateStr => {
                const taskDate = App.utils.normalizeDateToStartOfDay(dateStr);
                if (taskDate >= startDate && taskDate <= endDate) {
                    const tasks = state.tasksByDate[dateStr];
                    
                    tasks.forEach(task => {
                        if (!task.completed) {
                            // Determinar categoryId
                            let categoryId = task.categoryId;
                            
                            if (!categoryId && task.missionId) {
                                const mission = state.missions.find(m => m.id === task.missionId);
                                if (mission) categoryId = mission.categoryId;
                            }
                            
                            if (!categoryId && task.missionId) {
                                const scheduled = state.scheduledMissions.find(sm => sm.missionId === task.missionId);
                                if (scheduled) categoryId = scheduled.categoryId;
                            }
                            
                            const category = categoryId ? state.categories.find(c => c.id === categoryId) : null;
                            const isEsporadic = category && category.name === "Propósito esporádico";

                            // Solo incluir si no es esporádica
                            if (!isEsporadic) {
                                incompleteMissions.push({
                                    taskId: task.id,
                                    name: task.name,
                                    date: dateStr,
                                    purposeName: category ? category.name : 'Sin propósito',
                                    points: task.points
                                });
                            }
                        }
                    });
                }
            });
        }

        // Ordenar por fecha (más reciente primero)
        incompleteMissions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        return incompleteMissions;
    }

    /**
     * Elimina una tarea incompleta
     */
    function _deleteTask(taskId, dateStr) {
        const state = App.state.get();
        const tasks = state.tasksByDate[dateStr] || [];
        const task = tasks.find(t => t.id === taskId);
    
        if (task && task.missionId) {
            // Marca como omitida
            const scheduledMission = state.scheduledMissions.find(sm => sm.missionId === task.missionId);
            if (scheduledMission) {
                if (!scheduledMission.skippedDates) scheduledMission.skippedDates = [];
                if (!scheduledMission.skippedDates.includes(dateStr)) {
                    scheduledMission.skippedDates.push(dateStr);
                }
            }
        }
    
        // Luego elimina la tarea
        App.state.deleteTodayTask(taskId, true, dateStr);
    }
    
    

    /**
     * Muestra el modal con las misiones incompletas
     */
    function _showModal() {
        const incompleteMissions = _getIncompleteMissions();
        
        if (incompleteMissions.length === 0) {
            App.events.emit('showAlert', '¡Excelente! No tienes misiones pendientes en este periodo.');
            return;
        }

        // Crear modal si no existe
        let modal = document.getElementById('incompleteMissionsModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'incompleteMissionsModal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content">
                    <button class="modal-close-btn" id="closeIncompleteMissionsModal">&times;</button>
                    <h2 id="incompleteMissionsTitle">⏳ Misiones Pendientes</h2>
                    <div id="incompleteMissionsContent"></div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Actualizar título con el periodo
        const titleEl = document.getElementById('incompleteMissionsTitle');
        if (titleEl && App.ui.analytics && App.ui.analytics.getPeriodName) {
            titleEl.textContent = `⏳ Misiones Pendientes (${App.ui.analytics.getPeriodName()})`;
        }

        const content = document.getElementById('incompleteMissionsContent');
        content.innerHTML = `
            <div class="incomplete-missions-list">
                ${incompleteMissions.map(mission => {
                    const dateObj = new Date(mission.date);
                    const formattedDate = dateObj.toLocaleDateString('es-ES', { 
                        day: 'numeric', 
                        month: 'short',
                        year: 'numeric'
                    });
                    
                    return `
                        <div class="incomplete-mission-item" data-task-id="${mission.taskId}" data-date="${mission.date}">
                            <div class="incomplete-mission-info">
                                <div class="incomplete-mission-name">${mission.name}</div>
                                <div class="incomplete-mission-meta">
                                    <span>📅 ${formattedDate}</span>
                                    <span>🎯 ${mission.purposeName}</span>
                                    <span>⭐ ${mission.points} pts</span>
                                </div>
                            </div>
                            <button class="delete-incomplete-btn" title="Eliminar">🗑️</button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // Mostrar modal
        modal.classList.add('visible');

        // Event listeners
        const closeBtn = document.getElementById('closeIncompleteMissionsModal');
        closeBtn.onclick = () => modal.classList.remove('visible');

        // Listeners para botones de eliminar
        content.querySelectorAll('.delete-incomplete-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const item = e.target.closest('.incomplete-mission-item');
                const taskId = item.dataset.taskId;
                const date = item.dataset.date;
                
                App.ui.general.showCustomConfirm(
                    '¿Eliminar esta misión pendiente?',
                    (confirmed) => {
                        if (confirmed) {
                            _deleteTask(taskId, date);
                            App.ui.analytics.render();
                            item.remove();
                            
                            // Si no quedan más misiones, cerrar modal
                            if (content.querySelectorAll('.incomplete-mission-item').length === 0) {
                                modal.classList.remove('visible');
                                App.events.emit('shownotifyMessage', 'Todas las pendientes eliminadas.');
                            } else {
                                App.events.emit('shownotifyMessage', 'Misión eliminada.');
                            }
                            
                            // Re-renderizar analytics
                            if (App.ui.analytics) {
                                App.ui.analytics.render();
                            }
                        }
                    }
                );
            };
        });
    }

    // --- PUBLIC API ---
    App.ui.incompleteMissions = {
        show: _showModal
    };

})(window.App = window.App || {});