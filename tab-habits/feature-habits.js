// feature-habits.js
// Sistema simplificado de retos de abstinencia con tickets

(function() {
    'use strict';
    // --- Private State ---
    let timerUpdateInterval = null;
    /**
     * Transforma el nombre de un hábito en un mensaje motivacional positivo
     * @param {string} habitName - Nombre del hábito a transformar
     * @returns {string} - Mensaje motivacional
     */
    const generateMotivationalMessage = (habitName) => {
        const messages = [
            `Libre de ${habitName}`,
            `Superando ${habitName}`,
            `Venciendo ${habitName}`,
            `Sin ${habitName}`,
            `Rompiendo con ${habitName}`,
            `Dejando atrás ${habitName}`,
            `Construyendo una vida sin ${habitName}`
        ];
        
        // Usar el hash del nombre para seleccionar consistentemente el mismo mensaje
        let hash = 0;
        for (let i = 0; i < habitName.length; i++) {
            const char = habitName.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convertir a 32bit integer
        }
        
        const index = Math.abs(hash) % messages.length;
        return messages[index];
    };

    /**
     * Formatea una duración en milisegundos a un string legible
     * @param {number} ms - Milisegundos a formatear
     * @returns {string} - La duración formateada
     */
    const formatDuration = (ms) => {
        if (ms <= 0) return '0m';
        const totalMinutes = Math.floor(ms / (60 * 1000));
        const hours = Math.floor(totalMinutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${totalMinutes % 60}m`;
        return `${totalMinutes}m`;
    };


    /**
     * Obtiene el título del gráfico según la temporalidad
     * @param {number} groupingDays - Días de agrupamiento
     * @returns {string} - Título del gráfico
     */
    const getChartTitle = (groupingDays) => {
        switch(groupingDays) {
            case 0: return 'Tiempo entre consumos';
            case 1: return 'Tiempo promedio entre consumos (1d)';
            case 3: return 'Tiempo promedio entre consumos (3d)';
            case 7: return 'Tiempo promedio entre consumos (1w)';
            case 30: return 'Tiempo promedio entre consumos (1M)';
            default: return 'Tiempo entre consumos';
        }
    };

    /**
     * Cicla a la siguiente temporalidad
     * @param {number} currentTimeframe - Temporalidad actual
     * @returns {number} - Nueva temporalidad
     */
    const cycleTimeframe = (currentTimeframe) => {
        const cycle = [0, 1, 3, 7, 30];
        const currentIndex = cycle.indexOf(currentTimeframe);
        const nextIndex = (currentIndex + 1) % cycle.length;
        return cycle[nextIndex];
    };

    /**
     * Genera datos para el gráfico de consumo histórico real con agrupamiento automático
     * @param {Object} challenge - El reto de abstinencia
     * @param {number} groupingDays - Días de agrupamiento (0=individual, 1=diario, 3=3días, 7=semanal, 30=mensual)
     * @returns {Array} - Array de puntos para el gráfico
     */
    const generateConsumptionChart = (challenge, groupingDays = 0) => {
        const history = challenge.consumptionHistory;
        
        // Filtrar solo consumos reales (cuando el usuario gasta tickets)
        const realConsumptions = history.filter(item => item.type === 'real');
        
        if (realConsumptions.length === 0) {
            // Si no hay consumos reales, solo mostrar la abstinencia actual
            const now = Date.now();
            const lastConsumption = new Date(challenge.lastConsumptionTime).getTime();
            const currentAbstinence = now - lastConsumption;
            
            return [{
                interval: currentAbstinence,
                isCurrent: true,
                timestamp: now
            }];
        }
        
        const now = Date.now();
        
        // Calcular intervalos entre consumos reales
        const intervals = [];
        for (let i = 1; i < realConsumptions.length; i++) {
            const prevTime = new Date(realConsumptions[i - 1].timestamp).getTime();
            const currentTime = new Date(realConsumptions[i].timestamp).getTime();
            const interval = currentTime - prevTime;
            
            intervals.push({
                interval: interval,
                isConsumption: true,
                timestamp: currentTime
            });
        }
        
        let chartData;
        
        // Si groupingDays es 0, mostrar intervalos individuales
        if (groupingDays === 0) {
            chartData = intervals;
        } else if (groupingDays === 1) {
            // Vista diaria (agrupar de 1 en 1, máx 30 barras)
            chartData = groupIntervalsByPeriod(intervals, 1, 30);
        } else if (groupingDays === 3) {
            // Vista de 3 días (agrupar de 3 en 3, máx 30 barras)
            chartData = groupIntervalsByPeriod(intervals, 3, 30);
        } else if (groupingDays === 7) {
            // Vista semanal (agrupar de 7 en 7, máx 20 barras)
            chartData = groupIntervalsByPeriod(intervals, 7, 20);
        } else if (groupingDays === 30) {
            // Vista mensual (agrupar de 30 en 30, máx 12 barras)
            chartData = groupIntervalsByPeriod(intervals, 30, 12);
        } else {
            // Vista personalizada
            chartData = groupIntervalsByPeriod(intervals, groupingDays, 30);
        }
        
        // --- FIN DE LA LÓGICA MODIFICADA ---
        
        // Agregar abstinencia actual (Sin cambios)
        const lastRealConsumption = new Date(realConsumptions[realConsumptions.length - 1].timestamp).getTime();
        const currentAbstinence = now - lastRealConsumption;
        
        chartData.push({
            interval: currentAbstinence,
            isCurrent: true,
            timestamp: now
        });
        
        return chartData;
    };

/**
     * Agrupa intervalos en períodos de 'daysPerGroup' días, calculando el promedio.
     * @param {Array} intervals - Los intervalos de consumo.
     * @param {number} daysPerGroup - Número de días por cada barra (ej: 1 para diario, 7 para semanal).
     * @param {number} maxBars - Número máximo de barras a devolver.
     * @returns {Array} - Array de datos agrupados.
     */
    const groupIntervalsByPeriod = (intervals, daysPerGroup, maxBars) => {
        const groups = {};
        const dayMs = 24 * 60 * 60 * 1000;
        
        // El "período" de tiempo en milisegundos
        const periodMs = daysPerGroup * dayMs;

        intervals.forEach(item => {
            const date = new Date(item.timestamp);
            date.setHours(0, 0, 0, 0); // Normalizar a medianoche
            
            let groupStartTimestamp;

            // Lógica especial para mantener el alineamiento de semanas con Lunes
            if (daysPerGroup === 7) {
                const dayOfWeek = date.getDay(); // 0 = domingo, 1 = lunes
                const daysToMonday = (dayOfWeek === 0) ? 6 : (dayOfWeek - 1);
                groupStartTimestamp = date.getTime() - (daysToMonday * dayMs);
            } else {
                // Agrupamiento genérico (incluyendo 1 día)
                // Redondea el timestamp al bloque de 'periodMs' más cercano
                groupStartTimestamp = Math.floor(date.getTime() / periodMs) * periodMs;
            }
            
            // Usamos el timestamp de inicio como clave
            const groupKey = groupStartTimestamp.toString();

            if (!groups[groupKey]) {
                groups[groupKey] = {
                    intervals: [],
                    timestamp: groupStartTimestamp
                };
            }
            
            groups[groupKey].intervals.push(item.interval);
        });

        // Convertir a array con promedios
        return Object.keys(groups)
            .map(key => {
                const group = groups[key];
                const avgInterval = group.intervals.reduce((sum, val) => sum + val, 0) / group.intervals.length;
                
                return {
                    interval: avgInterval,
                    isConsumption: true,
                    timestamp: group.timestamp
                };
            })
            .sort((a, b) => a.timestamp - b.timestamp) // Ordenar por fecha
            .slice(-maxBars); // Limitar al número de barras
    };

/**
     * Renderiza el gráfico de consumo como barras SVG
     * @param {Array} chartData - Datos del gráfico
     * @param {number} maxInterval - Intervalo máximo para normalizar
     * @returns {string} - HTML del gráfico SVG
     */
    const renderConsumptionChart = (chartData, maxInterval) => {
        if (chartData.length === 0) {
            return '<div class="chart-empty">Gasta tu primer ticket para ver el historial de consumo</div>';
        }
        
        const width = 280;
        const height = 80;
        const gap = 1;
        
        // --- INICIO DE LA CORRECCIÓN ---
        
        // 1. Determinar cuántos "slots" (barras) vamos a dibujar
        const totalSlots = Math.max(chartData.length, 20);
        
        // 2. Calcular el ancho de cada "slot" (barra + gap)
        //    Esto nos da el espaciado total para cada punto de datos.
        const slotWidth = width / totalSlots;
        
        // 3. El ancho real de la barra es el ancho del slot MENOS el gap
        //    Nos aseguramos de que sea al menos 1px de ancho.
        const barWidth = Math.max(1, slotWidth - gap);
        
        // --- FIN DE LA CORRECCIÓN ---
        
        let bars = '';
        
        // Renderizar barras
        chartData.forEach((point, index) => {
            const normalizedHeight = Math.max(2, (point.interval / maxInterval) * height);
            
            // 4. La posición 'x' es simplemente el índice por el ancho del slot
            const x = index * slotWidth;
            const y = height - normalizedHeight;
            
            let barClass = 'chart-bar';
            if (point.isCurrent) barClass += ' current';
            else if (point.isConsumption) barClass += ' consumption';
            
            // Usamos el 'barWidth' corregido aquí
            bars += `<rect class="${barClass}" x="${x}" y="${y}" width="${barWidth}" height="${normalizedHeight}"></rect>`;
        });
        
        
        return `
            <svg class="consumption-chart" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
                ${bars}
            </svg>
        `;
    };
    /**
     * Formatea tiempo restante para el próximo ticket
     * @param {number} ms - Milisegundos restantes
     * @returns {string} - Tiempo formateado
     */
    const formatTimeRemaining = (ms) => {
        if (ms <= 0) return '¡Ticket disponible!';
        const totalSeconds = Math.floor(ms / 1000);
        const days = Math.floor(totalSeconds / (24 * 60 * 60));
        const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
        const seconds = totalSeconds % 60;
        
        if (days > 0) return `${days}d ${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m ${seconds}s`;
        return `${seconds}s`;
    };
    /**
     * Actualiza el estado de los retos, generando tickets cuando es necesario
     * ✅ CRÍTICO: Usa flag autoGenerated para no exportar a GitHub
     * @param {Object} challenge - El reto de abstinencia
     */
    const updateChallengeState = (challenge) => {
        if (!challenge || !challenge.isActive) return;
    
        const now = Date.now();
        const lastTicketGen = new Date(challenge.lastTicketGeneratedTime).getTime();
        const timeSinceLastTicket = now - lastTicketGen;
        
        // ¿Cuántos tickets deberían generarse?
        const ticketsDue = Math.floor(timeSinceLastTicket / challenge.initialInterval);
        
        if (ticketsDue > 0) {
            const dailyLimit = App.state.getDailyTicketLimit(challenge.id);
            const maxTicketsToAdd = Math.max(0, dailyLimit - challenge.availableTickets);
            const ticketsToAdd = Math.min(ticketsDue, maxTicketsToAdd);
            
            if (ticketsToAdd > 0) {
                challenge.availableTickets += ticketsToAdd;
                
                // Actualizar timestamp del último ticket generado
                challenge.lastTicketGeneratedTime = new Date(
                    lastTicketGen + (ticketsDue * challenge.initialInterval)
                ).toISOString();
                
                // ✅ CRÍTICO: Marcar como actualización automática
                App.state.updateAbstinenceChallenge(challenge, { autoGenerated: true });
            }
        }
    
        // Verificar si el reto debe completarse
        const lastConsumption = new Date(challenge.lastConsumptionTime).getTime();
        const daysSinceLastConsumption = Math.floor((now - lastConsumption) / (24 * 60 * 60 * 1000));
        
        if (daysSinceLastConsumption >= challenge.successDays) {
            challenge.isActive = false;
            // ✅ Completar reto SÍ debe exportarse (es un evento importante)
            App.state.updateAbstinenceChallenge(challenge, { autoGenerated: false });
            App.events.emit('shownotifyMessage', `¡Reto "${challenge.name}" completado con éxito! 🏆`);
        }
    };

    const updateAbstinenceTimers = () => {
        const challengeCards = document.querySelectorAll('.abstinence-card');
        if (challengeCards.length === 0) {
            if (timerUpdateInterval) {
                clearInterval(timerUpdateInterval);
                timerUpdateInterval = null;
            }
            return;
        }
        
        const now = new Date();
        challengeCards.forEach(card => {
            const challengeId = card.dataset.id;
            const challenge = App.state.getAbstinenceChallengeById(challengeId);
            if (!challenge || !challenge.isActive) return;
            
            updateChallengeState(challenge);
            const stats = App.state.getChallengeStats(challengeId);
            if (!stats) return;
    
            // Actualizar tiempo de abstinencia actual
            const currentAbstinenceElement = card.querySelector('.current-abstinence-value');
            if (currentAbstinenceElement) {
                currentAbstinenceElement.textContent = formatDuration(stats.currentAbstinenceTime);
            }
    
            // Actualizar timer del próximo ticket
            const lastTicketGen = new Date(challenge.lastTicketGeneratedTime).getTime();
            const timeSinceLastTicket = now.getTime() - lastTicketGen;
            const timeUntilNextTicket = challenge.initialInterval - (timeSinceLastTicket % challenge.initialInterval);
            const nextTicketElement = card.querySelector('.next-ticket');
            if (nextTicketElement) {
                nextTicketElement.textContent = `Próximo: ${formatTimeRemaining(timeUntilNextTicket)}`;
            }
            
            // Actualizar contador de tickets con límite
            const ticketsElement = card.querySelector('.tickets-available');
            if (ticketsElement) {
                const dailyLimit = App.state.getDailyTicketLimit(challengeId);
                ticketsElement.textContent = `${challenge.availableTickets}/${dailyLimit} tickets`;
                
                // Actualizar clases de estado
                ticketsElement.className = 'tickets-available';
                if (challenge.availableTickets >= dailyLimit) {
                    ticketsElement.classList.add('at-limit');
                } else if (challenge.availableTickets >= dailyLimit - 1) {
                    ticketsElement.classList.add('near-limit');
                }
            }
            
            // Actualizar gráfico solo si la abstinencia actual ha cambiado significativamente
            // (cada 2 segundos para evitar saturar la app)
            const chartContainer = card.querySelector('.chart-container');
            if (chartContainer) {
                const currentMinute = Math.floor(now.getTime() / (2 * 1000));
                const lastUpdate = parseInt(chartContainer.dataset.lastUpdate || '0');
                
                if (currentMinute !== lastUpdate) {
                    const timeframe = App.state.getChartTimeframe(challengeId);
                    const chartData = generateConsumptionChart(challenge, timeframe);
                    const maxInterval = Math.max(...chartData.map(p => p.interval), challenge.initialInterval);
                    chartContainer.innerHTML = renderConsumptionChart(chartData, maxInterval);
                    chartContainer.dataset.lastUpdate = currentMinute.toString();
                }
            }
    
            // ✅ ACTUALIZAR TODOS LOS METRIC-VALUE
            const metricItems = card.querySelectorAll('.metric-item');
            metricItems.forEach((item, index) => {
                const valueElement = item.querySelector('.metric-value');
                if (!valueElement) return;
                
                if (index === 0) { // Inicial
                    valueElement.textContent = formatDuration(stats.initialInterval);
                } else if (index === 1) { // Promedio histórico
                    valueElement.textContent = formatDuration(stats.totalAverage);
                } else if (index === 2) { // Últimos X días
                    valueElement.textContent = formatDuration(stats.recentAverage);
                }
            });
    
            // ✅ ACTUALIZAR METRIC-CHANGE CON SELECCIÓN ESPECÍFICA
            // Usamos nth-child para evitar ambigüedades
            const totalChangeElement = card.querySelector('.metric-item:nth-child(2) .metric-change');
            if (totalChangeElement) {
                const sign = stats.totalChange.isImprovement ? '+' : '-';
                totalChangeElement.textContent = `${sign}${stats.totalChange.percentage}%`;
                totalChangeElement.className = `metric-change ${stats.totalChange.isImprovement ? 'improvement' : 'decline'}`;
            }
    
            const recentChangeElement = card.querySelector('.metric-item:nth-child(3) .metric-change');
            if (recentChangeElement) {
                const sign = stats.recentChange.isImprovement ? '+' : '-';
                recentChangeElement.textContent = `${sign}${stats.recentChange.percentage}%`;
                recentChangeElement.className = `metric-change ${stats.recentChange.isImprovement ? 'improvement' : 'decline'}`;
            }
    
            // Actualizar botones
            const spendBtn = card.querySelector('.spend-btn');
            const auctionBtn = card.querySelector('.auction-btn, .sell-btn');
            
            if (challenge.availableTickets > 0) {
                if (spendBtn) {
                    spendBtn.textContent = 'Gastar ticket';
                    spendBtn.classList.add('available');
                    spendBtn.classList.remove('waiting');
                }
                if (auctionBtn) {
                    const canAuction = stats.hasX2Bonus;
                    auctionBtn.textContent = canAuction ? 'Subastar ticket' : 'Vender ticket';
                    auctionBtn.className = canAuction ? 'auction-btn available' : 'sell-btn available';
                    auctionBtn.style.display = 'flex';
                }
            } else {
                if (spendBtn) {
                    spendBtn.textContent = 'Esperando ticket...';
                    spendBtn.classList.add('waiting');
                    spendBtn.classList.remove('available');
                }
                if (auctionBtn) {
                    auctionBtn.style.display = 'none';
                }
            }
    
        });
    };

    const renderAbstinenceChallenges = (challenges) => {
        const challengesList = document.getElementById('challengesList');
        if (!challengesList) return;
        const abstinenceChallenges = challenges.filter(c => c.type === 'abstinence');
    
        if (abstinenceChallenges.length === 0) {
            challengesList.innerHTML = `
                <div class="empty-list-message">
                    <p>No hay retos de abstinencia activos.</p>
                    <p>¡Crea uno para empezar tu camino hacia un hábito más saludable!</p>
                </div>`;
            return;
        }
        const now = new Date();
        challengesList.innerHTML = abstinenceChallenges.map(challenge => {
            const { id, name, isActive, lastConsumptionTime, availableTickets, nextTicketTime } = challenge;
            const stats = App.state.getChallengeStats(id);
            if (!stats) return '';
            
            const statusClass = isActive ? (availableTickets > 0 ? 'available' : 'waiting') : 'completed';
            const lastTicketGen = new Date(challenge.lastTicketGeneratedTime).getTime();
            const timeSinceLastTicket = now.getTime() - lastTicketGen;
            const timeRemaining = challenge.initialInterval - (timeSinceLastTicket % challenge.initialInterval);
            
            // Determinar si puede subastar o solo vender
            const canAuction = stats.hasX2Bonus;
            const sellPoints = challenge.baseTicketPoints;
            const buttonText = canAuction ? 'Subastar ticket' : 'Vender ticket';
            const buttonClass = canAuction ? 'auction-btn' : 'sell-btn';
            return `
                <div class="abstinence-card ${statusClass}" data-id="${id}">
                    <button class="delete-btn" data-challenge-id="${id}" title="Eliminar reto">🗑️</button>
                    <div class="card-header">
                        <div class="header-content">
                            <h3 class="challenge-name">${generateMotivationalMessage(name)}</h3>
                            <div class="abstinence-info">
                                <div class="abstinence-time">
                                    <span class="current-abstinence-value">${formatDuration(stats.currentAbstinenceTime)}</span>
                                    <span class="abstinence-label">sin consumir</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card-body">
                        <div class="metrics-section">
                            <div class="metrics-title">Tiempo entre consumos</div>
                            <div class="metrics-grid">
                                <div class="metric-item">
                                    <span class="metric-label">Inicial</span>
                                    <span class="metric-value">${formatDuration(stats.initialInterval)}</span>
                                </div>
                                <div class="metric-item">
                                    <span class="metric-label">PROMEDIO HISTÓRICO</span>
                                    <span class="metric-value">${formatDuration(stats.totalAverage)}</span>
                                    <span class="metric-change ${stats.totalChange.isImprovement ? 'improvement' : 'decline'}">
                                        ${stats.totalChange.isImprovement ? '+' : '-'}${stats.totalChange.percentage}%
                                    </span>
                                </div>
                                <div class="metric-item">
                                    <span class="metric-label">ÚLTIMOS ${challenge.successDays} DÍAS</span>
                                    <span class="metric-value">${formatDuration(stats.recentAverage)}</span>
                                    <span class="metric-change ${stats.recentChange.isImprovement ? 'improvement' : 'decline'}">
                                        ${stats.recentChange.isImprovement ? '+' : '-'}${stats.recentChange.percentage}%
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        ${isActive ? `
                        <div class="chart-section">
                            <div class="chart-title">${(() => {
                                const timeframe = App.state.getChartTimeframe(id);
                                return getChartTitle(timeframe);
                            })()}</div>
                            <div class="chart-container">
                                ${(() => {
                                    const timeframe = App.state.getChartTimeframe(id);
                                    const chartData = generateConsumptionChart(challenge, timeframe);
                                    const maxInterval = Math.max(...chartData.map(p => p.interval), challenge.initialInterval);
                                    return renderConsumptionChart(chartData, maxInterval);
                                })()}
                            </div>
                            <div class="chart-legend">
                                <span class="legend-item"><span class="legend-color consumption"></span>Tiempos entre consumos</span>
                                <span class="legend-item"><span class="legend-color current"></span>Abstinencia actual</span>
                            </div>
                        </div>
                        
                        ` : `<div class="habit-completed">¡Reto completado con éxito! 🏆</div>`}
                        
                        ${isActive ? `
                        <div class="tickets-info">
                            <div class="tickets-summary">
                                <span class="tickets-available ${(() => {
                                    const dailyLimit = App.state.getDailyTicketLimit(id);
                                    if (availableTickets >= dailyLimit) return 'at-limit';
                                    if (availableTickets >= dailyLimit - 1) return 'near-limit';
                                    return '';
                                })()}">${availableTickets}/${(() => App.state.getDailyTicketLimit(id))()} tickets</span>
                                <span class="next-ticket">Próximo: ${formatTimeRemaining(timeRemaining)}</span>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    
                    ${isActive ? `
                    <div class="card-footer">
                        <div class="footer-actions">
                            <button class="spend-btn ${availableTickets > 0 ? 'available' : 'waiting'}" data-challenge-id="${id}">
                                ${availableTickets > 0 ? 'Gastar ticket' : 'Esperando ticket...'}
                            </button>
                            <button class="${buttonClass} ${availableTickets > 0 ? 'available' : 'disabled'}" 
                                    style="display: flex;" data-challenge-id="${id}"
                                    ${availableTickets === 0 ? 'disabled' : ''}>
                                ${buttonText}
                            </button>
                        </div>
                        
                        ${!canAuction && availableTickets > 0 ? `
                            <div class="footer-hint">
                                💡 Mejora tu tiempo promedio para desbloquear subastas
                            </div>
                        ` : canAuction && availableTickets > 0 ? `
                            <div class="footer-hint">
                                🚀 ¡Tiempo mejorado! Puedes subastar por más puntos
                            </div>
                        ` : ''}
                    </div>
                    ` : ''}
                </div>`;
        }).join('');
    };

    function handleSpendTicket(challengeId) {
        const challenge = App.state.getAbstinenceChallengeById(challengeId);
        if (!challenge) return;

        if (challenge.availableTickets > 0) {
            App.state.spendTicket(challengeId);
        }
    }

    function handleAuctionOrSellTicket(challengeId) {
        const challenge = App.state.getAbstinenceChallengeById(challengeId);
        if (!challenge) return;

        if (challenge.availableTickets > 0) {
            const stats = App.state.getChallengeStats(challengeId);
            const canAuction = stats && stats.hasX2Bonus;
            const basePrice = challenge.baseTicketPoints;
            
            if (canAuction) {
                // Ejecutar subasta
                const auctionChallenge = {
                    ...challenge,
                    firstLevelPoints: basePrice,
                    currentLevel: 1,
                    incrementPercent: 0,
                    bestStreak: challenge.bestAbstinenceTime || 0
                };
                
                // Mostrar modal de subasta
                if (App.ui.habits && App.ui.habits.showSimpleAuction) {
                    App.ui.habits.showSimpleAuction(auctionChallenge);
                } else {
                    console.error('❌ Modal de subasta no disponible');
                    // Fallback: vender directamente
                    App.state.sellTicket(challengeId);
                }
            } else {
                // Venta directa al precio base
                App.state.sellTicket(challengeId);
            }
        }
    }


    // --- Public API ---
    App.ui.habits = {
        init: function() {
            this.render();
            this.initListeners();
        },
        render: function() {
            const habitsContainer = document.getElementById('tab-habits');
            if (!habitsContainer) return;
            const content = `
                <h2 id="habitsTitle">Retos de Abstinencia</h2>
                <div class="actions-header">
                    <button id="createAbstinenceChallengeBtn" class="discreet-btn">
                        <span class="icon">⚡</span> Nuevo Reto de Abstinencia
                    </button>
                </div>
                <div id="challengesList" class="abstinence-challenges-list"></div>`;
            habitsContainer.innerHTML = content;
            const habitsState = App.state.get().habits;
            renderAbstinenceChallenges(habitsState.challenges);
            updateAbstinenceTimers();
            if (!timerUpdateInterval) {
                timerUpdateInterval = setInterval(updateAbstinenceTimers, 1000);
            }
        },
        initListeners: function() {
            const habitsContainer = document.getElementById('tab-habits');
            if (!habitsContainer) return;

            // Escuchar tanto cambios manuales como automáticos
            const handleHabitsUpdate = () => {
                // Solo re-renderizar si hay cambios estructurales importantes
                const currentChallenges = App.state.get().habits.challenges;
                const currentCards = document.querySelectorAll('.abstinence-card');
                
                // Re-renderizar solo si el número de retos cambió o hay retos nuevos/eliminados
                if (currentCards.length !== currentChallenges.length) {
                    this.render();
                    setTimeout(() => {
                        const chartContainers = document.querySelectorAll('.chart-container');
                        chartContainers.forEach(container => {
                            container.dataset.lastUpdate = '0';
                        });
                    }, 100);
                } else {
                    // Solo actualizar los timers sin re-renderizar todo
                    updateAbstinenceTimers();
                }
            };
            
            // Escuchar ambos eventos
            App.events.on('habitsUpdated', handleHabitsUpdate);
            App.events.on('habitsAutoUpdated', handleHabitsUpdate);
            App.events.on('stateRefreshed', () => this.render());

            habitsContainer.addEventListener('click', (e) => {
                const target = e.target;

                if (target.id === 'createAbstinenceChallengeBtn' || target.closest('#createAbstinenceChallengeBtn')) {
                    App.ui.habits.showCreationModal();
                    return;
                }

                const spendBtn = target.closest('.spend-btn');
                if (spendBtn) {
                    const challengeId = spendBtn.dataset.challengeId;
                    if (challengeId) handleSpendTicket(challengeId);
                    return;
                }
                
                const auctionBtn = target.closest('.auction-btn, .sell-btn');
                if (auctionBtn) {
                    const challengeId = auctionBtn.dataset.challengeId;
                    if (challengeId) handleAuctionOrSellTicket(challengeId);
                    return;
                }

                const deleteBtn = target.closest('.delete-btn');
                if (deleteBtn) {
                    const challengeId = deleteBtn.dataset.challengeId;
                    if (challengeId) {
                        App.state.deleteAbstinenceChallenge(challengeId);
                    }
                    return;
                }

                // Manejar click en toda la sección del gráfico para cambiar temporalidad
                const chartSection = target.closest('.chart-section');
                if (chartSection) {
                    const card = chartSection.closest('.abstinence-card');
                    const challengeId = card?.dataset.id;
                    
                    if (challengeId) {
                        const currentTimeframe = App.state.getChartTimeframe(challengeId);
                        const nextTimeframe = cycleTimeframe(currentTimeframe);
                        App.state.setChartTimeframe(challengeId, nextTimeframe);
                        
                        // Actualizar el título
                        const chartTitle = chartSection.querySelector('.chart-title');
                        if (chartTitle) {
                            chartTitle.textContent = getChartTitle(nextTimeframe);
                        }
                        
                        // Regenerar el gráfico
                        const chartContainer = chartSection.querySelector('.chart-container');
                        if (chartContainer) {
                            const challenge = App.state.getAbstinenceChallengeById(challengeId);
                            const chartData = generateConsumptionChart(challenge, nextTimeframe);
                            const maxInterval = Math.max(...chartData.map(p => p.interval), challenge.initialInterval);
                            chartContainer.innerHTML = renderConsumptionChart(chartData, maxInterval);
                        }
                    }
                    return;
                }
            });
        },
        stopUpdates: function() {
            if (timerUpdateInterval) {
                clearInterval(timerUpdateInterval);
                timerUpdateInterval = null;
            }
        },
        showSimpleAuction: function(challenge) {
            // Esta función será implementada por modal-subasta-simple.js
        }
    };
})(window.App = window.App || {});