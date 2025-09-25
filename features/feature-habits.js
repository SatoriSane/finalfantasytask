// features/feature-habits.js
// Consolidated module for Abstinence Challenge feature

(function() {
    'use strict';

    // --- Private State ---
    let timerUpdateInterval = null;

    // --- Private Methods from ui-render-habits.js ---
    const convertToMilliseconds = (value, unit) => {
        const multipliers = {
            'minutes': 60 * 1000,
            'hours': 60 * 60 * 1000,
            'days': 24 * 60 * 60 * 1000,
            'weeks': 7 * 24 * 60 * 60 * 1000,
            'months': 30 * 24 * 60 * 60 * 1000 // Approximation
        };
        return value * (multipliers[unit] || 1);
    };

    const formatTimeRemaining = (ms) => {
        if (ms <= 0) return '¡Listo para el próximo nivel!';
        const totalSeconds = Math.floor(ms / 1000);
        const days = Math.floor(totalSeconds / (24 * 60 * 60));
        const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
        const seconds = totalSeconds % 60;
        
        // --- NUEVO: Lógica para reducir la ansiedad ---
        if (days > 0) return `${days}d ${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m ${seconds}s`;
        return `${seconds}s`;
    };

    const updateChallengeState = (challenge) => {
        if (!challenge || !challenge.isActive) return;

        const now = new Date();
        let nextAllowedTime = new Date(challenge.nextAllowedTime);
        let timeRemaining = nextAllowedTime.getTime() - now.getTime();

        let didUpdate = false;

        while (timeRemaining <= 0) {
            const createdAt = new Date(challenge.createdAt);
            const durationMs = convertToMilliseconds(challenge.totalDuration.value, challenge.totalDuration.unit);
            if (now.getTime() - createdAt.getTime() >= durationMs) {
                challenge.isActive = false;
                App.state.updateAbstinenceChallenge(challenge);
                App.events.emit('showDiscreetMessage', `¡Reto "${challenge.name}" completado! 🏆`);
                return;
            }

            challenge.currentLevel++;
            const newIntervalMs = convertToMilliseconds(challenge.currentInterval.value, challenge.currentInterval.unit) * Math.pow(1 + challenge.incrementPercent / 100, challenge.currentLevel - 1);
            
            nextAllowedTime = new Date(nextAllowedTime.getTime() + newIntervalMs);
            challenge.nextAllowedTime = nextAllowedTime.toISOString();
            
            App.state.addAvailableConsumption(challenge.id, challenge.currentLevel);
            
            timeRemaining = nextAllowedTime.getTime() - now.getTime();
            didUpdate = true;
        }

        if (didUpdate) {
            App.state.updateAbstinenceChallenge(challenge);
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
            
            const nextAllowed = new Date(challenge.nextAllowedTime);
            const timeRemaining = nextAllowed.getTime() - now.getTime();

            const timerElement = card.querySelector('.timer-display');
            if (timerElement) {
                timerElement.textContent = formatTimeRemaining(timeRemaining);
            }

            const createdAt = new Date(challenge.createdAt);
            const durationMs = convertToMilliseconds(challenge.totalDuration.value, challenge.totalDuration.unit);
            const elapsedMs = now.getTime() - createdAt.getTime();
            const progressPercent = Math.min(100, (elapsedMs / durationMs) * 100);

            const progressFill = card.querySelector('.progress-fill');
            if (progressFill) progressFill.style.width = `${progressPercent}%`;

            const progressLabel = card.querySelector('.progress-label');
            if (progressLabel) progressLabel.textContent = `Progreso del reto: ${Math.round(progressPercent)}%`;

            const consumeBtn = card.querySelector('.consume-btn');
            const sellBtn = card.querySelector('.sell-btn');
            const pointsForCurrentLevel = Math.floor(challenge.firstLevelPoints * Math.pow(1 + challenge.incrementPercent / 100, challenge.currentLevel - 1));

            if (challenge.availableConsumptions > 0) {
                if (consumeBtn) {
                    consumeBtn.textContent = `Gastar ticket (${challenge.availableConsumptions})`;
                    consumeBtn.classList.add('available');
                    consumeBtn.classList.remove('waiting');
                }
                if (sellBtn) {
                    // Actualizado: Texto del botón de venta para ser más atractivo
                    sellBtn.textContent = `Vender ticket por ${pointsForCurrentLevel} pts`;
                    sellBtn.style.display = 'inline-block';
                }
            } else {
                if (consumeBtn) {
                    consumeBtn.textContent = 'Esperando...';
                    consumeBtn.classList.add('waiting');
                    consumeBtn.classList.remove('available');
                }
                if (sellBtn) {
                    sellBtn.style.display = 'none';
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
            const {
                id, name, currentLevel, totalPoints, bestStreak,
                nextAllowedTime, isActive, finalLevel,
                createdAt, totalDuration, lastConsumptionTime
            } = challenge;
            
            const nextAllowed = new Date(nextAllowedTime);
            let timeRemaining = nextAllowed.getTime() - now.getTime();
            
            const statusClass = isActive ? (challenge.availableConsumptions > 0 ? 'available' : 'waiting') : 'completed';
            const buttonText = isActive ? (challenge.availableConsumptions > 0 ? `Consumir (${challenge.availableConsumptions})` : 'Esperando...') : 'Completado';
            const buttonClass = isActive ? (challenge.availableConsumptions > 0 ? 'available' : 'waiting') : 'completed';
            const createdAtDate = new Date(createdAt);
            const durationMs = convertToMilliseconds(totalDuration.value, totalDuration.unit);
            const elapsedMs = now.getTime() - createdAtDate.getTime();
            const progressPercent = Math.min(100, (elapsedMs / durationMs) * 100);
            const pointsForCurrentLevel = Math.floor(challenge.firstLevelPoints * Math.pow(1 + challenge.incrementPercent / 100, currentLevel - 1));

            const automaticLevelUps = challenge.automaticLevelUps || 0;
            const temptationFalls = challenge.temptationFalls || 0;
            const totalEvents = automaticLevelUps + temptationFalls;
            const successRate = totalEvents > 0 ? (automaticLevelUps / totalEvents) * 100 : 100;

            let complianceClass = '';
            if (successRate >= 80) complianceClass = 'compliance-high';
            else if (successRate >= 50) complianceClass = 'compliance-medium';
            else complianceClass = 'compliance-low';

            // --- CAMBIO CLAVE: Calculamos la Racha en tiempo real desde lastConsumptionTime ---
            const lastConsumptionDate = new Date(lastConsumptionTime);
            const currentStreakMs = now.getTime() - lastConsumptionDate.getTime();
            const formattedCurrentStreak = formatDuration(currentStreakMs);
            const formattedBestStreak = formatDuration(bestStreak);

            return `
                <div class="abstinence-card ${statusClass}" data-id="${id}">
                    <div class="abstinence-card-header">
                        <h3 class="challenge-name">${name}</h3>
                        <!-- CAMBIO: Ahora mostramos el nivel en el header para ahorrar espacio vertical -->
                        <div class="challenge-level-status">Nivel ${currentLevel}/${finalLevel}</div>
                    </div>
                    <div class="abstinence-card-body">
                        <!-- CAMBIO: Eliminamos el Nivel de aquí para hacer espacio para 3 stats por fila -->
                        <div class="challenge-stats">
                            <div class="stat-item"><span class="stat-label">Éxito reto</span><span class="stat-value ${complianceClass}">${Math.round(successRate)}%</span></div>
                            <div class="stat-item"><span class="stat-label">Racha actual</span><span class="stat-value">🔥${formattedCurrentStreak}</span></div>
                            <div class="stat-item"><span class="stat-label">Mejor Racha</span><span class="stat-value">🏆${formattedBestStreak}</span></div>
                        </div>
                        ${isActive ? `
                        <div class="timer-container">
                            <div class="timer-label">Ticket de consumición en:</div>
                            <div class="timer-display">${formatTimeRemaining(timeRemaining)}</div>
                        </div>` : `<div class="completed-message">¡Reto completado! 🏆</div>`}
                        <div class="progress-container">
                            <div class="progress-label">Progreso del reto: ${Math.round(progressPercent)}%</div>
                            <div class="progress-bar"><div class="progress-fill" style="width: ${progressPercent}%"></div></div>
                        </div>
                    </div>
                    <div class="abstinence-card-footer">
                        ${isActive ? `
                            <button class="consume-btn ${buttonClass}" data-challenge-id="${id}">${buttonText}</button>
                            <!-- Actualizado: Mensaje del botón para destacar la recompensa y el logro -->
                            <button class="sell-btn" style="display: ${challenge.availableConsumptions > 0 ? 'inline-block' : 'none'};" data-challenge-id="${id}">Vender ticket por ${pointsForCurrentLevel} pts</button>
                        ` : ''}
                        <div class="action-buttons">
                            <button class="action-btn delete-btn" data-challenge-id="${id}" title="Eliminar reto">🗑️</button>
                        </div>
                    </div>
                </div>`;
        }).join('');
    };

    function updateChallengePreview() {
        const getVal = (id, isFloat = false) => isFloat ? parseFloat(document.getElementById(id).value) : parseInt(document.getElementById(id).value);
        const currentIntervalValue = getVal('currentIntervalValue') || 1;
        const totalDurationValue = getVal('totalDurationValue') || 1;
        const incrementPercent = getVal('incrementPercent', true) || 1;
        const currentIntervalUnit = document.getElementById('currentIntervalUnit').value;

        const currentInterval = { value: currentIntervalValue, unit: currentIntervalUnit };
        const totalDuration = { value: totalDurationValue, unit: document.getElementById('totalDurationUnit').value };

        const stats = calculatePreviewStats(currentInterval, incrementPercent, totalDuration);
        document.getElementById('previewLevels').textContent = stats.finalLevel;
        document.getElementById('previewFinalWait').textContent = formatDuration(stats.finalWaitTime, currentIntervalUnit);
    }

    function calculatePreviewStats(currentInterval, incrementPercent, totalDuration) {
        const convertToMs = (value, unit) => {
            const multipliers = { 'minutes': 60000, 'hours': 3600000, 'days': 86400000, 'weeks': 604800000, 'months': 2592000000 };
            const unitKey = totalDuration.unit;
            return value * (multipliers[unit] || multipliers[unitKey]);
        };

        const totalMs = convertToMs(totalDuration.value, totalDuration.unit);
        let currentWaitTime = convertToMs(currentInterval.value, currentInterval.unit);
        let level = 1, elapsedTime = 0;

        while (elapsedTime < totalMs) {
            elapsedTime += currentWaitTime;
            if (elapsedTime < totalMs) {
                level++;
                currentWaitTime *= (1 + incrementPercent / 100);
            }
        }
        return { finalLevel: level, finalWaitTime: Math.round(currentWaitTime) };
    }

    // --- LÓGICA DE CONSUMO REVISADA ---
    function handleAbstinenceConsumption(challengeId) {
        const challenge = App.state.getAbstinenceChallengeById(challengeId);
        if (!challenge) return;

        if (challenge.availableConsumptions > 0) {
            App.state.processConsumption(challengeId);
        } else {
            showTemptationModal(challenge);
        }
    }

    // --- NUEVA FUNCIÓN PARA VENDER UN CONSUMO ---
    function handleSellConsumption(challengeId) {
        const challenge = App.state.getAbstinenceChallengeById(challengeId);
        if (!challenge || challenge.availableConsumptions === 0) return;
        App.state.sellConsumption(challengeId); // Llama a la nueva función de estado
        App.events.emit('showDiscreetMessage', `¡Felicidades! 🎉 Vendiste un ticket y fortaleciste tu autocontrol.`);
    }

    function showTemptationModal(challenge) {
        const modal = document.getElementById('temptationModal');
        if (!modal) return;

        const closeBtn = modal.querySelector('.modal-close-btn');
        const breatheBtn = document.getElementById('breatheBtn');
        const giveInBtn = document.getElementById('giveInBtn');

        const closeModal = () => {
            modal.classList.remove('visible');
        };

        const startBreathingExercise = () => {
            closeModal();
            showZenBreathingModal(challenge);
        };

        const handleGiveIn = () => {
            App.state.processConsumption(challenge.id);
            closeModal();
        };

        closeBtn.onclick = closeModal;
        breatheBtn.onclick = startBreathingExercise;
        giveInBtn.onclick = handleGiveIn;
        modal.onclick = (e) => { if (e.target === modal) closeModal(); };

        modal.classList.add('visible');
    }

    function showZenBreathingModal(challenge) {
        const zenModal = document.getElementById('zenBreathingModal');
        const zenContent = zenModal.querySelector('.zen-content');
        const zenCompletion = document.getElementById('zenCompletion');
        const breathingCircle = zenModal.querySelector('.breathing-circle');
        const breathingPhase = document.getElementById('breathingPhase');
        const breathingCount = document.getElementById('zenBreathingCount');
        const progressFill = document.getElementById('zenProgressFill');
        const zenCloseBtn = document.getElementById('zenCloseBtn');
        const zenCompleteBtn = document.getElementById('zenCompleteBtn');

        let currentBreath = 0;
        let isInhaling = true;
        let breathingInterval;

        const closeZenModal = () => {
            zenModal.classList.remove('active');
            if (breathingInterval) clearInterval(breathingInterval);
            zenContent.style.display = 'block';
            zenCompletion.style.display = 'none';
            breathingCircle.classList.remove('inhale', 'exhale');
            currentBreath = 0;
            progressFill.style.width = '0%';
        };

        const completeExercise = () => {
            if (breathingInterval) clearInterval(breathingInterval);
            App.state.recordResistance(challenge.id, challenge.name);
            zenContent.style.display = 'none';
            zenCompletion.style.display = 'block';
        };

        const updateBreathing = () => {
            if (isInhaling) {
                breathingPhase.textContent = 'Inhala profundamente...';
                breathingCircle.classList.remove('exhale');
                breathingCircle.classList.add('inhale');
            } else {
                breathingPhase.textContent = 'Exhala lentamente...';
                breathingCircle.classList.remove('inhalé');
                breathingCircle.classList.add('exhale');
                currentBreath++;
                breathingCount.textContent = 10 - currentBreath;
                const progress = (currentBreath / 10) * 100;
                progressFill.style.width = `${progress}%`;
                if (currentBreath >= 10) {
                    completeExercise();
                    return;
                }
            }
            isInhaling = !isInhaling;
        };

        const startBreathingSequence = () => {
            breathingPhase.textContent = 'Prepárate para comenzar...';
            setTimeout(() => {
                updateBreathing();
                breathingInterval = setInterval(updateBreathing, 4000);
            }, 2000);
        };

        zenCloseBtn.onclick = closeZenModal;
        zenCompleteBtn.onclick = closeZenModal;
        zenModal.onclick = (e) => { if (e.target === zenModal) closeZenModal(); };

        zenModal.classList.add('active');
        startBreathingSequence();
    }

    function showAbstinenceChallengeModal() {
        const existingModal = document.getElementById('abstinenceChallengeModal');
        if (existingModal) existingModal.remove();

        const modalHtml = `
            <div id="abstinenceChallengeModal" class="modal-overlay visible">
                <div class="modal-content">
                    <button class="modal-close-btn" id="closeAbstinenceChallengeModal">&times;</button>
                    <h2>Reto de Abstinencia</h2>
                    <form id="abstinenceChallengeForm">
                        <div class="form-group">
                            <label for="challengeName">Nombre del reto:</label>
                            <input id="challengeName" type="text" placeholder="Ej: No fumar" required />
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="totalDurationValue">Duración del reto:</label>
                                <div class="input-group">
                                    <input id="totalDurationValue" type="number" min="1" value="90" required />
                                    <select id="totalDurationUnit"><option value="days" selected>Días</option><option value="weeks">Semanas</option><option value="months">Meses</option></select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="currentIntervalValue">Duración nivel 1:</label>
                                <div class="input-group">
                                    <input id="currentIntervalValue" type="number" min="1" value="2" required />
                                    <select id="currentIntervalUnit"><option value="minutes">Minutos</option><option value="hours" selected>Horas</option><option value="days">Días</option></select>
                                </div>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="firstLevelPoints">Puntos Nivel 1:</label>
                                <input id="firstLevelPoints" type="number" min="1" value="100" required />
                            </div>
                            <div class="form-group">
                                <label for="incrementPercent">Incremento por Nivel:</label>
                                <div class="input-group">
                                    <input id="incrementPercent" type="number" min="0.1" max="50" step="0.1" value="1" required />
                                    <span class="input-suffix">%</span>
                                </div>
                            </div>
                        </div>
                        <small class="form-help-text">Cada nivel incrementará proporcionalmente su tiempo y premio por superación.</small>
                        <div class="preview-section">
                            <div id="challengePreview" class="challenge-preview">
                                <div class="preview-item"><span class="preview-label">Niveles máximos estimados:</span><span id="previewLevels" class="preview-value">-</span></div>
                                <div class="preview-item"><span class="preview-label">Duración último nivel:</span><span id="previewFinalWait" class="preview-value">-</span></div>
                            </div>
                        </div>
                        <div class="form-error" id="challengeFormError" style="display: none;"></div>
                        <div class="form-actions">
                            <button type="button" class="secondary" id="cancelChallengeBtn">Cancelar</button>
                            <button type="submit" class="primary">Crear Reto</button>
                        </div>
                    </form>
                </div>
            </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        initModalEventListeners();
        updateChallengePreview();
    }

    function initModalEventListeners() {
        const modal = document.getElementById('abstinenceChallengeModal');
        const form = document.getElementById('abstinenceChallengeForm');
        const closeBtn = document.getElementById('closeAbstinenceChallengeModal');
        const cancelBtn = document.getElementById('cancelChallengeBtn');

        const closeModal = () => modal.remove();
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

        const inputs = ['currentIntervalValue', 'currentIntervalUnit', 'totalDurationValue', 'totalDurationUnit', 'firstLevelPoints', 'incrementPercent'];
        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', updateChallengePreview);
                input.addEventListener('change', updateChallengePreview);
            }
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleChallengeFormSubmit();
        });
    }

    function handleChallengeFormSubmit() {
        const errorContainer = document.getElementById('challengeFormError');
        const showError = (message) => {
            errorContainer.textContent = message;
            errorContainer.style.display = 'block';
        };
        errorContainer.style.display = 'none';

        const name = document.getElementById('challengeName').value.trim();
        if (!name) return showError('El nombre del reto es obligatorio.');

        const getVal = (id, isFloat = false) => isFloat ? parseFloat(document.getElementById(id).value) : parseInt(document.getElementById(id).value);
        const currentIntervalValue = getVal('currentIntervalValue');
        const totalDurationValue = getVal('totalDurationValue');
        const firstLevelPoints = getVal('firstLevelPoints');
        const incrementPercent = getVal('incrementPercent', true);

        if (isNaN(currentIntervalValue) || currentIntervalValue < 1) return showError('El tiempo entre consumos debe ser un número mayor a 0.');
        if (isNaN(totalDurationValue) || totalDurationValue < 1) return showError('La duración total debe ser un número mayor a 0.');
        if (isNaN(firstLevelPoints) || firstLevelPoints < 1) return showError('Los puntos del primer nivel deben ser un número mayor a 0.');
        if (isNaN(incrementPercent) || incrementPercent < 0.1 || incrementPercent > 50) return showError('El incremento debe estar entre 0.1% y 50%.');

        const currentInterval = { value: currentIntervalValue, unit: document.getElementById('currentIntervalUnit').value };
        const totalDuration = { value: totalDurationValue, unit: document.getElementById('totalDurationUnit').value };

        App.state.createAbstinenceChallenge(name, currentInterval, totalDuration, incrementPercent, firstLevelPoints);
        document.getElementById('abstinenceChallengeModal').remove();
    }

    function formatDuration(ms) {
        if (ms <= 0) return '0d 0h 0m';
        const totalSeconds = Math.floor(ms / 1000);
        const days = Math.floor(totalSeconds / (24 * 60 * 60));
        const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
        const seconds = totalSeconds % 60;
        
        let parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (parts.length === 0) parts.push(`${seconds}s`);

        return parts.join(' ');
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

            App.events.on('habitsUpdated', () => this.render());
            App.events.on('stateRefreshed', () => this.render());

            habitsContainer.addEventListener('click', (e) => {
                const target = e.target;

                if (target.id === 'createAbstinenceChallengeBtn' || target.closest('#createAbstinenceChallengeBtn')) {
                    showAbstinenceChallengeModal();
                    return;
                }

                const consumeBtn = target.closest('.consume-btn');
                if (consumeBtn) {
                    const challengeId = consumeBtn.dataset.challengeId;
                    if (challengeId) handleAbstinenceConsumption(challengeId);
                    return;
                }
                
                // NUEVO: Manejar el clic en el botón de vender
                const sellBtn = target.closest('.sell-btn');
                if (sellBtn) {
                    const challengeId = sellBtn.dataset.challengeId;
                    if (challengeId) handleSellConsumption(challengeId);
                    return;
                }

                const deleteBtn = target.closest('.delete-btn');
                if (deleteBtn) {
                    const challengeId = deleteBtn.dataset.challengeId;
                    if (challengeId) App.state.deleteAbstinenceChallenge(challengeId);
                    return;
                }
            });
        },

        stopUpdates: function() {
            if (timerUpdateInterval) {
                clearInterval(timerUpdateInterval);
                timerUpdateInterval = null;
            }
        }
    };

})(App);
