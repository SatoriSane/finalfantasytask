(function(App) {
    'use strict';

    /**
     * Muestra y gestiona el modal de subasta para un ticket.
     * @param {object} challenge El objeto del reto de abstinencia.
     */
    function showAuction(challenge) {
        const modal = document.getElementById('auctionModal');
        const startBtn = document.getElementById('startAuctionBtn');
        const takeBtn = document.getElementById('takePriceBtn');
        const currentPriceDisplay = document.getElementById('auctionCurrentPrice');
        const statusDisplay = document.getElementById('auctionStatus');
        const closeBtn = modal.querySelector('.modal-close-btn');

        // Limpia cualquier manejador de eventos anterior para evitar conflictos.
        closeBtn.onclick = null;
        startBtn.onclick = null;
        takeBtn.onclick = null;
        
        // Lógica de cálculo de precios inicial.
        const pointsForCurrentLevel = Math.floor(challenge.firstLevelPoints * Math.pow(1 + challenge.incrementPercent / 100, challenge.currentLevel - 1));
        const sellPoints = (new Date().getTime() - new Date(challenge.lastConsumptionTime).getTime() > (challenge.bestStreak || 0)) ? pointsForCurrentLevel * 2 : pointsForCurrentLevel;
        let currentPrice = sellPoints;
        let auctionInterval;
        let isAuctionInProgress = false;

        // Función para cerrar el modal y limpiar el temporizador.
        const closeModal = () => {
            clearInterval(auctionInterval);
            modal.classList.remove('visible');
        };
    
        const updateUI = () => {
            currentPriceDisplay.textContent = `⚡${Math.round(currentPrice)} pts`;
        };
    
        const startAuction = () => {
            if (isAuctionInProgress) return;
            isAuctionInProgress = true;
            
            startBtn.style.display = 'none';
            takeBtn.style.display = 'none';
            statusDisplay.textContent = 'Pujando...';
            
            auctionInterval = setInterval(() => {
                const random = Math.random();
                let increase = 0;
    
                if (currentPrice < sellPoints * 10) {
                     increase = Math.max(1, currentPrice * 0.10);
                }
    
                currentPrice += increase;
                updateUI();
                
                const finishChance = Math.min(0.05 + (currentPrice / (sellPoints * 10)) * 0.2, 1);
                if (random < finishChance || currentPrice >= sellPoints * 10) {
                    clearInterval(auctionInterval);
                    isAuctionInProgress = false;
                    statusDisplay.textContent = '¡Subasta terminada!';
                    takeBtn.style.display = 'block';
                    takeBtn.textContent = `Aceptar ${Math.round(currentPrice)} pts`;
                }
    
            }, 200);
        };
    
        const takePrice = () => {
            App.state.sellConsumption(challenge.id, Math.round(currentPrice));
            closeModal();
            App.events.emit('showDiscreetMessage', `¡Ticket subastado por ${Math.round(currentPrice)} puntos!`);
        };
    
        // Asigna los nuevos manejadores de eventos.
        closeBtn.onclick = closeModal;
        startBtn.onclick = startAuction;
        takeBtn.onclick = takePrice;
    
        // Resetea el estado del modal antes de mostrarlo.
        isAuctionInProgress = false;
        startBtn.style.display = 'block';
        takeBtn.style.display = 'none';
        statusDisplay.textContent = '';
        
        updateUI();
        modal.classList.add('visible');
    }

    // Exporta la función para que sea accesible globalmente a través de App.ui.habits
    App.ui.habits.showAuctionModal = showAuction;

})(window.App = window.App || {});
