// modal-abstinence-creation.js
// Modal simplificado para creación de retos de abstinencia

(function() {
    'use strict';

    // Aseguramos que el espacio de nombres (namespace) exista
    window.App = window.App || {};
    window.App.ui = window.App.ui || {};
    window.App.ui.habits = window.App.ui.habits || {};

    /**
     * Calcula el tiempo promedio inicial entre consumos basado en la frecuencia semanal
     * @param {number} weeklyFrequency - Número de veces por semana
     * @returns {number} - Tiempo en milisegundos entre consumos
     */
    function calculateInitialInterval(weeklyFrequency) {
        if (weeklyFrequency <= 0) return 0;
        const msPerWeek = 7 * 24 * 60 * 60 * 1000; // milisegundos en una semana
        return Math.floor(msPerWeek / weeklyFrequency);
    }

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
        const successValue = parseFloat(document.getElementById('successValue').value) || 0;
        const successUnit = document.getElementById('successUnit').value;
        
        // Usar el mismo selector robusto
        const baseTicketPointsElement = document.querySelector('#abstinenceChallengeModal #baseTicketPoints');
        const baseTicketPoints = baseTicketPointsElement ? parseInt(baseTicketPointsElement.value) || 10 : 10;
        
        if (!habitName || weeklyFrequency <= 0 || successValue <= 0 || baseTicketPoints <= 0) {
            return '<p style="color: #f44336;">Por favor completa todos los campos correctamente.</p>';
        }
        
        const intervalMs = calculateInitialInterval(weeklyFrequency);
        const formattedInterval = formatDuration(intervalMs);
        const dailyTickets = Math.round((24 * 60 * 60 * 1000) / intervalMs * 10) / 10;
        
        const unitNames = {
            'hours': successValue === 1 ? 'hora' : 'horas',
            'days': successValue === 1 ? 'día' : 'días',
            'weeks': successValue === 1 ? 'semana' : 'semanas',
            'months': successValue === 1 ? 'mes' : 'meses'
        };
        
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
                    <div class="stat-item success-goal">
                        <span class="stat-label">Meta de éxito:</span>
                        <span class="stat-value">${successValue} ${unitNames[successUnit]}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Valor por ticket:</span>
                        <span class="stat-value">⭐${baseTicketPoints} puntos</span>
                    </div>
                </div>
                
                <div class="info-links">
                    <button type="button" class="info-link" onclick="showBonusExplanation()">🚀 ¿Cómo funciona el Bonus x2?</button>
                    <button type="button" class="info-link" onclick="showHowItWorks()">🎮 ¿Cómo funciona el sistema?</button>
                </div>
            </div>
        `;
    }

    /**
     * Convierte el período de éxito a días
     */
    function convertSuccessPeriodToDays(value, unit) {
        const conversions = {
            'hours': value / 24,
            'days': value,
            'weeks': value * 7,
            'months': value * 30
        };
        return conversions[unit] || value;
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

        const successValue = parseFloat(document.getElementById('successValue').value);
        const successUnit = document.getElementById('successUnit').value;
        
        // Buscar el elemento de manera más robusta
        const baseTicketPointsElement = document.querySelector('#abstinenceChallengeModal #baseTicketPoints');
        if (!baseTicketPointsElement) {
            return showError('Error: No se pudo encontrar el campo de puntos.');
        }
        
        // Forzar la lectura del valor actual del DOM
        const rawValue = baseTicketPointsElement.value;
        const baseTicketPoints = parseInt(rawValue);
        
        
        
        if (isNaN(successValue) || successValue <= 0) {
            return showError('El período de éxito debe ser un número mayor a 0.');
        }

        if (isNaN(baseTicketPoints) || baseTicketPoints < 1 || baseTicketPoints > 1000) {
            return showError('Los puntos por ticket deben ser un número entre 1 y 1000.');
        }

        // Convertir a días para validación
        const successDays = convertSuccessPeriodToDays(successValue, successUnit);
        if (successDays < 0.04) { // Mínimo 1 hora
            return showError('El período mínimo es 1 hora.');
        }
        if (successDays > 365) {
            return showError('El período máximo es 365 días.');
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

            const successValue = parseFloat(document.getElementById('successValue').value);
            const successUnit = document.getElementById('successUnit').value;
            
            if (isNaN(successValue) || successValue <= 0) {
                return showError('El período de éxito debe ser un número mayor a 0.');
            }

            const successDays = convertSuccessPeriodToDays(successValue, successUnit);
            if (successDays < 0.04) {
                return showError('El período mínimo es 1 hora.');
            }
            if (successDays > 365) {
                return showError('El período máximo es 365 días.');
            }

            // Mostrar fase 2
            document.getElementById('configPhase').style.display = 'none';
            document.getElementById('previewPhase').style.display = 'block';
            document.getElementById('previewContent').innerHTML = generatePreviewContent();
        });

        // Botón Volver
        backBtn.addEventListener('click', () => {
            document.getElementById('previewPhase').style.display = 'none';
            document.getElementById('configPhase').style.display = 'block';
        });

        // Botón Crear Reto
        createBtn.addEventListener('click', () => {
            const habitName = document.getElementById('habitName').value.trim();
            const weeklyFrequency = parseInt(document.getElementById('weeklyFrequency').value);
            const successValue = parseFloat(document.getElementById('successValue').value);
            const successUnit = document.getElementById('successUnit').value;
            const successDays = convertSuccessPeriodToDays(successValue, successUnit);
            
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
                                <label for="successValue">¿Cuánto tiempo sin el hábito consideras un éxito?</label>
                                <div class="input-group">
                                    <input id="successValue" type="number" min="0.1" step="0.1" value="30" required />
                                    <select id="successUnit" required>
                                        <option value="hours">Horas</option>
                                        <option value="days" selected>Días</option>
                                        <option value="weeks">Semanas</option>
                                        <option value="months">Meses</option>
                                    </select>
                                </div>
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
                        
                        <div class="form-actions">
                            <button type="button" class="secondary" id="backToConfigBtn">← Volver</button>
                            <button type="button" class="primary" id="createChallengeBtn">🚀 Crear Reto</button>
                        </div>
                    </div>
                </div>
            </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        initModalEventListeners();
    }

    /**
     * Muestra la explicación del bonus x2
     */
    function showBonusExplanation() {
        const successValue = parseFloat(document.getElementById('successValue').value) || 30;
        const successUnit = document.getElementById('successUnit').value;
        const weeklyFrequency = parseInt(document.getElementById('weeklyFrequency').value) || 50;
        
        const unitNames = {
            'hours': successValue === 1 ? 'hora' : 'horas',
            'days': successValue === 1 ? 'día' : 'días',
            'weeks': successValue === 1 ? 'semana' : 'semanas',
            'months': successValue === 1 ? 'mes' : 'meses'
        };
        
        const intervalMs = calculateInitialInterval(weeklyFrequency);
        const formattedInterval = formatDuration(intervalMs);
        
        document.getElementById('previewContent').innerHTML = `
            <div class="info-detail">
                <h3>🚀 Bonus x2 Explicado</h3>
                <p>El sistema compara tu progreso en dos períodos de <strong>${successValue} ${unitNames[successUnit]}</strong>:</p>
                <ul>
                    <li><strong>Período anterior:</strong> De ${successValue * 2} a ${successValue} ${unitNames[successUnit]} atrás</li>
                    <li><strong>Período actual:</strong> Últimos ${successValue} ${unitNames[successUnit]} (incluye abstinencia en curso)</li>
                </ul>
                <p>Si tu tiempo promedio entre consumos mejora ≥1%, obtienes <strong>bonus x2</strong> en subastas.</p>
                <p><strong>Ejemplo:</strong> Si antes consumías cada ${formattedInterval} y ahora cada ${formatDuration(intervalMs * 1.05)} (+5%), ¡bonus activado!</p>
                
                <button type="button" class="secondary" onclick="showPreview()">← Volver a la previsualización</button>
            </div>
        `;
    }

    /**
     * Muestra cómo funciona el sistema
     */
    function showHowItWorks() {
        document.getElementById('previewContent').innerHTML = `
            <div class="info-detail">
                <h3>🎮 ¿Cómo funciona?</h3>
                <p><strong>🎫 Tickets:</strong> Recibes tickets automáticamente según tu frecuencia. Puedes gastarlo (registrar consumo) o subastarlo por puntos.</p>
                <p><strong>🚀 Bonus x2:</strong> Si mejoras tu tiempo entre consumos ≥1% comparando períodos, tus tickets valen el doble en subastas.</p>
                <p><strong>📈 Estadísticas:</strong> El sistema muestra tu progreso con gráficos y métricas en tiempo real.</p>
                <p><strong>🎯 Objetivo:</strong> Cada vez que resistes la tentación, ganas puntos. Cada vez que cedes, pierdes un ticket pero registras tu progreso.</p>
                
                <button type="button" class="secondary" onclick="showPreview()">← Volver a la previsualización</button>
            </div>
        `;
    }

    /**
     * Vuelve a mostrar la previsualización principal
     */
    function showPreview() {
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