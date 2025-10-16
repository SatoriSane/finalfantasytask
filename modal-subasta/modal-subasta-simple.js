if (typeof SubastaConstantes === 'undefined') {
    console.error('❌ SubastaConstantes no está disponible. Asegúrate de incluir subasta-constantes-simple.js antes de este archivo.');
}

(function(App) {

    if (!App.ui) App.ui = {};
    if (!App.ui.habits) App.ui.habits = {};

    function showSimpleAuction(challenge) {
        console.log('🎯 SUBASTA SIMPLE INICIADA:', challenge.name);

        // --- Referencias DOM ---
        const modal = document.getElementById('auctionModal');
        const historyContainer = document.getElementById('auctionHistory');
        const priceDisplay = document.getElementById('auctionCurrentPrice');
        const startBtn = document.getElementById('startAuctionBtn');
        const takeBtn = document.getElementById('takePriceBtn');
        const closeBtn = document.querySelector('#auctionModal .modal-close-btn');
        const participantsContainer = document.getElementById('auctionParticipants');
        const avatarsContainer = document.getElementById('participantAvatars');
        const priceContainer = modal ? modal.querySelector('.auction-price-container') : null;
        const priceLabelEl = priceContainer ? priceContainer.querySelector('.price-label') : null;

        // Limpiar eventos previos
        closeBtn.onclick = null;
        startBtn.onclick = null;
        takeBtn.onclick = null;

        // Usar precio base que ya viene calculado (con bonus x2 si aplica)
        const basePrice = challenge.firstLevelPoints;
        

        let currentPrice = basePrice;
        let auctionTimeout = null;
        let isAuctionActive = false;
        let activeBidders = [];
        let lastBidder = null;

        // Estado martillo
        let isInHammerSequence = false;
        let hammerStep = 0;
        let hammerBonusChance = 0; // Probabilidad acumulada de martillo
        const hammerResumeChances = [...SubastaConstantes.PROBABILITIES.HAMMER_RESUME_CHANCES]; // copia mutable

        // --- Funciones auxiliares ---
        const updatePriceDisplay = () => {
            priceDisplay.textContent = `⭐${Math.round(currentPrice)} pts`;
        };

        // --- Helpers de UI del área de precio ---
        const setPriceAreaInitial = () => {
            if (priceContainer) priceContainer.classList.remove('compact');
            if (priceLabelEl) priceLabelEl.textContent = 'Precio inicial';
        };

        const setPriceAreaRunning = () => {
            if (priceContainer) priceContainer.classList.add('compact');
            // Nota: la etiqueta no cambia durante la subasta
        };

        const setPriceAreaFinished = () => {
            if (priceContainer) priceContainer.classList.remove('compact');
            if (priceLabelEl) priceLabelEl.textContent = 'Precio final';
        };

// --- Animación del precio final (DURACIÓN DINÁMICA) ---
const animateFinalPrice = (startPrice, endPrice, baseDuration = null) => {
    // Calcular duración basada en el incremento (1 segundo por cada 50% de aumento)
    let duration;
    if (baseDuration !== null) {
        // Si se especifica duración manualmente, usarla
        duration = baseDuration;
    } else {
        // Calcular duración automáticamente
        const increaseRatio = endPrice / startPrice; // ej: 2.0 = doble, 3.0 = triple
        const increasePercent = (increaseRatio - 1) * 100; // ej: 100% = doble, 200% = triple
        const durationSeconds = Math.max(1, increasePercent / 50); // 1 seg por cada 50%
        duration = durationSeconds * 1000; // convertir a milisegundos
        
        console.log(`💰 Precio: ${Math.round(startPrice)} → ${Math.round(endPrice)} | Aumento: ${increasePercent.toFixed(1)}% | Duración: ${durationSeconds.toFixed(1)}s`);
    }
    
    const startTime = Date.now();
    const priceDifference = endPrice - startPrice;
    
    const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Usar progreso lineal - velocidad constante (sin easing)
        const currentAnimatedPrice = startPrice + (priceDifference * progress);
        
        priceDisplay.textContent = `⭐${Math.round(currentAnimatedPrice)} pts`;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Asegurar que termine en el precio exacto
            priceDisplay.textContent = `⭐${Math.round(endPrice)} pts`;
        }
    };
    
    animate();
};
// --- Mostrar solo el ganador con animación elegante ---
const showWinnerOnly = (winner) => {
    if (!avatarsContainer || !participantsContainer) return;
    
    // Cambiar etiqueta a "Ganador" con transición suave
    const participantsLabel = participantsContainer.querySelector('.participants-label');
    if (participantsLabel) {
        participantsLabel.style.transition = 'all 0.5s ease';
        participantsLabel.textContent = '🏆 Ganador';
        participantsLabel.style.color = 'var(--auction-gold)';
    }

    // Obtener todos los avatares actuales
    const currentAvatars = Array.from(avatarsContainer.querySelectorAll('.participant-avatar'));
    const winnerAvatar = currentAvatars.find(avatar => 
        avatar.getAttribute('data-bidder-name') === winner.name
    );

    // Fase 1: Desvanecer los avatares que no son ganadores (inspirado en extremeBid)
    const losers = currentAvatars.filter(avatar => 
        avatar.getAttribute('data-bidder-name') !== winner.name
    );

    // Aplicar la animación de salida elegante a cada perdedor
    losers.forEach((avatar, index) => {
        setTimeout(() => {
            // Agregar clase de salida elegante
            avatar.classList.add('elegant-exit');
            
            // Remover del DOM después de la animación
            setTimeout(() => {
                if (avatar.parentNode) {
                    avatar.parentNode.removeChild(avatar);
                }
            }, 800);
        }, index * 120); // Desaparición escalonada más rápida
    });

    // Fase 2: Destacar y centrar al ganador
    setTimeout(() => {
        if (winnerAvatar) {
            // Animar el ganador existente
            winnerAvatar.classList.remove('speaking'); // quitar efectos previos
            winnerAvatar.classList.add('winner-avatar');
            
            // Efecto de resplandor sutil después de un momento
            setTimeout(() => {
                winnerAvatar.classList.add('winner-glow');
            }, 400);
            
        } else {
            // Crear nuevo avatar si no existe (caso raro)
            createWinnerAvatar(winner);
        }
        
        // Centrar el contenedor cuando solo queda el ganador
        setTimeout(() => {
            avatarsContainer.style.justifyContent = 'center';
            avatarsContainer.style.transition = 'all 0.6s ease';
        }, 500);
        
    }, losers.length * 120 + 200);

    // Mostrar la sección con fade-in suave
    if (participantsContainer.style.display === 'none') {
        participantsContainer.style.opacity = '0';
        participantsContainer.style.display = 'block';
        setTimeout(() => {
            participantsContainer.style.transition = 'opacity 0.6s ease';
            participantsContainer.style.opacity = '1';
        }, 100);
    }

    console.log(`🏆 Mostrando ganador: ${winner.name}`);
};

// Función auxiliar para crear avatar del ganador cuando no existe (caso excepcional)
const createWinnerAvatar = (winner) => {
    const winnerDiv = document.createElement('div');
    winnerDiv.className = 'participant-avatar winner-avatar';
    winnerDiv.setAttribute('data-bidder-name', winner.name);
    
    // Estilos iniciales para animación de entrada
    winnerDiv.style.opacity = '0';
    winnerDiv.style.transform = 'scale(0.8)';
    
    const emojiDiv = document.createElement('div');
    emojiDiv.className = 'participant-emoji';
    emojiDiv.textContent = winner.emoji;
    
    const nameDiv = document.createElement('div');
    nameDiv.className = 'participant-name';
    nameDiv.textContent = winner.name;
    
    winnerDiv.appendChild(emojiDiv);
    winnerDiv.appendChild(nameDiv);
    avatarsContainer.appendChild(winnerDiv);
    
    // Animar entrada suave
    setTimeout(() => {
        winnerDiv.style.transition = 'all 1s ease-out';
        winnerDiv.style.opacity = '1';
        winnerDiv.style.transform = 'scale(1.1)';
        
        // Agregar resplandor después
        setTimeout(() => {
            winnerDiv.classList.add('winner-glow');
        }, 500);
    }, 100);
};

        const addMessage = (msg, type='system') => {
            const div = document.createElement('div');
            div.className = `auction-message ${type}`;
            div.textContent = msg;
            historyContainer.insertBefore(div, historyContainer.firstChild);

            const messages = historyContainer.querySelectorAll('.auction-message');
            if (messages.length > 99) messages[messages.length - 1].remove();

            const historyWrapper = document.querySelector('.auction-history-container');
            if (historyWrapper) historyWrapper.scrollTo({ top: 0, behavior: 'smooth' });
        };

        // --- Funciones de Avatares ---
        const showParticipantAvatars = () => {
            if (!avatarsContainer) return;
            
            avatarsContainer.innerHTML = '';
            participantsContainer.style.display = 'block';
            
            activeBidders.forEach(bidder => {
                const avatarDiv = document.createElement('div');
                avatarDiv.className = 'participant-avatar';
                avatarDiv.setAttribute('data-bidder-name', bidder.name);
                
                const emojiDiv = document.createElement('div');
                emojiDiv.className = 'participant-emoji';
                emojiDiv.textContent = bidder.emoji;
                
                const nameDiv = document.createElement('div');
                nameDiv.className = 'participant-name';
                nameDiv.textContent = bidder.name;
                
                avatarDiv.appendChild(emojiDiv);
                avatarDiv.appendChild(nameDiv);
                avatarsContainer.appendChild(avatarDiv);
            });
            
            console.log(`👥 Avatares mostrados: ${activeBidders.length} participantes`);
        };

        const highlightSpeakingAvatar = (bidder) => {
            if (!avatarsContainer) return;
            
            // Remover highlight previo
            const prevSpeaking = avatarsContainer.querySelector('.participant-avatar.speaking');
            if (prevSpeaking) {
                prevSpeaking.classList.remove('speaking');
            }
            
            // Agregar highlight al que habla
            const speakingAvatar = avatarsContainer.querySelector(`[data-bidder-name="${bidder.name}"]`);
            if (speakingAvatar) {
                speakingAvatar.classList.add('speaking');
                
                // Remover highlight después de la animación
                setTimeout(() => {
                    speakingAvatar.classList.remove('speaking');
                }, 800);
            }
        };

        const showSpeechBubble = (bidder, bidAmount, isExtreme = false) => {
            if (!avatarsContainer) return;
            
            const speakingAvatar = avatarsContainer.querySelector(`[data-bidder-name="${bidder.name}"]`);
            if (!speakingAvatar) return;
            
            // Remover burbuja anterior si existe
            const existingBubble = speakingAvatar.querySelector('.speech-bubble');
            if (existingBubble) {
                existingBubble.remove();
            }
            
            // Crear nueva burbuja de diálogo
            const bubble = document.createElement('div');
            bubble.className = `speech-bubble${isExtreme ? ' extreme' : ''}`;
            bubble.textContent = `⭐${Math.round(bidAmount)} pts`;
            
            // Agregar la burbuja al avatar
            speakingAvatar.style.position = 'relative';
            speakingAvatar.appendChild(bubble);
            
            // Remover la burbuja después de un tiempo
            setTimeout(() => {
                if (bubble.parentNode) {
                    bubble.style.animation = 'bubbleFadeOut 0.4s ease-out forwards';
                    setTimeout(() => {
                        if (bubble.parentNode) {
                            bubble.remove();
                        }
                    }, 400);
                }
            }, isExtreme ? 3000 : 5000); // Burbujas extremas duran más tiempo
            
            console.log(`💬 Burbuja de diálogo mostrada: ${bidder.name} - ${Math.round(bidAmount)} pts`);
        };

        const removeParticipantAvatar = (bidder) => {
            if (!avatarsContainer) return;
            
            const avatarToRemove = avatarsContainer.querySelector(`[data-bidder-name="${bidder.name}"]`);
            if (avatarToRemove) {
                // Remover cualquier burbuja de diálogo existente
                const existingBubble = avatarToRemove.querySelector('.speech-bubble');
                if (existingBubble) {
                    existingBubble.remove();
                }
                
                avatarToRemove.classList.add('leaving');
                
                // Remover del DOM después de la animación
                setTimeout(() => {
                    if (avatarToRemove.parentNode) {
                        avatarToRemove.remove();
                    }
                }, 600);
                
                console.log(`💨 Avatar removido: ${bidder.name}`);
            }
        };

        const generateBidders = () => {
            // Cantidad de pujadores entre MIN_BIDDERS y MAX_BIDDERS
            const minBidders = SubastaConstantes.MIN_BIDDERS || 3;
            const maxBidders = SubastaConstantes.MAX_BIDDERS || 6;
            const numBidders = minBidders + Math.floor(Math.random() * (maxBidders - minBidders + 1));
        
            activeBidders = [];
            const pool = [...SubastaConstantes.VIRTUAL_BIDDERS];
        
            for (let i = 0; i < numBidders && pool.length > 0; i++) {
                const idx = Math.floor(Math.random() * pool.length);
                // Extrae aleatoriamente del pool para evitar repetidos
                activeBidders.push(pool.splice(idx, 1)[0]);
            }
        
            console.log(`👥 Pujadores generados: ${activeBidders.map(b => b.name).join(', ')}`);
            
            // Mostrar avatares de los participantes
            showParticipantAvatars();
        };

        // --- Turnos ---
        const processNextTurn = () => {
            if(!isAuctionActive) return;

            // 🚨 PROTECCIÓN: Si no quedan pujadores activos, terminar subasta
            if (activeBidders.length === 0) {
                console.error('❌ ERROR: No quedan pujadores activos');
                finishAuction();
                return;
            }

            const random = Math.random();
            const hammerChance = Math.min(SubastaConstantes.PROBABILITIES.HAMMER_CHANCE + hammerBonusChance, 0.5);
            console.log(`🔎 Turno -> hammerChance=${(hammerChance*100).toFixed(1)}% | hammerBonus=${hammerBonusChance.toFixed(3)}`);
            if(random < hammerChance){
                processHammer();
            } else {
                processBid();
            }
        };
        const processBid = () => {
            if(isInHammerSequence){
                // Interrupción del martillo - puja INMEDIATA
                isInHammerSequence = false;
                hammerStep = 0;
                console.log('🔨 ¡MARTILLO INTERRUMPIDO! Puja inmediata...');
                executeBid();
                return;
            }
            executeBid();
        };
        // Ajusta la probabilidad de retirarse según la cantidad de jugadores activos
        function getRetreatMultiplier(activeCount) {
            if (activeCount >= 10) return 0.35;
            if (activeCount >= 8) return 0.4;
            if (activeCount >= 6) return 0.5;
            if (activeCount >= 4) return 0.7;
            if (activeCount >= 2) return 0.9;
            return 1.0;
        }

        const executeBid = (wasHammerInterrupted = false) => {
            // 🚨 PROTECCIÓN: Verificar que hay pujadores antes de continuar
            if (activeBidders.length === 0) {
                console.error('❌ ERROR: No hay pujadores para executeBid()');
                finishAuction();
                return;
            }
        
            let bidder;
        
            // Elegir pujador aleatorio, evitando que sea el mismo que en la última puja si hay más de uno
            const availableBidders = activeBidders.filter(b => b !== lastBidder);
            if (availableBidders.length > 0) {
                bidder = availableBidders[Math.floor(Math.random() * availableBidders.length)];
            } else {
                bidder = activeBidders[0]; // solo queda uno
            }
            
            // 🎲 Determinar si la puja es extrema
            const isExtremeBid = Math.random() < SubastaConstantes.PROBABILITIES.EXTREME_BID_CHANCE;
        
            let increasePercent;
            if (isExtremeBid) {
                // 🔥 Puja extrema: usar rango definido en constantes
                const min = SubastaConstantes.EXTREME_BID_RANGE.min;
                const max = SubastaConstantes.EXTREME_BID_RANGE.max;
                const increase = Math.floor(Math.random() * (max - min + 1)) + min;
            
                console.log(`🔥 ¡PUJA EXTREMA! ${bidder.name} aumenta +${increase} pts`);
            
                currentPrice += increase;
                lastBidder = bidder;
            
                let bidMessage = SubastaConstantes.getBidMessage(bidder, isExtremeBid);
                if (wasHammerInterrupted) {
                    bidMessage = `¡¡${bidder.name} INTERRUMPE EL MARTILLO!! ${bidMessage}`;
                }
            
                addMessage(`${bidMessage} y puja +${increase} pts`, 'extreme-bid');
                highlightSpeakingAvatar(bidder);
                showSpeechBubble(bidder, currentPrice, true);
                if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
            
                // Procesar retiradas (igual que antes)
                const removedBidders = [];
                const potentialLeavers = [...activeBidders];
                potentialLeavers.forEach(b => {
                    if (b === bidder) return;
            
                    let retreatChance =
                        SubastaConstantes.PROBABILITIES.EXTREME_BID_RETREAT_CHANCES[b.personality] ||
                        SubastaConstantes.PROBABILITIES.EXTREME_BID_RETREAT_CHANCES.default;
            
                    const multiplier = getRetreatMultiplier(activeBidders.length);
                    retreatChance = Math.min(1, Math.max(0, retreatChance * multiplier));
            
                    if (Math.random() < retreatChance) {
                        removedBidders.push(b);
                        const index = activeBidders.indexOf(b);
                        if (index > -1) activeBidders.splice(index, 1);
                    }
                });
            
                if (removedBidders.length > 0) {
                    console.log(`💨 Se retiraron por miedo: ${removedBidders.map(b => b.name).join(', ')}`);
                    setTimeout(() => {
                        if (isAuctionActive) processHammer();
                    }, SubastaConstantes.TIMING_CONFIG.MESSAGE_DELAY || 1500);
                    setTimeout(() => {
                        showRetreatMessagesInBackground(removedBidders, bidder);
                    }, (SubastaConstantes.TIMING_CONFIG.MESSAGE_DELAY || 1500) + 800);
                } else {
                    setTimeout(() => {
                        if (isAuctionActive) processHammer();
                    }, SubastaConstantes.TIMING_CONFIG.MESSAGE_DELAY || 1500);
                }
            
            } else {
                // 💰 Puja normal: siempre +1 punto fijo
                const increase = 1;
                currentPrice += increase;
                lastBidder = bidder;
            
                let bidMessage = SubastaConstantes.getBidMessage(bidder, isExtremeBid);
                if (wasHammerInterrupted) {
                    bidMessage = `¡${bidder.name} se apresura e interrumpe! ${bidMessage}`;
                }
            
                addMessage(`${bidMessage} y puja +${increase} pts`, 'bid');
                highlightSpeakingAvatar(bidder);
                showSpeechBubble(bidder, currentPrice, false);
            
                processNormalBidRetreat(bidder);
                scheduleNextTurn(wasHammerInterrupted);
            }
            
        };

        // 🎲 Función nueva: Procesar retiradas en pujas normales (probabilidad menor, lógica inversa)
        const processNormalBidRetreat = (normalBidder) => {
            if (activeBidders.length <= 2) return; // No procesar si quedan muy pocos
            
            const removedBidders = [];
            const potentialLeavers = [...activeBidders];
            
            potentialLeavers.forEach(b => {
                // El pujador que hizo la oferta normal NUNCA se retira a sí mismo
                if (b === normalBidder) return;
                
                // Obtener la probabilidad de retiro para pujas normales (lógica inversa)
                let retreatChance = SubastaConstantes.PROBABILITIES.NORMAL_BID_RETREAT_CHANCES[b.personality] || 
                                  SubastaConstantes.PROBABILITIES.NORMAL_BID_RETREAT_CHANCES.default;
                
                // Aplicar multiplicador dinámico según jugadores activos
                const multiplier = getRetreatMultiplier(activeBidders.length);
                retreatChance *= multiplier;
                
                // Asegurar entre 0 y 1
                retreatChance = Math.min(1, Math.max(0, retreatChance));
                
                // 🎲 Tirar el dado: ¿Se retira o se queda?
                if (Math.random() < retreatChance) {
                    removedBidders.push(b);
                    
                    // Lo eliminamos de la lista de pujadores activos
                    const index = activeBidders.findIndex(ab => ab === b);
                    if (index > -1) activeBidders.splice(index, 1);
                }
            });
            
            // Si alguien se retiró, mostrar mensajes con delay
            if (removedBidders.length > 0) {
                console.log(`💨 Retiradas por puja normal: ${removedBidders.map(b => b.name).join(', ')}`);
                
                setTimeout(() => {
                    showNormalRetreatMessages(removedBidders);
                }, 1000 + Math.random() * 1500); // Delay aleatorio entre 1-2.5s
            }
        };

        // 🎭 Función: Mostrar mensajes de retirada para pujas normales
        const showNormalRetreatMessages = (bidders) => {
            if (bidders.length === 0) return;
            
            const processRetreatMessage = (remainingBidders) => {
                if (remainingBidders.length === 0) {
                    // Verificar si solo queda uno después de las retiradas
                    checkForSingleWinner();
                    return;
                }
                
                const [first, ...rest] = remainingBidders;
                const delay = 800 + Math.random() * 1200; // Delay más corto que en pujas extremas
                
                setTimeout(() => {
                    if (isAuctionActive) {
                        const msg = SubastaConstantes.getFearMessage(first);
                        addMessage(msg, 'system');
                        console.log(`💨 ${first.name} se retiró tras puja normal`);
                        
                        removeParticipantAvatar(first);
                        processRetreatMessage(rest);
                    }
                }, delay);
            };
            
            processRetreatMessage(bidders);
        };
        
// 🎭 Función nueva: Mostrar mensajes de retirada en segundo plano (NO interfiere con martillo)
const showRetreatMessagesInBackground = (bidders, extremeBidder) => {
    if (bidders.length === 0) return;

    console.log(`💨 Mostrando retiradas en background: ${bidders.map(b => b.name).join(', ')}`);

    const processRetreatMessage = (remainingBidders, isFirst = true) => {
        if (remainingBidders.length === 0) {
            console.log('✅ Todos los mensajes de retirada mostrados');
            // 🏆 Revisar si solo queda uno
            checkForSingleWinner();
            return;
        }

        const [first, ...rest] = remainingBidders;
        let delay;
        if (isFirst) {
            delay = 500 + Math.random() * 1000; // primer mensaje aleatorio entre 500 y 1500 ms
        } else {
            delay = SubastaConstantes.PROBABILITIES.FEAR_MESSAGE_DELAY_MIN +
                    Math.random() * (SubastaConstantes.PROBABILITIES.FEAR_MESSAGE_DELAY_MAX -
                                     SubastaConstantes.PROBABILITIES.FEAR_MESSAGE_DELAY_MIN);
        }

        setTimeout(() => {
            if (isAuctionActive) {
                const msg = SubastaConstantes.getFearMessage(first);
                addMessage(msg, 'system');
                console.log(`💨 ${first.name} se retiró mientras suena el martillo`);

                removeParticipantAvatar(first);

                processRetreatMessage(rest, false); // los siguientes no son el primero
            }
        }, delay);
    };

    // Iniciar la secuencia de mensajes de miedo en background
    processRetreatMessage(bidders, true);
};

        
        // 🔄 Función simplificada: Ya no maneja el flujo principal
        const showRetreatMessagesSequentially = (bidders, extremeBidder) => {
            if (bidders.length === 0) {
                // 🏆 Primero revisar si solo queda 1
                if (checkForSingleWinner()) return;
            
                // Si era puja extrema, revisar victoria por intimidación
                const extremeWinnerResult = checkForExtremeWinner(extremeBidder);
                
                if (!extremeWinnerResult) {
                    setTimeout(() => {
                        if (isAuctionActive) processHammer();
                    }, SubastaConstantes.TIMING_CONFIG.MESSAGE_DELAY || 1500);
                }
                return;
            }
            
        
            const [first, ...rest] = bidders;
            
            // ⏱️ SIEMPRE usar delay aleatorio antes de mostrar cada mensaje
            const delay = SubastaConstantes.PROBABILITIES.FEAR_MESSAGE_DELAY_MIN + 
                         Math.random() * (SubastaConstantes.PROBABILITIES.FEAR_MESSAGE_DELAY_MAX - 
                                         SubastaConstantes.PROBABILITIES.FEAR_MESSAGE_DELAY_MIN);
            
            console.log(`⏰ Programando mensaje de miedo en ${delay}ms para ${first.name}`);
            
            setTimeout(() => {
                if (!isAuctionActive) return;
                
                const msg = SubastaConstantes.getFearMessage(first);
                addMessage(msg, 'system');
                
                // Remover avatar del participante que se retira
                removeParticipantAvatar(first);
                
                // Continuar con el siguiente mensaje
                showRetreatMessagesSequentially(rest, extremeBidder);
                
            }, delay);
        };
        // ✅ Verificar si queda un único pujador activo (victoria automática)
const checkForSingleWinner = () => {
    if (!isAuctionActive) return false;

    if (activeBidders.length === 1) {
        const soleWinner = activeBidders[0];
        console.log(`👑 ${soleWinner.name} se quedó solo -> victoria automática`);

        isAuctionActive = false;
        clearTimeout(auctionTimeout);

        const finalPrice = Math.round(currentPrice);
        addMessage(`🎉 ¡${soleWinner.name} no tiene rivales y gana por ${finalPrice} pts! 🎉`, 'victory');

        // Restaurar área de precio y mostrar etiqueta final
        setPriceAreaFinished();
        
        // Mostrar solo el ganador en avatares
        showWinnerOnly(soleWinner);
        
        // Animar precio desde inicial hasta final
        animateFinalPrice(basePrice, finalPrice, 4000);

        setTimeout(() => {
            takeBtn.style.display = 'block';
            takeBtn.textContent = `💰 ¡ACEPTAR ${finalPrice} pts!`;
            takeBtn.classList.add('pulse-victory');
        }, SubastaConstantes.TIMING_CONFIG.FINAL_DELAY + 4000); // Esperar a que termine la animación

        return true;
    }
    return false;
};

        // 🏆 Función mejorada: Verificar si el pujador extremo ganó por quedarse solo
        const checkForExtremeWinner = (extremeBidder) => {
            // Verificar cuántos pujadores quedan activos
            console.log(`🔍 Verificando ganador extremo. Pujadores activos: ${activeBidders.length}`);
            console.log(`👥 Lista actual: ${activeBidders.map(b => b.name).join(', ')}`);
            
            // Si solo queda 1 pujador (que debe ser el del bid extremo), ¡Victoria inmediata!
            if (activeBidders.length === 1 && activeBidders[0] === extremeBidder) {
                setTimeout(() => {
                    console.log(`🎯 ¡VICTORIA POR PUJA EXTREMA! ${extremeBidder.name} se quedó solo`);
                    
                    // Mensaje épico de victoria por intimidación
                    const victoryMessages = [
                        `😨 ¡${extremeBidder.name} intimidó a todos los competidores!`,
                        `🔥 ¡Puja tan extrema que nadie se atrevió a competir!`,
                        `👑 ${extremeBidder.name} domina la subasta por pura audacia!`,
                        `💀 ¡La competencia huyó ante semejante oferta!`,
                        `⚡ ${extremeBidder.name} gana sin rival que se atreva a enfrentarlo!`
                    ];
                    
                    const randomVictoryMsg = victoryMessages[Math.floor(Math.random() * victoryMessages.length)];
                    addMessage(randomVictoryMsg, 'victory');
                    
                    // Delay dramático antes del mensaje final
                    setTimeout(() => {
                        finishAuctionWithExtremeWinner(extremeBidder);
                    }, 2000);
                    
                }, 1500); // Pequeño delay para que se vean todos los mensajes de huida
                
                return true; // Indica que la subasta terminó
            }

            // 🚨 PROTECCIÓN EXTRA: Si no quedan pujadores (caso edge), finalizar
            if (activeBidders.length === 0) {
                console.error('❌ ERROR CRÍTICO: No quedan pujadores después de puja extrema');
                setTimeout(() => {
                    finishAuction();
                }, 1000);
                return true;
            }
            
            // Si quedan más pujadores, continuar normalmente
            return false;
        };
        
        // 🏆 Función: Finalizar subasta con ganador por puja extrema
        const finishAuctionWithExtremeWinner = (winner) => {
            isAuctionActive = false;
            clearTimeout(auctionTimeout);
            
            const finalPrice = Math.round(currentPrice);
            const epicWinMessages = [
                `🎉 ¡${winner.name} CONQUISTA LA SUBASTA! ¡Victoria por intimidación total!`,
                `👑 ¡EMPERADOR DE LA SUBASTA! ${winner.name} reina sin oposición!`,
                `⚔️ ¡VICTORIA APLASTANTE! ${winner.name} eliminó toda competencia!`,
                `🔥 ¡REY DE LAS PUJAS! ${winner.name} dominó con pura audacia!`
            ];
            
            const finalMessage = epicWinMessages[Math.floor(Math.random() * epicWinMessages.length)];
            addMessage(`${finalMessage} ¡${finalPrice} pts!`, 'victory');

            // Restaurar área de precio y mostrar etiqueta final
            setPriceAreaFinished();
            
            // Mostrar solo el ganador en avatares
            showWinnerOnly(winner);
            
            // Animar precio desde inicial hasta final
            animateFinalPrice(basePrice, finalPrice);
            
            setTimeout(() => {
                takeBtn.style.display = 'block';
                takeBtn.textContent = `💰 ¡ACEPTAR ${finalPrice} pts!`;
                takeBtn.classList.add('pulse-victory');
            }, SubastaConstantes.TIMING_CONFIG.FINAL_DELAY + 4000); // Esperar a que termine la animación
        };
        
        // 🔄 Función auxiliar mejorada: Procesar incremento y continuar
        const processBidIncrementAndContinue = (bidder, increasePercent, isExtremeBid) => {
            // 🚨 PROTECCIÓN: Verificar que aún hay pujadores
            if (activeBidders.length === 0) {
                console.error('❌ ERROR: No hay pujadores en processBidIncrementAndContinue');
                finishAuction();
                return;
            }

            // Calcular incremento de precio y actualizar
            const increase = Math.max(1, currentPrice * increasePercent);
            currentPrice += increase;
            lastBidder = bidder;
        
            // Mostrar mensaje de puja
            const bidMessage = SubastaConstantes.getBidMessage(bidder, isExtremeBid);
            const messageType = isExtremeBid ? 'extreme-bid' : 'bid';
            addMessage(`${bidMessage} y puja +${Math.round(increase)} pts`, messageType);
            
            // Iluminar avatar del pujador y mostrar burbuja de diálogo
            highlightSpeakingAvatar(bidder);
            showSpeechBubble(bidder, currentPrice, isExtremeBid);
        
            // 🚨 Si es puja extrema, iniciar martillo después de un pequeño delay; si no, turno normal
            if (isExtremeBid) {
                setTimeout(() => {
                    if (isAuctionActive) processHammer();
                }, SubastaConstantes.TIMING_CONFIG.MESSAGE_DELAY || 1500);
            } else {
                scheduleNextTurn();
            }
        };

        const processHammer = () => {
            // Incrementar probabilidad acumulada del martillo
            hammerBonusChance += SubastaConstantes.PROBABILITIES.HAMMER_BONUS_INCREMENT;
            console.log('🔨 Iniciando secuencia del martillo (posiblemente mientras la gente huye)...');
        
            if (!isInHammerSequence) {
                isInHammerSequence = true;
                hammerStep = 0;
        
                // Espera especial solo antes del primer mensaje
                setTimeout(() => {
                    if (!isAuctionActive) return;
        
                    addMessage(SubastaConstantes.getHammerMessage(hammerStep), 'system');
                    hammerStep++;
        
                    if (hammerStep >= SubastaConstantes.HAMMER_MESSAGES.length) {
                        finishAuction();
                        return;
                    }
        
                    continueHammer();
                }, SubastaConstantes.TIMING_CONFIG.HAMMER_FIRST_DELAY || 2500);
            } else {
                addMessage(SubastaConstantes.getHammerMessage(hammerStep), 'system');
                hammerStep++;
        
                if (hammerStep >= SubastaConstantes.HAMMER_MESSAGES.length) {
                    finishAuction();
                    return;
                }
        
                continueHammer();
            }
        };
        
        const continueHammer = () => {
            setTimeout(() => {
                if (!isAuctionActive) return;
        
                const resumeIndex = hammerStep - 1;
                const resumeChance = hammerResumeChances[resumeIndex] || 0;
        
                if (Math.random() < resumeChance) {
                    hammerResumeChances[resumeIndex] = Math.max(
                        0,
                        resumeChance - SubastaConstantes.PROBABILITIES.HAMMER_RESUME_DECREMENT
                    );
        
                    // 🚨 CAMBIO: pasar isHammerInterruption = true
                    if (isAuctionActive) {
                        isInHammerSequence = false;
                        executeBid(true); // ← Aquí ya le avisamos a executeBid() que es interrupción
                    }
                } else {
                    processHammer();
                }
            }, SubastaConstantes.TIMING_CONFIG.HAMMER_PAUSE);
        };
        

        const scheduleNextTurn = (isHammerInterruption = false) => {
            if(!isAuctionActive) return;
            
            let delay;
            
            if(isHammerInterruption){
                delay = Math.min(SubastaConstantes.TIMING_CONFIG.HAMMER_PAUSE, 800 + Math.random()*700);
                console.log(`⚡ Próximo turno tras interrupción: ${delay}ms (≤ HAMMER_PAUSE)`);
            }
            else {
                // Timing normal
                delay = SubastaConstantes.TIMING_CONFIG.BID_INTERVAL_MIN + 
                        Math.random() * (SubastaConstantes.TIMING_CONFIG.BID_INTERVAL_MAX - SubastaConstantes.TIMING_CONFIG.BID_INTERVAL_MIN);
                console.log(`⏱️ Próximo turno normal: ${delay}ms`);
            }
            
            auctionTimeout = setTimeout(processNextTurn, delay);
        };

        // --- Finalizar subasta mejorada ---
        const finishAuction = () => {
            isAuctionActive = false;
            clearTimeout(auctionTimeout);
            
            // 🚨 PROTECCIÓN: Determinar ganador de forma robusta
            const winner = lastBidder || 
                          (activeBidders.length > 0 ? activeBidders[0] : null) || 
                          {name:'Coleccionista VIP', emoji:'🏆'};
            
            const finalPrice = Math.round(currentPrice);
            addMessage(`🎉 ¡${winner.name} GANÓ con ${finalPrice} pts! 🎉`,'victory');
            
            // Restaurar área de precio y mostrar etiqueta final
            setPriceAreaFinished();
            
            // Mostrar solo el ganador en avatares
            showWinnerOnly(winner);
            
            // Animar precio desde inicial hasta final
            animateFinalPrice(basePrice, finalPrice, 4000);
            
            setTimeout(()=>{
                takeBtn.style.display='block';
                takeBtn.textContent=`💰 ¡ACEPTAR ${finalPrice} pts!`;
                takeBtn.classList.add('pulse-victory');
            }, SubastaConstantes.TIMING_CONFIG.FINAL_DELAY + 4000); // Esperar a que termine la animación
        };

        // --- Eventos ---
        const startAuction = () => {
            if(isAuctionActive) return;
            isAuctionActive=true;
            isInHammerSequence=false;
            hammerStep=0;
            hammerBonusChance=0;

            startBtn.style.display='none';
            takeBtn.style.display='none';
            closeBtn.style.display='none';
            closeBtn.disabled=true;

            historyContainer.innerHTML='';
            
            // Limpiar avatares previos
            if (avatarsContainer) avatarsContainer.innerHTML = '';
            if (participantsContainer) participantsContainer.style.display = 'none';
            
            generateBidders();
            
            // 🚨 PROTECCIÓN: Verificar que se generaron pujadores
            if (activeBidders.length === 0) {
                console.error('❌ ERROR CRÍTICO: No se pudieron generar pujadores');
                addMessage('❌ Error al generar pujadores. Cerrando subasta.', 'system');
                closeModal();
                return;
            }
            
            // Modo compacto mientras corre la subasta y mantener etiqueta sin cambios
            setPriceAreaRunning();
            addMessage(SubastaConstantes.getStartMessage(),'system');

            setTimeout(()=>{ if(isAuctionActive) scheduleNextTurn(); }, 1000);
        };

        const takePrice = () => {
            const finalPrice = Math.round(currentPrice);
            App.state.sellConsumption(challenge.id, finalPrice);
            closeModal();
            const victoryMsg = `🎉 ¡SUBASTA GANADA! Vendiste tu ticket por ${finalPrice} puntos!`;
            App.events.emit('shownotifyMessage', victoryMsg);
        };

        const closeModal = () => {
            isAuctionActive=false;
            clearTimeout(auctionTimeout);
            modal.classList.remove('visible');
            // Resetear área de precio para la próxima apertura
            setPriceAreaInitial();
            closeBtn.style.display='block';
            closeBtn.disabled=false;
        };

        closeBtn.onclick = closeModal;
        startBtn.onclick = startAuction;
        takeBtn.onclick = takePrice;

        startBtn.style.display='block';
        takeBtn.style.display='none';
        closeBtn.style.display='block';
        closeBtn.disabled=false;

        // Estado inicial del área de precio
        setPriceAreaInitial();
        updatePriceDisplay();
        modal.classList.add('visible');

        addMessage('💡 ¡Vender es más rentable que consumir! ¡Inicia la subasta!','system');
    }

    // Registro
    const registerSimpleAuction = () => {
        if(!window.App) window.App={};
        if(!window.App.ui) window.App.ui={};
        if(!window.App.ui.habits) window.App.ui.habits={};
        window.App.ui.habits.showSimpleAuction = showSimpleAuction;
        console.log('🎯 SUBASTA REGISTRADA CORRECTAMENTE');
    };

    registerSimpleAuction();
    if(document.readyState==='loading'){
        document.addEventListener('DOMContentLoaded', registerSimpleAuction);
    }

})(window.App = window.App || {});