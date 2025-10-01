// features/feature-history.js
// Maneja la renderización del historial de puntos.
(function(App) {
    App.ui.history = {
        /**
         * @description Renderiza el historial de puntos.
         */
        initListeners: function() {
            App.events.on('historyUpdated', () => this.render());
            App.events.on('stateRefreshed', () => this.render());
        },

        render: function() {
            const container = document.getElementById("historyBody");
            if (!container) {
                console.warn("Contenedor #historyBody no encontrado, no se puede renderizar el historial.");
                return;
            }
            container.innerHTML = "";

            const history = App.state.getHistory();
            if (history.length === 0) {
                const row = document.createElement("tr");
                row.innerHTML = `<td colspan=\"4\" style=\"text-align:center; color:var(--ff-text-dark);\">No hay historial de puntos.</td>`;
                container.appendChild(row);
                return;
            }

            [...history].reverse().forEach(histDay => {
                const row = document.createElement("tr");
                row.className = "history-main-row";
                const net = histDay.earned - histDay.spent;
                const dateObjForHistory = App.utils.normalizeDateToStartOfDay(histDay.date);
                const displayDate = dateObjForHistory ? dateObjForHistory.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).replace('.', '').replace(',', '') : 'Fecha inválida';
                row.innerHTML = `
                    <td>${displayDate}</td>
                    <td class=\"positive\">＋${histDay.earned}</td>
                    <td class=\"negative\">−${histDay.spent}</td>
                    <td class=\"${net >= 0 ? 'positive' : 'negative'}\">${net}</td>
                `;
                const detailRow = document.createElement("tr");
                detailRow.className = "history-details-container";
                const detailCell = document.createElement("td");
                detailCell.setAttribute("colspan", "4");
            
                const actionsHtml = Array.isArray(histDay.actions)
                    ? histDay.actions.map(action => `<li>${action.name} (${action.points >= 0 ? "＋" : "−"}${Math.abs(action.points)})</li>`).join('')
                    : '';
            
                detailCell.innerHTML = `<strong>Acciones:</strong><ul>${actionsHtml}</ul>`;
                detailRow.appendChild(detailCell);

                row.addEventListener('click', () => {
                    const isVisible = detailRow.style.display === 'table-row';
                    detailRow.style.display = isVisible ? 'none' : 'table-row';
                });

                container.appendChild(row);
                container.appendChild(detailRow);
            });
        }
    };
})(window.App = window.App || {});
