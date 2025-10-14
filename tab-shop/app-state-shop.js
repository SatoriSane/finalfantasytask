// app-state-shop.js
// Maneja el estado y lógica de la tienda
(function(App) {
    if (!App.state) {
        console.error("App.state is not initialized. Make sure app-state.js is loaded first.");
        return;
    }

    const _get = () => App.state.getState();
    const _save = () => App.state.saveState();

    // Extender App.state con métodos específicos de la tienda
    Object.assign(App.state, {
        addShopItem: function(name, cost) {
            _get().shopItems.push({ id: App.utils.genId("shop"), name, cost, purchasedTodayDate: null });
            _save();
            App.events.emit('shopItemsUpdated');
            App.events.emit('shownotifyMessage', `¡Producto "${name}" añadido a la tienda!`);
        },

        buyShopItem: function(itemId) {
            const state = _get();
            const item = state.shopItems.find(i => i.id === itemId);
            if (!item) {
                console.error('Shop item not found:', itemId);
                return;
            }

            const todayStr = new Date().toISOString().split('T')[0];
            if (item.purchasedTodayDate && item.purchasedTodayDate.startsWith(todayStr)) {
                App.events.emit('shownotifyMessage', 'Ya has comprado esto hoy.');
                return;
            }

            App.ui.general.showCustomConfirm(`¿Estás seguro de que quieres comprar "${item.name}" por ${item.cost} puntos?`, (confirmed) => {
                if (confirmed) {
                    if (state.points >= item.cost) {
                        App.state.addPoints(-item.cost);
                        App.state.addHistoryAction(`Comprado: ${item.name}`, -item.cost, 'gasto');
                        item.purchasedTodayDate = new Date().toISOString();
                        _save();
                        App.events.emit('shopItemsUpdated');
                        App.events.emit('showMotivationMessage', `¡"${item.name}" logrado! 🎉`);
                    } else {
                        App.events.emit('shownotifyMessage', 'No tienes suficientes puntos.');
                    }
                }
            });
        },
        
        updateShopItem: function(itemId, updatedData) {
            const state = _get();
            const itemIndex = state.shopItems.findIndex(item => item.id === itemId);
            if (itemIndex !== -1) {
                state.shopItems[itemIndex] = { ...state.shopItems[itemIndex], ...updatedData };
                _save();
                App.events.emit('shopItemsUpdated');
            }
        },

        deleteShopItem: function(itemId, skipConfirm = false) {
            const performDelete = () => {
                const state = _get();
                console.log('Before deletion - shop items count:', state.shopItems.length);
                console.log('Deleting item with ID:', itemId);
                console.log('Items before filter:', state.shopItems.map(item => item.id));
                
                const originalLength = state.shopItems.length;
                state.shopItems = state.shopItems.filter(item => item.id !== itemId);
                
                console.log('After deletion - shop items count:', state.shopItems.length);
                console.log('Items after filter:', state.shopItems.map(item => item.id));
                console.log('Items actually removed:', originalLength - state.shopItems.length);
                
                _save();
                console.log('State saved after deletion');
                App.events.emit('shopItemsUpdated');
                console.log('shopItemsUpdated event emitted');
            };

            if (skipConfirm) {
                performDelete();
            } else {
                App.ui.general.showCustomConfirm('¿Seguro que quieres eliminar este producto de la tienda?', (confirmed) => {
                    if (confirmed) {
                        performDelete();
                    }
                });
            }
        },

        getShopItems: function() {
            return _get().shopItems;
        }
    });

})(window.App = window.App || {});
