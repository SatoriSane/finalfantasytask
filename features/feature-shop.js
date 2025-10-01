// features/feature-shop.js
(function(App) {
    'use strict';

    // --- PRIVATE VARIABLES ---
    const _animationTimeouts = new Map();
    let _prevProgress = {};

    // --- PRIVATE METHODS ---

    /**
     * @description Aplica un efecto visual de "explosión de partículas" al comprar un ítem.
     * @param {HTMLElement} card - La tarjeta del ítem que se ha comprado.
     */
    function _celebrationEffect(card) {
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

    /**
     * @description Renderiza una tarjeta individual de la tienda.
     * @param {object} item - El objeto del ítem de la tienda.
     * @param {number} userPoints - Los puntos actuales del usuario.
     * @param {HTMLElement} container - El contenedor donde se añadirá la tarjeta.
     */
    function _renderShopCard(item, userPoints, container) {
        const isPurchased = item.purchasedTodayDate && !item.recentlyPurchased;
        const isLastPurchased = item.recentlyPurchased;
        const canAfford = userPoints >= item.cost;

        const card = document.createElement("div");
        card.className = `shop-card ${isPurchased ? 'purchased' : ''}`;
        if (isLastPurchased) card.classList.add('recently-purchased');
        card.dataset.shopItemId = item.id;

        card.addEventListener('click', (e) => {
            if (e.target.closest('button')) {
                return;
            }
            App.ui.shop.openEditShopItemModal(item.id);
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
            
            if (canAfford) {
                actionBtn.className = "buy-btn can-afford";
                actionBtn.innerHTML = '<span>obtener</span>';
            } else {
                actionBtn.className = "buy-btn";
                actionBtn.innerHTML = `<span><svg class="lock-icon-small" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg> ${progressPercentage}%</span>`;
            }
            
            actionBtn.disabled = false;
            
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

            _prevProgress[item.id] = progressPercentage;
        }

        actionsDiv.appendChild(actionBtn);
        mainContent.appendChild(actionsDiv);

        card.appendChild(mainContent);

        container.appendChild(card);

        if (isLastPurchased) {
            setTimeout(() => {
                _celebrationEffect(card);
            }, 100);
        }
    }

    // --- PUBLIC API ---
    App.ui.shop = {
        /**
         * @description Renderiza todos los ítems de la tienda con un orden específico.
         */
        render: function() {
            const container = document.getElementById("shopList");
            if (!container) {
                console.warn("Contenedor #shopList no encontrado, no se pueden renderizar los ítems de la tienda.");
                return;
            }
            
            _animationTimeouts.forEach(timeout => clearTimeout(timeout));
            _animationTimeouts.clear();
            
            const state = App.state.getState();
            const userPoints = state.points || 0;
            const shopItems = App.state.getShopItems();
            
            console.log('Shop render called - items count:', shopItems ? shopItems.length : 0);
            console.log('Shop items:', shopItems);
            console.log('Container innerHTML before clear:', container.innerHTML.length);
            
            // Force complete container clear
            container.innerHTML = "";
            console.log('Container innerHTML after clear:', container.innerHTML.length);

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

            shopItems.forEach(item => {
                item.recentlyPurchased = item.id === lastBoughtItemId;
                if (item.justBought) {
                    delete item.justBought;
                }
            });

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

            notYetAffordableItems.sort((a, b) => (a.cost - userPoints) - (b.cost - userPoints));
            
            purchasedItems.sort((a, b) => {
                const dateA = new Date(a.purchasedTodayDate || 0);
                const dateB = new Date(b.purchasedTodayDate || 0);
                return dateB.getTime() - dateA.getTime();
            });

            const combined = [...purchasableItems, ...notYetAffordableItems, ...purchasedItems];

            combined.forEach((item, index) => {
                const timeout = setTimeout(() => {
                    _renderShopCard(item, userPoints, container);
                }, index * 50);
                
                _animationTimeouts.set(item.id, timeout);
            });
        },

        openEditShopItemModal: function(itemId) {
            console.log('Opening edit modal for item:', itemId); // Debug log
            const modal = document.getElementById('editShopItemModal');
            const item = App.state.getShopItems().find(i => i.id === itemId);
            
            if (!modal) {
                console.error('Edit shop item modal not found in DOM');
                return;
            }
            
            if (!item) {
                console.error('Shop item not found:', itemId);
                if (App.ui.general && App.ui.general.showCustomAlert) {
                    App.ui.general.showCustomAlert('No se encontró el producto.');
                } else {
                    alert('No se encontró el producto.');
                }
                return;
            }

            // Populate modal fields
            const idField = document.getElementById('editShopItemId');
            const nameField = document.getElementById('editShopItemName');
            const costField = document.getElementById('editShopItemCost');
            
            if (idField) idField.value = item.id;
            if (nameField) nameField.value = item.name;
            if (costField) costField.value = item.cost;

            // Show modal
            modal.style.display = 'flex';
            modal.classList.add('visible');
            modal.setAttribute('aria-hidden', 'false');
            
            // Focus on name field for better UX
            if (nameField) {
                setTimeout(() => nameField.focus(), 100);
            }
            
            console.log('Modal should now be visible'); // Debug log
        },

        closeEditShopItemModal: function() {
            const modal = document.getElementById('editShopItemModal');
            modal.style.display = 'none';
            modal.classList.remove('visible');
            modal.setAttribute('aria-hidden', 'true');
        },

        initListeners: function() {
            App.events.on('shopItemsUpdated', () => {
                console.log('shopItemsUpdated event received, re-rendering shop');
                this.render();
            });
            App.events.on('stateRefreshed', () => {
                console.log('stateRefreshed event received, re-rendering shop');
                this.render();
            });

            const showAddShopItemBtn = document.getElementById('showAddShopItemBtn');
            const addShopItemForm = document.getElementById('addShopItemForm');
            const shopItemName = document.getElementById('shopItemName');
            const shopItemCost = document.getElementById('shopItemCost');

            if (showAddShopItemBtn) showAddShopItemBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                App.ui.general.toggleFormVisibility('addShopItemFormContainer', shopItemName);
            });

            if (addShopItemForm) addShopItemForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = shopItemName.value.trim();
                const cost = parseInt(shopItemCost.value.trim(), 10);
                if (name && !isNaN(cost) && cost > 0) {
                    App.state.addShopItem(name, cost);
                    addShopItemForm.reset();
                } else {
                    App.ui.events.showCustomAlert("Por favor, introduce un nombre y un costo válido.");
                }
            });

            const editModal = document.getElementById('editShopItemModal');
            const editForm = document.getElementById('editShopItemForm');
            const closeButton = document.getElementById('closeEditShopItemModal');
            const deleteButton = document.getElementById('deleteShopItemBtn');

            if(closeButton) closeButton.addEventListener('click', App.ui.shop.closeEditShopItemModal);
            if(editModal) editModal.addEventListener('click', (e) => {
                if (e.target === editModal) {
                    App.ui.shop.closeEditShopItemModal();
                }
            });

                        const saveButton = document.getElementById('saveShopItemChanges');

            if (saveButton) saveButton.addEventListener('click', (e) => {
                e.preventDefault();
                const itemId = document.getElementById('editShopItemId').value;
                const updatedData = {
                    name: document.getElementById('editShopItemName').value.trim(),
                    cost: parseInt(document.getElementById('editShopItemCost').value, 10)
                };

                if (updatedData.name && !isNaN(updatedData.cost) && updatedData.cost > 0) {
                    App.state.updateShopItem(itemId, updatedData);
                    App.ui.shop.closeEditShopItemModal();
                } else {
                    App.ui.events.showCustomAlert("Por favor, introduce un nombre y un costo válido.");
                }
            });

            if (deleteButton) deleteButton.addEventListener('click', () => {
                const itemId = document.getElementById('editShopItemId').value;
                const item = App.state.getShopItems().find(i => i.id === itemId);
                const itemName = item ? item.name : 'este producto';
                
                // Close edit modal first
                App.ui.shop.closeEditShopItemModal();
                
                // Then show confirmation with a small delay to ensure modal is closed
                setTimeout(() => {
                    if (App.ui.general && App.ui.general.showCustomConfirm) {
                        App.ui.general.showCustomConfirm(
                            `¿Estás seguro de que quieres eliminar "${itemName}" de la tienda?`, 
                            (confirmed) => {
                                if (confirmed) {
                                    console.log('Deleting shop item:', itemId); // Debug log
                                    App.state.deleteShopItem(itemId, true); // Skip confirmation since we already confirmed
                                    console.log('Shop item deleted'); // Debug log
                                }
                            }
                        );
                    } else {
                        if (confirm(`¿Estás seguro de que quieres eliminar "${itemName}" de la tienda?`)) {
                            console.log('Deleting shop item:', itemId); // Debug log
                            App.state.deleteShopItem(itemId, true);
                            console.log('Shop item deleted'); // Debug log
                        }
                    }
                }, 100);
            });
        }
    };

})(window.App = window.App || {});
