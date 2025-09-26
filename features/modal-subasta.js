// Verificar que SubastaConstantes esté disponible
if (typeof SubastaConstantes === 'undefined') {
    console.error('❌ SubastaConstantes no está disponible. Asegúrate de incluir subasta-constantes.js antes de este archivo.');
}

const TIMING_CONFIG = SubastaConstantes?.TIMING_CONFIG || {};
const VIRTUAL_BIDDERS = SubastaConstantes?.VIRTUAL_BIDDERS || [];
const MOTIVATIONAL_MESSAGES = SubastaConstantes?.MOTIVATIONAL_MESSAGES || [];
const CHARACTER_SPECIFIC_MESSAGES = SubastaConstantes?.CHARACTER_SPECIFIC_MESSAGES || {};

// 🎭 SISTEMA DE COHERENCIA NARRATIVA Y CONTROL DE ESTADOS
let lastNarrativeMessageType = 'system'; // Tracking del último tipo de mensaje narrativo
let auctionState = 'idle'; // Estados: 'idle', 'running', 'finishing', 'finished'
let isFinalizingAuction = false; // Flag para evitar mensajes durante finalización

(function(App) {
    'use strict';
    
    // Asegura que App.ui.habits existe
    if (!App.ui) App.ui = {};
    if (!App.ui.habits) App.ui.habits = {};

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
        
        // 🎯 SISTEMA DE COLA SECUENCIAL PARA MENSAJES
        let messageQueue = [];
        let isProcessingQueue = false;
        let queueTimeout = null;

        // 🎭 Función para cerrar modal con limpieza épica
        const closeModal = () => {
            clearInterval(auctionInterval);
            clearTimeout(auctionInterval); // También limpiar si es setTimeout
            clearTimeout(queueTimeout);
            clearTimeout(finalizationTimeout);
            messageQueue = [];
            isProcessingQueue = false;
            modal.classList.remove('visible');
            closeBtn.style.display = 'block'; 
            closeBtn.disabled = false;
        };
        
        // 🎯 SISTEMA DE COLA SECUENCIAL - Procesa mensajes uno por uno
        const processMessageQueue = () => {
            if (isProcessingQueue || messageQueue.length === 0) return;
            
            isProcessingQueue = true;
            const nextMessage = messageQueue.shift();
            
            // Ejecutar el mensaje actual
            nextMessage.action();
            
            // Programar el siguiente mensaje
            queueTimeout = setTimeout(() => {
                isProcessingQueue = false;
                processMessageQueue();
            }, nextMessage.delay || TIMING_CONFIG.MESSAGE_MIN_DELAY);
        };
        
        // 🎯 Agregar mensaje a la cola secuencial con validación de estado
        const queueMessage = (action, delay = TIMING_CONFIG.MESSAGE_MIN_DELAY, priority = false, allowInFinishing = false) => {
            // 🚫 VALIDACIÓN DE ESTADO - Evitar mensajes incoherentes
            if (isFinalizingAuction && !allowInFinishing) {
                console.log('🚫 Mensaje bloqueado: subasta finalizando');
                return;
            }
            
            if (auctionState === 'finished' && !allowInFinishing) {
                console.log('🚫 Mensaje bloqueado: subasta terminada');
                return;
            }
            
            const message = { action, delay };
            
            if (priority) {
                messageQueue.unshift(message); // Prioridad alta = al inicio
            } else {
                messageQueue.push(message); // Normal = al final
            }
            
            // Iniciar procesamiento si no está activo
            if (!isProcessingQueue) {
                processMessageQueue();
            }
        };

        // 🎨 Actualización de UI con efectos visuales épicos
        let lastDisplayedPrice = basePrice;
        
        const updateUI = (animate = false) => {
            const roundedPrice = Math.round(currentPrice);
            
            if (animate && roundedPrice !== lastDisplayedPrice) {
                animatePrice(lastDisplayedPrice, roundedPrice);
                lastDisplayedPrice = roundedPrice;
            } else {
                currentPriceDisplay.textContent = `⭐${roundedPrice} pts`;
                lastDisplayedPrice = roundedPrice;
            }
        };

        // 🎯 Genera pujadores virtuales activos (3-7 personajes únicos)
        const generateActiveBidders = () => {
            const numBidders = Math.floor(Math.random() * 5) + 3; // 3-7 pujadores
            activeBidders = [];
            const usedBidders = new Set();
            
            while (activeBidders.length < numBidders && usedBidders.size < VIRTUAL_BIDDERS.length) {
                const bidder = VIRTUAL_BIDDERS[Math.floor(Math.random() * VIRTUAL_BIDDERS.length)];
                
                // Evitar duplicados
                if (!usedBidders.has(bidder.name)) {
                    usedBidders.add(bidder.name);
                    activeBidders.push({
                        ...bidder,
                        currentBid: Math.round(basePrice * (0.8 + Math.random() * 0.4)),
                        isActive: false,
                        lastBidTime: 0 // Para controlar repeticiones consecutivas
                    });
                }
            }
            
            console.log(`👥 Pujadores activos: ${activeBidders.map(b => b.name).join(', ')}`);
        };

        // 📜 Sistema de historial animado con control de timing
        const messageHistory = [];
        const MAX_MESSAGES = 20;
        let lastMessageTime = 0;
        
        // 🎯 NUEVA FUNCIÓN - Agregar mensaje usando cola secuencial con validación de contexto
        const addHistoryMessage = (message, type = 'system', forceDelay = false, immediate = false, allowInFinishing = false) => {
            // 🚫 VALIDACIÓN DE CONTEXTO - Evitar mensajes incoherentes
            if (isFinalizingAuction && !allowInFinishing) {
                console.log(`🚫 Mensaje bloqueado durante finalización: [${type}] ${message}`);
                return;
            }
            
            if (auctionState === 'finished' && !allowInFinishing) {
                console.log(`🚫 Mensaje bloqueado en subasta terminada: [${type}] ${message}`);
                return;
            }
            
            const messageObj = {
                text: message,
                type: type,
                timestamp: Date.now()
            };
            
            // Crear acción para mostrar el mensaje
            const showMessageAction = () => {
                // Doble validación antes de mostrar
                if (isFinalizingAuction && !allowInFinishing) {
                    console.log(`🚫 Mensaje cancelado en último momento: [${type}] ${message}`);
                    return;
                }
                
                const messageElement = document.createElement('div');
                messageElement.className = `auction-message ${type} new`;
                messageElement.textContent = message;
                historyContainer.insertBefore(messageElement, historyContainer.firstChild);
                messageHistory.unshift({ element: messageElement, message, type });
                
                // 📱 SCROLL AUTOMÁTICO HACIA EL MENSAJE MÁS RECIENTE
                const historyContainerElement = document.querySelector('.auction-history-container');
                if (historyContainerElement) {
                    // Scroll suave hacia arriba para mostrar el mensaje más reciente
                    historyContainerElement.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                }
                
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
                
                // Vibración sincronizada con el mensaje
                if (navigator.vibrate && type === 'bid') {
                    navigator.vibrate(100);
                }
            };
            
            // Determinar delay
            let delay = immediate ? 0 : (forceDelay ? TIMING_CONFIG.FORCE_DELAY_AMOUNT : TIMING_CONFIG.MESSAGE_MIN_DELAY);
            
            // Agregar a la cola secuencial
            if (immediate) {
                showMessageAction(); // Mostrar inmediatamente sin cola
            } else {
                queueMessage(showMessageAction, delay, forceDelay, allowInFinishing); // Usar cola secuencial
            }
        };
        
        // 🔢 Animación numérica del precio
        const animatePrice = (fromPrice, toPrice, duration = TIMING_CONFIG.PRICE_ANIMATION_DURATION) => {
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
        let isInHammerSequence = false;
        let hammerStep = 0; // 0, 1, 2, 3 (final)
        let lastBidder = null;
        let auctionType = '';

        // 🎲 Determina el tipo de subasta aleatoriamente
        const determineAuctionType = () => {
            const types = ['rápida', 'épica', 'volátil', 'normal'];
            auctionType = types[Math.floor(Math.random() * types.length)];
            
            // Mensaje simple según el tipo
            const messages = {
                'rápida': '⚡ Subasta EXPRESS detectada - ¡Pocos pujadores!',
                'épica': '🔥 ¡SUBASTA ÉPICA! Grandes coleccionistas detectados',
                'volátil': '🎢 Subasta VOLÁTIL - ¡Prepárate para sorpresas!',
                'normal': '🎯 Subasta equilibrada - ¡Que comience la batalla!'
            };
            
            addHistoryMessage(messages[auctionType], 'system');
            console.log(`🎲 Tipo de subasta: ${auctionType.toUpperCase()}`);
        };

        // 🚀 Inicia la subasta épica VARIABLE
        const startAuction = () => {
            if (isAuctionInProgress) return;
            isAuctionInProgress = true;
            auctionState = 'running'; // 🎯 ESTABLECER ESTADO
            isFinalizingAuction = false; // 🎯 RESETEAR FLAG DE FINALIZACIÓN
           // Ocultar y desactivar el botón de cerrar para evitar que cierre sin obtener los puntos
           closeBtn.style.display = 'none';
           closeBtn.disabled = true;           
            bidCount = 0;
            
            // Determinar tipo de subasta antes de empezar
            determineAuctionType();
            
            lastBidTime = Date.now();
            
            startBtn.style.display = 'none';
            takeBtn.style.display = 'none';
            progressContainer.style.display = 'none';
            
            // 🎯 EXPANDIR HISTORIAL - Aprovechar espacio libre
            const actionsContainer = document.querySelector('.auction-actions');
            const historyContainerElement = document.querySelector('.auction-history-container');
            
            if (actionsContainer && historyContainerElement) {
                actionsContainer.classList.add('hidden');
                historyContainerElement.classList.add('expanded');
            }
            
            generateActiveBidders();
            
            historyContainer.innerHTML = '';
            messageHistory.length = 0;
            lastMessageTime = 0;
            
            // 🎭 RESETEAR ESTADO NARRATIVO
            lastNarrativeMessageType = 'system';
            
            // 🎭 DECLARAR FUNCIONES ANTES DE USARLAS (HOISTING)
            
            // 🎭 SECUENCIA ÉPICA DE ENTRADA DE PARTICIPANTES
            const startParticipantEntrySequence = () => {
                let participantIndex = 0;
                
                // 1. Mensaje de espera inicial
                const waitingMessage = SubastaConstantes?.getWaitingMessage ? 
                    SubastaConstantes.getWaitingMessage() : 
                    '🕰️ Esperando a los participantes...';
                
                addHistoryMessage(waitingMessage, 'system', false, false, true);
                
                // 2. Secuencia de entrada de participantes (uno por uno)
                const showNextParticipant = () => {
                    if (participantIndex < activeBidders.length) {
                        const participant = activeBidders[participantIndex];
                        
                        const entryMessage = SubastaConstantes?.getParticipantEntryMessage ? 
                            SubastaConstantes.getParticipantEntryMessage(participant) :
                            `${participant.emoji} ${participant.name} entra a la subasta`;
                        
                        addHistoryMessage(entryMessage, 'participant-entry', false, false, true);
                        
                        participantIndex++;
                        
                        // Programar siguiente participante
                        setTimeout(showNextParticipant, 1200); // 1.2 segundos entre entradas
                    } else {
                        // 3. Todos los participantes han entrado, iniciar subasta
                        setTimeout(() => {
                            addHistoryMessage('🔥 ¡SUBASTA EN VIVO! ¡QUE COMIENCE LA BATALLA! 🔥', 'victory', false, false, true);
                            
                            // 4. Iniciar el bucle principal de la subasta
                            setTimeout(() => {
                                // 🔥 INICIAR SUBASTA REAL
                                console.log('🚀 Iniciando bucle principal de subasta...');
                                
                                // Usar la lógica de processAuctionTick que ya existe en startAuction
                                const intervalConfig = TIMING_CONFIG.AUCTION_INTERVALS[auctionType] || TIMING_CONFIG.AUCTION_INTERVALS['normal'];
                                const intervalDuration = intervalConfig.min + Math.random() * (intervalConfig.max - intervalConfig.min);
                                
                                // Iniciar la primera puja
                                setTimeout(() => {
                                    if (!isFinalizingAuction) {
                                        processBid();
                                    }
                                }, intervalDuration);
                            }, 500);
                        }, 400);
                    }
                };
                
                // Iniciar la secuencia después de un breve delay
                setTimeout(showNextParticipant, 500);
            };
            
            // 🚀 INICIAR SECUENCIA
            startParticipantEntrySequence();
            
            // 🔥 Las demás funciones están más abajo
            
            const processBid = () => {
                if (isFinalizingAuction) return;
                
                // Si está en secuencia de martillo, interrumpir
                if (isInHammerSequence) {
                    isInHammerSequence = false;
                    hammerStep = 0;
                    addHistoryMessage('💥 ¡PUJA DE ÚLTIMO SEGUNDO! ¡La subasta continúa!', 'victory', true, false, true);
                }
            
                bidCount++;
                
                // Seleccionar pujador aleatorio (evitar repetir el último)
                let activeBidder;
                let attempts = 0;
                do {
                    activeBidder = activeBidders[Math.floor(Math.random() * activeBidders.length)];
                    attempts++;
                } while (activeBidder === lastBidder && attempts < 10);
                
                // Calcular incremento de precio simple
                let increase;
                switch (activeBidder.personality) {
                    case 'aggressive':
                        increase = Math.max(3, currentPrice * (0.05 + Math.random() * 0.15));
                        break;
                    case 'impulsive':
                        increase = Math.max(2, currentPrice * (0.03 + Math.random() * 0.12));
                        break;
                    case 'strategic':
                        increase = Math.max(1, currentPrice * (0.02 + Math.random() * 0.08));
                        break;
                    case 'calculated':
                        increase = Math.max(1, currentPrice * (0.02 + Math.random() * 0.05));
                        break;
                    case 'passionate':
                        increase = Math.max(2, currentPrice * (0.04 + Math.random() * 0.10));
                        break;
                    default:
                        increase = Math.max(1, currentPrice * (0.03 + Math.random() * 0.07));
                }
            
                currentPrice += increase;
                lastBidder = activeBidder;
                
                const increaseAmount = Math.round(increase);
                
                // Usar mensaje específico del personaje
                const characterMessage = SubastaConstantes.getCharacterBidMessage(activeBidder);
                const bidMessage = `${characterMessage} y puja ${increaseAmount} pts!`;
                
                addHistoryMessage(bidMessage, 'bid', false, true);
                updateUI(true);
                
                // 20% probabilidad de que aparezca el martillo (después de la primera puja)
                if (bidCount > 0 && Math.random() < 0.2) {
                    setTimeout(() => {
                        if (!isFinalizingAuction) {
                            startHammerSequence();
                        }
                    }, 1000);
                    return;
                }
                
                // Continuar con la siguiente puja
                scheduleNextBid();
            };
            
            // Función para programar la siguiente puja
            const scheduleNextBid = () => {
                if (isFinalizingAuction || isInHammerSequence) return;
                
                const intervalConfig = TIMING_CONFIG.AUCTION_INTERVALS[auctionType] || TIMING_CONFIG.AUCTION_INTERVALS['normal'];
                const nextInterval = intervalConfig.min + Math.random() * (intervalConfig.max - intervalConfig.min);
                
                auctionInterval = setTimeout(() => {
                    if (!isFinalizingAuction && !isInHammerSequence) {
                        processBid();
                    }
                }, nextInterval);
            };
        };
        
        const startHammerSequence = () => {
            if (isInHammerSequence || isFinalizingAuction) return;
        
            isInHammerSequence = true;
            hammerStep = 0;
            console.log('🔨 Iniciando secuencia de martillo...');
            
            processHammerStep();
        };
        
        const processHammerStep = () => {
            if (!isInHammerSequence || isFinalizingAuction) return;
            
            const hammerMessages = SubastaConstantes.narrativeMessages.hammer;
            
            if (hammerStep < hammerMessages.length) {
                // Mostrar mensaje de martillo
                addHistoryMessage(hammerMessages[hammerStep], 'hammer', true, false, true);
                
                // Vibración
                if (navigator.vibrate) {
                    navigator.vibrate([100, 50, 100]);
                }
                
                hammerStep++;
                
                // Si es el último mensaje, finalizar subasta
                if (hammerStep >= hammerMessages.length) {
                    setTimeout(() => {
                        if (isInHammerSequence) {
                            startFinalizationSequence();
                        }
                    }, 2000);
                    return;
                }
                
                // 25% probabilidad de continuar la puja en cada paso
                setTimeout(() => {
                    if (isInHammerSequence && Math.random() < 0.25) {
                        // Continuar la subasta
                        isInHammerSequence = false;
                        hammerStep = 0;
                        addHistoryMessage('💥 ¡PUJA DE ÚLTIMO MOMENTO!', 'victory', true, false, true);
                        setTimeout(() => {
                            if (!isFinalizingAuction) {
                                scheduleNextBid();
                            }
                        }, 1000);
                    } else {
                        // Continuar con el siguiente paso del martillo
                        processHammerStep();
                    }
                }, TIMING_CONFIG.UNCERTAINTY_PAUSE_MIN + Math.random() * (TIMING_CONFIG.UNCERTAINTY_PAUSE_MAX - TIMING_CONFIG.UNCERTAINTY_PAUSE_MIN));
            }
        };
        
        let finalizationTimeout = null; // Para controlar la secuencia de finalización

        // 🔨 NUEVA FUNCIÓN - Secuencia de finalización tipo martillo
        const startFinalizationSequence = () => {
            if (isFinalizingAuction) return; // Ya está en proceso

            isFinalizingAuction = true;

            console.log('🔨 Iniciando secuencia de finalización...');

            const hammerMessages = SubastaConstantes.narrativeMessages.hammer || ['A la una...', 'A las dos...'];
            const shuffledMessages = [...hammerMessages].sort(() => 0.5 - Math.random());

            const finalizationSteps = [
                { message: shuffledMessages[0], delay: TIMING_CONFIG.FINISH_AUCTION_DELAY * 2, type: 'finalization' },
                { message: shuffledMessages[1], delay: TIMING_CONFIG.FINISH_AUCTION_DELAY * 2, type: 'finalization' },
                { message: `¡Adjudicado a...`, delay: TIMING_CONFIG.FINISH_AUCTION_DELAY, type: 'victory' }
            ];

            let cumulativeDelay = 0;

            const executeStep = (stepIndex) => {
                if (stepIndex >= finalizationSteps.length) {
                    finishAuction(); // Terminar la subasta
                    return;
                }

                const step = finalizationSteps[stepIndex];
                
                finalizationTimeout = setTimeout(() => {
                    if (!isFinalizingAuction) {
                        console.log('🔨 Secuencia de finalización interrumpida.');
                        return;
                    }
                    addHistoryMessage(step.message, step.type, true, false, true);
                    executeStep(stepIndex + 1);
                }, step.delay);
            };

            executeStep(0);
        };

        // 🚫 FUNCIÓN DUPLICADA ELIMINADA - Ya está dentro de showAuction()
        
        // 🏆 Finaliza la subasta con celebración CONTROLADA
        const finishAuction = () => {
            clearInterval(auctionInterval); // 🎯 Asegurarse de que el intervalo se detiene
            isAuctionInProgress = false;
            auctionState = 'finished';
            messageQueue = [];
            const winner = lastBidder || activeBidders[0] || { name: '🏆 Coleccionista VIP', emoji: '🏆' };
            const victoryMessage = `🎉 ¡${winner.name} GANÓ con ${Math.round(currentPrice)} pts! 🎉`;
            addHistoryMessage(victoryMessage, 'victory', true, false, true);
        
            const showAcceptButtonAction = () => {
                takeBtn.style.display = 'block';
                takeBtn.textContent = `💰 ¡ACEPTAR ${Math.round(currentPrice)} pts!`;
                takeBtn.classList.add('pulse-victory');
                const actionsContainerRestore = document.querySelector('.auction-actions');
                const historyContainerRestore = document.querySelector('.auction-history-container');
                if (actionsContainerRestore && historyContainerRestore) {
                    actionsContainerRestore.classList.remove('hidden');
                    historyContainerRestore.classList.remove('expanded');
                }
                closeBtn.style.display = 'block';
                closeBtn.disabled = false;
            };
            queueMessage(showAcceptButtonAction, TIMING_CONFIG.ACCEPT_BUTTON_DELAY, false, true);
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
        auctionState = 'idle'; // 🎯 RESETEAR ESTADO
        isFinalizingAuction = false; // 🎯 RESETEAR FLAG
        startBtn.style.display = 'block';
        takeBtn.style.display = 'none';
        progressContainer.style.display = 'none';
        
        // 🎯 RESTAURAR ESPACIO - Al resetear el modal
        const actionsContainerReset = document.querySelector('.auction-actions');
        const historyContainerReset = document.querySelector('.auction-history-container');
        
        if (actionsContainerReset && historyContainerReset) {
            actionsContainerReset.classList.remove('hidden');
            historyContainerReset.classList.remove('expanded');
        }

        updateUI();
        modal.classList.add('visible');

        historyContainer.innerHTML = '';
        messageHistory.length = 0;
        lastMessageTime = 0;
        
        if (isRecordBreaking) {
            addHistoryMessage('🔥 ¡RACHA RÉCORD = PRECIO x2!', 'victory');
            setTimeout(() => {
                addHistoryMessage('💡 ¡Vender es más rentable que consumir! ¡Inicia la subasta!', 'system');
            }, TIMING_CONFIG.RECORD_MESSAGE_DELAY);
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