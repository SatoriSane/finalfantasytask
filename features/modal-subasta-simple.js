if (typeof SubastaConstantes === 'undefined') {
    console.error('❌ SubastaConstantes no está disponible. Asegúrate de incluir subasta-constantes-simple.js antes de este archivo.');
}

(function(App) {
    'use strict';

    if (!App.ui) App.ui = {};
    if (!App.ui.habits) App.ui.habits = {};

    function showSimpleAuction(challenge) {
        console.log('🎯 SUBASTA SIMPLE INICIADA:', challenge.name);

        const modal = document.getElementById('auctionModal');
        const startBtn = document.getElementById('startAuctionBtn');
        const takeBtn = document.getElementById('takePriceBtn');
        const currentPriceDisplay = document.getElementById('auctionCurrentPrice');
        const historyContainer = document.getElementById('auctionHistory');
        const closeBtn = modal.querySelector('.modal-close-btn');

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
            currentPriceDisplay.textContent = `⭐${Math.round(currentPrice)} pts`;
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
        };
        

        // --- Turnos ---
        const processNextTurn = () => {
            if(!isAuctionActive) return;

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
            
                const removedBidders = [];
                // Hacemos una copia para iterar, ya que modificaremos el array original
                const potentialLeavers = [...activeBidders];
            
                potentialLeavers.forEach(b => {
                    // La salvaguarda: si solo quedan 2, nadie más se retira.
                    if (activeBidders.length <= 2) return;
            
                    // El pujador que hizo la oferta no se retira a sí mismo.
                    if (b === bidder) return;
            
                    // Obtener la probabilidad de retiro según la personalidad del pujador.
                    const retreatChance = SubastaConstantes.PROBABILITIES.EXTREME_BID_RETREAT_CHANCES[b.personality] || 
                                          SubastaConstantes.PROBABILITIES.EXTREME_BID_RETREAT_CHANCES.default;
            
                    // 🎲 Tirar el dado: ¿Se retira o se queda?
                    if (Math.random() < retreatChance) {
                        removedBidders.push(b);
            
                        // Lo eliminamos de la lista de pujadores activos.
                        const index = activeBidders.findIndex(ab => ab === b);
                        if (index > -1) activeBidders.splice(index, 1);
                    }
                });
            
                // Función recursiva para mostrar mensajes de huida uno a uno
                const showRetreatMessagesSequentially = (bidders) => {
                    if (bidders.length === 0) return;
                
                    const [first, ...rest] = bidders;
                
                    // Delay aleatorio entre 1000ms y 4000ms
                    const delay = 1000 + Math.random() * 4000;
                
                    setTimeout(() => {
                        const msg = SubastaConstantes.getFearMessage(first);
                        addMessage(msg, 'system');
                        showRetreatMessagesSequentially(rest);
                    }, delay);
                };
                
            
                if (removedBidders.length > 0) {
                    console.log(`💨 Se retiraron por miedo: ${removedBidders.map(b => b.name).join(', ')}`);
                    showRetreatMessagesSequentially(removedBidders);
                }
                
            }
             else {
                // Puja normal según personalidad
                switch(bidder.personality){
                    case 'aggressive': increasePercent = 0.08 + Math.random()*0.12; break;
                    case 'impulsive': increasePercent = 0.05 + Math.random()*0.10; break;
                    case 'strategic': increasePercent = 0.03 + Math.random()*0.07; break;
                    case 'calculated': increasePercent = 0.02 + Math.random()*0.05; break;
                    case 'passionate': increasePercent = 0.06 + Math.random()*0.09; break;
                    default: increasePercent = 0.04 + Math.random()*0.08; break;
                }
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
        
            if (!isInHammerSequence) {
                isInHammerSequence = true;
                hammerStep = 0;
        
                // Espera especial solo antes del primer mensaje
                setTimeout(() => {
                    if (!isAuctionActive) return;
        
                    addMessage(SubastaConstantes.getHammerMessage(hammerStep), 'hammer');
                    hammerStep++;
        
                    if (hammerStep >= SubastaConstantes.HAMMER_MESSAGES.length) {
                        finishAuction();
                        return;
                    }
        
                    continueHammer();
                }, SubastaConstantes.TIMING_CONFIG.HAMMER_FIRST_DELAY || 3000); // Nueva constante
            } else {
                addMessage(SubastaConstantes.getHammerMessage(hammerStep), 'hammer');
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
                const resumeChance = hammerResumeChances[hammerStep - 1] || 0;
                // 👀 DEBUG: mostrar las chances actuales de reanudación
                console.log(
                    `🔁 Fase ${hammerStep} -> resumeChance=${(resumeChance*100).toFixed(1)}% | Todas=${hammerResumeChances.map(c=> (c*100).toFixed(1)+'%').join(' / ')}`
                );
                if (Math.random() < resumeChance) {
                    // Reducir probabilidad de reanudación de esta fase
                    hammerResumeChances[hammerStep - 1] = Math.max(
                        0,
                        resumeChance - SubastaConstantes.PROBABILITIES.HAMMER_RESUME_DECREMENT
                    );
        
                    setTimeout(() => {
                        isInHammerSequence = false;
                        executeBid();
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

        // --- Finalizar subasta ---
        const finishAuction = () => {
            isAuctionActive=false;
            clearTimeout(auctionTimeout);
            const winner = lastBidder || activeBidders[0] || {name:'Coleccionista VIP', emoji:'🏆'};
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
            generateBidders();
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
            if(navigator.vibrate) navigator.vibrate([100,50,100,50,200]);
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
