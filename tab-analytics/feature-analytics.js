// tab-analytics/feature-analytics.js
// Sistema de análisis simplificado enfocado en misiones y propósitos
(function(App) {
    'use strict';

    // --- PRIVATE STATE ---
    let _currentPeriodType = 'week'; // 'week', 'month', 'quarter', 'year'
    let _currentOffset = 0; // 0 = periodo actual, -1 = anterior, -2 = hace 2 periodos, etc.
    let _currentView = 'overview'; // 'overview', 'purposes', 'missions'

    // --- PRIVATE METHODS ---

    /**
     * Calcula el rango de fechas según el tipo de periodo y offset
     */
    function _getDateRange() {
        const now = new Date();
        let startDate, endDate;

        switch (_currentPeriodType) {
            case 'week':
                // Calcular inicio y fin de la semana (lunes a domingo)
                const currentDay = now.getDay();
                const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
                
                endDate = new Date(now);
                endDate.setDate(endDate.getDate() + mondayOffset + (7 * _currentOffset) + 6);
                endDate.setHours(23, 59, 59, 999);
                
                startDate = new Date(endDate);
                startDate.setDate(startDate.getDate() - 6);
                startDate.setHours(0, 0, 0, 0);
                break;

            case 'month':
                endDate = new Date(now.getFullYear(), now.getMonth() + 1 + _currentOffset, 0);
                endDate.setHours(23, 59, 59, 999);
                
                startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
                startDate.setHours(0, 0, 0, 0);
                break;

            case 'quarter':
                const currentQuarter = Math.floor(now.getMonth() / 3);
                const targetQuarter = currentQuarter + _currentOffset;
                const targetYear = now.getFullYear() + Math.floor(targetQuarter / 4);
                const adjustedQuarter = ((targetQuarter % 4) + 4) % 4;
                
                startDate = new Date(targetYear, adjustedQuarter * 3, 1);
                startDate.setHours(0, 0, 0, 0);
                
                endDate = new Date(targetYear, (adjustedQuarter + 1) * 3, 0);
                endDate.setHours(23, 59, 59, 999);
                break;

            case 'year':
                const targetYear2 = now.getFullYear() + _currentOffset;
                startDate = new Date(targetYear2, 0, 1);
                startDate.setHours(0, 0, 0, 0);
                
                endDate = new Date(targetYear2, 11, 31);
                endDate.setHours(23, 59, 59, 999);
                break;
        }

        return { startDate, endDate };
    }

    /**
     * Obtiene el nombre del periodo actual
     */
    function _getPeriodName() {
        const { startDate, endDate } = _getDateRange();
        
        const formatDate = (date) => {
            return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
        };

        switch (_currentPeriodType) {
            case 'week':
                if (_currentOffset === 0) {
                    return 'Esta semana';
                } else if (_currentOffset === -1) {
                    return 'Semana pasada';
                }
                return `${formatDate(startDate)} - ${formatDate(endDate)}`;

            case 'month':
                if (_currentOffset === 0) {
                    return 'Este mes';
                } else if (_currentOffset === -1) {
                    return 'Mes pasado';
                }
                return startDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

            case 'quarter':
                const quarter = Math.floor(startDate.getMonth() / 3) + 1;
                if (_currentOffset === 0) {
                    return `Este trimestre (Q${quarter})`;
                }
                return `Q${quarter} ${startDate.getFullYear()}`;

            case 'year':
                if (_currentOffset === 0) {
                    return 'Este año';
                } else if (_currentOffset === -1) {
                    return 'Año pasado';
                }
                return startDate.getFullYear().toString();
        }
    }

    /**
     * Calcula estadísticas para el rango de fechas actual
     */
    function _calculateStats() {
        const state = App.state.get();
        const { startDate, endDate } = _getDateRange();
        
        const stats = {
            totalMissionsCompleted: 0,
            totalMissionsIncomplete: 0,
            totalPointsFromMissions: 0,
            totalPointsFromHabits: 0,
            purposesData: {},
            missionsData: {}
        };

// Procesar todas las tareas en el rango de fechas
if (state.tasksByDate) {
    Object.keys(state.tasksByDate).forEach(dateStr => {
        const taskDate = App.utils.normalizeDateToStartOfDay(dateStr);
        if (taskDate >= startDate && taskDate <= endDate) {
            const tasks = state.tasksByDate[dateStr];
            
            tasks.forEach(task => {
                // Solo procesar tareas que tengan missionId (ignorar tareas rápidas sin misión)
                if (task.missionId) {
                    const mission = state.missions.find(m => m.id === task.missionId);
                    
                    // Determinar categoryId
                    let categoryId = task.categoryId;
                    if (!categoryId && mission) {
                        categoryId = mission.categoryId;
                    }
                    if (!categoryId) {
                        const scheduled = state.scheduledMissions.find(sm => sm.missionId === task.missionId);
                        if (scheduled) categoryId = scheduled.categoryId;
                    }
                    
                    const category = categoryId ? state.categories.find(c => c.id === categoryId) : null;
                    const categoryName = category ? category.name : 'Sin propósito';

                    // Contar completadas/incompletas
                    if (task.completed) {
                        stats.totalMissionsCompleted++;
                    } else {
                        stats.totalMissionsIncomplete++;
                    }

                    // Calcular puntos ganados
                    const pointsEarned = task.completed 
                        ? task.points * (task.currentRepetitions || 1)
                        : 0;

                    // Contar todos los puntos, incluyendo los esporádicos
                    if (pointsEarned > 0) {
                        stats.totalPointsFromMissions += pointsEarned;
                    }

                    // Datos por propósito (todas las categorías)
                    if (category) {
                        if (!stats.purposesData[categoryId]) {
                            stats.purposesData[categoryId] = {
                                name: categoryName,
                                points: 0,
                                missionsCompleted: 0,
                                missionsIncomplete: 0,
                                uniqueMissions: new Set()
                            };
                        }
                        
                        stats.purposesData[categoryId].points += pointsEarned;
                        
                        if (task.completed) {
                            stats.purposesData[categoryId].missionsCompleted++;
                        } else {
                            stats.purposesData[categoryId].missionsIncomplete++;
                        }
                        
                        stats.purposesData[categoryId].uniqueMissions.add(task.missionId);
                    }

                    // Datos por misión individual (todas las categorías)
                    if (mission) {
                        if (!stats.missionsData[task.missionId]) {
                            stats.missionsData[task.missionId] = {
                                name: mission.name,
                                purposeName: categoryName,
                                points: 0,
                                completions: 0
                            };
                        }
                        
                        stats.missionsData[task.missionId].points += pointsEarned;
                        if (task.completed) {
                            stats.missionsData[task.missionId].completions++;
                        }
                    }
                }
            });
        }
    });
}


        // Calcular puntos de hábitos desde el historial
        if (state.history && Array.isArray(state.history)) {
            const relevantHistory = state.history.filter(h => {
                const histDate = App.utils.normalizeDateToStartOfDay(h.date);
                return histDate >= startDate && histDate <= endDate;
            });

            relevantHistory.forEach(day => {
                if (day.actions && Array.isArray(day.actions)) {
                    day.actions.forEach(action => {
                        // Identificar puntos de hábitos/abstinencia
                        if (action.type === 'resistencia' || action.type === 'abstinencia' || 
                            action.name.includes('Resistencia') || action.name.includes('Ticket')) {
                            stats.totalPointsFromHabits += action.points || 0;
                        }
                    });
                }
            });
        }

        // Convertir Sets a números
        Object.keys(stats.purposesData).forEach(catId => {
            stats.purposesData[catId].uniqueMissionsCount = stats.purposesData[catId].uniqueMissions.size;
            delete stats.purposesData[catId].uniqueMissions;
        });
        
        return stats;
    }

    /**
     * Renderiza una tarjeta de estadística
     */
    function _renderStatCard(icon, label, value, subtitle = '', isClickable = false) {
        const clickableClass = isClickable ? 'stat-card-clickable' : '';
        return `
            <div class="stat-card ${clickableClass}" ${isClickable ? 'data-action="show-incomplete"' : ''}>
                <div class="stat-icon">${icon}</div>
                <div class="stat-content">
                    <div class="stat-value">${value}</div>
                    <div class="stat-label">${label}</div>
                    ${subtitle ? `<div class="stat-subtitle">${subtitle}</div>` : ''}
                </div>
            </div>
        `;
    }

/**
 * Obtiene lista detallada de misiones incompletas
 */
function _getIncompleteMissions() {
    const state = App.state.get();
    const { startDate, endDate } = _getDateRange();
    const incompleteMissions = [];

    if (state.tasksByDate) {
        Object.keys(state.tasksByDate).forEach(dateStr => {
            const taskDate = App.utils.normalizeDateToStartOfDay(dateStr);
            if (taskDate >= startDate && taskDate <= endDate) {
                const tasks = state.tasksByDate[dateStr];
                
                tasks.forEach(task => {
                    if (!task.completed && task.missionId) {
                        const mission = state.missions.find(m => m.id === task.missionId);
                        
                        // Determinar categoryId
                        let categoryId = task.categoryId;
                        if (!categoryId && mission) {
                            categoryId = mission.categoryId;
                        }
                        if (!categoryId) {
                            const scheduled = state.scheduledMissions.find(sm => sm.missionId === task.missionId);
                            if (scheduled) categoryId = scheduled.categoryId;
                        }
                        
                        const category = categoryId ? state.categories.find(c => c.id === categoryId) : null;

                        // Incluir TODAS las misiones (incluidas las esporádicas)
                        incompleteMissions.push({
                            taskId: task.id,
                            missionId: task.missionId,
                            name: task.name,
                            date: dateStr,
                            purposeName: category ? category.name : 'Sin propósito',
                            points: task.points
                        });
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
     * Muestra modal con misiones incompletas
     */
    function _showIncompleteMissionsModal() {
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
                <div class="modal-content incomplete-missions-modal-content">
                    <button class="modal-close-btn" id="closeIncompleteMissionsModal">&times;</button>
                    <h2 id="incompleteMissionsTitle">⏳ Misiones Pendientes</h2>
                    <div id="incompleteMissionsContent"></div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Actualizar título con el periodo
        const titleEl = document.getElementById('incompleteMissionsTitle');
        if (titleEl) {
            titleEl.textContent = `⏳ Misiones Pendientes (${_getPeriodName()})`;
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
                                    <span class="mission-date">📅 ${formattedDate}</span>
                                    <span class="mission-purpose">🎯 ${mission.purposeName}</span>
                                    <span class="mission-points">⭐ ${mission.points} pts</span>
                                </div>
                            </div>
                            <button class="delete-incomplete-btn" title="Eliminar misión pendiente">
                                🗑️
                            </button>
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
                    '¿Seguro que quieres eliminar esta misión pendiente?',
                    (confirmed) => {
                        if (confirmed) {
                            _deleteIncompleteTask(taskId, date);
                            item.remove();
                            
                            // Si no quedan más misiones, cerrar modal
                            if (content.querySelectorAll('.incomplete-mission-item').length === 0) {
                                modal.classList.remove('visible');
                                App.events.emit('shownotifyMessage', 'Todas las misiones pendientes han sido eliminadas.');
                            } else {
                                App.events.emit('shownotifyMessage', 'Misión pendiente eliminada.');
                            }
                            
                            // Re-renderizar analytics
                            App.ui.analytics.render();
                        }
                    }
                );
            };
        });
    }

    /**
     * Elimina una tarea incompleta
     */
    function _deleteIncompleteTask(taskId, dateStr) {
        const state = App.state.get();
        const tasks = state.tasksByDate[dateStr];
        if (tasks) {
            const index = tasks.findIndex(t => t.id === taskId);
            if (index !== -1) {
                const task = tasks[index];
    
                // Marcar fecha como omitida si es misión programada
                if (task.missionId) {
                    const scheduled = state.scheduledMissions.find(sm => sm.missionId === task.missionId);
                    if (scheduled) {
                        scheduled.skippedDates = scheduled.skippedDates || [];
                        if (!scheduled.skippedDates.includes(dateStr)) {
                            scheduled.skippedDates.push(dateStr);
                        }
                    }
                }
    
                tasks.splice(index, 1);
                state.tasksByDate[dateStr] = tasks;
                App.state.saveState();
                App.events.emit('todayTasksUpdated');
            }
        }
    }
    

    /**
     * Renderiza resumen compacto de propósitos
     */
    function _renderPurposesSummary(purposesData) {
        const purposesArray = Object.values(purposesData)
            .sort((a, b) => b.points - a.points)
            .slice(0, 5); // Top 5

        if (purposesArray.length === 0) {
            return '<p class="empty-message">No hay datos de propósitos para este periodo</p>';
        }

        const maxPoints = Math.max(...purposesArray.map(p => p.points));

        return `
            <div class="purposes-summary-list">
                ${purposesArray.map((purpose, index) => {
                    const percentage = maxPoints > 0 ? (purpose.points / maxPoints) * 100 : 0;
                    return `
                        <div class="purpose-summary-item">
                            <div class="purpose-rank">#${index + 1}</div>
                            <div class="purpose-details">
                                <div class="purpose-name">${purpose.name}</div>
                                <div class="purpose-progress">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${percentage}%"></div>
                                    </div>
                                </div>
                                <div class="purpose-mini-stats">
                                    <span>✅ ${purpose.missionsCompleted}</span>
                                    <span>⏳ ${purpose.missionsIncomplete}</span>
                                    <span>⭐ ${purpose.points} pts</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * Renderiza la vista general
     */
    function _renderOverview(stats) {
        const container = document.getElementById('analyticsContent');
        if (!container) return;

        const totalMissions = stats.totalMissionsCompleted + stats.totalMissionsIncomplete;
        const completionRate = totalMissions > 0 
            ? Math.round((stats.totalMissionsCompleted / totalMissions) * 100)
            : 0;

        container.innerHTML = `
            <div class="analytics-overview">
                <!-- Selector de periodo con navegación -->
                <div class="period-navigation">
                    <button class="period-nav-btn" id="prevPeriodBtn" ${_currentOffset <= -10 ? 'disabled' : ''}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    
                    <div class="period-selector-dropdown">
                        <select id="periodTypeSelect">
                            <option value="week" ${_currentPeriodType === 'week' ? 'selected' : ''}>Semana</option>
                            <option value="month" ${_currentPeriodType === 'month' ? 'selected' : ''}>Mes</option>
                            <option value="quarter" ${_currentPeriodType === 'quarter' ? 'selected' : ''}>Trimestre</option>
                            <option value="year" ${_currentPeriodType === 'year' ? 'selected' : ''}>Año</option>
                        </select>
                        <div class="period-name">${_getPeriodName()}</div>
                    </div>
                    
                    <button class="period-nav-btn" id="nextPeriodBtn" ${_currentOffset >= 0 ? 'disabled' : ''}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                </div>

                <div class="stats-grid">
                    ${_renderStatCard('✅', 'Misiones Completadas', stats.totalMissionsCompleted)}
                    ${_renderStatCard('⏳', 'Misiones Pendientes', stats.totalMissionsIncomplete, 'Click para ver detalles', true)}
                    ${_renderStatCard('📊', 'Tasa de Completación', `${completionRate}%`)}
                    ${_renderStatCard('⭐', 'Puntos (Misiones)', stats.totalPointsFromMissions)}
                </div>

                ${stats.totalPointsFromHabits > 0 ? `
                    <div class="habits-points-section">
                        <div class="habits-points-card">
                            <div class="habits-icon">💪</div>
                            <div class="habits-info">
                                <div class="habits-label">Puntos de Hábitos</div>
                                <div class="habits-value">${stats.totalPointsFromHabits} pts</div>
                                <div class="habits-note">No incluidos en totales de propósitos</div>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <div class="purposes-summary-section">
                    <h3>🎯 Resumen por Propósitos</h3>
                    ${_renderPurposesSummary(stats.purposesData)}
                </div>
            </div>
        `;

        // Añadir listeners para navegación de periodo
        _initPeriodNavigationListeners();
    }

    /**
     * Renderiza la vista por propósitos (detallada)
     */
    function _renderPurposes(stats) {
        const container = document.getElementById('analyticsContent');
        if (!container) return;

        const purposesArray = Object.values(stats.purposesData)
            .sort((a, b) => b.points - a.points);

        if (purposesArray.length === 0) {
            container.innerHTML = `
                <div class="period-navigation">
                    <button class="period-nav-btn" id="prevPeriodBtn" ${_currentOffset <= -10 ? 'disabled' : ''}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    
                    <div class="period-selector-dropdown">
                        <select id="periodTypeSelect">
                            <option value="week" ${_currentPeriodType === 'week' ? 'selected' : ''}>Semana</option>
                            <option value="month" ${_currentPeriodType === 'month' ? 'selected' : ''}>Mes</option>
                            <option value="quarter" ${_currentPeriodType === 'quarter' ? 'selected' : ''}>Trimestre</option>
                            <option value="year" ${_currentPeriodType === 'year' ? 'selected' : ''}>Año</option>
                        </select>
                        <div class="period-name">${_getPeriodName()}</div>
                    </div>
                    
                    <button class="period-nav-btn" id="nextPeriodBtn" ${_currentOffset >= 0 ? 'disabled' : ''}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                </div>
                <p class="empty-message">No hay datos de propósitos para este periodo</p>
            `;
            _initPeriodNavigationListeners();
            return;
        }

        const maxPoints = Math.max(...purposesArray.map(p => p.points));

        container.innerHTML = `
            <div class="analytics-purposes">
                <div class="period-navigation">
                    <button class="period-nav-btn" id="prevPeriodBtn" ${_currentOffset <= -10 ? 'disabled' : ''}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    
                    <div class="period-selector-dropdown">
                        <select id="periodTypeSelect">
                            <option value="week" ${_currentPeriodType === 'week' ? 'selected' : ''}>Semana</option>
                            <option value="month" ${_currentPeriodType === 'month' ? 'selected' : ''}>Mes</option>
                            <option value="quarter" ${_currentPeriodType === 'quarter' ? 'selected' : ''}>Trimestre</option>
                            <option value="year" ${_currentPeriodType === 'year' ? 'selected' : ''}>Año</option>
                        </select>
                        <div class="period-name">${_getPeriodName()}</div>
                    </div>
                    
                    <button class="period-nav-btn" id="nextPeriodBtn" ${_currentOffset >= 0 ? 'disabled' : ''}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                </div>

                <h3>🎯 Análisis Detallado por Propósito</h3>
                <div class="purposes-list">
                    ${purposesArray.map((purpose, index) => {
                        const percentage = maxPoints > 0 ? (purpose.points / maxPoints) * 100 : 0;
                        const totalTasks = purpose.missionsCompleted + purpose.missionsIncomplete;
                        const completionRate = totalTasks > 0 
                            ? Math.round((purpose.missionsCompleted / totalTasks) * 100)
                            : 0;
                        
                        return `
                            <div class="purpose-item">
                                <div class="purpose-rank-large">#${index + 1}</div>
                                <div class="purpose-info">
                                    <div class="purpose-header">
                                        <span class="purpose-name-large">${purpose.name}</span>
                                        <span class="purpose-points-large">${purpose.points} pts</span>
                                    </div>
                                    <div class="purpose-progress-large">
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: ${percentage}%"></div>
                                        </div>
                                    </div>
                                    <div class="purpose-detailed-stats">
                                        <div class="stat-item">
                                            <span class="stat-icon">✅</span>
                                            <span class="stat-text">${purpose.missionsCompleted} completadas</span>
                                        </div>
                                        <div class="stat-item">
                                            <span class="stat-icon">⏳</span>
                                            <span class="stat-text">${purpose.missionsIncomplete} pendientes</span>
                                        </div>
                                        <div class="stat-item">
                                            <span class="stat-icon">🎯</span>
                                            <span class="stat-text">${purpose.uniqueMissionsCount} misiones únicas</span>
                                        </div>
                                        <div class="stat-item">
                                            <span class="stat-icon">📊</span>
                                            <span class="stat-text">${completionRate}% completación</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        _initPeriodNavigationListeners();
    }

    /**
     * Renderiza la vista por misiones
     */
    function _renderMissions(stats) {
        const container = document.getElementById('analyticsContent');
        if (!container) return;

        const missionsArray = Object.values(stats.missionsData)
            .filter(m => m.points > 0)
            .sort((a, b) => b.points - a.points)
            .slice(0, 20);

        if (missionsArray.length === 0) {
            container.innerHTML = `
                <div class="period-navigation">
                    <button class="period-nav-btn" id="prevPeriodBtn" ${_currentOffset <= -10 ? 'disabled' : ''}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    
                    <div class="period-selector-dropdown">
                        <select id="periodTypeSelect">
                            <option value="week" ${_currentPeriodType === 'week' ? 'selected' : ''}>Semana</option>
                            <option value="month" ${_currentPeriodType === 'month' ? 'selected' : ''}>Mes</option>
                            <option value="quarter" ${_currentPeriodType === 'quarter' ? 'selected' : ''}>Trimestre</option>
                            <option value="year" ${_currentPeriodType === 'year' ? 'selected' : ''}>Año</option>
                        </select>
                        <div class="period-name">${_getPeriodName()}</div>
                    </div>
                    
                    <button class="period-nav-btn" id="nextPeriodBtn" ${_currentOffset >= 0 ? 'disabled' : ''}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                </div>
                <p class="empty-message">No hay datos de misiones para este periodo</p>
            `;
            _initPeriodNavigationListeners();
            return;
        }

        container.innerHTML = `
            <div class="analytics-missions">
                <div class="period-navigation">
                    <button class="period-nav-btn" id="prevPeriodBtn" ${_currentOffset <= -10 ? 'disabled' : ''}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    
                    <div class="period-selector-dropdown">
                        <select id="periodTypeSelect">
                            <option value="week" ${_currentPeriodType === 'week' ? 'selected' : ''}>Semana</option>
                            <option value="month" ${_currentPeriodType === 'month' ? 'selected' : ''}>Mes</option>
                            <option value="quarter" ${_currentPeriodType === 'quarter' ? 'selected' : ''}>Trimestre</option>
                            <option value="year" ${_currentPeriodType === 'year' ? 'selected' : ''}>Año</option>
                        </select>
                        <div class="period-name">${_getPeriodName()}</div>
                    </div>
                    
                    <button class="period-nav-btn" id="nextPeriodBtn" ${_currentOffset >= 0 ? 'disabled' : ''}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                </div>

                <h3>🏆 Top 20 Misiones Más Productivas</h3>
                <div class="missions-table">
                    <div class="table-header">
                        <span class="col-rank">#</span>
                        <span class="col-name">Misión</span>
                        <span class="col-purpose">Propósito</span>
                        <span class="col-completions">Veces</span>
                        <span class="col-points">Puntos</span>
                    </div>
                    ${missionsArray.map((mission, index) => `
                        <div class="table-row">
                            <span class="col-rank">${index + 1}</span>
                            <span class="col-name">${mission.name}</span>
                            <span class="col-purpose">${mission.purposeName}</span>
                            <span class="col-completions">${mission.completions}×</span>
                            <span class="col-points">${mission.points} pts</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        _initPeriodNavigationListeners();
    }

    /**
     * Inicializa los listeners para la navegación de periodos
     */
    function _initPeriodNavigationListeners() {
        const prevBtn = document.getElementById('prevPeriodBtn');
        const nextBtn = document.getElementById('nextPeriodBtn');
        const selectEl = document.getElementById('periodTypeSelect');

        if (prevBtn) {
            prevBtn.onclick = () => {
                _currentOffset--;
                App.ui.analytics.render();
            };
        }

        if (nextBtn) {
            nextBtn.onclick = () => {
                _currentOffset++;
                App.ui.analytics.render();
            };
        }

        if (selectEl) {
            selectEl.onchange = (e) => {
                _currentPeriodType = e.target.value;
                _currentOffset = 0;
                App.ui.analytics.render();
            };
        }
    }

    // --- PUBLIC API ---
    App.ui.analytics = {
        render: function() {
            const stats = _calculateStats();

            switch (_currentView) {
                case 'overview':
                    _renderOverview(stats);
                    break;
                case 'purposes':
                    _renderPurposes(stats);
                    break;
                case 'missions':
                    _renderMissions(stats);
                    break;
            }
        },

        setView: function(view) {
            _currentView = view;
            
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(`[data-view="${view}"]`)?.classList.add('active');
            
            this.render();
        },

        initListeners: function() {
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const view = btn.dataset.view;
                    this.setView(view);
                });
            });

            document.addEventListener('click', (e) => {
                const statCard = e.target.closest('.stat-card-clickable[data-action="show-incomplete"]');
                if (statCard) {
                    _showIncompleteMissionsModal();
                }
            });

            App.events.on('todayTasksUpdated', () => this.render());
            App.events.on('historyUpdated', () => this.render());
            App.events.on('stateRefreshed', () => this.render());
        }
    };

})(window.App = window.App || {});