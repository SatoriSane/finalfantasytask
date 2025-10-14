// features/feature-ui.js
// Maneja la interacción del usuario y la representación visual de la aplicación.
// 
// Este archivo centraliza toda la lógica de la interfaz de usuario (UI), incluyendo:
// 
// 1. Gestión del estado visual: Controla qué elementos se muestran u ocultan (por ejemplo, pestañas de navegación, modales y formularios).
// 2. Actualización de la UI: Sincroniza los datos del estado de la aplicación con lo que se muestra en pantalla (p. ej., actualizando el contador de puntos y las estadísticas diarias).
// 3. Manejo de eventos: Escucha las interacciones del usuario (clics en botones, envíos de formularios) y los eventos globales del bus de eventos para responder adecuadamente.
// 4. Componentes de interacción: Proporciona funciones reutilizables para mostrar mensajes al usuario (alertas, confirmaciones y notificaciones temporales).
// 
// En esencia, actúa como el puente entre el "cerebro" de la aplicación (los datos y la lógica de negocio) y la experiencia del usuario final. Pero no seiempre se usa ya que a veces lo
(function(App) {

    // --- Funciones Privadas (adaptadas de ui-events.js) ---

    /**
     * @description Función auxiliar genérica para configurar y mostrar modales personalizados.
     */
    function _setupCustomModal(modalId, messageElementId, buttonConfigs, message, callback) {
        const modal = document.getElementById(modalId);
        const msgElement = document.getElementById(messageElementId);
        const buttons = buttonConfigs.map(config => ({
            element: document.getElementById(config.id),
            isConfirmAction: config.isConfirmAction
        }));

        const allElementsFound = [modal, msgElement, ...buttons.map(btn => btn.element)].every(el => el);

        if (!allElementsFound) {
            console.error(`Error: Uno o más elementos para el modal '${modalId}' no se encontraron.`);
            // Fallback a alert/confirm nativo si el modal personalizado falla
            if (modalId.includes('Alert')) {
                alert(message);
            } else if (modalId.includes('Confirm')) {
                if (callback) callback(confirm(message));
            }
            return;
        }

        msgElement.textContent = message;
        modal.classList.add('visible');

        // Limpiar listeners antiguos para evitar callbacks "stale"
        buttons.forEach(btn => {
            if (btn.element) {
                const newElement = btn.element.cloneNode(true);
                btn.element.parentNode.replaceChild(newElement, btn.element);
                btn.element = newElement; // Actualizar la referencia al nuevo elemento
            }
        });

        const closeHandler = (result) => {
            modal.classList.remove('visible');
            if (callback) callback(result);
        };

        buttons.forEach(btn => {
            if (btn.element) {
                const listener = () => {
                    const result = (btn.isConfirmAction !== undefined) ? btn.isConfirmAction : undefined;
                    closeHandler(result);
                };
                btn.element.addEventListener('click', listener, { once: true });
            }
        });
    }

    // --- Objeto Público: App.ui.general ---

    App.ui.general = {

        // --- Métodos de Renderizado (de ui-render-general.js) ---

        switchTab: function(tabId) {
            document.querySelectorAll('main section').forEach(sec => {
                sec.classList.remove('active');
                sec.setAttribute('aria-hidden', 'true');
            });
            document.querySelectorAll('nav.tabs button').forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
                btn.setAttribute('tabindex', '-1');
            });

            const tabContent = document.getElementById(tabId);
            const tabButton = document.querySelector(`[aria-controls="${tabId}"]`);

            if (tabContent) {
                tabContent.classList.add('active');
                tabContent.setAttribute('aria-hidden', 'false');
            }
            if (tabButton) {
                tabButton.classList.add('active');
                tabButton.setAttribute('aria-selected', 'true');
                tabButton.setAttribute('tabindex', '0');
            }
            
            // Controlar visibilidad del botón de añadir tarea rápida
            const quickAddBtn = document.getElementById('showQuickAddBtn');
            if (quickAddBtn) {
                if (tabId === 'tab-today') {
                    quickAddBtn.style.display = 'flex';
                } else {
                    quickAddBtn.style.display = 'none';
                }
            }
            
            // Las llamadas a renderizado específicas de cada módulo se manejan en script.js al cambiar de pestaña.
        },

        updatePointsDisplay: function(finalPoints) {
            const pointsValueElement = document.getElementById("pointsValue");
            if (!pointsValueElement) return;

            const startPoints = parseInt(pointsValueElement.textContent.replace(/\D/g, '') || '0', 10);

            if (finalPoints === startPoints) return;

            const duration = 500; // ms
            const frameDuration = 1000 / 60; // 60fps
            const totalFrames = Math.round(duration / frameDuration);
            let frame = 0;

            const countUp = () => {
                frame++;
                const progress = frame / totalFrames;
                const currentPoints = Math.round(startPoints + (finalPoints - startPoints) * progress);
                pointsValueElement.textContent = currentPoints;

                if (frame < totalFrames) {
                    requestAnimationFrame(countUp);
                } else {
                    pointsValueElement.textContent = finalPoints;
                }
            };
            requestAnimationFrame(countUp);
        },

        renderStatsToday: function() {
            const todayStr = App.utils.getFormattedDate();
            const history = App.state.getHistory();
            const histDay = history.find(h => h.date === todayStr);
            const earned = histDay ? histDay.earned : 0;
            const spent = histDay ? histDay.spent : 0;
            const net = earned - spent;

            document.getElementById("pointsEarned").textContent = earned;
            document.getElementById("pointsSpent").textContent = spent;
            document.getElementById("pointsNet").textContent = net;
        },

        showMotivationMessage: function(message) {
            const container = document.getElementById('motivationMessagesContainer');
            if (!container) return;
            const msgElement = document.createElement('div');
            msgElement.className = 'motivation-message';
            msgElement.textContent = message;
            container.appendChild(msgElement);
            msgElement.addEventListener('animationend', () => msgElement.remove());
        },

        shownotifyMessage: function(message) {
            const container = document.getElementById('notifyMessagesContainer');
            if (!container) return;

            const existingMessage = container.querySelector('.notify-message');
            if (existingMessage) existingMessage.remove();

            const msgElement = document.createElement('div');
            msgElement.className = 'notify-message';
            msgElement.textContent = message;
            container.appendChild(msgElement);

            void msgElement.offsetWidth;
            msgElement.classList.add('show');

            setTimeout(() => {
                msgElement.classList.remove('show');
                msgElement.addEventListener('transitionend', () => msgElement.remove(), { once: true });
            }, 5000);
        },

        // --- Métodos de Eventos (de ui-events.js) ---

        toggleFormVisibility: (containerId, inputToFocus, fabElement) => {
            const container = document.getElementById(containerId);
            if (!container) return;
            const isVisible = container.classList.contains('active');
            document.querySelectorAll('.form-container.active').forEach(f => f.classList.remove('active'));
            container.classList.toggle('active', !isVisible);
            if (fabElement) fabElement.textContent = isVisible ? '➕' : '➖';
            if (!isVisible && inputToFocus) inputToFocus.focus();
        },

        showCustomAlert: function(message) {
            _setupCustomModal('customAlertDialog', 'customAlertMessage', [{ id: 'customAlertCloseBtn' }, { id: 'closeAlertDialog' }], message);
        },

        showCustomConfirm: function(message, callback) {
            _setupCustomModal('customConfirmDialog', 'customConfirmMessage', [
                { id: 'customConfirmYesBtn', isConfirmAction: true },
                { id: 'customConfirmNoBtn', isConfirmAction: false },
                { id: 'closeConfirmDialog', isConfirmAction: false }
            ], message, callback);
        },

        showResetOptionsModal: function() {
            document.getElementById('statsModal')?.classList.remove('visible');
            document.getElementById('resetConfirmModal')?.classList.add('visible');
        },

        closeResetConfirmModal: function() {
            document.getElementById('resetConfirmModal')?.classList.remove('visible');
        },

        // --- Inicialización de Listeners ---

        initListeners: function() {
            // Listen for global UI events
            App.events.on('showAlert', (message) => this.showCustomAlert(message));
            App.events.on('shownotifyMessage', (message) => this.shownotifyMessage(message));
            App.events.on('showCustomConfirm', (data) => this.showCustomConfirm(data.message, data.callback));
            App.events.on('pointsUpdated', (points) => this.updatePointsDisplay(points));
            App.events.on('showMotivationMessage', (message) => this.showMotivationMessage(message));
            App.events.on('stateRefreshed', () => this.updatePointsDisplay());

            // Global Nav
            document.querySelectorAll('nav.tabs button').forEach(btn => {
                btn.addEventListener('click', () => {
                    const tabId = btn.getAttribute('aria-controls');
                    App.ui.general.switchTab(tabId);
                    sessionStorage.setItem('lastActiveTab', tabId);
                });
            });

            document.getElementById('totalPointsBtn')?.addEventListener('click', () => {
                App.ui.general.renderStatsToday();
                document.getElementById('statsModal')?.classList.add('visible');
            });
            document.getElementById('closeStatsModal')?.addEventListener('click', () => document.getElementById('statsModal')?.classList.remove('visible'));
            document.getElementById('openResetOptionsBtn')?.addEventListener('click', this.showResetOptionsModal);
            document.getElementById('closeResetConfirmModal')?.addEventListener('click', this.closeResetConfirmModal);

            document.getElementById('toggleAgendaBtn')?.addEventListener('click', (e) => {
                const isExpanded = e.currentTarget.getAttribute('aria-expanded') === 'true';
                e.currentTarget.setAttribute('aria-expanded', !isExpanded);
                document.getElementById('scheduledMissionsContainer').style.display = !isExpanded ? 'block' : 'none';
                e.currentTarget.classList.toggle('active', !isExpanded);
            });

            // Forms & General Click Handling
            const addCategoryForm = document.getElementById('addCategoryForm');
            const categoryInput = document.getElementById('categoryInput');
            document.getElementById('showAddCategoryBtn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFormVisibility('addCategoryFormContainer', categoryInput);
            });
            addCategoryForm?.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = categoryInput.value.trim();
                if (name) {
                    App.state.addCategory(name);
                    addCategoryForm.reset();
                } else {
                    this.showCustomAlert("El nombre de la categoría no puede estar vacío.");
                }
            });

            document.addEventListener('click', (e) => {
                if (!e.target.closest('.form-container, .category-wrapper, #addCategoryFormContainer, .habit-card, .modal-content, .floating-button, .notify-message, .date-display-container, .challenge-card')) {
                    document.querySelectorAll('.form-container.active').forEach(f => f.classList.remove('active'));
                    document.querySelectorAll('.show-delete').forEach(el => el.classList.remove('show-delete'));
                }
                if (e.target.matches('.cat-header .delete-btn')) {
                    const categoryId = e.target.closest('.cat-header').dataset.categoryId;
                    if (categoryId) App.state.deleteCategory(categoryId);
                }
            });

            // Import/Export Listeners
            const importFileInput = document.getElementById('importFile');

            document.getElementById('exportDataBtn')?.addEventListener('click', () => {
                App.data.exportData();
                this.closeResetConfirmModal();
            });

            document.getElementById('importDataBtn')?.addEventListener('click', () => {
                importFileInput?.click();
            });

            importFileInput?.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (file) {
                    App.data.importData(file);
                }
                this.closeResetConfirmModal();
                importFileInput.value = ''; // Reset for next import
            });


            // Reset Listeners
            document.getElementById('resetHistoryBtn')?.addEventListener('click', () => {
                this.closeResetConfirmModal();
                this.showCustomConfirm('¿Seguro que quieres borrar SÓLO el historial?', (confirmed) => {
                    if (confirmed) {
                        App.state.resetHistoryOnly();
                        this.showCustomAlert('El historial ha sido reiniciado.');
                        this.switchTab('tab-today');
                    }
                });
            });

            document.getElementById('resetAppBtn')?.addEventListener('click', () => {
                this.closeResetConfirmModal();
                this.showCustomConfirm('¡ADVERTENCIA! Vas a ELIMINAR TODOS tus datos. ¿Seguro?', (confirmed) => {
                    if (confirmed) {
                        this.showCustomConfirm('¡ÚLTIMA ADVERTENCIA! PERDERÁS TODO. ¿100% seguro?', (finalConfirm) => {
                            if (finalConfirm) {
                                App.state.resetAllData();
                                this.showCustomAlert('La aplicación ha sido reiniciada.');
                                this.switchTab('tab-today');
                            }
                        });
                    }
                });
            });
        }
    };

})(window.App = window.App || {});
