(function(App) {
    'use strict';
    
    // Asegura que App.ui.habits existe
    if (!App.ui) App.ui = {};
    if (!App.ui.habits) App.ui.habits = {};

    // 🏆 SISTEMA DE SUBASTA ÉPICA 🏆
    // Pujadores virtuales con personalidades únicas
    const VIRTUAL_BIDDERS = [
        { name: 'DiamondHunter', personality: 'aggressive', emoji: '💎' },
        { name: 'RocketTrader', personality: 'strategic', emoji: '🚀' },
        { name: 'LightningBid', personality: 'impulsive', emoji: '⚡' },
        { name: 'PrecisionBuyer', personality: 'calculated', emoji: '🎯' },
        { name: 'FireCollector', personality: 'passionate', emoji: '🔥' }
    ];

    const MOTIVATIONAL_MESSAGES = [
        '¡Excelente decisión! 🎉',
        '¡Tu fuerza de voluntad es increíble! 💪',
        '¡Cada venta te hace más fuerte! ⚡',
        '¡Estás rompiendo el ciclo! 🔥',
        '¡Tu futuro yo te lo agradecerá! 🌟'
    ];

    // Mensajes específicos por personalidad de pujador
    const BIDDER_MESSAGES = {
        aggressive: [
            'puja agresivamente',
            'no se rendirá fácilmente',
            'quiere ganar a toda costa',
            'aumenta la presión',
            'va con todo'
        ],
        strategic: [
            'hace una puja calculada',
            'evalúa cuidadosamente',
            'tiene un plan en mente',
            'juega sus cartas bien',
            'espera el momento perfecto'
        ],
        impulsive: [
            'puja sin pensarlo dos veces',
            'actúa por impulso',
            'no puede resistirse',
            'sigue su instinto',
            'se deja llevar por la emoción'
        ],
        calculated: [
            'hace números mentalmente',
            'analiza cada movimiento',
            'busca el mejor valor',
            'estudia a la competencia',
            'toma decisiones precisas'
        ],
        passionate: [
            'muestra gran entusiasmo',
            'realmente quiere este ticket',
            'puja con el corazón',
            'no puede ocultar su interés',
            'está completamente enganchado'
        ]
    };

    /**
     * 🎯 Función principal de subasta épica
     * Diseñada para ser psicológicamente irresistible
     */
    function showAuction(challenge) {
        console.log('🏆 SUBASTA ÉPICA INICIADA:', challenge.name);
        const modal = document.getElementById('auctionModal');
        const startBtn = document.getElementById('startAuctionBtn');
        const takeBtn = document.getElementById('takePriceBtn');
        const currentPriceDisplay = document.getElementById('auctionCurrentPrice');
        const historyContainer = document.getElementById('auctionHistory');
        const closeBtn = modal.querySelector('.modal-close-btn');
        const progressContainer = document.getElementById('auctionProgress');
        
        // Limpia eventos anteriores
        closeBtn.onclick = null;
        startBtn.onclick = null;
        takeBtn.onclick = null;
        
        // 💰 Cálculo de precios con bonificaciones épicas
        const pointsForCurrentLevel = Math.floor(challenge.firstLevelPoints * Math.pow(1 + challenge.incrementPercent / 100, challenge.currentLevel - 1));
        const currentStreakMs = new Date().getTime() - new Date(challenge.lastConsumptionTime).getTime();
        const isRecordBreaking = currentStreakMs > (challenge.bestStreak || 0);
        const basePrice = isRecordBreaking ? pointsForCurrentLevel * 2 : pointsForCurrentLevel;
        
        let currentPrice = basePrice;
        let auctionInterval;
        let isAuctionInProgress = false;
        let activeBidders = [];

        // 🎭 Función para cerrar modal con limpieza épica
        const closeModal = () => {
            clearInterval(auctionInterval);
            modal.classList.remove('visible');
            closeBtn.style.display = 'block'; 
            closeBtn.disabled = false;
        };

        // 🎨 Actualización de UI con efectos visuales épicos
        let lastDisplayedPrice = basePrice;
        
        const updateUI = (animate = false) => {
            const roundedPrice = Math.round(currentPrice);
            
            if (animate && roundedPrice !== lastDisplayedPrice) {
                animatePrice(lastDisplayedPrice, roundedPrice, 800);
                lastDisplayedPrice = roundedPrice;
            } else {
                currentPriceDisplay.textContent = `⚡${roundedPrice} pts`;
                lastDisplayedPrice = roundedPrice;
            }
        };

        // 🎯 Genera pujadores virtuales activos
        const generateActiveBidders = () => {
            const numBidders = Math.floor(Math.random() * 3) + 2; // 2-4 pujadores
            activeBidders = [];
            
            for (let i = 0; i < numBidders; i++) {
                const bidder = VIRTUAL_BIDDERS[Math.floor(Math.random() * VIRTUAL_BIDDERS.length)];
                if (!activeBidders.find(b => b.name === bidder.name)) {
                    activeBidders.push({
                        ...bidder,
                        currentBid: Math.round(basePrice * (0.8 + Math.random() * 0.4)),
                        isActive: false
                    });
                }
            }
        };

        // 📜 Sistema de historial animado con control de timing
        const messageHistory = [];
        const MAX_MESSAGES = 7;
        let lastMessageTime = 0;
        const MIN_MESSAGE_DELAY = 3500;
        
        // MODIFICACIÓN: Se añade el parámetro 'immediate' para forzar la visualización instantánea
        const addHistoryMessage = (message, type = 'system', forceDelay = false, immediate = false) => {
            const now = Date.now();
            const timeSinceLastMessage = now - lastMessageTime;
            
            const showMessage = () => {
                const messageElement = document.createElement('div');
                messageElement.className = `auction-message ${type} new`;
                messageElement.textContent = message;
                historyContainer.insertBefore(messageElement, historyContainer.firstChild);
                messageHistory.unshift({ element: messageElement, message, type });
                
                if (messageHistory.length > MAX_MESSAGES) {
                    const oldMessage = messageHistory.pop();
                    oldMessage.element.classList.add('fade-out');
                    setTimeout(() => {
                        if (oldMessage.element.parentNode) {
                            oldMessage.element.parentNode.removeChild(oldMessage.element);
                        }
                    }, 500);
                }
                
                lastMessageTime = Date.now();
                console.log(`📜 Mensaje añadido: [${type}] ${message}`);
            };
            
            // MODIFICACIÓN: Si es 'immediate', se salta la comprobación de tiempo.
            if (!immediate && (timeSinceLastMessage < MIN_MESSAGE_DELAY || forceDelay)) {
                const delay = forceDelay ? 2500 : (MIN_MESSAGE_DELAY - timeSinceLastMessage);
                setTimeout(showMessage, delay);
            } else {
                showMessage();
            }
        };
        
        // 🔢 Animación numérica del precio
        const animatePrice = (fromPrice, toPrice, duration = 1000) => {
            const startTime = Date.now();
            const priceDiff = toPrice - fromPrice;
            
            const updatePrice = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                const currentPriceVal = Math.round(fromPrice + (priceDiff * easeProgress));
                currentPriceDisplay.textContent = `⚡${currentPriceVal} pts`;
                
                if (progress < 1) {
                    requestAnimationFrame(updatePrice);
                }
            };
            requestAnimationFrame(updatePrice);
        };

        let bidCount = 0;
        let auctionEnergy = 100;
        let lastBidTime = Date.now();
        let isInDecisionPause = false;
        let uncertaintyMoments = 0;
        let lastBidder = null;

        // 🚀 Inicia la subasta épica REALISTA
        const startAuction = () => {
            if (isAuctionInProgress) return;
            isAuctionInProgress = true;
           // Ocultar y desactivar el botón de cerrar para evitar que cierre sin obtener los puntos
           closeBtn.style.display = 'none';
           closeBtn.disabled = true;           
            bidCount = 0;
            auctionEnergy = 40 + Math.random() * 120;
            lastBidTime = Date.now();
            
            startBtn.style.display = 'none';
            takeBtn.style.display = 'none';
            progressContainer.style.display = 'none';
            
            generateActiveBidders();
            
            historyContainer.innerHTML = '';
            messageHistory.length = 0;
            lastMessageTime = 0;
            addHistoryMessage('🔥 ¡SUBASTA EN VIVO! 🔥', 'system');
            
            const processAuctionTick = () => {
                // ARREGLADO: Verificar que la subasta siga activa antes de procesar
                if (!isAuctionInProgress) {
                    clearInterval(auctionInterval);
                    return;
                }
                
                if (!isInDecisionPause) {
                    let uncertaintyProbability = 0.35;
                    if (bidCount >= 5) uncertaintyProbability = 0.5;
                    if (bidCount >= 8) uncertaintyProbability = 0.7;
                    if (auctionEnergy < 40) uncertaintyProbability += 0.2;
                    const shouldForceUncertainty = bidCount >= 4 && uncertaintyMoments === 0;
                    
                    if ((bidCount >= 2 && Math.random() < uncertaintyProbability) || shouldForceUncertainty) {
                        startUncertaintyMoment();
                    } else {
                        processBid();
                    }
                }
            };
            
            const startUncertaintyMoment = () => {
                isInDecisionPause = true;
                uncertaintyMoments++;
                const uncertaintyMessages = ['🤔 Los pujadores están evaluando...', '⏳ Momento de reflexión...', '🧐 Analizando la situación...', '💭 ¿Alguien más pujará?'];
                addHistoryMessage(uncertaintyMessages[Math.floor(Math.random() * uncertaintyMessages.length)], 'uncertainty');
                setTimeout(resolveUncertainty, 4000 + Math.random() * 6000);
            };
            
            const resolveUncertainty = () => {
                isInDecisionPause = false;
                let continueProbability = 0.75;
                if (auctionEnergy < 30) continueProbability -= 0.2;
                if (bidCount >= 6) continueProbability -= 0.1;
                if (currentPrice > basePrice * 3) continueProbability -= 0.1;
                continueProbability = Math.max(0.3, continueProbability);
                
                if (Math.random() < continueProbability) {
                    const encouragingMessages = ['🔥 ¡Alguien no se rinde!', '⚡ ¡La competencia continúa!', '💪 ¡Hay más interés!'];
                    addHistoryMessage(encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)], 'system');
                    setTimeout(processBid, 4000);
                } else {
                    // ARREGLADO: Marcar que la subasta debe terminar después de esta resolución
                    isAuctionInProgress = false;
                    const finalMessages = ['⏰ ¡Tiempo agotado!', '🏁 ¡No hay más pujas!', '✋ ¡Nadie más se atreve!'];
                    addHistoryMessage(finalMessages[Math.floor(Math.random() * finalMessages.length)], 'system');
                    setTimeout(finishAuction, 3000);
                }
            };
            
            const processBid = () => {
                bidCount++;
                lastBidTime = Date.now();
                const activeBidder = activeBidders[Math.floor(Math.random() * activeBidders.length)];
                
                const priceRatio = currentPrice / basePrice;
                auctionEnergy -= (2 + Math.random() * 3);
                if (priceRatio > 3) auctionEnergy -= 5;
                
                let increase = 0;
                const energyFactor = Math.max(0.3, auctionEnergy / 100);
                
// Nuevo límite más variable (2x – 20x basePrice)
if (currentPrice < basePrice * (2 + Math.random() * 20)) {
    switch (activeBidder.personality) {
        case 'aggressive':
            if (Math.random() < 0.1) {
                // 10% de las veces mete una puja brutal (50–100% extra)
                increase = currentPrice * (0.5 + Math.random() * 1) * energyFactor;
            } else {
                // Normal: 5–10%
                increase = Math.max(2, currentPrice * (0.1 + Math.random() * 0.2) * energyFactor);
            }
            break;

        case 'strategic':
            // 3–6%, sin sorpresas fuertes
            increase = Math.max(1, currentPrice * (0.03 + Math.random() * 0.03) * energyFactor);
            break;

        case 'impulsive':
            if (Math.random() < 0.15) {
                // 15% de las veces mete un salto enorme (20–60%)
                increase = currentPrice * (0.3 + Math.random() * 0.6) * energyFactor;
            } else {
                // Normal: 6–12%
                increase = Math.max(3, currentPrice * (0.05 + Math.random() * 0.3) * energyFactor);
            }
            break;

        case 'calculated':
            // Muy medido: 2–4%
            increase = Math.max(1, currentPrice * (0.02 + Math.random() * 0.02) * energyFactor);
            break;

        case 'passionate':
            // Normal: 4–9%, pero a veces un arrebato grande (10% de las veces 15–40%)
            if (Math.random() < 0.1) {
                increase = currentPrice * (0.15 + Math.random() * 0.25) * energyFactor;
            } else {
                increase = Math.max(2, currentPrice * (0.04 + Math.random() * 0.05) * energyFactor);
            }
            break;
    }
}

                
                if (increase > 0) {
                    currentPrice += increase;
                    lastBidder = activeBidder;
                    
                    const personalityMessages = BIDDER_MESSAGES[activeBidder.personality];
                    const bidderAction = personalityMessages[Math.floor(Math.random() * personalityMessages.length)];
                    const increaseAmount = Math.round(increase);
                    const bidMessage = `${activeBidder.emoji} ${activeBidder.name} ${bidderAction} y puja ${increaseAmount} pts más`;
                    
                    // =============================================================
                    // INICIO DE LA MODIFICACIÓN: Zona de sincronización de eventos
                    // Todos estos eventos ahora ocurren juntos.
                    // =============================================================
                    
                    // 1. VIBRACIÓN: El móvil vibra en el instante de la puja.
                    if (navigator.vibrate) {
                        navigator.vibrate(100); // Vibración corta de 100ms
                    }
                    
                    // 2. MENSAJE: El mensaje de la puja aparece inmediatamente.
                    // El 'true' final fuerza que el mensaje ignore la cola de delays.
                    addHistoryMessage(bidMessage, 'bid', false, true);
                    
                    // 3. PRECIO: La animación del precio comienza al mismo tiempo.
                    updateUI(true); 
                    
                    console.log(`💰 Puja ${bidCount}: ${activeBidder.name} - +${increaseAmount} pts (Total: ${Math.round(currentPrice)}) [Energía: ${Math.round(auctionEnergy)}%]`);
                    
                    // =============================================================
                    // FIN DE LA MODIFICACIÓN
                    // =============================================================
                    
                } else {
                    auctionEnergy -= 10;
                    addHistoryMessage(`${activeBidder.emoji} ${activeBidder.name} duda y no puja`, 'uncertainty');
                    console.log('📉 Sin puja, energía reducida');
                }
            };
            
            auctionInterval = setInterval(processAuctionTick, 3000 + Math.random() * 4000);
        };
        
        // 🏆 Finaliza la subasta con celebración
        const finishAuction = () => {
            clearInterval(auctionInterval);
            isAuctionInProgress = false;
            
            const winner = lastBidder || activeBidders[0] || { name: '🏆 Coleccionista VIP', emoji: '🏆' };
            const victoryMessage = `🎉 ¡${winner.name} GANÓ con ${Math.round(currentPrice)} pts! 🎉`;
            addHistoryMessage(victoryMessage, 'victory', true);
            
            console.log(`🏆 Subasta finalizada. Ganador: ${winner.name} con ${Math.round(currentPrice)} pts`);
            
            setTimeout(() => {
                takeBtn.style.display = 'block';
                takeBtn.innerHTML = `
                    <span class="btn-icon">💰</span>
                    <span class="btn-text">¡ACEPTAR ${Math.round(currentPrice)} PTS!</span>
                `;
            }, 3000);
            
            setTimeout(() => {
                const motivationalMsg = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
                addHistoryMessage(motivationalMsg, 'system', true);
            }, 5000);
        };

        // 💎 Acepta el precio con celebración épica
        const takePrice = () => {
            const finalPrice = Math.round(currentPrice);
            const bonusMessage = isRecordBreaking ? ' ¡BONUS POR RÉCORD PERSONAL! 🏆' : '';
            
            App.state.sellConsumption(challenge.id, finalPrice);
            closeModal();
            
            const victoryMessage = `🎉 ¡SUBASTA GANADA! Vendiste tu ticket por ${finalPrice} puntos!${bonusMessage}`;
            App.events.emit('showDiscreetMessage', victoryMessage);
            
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100, 50, 200]);
            }
        };

        // 🎮 Asigna manejadores de eventos
        closeBtn.onclick = closeModal;
        startBtn.onclick = startAuction;
        takeBtn.onclick = takePrice;
    
        // 🎯 Resetea y prepara el modal
        isAuctionInProgress = false;
        startBtn.style.display = 'block';
        takeBtn.style.display = 'none';
        progressContainer.style.display = 'none';

        updateUI();
        modal.classList.add('visible');

        historyContainer.innerHTML = '';
        messageHistory.length = 0;
        lastMessageTime = 0;
        
        if (isRecordBreaking) {
            addHistoryMessage('🔥 ¡RACHA RÉCORD = PRECIO x2!', 'victory');
            setTimeout(() => {
                addHistoryMessage('💡 ¡Vender es más rentable que consumir! ¡Inicia la subasta!', 'system');
            }, 3000);
        } else {
            addHistoryMessage('💡 ¡Vender es más rentable que consumir! ¡Inicia la subasta!', 'system');
        }
    }

    // Exporta la función épica
    const registerEpicAuction = () => {
        if (!window.App) window.App = {};
        if (!window.App.ui) window.App.ui = {};
        if (!window.App.ui.habits) window.App.ui.habits = {};
        window.App.ui.habits.showEpicAuction = showAuction;
        console.log('🏆 SUBASTA ÉPICA REGISTRADA CORRECTAMENTE');
    };
    
    registerEpicAuction();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', registerEpicAuction);
    }

})(window.App = window.App || {});