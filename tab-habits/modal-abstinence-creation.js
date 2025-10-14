// modal-abstinence-creation.js
// Modal simplificado para creación de retos de abstinencia

(function() {
    'use strict';

    window.App = window.App || {};
    window.App.ui = window.App.ui || {};
    window.App.ui.habits = window.App.ui.habits || {};

    /**
     * Calcula el intervalo inicial entre consumos basado en la frecuencia semanal.
     * Mantiene consistencia con app-state-habits.js
     */
    const calculateInitialInterval = (weeklyFrequency) => {
        if (weeklyFrequency <= 0) return 0;
        const msPerWeek = 7 * 24 * 60 * 60 * 1000;
        return Math.floor(msPerWeek / weeklyFrequency);
    };

    /**
     * Formatea una duración en milisegundos a un string legible
     * @param {number} ms - Milisegundos a formatear
     * @returns {string} - La duración formateada
     */
    function formatDuration(ms) {
        if (ms <= 0) return '0m';
        const totalMinutes = Math.floor(ms / (60 * 1000));
        const hours = Math.floor(totalMinutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${totalMinutes % 60}m`;
        return `${totalMinutes}m`;
    }

    /**
     * Genera el contenido de previsualización para la fase 2
     */
    function generatePreviewContent() {
        const habitName = document.getElementById('habitName').value.trim();
        const weeklyFrequency = parseInt(document.getElementById('weeklyFrequency').value) || 0;
        const successDays = parseInt(document.getElementById('successDays').value) || 0;
        
        // Usar el mismo selector robusto
        const baseTicketPointsElement = document.querySelector('#abstinenceChallengeModal #baseTicketPoints');
        const baseTicketPoints = baseTicketPointsElement ? parseInt(baseTicketPointsElement.value) || 10 : 10;
        
        if (!habitName || weeklyFrequency <= 0 || successDays <= 0 || baseTicketPoints <= 0) {
            return '<p style="color: #f44336;">Por favor completa todos los campos correctamente.</p>';
        }
        
        const intervalMs = calculateInitialInterval(weeklyFrequency);
        const formattedInterval = formatDuration(intervalMs);
        const dailyTickets = Math.round((24 * 60 * 60 * 1000) / intervalMs * 10) / 10;
        const dailyLimit = Math.max(1, Math.ceil(weeklyFrequency / 7));
        
        const dayText = successDays === 1 ? 'día' : 'días';
        
        return `
            <div class="preview-summary">
                <h3>📋 "${habitName}"</h3>
                <div class="preview-stats">
                    <div class="stat-item">
                        <span class="stat-label">Frecuencia actual:</span>
                        <span class="stat-value">${weeklyFrequency} veces/semana</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Tiempo entre consumos:</span>
                        <span class="stat-value">${formattedInterval}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Tickets estimados:</span>
                        <span class="stat-value">~${dailyTickets}/día</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Límite de acumulación:</span>
                        <span class="stat-value">${dailyLimit} tickets máx</span>
                    </div>
                    <div class="stat-item success-goal">
                        <span class="stat-label">Meta de éxito:</span>
                        <span class="stat-value">${successDays} ${dayText}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Valor por ticket:</span>
                        <span class="stat-value">⭐${baseTicketPoints} puntos</span>
                    </div>
                </div>
                
                <div class="info-links">
                    <button type="button" class="info-link" onclick="showBonusExplanation()">🚀 ¿Cómo desbloquear subastas?</button>
                    <button type="button" class="info-link" onclick="showHowItWorks()">🎮 ¿Cómo funciona el sistema?</button>
                </div>
            </div>
        `;
    }


    /**
     * Maneja el envío del formulario de creación del reto.
     */
    function handleChallengeFormSubmit() {
        
        const errorContainer = document.getElementById('challengeFormError');
        const showError = (message) => {
            errorContainer.textContent = message;
            errorContainer.style.display = 'block';
        };
        errorContainer.style.display = 'none';

        const habitName = document.getElementById('habitName').value.trim();
        if (!habitName) return showError('El nombre del mal hábito es obligatorio.');

        const weeklyFrequency = parseInt(document.getElementById('weeklyFrequency').value);
        if (isNaN(weeklyFrequency) || weeklyFrequency < 1 || weeklyFrequency > 9999) {
            return showError('La frecuencia semanal debe ser un número entre 1 y 9999.');
        }

        const successDays = parseInt(document.getElementById('successDays').value);
        if (isNaN(successDays) || successDays < 1) {
            return showError('Los días de éxito deben ser un número mayor a 0.');
        }
        if (successDays > 365) {
            return showError('El período máximo es 365 días.');
        }
        
        // Buscar el elemento de manera más robusta
        const baseTicketPointsElement = document.querySelector('#abstinenceChallengeModal #baseTicketPoints');
        if (!baseTicketPointsElement) {
            return showError('Error: No se pudo encontrar el campo de puntos.');
        }
        
        const baseTicketPoints = parseInt(baseTicketPointsElement.value);
        if (isNaN(baseTicketPoints) || baseTicketPoints < 1 || baseTicketPoints > 1000) {
            return showError('Los puntos por ticket deben ser un número entre 1 y 1000.');
        }

        // Llama a la función global de estado para crear el reto
        App.state.createAbstinenceChallenge(habitName, weeklyFrequency, successDays, baseTicketPoints);
        document.getElementById('abstinenceChallengeModal').remove();
    }

    /**
     * Inicializa los listeners de eventos para el modal.
     */
    function initModalEventListeners() {
        const modal = document.getElementById('abstinenceChallengeModal');
        const closeBtn = document.getElementById('closeAbstinenceChallengeModal');
        const cancelBtn = document.getElementById('cancelChallengeBtn');
        const previewBtn = document.getElementById('previewChallengeBtn');
        const backBtn = document.getElementById('backToConfigBtn');
        const createBtn = document.getElementById('createChallengeBtn');
        const backToPreviewBtn = document.getElementById('backToPreviewBtn');

        const closeModal = () => modal.remove();
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

        // Botón Previsualizar
        previewBtn.addEventListener('click', () => {
            const errorContainer = document.getElementById('challengeFormError');
            const showError = (message) => {
                errorContainer.textContent = message;
                errorContainer.style.display = 'block';
            };
            errorContainer.style.display = 'none';

            const habitName = document.getElementById('habitName').value.trim();
            if (!habitName) return showError('El nombre del mal hábito es obligatorio.');

            const weeklyFrequency = parseInt(document.getElementById('weeklyFrequency').value);
            if (isNaN(weeklyFrequency) || weeklyFrequency < 1 || weeklyFrequency > 9999) {
                return showError('La frecuencia semanal debe ser un número entre 1 y 9999.');
            }

            const successDays = parseInt(document.getElementById('successDays').value);
            if (isNaN(successDays) || successDays < 1) {
                return showError('Los días de éxito deben ser un número mayor a 0.');
            }
            if (successDays > 365) {
                return showError('El período máximo es 365 días.');
            }

            // Mostrar fase 2
            document.getElementById('configPhase').style.display = 'none';
            document.getElementById('previewPhase').style.display = 'block';
            document.getElementById('previewContent').innerHTML = generatePreviewContent();
            
            // Mostrar botones de previsualización
            document.getElementById('previewActions').style.display = 'flex';
            document.getElementById('backToPreviewActions').style.display = 'none';
        });

        // Botón Volver a configuración
        backBtn.addEventListener('click', () => {
            document.getElementById('previewPhase').style.display = 'none';
            document.getElementById('configPhase').style.display = 'block';
        });

        // Botón Volver a previsualización
        backToPreviewBtn.addEventListener('click', () => {
            showPreview();
        });

        // Botón Crear Reto
        createBtn.addEventListener('click', () => {
            const habitName = document.getElementById('habitName').value.trim();
            const weeklyFrequency = parseInt(document.getElementById('weeklyFrequency').value);
            const successDays = parseInt(document.getElementById('successDays').value);
            
            // Leer el valor de puntos base
            const baseTicketPointsElement = document.querySelector('#abstinenceChallengeModal #baseTicketPoints');
            const baseTicketPoints = baseTicketPointsElement ? parseInt(baseTicketPointsElement.value) : 10;
            

            App.state.createAbstinenceChallenge(habitName, weeklyFrequency, successDays, baseTicketPoints);
            modal.remove();
        });
    }

    /**
     * Crea y muestra el modal para añadir un nuevo reto de abstinencia.
     */
    function showAbstinenceChallengeModal() {
        const existingModal = document.getElementById('abstinenceChallengeModal');
        if (existingModal) existingModal.remove();

        const modalHtml = `
            <div id="abstinenceChallengeModal" class="modal-overlay visible">
                <div class="modal-content">
                    <button class="modal-close-btn" id="closeAbstinenceChallengeModal">&times;</button>
                    
                    <!-- FASE 1: Configuración -->
                    <div id="configPhase">
                        <h2>🎯 Crear Reto de Abstinencia</h2>
                        
                        <form id="abstinenceChallengeForm">
                            <div class="form-group">
                                <label for="habitName">¿Qué mal hábito quieres eliminar?</label>
                                <input id="habitName" type="text" placeholder="Ej: Fumar, comer dulces, revisar redes sociales..." required />
                            </div>

                            <div class="form-group">
                                <label for="weeklyFrequency">¿Cuántas veces por semana lo haces?</label>
                                <input id="weeklyFrequency" type="number" min="1" max="9999" value="50" required />
                            </div>

                            <div class="form-group">
                                <label for="successDays">¿Cuántos días sin el hábito consideras un éxito?</label>
                                <input id="successDays" type="number" min="1" step="1" value="14" required />
                                <small class="form-hint">Número de días consecutivos sin el hábito para completar el reto</small>
                            </div>

                            <div class="form-group">
                                <label for="baseTicketPoints">¿Cuántos puntos vale cada ticket?</label>
                                <input id="baseTicketPoints" type="number" min="1" max="1000" value="10" required />
                                <small class="form-help">Más puntos = mayor motivación para no consumir</small>
                            </div>
                            
                            <div class="form-error" id="challengeFormError" style="display: none;"></div>
                            <div class="form-actions">
                                <button type="button" class="secondary" id="cancelChallengeBtn">Cancelar</button>
                                <button type="button" class="primary" id="previewChallengeBtn">📊 Previsualizar Reto</button>
                            </div>
                        </form>
                    </div>

                    <!-- FASE 2: Previsualización -->
                    <div id="previewPhase" style="display: none;">
                        <h2>📊 Previsualización del Reto</h2>
                        
                        <div id="previewContent" class="preview-content"></div>
                        
                        <!-- Botones para vista de previsualización -->
                        <div id="previewActions" class="form-actions">
                            <button type="button" class="secondary" id="backToConfigBtn">← Volver</button>
                            <button type="button" class="primary" id="createChallengeBtn">🚀 Crear Reto</button>
                        </div>
                        
                        <!-- Botón para vista de explicaciones -->
                        <div id="backToPreviewActions" class="form-actions" style="display: none;">
                            <button type="button" class="secondary" id="backToPreviewBtn">← Volver a la previsualización</button>
                        </div>
                    </div>
                </div>
            </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        initModalEventListeners();
    }

    /**
     * Muestra la explicación de cómo desbloquear subastas
     */
    function showBonusExplanation() {
        const successDays = parseInt(document.getElementById('successDays').value) || 30;
        const weeklyFrequency = parseInt(document.getElementById('weeklyFrequency').value) || 50;
        
        const dayText = successDays === 1 ? 'día' : 'días';
        
        const intervalMs = calculateInitialInterval(weeklyFrequency);
        const formattedInterval = formatDuration(intervalMs);
        
        // Ocultar botones de previsualización y mostrar botón de volver
        document.getElementById('previewActions').style.display = 'none';
        document.getElementById('backToPreviewActions').style.display = 'flex';
        
        document.getElementById('previewContent').innerHTML = `
            <div class="info-detail">
                <h3>🚀 ¿Cómo Desbloquear Subastas?</h3>
                
                <p class="info-intro">El sistema compara automáticamente tu progreso en dos períodos:</p>
                
                <div class="comparison-box">
                    <div class="period-item">
                        <strong>📅 Hace ${successDays} ${dayText}</strong>
                        <p>Tu tiempo promedio entre consumos en ese período</p>
                    </div>
                    <div class="period-item">
                        <strong>📈 Últimos ${successDays} ${dayText}</strong>
                        <p>Tu tiempo promedio actual (incluye tu abstinencia en curso)</p>
                    </div>
                </div>
                
                <p class="unlock-condition"><strong>✨ Condición:</strong> Si mejoras <strong>≥1%</strong>, desbloqueas las subastas</p>
                
                <div class="example-box">
                    <p><strong>Ejemplo con tus datos:</strong></p>
                    <p>Antes: cada ${formattedInterval} → Ahora: cada ${formatDuration(intervalMs * 1.02)} = <strong>+2% ✅</strong></p>
                </div>
                
                <div class="rewards-comparison">
                    <div class="reward-option">
                        <span class="reward-icon">💡</span>
                        <strong>Sin mejora</strong>
                        <p>Vender: ${document.querySelector('#baseTicketPoints')?.value || 10} pts fijos</p>
                    </div>
                    <div class="reward-option highlight">
                        <span class="reward-icon">🚀</span>
                        <strong>Con mejora ≥1%</strong>
                        <p>Subastar: 2x-4x más puntos</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Muestra cómo funciona el sistema
     */
    function showHowItWorks() {
        // Ocultar botones de previsualización y mostrar botón de volver
        document.getElementById('previewActions').style.display = 'none';
        document.getElementById('backToPreviewActions').style.display = 'flex';
        
        document.getElementById('previewContent').innerHTML = `
            <div class="info-detail">
                <h3>🎮 ¿Cómo funciona?</h3>
                <p><strong>🎫 Tickets:</strong> Recibes tickets automáticamente según tu frecuencia. Puedes gastarlo (registrar consumo) o venderlo por puntos. ¡Si mejoras tu tiempo entre consumos podrás subastar los tickets empezando con el precio base!.</p>
                <p><strong>📈 Estadísticas:</strong> El sistema muestra tu progreso con gráficos y métricas en tiempo real.</p>
                <p><strong>🎯 Objetivo:</strong> ¡Vende y subasta tantos tickets como puedas hasta completar el reto!</p>
                <p><strong>🏆 Estrategia:</strong> Cada vez que resistes la tentación, no solo ganas puntos sino que mejoras tu capacidad de ganar más en el futuro.</p>
            </div>
        `;
    }

    /**
     * Vuelve a mostrar la previsualización principal
     */
    function showPreview() {
        // Mostrar botones de previsualización y ocultar botón de volver
        document.getElementById('previewActions').style.display = 'flex';
        document.getElementById('backToPreviewActions').style.display = 'none';
        
        document.getElementById('previewContent').innerHTML = generatePreviewContent();
    }

    // Hacer las funciones globales para que puedan ser llamadas desde onclick
    window.showBonusExplanation = showBonusExplanation;
    window.showHowItWorks = showHowItWorks;
    window.showPreview = showPreview;

    // --- Public API ---
    // Exponemos la función principal para que pueda ser llamada desde otros archivos.
    App.ui.habits.showCreationModal = showAbstinenceChallengeModal;

})();