// ui-render-shop.js
// Maneja la renderización específica de la pestaña "Tienda".
(function(App) {
    App.ui.render = App.ui.render || {};
    App.ui.render.shop = {
        _prevProgress: {},
        _animationTimeouts: new Map(),

        /**
         * @description Renderiza todos los ítems de la tienda con un orden específico.
         */
        renderShopItems: function() {
            const container = document.getElementById("shopList");
            if (!container) {
                console.warn("Contenedor #shopList no encontrado, no se pueden renderizar los ítems de la tienda.");
                return;
            }
            
            this._animationTimeouts.forEach(timeout => clearTimeout(timeout));
            this._animationTimeouts.clear();
            
            container.innerHTML = "";

            const state = App.state.getState();
            const userPoints = state.points || 0;
            const shopItems = App.state.getShopItems();

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

            // Identificar el último comprado buscando el 'purchasedTodayDate' más reciente.
            let latestPurchaseDate = null;
            let lastBoughtItemId = null;

            shopItems.forEach(item => {
                if (item.purchasedTodayDate) {
                    const currentPurchaseDate = new Date(item.purchasedTodayDate);
                    if (!latestPurchaseDate || currentPurchaseDate > latestPurchaseDate) {
                        latestPurchaseDate = currentPurchaseDate;
                        lastBoughtItemId = item.id;
                    }
                }
            });

            // Asignar `recentlyPurchased` al ítem que realmente fue el último en ser comprado.
            shopItems.forEach(item => {
                item.recentlyPurchased = item.id === lastBoughtItemId;
                if (item.justBought) {
                    delete item.justBought;
                }
            });

            // --- LÓGICA DE ORDENAMIENTO ADAPTADA ---
            const purchasableItems = [];
            const notYetAffordableItems = [];
            const purchasedItems = [];

            shopItems.forEach(item => {
                if (item.purchasedTodayDate) {
                    purchasedItems.push(item);
                } else if (userPoints >= item.cost) {
                    purchasableItems.push(item);
                } else {
                    notYetAffordableItems.push(item);
                }
            });

            // 1. No se requiere un orden específico para los comprables, ya que todos están disponibles.
            
            // 2. Ordenar los no asequibles por proximidad (costo - puntos).
            notYetAffordableItems.sort((a, b) => (a.cost - userPoints) - (b.cost - userPoints));
            
            // 3. Ordenar los ya comprados: más recientes primero, utilizando las marcas de tiempo completas.
            purchasedItems.sort((a, b) => {
                const dateA = new Date(a.purchasedTodayDate || 0);
                const dateB = new Date(b.purchasedTodayDate || 0);
                return dateB.getTime() - dateA.getTime(); // Orden descendente (más reciente primero)
            });

            // Combinar las listas en el orden deseado.
            const combined = [...purchasableItems, ...notYetAffordableItems, ...purchasedItems];

            // Renderizar cada ítem con un delay escalonado.
            combined.forEach((item, index) => {
                const timeout = setTimeout(() => {
                    this._renderShopCard(item, userPoints, container);
                }, index * 50);
                
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

            card.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.shop-card.show-delete').forEach(el => el.classList.remove('show-delete'));
                card.classList.add('show-delete');
            });

            const mainContent = document.createElement("div");
            mainContent.className = "shop-card-main";

            const header = document.createElement("div");
            header.className = "shop-item-header";

            const nameSpan = document.createElement("span");
            nameSpan.className = "shop-item-name";
            nameSpan.textContent = item.name;

            const costSpan = document.createElement("span");
            costSpan.className = "shop-item-cost";
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

            const actionsDiv = document.createElement("div");
            actionsDiv.className = "shop-actions";

            const actionBtn = document.createElement("button");
            
            if (isPurchased || isLastPurchased) {
                actionBtn.className = "purchased-btn";
                actionBtn.textContent = "logrado";
                actionBtn.disabled = true;
            } else {
                const progressPercentage = item.cost === 0 ? 100 : Math.min(Math.round((userPoints / item.cost) * 100), 100);
                
                // ⭐ Lógica para el texto del botón OBTENER/CANDADO + PORCENTAJE
                if (canAfford) {
                    actionBtn.className = "buy-btn can-afford";
                    actionBtn.innerHTML = '<span>obtener</span>';
                } else {
                    actionBtn.className = "buy-btn"; // No añadir 'can-afford' aquí
                    actionBtn.innerHTML = `<span><svg class="lock-icon-small" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg> ${progressPercentage}%</span>`;
                }
                
                actionBtn.disabled = false; // Permitir clic para la animación de shake
                
                actionBtn.style.setProperty('--progress', progressPercentage + '%');

                actionBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (canAfford) {
                        actionBtn.style.transform = "scale(0.95)";
                        setTimeout(() => {
                            App.state.buyShopItem(item.id);
                        }, 100);
                    } else {
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

            const deleteBtn = document.createElement("button");
            deleteBtn.innerHTML = "❌";
            deleteBtn.className = "delete-btn";
            deleteBtn.title = "Doble clic para mostrar, clic aquí para eliminar";
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                card.style.animation = "slideOutDown 0.3s ease-in";
                setTimeout(() => {
                    App.state.deleteShopItem(item.id);
                }, 300);
            };
            card.appendChild(deleteBtn);

            container.appendChild(card);

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
            for (let i = 0; i < 12; i++) {
                const particle = document.createElement("div");
                particle.style.cssText = `
                    position: absolute;
                    width: 6px;
                    height: 6px;
                    background: var(--ff-accent);
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 1000;
                    animation: particle-burst 1.5s ease-out forwards;
                `;
                
                const rect = card.getBoundingClientRect();
                particle.style.left = (rect.left + rect.width / 2) + "px";
                particle.style.top = (rect.top + rect.height / 2) + "px";
                
                const angle = (i / 12) * Math.PI * 2;
                const velocity = 50 + Math.random() * 30;
                particle.style.setProperty('--dx', Math.cos(angle) * velocity + 'px');
                particle.style.setProperty('--dy', Math.sin(angle) * velocity + 'px');
                
                document.body.appendChild(particle);
                
                setTimeout(() => {
                    particle.remove();
                }, 1500);
            }
        }
    };
})(window.App = window.App || {});
