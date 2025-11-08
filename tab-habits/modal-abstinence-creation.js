// modal-abstinence-creation.js
// Modal simplificado para creación de retos de abstinencia

// Cargar estilos específicos del modal
const modalStyleLink = document.createElement('link');
modalStyleLink.rel = 'stylesheet';
modalStyleLink.href = 'tab-habits/modal-abstinence-creation.css';
if (!document.querySelector('link[href="tab-habits/modal-abstinence-creation.css"]')) {
    document.head.appendChild(modalStyleLink);
}

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
                    <div class="stat-item challenge-goal">
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
                                <small class="form-help">Obtendrás un ticket de consumo que podrás usar o vender por puntos según tu frecuencia actual</small>

                            </div>

                            <div class="form-group">
                                <label for="successDays">¿Cuántos días sin el hábito para completar el reto de forma exitosa?</label>
                                <input id="successDays" type="number" min="1" step="1" value="7" required />
                            </div>

                            <div class="form-group">
                                <label for="baseTicketPoints">¿Cuántos puntos quieres ganar por vender un ticket (no consumido)?</label>
                                <input id="baseTicketPoints" type="number" min="1" max="1000" value="5" required />
                                <small class="form-help">Si reduces tu consumo promedio ganarás más subastando</small>
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
        const successDays = parseInt(document.getElementById('successDays').value) || 7;
        const weeklyFrequency = parseInt(document.getElementById('weeklyFrequency').value) || 50;
        
        const dayText = successDays === 1 ? 'día' : 'días';
        
        const intervalMs = calculateInitialInterval(weeklyFrequency);
        const formattedInterval = formatDuration(intervalMs);
        const basePoints = document.querySelector('#baseTicketPoints')?.value || 5;
        
        // Ocultar botones de previsualización y mostrar botón de volver
        document.getElementById('previewActions').style.display = 'none';
        document.getElementById('backToPreviewActions').style.display = 'flex';
        
        document.getElementById('previewContent').innerHTML = `
            <div class="info-detail">
                <h3>🚀 ¿Cómo Desbloquear Subastas?</h3>
                
                <p class="info-intro">El sistema compara tu tendencia reciente vs tu promedio histórico total:</p>
                
                <div class="comparison-box">
                    <div class="period-item">
                        <strong>📊 Promedio histórico</strong>
                        <p>Tu tiempo promedio desde que iniciaste el reto</p>
                    </div>
                    <div class="period-item">
                        <strong>📈 Últimos ${successDays} ${dayText}</strong>
                        <p>Tu tiempo promedio reciente (incluye abstinencia actual)</p>
                    </div>
                </div>
                
                <p class="unlock-condition"><strong>✨ Condición:</strong> Si tu promedio reciente <strong>supera</strong> tu promedio histórico, desbloqueas subastas</p>
                
                <div class="example-box">
                    <p><strong>Ejemplo:</strong></p>
                    <p>Histórico: cada ${formattedInterval} → Reciente: cada ${formatDuration(intervalMs * 1.22)} <p><strong>✅ Subasta desbloqueada</strong></p></p>
                </div>
                
                <div class="rewards-comparison">
                    <div class="reward-option">
                        <span class="reward-icon">💡</span>
                        <strong>Sin mejora</strong>
                        <p>Vender: ${basePoints} pts fijos</p>
                    </div>
                    <div class="reward-option highlight">
                        <span class="reward-icon">🚀</span>
                        <strong>Con mejora</strong>
                        <p>Subastar: precio base ${basePoints} pts</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Muestra la explicación de cómo funciona el sistema
     */
    function showHowItWorks() {
        const weeklyFrequency = parseInt(document.getElementById('weeklyFrequency').value) || 50;
        const successDays = parseInt(document.getElementById('successDays').value) || 7;
        
        const intervalMs = calculateInitialInterval(weeklyFrequency);
        const formattedInterval = formatDuration(intervalMs);
        const dailyLimit = Math.max(1, Math.ceil(weeklyFrequency / 7));
        const basePoints = document.querySelector('#baseTicketPoints')?.value || 5;
        
        const dayText = successDays === 1 ? 'día' : 'días';
        
        // Ocultar botones de previsualización y mostrar botón de volver
        document.getElementById('previewActions').style.display = 'none';
        document.getElementById('backToPreviewActions').style.display = 'flex';
        
        document.getElementById('previewContent').innerHTML = `
            <div class="info-detail">
                <h3>🎮 ¿Cómo Funciona el Sistema?</h3>
                
                <div class="how-it-works-section">
                    <div class="step-item">
                        <span class="step-number">1</span>
                        <div class="step-content">
                            <strong>🎫 Generación de Tickets</strong>
                            <p>Cada <strong>${formattedInterval}</strong> se genera 1 ticket automáticamente</p>
                            <p class="step-note">Límite: ${dailyLimit} tickets acumulados</p>
                        </div>
                    </div>
                    
                    <div class="step-item">
                        <span class="step-number">2</span>
                        <div class="step-content">
                            <strong>🎯 Usa tus Tickets</strong>
                            <p>Tienes 2 opciones:</p>
                            <ul>
                                <li><strong>Gastar:</strong> Consumir el hábito (se registra)</li>
                                <li><strong>Vender:</strong> Ganar ${basePoints} puntos por NO consumir</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="step-item">
                        <span class="step-number">3</span>
                        <div class="step-content">
                            <strong>📈 Seguimiento de Progreso</strong>
                            <p>Verás 3 métricas:</p>
                            <ul>
                                <li><strong>Inicial:</strong> Tu frecuencia al empezar</li>
                                <li><strong>Promedio histórico:</strong> Tu promedio total</li>
                                <li><strong>Últimos ${successDays} ${dayText}:</strong> Tu tendencia reciente</li>
                            </ul>
                            <p class="step-note">Si tu tendencia reciente supera tu promedio histórico, desbloqueas subastas</p>
                        </div>
                    </div>
                    
                    <div class="step-item">
                        <span class="step-number">4</span>
                        <div class="step-content">
                            <strong>🏆 Completa el Reto</strong>
                            <p>Meta: <strong>${successDays} ${dayText}</strong> sin consumir</p>
                            <p>El reto se completa automáticamente al alcanzar esta meta</p>
                        </div>
                    </div>
                </div>
                
                <div class="tips-box">
                    <strong>💡 Consejos:</strong>
                    <ul>
                        <li>Los tickets se generan incluso con la app cerrada</li>
                        <li>Vender tickets te da puntos inmediatos</li>
                        <li>Mejora sostenida = acceso a subastas con más puntos</li>
                    </ul>
                </div>
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