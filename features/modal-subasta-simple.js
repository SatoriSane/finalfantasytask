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
            const numBidders = 3 + Math.floor(Math.random()*4);
            activeBidders = [];
            const pool = [...SubastaConstantes.VIRTUAL_BIDDERS];
            for(let i=0; i<numBidders && pool.length>0; i++){
                const idx = Math.floor(Math.random()*pool.length);
                activeBidders.push(pool.splice(idx,1)[0]);
            }
            console.log(`👥 Pujadores: ${activeBidders.map(b=>b.name).join(', ')}`);
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
            let bidder, attempts=0;
            do{
                bidder = activeBidders[Math.floor(Math.random()*activeBidders.length)];
                attempts++;
            }while(bidder === lastBidder && attempts<5 && activeBidders.length>1);

            // 🎲 Verificar si es una puja extrema (2% probabilidad)
            const isExtremeBid = Math.random() < SubastaConstantes.PROBABILITIES.EXTREME_BID_CHANCE;
            
            let increasePercent;
            if (isExtremeBid) {
                // Puja extrema: 50% a 200% de aumento
                increasePercent = 0.50 + Math.random() * 1.50; // 50% - 200%
                console.log(`🔥 ¡PUJA EXTREMA! ${bidder.name} aumenta ${(increasePercent*100).toFixed(1)}%`);
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
            }

            const increase = Math.max(1, currentPrice*increasePercent);
            currentPrice += increase;
            lastBidder = bidder;

            // Usar mensaje apropiado (normal o extremo)
            const bidMessage = SubastaConstantes.getBidMessage(bidder, isExtremeBid);
            const messageType = isExtremeBid ? 'extreme-bid' : 'bid';
            
            addMessage(`${bidMessage} y puja +${Math.round(increase)} pts`, messageType);
            updatePriceDisplay();
            if (isExtremeBid) {
                // 🚨 PUJA EXTREMA -> activar inmediatamente la secuencia del martillo
                setTimeout(() => {
                    if (isAuctionActive) processHammer();
                }, SubastaConstantes.TIMING_CONFIG.MESSAGE_DELAY || 3500);
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
                closeBtn.style.display='block';
                closeBtn.disabled=false;
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
