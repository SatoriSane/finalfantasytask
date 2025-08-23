// ui-render-general.js
// Maneja la renderización de los componentes de la interfaz de usuario generales.
(function(App) {
    // Asegurarse de que App.ui.render exista para adjuntar sub-módulos.
    App.ui.render = App.ui.render || {};

    App.ui.render.general = {
        /**
         * @description Controla la visibilidad de las pestañas y llama a la función de renderizado para la pestaña activa.
         * @param {string} tabId El ID de la pestaña a activar.
         */
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

            // Llamar a las funciones de renderizado de los módulos específicos de cada pestaña.
            // Asegurarse de que los módulos existan antes de llamar a sus funciones.
            if (tabId === 'tab-today' && App.ui.render.today) { App.ui.render.today.renderTodayTasks(); }
            if (tabId === 'tab-missions' && App.ui.render.missions) { App.ui.render.missions.renderMissions(); }
            if (tabId === 'tab-scheduled' && App.ui.render.scheduled) { App.ui.render.scheduled.renderScheduledMissions(); }
            if (tabId === 'tab-history' && App.ui.render.history) { App.ui.render.history.renderHistory(); }
            if (tabId === 'tab-shop' && App.ui.render.shop) { App.ui.render.shop.renderShopItems(); }
        },

        /**
         * @description Actualiza el valor de los puntos mostrados en la interfaz.
         */
        updatePointsDisplay: function() {
            const pointsValueElement = document.getElementById("pointsValue");
            if (pointsValueElement) {
                pointsValueElement.textContent = App.state.getPoints();
            } else {
                console.warn("Elemento #pointsValue no encontrado en la UI.");
            }
        },

        /**
         * @description Renderiza las estadísticas de puntos ganados, gastados y netos para el día actual.
         */
        renderStatsToday: function() {
            const todayStr = App.utils.getFormattedDate();
            const history = App.state.getHistory();
            const histDay = history.find(h => h.date === todayStr);
            const earned = histDay ? histDay.earned : 0;
            const spent = histDay ? histDay.spent : 0;
            const net = earned - spent;

            const pointsEarnedEl = document.getElementById("pointsEarned");
            const pointsSpentEl = document.getElementById("pointsSpent");
            const pointsNetEl = document.getElementById("pointsNet");

            if (pointsEarnedEl) {
                pointsEarnedEl.textContent = `${earned}`;
                pointsEarnedEl.className = "stats-value " + (earned > 0 ? "positive" : "");
            } else { console.warn("Elemento #pointsEarned no encontrado."); }

            if (pointsSpentEl) {
                pointsSpentEl.textContent = `${spent}`;
                pointsSpentEl.className = "stats-value " + (spent > 0 ? "negative" : "");
            } else { console.warn("Elemento #pointsSpent no encontrado."); }

            if (pointsNetEl) {
                pointsNetEl.textContent = `${net}`;
                pointsNetEl.className = "stats-value " + (net > 0 ? "positive" : (net < 0 ? "negative" : ""));
            } else { console.warn("Elemento #pointsNet no encontrado."); }
        },

        /**
         * @description Muestra un mensaje temporal de motivación/celebración (para logros).
         * @param {string} message El mensaje a mostrar.
         */
        showMotivationMessage: function(message) {
            const container = document.getElementById('motivationMessagesContainer');
            if (!container) {
                console.warn("Contenedor #motivationMessagesContainer no encontrado, no se puede mostrar el mensaje de motivación.");
                return;
            }
            const msgElement = document.createElement('div');
            msgElement.className = 'motivation-message'; // Clase para mensajes de celebración
            msgElement.textContent = message;

            container.appendChild(msgElement);

            // Eliminar el mensaje después de la animación para limpiar el DOM
            msgElement.addEventListener('animationend', () => {
                msgElement.remove();
            });
        },

        /**
         * @description Muestra un mensaje temporal discreto (para confirmaciones generales).
         * Aparece en la parte superior central.
         * @param {string} message El mensaje a mostrar.
         */
        showDiscreetMessage: function(message) {
            const container = document.getElementById('discreetMessagesContainer'); // ¡APUNTA AL NUEVO CONTENEDOR!
            if (!container) {
                console.warn("Contenedor #discreetMessagesContainer no encontrado, no se puede mostrar el mensaje discreto.");
                return;
            }

            // Eliminar cualquier mensaje discreto anterior para evitar superposiciones
            const existingMessage = container.querySelector('.discreet-message');
            if (existingMessage) {
                existingMessage.remove(); // Elimina el mensaje anterior inmediatamente
            }

            const msgElement = document.createElement('div');
            msgElement.className = 'discreet-message'; // Clase para mensajes discretos
            msgElement.textContent = message;

            container.appendChild(msgElement);

            // Forzar reflow para que la transición CSS funcione correctamente
            void msgElement.offsetWidth;
            msgElement.classList.add('show'); // Añadir clase para activar la transición de visibilidad

            // Eliminar el mensaje después de un tiempo (ej. 3 segundos)
            setTimeout(() => {
                msgElement.classList.remove('show');
                // Asegurarse de que el elemento se elimina solo después de que la transición de salida ha terminado
                msgElement.addEventListener('transitionend', () => {
                    msgElement.remove();
                }, { once: true });
            }, 3000); // Duración en milisegundos que el mensaje es visible
        }
    };
})(window.App = window.App || {});
