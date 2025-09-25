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
        const progressFill = document.getElementById('progressFill');
        const bidCounter = document.getElementById('bidCounter');
        const maxBidsDisplay = document.getElementById('maxBidsDisplay');

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
        let lastPriceIncrease = 0;

        // 🎭 Función para cerrar modal con limpieza épica
        const closeModal = () => {
            clearInterval(auctionInterval);
            modal.classList.remove('visible');
        };

        // 🎨 Actualización de UI con efectos visuales épicos
        let lastDisplayedPrice = basePrice;
        
        const updateUI = (animate = false) => {
            const roundedPrice = Math.round(currentPrice);
            
            if (animate && roundedPrice !== lastDisplayedPrice) {
                // Usar animación numérica del precio
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
        const MAX_MESSAGES = 5;
        let lastMessageTime = 0;
        const MIN_MESSAGE_DELAY = 3500; // Mínimo 2 segundos entre mensajes
        
        const addHistoryMessage = (message, type = 'system', forceDelay = false) => {
            const now = Date.now();
            const timeSinceLastMessage = now - lastMessageTime;
            
            const showMessage = () => {
                // Crear elemento del mensaje
                const messageElement = document.createElement('div');
                messageElement.className = `auction-message ${type} new`;
                messageElement.textContent = message;
                
                // Añadir al principio del historial
                historyContainer.insertBefore(messageElement, historyContainer.firstChild);
                messageHistory.unshift({ element: messageElement, message, type });
                
                // Eliminar mensajes antiguos si excede el límite
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
            
            // Si no ha pasado suficiente tiempo o se fuerza delay, esperar
            if (timeSinceLastMessage < MIN_MESSAGE_DELAY || forceDelay) {
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
                
                // Usar easing para suavizar la animación
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                const currentPrice = Math.round(fromPrice + (priceDiff * easeProgress));
                
                currentPriceDisplay.textContent = `⚡${currentPrice} pts`;
                
                if (progress < 1) {
                    requestAnimationFrame(updatePrice);
                } else {
                    // Añadir efecto final cuando termina la animación
                    currentPriceDisplay.classList.add('price-change');
                    setTimeout(() => {
                        currentPriceDisplay.classList.remove('price-change');
                    }, 800);
                }
            };
            
            requestAnimationFrame(updatePrice);
        };

        let bidCount = 0;
        let auctionEnergy = 100; // Energía de la subasta (0-100)
        let lastBidTime = Date.now();
        let isInDecisionPause = false;
        let uncertaintyMoments = 0; // Contador de momentos de incertidumbre
        let lastBidder = null; // Último pujador para determinar ganador

        // 🚀 Inicia la subasta épica REALISTA
        const startAuction = () => {
            if (isAuctionInProgress) return;
            console.log('🚀 Iniciando subasta realista con energía variable');
            isAuctionInProgress = true;
            bidCount = 0;
            auctionEnergy = 80 + Math.random() * 20; // Energía inicial aleatoria (80-100)
            lastBidTime = Date.now();
            
            // Oculta botón de inicio (NO mostrar barra de progreso)
            startBtn.style.display = 'none';
            takeBtn.style.display = 'none';
            progressContainer.style.display = 'none'; // Eliminamos la barra de progreso
            
            // Genera pujadores y comienza la acción
            generateActiveBidders();
            console.log('👥 Pujadores generados:', activeBidders.length);
            console.log('⚡ Energía inicial de subasta:', Math.round(auctionEnergy));
            
            // Limpiar historial y añadir mensaje inicial
            historyContainer.innerHTML = '';
            messageHistory.length = 0;
            lastMessageTime = 0; // Reset del timing de mensajes
            addHistoryMessage('🔥 ¡SUBASTA EN VIVO! 🔥', 'system');
            
            // 🎭 LÓGICA DE SUBASTA REALISTA CON INCERTIDUMBRE
            const processAuctionTick = () => {
                // Si no estamos en pausa de indecisión, decidir qué hacer
                if (!isInDecisionPause) {
                    // Aumentar probabilidad de incertidumbre conforme avanza la subasta
                    let uncertaintyProbability = 0.35;
                    if (bidCount >= 5) uncertaintyProbability = 0.5;
                    if (bidCount >= 8) uncertaintyProbability = 0.7;
                    if (auctionEnergy < 40) uncertaintyProbability += 0.2;
                    
                    // Siempre debe haber al menos un momento de incertidumbre antes del final
                    const shouldForceUncertainty = bidCount >= 4 && uncertaintyMoments === 0;
                    
                    if ((bidCount >= 2 && Math.random() < uncertaintyProbability) || shouldForceUncertainty) {
                        startUncertaintyMoment();
                    } else {
                        processBid();
                    }
                }
            };
            
            // 🤔 MOMENTO DE INCERTIDUMBRE - Punto crítico de decisión
            const startUncertaintyMoment = () => {
                isInDecisionPause = true;
                uncertaintyMoments++;
                
                const uncertaintyMessages = [
                    '🤔 Los pujadores están evaluando...',
                    '⏳ Momento de reflexión...',
                    '🧐 Analizando la situación...',
                    '💭 ¿Alguien más pujará?',
                    '⚖️ Sopesando opciones...',
                    '🎯 ¿Vale la pena seguir?',
                    '💰 Calculando el siguiente movimiento...'
                ];
                
                const uncertaintyMsg = uncertaintyMessages[Math.floor(Math.random() * uncertaintyMessages.length)];
                addHistoryMessage(uncertaintyMsg, 'uncertainty');
                console.log(`🤔 Momento de incertidumbre #${uncertaintyMoments}`);
                
                // Pausa de incertidumbre de 3-10 segundos
                const uncertaintyDuration = 4000 + Math.random() * 6000;
                
                setTimeout(() => {
                    resolveUncertainty();
                }, uncertaintyDuration);
            };
            
            // 🎲 RESOLVER LA INCERTIDUMBRE - Momento de verdad
            const resolveUncertainty = () => {
                isInDecisionPause = false;
                
                // Calcular probabilidad de que alguien puje basada en varios factores
                let continueProbability = 0.75; // Base 60%
                
                // Factores que reducen la probabilidad de continuar
                if (auctionEnergy < 30) continueProbability -= 0.2;
                if (auctionEnergy < 50) continueProbability -= 0.1;
                if (bidCount >= 6) continueProbability -= 0.1;
                if (bidCount >= 12) continueProbability -= 0.2;
                if (currentPrice > basePrice * 3) continueProbability -= 0.1;
                if (currentPrice > basePrice * 5) continueProbability -= 0.2;
                if (uncertaintyMoments >= 3) continueProbability -= 0.1;
                
                // Mínimo 10% de probabilidad de continuar
                continueProbability = Math.max(0.3, continueProbability);
                
                console.log(`🎲 Probabilidad de continuar: ${Math.round(continueProbability * 100)}%`);
                
                if (Math.random() < continueProbability) {
                    // ¡Alguien decide pujar!
                    console.log('✅ ¡La incertidumbre fue superada! Alguien puja');
                    const encouragingMessages = [
                        '🔥 ¡Alguien no se rinde!',
                        '⚡ ¡La competencia continúa!',
                        '💪 ¡Hay más interés!',
                        '🎯 ¡La batalla sigue!'
                    ];
                    const encouragingMsg = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
                    addHistoryMessage(encouragingMsg, 'system');
                    
                    // Procesar la puja después de un breve momento
                    setTimeout(() => {
                        processBid();
                    }, 4000);
                } else {
                    // ¡Nadie más puja! La subasta termina
                    console.log('🏁 La incertidumbre no fue superada. Subasta terminada');
                    const finalMessages = [
                        '⏰ ¡Tiempo agotado!',
                        '🏁 ¡No hay más pujas!',
                        '✋ ¡Nadie más se atreve!',
                        '🎯 ¡Subasta finalizada!'
                    ];
                    const finalMsg = finalMessages[Math.floor(Math.random() * finalMessages.length)];
                    addHistoryMessage(finalMsg, 'system');
                    
                    // Esperar más tiempo antes de mostrar la victoria para que no sea inmediato
                    setTimeout(() => {
                        finishAuction();
                    }, 3000); // Reducido para que el mensaje de victoria tenga su propio delay
                }
            };
            
            // 💰 PROCESAR UNA PUJA
            const processBid = () => {
                bidCount++;
                lastBidTime = Date.now();
                
                // Selecciona un pujador activo
                const activeBidder = activeBidders[Math.floor(Math.random() * activeBidders.length)];
                
                // 📉 La energía de la subasta disminuye con el tiempo y precio
                const priceRatio = currentPrice / basePrice;
                auctionEnergy -= (2 + Math.random() * 3); // Disminuye 2-5 por puja
                if (priceRatio > 3) auctionEnergy -= 5; // Penalización por precio alto
                if (priceRatio > 5) auctionEnergy -= 10; // Penalización mayor
                
                // 🎯 Calcula incremento basado en personalidad Y energía de subasta
                let increase = 0;
                const energyFactor = Math.max(0.3, auctionEnergy / 100); // Mínimo 30% de energía
                
                if (currentPrice < basePrice * (3 + Math.random() * 2)) { // Límite variable
                    switch (activeBidder.personality) {
                        case 'aggressive':
                            increase = Math.max(2, currentPrice * (0.05 + Math.random() * 0.04) * energyFactor);
                            break;
                        case 'strategic':
                            increase = Math.max(1, currentPrice * (0.03 + Math.random() * 0.02) * energyFactor);
                            break;
                        case 'impulsive':
                            increase = Math.max(3, currentPrice * (0.06 + Math.random() * 0.05) * energyFactor);
                            break;
                        case 'calculated':
                            increase = Math.max(1, currentPrice * (0.02 + Math.random() * 0.02) * energyFactor);
                            break;
                        case 'passionate':
                            increase = Math.max(2, currentPrice * (0.04 + Math.random() * 0.04) * energyFactor);
                            break;
                    }
                }
                
                if (increase > 0) {
                    lastPriceIncrease = increase;
                    currentPrice += increase;
                    lastBidder = activeBidder; // Guarda el último pujador
                    
                    // Crear mensaje realista con incremento
                    const personalityMessages = BIDDER_MESSAGES[activeBidder.personality];
                    const bidderAction = personalityMessages[Math.floor(Math.random() * personalityMessages.length)];
                    const increaseAmount = Math.round(increase);
                    
                    const bidMessage = `${activeBidder.emoji} ${activeBidder.name} ${bidderAction} y puja ${increaseAmount} pts más`;
                    addHistoryMessage(bidMessage, 'bid');
                    
                    console.log(`💰 Puja ${bidCount}: ${activeBidder.name} - +${increaseAmount} pts (Total: ${Math.round(currentPrice)}) [Energía: ${Math.round(auctionEnergy)}%]`);
                    
                    updateUI(true); // Activa la animación del precio
                    
                    // ❌ ELIMINADO: No hay finalización inmediata después de una puja
                    // La subasta solo puede terminar durante momentos de incertidumbre
                    
                } else {
                    // No hay incremento, pero no termina inmediatamente
                    // En su lugar, reduce la energía más rápidamente
                    auctionEnergy -= 10;
                    addHistoryMessage(`${activeBidder.emoji} ${activeBidder.name} duda y no puja`, 'uncertainty');
                    console.log('📉 Sin puja, energía reducida');
                }
            };
            
            // Inicia el procesamiento con intervalos variables MÁS LENTOS
            auctionInterval = setInterval(processAuctionTick, 3000 + Math.random() * 4000); // 2.5-6 segundos
        };
        
        // 🏆 Finaliza la subasta con celebración
        const finishAuction = () => {
            clearInterval(auctionInterval);
            isAuctionInProgress = false;
            
            // El ganador es el último que pujó (más realista)
            const winner = lastBidder || activeBidders[0] || { name: '🏆 Coleccionista VIP', emoji: '🏆' };
            
            const victoryMessage = `🎉 ¡${winner.name} GANÓ con ${Math.round(currentPrice)} pts! 🎉`;
            // Usar forceDelay para asegurar que la victoria aparezca después de un delay apropiado
            addHistoryMessage(victoryMessage, 'victory', true);
            
            console.log(`🏆 Subasta finalizada. Ganador: ${winner.name} con ${Math.round(currentPrice)} pts después de ${bidCount} pujas y ${uncertaintyMoments} momentos de incertidumbre`);
            
            // Muestra botón de aceptar con precio final después del mensaje de victoria
            setTimeout(() => {
                takeBtn.style.display = 'block';
                takeBtn.innerHTML = `
                    <span class="btn-icon">💰</span>
                    <span class="btn-text">¡ACEPTAR ${Math.round(currentPrice)} PTS!</span>
                `;
            }, 3000);
            
            // Mensaje motivacional después de un momento más largo
            setTimeout(() => {
                const motivationalMsg = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
                addHistoryMessage(motivationalMsg, 'system', true);
            }, 6000);
        };

        // 💎 Acepta el precio con celebración épica
        const takePrice = () => {
            const finalPrice = Math.round(currentPrice);
            const bonusMessage = isRecordBreaking ? ' ¡BONUS POR RÉCORD PERSONAL! 🏆' : '';
            
            App.state.sellConsumption(challenge.id, finalPrice);
            closeModal();
            
            // Mensaje de victoria épico
            const victoryMessage = `🎉 ¡SUBASTA GANADA! Vendiste tu ticket por ${finalPrice} puntos!${bonusMessage}`;
            App.events.emit('showDiscreetMessage', victoryMessage);
            
            // Vibración en dispositivos móviles (si está disponible)
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
        bidCount = 0;
        auctionEnergy = 100;
        isInDecisionPause = false;
        uncertaintyMoments = 0;
        lastBidder = null;
        startBtn.style.display = 'block';
        takeBtn.style.display = 'none';
        progressContainer.style.display = 'none';
        
        // Mensaje inicial motivacional
        const streakBonus = isRecordBreaking ? ' 🔥 ¡RACHA RÉCORD = PRECIO x2!' : '';
        // El mensaje de récord ahora va al historial, no necesitamos statusDisplay

        updateUI();
        modal.classList.add('visible');

        console.log('✅ Modal de subasta épica mostrado correctamente');
        console.log('💰 Precio base:', basePrice, 'pts');
        console.log('🔥 Récord personal:', isRecordBreaking ? 'SÍ (x2 bonus)' : 'NO');

        // Limpiar historial inicial y añadir mensaje motivacional
        historyContainer.innerHTML = '';
        messageHistory.length = 0;
        lastMessageTime = 0; // Reset del timing de mensajes
        
        // Añadir mensaje de récord si corresponde
        if (isRecordBreaking) {
            addHistoryMessage('🔥 ¡RACHA RÉCORD = PRECIO x2!', 'victory');
            setTimeout(() => {
                addHistoryMessage('💡 ¡Vender es más rentable que consumir! ¡Inicia la subasta!', 'system');
            }, 3000);
        } else {
            addHistoryMessage('💡 ¡Vender es más rentable que consumir! ¡Inicia la subasta!', 'system');
        }

    }

    // Exporta la función épica para que sea accesible globalmente
    // Usa un enfoque más robusto para asegurar que se registre correctamente
    const registerEpicAuction = () => {
        if (!window.App) window.App = {};
        if (!window.App.ui) window.App.ui = {};
        if (!window.App.ui.habits) window.App.ui.habits = {};
        
        window.App.ui.habits.showEpicAuction = showAuction;
        
        // También registra la función de test
        window.App.ui.habits.testEpicAuction = function() {
            console.log('🧪 TESTING SUBASTA ÉPICA...');
            console.log('📋 Pujadores disponibles:', VIRTUAL_BIDDERS.length);
            console.log('💬 Mensajes de pujadores:', BIDDER_MESSAGES.length);
            console.log('🎉 Mensajes motivacionales:', MOTIVATIONAL_MESSAGES.length);
            
            // Test con datos de prueba
            const testChallenge = {
                id: 'test-123',
                name: 'Test Abstinencia',
                firstLevelPoints: 100,
                incrementPercent: 5,
                currentLevel: 3,
                lastConsumptionTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                bestStreak: 12 * 60 * 60 * 1000,
                availableConsumptions: 1
            };
            
            console.log('🎯 Iniciando test con challenge:', testChallenge.name);
            showAuction(testChallenge);
        };
        
        console.log('🏆 SUBASTA ÉPICA REGISTRADA CORRECTAMENTE');
        console.log('📍 Función disponible en: App.ui.habits.showEpicAuction');
        console.log('🔍 Verificación:', typeof window.App.ui.habits.showEpicAuction);
    };
    
    // Registra inmediatamente
    registerEpicAuction();
    
    // También registra cuando el DOM esté listo (por si acaso)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', registerEpicAuction);
    }

    // La función de test ya está registrada en registerEpicAuction()

})(window.App = window.App || {});
