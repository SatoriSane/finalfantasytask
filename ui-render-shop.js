(function(App) {
    App.ui.render = App.ui.render || {};
    App.ui.render.shop = {
        _prevProgress: {},
        _animationTimeouts: new Map(),

        renderShopItems: function() {
            const container = document.getElementById("shopList");
            if (!container) return;
            
            // Limpiar timeouts previos
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
                            Agrega uno nuevo para empezar
                        </p>
                    </div>
                `;
                return;
            }

            // Identificar el último comprado
            const lastBought = shopItems
                .filter(item => item.justBought)
                .sort((a, b) => b.purchasedTodayDate.localeCompare(a.purchasedTodayDate))[0];

            shopItems.forEach(item => {
                item.recentlyPurchased = lastBought && item.id === lastBought.id;
            });

            // Separar y ordenar elementos
            const notPurchased = shopItems.filter(item => !item.purchasedTodayDate);
            const purchased = shopItems.filter(item => item.purchasedTodayDate);

            // Ordenar por asequibilidad (más asequibles primero)
            notPurchased.sort((a, b) => {
                const affordabilityA = userPoints >= a.cost ? 1 : userPoints / a.cost;
                const affordabilityB = userPoints >= b.cost ? 1 : userPoints / b.cost;
                return affordabilityB - affordabilityA;
            });

            // Ordenar comprados por fecha (más recientes primero)
            purchased.sort((a, b) => {
                const dateA = new Date(a.purchasedTodayDate);
                const dateB = new Date(b.purchasedTodayDate);
                return dateB - dateA;
            });

            const combined = [...notPurchased, ...purchased];

            // Renderizar cada item con delay escalonado
            combined.forEach((item, index) => {
                const timeout = setTimeout(() => {
                    this._renderShopCard(item, userPoints, container);
                }, index * 50); // 50ms de delay entre cada tarjeta
                
                this._animationTimeouts.set(item.id, timeout);
            });
        },

        _renderShopCard: function(item, userPoints, container) {
            const isPurchased = item.purchasedTodayDate && !item.recentlyPurchased;
            const isLastPurchased = item.recentlyPurchased;
            const canAfford = userPoints >= item.cost;

            const card = document.createElement("div");
            card.className = `shop-card ${isPurchased ? 'purchased' : ''}`;
            if (isLastPurchased) card.classList.add('recently-purchased');
            card.dataset.shopItemId = item.id;

            // Event listeners
            card.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.show-delete').forEach(el => el.classList.remove('show-delete'));
                card.classList.add('show-delete');
            });

            // Crear estructura de contenido
            const mainContent = document.createElement("div");
            mainContent.className = "shop-card-main";

            // Header con nombre y costo
            const header = document.createElement("div");
            header.className = "shop-item-header";

            const nameSpan = document.createElement("span");
            nameSpan.className = "shop-item-name";
            nameSpan.textContent = item.name;

            const costSpan = document.createElement("span");
            costSpan.className = "shop-item-cost";
            costSpan.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L9.19 8.68L2 9.27L7.54 13.91L5.75 21.02L12 17.5L18.25 21.02L16.46 13.91L22 9.27L14.81 8.68L12 2Z"/>
                </svg>
                ${item.cost}
            `;

            header.appendChild(nameSpan);
            header.appendChild(costSpan);
            mainContent.appendChild(header);

            // Botones de acción con progreso integrado
            const actionsDiv = document.createElement("div");
            actionsDiv.className = "shop-actions";

            const actionBtn = document.createElement("button");
            
            if (isPurchased || isLastPurchased) {
                actionBtn.className = "purchased-btn";
                actionBtn.textContent = "logrado";
                actionBtn.disabled = true;
                if (isLastPurchased) {
                    // Añadir efecto especial para compra reciente
                    setTimeout(() => {
                        actionBtn.style.animation = "pulse 1s ease-in-out infinite alternate";
                    }, 500);
                }
            } else {
                // Calcular progreso para el botón
                const progressPercentage = item.cost === 0 ? 100 : Math.min((userPoints / item.cost) * 100, 100);
                
                actionBtn.className = canAfford ? "buy-btn can-afford" : "buy-btn";
                actionBtn.innerHTML = '<span>obtener</span>';
                actionBtn.disabled = false;
                
                // Establecer progreso con CSS custom property
                actionBtn.style.setProperty('--progress', progressPercentage + '%');

                actionBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (canAfford) {
                        // Añadir efecto visual antes de comprar
                        actionBtn.style.transform = "scale(0.95)";
                        setTimeout(() => {
                            App.state.buyShopItem(item.id);
                        }, 100);
                    } else {
                        // Feedback visual para items no asequibles
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

            // Botón eliminar
            const deleteBtn = document.createElement("button");
            deleteBtn.innerHTML = '❌';
            deleteBtn.className = "delete-btn";
            deleteBtn.title = "Doble clic para mostrar, clic aquí para eliminar";
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm(`¿Eliminar "${item.name}" de la tienda?`)) {
                    // Efecto de salida antes de eliminar
                    card.style.animation = "slideOutDown 0.3s ease-in";
                    setTimeout(() => {
                        App.state.deleteShopItem(item.id);
                    }, 300);
                }
            };
            card.appendChild(deleteBtn);

            container.appendChild(card);

            // Efecto especial para compra reciente
            if (isLastPurchased) {
                setTimeout(() => {
                    this._celebrationEffect(card);
                }, 100);
            }
        },

        _celebrationEffect: function(card) {
            // Crear partículas de celebración
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
                
                // Dirección aleatoria
                const angle = (i / 12) * Math.PI * 2;
                const velocity = 50 + Math.random() * 30;
                particle.style.setProperty('--dx', Math.cos(angle) * velocity + 'px');
                particle.style.setProperty('--dy', Math.sin(angle) * velocity + 'px');
                
                document.body.appendChild(particle);
                
                setTimeout(() => {
                    particle.remove();
                }, 1500);
            }

            // Añadir estilos de animación de partículas si no existen
            if (!document.getElementById('particle-animations')) {
                const style = document.createElement('style');
                style.id = 'particle-animations';
                style.textContent = `
                    @keyframes particle-burst {
                        0% {
                            transform: translate(0, 0) scale(1);
                            opacity: 1;
                        }
                        100% {
                            transform: translate(var(--dx), var(--dy)) scale(0);
                            opacity: 0;
                        }
                    }
                    @keyframes slideOutDown {
                        0% {
                            transform: translateY(0);
                            opacity: 1;
                        }
                        100% {
                            transform: translateY(50px);
                            opacity: 0;
                        }
                    }
                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        25% { transform: translateX(-5px); }
                        75% { transform: translateX(5px); }
                    }
                `;
                document.head.appendChild(style);
            }
        }
    };
})(window.App = window.App || {});