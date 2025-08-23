// ui-render-shop.js
// Maneja la renderización específica de la pestaña "Tienda".
(function(App) {
    App.ui.render = App.ui.render || {};
    App.ui.render.shop = {
        _prevProgress: {}, // Almacena el progreso previo de los ítems de la tienda para animaciones.
        _animationTimeouts: new Map(), // Almacena los timeouts para limpiar animaciones escalonadas.

        /**
         * @description Renderiza todos los ítems de la tienda, ordenándolos por estado y asequibilidad.
         */
        renderShopItems: function() {
            const container = document.getElementById("shopList");
            if (!container) {
                console.warn("Contenedor #shopList no encontrado, no se pueden renderizar los ítems de la tienda.");
                return;
            }
            
            // Limpiar timeouts previos para evitar múltiples animaciones o fugas de memoria.
            this._animationTimeouts.forEach(timeout => clearTimeout(timeout));
            this._animationTimeouts.clear();
            
            container.innerHTML = ""; // Limpiar el contenido actual del contenedor.

            const state = App.state.getState();
            const userPoints = state.points || 0; // Puntos actuales del usuario.
            const shopItems = App.state.getShopItems(); // Obtener todos los ítems de la tienda.

            // Mostrar mensaje si no hay ítems en la tienda.
            if (!shopItems || shopItems.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                        <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">🛍️</div>
                        <p style="color: var(--ff-text-dark); font-size: 1.1rem;">
                            No hay productos en la tienda
                        </p>
                        <p style="color: var(--ff-text-dark); font-size: 0.9rem; margin-top: 0.5rem;">
                            Usa el botón ➕ para añadir un nuevo producto
                        </p>
                    </div>
                `;
                return;
            }

            // Identificar el último ítem comprado para aplicar efectos especiales.
            const lastBought = shopItems
                .filter(item => item.justBought)
                .sort((a, b) => {
                    // Asegurarse de que las fechas existan antes de comparar
                    if (!a.purchasedTodayDate || !b.purchasedTodayDate) return 0;
                    return b.purchasedTodayDate.localeCompare(a.purchasedTodayDate);
                })[0];

            shopItems.forEach(item => {
                item.recentlyPurchased = lastBought && item.id === lastBought.id;
            });

            // Separar y ordenar elementos para una mejor visualización.
            const notPurchased = shopItems.filter(item => !item.purchasedTodayDate);
            const purchased = shopItems.filter(item => item.purchasedTodayDate);

            // Ordenar por asequibilidad (más asequibles primero).
            notPurchased.sort((a, b) => {
                const affordabilityA = userPoints >= a.cost ? 1 : (a.cost > 0 ? userPoints / a.cost : 1);
                const affordabilityB = userPoints >= b.cost ? 1 : (b.cost > 0 ? userPoints / b.cost : 1);
                return affordabilityB - affordabilityA;
            });

            // Ordenar comprados por fecha (más recientes primero).
            purchased.sort((a, b) => {
                const dateA = new Date(a.purchasedTodayDate);
                const dateB = new Date(b.purchasedTodayDate);
                return dateB.getTime() - dateA.getTime();
            });

            const combined = [...notPurchased, ...purchased]; // Combinar todos los ítems.

            // Renderizar cada ítem con un delay escalonado para un efecto de "cascada".
            combined.forEach((item, index) => {
                const timeout = setTimeout(() => {
                    this._renderShopCard(item, userPoints, container);
                }, index * 50); // 50ms de delay entre cada tarjeta.
                
                this._animationTimeouts.set(item.id, timeout);
            });
        },

        /**
         * @description Renderiza una tarjeta individual de la tienda.
         * @param {object} item - El objeto del ítem de la tienda.
         * @param {number} userPoints - Los puntos actuales del usuario.
         * @param {HTMLElement} container - El contenedor donde se añadirá la tarjeta.
         */
        _renderShopCard: function(item, userPoints, container) {
            const isPurchased = item.purchasedTodayDate && !item.recentlyPurchased;
            const isLastPurchased = item.recentlyPurchased;
            const canAfford = userPoints >= item.cost;

            const card = document.createElement("div");
            card.className = `shop-card ${isPurchased ? 'purchased' : ''}`;
            if (isLastPurchased) card.classList.add('recently-purchased');
            card.dataset.shopItemId = item.id;

            // Event listener para doble clic para mostrar el botón de eliminar.
            card.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                // Ocultar cualquier otro botón de eliminar visible.
                document.querySelectorAll('.shop-card.show-delete').forEach(el => el.classList.remove('show-delete'));
                card.classList.add('show-delete'); // Mostrar el botón de eliminar de esta tarjeta.
            });

            // Crear estructura de contenido principal de la tarjeta.
            const mainContent = document.createElement("div");
            mainContent.className = "shop-card-main";

            // Header con nombre y costo del ítem.
            const header = document.createElement("div");
            header.className = "shop-item-header";

            const nameSpan = document.createElement("span");
            nameSpan.className = "shop-item-name";
            nameSpan.textContent = item.name;

            const costSpan = document.createElement("span");
            costSpan.className = "shop-item-cost";
            // Usar un SVG de estrella para los puntos.
            costSpan.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2L9.19 8.68L2 9.27L7.54 13.91L5.75 21.02L12 17.5L18.25 21.02L16.46 13.91L22 9.27L14.81 8.68L12 2Z"></path>
                </svg>
                ${item.cost}
            `;

            header.appendChild(nameSpan);
            header.appendChild(costSpan);
            mainContent.appendChild(header);

            // Botones de acción con progreso integrado.
            const actionsDiv = document.createElement("div");
            actionsDiv.className = "shop-actions";

            const actionBtn = document.createElement("button");
            
            if (isPurchased || isLastPurchased) {
                actionBtn.className = "purchased-btn";
                actionBtn.textContent = "logrado";
                actionBtn.disabled = true;
                // La animación 'pulse' se maneja ahora en CSS con 'recently-purchased'
            } else {
                // Calcular progreso para el botón de compra.
                const progressPercentage = item.cost === 0 ? 100 : Math.min((userPoints / item.cost) * 100, 100);
                
                actionBtn.className = canAfford ? "buy-btn can-afford" : "buy-btn";
                actionBtn.innerHTML = '<span>obtener</span>';
                actionBtn.disabled = false;
                
                // Establecer progreso con CSS custom property para la barra visual.
                actionBtn.style.setProperty('--progress', progressPercentage + '%');

                actionBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (canAfford) {
                        // Añadir efecto visual antes de comprar.
                        actionBtn.style.transform = "scale(0.95)";
                        setTimeout(() => {
                            App.state.buyShopItem(item.id);
                        }, 100);
                    } else {
                        // Feedback visual para ítems no asequibles (animación de "shake").
                        actionBtn.style.animation = "shake 0.5s ease-in-out";
                        setTimeout(() => {
                            actionBtn.style.animation = "";
                        }, 500);
                    }
                };

                this._prevProgress[item.id] = progressPercentage;
            }

            actionsDiv.appendChild(actionBtn);
            mainContent.appendChild(actionsDiv);

            card.appendChild(mainContent);

            // Botón eliminar (idéntico al de Today).
            const deleteBtn = document.createElement("button");
            deleteBtn.innerHTML = "❌";
            deleteBtn.className = "delete-btn";
            deleteBtn.title = "Doble clic para mostrar, clic aquí para eliminar";
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                // NOTA: Se ha eliminado el 'confirm()' debido a las restricciones de la plataforma.
                // En una aplicación real, se debería usar un modal de confirmación personalizado.
                
                // Efecto de salida antes de eliminar.
                card.style.animation = "slideOutDown 0.3s ease-in";
                setTimeout(() => {
                    App.state.deleteShopItem(item.id);
                }, 300);
            };
            card.appendChild(deleteBtn);

            container.appendChild(card);

            // Efecto especial de celebración para compra reciente.
            if (isLastPurchased) {
                setTimeout(() => {
                    this._celebrationEffect(card);
                }, 100);
            }
        },

        /**
         * @description Aplica un efecto visual de "explosión de partículas" al comprar un ítem.
         * @param {HTMLElement} card - La tarjeta del ítem que se ha comprado.
         */
        _celebrationEffect: function(card) {
            // Crear partículas de celebración.
            for (let i = 0; i < 12; i++) {
                const particle = document.createElement("div");
                particle.style.cssText = `
                    position: absolute;
                    width: 6px;
                    height: 6px;
                    background: var(--ff-accent); /* Usar la variable de color de acento */
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 1000;
                    animation: particle-burst 1.5s ease-out forwards;
                `;
                
                const rect = card.getBoundingClientRect();
                // Posicionar las partículas desde el centro de la tarjeta.
                particle.style.left = (rect.left + rect.width / 2) + "px";
                particle.style.top = (rect.top + rect.height / 2) + "px";
                
                // Dirección aleatoria para cada partícula.
                const angle = (i / 12) * Math.PI * 2;
                const velocity = 50 + Math.random() * 30; // Velocidad aleatoria.
                particle.style.setProperty('--dx', Math.cos(angle) * velocity + 'px');
                particle.style.setProperty('--dy', Math.sin(angle) * velocity + 'px');
                
                document.body.appendChild(particle);
                
                // Eliminar la partícula después de su animación.
                setTimeout(() => {
                    particle.remove();
                }, 1500);
            }
            // Las @keyframes para 'particle-burst', 'slideOutDown' y 'shake' ahora están en shop.css
        }
    };
})(window.App = window.App || {});
