// tab-analytics/feature-analytics.js
// Sistema de análisis simplificado enfocado en misiones y propósitos
(function(App) {
    'use strict';

    // --- PRIVATE STATE ---
    let _currentPeriod = 7; // Periodo por defecto: últimos 7 días
    let _currentView = 'overview'; // 'overview', 'purposes', 'missions'

    // --- PRIVATE METHODS ---

    /**
     * Calcula estadísticas para un periodo específico
     */
    function _calculateStats(days) {
        const state = App.state.get();
        const now = new Date();
        const startDate = App.utils.addDateUnit(now, -days, 'day');
        
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
                if (taskDate >= startDate && taskDate <= now) {
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
                            const isEsporadic = category && category.name === "Propósito esporádico";

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

                            // Solo contar puntos de misiones NO esporádicas
                            if (pointsEarned > 0 && !isEsporadic) {
                                stats.totalPointsFromMissions += pointsEarned;
                            }

                            // Datos por propósito (solo si tiene propósito válido)
                            if (category && !isEsporadic) {
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

                            // Datos por misión individual
                            if (mission && !isEsporadic) {
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
                return histDate >= startDate && histDate <= now;
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
    function _renderStatCard(icon, label, value, subtitle = '') {
        return `
            <div class="stat-card">
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
                <div class="stats-grid">
                    ${_renderStatCard('✅', 'Misiones Completadas', stats.totalMissionsCompleted)}
                    ${_renderStatCard('⏳', 'Misiones Pendientes', stats.totalMissionsIncomplete)}
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
     * Renderiza la vista por propósitos (detallada)
     */
    function _renderPurposes(stats) {
        const container = document.getElementById('analyticsContent');
        if (!container) return;

        const purposesArray = Object.values(stats.purposesData)
            .sort((a, b) => b.points - a.points);

        if (purposesArray.length === 0) {
            container.innerHTML = '<p class="empty-message">No hay datos de propósitos para este periodo</p>';
            return;
        }

        const maxPoints = Math.max(...purposesArray.map(p => p.points));

        container.innerHTML = `
            <div class="analytics-purposes">
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
    }

    /**
     * Renderiza la vista por misiones
     */
    function _renderMissions(stats) {
        const container = document.getElementById('analyticsContent');
        if (!container) return;

        const missionsArray = Object.values(stats.missionsData)
            .filter(m => m.points > 0) // Solo misiones con puntos
            .sort((a, b) => b.points - a.points)
            .slice(0, 20); // Top 20

        if (missionsArray.length === 0) {
            container.innerHTML = '<p class="empty-message">No hay datos de misiones para este periodo</p>';
            return;
        }

        container.innerHTML = `
            <div class="analytics-missions">
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
    }

    // --- PUBLIC API ---
    App.ui.analytics = {
        render: function() {
            const stats = _calculateStats(_currentPeriod);

            // Renderizar según la vista actual
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

        setPeriod: function(days) {
            _currentPeriod = days;
            this.render();
        },

        setView: function(view) {
            _currentView = view;
            
            // Actualizar botones activos
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(`[data-view="${view}"]`)?.classList.add('active');
            
            this.render();
        },

        initListeners: function() {
            // Listeners para cambio de periodo
            document.querySelectorAll('.period-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const days = parseInt(btn.dataset.days, 10);
                    this.setPeriod(days);
                });
            });

            // Listeners para cambio de vista
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const view = btn.dataset.view;
                    this.setView(view);
                });
            });

            // Escuchar eventos de actualización
            App.events.on('todayTasksUpdated', () => this.render());
            App.events.on('historyUpdated', () => this.render());
            App.events.on('stateRefreshed', () => this.render());
        }
    };

})(window.App = window.App || {});