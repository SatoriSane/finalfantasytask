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

        // Limpiar eventos previos
        closeBtn.onclick = null;
        startBtn.onclick = null;
        takeBtn.onclick = null;

        // Calcular precio base
        const pointsForCurrentLevel = Math.floor(challenge.firstLevelPoints * Math.pow(1 + challenge.incrementPercent / 100, challenge.currentLevel - 1));
        const currentStreakMs = new Date().getTime() - new Date(challenge.lastConsumptionTime).getTime();
        const isRecordBreaking = currentStreakMs > (challenge.bestStreak || 0);
        const basePrice = isRecordBreaking ? pointsForCurrentLevel * 2 : pointsForCurrentLevel;

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

        const removeParticipantAvatar = (bidder) => {
            if (!avatarsContainer) return;
            
            const avatarToRemove = avatarsContainer.querySelector(`[data-bidder-name="${bidder.name}"]`);
            if (avatarToRemove) {
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
            const hammerChance = Math.min(SubastaConstantes.PROBABILITIES.HAMMER_CHANCE + hammerBonusChance, 0.35);
            console.log(`🔎 Turno -> hammerChance=${(hammerChance*100).toFixed(1)}% | hammerBonus=${hammerBonusChance.toFixed(3)}`);
            if(random < hammerChance){
                processHammer();
            } else {
                processBid();
            }
        };

        const processBid = () => {
            if(isInHammerSequence){
                isInHammerSequence=false;
                hammerStep=0;
                setTimeout(()=>{ if(isAuctionActive) executeBid(); }, 500);
                return;
            }
            executeBid();
        };

        const executeBid = () => {
            // 🚨 PROTECCIÓN: Verificar que hay pujadores antes de continuar
            if (activeBidders.length === 0) {
                console.error('❌ ERROR: No hay pujadores para executeBid()');
                finishAuction();
                return;
            }

            let bidder, attempts = 0;
        
            // Elegir pujador aleatorio, evitando que sea el mismo que en la última puja si hay más de uno
            do {
                bidder = activeBidders[Math.floor(Math.random() * activeBidders.length)];
                attempts++;
            } while (bidder === lastBidder && attempts < 5 && activeBidders.length > 1);
        
            // 🎲 Determinar si la puja es extrema
            const isExtremeBid = Math.random() < SubastaConstantes.PROBABILITIES.EXTREME_BID_CHANCE;
        
            let increasePercent;
            if (isExtremeBid) {
                
                // 🔥 Puja extrema: usar rango definido en constantes
                const min = SubastaConstantes.EXTREME_BID_RANGE.min;
                const max = SubastaConstantes.EXTREME_BID_RANGE.max;
                increasePercent = min + Math.random() * (max - min);
                console.log(`🔥 ¡PUJA EXTREMA! ${bidder.name} aumenta ${(increasePercent*100).toFixed(1)}%`);
            
                // 1️⃣ PRIMERO: Mostrar el mensaje de la puja extrema y actualizar precio
                const increase = Math.max(1, currentPrice * increasePercent);
                currentPrice += increase;
                lastBidder = bidder;
                
                const bidMessage = SubastaConstantes.getBidMessage(bidder, isExtremeBid);
                addMessage(`${bidMessage} y puja +${Math.round(increase)} pts`, 'extreme-bid');
                updatePriceDisplay();
                
                // Iluminar avatar del pujador
                highlightSpeakingAvatar(bidder);
                if(navigator.vibrate) navigator.vibrate([100,50,100,50,200]);

                // 2️⃣ SEGUNDO: Procesar retiradas después del mensaje de puja
                const removedBidders = [];
                const potentialLeavers = [...activeBidders];
            
                potentialLeavers.forEach(b => {
                    // El pujador que hizo la oferta extrema NUNCA se retira a sí mismo
                    if (b === bidder) return;
            
                    // Obtener la probabilidad de retiro según la personalidad del pujador
                    const retreatChance = SubastaConstantes.PROBABILITIES.EXTREME_BID_RETREAT_CHANCES[b.personality] || 
                                          SubastaConstantes.PROBABILITIES.EXTREME_BID_RETREAT_CHANCES.default;
            
                    // 🎲 Tirar el dado: ¿Se retira o se queda?
                    if (Math.random() < retreatChance) {
                        removedBidders.push(b);
            
                        // Lo eliminamos de la lista de pujadores activos
                        const index = activeBidders.findIndex(ab => ab === b);
                        if (index > -1) activeBidders.splice(index, 1);
                    }
                });
            
                // 3️⃣ TERCERO: Iniciar martillo Y mostrar retiradas simultáneamente
                if (removedBidders.length > 0) {
                    console.log(`💨 Se retiraron por miedo: ${removedBidders.map(b => b.name).join(', ')}`);
                    
                    // 🔨 INICIAR MARTILLO INMEDIATAMENTE (dramático)
                    setTimeout(() => {
                        if (isAuctionActive) {
                            console.log('🔨 Iniciando martillo mientras la gente huye...');
                            processHammer();
                        }
                    }, SubastaConstantes.TIMING_CONFIG.MESSAGE_DELAY || 1500);
                    
                    // 💨 MOSTRAR RETIRADAS EN PARALELO (con delay ligeramente mayor)
                    setTimeout(() => {
                        showRetreatMessagesInBackground(removedBidders, bidder);
                    }, (SubastaConstantes.TIMING_CONFIG.MESSAGE_DELAY || 1500) + 800);
                    
                } else {
                    // Si nadie se retiró, continuar con martillo normalmente
                    setTimeout(() => {
                        if (isAuctionActive) processHammer();
                    }, SubastaConstantes.TIMING_CONFIG.MESSAGE_DELAY || 1500);
                }
                
            } else {
                // Puja normal según personalidad
                switch(bidder.personality){
                    case 'aggressive': increasePercent = 0.08 + Math.random()*0.12; break;
                    case 'impulsive': increasePercent = 0.05 + Math.random()*0.10; break;
                    case 'strategic': increasePercent = 0.03 + Math.random()*0.07; break;
                    case 'calculated': increasePercent = 0.02 + Math.random()*0.05; break;
                    case 'passionate': increasePercent = 0.06 + Math.random()*0.09; break;
                    default: increasePercent = 0.04 + Math.random()*0.08; break;
                }
                
                // Procesar puja normal inmediatamente
                const increase = Math.max(1, currentPrice * increasePercent);
                currentPrice += increase;
                lastBidder = bidder;
            
                // Mostrar mensaje de puja normal
                const bidMessage = SubastaConstantes.getBidMessage(bidder, isExtremeBid);
                addMessage(`${bidMessage} y puja +${Math.round(increase)} pts`, 'bid');
                updatePriceDisplay();
                
                // Iluminar avatar del pujador
                highlightSpeakingAvatar(bidder);

                // Continuar con siguiente turno
                scheduleNextTurn();
            }
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
        addMessage(`🎉 ¡${soleWinner.name} GANÓ automáticamente con ${finalPrice} pts! 🎉`, 'victory');

        setTimeout(() => {
            takeBtn.style.display = 'block';
            takeBtn.textContent = `💰 ¡ACEPTAR ${finalPrice} pts!`;
            takeBtn.classList.add('pulse-victory');
        }, SubastaConstantes.TIMING_CONFIG.FINAL_DELAY);

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
            
            setTimeout(() => {
                takeBtn.style.display = 'block';
                takeBtn.textContent = `💰 ¡ACEPTAR ${finalPrice} pts!`;
                takeBtn.classList.add('pulse-victory');
            }, SubastaConstantes.TIMING_CONFIG.FINAL_DELAY);
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
            updatePriceDisplay();
        
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
                }, SubastaConstantes.TIMING_CONFIG.HAMMER_FIRST_DELAY || 3000);
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
                
                // 🚨 PROTECCIÓN: Verificar que hammerStep - 1 sea válido
                const resumeIndex = hammerStep - 1;
                if (resumeIndex < 0 || resumeIndex >= hammerResumeChances.length) {
                    console.error(`❌ ERROR: hammerStep inválido: ${hammerStep}`);
                    finishAuction();
                    return;
                }

                const resumeChance = hammerResumeChances[resumeIndex] || 0;
                
                console.log(
                    `🔁 Fase ${hammerStep} -> resumeChance=${(resumeChance*100).toFixed(1)}% | Todas=${hammerResumeChances.map(c=> (c*100).toFixed(1)+'%').join(' / ')}`
                );
                
                if (Math.random() < resumeChance) {
                    // Reducir probabilidad de reanudación de esta fase
                    hammerResumeChances[resumeIndex] = Math.max(
                        0,
                        resumeChance - SubastaConstantes.PROBABILITIES.HAMMER_RESUME_DECREMENT
                    );
        
                    setTimeout(() => {
                        if (isAuctionActive) {
                            isInHammerSequence = false;
                            executeBid();
                        }
                    }, SubastaConstantes.TIMING_CONFIG.MESSAGE_DELAY);
                } else {
                    processHammer();
                }
            }, SubastaConstantes.TIMING_CONFIG.HAMMER_PAUSE);
        };

        const scheduleNextTurn = () => {
            if(!isAuctionActive) return;
            const delay = SubastaConstantes.TIMING_CONFIG.BID_INTERVAL_MIN + 
                          Math.random()*(SubastaConstantes.TIMING_CONFIG.BID_INTERVAL_MAX - SubastaConstantes.TIMING_CONFIG.BID_INTERVAL_MIN);
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
            
            setTimeout(()=>{
                takeBtn.style.display='block';
                takeBtn.textContent=`💰 ¡ACEPTAR ${finalPrice} pts!`;
                takeBtn.classList.add('pulse-victory');
            }, SubastaConstantes.TIMING_CONFIG.FINAL_DELAY);
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
            
            addMessage(SubastaConstantes.getStartMessage(),'system');

            setTimeout(()=>{ if(isAuctionActive) scheduleNextTurn(); }, 1000);
        };

        const takePrice = () => {
            const finalPrice = Math.round(currentPrice);
            const bonusMsg = isRecordBreaking?' ¡BONUS POR RÉCORD PERSONAL! 🏆':'';
            App.state.sellConsumption(challenge.id, finalPrice);
            closeModal();
            const victoryMsg = `🎉 ¡SUBASTA GANADA! Vendiste tu ticket por ${finalPrice} puntos!${bonusMsg}`;
            App.events.emit('showDiscreetMessage', victoryMsg);
        };

        const closeModal = () => {
            isAuctionActive=false;
            clearTimeout(auctionTimeout);
            modal.classList.remove('visible');
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

        updatePriceDisplay();
        modal.classList.add('visible');

        if(isRecordBreaking){
            addMessage('🔥 ¡RACHA RÉCORD = PRECIO x2!','victory');
            setTimeout(()=>{ addMessage('💡 ¡Vender es más rentable que consumir! ¡Inicia la subasta!','system'); },1000);
        } else {
            addMessage('💡 ¡Vender es más rentable que consumir! ¡Inicia la subasta!','system');
        }
    }

    // Registro
    const registerSimpleAuction = () => {
        if(!window.App) window.App={};
        if(!window.App.ui) window.App.ui={};
        if(!window.App.ui.habits) window.App.ui.habits={};
        window.App.ui.habits.showSimpleAuction = showSimpleAuction;
        console.log('🎯 SUBASTA SIMPLE REGISTRADA CORRECTAMENTE');
    };

    registerSimpleAuction();
    if(document.readyState==='loading'){
        document.addEventListener('DOMContentLoaded', registerSimpleAuction);
    }

})(window.App = window.App || {});