// features/feature-habits.js
// Consolidated module for Abstinence Challenge feature

(function() {
    'use strict';

    // --- Private State ---
    let timerUpdateInterval = null;

    // --- Private Methods from ui-render-habits.js ---

    // Helper function to convert time units to milliseconds
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

    // Format time remaining in a human-readable way
    const formatTimeRemaining = (ms) => {
        if (ms <= 0) return 'Disponible';
        
        const totalSeconds = Math.floor(ms / 1000);
        const days = Math.floor(totalSeconds / (24 * 60 * 60));
        const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
        const seconds = totalSeconds % 60;
        
        if (days > 0) return `${days}d ${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
        if (minutes > 0) return `${minutes}m ${seconds}s`;
        return `${seconds}s`;
    };

// Update timers for all abstinence challenge cards
const updateAbstinenceTimers = () => {
    const challengeCards = document.querySelectorAll('.abstinence-card');
    if (challengeCards.length === 0) {
        if (timerUpdateInterval) {
            clearInterval(timerUpdateInterval);
            timerUpdateInterval = null;
        }
        return;
    }

    challengeCards.forEach(card => {
        const challengeId = card.dataset.id;
        const challenge = App.state.getAbstinenceChallengeById(challengeId);
        if (!challenge || !challenge.isActive) return;

        const now = new Date();
        const nextAllowed = new Date(challenge.nextAllowedTime);
        const timeRemaining = nextAllowed.getTime() - now.getTime();

        // Update timer display - always show remaining time
        const timerElement = card.querySelector('.timer-display');
        if (timerElement) {
            timerElement.textContent = formatTimeRemaining(timeRemaining);
        }

        // Update overall challenge progress bar
        const createdAt = new Date(challenge.createdAt);
        const durationMs = convertToMilliseconds(challenge.totalDuration.value, challenge.totalDuration.unit);
        const elapsedMs = now.getTime() - createdAt.getTime();
        const progressPercent = Math.min(100, (elapsedMs / durationMs) * 100);

        const progressFill = card.querySelector('.progress-fill');
        if (progressFill) progressFill.style.width = `${progressPercent}%`;
        
        const progressLabel = card.querySelector('.progress-label');
        if (progressLabel) progressLabel.textContent = `Progreso del reto: ${Math.round(progressPercent)}%`;

        // Update consume button based on availability flag
        const consumeBtn = card.querySelector('.consume-btn');
        if (consumeBtn) {
            if (challenge.isAvailableToConsume) {
                consumeBtn.textContent = 'Consumir';
                consumeBtn.classList.add('available');
                consumeBtn.classList.remove('waiting');
            } else {
                consumeBtn.textContent = 'Esperando...';
                consumeBtn.classList.add('waiting');
                consumeBtn.classList.remove('available');
            }
        }
        
    });
};


    // Render abstinence challenges
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

        challengesList.innerHTML = abstinenceChallenges.map(challenge => {
            const { 
                id, name, currentLevel, totalPoints, regressionCount, 
                nextAllowedTime, isActive, finalLevel,
                createdAt, totalDuration
            } = challenge;

            const now = new Date();
            const nextAllowed = new Date(nextAllowedTime);
            const timeRemaining = nextAllowed.getTime() - now.getTime();
            const isAllowed = timeRemaining <= 0;

            const statusClass = isActive ? (challenge.isAvailableToConsume ? 'available' : 'waiting') : 'completed';
            const buttonText = isActive ? (challenge.isAvailableToConsume ? 'Consumir' : 'Esperando...') : 'Completado';
            const buttonClass = isActive ? (challenge.isAvailableToConsume ? 'available' : 'waiting') : 'completed';
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

            return `
                <div class="abstinence-card ${statusClass}" data-id="${id}">
                    <div class="abstinence-card-header">
                        <h3 class="challenge-name">${name}</h3>
                        <div class="challenge-points">+${pointsForCurrentLevel} pts</div>
                    </div>
                    <div class="abstinence-card-body">
                        <div class="challenge-stats">
                            <div class="stat-item"><span class="stat-label">Nivel</span><span class="stat-value">${currentLevel}/${finalLevel}</span></div>
                            <div class="stat-item"><span class="stat-label">Éxito</span><span class="stat-value ${complianceClass}">${Math.round(successRate)}%</span></div>
                            <div class="stat-item"><span class="stat-label">Puntos</span><span class="stat-value">${totalPoints}</span></div>
                        </div>
                        ${isActive ? `
                        <div class="timer-container">
                            <div class="timer-label">Tiempo restante:</div>
                            <div class="timer-display">${formatTimeRemaining(timeRemaining)}</div>
                        </div>` : `<div class="completed-message">¡Reto completado! 🏆</div>`}
                        <div class="progress-container">
                            <div class="progress-label">Progreso del reto: ${Math.round(progressPercent)}%</div>
                            <div class="progress-bar"><div class="progress-fill" style="width: ${progressPercent}%"></div></div>
                        </div>
                    </div>
                    <div class="abstinence-card-footer">
                        ${isActive ? `<button class="consume-btn ${buttonClass}" data-challenge-id="${id}">${buttonText}</button>` : ''}
                        <div class="action-buttons">
                            <button class="action-btn delete-btn" data-challenge-id="${id}" title="Eliminar reto">🗑️</button>
                        </div>
                    </div>
                </div>`;
        }).join('');
    };

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
            closeModal(); // Cerrar el modal de tentación
            showZenBreathingModal(challenge); // Mostrar la experiencia zen
        };

        const handleGiveIn = () => {
            App.state.processConsumption(challenge.id); // This will handle the penalty
            closeModal();
        };

        // Asignar eventos una sola vez
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
            // Reset state
            zenContent.style.display = 'block';
            zenCompletion.style.display = 'none';
            breathingCircle.classList.remove('inhale', 'exhale');
            currentBreath = 0;
            progressFill.style.width = '0%';
        };

        const completeExercise = () => {
            if (breathingInterval) clearInterval(breathingInterval);
            App.state.recordResistance(challenge.id, challenge.name);
            
            // Mostrar pantalla de completado
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
                breathingCircle.classList.remove('inhale');
                breathingCircle.classList.add('exhale');
                
                // Completar una respiración (inhalar + exhalar)
                currentBreath++;
                breathingCount.textContent = 10 - currentBreath;
                
                // Actualizar progreso
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
                breathingInterval = setInterval(updateBreathing, 4000); // 4 segundos por fase
            }, 2000); // Pausa inicial de 2 segundos
        };

        // Event listeners
        zenCloseBtn.onclick = closeZenModal;
        zenCompleteBtn.onclick = closeZenModal;
        zenModal.onclick = (e) => { if (e.target === zenModal) closeZenModal(); };

        // Mostrar modal y comenzar
        zenModal.classList.add('active');
        startBreathingSequence();
    }

    function handleAbstinenceConsumption(challengeId) {
        const challenge = App.state.getAbstinenceChallengeById(challengeId);
        if (!challenge) return;

        // If button is available (green), process consumption directly
        if (challenge.isAvailableToConsume) {
            App.state.processConsumption(challengeId);
        } else {
            // If button is in waiting state, show temptation modal
            showTemptationModal(challenge);
        }
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
                                <input id="firstLevelPoints" type="number" min="1" value="1" required />
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

        App.state.createAbstinenceChallenge(name, currentInterval, totalDuration, incrementPercent, firstLevelPoints); // This will emit 'habitsUpdated'
        document.getElementById('abstinenceChallengeModal').remove();
    }

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

    function formatDuration(ms) {
        const days = Math.floor(ms / 86400000);
        const hours = Math.floor((ms % 86400000) / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
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
                        <span class="icon">🎯</span> Nuevo Reto de Abstinencia
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

                const deleteBtn = target.closest('.delete-btn');
                if (deleteBtn) {
                    const challengeId = deleteBtn.dataset.challengeId;
                    if (challengeId) App.state.deleteAbstinenceChallenge(challengeId); // This will emit 'habitsUpdated'
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
