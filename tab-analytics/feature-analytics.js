// tab-analytics/feature-analytics.js
// Sistema de análisis simplificado - Vista única compacta y elegante
(function(App) {
    'use strict';

    // --- PRIVATE STATE ---
    let _currentPeriodType = 'week';
    let _currentOffset = 0;

    // --- PRIVATE METHODS ---

    function _getDateRange() {
        const now = new Date();
        let startDate, endDate;

        switch (_currentPeriodType) {
            case 'week':
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

    function _getPeriodName() {
        const { startDate, endDate } = _getDateRange();
        
        switch (_currentPeriodType) {
            case 'week':

                const formatDate = (date) => date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                return `${formatDate(startDate)} - ${formatDate(endDate)}`;

            case 'month':
                return startDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

            case 'quarter':
                const quarter = Math.floor(startDate.getMonth() / 3) + 1;
                return `Q${quarter} ${startDate.getFullYear()}`;

            case 'year':
                return startDate.getFullYear().toString();
        }
    }

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

        if (state.tasksByDate) {
            Object.keys(state.tasksByDate).forEach(dateStr => {
                const taskDate = App.utils.normalizeDateToStartOfDay(dateStr);
                if (taskDate >= startDate && taskDate <= endDate) {
                    const tasks = state.tasksByDate[dateStr];
                    
                    tasks.forEach(task => {
                        if (task.missionId) {
                            const mission = state.missions.find(m => m.id === task.missionId);
                            
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

                            if (task.completed) {
                                stats.totalMissionsCompleted++;
                            } else {
                                stats.totalMissionsIncomplete++;
                            }

                            const pointsEarned = task.completed 
                                ? task.points * (task.currentRepetitions || 1)
                                : 0;

                            if (pointsEarned > 0) {
                                stats.totalPointsFromMissions += pointsEarned;
                            }

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

                            if (mission) {
                                if (!stats.missionsData[task.missionId]) {
                                    stats.missionsData[task.missionId] = {
                                        name: mission.name,
                                        purposeName: categoryName,
                                        points: 0,
                                        completions: 0,
                                        totalOccurrences: 0
                                    };
                                }
                                
                                stats.missionsData[task.missionId].totalOccurrences++;
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

        if (state.history && Array.isArray(state.history)) {
            const relevantHistory = state.history.filter(h => {
                const histDate = App.utils.normalizeDateToStartOfDay(h.date);
                return histDate >= startDate && histDate <= endDate;
            });

            relevantHistory.forEach(day => {
                if (day.actions && Array.isArray(day.actions)) {
                    day.actions.forEach(action => {
                        if (action.type === 'resistencia' || action.type === 'abstinencia' || 
                            action.name.includes('Resistencia') || action.name.includes('Ticket')) {
                            stats.totalPointsFromHabits += action.points || 0;
                        }
                    });
                }
            });
        }

        Object.keys(stats.purposesData).forEach(catId => {
            stats.purposesData[catId].uniqueMissionsCount = stats.purposesData[catId].uniqueMissions.size;
            delete stats.purposesData[catId].uniqueMissions;
        });
        
        return stats;
    }

    function _renderStatCard(icon, label, value, subtitle = '', isClickable = false) {
        const clickableClass = isClickable ? 'stat-card-clickable' : '';
        return `
            <div class="stat-card ${clickableClass}" ${isClickable ? 'data-action="show-incomplete"' : ''}>
                
                <div class="stat-content">
                    
                    <div class="stat-value-wrapper">
                        <div class="stat-icon">${icon}</div>
                        <div class="analytics-stat-value">${value}</div>
                    </div>
    
                    <div class="stat-label">${label}</div>
                    ${subtitle ? `<div class="stat-subtitle">${subtitle}</div>` : ''}
                </div>
            </div>
        `;
    }

    function _renderAnalytics() {
        const container = document.getElementById('analyticsContent');
        if (!container) return;

        const stats = _calculateStats();
        const totalMissions = stats.totalMissionsCompleted + stats.totalMissionsIncomplete;
        const completionRate = totalMissions > 0 
            ? Math.round((stats.totalMissionsCompleted / totalMissions) * 100)
            : 0;

        // TODOS los propósitos ordenados por puntos
        const allPurposes = Object.entries(stats.purposesData)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.points - a.points);

        // Top 20 Misiones ordenadas por puntos
        const topMissions = Object.values(stats.missionsData)
            .sort((a, b) => b.points - a.points)
            .slice(0, 20);

        container.innerHTML = `
            <!-- Navegación de Periodo -->
            <div class="period-navigation">
                <button class="period-nav-btn" id="prevPeriodBtn" ${_currentOffset <= -10 ? 'disabled' : ''}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                
                <div class="period-selector-wrapper">
                    <select id="periodTypeSelect">
                        <option value="week" ${_currentPeriodType === 'week' ? 'selected' : ''}>Semana</option>
                        <option value="month" ${_currentPeriodType === 'month' ? 'selected' : ''}>Mes</option>
                        <option value="quarter" ${_currentPeriodType === 'quarter' ? 'selected' : ''}>Trimestre</option>
                        <option value="year" ${_currentPeriodType === 'year' ? 'selected' : ''}>Año</option>
                    </select>
                    <span class="period-name">${_getPeriodName()}</span>
                </div>
                
                <button class="period-nav-btn" id="nextPeriodBtn" ${_currentOffset >= 0 ? 'disabled' : ''}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            </div>

            <!-- Grid de Estadísticas -->
            <div class="stats-grid">
                ${_renderStatCard('✅', 'Completadas', stats.totalMissionsCompleted)}
                ${_renderStatCard('⏳', 'Pendientes', stats.totalMissionsIncomplete, 'Ver detalles', true)}
                ${_renderStatCard('📊', 'Tasa', `${completionRate}%`)}
                ${_renderStatCard('⭐', 'Puntos', stats.totalPointsFromMissions)}
            </div>

            ${stats.totalPointsFromHabits > 0 ? `
                <div class="habits-points-section">
                    <div class="habits-points-card">
                        <div class="habits-icon">💪</div>
                        <div class="habits-info">
                            <div class="habits-label">Puntos de Hábitos</div>
                            <div class="habits-value">${stats.totalPointsFromHabits} pts</div>
                            <div class="habits-note">No incluidos en propósitos</div>
                        </div>
                    </div>
                </div>
            ` : ''}

            <!-- Todos los Propósitos -->
            ${allPurposes.length > 0 ? `
                <div class="analytics-section">
                    <div class="analytics-section-header">
                        <span class="section-icon">🎯</span>
                        <h3 class="section-title">Propósitos</h3>
                    </div>
                    <div class="purposes-list-elegant">
                        ${allPurposes.map((purpose, index) => {
                            const totalTasks = purpose.missionsCompleted + purpose.missionsIncomplete;
                            const completionRate = totalTasks > 0 
                                ? Math.round((purpose.missionsCompleted / totalTasks) * 100)
                                : 0;
                            
                            const maxPoints = allPurposes[0].points;
                            const widthPercentage = maxPoints > 0 ? (purpose.points / maxPoints) * 100 : 0;
                            
                            return `
                                <div class="purpose-elegant-item">
                                    <div class="purpose-elegant-header">
                                        <div class="purpose-elegant-left">
                                            <span class="purpose-elegant-rank">#${index + 1}</span>
                                            <span class="purpose-elegant-name">${purpose.name}</span>
                                        </div>
                                        <div class="purpose-elegant-right">
                                            <span class="purpose-elegant-rate ${completionRate >= 80 ? 'excellent' : completionRate >= 50 ? 'good' : 'needs-work'}">${completionRate}%</span>
                                            <span class="purpose-elegant-points">${purpose.points} pts</span>
                                        </div>
                                    </div>
                                    <div class="purpose-elegant-progress">
                                        <div class="purpose-elegant-bar" style="width: ${widthPercentage}%">
                                            <div class="purpose-elegant-glow"></div>
                                        </div>
                                    </div>
                                    <div class="purpose-elegant-footer">
                                        <span class="purpose-metric">✅ ${purpose.missionsCompleted}</span>
                                        <span class="purpose-metric">⏳ ${purpose.missionsIncomplete}</span>
                                        <span class="purpose-metric">🎯 ${purpose.uniqueMissionsCount}</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : '<p class="empty-message">No hay datos de propósitos</p>'}

            <!-- Top Misiones -->
            ${topMissions.length > 0 ? `
                <div class="analytics-section">
                    <div class="analytics-section-header">
                        <span class="section-icon">🏆</span>
                        <h3 class="section-title">Top 20 Misiones</h3>
                    </div>
                    <div class="missions-list-elegant">
                        ${topMissions.map((mission, index) => {
                            const completionRate = mission.totalOccurrences > 0 
                                ? Math.round((mission.completions / mission.totalOccurrences) * 100)
                                : 0;
                            
                            return `
                                <div class="mission-elegant-item">
                                    <div class="mission-elegant-rank">#${index + 1}</div>
                                    <div class="mission-elegant-content">
                                        <div class="mission-elegant-header">
                                            <span class="mission-elegant-name">${mission.name}</span>
                                            <span class="mission-elegant-points">${mission.points} pts</span>
                                        </div>
                                        <div class="mission-elegant-footer">
                                            <span class="mission-elegant-purpose">🎯 ${mission.purposeName}</span>
                                            <div class="mission-elegant-stats">
                                                <span class="mission-stat">✅ ${mission.completions}/${mission.totalOccurrences}</span>
                                                <span class="mission-elegant-rate ${completionRate >= 80 ? 'excellent' : completionRate >= 50 ? 'good' : 'needs-work'}">${completionRate}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : '<p class="empty-message">No hay datos de misiones</p>'}
        `;

        _initNavigationListeners();
    }

    function _initNavigationListeners() {
        const prevBtn = document.getElementById('prevPeriodBtn');
        const nextBtn = document.getElementById('nextPeriodBtn');
        const selectEl = document.getElementById('periodTypeSelect');

        if (prevBtn) {
            prevBtn.onclick = () => {
                _currentOffset--;
                _renderAnalytics();
            };
        }

        if (nextBtn) {
            nextBtn.onclick = () => {
                _currentOffset++;
                _renderAnalytics();
            };
        }

        if (selectEl) {
            selectEl.onchange = (e) => {
                _currentPeriodType = e.target.value;
                _currentOffset = 0;
                _renderAnalytics();
            };
        }

        const incompleteCard = document.querySelector('[data-action="show-incomplete"]');
        if (incompleteCard) {
            incompleteCard.onclick = () => _showIncompleteMissionsModal();
        }
    }

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
                            
                            let categoryId = task.categoryId;
                            if (!categoryId && mission) {
                                categoryId = mission.categoryId;
                            }
                            if (!categoryId) {
                                const scheduled = state.scheduledMissions.find(sm => sm.missionId === task.missionId);
                                if (scheduled) categoryId = scheduled.categoryId;
                            }
                            
                            const category = categoryId ? state.categories.find(c => c.id === categoryId) : null;

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

        incompleteMissions.sort((a, b) => new Date(b.date) - new Date(a.date));
        return incompleteMissions;
    }

    function _showIncompleteMissionsModal() {
        const incompleteMissions = _getIncompleteMissions();
        
        if (incompleteMissions.length === 0) {
            App.events.emit('showAlert', '¡Excelente! No tienes misiones pendientes en este periodo.');
            return;
        }

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

        modal.classList.add('visible');

        const closeBtn = document.getElementById('closeIncompleteMissionsModal');
        closeBtn.onclick = () => modal.classList.remove('visible');

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
                            
                            if (content.querySelectorAll('.incomplete-mission-item').length === 0) {
                                modal.classList.remove('visible');
                                App.events.emit('shownotifyMessage', 'Todas las misiones pendientes eliminadas.');
                            } else {
                                App.events.emit('shownotifyMessage', 'Misión pendiente eliminada.');
                            }
                            
                            _renderAnalytics();
                        }
                    }
                );
            };
        });
    }

    function _deleteIncompleteTask(taskId, dateStr) {
        const state = App.state.get();
        const tasks = state.tasksByDate[dateStr];
        if (tasks) {
            const index = tasks.findIndex(t => t.id === taskId);
            if (index !== -1) {
                const task = tasks[index];
    
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

    // --- PUBLIC API ---
    App.ui.analytics = {
        render: function() {
            _renderAnalytics();
        },

        initListeners: function() {
            App.events.on('todayTasksUpdated', () => this.render());
            App.events.on('historyUpdated', () => this.render());
            App.events.on('stateRefreshed', () => this.render());
        }
    };

})(window.App = window.App || {});