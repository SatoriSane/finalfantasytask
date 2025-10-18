// tab-analytics/feature-analytics.js
// Sistema de análisis y estadísticas para FFTask
(function(App) {
    'use strict';

    // --- PRIVATE STATE ---
    let _currentPeriod = 7; // Periodo por defecto: últimos 7 días
    let _currentView = 'overview'; // 'overview', 'categories', 'missions'

    // --- PRIVATE METHODS ---

    /**
     * Calcula estadísticas para un periodo específico
     */
    function _calculateStats(days) {
        const state = App.state.get();
        const now = new Date();
        const startDate = App.utils.addDateUnit(now, -days, 'day');
        
        const stats = {
            totalPoints: 0,
            earnedPoints: 0,
            spentPoints: 0,
            tasksCompleted: 0,
            categoriesData: {},
            missionsData: {},
            dailyData: [],
            streaks: {
                current: 0,
                longest: 0
            }
        };

        // Procesar historial
        if (state.history && Array.isArray(state.history)) {
            const relevantHistory = state.history.filter(h => {
                const histDate = App.utils.normalizeDateToStartOfDay(h.date);
                return histDate >= startDate && histDate <= now;
            });

            relevantHistory.forEach(day => {
                stats.earnedPoints += day.earned || 0;
                stats.spentPoints += day.spent || 0;
                
                // Datos diarios para gráficas
                stats.dailyData.push({
                    date: day.date,
                    earned: day.earned || 0,
                    spent: day.spent || 0,
                    net: (day.earned || 0) - (day.spent || 0)
                });

                // Procesar acciones por categoría
                if (day.actions && Array.isArray(day.actions)) {
                    day.actions.forEach(action => {
                        if (action.type === 'tarea') {
                            stats.tasksCompleted++;
                        }
                    });
                }
            });
        }

        // Procesar tareas completadas por categoría
        if (state.tasksByDate) {
            Object.keys(state.tasksByDate).forEach(dateStr => {
                const taskDate = App.utils.normalizeDateToStartOfDay(dateStr);
                if (taskDate >= startDate && taskDate <= now) {
                    const tasks = state.tasksByDate[dateStr];
                    
                    tasks.forEach(task => {
                        if (task.completed && task.missionId) {
                            const mission = state.missions.find(m => m.id === task.missionId);
                            if (mission) {
                                const categoryId = mission.categoryId || task.categoryId;
                                const category = state.categories.find(c => c.id === categoryId);
                                
                                if (category) {
                                    if (!stats.categoriesData[category.id]) {
                                        stats.categoriesData[category.id] = {
                                            name: category.name,
                                            points: 0,
                                            tasksCompleted: 0,
                                            missions: new Set()
                                        };
                                    }
                                    
                                    stats.categoriesData[category.id].points += task.points * (task.currentRepetitions || 1);
                                    stats.categoriesData[category.id].tasksCompleted++;
                                    stats.categoriesData[category.id].missions.add(task.missionId);
                                }

                                // Datos por misión
                                if (!stats.missionsData[task.missionId]) {
                                    stats.missionsData[task.missionId] = {
                                        name: mission.name,
                                        categoryName: category ? category.name : 'Sin categoría',
                                        points: 0,
                                        completions: 0
                                    };
                                }
                                stats.missionsData[task.missionId].points += task.points * (task.currentRepetitions || 1);
                                stats.missionsData[task.missionId].completions++;
                            }
                        }
                    });
                }
            });
        }

        // Convertir Sets a números
        Object.keys(stats.categoriesData).forEach(catId => {
            stats.categoriesData[catId].uniqueMissions = stats.categoriesData[catId].missions.size;
            delete stats.categoriesData[catId].missions;
        });

        // Calcular racha actual y más larga
        stats.streaks = _calculateStreaks(days);

        stats.totalPoints = stats.earnedPoints - stats.spentPoints;
        
        return stats;
    }

    /**
     * Calcula rachas de días consecutivos con actividad
     */
    function _calculateStreaks(days) {
        const state = App.state.get();
        const streaks = { current: 0, longest: 0 };
        
        if (!state.history || state.history.length === 0) return streaks;

        // Ordenar historial por fecha descendente
        const sortedHistory = [...state.history]
            .filter(h => h.earned > 0)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        if (sortedHistory.length === 0) return streaks;

        // Calcular racha actual
        const today = App.utils.getFormattedDate();
        const yesterday = App.utils.getFormattedDate(App.utils.addDateUnit(new Date(), -1, 'day'));
        
        let currentStreakCount = 0;
        let checkDate = new Date();
        
        for (let i = 0; i < days; i++) {
            const dateStr = App.utils.getFormattedDate(checkDate);
            const hasActivity = sortedHistory.some(h => h.date === dateStr && h.earned > 0);
            
            if (hasActivity) {
                currentStreakCount++;
            } else if (dateStr !== today) {
                // Si no es hoy, romper la racha
                break;
            }
            
            checkDate = App.utils.addDateUnit(checkDate, -1, 'day');
        }

        streaks.current = currentStreakCount;

        // Calcular racha más larga en el periodo
        let longestStreak = 0;
        let tempStreak = 0;
        let prevDate = null;

        sortedHistory.forEach(h => {
            const currentDate = new Date(h.date);
            
            if (!prevDate) {
                tempStreak = 1;
            } else {
                const diffDays = Math.floor((prevDate - currentDate) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    tempStreak++;
                } else {
                    longestStreak = Math.max(longestStreak, tempStreak);
                    tempStreak = 1;
                }
            }
            
            prevDate = currentDate;
        });

        streaks.longest = Math.max(longestStreak, tempStreak);

        return streaks;
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
     * Renderiza un gráfico de barras simple
     */
    function _renderBarChart(data, maxValue) {
        if (!data || data.length === 0) {
            return '<p class="empty-message">No hay datos para este periodo</p>';
        }

        return `
            <div class="bar-chart">
                ${data.map(item => {
                    const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                    return `
                        <div class="bar-item">
                            <div class="bar-label">${item.label}</div>
                            <div class="bar-container">
                                <div class="bar-fill" style="width: ${percentage}%"></div>
                                <div class="bar-value">${item.value}</div>
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

        const avgDaily = stats.dailyData.length > 0 
            ? Math.round(stats.earnedPoints / stats.dailyData.length) 
            : 0;

        container.innerHTML = `
            <div class="analytics-overview">
                <div class="stats-grid">
                    ${_renderStatCard('⭐', 'Puntos Ganados', stats.earnedPoints, `Promedio: ${avgDaily}/día`)}
                    ${_renderStatCard('💰', 'Puntos Gastados', stats.spentPoints)}
                    ${_renderStatCard('📊', 'Balance Neto', stats.totalPoints, stats.totalPoints >= 0 ? 'Superávit' : 'Déficit')}
                    ${_renderStatCard('✅', 'Tareas Completadas', stats.tasksCompleted)}
                </div>

                <div class="streak-section">
                    <h3>🔥 Rachas de Actividad</h3>
                    <div class="streak-cards">
                        <div class="streak-card ${stats.streaks.current > 0 ? 'active' : ''}">
                            <div class="streak-value">${stats.streaks.current}</div>
                            <div class="streak-label">Racha Actual</div>
                        </div>
                        <div class="streak-card">
                            <div class="streak-value">${stats.streaks.longest}</div>
                            <div class="streak-label">Racha Más Larga</div>
                        </div>
                    </div>
                </div>

                <div class="daily-chart-section">
                    <h3>📈 Actividad Diaria</h3>
                    ${_renderDailyChart(stats.dailyData)}
                </div>
            </div>
        `;
    }

    /**
     * Renderiza un gráfico de actividad diaria
     */
    function _renderDailyChart(dailyData) {
        if (!dailyData || dailyData.length === 0) {
            return '<p class="empty-message">No hay datos diarios</p>';
        }

        const maxValue = Math.max(...dailyData.map(d => Math.max(d.earned, d.spent)));
        
        return `
            <div class="daily-chart">
                ${dailyData.slice(-14).map(day => {
                    const earnedHeight = maxValue > 0 ? (day.earned / maxValue) * 100 : 0;
                    const spentHeight = maxValue > 0 ? (day.spent / maxValue) * 100 : 0;
                    const date = new Date(day.date);
                    const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
                    
                    return `
                        <div class="daily-bar">
                            <div class="bar-group">
                                <div class="bar earned" style="height: ${earnedHeight}%" title="Ganados: ${day.earned}"></div>
                                <div class="bar spent" style="height: ${spentHeight}%" title="Gastados: ${day.spent}"></div>
                            </div>
                            <div class="day-label">${dayName}</div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="chart-legend">
                <span class="legend-item"><span class="legend-color earned"></span> Ganados</span>
                <span class="legend-item"><span class="legend-color spent"></span> Gastados</span>
            </div>
        `;
    }

    /**
     * Renderiza la vista por categorías
     */
    function _renderCategories(stats) {
        const container = document.getElementById('analyticsContent');
        if (!container) return;

        const categoriesArray = Object.values(stats.categoriesData)
            .sort((a, b) => b.points - a.points);

        if (categoriesArray.length === 0) {
            container.innerHTML = '<p class="empty-message">No hay datos de categorías para este periodo</p>';
            return;
        }

        const maxPoints = Math.max(...categoriesArray.map(c => c.points));

        container.innerHTML = `
            <div class="analytics-categories">
                <h3>🎯 Rendimiento por Propósito</h3>
                <div class="categories-list">
                    ${categoriesArray.map((cat, index) => {
                        const percentage = maxPoints > 0 ? (cat.points / maxPoints) * 100 : 0;
                        return `
                            <div class="category-item">
                                <div class="category-rank">#${index + 1}</div>
                                <div class="category-info">
                                    <div class="category-header">
                                        <span class="category-name">${cat.name}</span>
                                        <span class="category-points">${cat.points} pts</span>
                                    </div>
                                    <div class="category-progress">
                                        <div class="progress-bar">
                                            <div class="progress-fill" style="width: ${percentage}%"></div>
                                        </div>
                                    </div>
                                    <div class="category-stats">
                                        <span>✅ ${cat.tasksCompleted} tareas</span>
                                        <span>🎯 ${cat.uniqueMissions} misiones</span>
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
            .sort((a, b) => b.points - a.points)
            .slice(0, 20); // Top 20 misiones

        if (missionsArray.length === 0) {
            container.innerHTML = '<p class="empty-message">No hay datos de misiones para este periodo</p>';
            return;
        }

        container.innerHTML = `
            <div class="analytics-missions">
                <h3>🏆 Top Misiones</h3>
                <div class="missions-table">
                    <div class="table-header">
                        <span class="col-rank">#</span>
                        <span class="col-name">Misión</span>
                        <span class="col-category">Propósito</span>
                        <span class="col-completions">Compleciones</span>
                        <span class="col-points">Puntos</span>
                    </div>
                    ${missionsArray.map((mission, index) => `
                        <div class="table-row">
                            <span class="col-rank">${index + 1}</span>
                            <span class="col-name">${mission.name}</span>
                            <span class="col-category">${mission.categoryName}</span>
                            <span class="col-completions">${mission.completions}x</span>
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
                case 'categories':
                    _renderCategories(stats);
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