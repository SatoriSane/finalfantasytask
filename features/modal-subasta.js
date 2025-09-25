(function(App) {
    'use strict';
    
    // Asegura que App.ui.habits existe
    if (!App.ui) App.ui = {};
    if (!App.ui.habits) App.ui.habits = {};

    // ⚙️ CONFIGURACIÓN DE TIMING CENTRALIZADA ⚙️
    // Modifica estos valores para ajustar el ritmo y duración de la subasta
    const TIMING_CONFIG = {
        // --- Mensajes y Animaciones ---
        MESSAGE_MIN_DELAY: 1500,           // Delay mínimo entre mensajes del historial
        PRICE_ANIMATION_DURATION: 1000,     // Duración de la animación del precio
        FORCE_DELAY_AMOUNT: 4500,          // Delay forzado para mensajes importantes
        
        // --- Momentos de Incertidumbre ---
        UNCERTAINTY_PAUSE_MIN: 6000,       // Pausa mínima durante incertidumbre
        UNCERTAINTY_PAUSE_MAX: 12000,      // Pausa máxima durante incertidumbre
        POST_UNCERTAINTY_BID_DELAY: 5000,  // Delay antes de pujar tras incertidumbre
        
        // --- Secuencia de Finalización ---
        FINISH_AUCTION_DELAY: 2500,        // Delay antes de mostrar ganador
        VICTORY_MESSAGE_DELAY: 2500,       // Delay forzado para mensaje de victoria
        ACCEPT_BUTTON_DELAY: 2000,         // Delay para mostrar botón de aceptar
        MOTIVATIONAL_MESSAGE_DELAY: 3500,  // Delay para mensaje motivacional final
        
        // --- Intervalos de Tick por Tipo de Subasta ---
        AUCTION_INTERVALS: {
            'rápida':  { min: 3000, max: 4500 },   // Subastas rápidas
            'épica':   { min: 4000, max: 8000 },   // Subastas largas y dramáticas
            'volátil': { min: 2500, max: 6000 },   // Intervalos muy variables
            'normal':  { min: 4000, max: 7500 }    // Intervalo equilibrado
        },
        
        // --- Mensajes de Inicio por Tipo ---
        RECORD_MESSAGE_DELAY: 1000         // Delay para mensaje después de récord
    };

    // 🏆 SISTEMA DE SUBASTA ÉPICA - FINAL FANTASY & ANIME 🏆
    // Pujadores legendarios de FF y anime con personalidades únicas
    const VIRTUAL_BIDDERS = [
        // Final Fantasy VII
        { name: 'Cloud', personality: 'strategic', emoji: '⚔️' },
        { name: 'Sephiroth', personality: 'aggressive', emoji: '🗡️' },
        { name: 'Aerith', personality: 'passionate', emoji: '🌸' },
        { name: 'Tifa', personality: 'aggressive', emoji: '👊' },
        { name: 'Barret', personality: 'impulsive', emoji: '💥' },
        { name: 'Yuffie', personality: 'impulsive', emoji: '🥷' },
        { name: 'Vincent', personality: 'strategic', emoji: '🦇' },
        { name: 'Cid', personality: 'impulsive', emoji: '🚁' },
        { name: 'RedXIII', personality: 'calculated', emoji: '🦁' },
        
        // Final Fantasy VIII
        { name: 'Squall', personality: 'calculated', emoji: '🦁' },
        { name: 'Seifer', personality: 'aggressive', emoji: '🔥' },
        { name: 'Rinoa', personality: 'passionate', emoji: '💫' },
        { name: 'Quistis', personality: 'strategic', emoji: '👩‍🏫' },
        { name: 'Zell', personality: 'impulsive', emoji: '👊' },
        { name: 'Selphie', personality: 'passionate', emoji: '🎀' },
        { name: 'Irvine', personality: 'strategic', emoji: '🎯' },
        { name: 'Artemisa', personality: 'aggressive', emoji: '⏰' },
        
        // Final Fantasy IX
        { name: 'Zidane', personality: 'impulsive', emoji: '🐒' },
        { name: 'Garnet', personality: 'passionate', emoji: '👑' },
        { name: 'Vivi', personality: 'calculated', emoji: '🔮' },
        { name: 'Steiner', personality: 'strategic', emoji: '🛡️' },
        
        // Final Fantasy X
        { name: 'Tidus', personality: 'passionate', emoji: '🌊' },
        { name: 'Yuna', personality: 'calculated', emoji: '🙏' },
        { name: 'Wakka', personality: 'impulsive', emoji: '🏐' },
        { name: 'Lulu', personality: 'strategic', emoji: '🔮' },
        { name: 'Kimahri', personality: 'strategic', emoji: '🦏' },
        { name: 'Rikku', personality: 'impulsive', emoji: '⚡' },
        { name: 'Auron', personality: 'calculated', emoji: '🗡️' },
        { name: 'Jecht', personality: 'aggressive', emoji: '⚔️' },
        
        // Dragon Ball
        { name: 'Goku', personality: 'passionate', emoji: '🥋' },
        { name: 'Vegeta', personality: 'aggressive', emoji: '👑' },
        { name: 'Gohan', personality: 'calculated', emoji: '📚' },
        { name: 'Piccolo', personality: 'strategic', emoji: '👹' },
        { name: 'Krillin', personality: 'impulsive', emoji: '⚪' },
        { name: 'Bulma', personality: 'strategic', emoji: '🔬' },
        { name: 'Frieza', personality: 'aggressive', emoji: '👑' },
        { name: 'Cell', personality: 'calculated', emoji: '🦗' },
        { name: 'Trunks', personality: 'strategic', emoji: '⚔️' },
        
        // Death Note
        { name: 'Light', personality: 'strategic', emoji: '📓' },
        { name: 'L', personality: 'calculated', emoji: '🍰' },
        { name: 'Misa', personality: 'passionate', emoji: '💀' },
        { name: 'Near', personality: 'calculated', emoji: '🎲' },
        { name: 'Mello', personality: 'impulsive', emoji: '🍫' },
        
        // Naruto
        { name: 'Naruto', personality: 'impulsive', emoji: '🍜' },
        { name: 'Sasuke', personality: 'aggressive', emoji: '⚡' },
        { name: 'Sakura', personality: 'passionate', emoji: '🌸' },
        { name: 'Kakashi', personality: 'strategic', emoji: '👁️' },
        { name: 'Gaara', personality: 'aggressive', emoji: '🏜️' },
        { name: 'Rock Lee', personality: 'passionate', emoji: '🥋' },
        { name: 'Neji', personality: 'calculated', emoji: '👁️' },
        { name: 'Shikamaru', personality: 'strategic', emoji: '🦌' },
        { name: 'Hinata', personality: 'passionate', emoji: '💜' },
        { name: 'Itachi', personality: 'strategic', emoji: '🐦‍⬛' },
        
        // Attack on Titan
        { name: 'Eren', personality: 'aggressive', emoji: '⚔️' },
        { name: 'Mikasa', personality: 'strategic', emoji: '🗡️' },
        { name: 'Armin', personality: 'calculated', emoji: '🧠' },
        { name: 'Levi', personality: 'aggressive', emoji: '💀' },
        { name: 'Erwin', personality: 'strategic', emoji: '🎖️' },
        { name: 'Annie', personality: 'calculated', emoji: '💎' },
        
        // One Piece
        { name: 'Luffy', personality: 'impulsive', emoji: '🏴‍☠️' },
        { name: 'Zoro', personality: 'aggressive', emoji: '⚔️' },
        { name: 'Nami', personality: 'strategic', emoji: '💰' },
        { name: 'Sanji', personality: 'passionate', emoji: '🚬' },
        { name: 'Usopp', personality: 'impulsive', emoji: '🎯' },
        { name: 'Chopper', personality: 'passionate', emoji: '🦌' },
        { name: 'Robin', personality: 'calculated', emoji: '📚' },
        { name: 'Franky', personality: 'impulsive', emoji: '🤖' },
        
        // Hunter x Hunter
        { name: 'Gon', personality: 'impulsive', emoji: '🎣' },
        { name: 'Killua', personality: 'strategic', emoji: '⚡' },
        { name: 'Kurapika', personality: 'calculated', emoji: '⛓️' },
        { name: 'Leorio', personality: 'passionate', emoji: '💼' },
        { name: 'Hisoka', personality: 'aggressive', emoji: '🃏' },
        
        // Slam Dunk
        { name: 'Sakuragi', personality: 'impulsive', emoji: '🏀' },
        { name: 'Rukawa', personality: 'calculated', emoji: '🦊' },
        { name: 'Akagi', personality: 'strategic', emoji: '🦍' },
        { name: 'Mitsui', personality: 'passionate', emoji: '🔥' },
        
        // Shin-chan
        { name: 'Shinnosuke', personality: 'impulsive', emoji: '👶' },
        { name: 'Misae', personality: 'aggressive', emoji: '👩' },
        
        // Doraemon
        { name: 'Doraemon', personality: 'strategic', emoji: '🤖' },
        { name: 'Nobita', personality: 'impulsive', emoji: '👦' },
        
        // Clannad
        { name: 'Tomoya', personality: 'strategic', emoji: '🌸' },
        { name: 'Nagisa', personality: 'passionate', emoji: '🎭' },
        
        // Inuyasha
        { name: 'Inuyasha', personality: 'aggressive', emoji: '🗡️' },
        { name: 'Kagome', personality: 'passionate', emoji: '🏹' },
        { name: 'Sesshomaru', personality: 'calculated', emoji: '🌙' },
        
        // Cardcaptor Sakura
        { name: 'Sakura', personality: 'passionate', emoji: '🌸' },
        { name: 'Syaoran', personality: 'strategic', emoji: '⚔️' },
        
        // Great Teacher Onizuka
        { name: 'Onizuka', personality: 'impulsive', emoji: '🏍️' },
        { name: 'Fuyutsuki', personality: 'calculated', emoji: '👩‍🏫' }
    ];

    const MOTIVATIONAL_MESSAGES = [
        '¡Excelente decisión! 🎉',
        '¡Tu fuerza de voluntad es increíble! 💪',
        '¡Cada venta te hace más fuerte! ⚡',
        '¡Estás rompiendo el ciclo! 🔥',
        '¡Tu futuro yo te lo agradecerá! 🌟'
    ];

    // 🎭 MENSAJES ESPECÍFICOS POR PERSONAJE - Basados en su personalidad y trasfondo
    const CHARACTER_SPECIFIC_MESSAGES = {
        // Final Fantasy VII
        'Cloud': [
            'recuerda algo importante y puja',
            'siente que debe proteger este ticket',
            'actúa como un verdadero SOLDIER',
            'no dejará que Shinra se lo lleve'
        ],
        'Sephiroth': [
            'considera que merece lo mejor',
            'no acepta ser superado por nadie',
            'su orgullo no le permite perder',
            'desata su poder para conseguirlo'
        ],
        'Aerith': [
            'siente que el planeta le dice que puje',
            'quiere ayudar con su compra',
            'su corazón le dice que es importante',
            'lucha por un futuro mejor'
        ],
        'Tifa': [
            'no se rinde fácilmente',
            'lucha con toda su determinación',
            'sus puños hablan por ella',
            'defiende lo que considera justo'
        ],
        'Barret': [
            '¡No dejará que se lo quiten!',
            'lucha por el futuro de Marlene',
            'su brazo-arma está listo',
            '¡Por AVALANCHE!'
        ],
        
        // Final Fantasy VIII - Con pérdida de memoria por GF
        'Squall': [
            'no recuerda por qué, pero debe tenerlo',
            'algo en su memoria le dice que puje',
            'olvida el precio anterior y puja más',
            'los GF le nublan el juicio'
        ],
        'Artemisa': [
            'manipula el tiempo para pujar primero',
            'su poder temporal le da ventaja',
            'comprime el tiempo de la subasta',
            'no acepta la derrota temporal'
        ],
        'Rinoa': [
            'olvida cuánto llevaba pujado',
            'los GF le confunden los números',
            'actúa por impulso romántico',
            'quiere impresionar a Squall'
        ],
        'Seifer': [
            'compite contra Squall por principio',
            'su rivalidad no conoce límites',
            'olvida su presupuesto por los GF',
            'debe demostrar que es superior'
        ],
        'Zell': [
            'se emociona y olvida el precio',
            'los GF le hacen perder la cuenta',
            'puja como si fuera un combate',
            'su energía es incontrolable'
        ],
        
        // Dragon Ball
        'Goku': [
            'quiere entrenar con este ticket',
            'siente que le hará más fuerte',
            'su instinto de lucha se activa',
            'nunca se rinde en una batalla'
        ],
        'Vegeta': [
            'su orgullo saiyajin está en juego',
            'debe superar a Kakaroto',
            'no acepta ser el segundo',
            'el príncipe no conoce la derrota'
        ],
        'Frieza': [
            'considera que todo le pertenece',
            'su poder debe ser respetado',
            'no tolera la insubordinación',
            'destruirá a quien se oponga'
        ],
        
        // Naruto
        'Naruto': [
            'cree en su ninja way',
            'nunca abandona, dattebayo!',
            'protegerá lo importante',
            'su determinación no tiene límites'
        ],
        'Sasuke': [
            'busca poder para su venganza',
            'debe ser más fuerte que Naruto',
            'su sharingan ve la oportunidad',
            'la venganza justifica todo'
        ],
        'Itachi': [
            'todo es por el bien de la aldea',
            'sus sacrificios tienen propósito',
            'actúa desde las sombras',
            'protege lo que realmente importa'
        ],
        
        // Death Note
        'Light': [
            'todo está según su plan',
            'será el dios del nuevo mundo',
            'su justicia debe prevalecer',
            'eliminará cualquier obstáculo'
        ],
        'L': [
            'hay un 85% de probabilidad de ganar',
            'sus cálculos nunca fallan',
            'la lógica dicta que debe pujar',
            'resuelve el misterio del precio'
        ],
        
        // One Piece
        'Luffy': [
            '¡Quiere ser el Rey de los Piratas!',
            'protegerá a sus nakama',
            'su sombrero de paja está en juego',
            'nunca abandona a un amigo'
        ],
        'Zoro': [
            'se perdió pero encontró la subasta',
            'cortará cualquier precio alto',
            'sus tres espadas están listas',
            'nunca retrocede en una lucha'
        ],
        
        // Attack on Titan
        'Eren': [
            'luchará por la libertad',
            'no se someterá a los titanes',
            'su determinación es inquebrantable',
            'avanzará hasta destruir al enemigo'
        ],
        'Levi': [
            'limpiará esta subasta de competencia',
            'su técnica es perfecta',
            'no tolera la mediocridad',
            'cortará por lo sano'
        ]
    };

    // Mensajes genéricos por personalidad (fallback)
    const BIDDER_MESSAGES = {
        aggressive: [
            'ataca sin piedad',
            'desata su poder',
            'no conoce límites',
            'lucha hasta el final'
        ],
        strategic: [
            'analiza la situación',
            'ejecuta su estrategia',
            'calcula cada movimiento',
            'espera el momento exacto'
        ],
        impulsive: [
            'actúa por instinto',
            'se lanza sin pensar',
            'sigue su corazón',
            'no puede contenerse'
        ],
        calculated: [
            'hace cálculos precisos',
            'analiza cada detalle',
            'busca la lógica perfecta',
            'estudia las probabilidades'
        ],
        passionate: [
            'lucha por sus sueños',
            'puja con el corazón',
            'muestra gran determinación',
            'sigue su pasión'
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
                animatePrice(lastDisplayedPrice, roundedPrice);
                lastDisplayedPrice = roundedPrice;
            } else {
                currentPriceDisplay.textContent = `⚡${roundedPrice} pts`;
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
        const MAX_MESSAGES = 7;
        let lastMessageTime = 0;
        
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
            if (!immediate && (timeSinceLastMessage < TIMING_CONFIG.MESSAGE_MIN_DELAY || forceDelay)) {
                const delay = forceDelay ? TIMING_CONFIG.FORCE_DELAY_AMOUNT : (TIMING_CONFIG.MESSAGE_MIN_DELAY - timeSinceLastMessage);
                setTimeout(showMessage, delay);
            } else {
                showMessage();
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
        let auctionEnergy = 100;
        let lastBidTime = Date.now();
        let isInDecisionPause = false;
        let uncertaintyMoments = 0;
        let lastBidder = null;
        
        // 🎲 Variables para hacer cada subasta única
        let auctionType = '';
        let auctionIntensity = 0;
        let maxBidLimit = 0;
        let uncertaintyFrequency = 0;

        // 🎲 Determina el tipo de subasta aleatoriamente
        const determineAuctionType = () => {
            const rand = Math.random();
            if (rand < 0.2) {
                // 20% - Subasta RÁPIDA (termina pronto, precios moderados)
                auctionType = 'rápida';
                auctionIntensity = 0.3 + Math.random() * 0.4; // 30-70%
                maxBidLimit = basePrice * (1.5 + Math.random() * 2); // 1.5x-3.5x
                uncertaintyFrequency = 0.6; // Más incertidumbre = termina antes
                auctionEnergy = 30 + Math.random() * 40; // Energía baja
                addHistoryMessage('⚡ Subasta EXPRESS detectada - ¡Pocos pujadores!', 'system');
            } else if (rand < 0.4) {
                // 20% - Subasta ÉPICA (larga duración, precios altísimos)
                auctionType = 'épica';
                auctionIntensity = 0.8 + Math.random() * 0.2; // 80-100%
                maxBidLimit = basePrice * (8 + Math.random() * 12); // 8x-20x
                uncertaintyFrequency = 0.2; // Poca incertidumbre = dura más
                auctionEnergy = 120 + Math.random() * 80; // Energía alta
                addHistoryMessage('🔥 ¡SUBASTA ÉPICA! Grandes coleccionistas detectados', 'victory');
            } else if (rand < 0.6) {
                // 20% - Subasta VOLÁTIL (impredecible, saltos grandes)
                auctionType = 'volátil';
                auctionIntensity = 0.4 + Math.random() * 0.5; // 40-90%
                maxBidLimit = basePrice * (3 + Math.random() * 8); // 3x-11x
                uncertaintyFrequency = 0.4;
                auctionEnergy = 60 + Math.random() * 80;
                addHistoryMessage('🎢 Subasta VOLÁTIL - ¡Prepárate para sorpresas!', 'uncertainty');
            } else {
                // 40% - Subasta NORMAL (equilibrada)
                auctionType = 'normal';
                auctionIntensity = 0.5 + Math.random() * 0.3; // 50-80%
                maxBidLimit = basePrice * (2 + Math.random() * 4); // 2x-6x
                uncertaintyFrequency = 0.35;
                auctionEnergy = 70 + Math.random() * 60;
                addHistoryMessage('🎯 Subasta equilibrada - ¡Que comience la batalla!', 'system');
            }
            
            console.log(`🎲 Tipo de subasta: ${auctionType.toUpperCase()}`);
            console.log(`📊 Intensidad: ${Math.round(auctionIntensity * 100)}%`);
            console.log(`💰 Límite máximo: ${Math.round(maxBidLimit)} pts`);
        };

        // 🚀 Inicia la subasta épica VARIABLE
        const startAuction = () => {
            if (isAuctionInProgress) return;
            isAuctionInProgress = true;
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
                    // Usar la frecuencia de incertidumbre específica del tipo de subasta
                    let uncertaintyProbability = uncertaintyFrequency;
                    if (bidCount >= 5) uncertaintyProbability += 0.1;
                    if (bidCount >= 8) uncertaintyProbability += 0.2;
                    if (auctionEnergy < 40) uncertaintyProbability += 0.15;
                    
                    // Ajustes por tipo de subasta
                    if (auctionType === 'rápida' && bidCount >= 3) uncertaintyProbability += 0.3;
                    if (auctionType === 'épica' && bidCount < 10) uncertaintyProbability -= 0.2;
                    if (auctionType === 'volátil') uncertaintyProbability += Math.random() * 0.3 - 0.15; // ±15%
                    
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
                const uncertaintyMessages = [
                    '🤔 Los pujadores están dudando...',
                    '⏳ Momento de reflexión...',
                    '🧐 Analizando la situación...',
                    '💭 ¿Alguien más pujará?',
                    '😶 El silencio invade la sala...',
                    '👀 Todos se observan con cautela...',
                    '😏 ¿Será un farol o una retirada?',
                    '🕰️ El tiempo corre, nadie se decide...',
                    '😬 Tensión en el aire...',
                    '📉 El entusiasmo parece enfriarse...',
                    '🔮 Nadie sabe lo que ocurrirá...',
                    '😯 Una pausa inesperada...',
                    '🙄 El público comienza a impacientarse...',
                    '🤨 Todos miden su próximo movimiento...',
                    '😑 Los pujadores respiran hondo antes de decidir...'
                  ];
                addHistoryMessage(uncertaintyMessages[Math.floor(Math.random() * uncertaintyMessages.length)], 'uncertainty');
                
                // Usar configuración de timing para la pausa de incertidumbre
                const uncertaintyDuration = TIMING_CONFIG.UNCERTAINTY_PAUSE_MIN + 
                    Math.random() * (TIMING_CONFIG.UNCERTAINTY_PAUSE_MAX - TIMING_CONFIG.UNCERTAINTY_PAUSE_MIN);
                setTimeout(resolveUncertainty, uncertaintyDuration);
            };
            
            const resolveUncertainty = () => {
                isInDecisionPause = false;
                let continueProbability = 0.75;
                if (auctionEnergy < 30) continueProbability -= 0.2;
                if (bidCount >= 6) continueProbability -= 0.1;
                if (currentPrice > basePrice * 3) continueProbability -= 0.1;
                continueProbability = Math.max(0.3, continueProbability);
                
                if (Math.random() < continueProbability) {
                    const encouragingMessages = [
                        '🔥 ¡Alguien no se rinde!',
                        '⚡ ¡La competencia continúa!',
                        '💪 ¡Hay más interés!',
                        '🚀 ¡Esto se está calentando!',
                        '🏆 ¡Nadie quiere quedarse atrás!',
                        '🤯 ¡La puja sube y sube!',
                        '🔥 ¡El ambiente está al rojo vivo!',
                        '😮 ¡Sorpresa! Otro ofertante entra en juego!',
                        '🎯 ¡La victoria está cada vez más cerca!',
                        '👊 ¡Esto se pone intenso!',
                        '📈 ¡El precio sigue escalando!',
                        '💥 ¡Puja explosiva!',
                        '🤩 ¡El público enloquece con esta subasta!',
                        '😏 ¡Nadie da su brazo a torcer!',
                        '✨ ¡Cada vez más emocionante!',
                        '🤑 ¡La codicia mueve montañas!',
                        '🥵 ¡Nadie quiere soltarlo todavía!',
                        '🦾 ¡La fuerza de los pujadores no tiene límites!',
                        '😎 ¡Parece que la cosa va para largo!'
                      ];
                    addHistoryMessage(encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)], 'system');
                    setTimeout(processBid, TIMING_CONFIG.POST_UNCERTAINTY_BID_DELAY);
                } else {
                    // ARREGLADO: Marcar que la subasta debe terminar después de esta resolución
                    isAuctionInProgress = false;
                    const finalMessages = ['⏰ ¡Tiempo agotado!', '🏁 ¡No hay más pujas!', '✋ ¡Nadie más se atreve!'];
                    addHistoryMessage(finalMessages[Math.floor(Math.random() * finalMessages.length)], 'system');
                    setTimeout(finishAuction, TIMING_CONFIG.FINISH_AUCTION_DELAY);
                }
            };
            
            const processBid = () => {
                bidCount++;
                lastBidTime = Date.now();
                
                // 🚫 Seleccionar pujador evitando repeticiones consecutivas
                let activeBidder;
                let attempts = 0;
                const maxAttempts = 10;
                
                do {
                    activeBidder = activeBidders[Math.floor(Math.random() * activeBidders.length)];
                    attempts++;
                } while (
                    activeBidder === lastBidder && 
                    activeBidders.length > 1 && 
                    attempts < maxAttempts
                );
                
                // Actualizar el tiempo de la última puja del personaje
                activeBidder.lastBidTime = Date.now();
                
                const priceRatio = currentPrice / basePrice;
                auctionEnergy -= (2 + Math.random() * 3);
                if (priceRatio > 3) auctionEnergy -= 5;
                
                let increase = 0;
                const energyFactor = Math.max(0.3, auctionEnergy / 100);
                
// Usar el límite específico del tipo de subasta
if (currentPrice < maxBidLimit) {
    // Ajustar probabilidades de pujas extremas según el tipo de subasta
    let extremeProbability = 0.1; // Base 10%
    if (auctionType === 'épica') extremeProbability = 0.2; // 20% en subastas épicas
    if (auctionType === 'volátil') extremeProbability = 0.25; // 25% en volátiles
    if (auctionType === 'rápida') extremeProbability = 0.05; // 5% en rápidas
    
    switch (activeBidder.personality) {
        case 'aggressive':
            if (Math.random() < extremeProbability) {
                // Puja BRUTAL - multiplicar por intensidad de subasta
                increase = currentPrice * (0.4 + Math.random() * 0.8) * energyFactor * auctionIntensity;
            } else {
                // Normal ajustado por intensidad
                increase = Math.max(2, currentPrice * (0.08 + Math.random() * 0.15) * energyFactor * auctionIntensity);
            }
            break;

        case 'strategic':
            // Strategic nunca hace pujas extremas, pero se ajusta a la intensidad
            increase = Math.max(1, currentPrice * (0.03 + Math.random() * 0.04) * energyFactor * auctionIntensity);
            break;

        case 'impulsive':
            if (Math.random() < extremeProbability * 1.5) { // 50% más probable que aggressive
                // Puja IMPULSIVA EXTREMA
                increase = currentPrice * (0.3 + Math.random() * 1.2) * energyFactor * auctionIntensity;
            } else {
                // Normal pero más variable
                increase = Math.max(3, currentPrice * (0.06 + Math.random() * 0.2) * energyFactor * auctionIntensity);
            }
            break;

        case 'calculated':
            // Muy medido, apenas se ve afectado por la intensidad
            increase = Math.max(1, currentPrice * (0.02 + Math.random() * 0.03) * energyFactor * (0.5 + auctionIntensity * 0.5));
            break;

        case 'passionate':
            if (Math.random() < extremeProbability) {
                // Arrebato pasional
                increase = currentPrice * (0.2 + Math.random() * 0.5) * energyFactor * auctionIntensity;
            } else {
                increase = Math.max(2, currentPrice * (0.04 + Math.random() * 0.08) * energyFactor * auctionIntensity);
            }
            break;
    }
}

                
                if (increase > 0) {
                    currentPrice += increase;
                    lastBidder = activeBidder;
                    
                    const increaseAmount = Math.round(increase);
                    const increasePercentage = (increase / (currentPrice - increase)) * 100;
                    
                    // Determinar si es una puja extrema (más del 30% de incremento)
                    let bidMessage = '';
                    if (increasePercentage > 30) {
                        // PUJAS EXTREMAS - Mensajes específicos por personaje
                        const extremeCharacterMessages = {
                            'Sephiroth': `${activeBidder.emoji} ${activeBidder.name} ¡DESCIENDE DEL CIELO! ¡${increaseAmount} pts de poder divino!`,
                            'Vegeta': `${activeBidder.emoji} ${activeBidder.name} ¡FINAL FLASH! ¡${increaseAmount} pts de orgullo saiyajin!`,
                            'Frieza': `${activeBidder.emoji} ${activeBidder.name} ¡ESTO ES MI PODER REAL! ¡${increaseAmount} pts!`,
                            'Squall': `${activeBidder.emoji} ${activeBidder.name} ¡Los GF le confunden! ¡Puja ${increaseAmount} pts sin recordar por qué!`,
                            'Artemisa': `${activeBidder.emoji} ${activeBidder.name} ¡COMPRIME EL TIEMPO! ¡${increaseAmount} pts en un instante!`,
                            'Seifer': `${activeBidder.emoji} ${activeBidder.name} ¡Su memoria falla por los GF! ¡${increaseAmount} pts sin control!`,
                            'Light': `${activeBidder.emoji} ${activeBidder.name} ¡TODO SEGÚN EL KEIKAKU! ¡${increaseAmount} pts calculados!`,
                            'Eren': `${activeBidder.emoji} ${activeBidder.name} ¡TATAKAE! ¡${increaseAmount} pts por la libertad!`,
                            'Levi': `${activeBidder.emoji} ${activeBidder.name} ¡Corta la competencia! ¡${increaseAmount} pts limpios!`,
                            'Naruto': `${activeBidder.emoji} ${activeBidder.name} ¡RASENGAN! ¡${increaseAmount} pts, dattebayo!`,
                            'Luffy': `${activeBidder.emoji} ${activeBidder.name} ¡GOMU GOMU NO PUJA! ¡${increaseAmount} pts elásticos!`
                        };
                        
                        if (extremeCharacterMessages[activeBidder.name]) {
                            bidMessage = extremeCharacterMessages[activeBidder.name];
                        } else {
                            // Fallback a mensajes genéricos por personalidad
                            const extremeMessages = {
                                'aggressive': [
                                    `${activeBidder.emoji} ${activeBidder.name} ¡EXPLOTA! ¡PUJA BRUTAL DE ${increaseAmount} pts!`,
                                    `${activeBidder.emoji} ${activeBidder.name} ¡ATAQUE DEVASTADOR! +${increaseAmount} pts`
                                ],
                                'impulsive': [
                                    `${activeBidder.emoji} ${activeBidder.name} ¡SE VUELVE LOCO! ¡${increaseAmount} pts por impulso!`,
                                    `${activeBidder.emoji} ${activeBidder.name} ¡IMPULSO DESCONTROLADO! +${increaseAmount} pts`
                                ],
                                'passionate': [
                                    `${activeBidder.emoji} ${activeBidder.name} ¡ARREBATO PASIONAL! ¡${increaseAmount} pts!`,
                                    `${activeBidder.emoji} ${activeBidder.name} ¡PASIÓN DESATADA! ¡${increaseAmount} pts!`
                                ]
                            };
                            
                            if (extremeMessages[activeBidder.personality]) {
                                const messages = extremeMessages[activeBidder.personality];
                                bidMessage = messages[Math.floor(Math.random() * messages.length)];
                            } else {
                                bidMessage = `${activeBidder.emoji} ${activeBidder.name} ¡PUJA EXTREMA! ¡${increaseAmount} pts!`;
                            }
                        }
                    } else {
                        // Pujas normales - Usar mensajes específicos del personaje si existen
                        let bidderAction;
                        
                        if (CHARACTER_SPECIFIC_MESSAGES[activeBidder.name]) {
                            // Usar mensaje específico del personaje
                            const characterMessages = CHARACTER_SPECIFIC_MESSAGES[activeBidder.name];
                            bidderAction = characterMessages[Math.floor(Math.random() * characterMessages.length)];
                        } else {
                            // Fallback a mensajes genéricos por personalidad
                            const personalityMessages = BIDDER_MESSAGES[activeBidder.personality];
                            bidderAction = personalityMessages[Math.floor(Math.random() * personalityMessages.length)];
                        }
                        
                        bidMessage = `${activeBidder.emoji} ${activeBidder.name} ${bidderAction} y puja ${increaseAmount} pts más`;
                    }
                    
                    // Vibración más intensa para pujas extremas
                    if (navigator.vibrate) {
                        if (increasePercentage > 30) {
                            navigator.vibrate([150, 50, 150]); // Vibración doble para pujas extremas
                        } else {
                            navigator.vibrate(100); // Vibración normal
                        }
                    }
                    
                    // Mensaje aparece inmediatamente
                    addHistoryMessage(bidMessage, 'bid', false, true);
                    
                    // Animación del precio
                    updateUI(true); 
                    
                    console.log(`💰 Puja ${bidCount}: ${activeBidder.name} - +${increaseAmount} pts (${Math.round(increasePercentage)}%) (Total: ${Math.round(currentPrice)}) [${auctionType.toUpperCase()}]`);
                    
                } else {
                    auctionEnergy -= 10;
                    addHistoryMessage(`${activeBidder.emoji} ${activeBidder.name} duda y no puja`, 'uncertainty');
                    console.log('📉 Sin puja, energía reducida');
                }
            };
            
            // Usar configuración de intervalos según el tipo de subasta
            const intervalConfig = TIMING_CONFIG.AUCTION_INTERVALS[auctionType] || TIMING_CONFIG.AUCTION_INTERVALS['normal'];
            const intervalDuration = intervalConfig.min + Math.random() * (intervalConfig.max - intervalConfig.min);
            
            auctionInterval = setInterval(processAuctionTick, intervalDuration);
        };
        
        // 🏆 Finaliza la subasta con celebración
        const finishAuction = () => {
            clearInterval(auctionInterval);
            isAuctionInProgress = false;
            
            const winner = lastBidder || activeBidders[0] || { name: '🏆 Coleccionista VIP', emoji: '🏆' };
            const victoryMessage = `🎉 ¡${winner.name} GANÓ con ${Math.round(currentPrice)} pts! 🎉`;
            addHistoryMessage(victoryMessage, 'victory', true);
            
            console.log(`🏆 Subasta finalizada. Ganador: ${winner.name} con ${Math.round(currentPrice)} pts`);
            
            // Mostrar botón de aceptar con delay configurado
            setTimeout(() => {
                takeBtn.style.display = 'block';
                takeBtn.innerHTML = `
                    <span class="btn-icon">💰</span>
                    <span class="btn-text">¡ACEPTAR ${Math.round(currentPrice)} PTS!</span>
                `;
            }, TIMING_CONFIG.ACCEPT_BUTTON_DELAY);
            
            // Mensaje motivacional con delay configurado
            setTimeout(() => {
                const motivationalMsg = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
                addHistoryMessage(motivationalMsg, 'system', true);
            }, TIMING_CONFIG.MOTIVATIONAL_MESSAGE_DELAY);
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