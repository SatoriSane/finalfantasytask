// subasta-constantes-simple.js - VERSIÓN COMPLETAMENTE SIMPLIFICADA
(function(global) {
    'use strict';

    global.SubastaConstantes = {
        // ⚙️ CONFIGURACIÓN SIMPLE DE TIMING
        TIMING_CONFIG: {
            MESSAGE_DELAY: 1500,              // Delay entre mensajes
            PRICE_ANIMATION_DURATION: 800,   // Duración animación precio
            BID_INTERVAL_MIN: 1000,          // Intervalo mínimo entre pujas
            BID_INTERVAL_MAX: 3000,          // Intervalo máximo entre pujas
            HAMMER_PAUSE: 2500,              // Pausa en cada frase del hammer
            FINAL_DELAY: 2000                // Delay antes de mostrar botón final
        },

        // 🎲 PROBABILIDADES SIMPLES
        PROBABILITIES: {
            HAMMER_CHANCE: 0.15,              // 20% probabilidad inicial de que inicie la secuencia del martillo en lugar de puja
            HAMMER_RESUME_CHANCES: [0.25, 0.25, 0.3], //probabilidad de reanurarse para cada fase
            HAMMER_BONUS_INCREMENT: 0.05,        // incremento de la probabilidad acumulada del martillo cada vez que aparece
            HAMMER_RESUME_DECREMENT: 0.1       // decremento de la probabilidad de reanudación de esta fase después de que se reanuda
        },

        // 🔨 SECUENCIA SIMPLE DEL MARTILLO - 4 frases secuenciales
        HAMMER_MESSAGES: [
            '🔨 A la una... ¿nadie se atreve?',
            '🔨 A las dos... ¡última oportunidad!', 
            '🔨 A las tres... ¡se cierra la subasta!',
            '🔨 ¡Adjudicado! ¡Subasta finalizada!'
        ],

        // 💥 MENSAJES DE REANUDACIÓN
        RESUME_MESSAGES: [
            '💥 ¡PUJA DE ÚLTIMO SEGUNDO!',
            '⚡ ¡Alguien entra en acción!',
            '🔥 ¡La batalla continúa!',
            '💪 ¡No se rinden tan fácil!'
        ],

        // 🎪 MENSAJES DE INICIO SIMPLES
        START_MESSAGES: [
            '🎪 ¡Comienza la subasta!',
            '🔥 ¡Que empiece la batalla!',
            '⚡ ¡Subasta en vivo!',
            '🎯 ¡A por todas!'
        ],

        // 👥 PUJADORES VIRTUALES SIMPLIFICADOS
        VIRTUAL_BIDDERS: [
            // Final Fantasy VII
            { name: 'Cloud', personality: 'strategic', emoji: '⚔️' },
            { name: 'Sephiroth', personality: 'aggressive', emoji: '🗡️' },
            { name: 'Aerith', personality: 'passionate', emoji: '🌸' },
            { name: 'Tifa', personality: 'aggressive', emoji: '👊' },
            { name: 'Barret', personality: 'impulsive', emoji: '💥' },
            
            // Final Fantasy VIII
            { name: 'Squall', personality: 'calculated', emoji: '🦁' },
            { name: 'Rinoa', personality: 'passionate', emoji: '💫' },
            { name: 'Seifer', personality: 'aggressive', emoji: '🔥' },
            
            // Final Fantasy IX
            { name: 'Zidane', personality: 'impulsive', emoji: '🐒' },
            { name: 'Vivi', personality: 'calculated', emoji: '🔮' },
            
            // Final Fantasy X
            { name: 'Tidus', personality: 'passionate', emoji: '🌊' },
            { name: 'Yuna', personality: 'calculated', emoji: '🙏' },
            { name: 'Auron', personality: 'strategic', emoji: '🗡️' },
            
            // Dragon Ball
            { name: 'Goku', personality: 'passionate', emoji: '🥋' },
            { name: 'Vegeta', personality: 'aggressive', emoji: '👑' },
            { name: 'Piccolo', personality: 'strategic', emoji: '👹' },
            
            // Naruto
            { name: 'Naruto', personality: 'impulsive', emoji: '🍜' },
            { name: 'Sasuke', personality: 'aggressive', emoji: '⚡' },
            { name: 'Kakashi', personality: 'strategic', emoji: '👁️' },
            
            // One Piece
            { name: 'Luffy', personality: 'impulsive', emoji: '🏴‍☠️' },
            { name: 'Zoro', personality: 'aggressive', emoji: '⚔️' },
            { name: 'Nami', personality: 'calculated', emoji: '💰' }
        ],

        // 💬 MENSAJES DE PUJA SIMPLES POR PERSONALIDAD
        BID_MESSAGES: {
            'aggressive': [
                'ataca con furia',
                'no se detiene',
                'va con todo',
                'domina la subasta'
            ],
            'impulsive': [
                'actúa sin pensar',
                'se lanza a por ello',
                'no puede resistirse',
                'puja por instinto'
            ],
            'strategic': [
                'calcula su movimiento',
                'actúa con precisión',
                'planea su estrategia',
                'mide cada paso'
            ],
            'calculated': [
                'analiza la situación',
                'actúa con frialdad',
                'evalúa las opciones',
                'toma una decisión'
            ],
            'passionate': [
                'puja con el corazón',
                'se emociona',
                'no puede contenerse',
                'lucha por su sueño'
            ]
        },

        // 🎯 FUNCIÓN PARA OBTENER MENSAJE DE PUJA
        getBidMessage: function(bidder) {
            const messages = this.BID_MESSAGES[bidder.personality] || this.BID_MESSAGES['strategic'];
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            return `${bidder.emoji} ${bidder.name} ${randomMessage}`;
        },

        // 🔨 FUNCIÓN PARA OBTENER MENSAJE DE MARTILLO
        getHammerMessage: function(step) {
            return this.HAMMER_MESSAGES[step] || this.HAMMER_MESSAGES[0];
        },

        // 💥 FUNCIÓN PARA OBTENER MENSAJE DE REANUDACIÓN
        getResumeMessage: function() {
            return this.RESUME_MESSAGES[Math.floor(Math.random() * this.RESUME_MESSAGES.length)];
        },

        // 🎪 FUNCIÓN PARA OBTENER MENSAJE DE INICIO
        getStartMessage: function() {
            return this.START_MESSAGES[Math.floor(Math.random() * this.START_MESSAGES.length)];
        }
    };

    console.log('✅ SubastaConstantes simplificado cargado correctamente');

})(window);
