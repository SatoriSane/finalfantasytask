// tab-analytics/feature-analytics.js
// Sistema de análisis simplificado - Vista única compacta y elegante
(function(App) {
    'use strict';

    // --- PRIVATE STATE ---
    let _currentPeriodType = 'week';
    let _currentOffset = 0;
    let _currentView = 'purposes'; // 'purposes', 'missions', 'habits'

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

// ============================================
// PARCHE: Mejorar análisis de hábitos
// ============================================
// Reemplazar la función _calculateStats en feature-analytics.js

function _calculateStats() {
    const state = App.state.get();
    const { startDate, endDate } = _getDateRange();
    
    const stats = {
        totalMissionsCompleted: 0,
        totalMissionsIncomplete: 0,
        totalPointsFromMissions: 0,
        totalPointsFromHabits: 0,
        purposesData: {},
        missionsData: {},
        // ✅ NUEVO: Estadísticas detalladas de hábitos
        habitsData: {
            totalTicketsSold: 0,
            totalAuctionWins: 0,
            totalResistances: 0,
            pointsFromTickets: 0,
            pointsFromAuctions: 0,
            pointsFromResistances: 0,
            challengeBreakdown: {} // Por cada reto
        }
    };

    // Procesar misiones (código existente sin cambios)
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
                                };
                            }
                            
                            stats.purposesData[categoryId].points += pointsEarned;
                            
                            if (task.completed) {
                                stats.purposesData[categoryId].missionsCompleted++;
                            } else {
                                stats.purposesData[categoryId].missionsIncomplete++;
                            }
                            
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

    // ✅ MEJORADO: Procesar hábitos con tipos estructurados
    if (state.history && Array.isArray(state.history)) {
        const relevantHistory = state.history.filter(h => {
            const histDate = App.utils.normalizeDateToStartOfDay(h.date);
            return histDate >= startDate && histDate <= endDate;
        });

        relevantHistory.forEach(day => {
            if (day.actions && Array.isArray(day.actions)) {
                day.actions.forEach(action => {
                    const points = action.points || 0;
                    
                    // Procesar por tipo de acción
                    switch (action.type) {
                        case 'habit_ticket_sale':
                            stats.habitsData.totalTicketsSold++;
                            stats.habitsData.pointsFromTickets += points;
                            stats.totalPointsFromHabits += points;
                            
                            // Extraer nombre del reto del action.name
                            const ticketMatch = action.name.match(/: (.+)$/);
                            if (ticketMatch) {
                                const challengeName = ticketMatch[1];
                                if (!stats.habitsData.challengeBreakdown[challengeName]) {
                                    stats.habitsData.challengeBreakdown[challengeName] = {
                                        tickets: 0,
                                        auctions: 0,
                                        resistances: 0,
                                        points: 0
                                    };
                                }
                                stats.habitsData.challengeBreakdown[challengeName].tickets++;
                                stats.habitsData.challengeBreakdown[challengeName].points += points;
                            }
                            break;
                            
                        case 'habit_auction_win':
                            stats.habitsData.totalAuctionWins++;
                            stats.habitsData.pointsFromAuctions += points;
                            stats.totalPointsFromHabits += points;
                            
                            const auctionMatch = action.name.match(/: (.+)$/);
                            if (auctionMatch) {
                                const challengeName = auctionMatch[1];
                                if (!stats.habitsData.challengeBreakdown[challengeName]) {
                                    stats.habitsData.challengeBreakdown[challengeName] = {
                                        tickets: 0,
                                        auctions: 0,
                                        resistances: 0,
                                        points: 0
                                    };
                                }
                                stats.habitsData.challengeBreakdown[challengeName].auctions++;
                                stats.habitsData.challengeBreakdown[challengeName].points += points;
                            }
                            break;
                            
                        case 'habit_resistance':
                            stats.habitsData.totalResistances++;
                            stats.habitsData.pointsFromResistances += points;
                            stats.totalPointsFromHabits += points;
                            
                            const resistanceMatch = action.name.match(/: (.+)$/);
                            if (resistanceMatch) {
                                const challengeName = resistanceMatch[1];
                                if (!stats.habitsData.challengeBreakdown[challengeName]) {
                                    stats.habitsData.challengeBreakdown[challengeName] = {
                                        tickets: 0,
                                        auctions: 0,
                                        resistances: 0,
                                        points: 0
                                    };
                                }
                                stats.habitsData.challengeBreakdown[challengeName].resistances++;
                                stats.habitsData.challengeBreakdown[challengeName].points += points;
                            }
                            break;
                            
                        // Retrocompatibilidad con datos antiguos
                        case 'resistencia':
                        case 'abstinencia':
                            if (action.name.includes('Resistencia') || action.name.includes('Ticket')) {
                                stats.totalPointsFromHabits += points;
                            }
                            break;
                    }
                });
            }
        });
    }
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
            <!-- Selector de Vista -->
            <div class="view-selector">
                <button class="view-selector-btn ${_currentView === 'purposes' ? 'active' : ''}" data-view="purposes">
                    <span class="view-icon">🧭</span>
                    <span class="view-label">Propósitos</span>
                </button>
                <button class="view-selector-btn ${_currentView === 'missions' ? 'active' : ''}" data-view="missions">
                    <span class="view-icon">🏆</span>
                    <span class="view-label">Misiones</span>
                </button>
                <button class="view-selector-btn ${_currentView === 'habits' ? 'active' : ''}" data-view="habits">
                    <span class="view-icon">💪</span>
                    <span class="view-label">Hábitos</span>
                </button>
            </div>

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

            <!-- Grid de Estadísticas (solo para propósitos y misiones) -->
            ${_currentView !== 'habits' ? `
            <div class="stats-grid">
                ${_renderStatCard('<span class="non-mini-check"></span>', 'Completadas', stats.totalMissionsCompleted)}
                ${_renderStatCard('⏳', 'Pendientes', stats.totalMissionsIncomplete, 'Ver detalles', true)}
                ${_renderStatCard('📊', 'Tasa', `${completionRate}%`)}
                ${_renderStatCard('⭐', 'Puntos misiones', stats.totalPointsFromMissions)}
            </div>
            ` : ''}

            <!-- Todos los Propósitos -->
            ${_currentView === 'purposes' && allPurposes.length > 0 ? `
                <div class="analytics-section">
                    <div class="analytics-section-header">
                        <span class="section-icon">🧭</span>
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
                                        <span class="purpose-metric"><span class="mini-check"></span> ${purpose.missionsCompleted}</span>
                                        <span class="purpose-metric">⏳ ${purpose.missionsIncomplete}</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : ''}
            ${_currentView === 'purposes' && allPurposes.length === 0 ? '<p class="empty-message">No hay datos de propósitos</p>' : ''}

            <!-- Top Misiones -->
            ${_currentView === 'missions' && topMissions.length > 0 ? `
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
                                            <span class="mission-elegant-purpose">${mission.purposeName}</span>
                                            <div class="mission-elegant-stats">
                                                <span class="mission-stat"><span class="mini-check"></span> ${mission.completions}/${mission.totalOccurrences}</span>
                                                <span class="mission-elegant-rate ${completionRate >= 80 ? 'excellent' : completionRate >= 50 ? 'good' : 'needs-work'}">${completionRate}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : ''}
            ${_currentView === 'missions' && topMissions.length === 0 ? '<p class="empty-message">No hay datos de misiones</p>' : ''}

            <!-- Hábitos y Abstinencias -->
            ${_currentView === 'habits' && stats.totalPointsFromHabits > 0 ? `
                <div class="analytics-section">
                    <div class="analytics-section-header">
                        <span class="section-icon">💪</span>
                        <h3 class="section-title">Hábitos y Abstinencias</h3>
                    </div>
                    
                    <div class="habits-summary-grid">
                        <div class="habit-stat-card">
                            <div class="habit-stat-icon">🎫</div>
                            <div class="habit-stat-content">
                                <div class="habit-stat-value">${stats.habitsData.totalTicketsSold}</div>
                                <div class="habit-stat-label">Tickets vendidos</div>
                                <div class="habit-stat-points">${stats.habitsData.pointsFromTickets} pts</div>
                            </div>
                        </div>
                        
                        ${stats.habitsData.totalAuctionWins > 0 ? `
                        <div class="habit-stat-card highlight">
                            <div class="habit-stat-icon">🏆</div>
                            <div class="habit-stat-content">
                                <div class="habit-stat-value">${stats.habitsData.totalAuctionWins}</div>
                                <div class="habit-stat-label">Subastas realizadas</div>
                                <div class="habit-stat-points">${stats.habitsData.pointsFromAuctions} pts</div>
                            </div>
                        </div>
                        ` : ''}
                        
                        ${stats.habitsData.totalResistances > 0 ? `
                        <div class="habit-stat-card">
                            <div class="habit-stat-icon">🛡️</div>
                            <div class="habit-stat-content">
                                <div class="habit-stat-value">${stats.habitsData.totalResistances}</div>
                                <div class="habit-stat-label">Resistencias</div>
                                <div class="habit-stat-points">${stats.habitsData.pointsFromResistances} pts</div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    
                    ${Object.keys(stats.habitsData.challengeBreakdown).length > 0 ? `
                    <div class="habits-challenges-breakdown">
                        <h4 class="breakdown-title">Desglose por Reto</h4>
                        <div class="challenges-list">
                            ${Object.entries(stats.habitsData.challengeBreakdown)
                                .sort((a, b) => b[1].points - a[1].points)
                                .map(([name, data]) => `
                                <div class="challenge-breakdown-item">
                                    <div class="challenge-breakdown-header">
                                        <span class="challenge-name">${name}</span>
                                        <span class="challenge-points">${data.points} pts</span>
                                    </div>
                                    <div class="challenge-breakdown-stats">
                                        ${data.tickets > 0 ? `<span class="breakdown-stat">🎫 ${data.tickets}</span>` : ''}
                                        ${data.auctions > 0 ? `<span class="breakdown-stat">🏆 ${data.auctions}</span>` : ''}
                                        ${data.resistances > 0 ? `<span class="breakdown-stat">🛡️ ${data.resistances}</span>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="habits-total">
                        <span class="habits-total-label">Total de Hábitos:</span>
                        <span class="habits-total-value">${stats.totalPointsFromHabits} pts</span>
                    </div>
                </div>
            ` : ''}
            ${_currentView === 'habits' && stats.totalPointsFromHabits === 0 ? '<p class="empty-message">No hay datos de hábitos</p>' : ''}
        `;

        _initNavigationListeners();
        _initViewSelectorListeners();
    }

    function _initViewSelectorListeners() {
        const viewButtons = document.querySelectorAll('.view-selector-btn');
        viewButtons.forEach(btn => {
            btn.onclick = () => {
                _currentView = btn.dataset.view;
                _renderAnalytics();
            };
        });
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
                                    <span class="mission-purpose">${mission.purposeName}</span>
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