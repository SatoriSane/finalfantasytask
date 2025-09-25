// subasta-constantes.js
(function(global) {
    'use strict';

    global.SubastaConstantes = {
        TIMING_CONFIG: {
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
    },
    // 🎭 SISTEMA DE MENSAJES COHERENTES - Categorizados por contexto narrativo
    narrativeMessages: {
        // 🔥 ALTA ENERGÍA - Después de pujas exitosas o momentos intensos
        highEnergy: [
            '🔥 ¡Alguien no se rinde!',
            '⚡ ¡La competencia continúa!',
            '🚀 ¡Esto se está calentando!',
            '🏆 ¡Nadie quiere quedarse atrás!',
            '🤯 ¡La puja sube y sube!',
            '🔥 ¡El ambiente está al rojo vivo!',
            '😮 ¡Sorpresa! Otro ofertante entra en juego!',
            '👊 ¡Esto se pone intenso!',
            '📈 ¡El precio sigue escalando!',
            '💥 ¡Puja explosiva!',
            '🤩 ¡El público enloquece con esta subasta!',
            '✨ ¡Cada vez más emocionante!'
        ],
        
        // 💪 PERSISTENCIA - Cuando la subasta continúa con determinación
        persistence: [
            '💪 ¡Hay más interés!',
            '😏 ¡Nadie da su brazo a torcer!',
            '🤑 ¡La codicia mueve montañas!',
            '🥵 ¡Nadie quiere soltarlo todavía!',
            '🦾 ¡La fuerza de los pujadores no tiene límites!',
            '😎 ¡Parece que la cosa va para largo!',
            '🔥 ¡La batalla continúa!',
            '⚡ ¡Nadie se rinde!',
            '💯 ¡La competencia sigue feroz!'
        ],
        
        // 🤔 INCERTIDUMBRE - Momentos de duda y reflexión
        uncertainty: [
            '🤔 Los pujadores están dudando...',
            '⏳ Momento de reflexión...',
            '🧐 Analizando la situación...',
            '💭 ¿Alguien más pujará?',
            '👀 Todos se observan con cautela...',
            '😏 ¿Será un farol o una retirada?',
            '🤨 Todos miden su próximo movimiento...',
            '😑 Los pujadores respiran hondo antes de decidir...'
        ],
        
        // 😶 TENSIÓN BAJA - Cuando la energía decae
        lowTension: [
            '😶 El silencio invade la sala...',
            '🕰️ El tiempo corre, nadie se decide...',
            '😬 Tensión en el aire...',
            '📉 El entusiasmo parece enfriarse...',
            '🔮 Nadie sabe lo que ocurrirá...',
            '😯 Una pausa inesperada...',
            '🙄 El público comienza a impacientarse...'
        ],
        
        // 🏁 FINALIZACIÓN - Mensajes específicos para el final de la subasta
        finalization: [
            '🏁 ¡Se acerca el final!',
            '⏰ ¡Últimos momentos!',
            '🎊 ¡Alguien va a ganar pronto!',
            '🔥 ¡El momento decisivo ha llegado!'
        ],

        // 🔨 CUENTA ATRÁS DEL MARTILLO - Para la secuencia final
        hammer: [
            'A la una... ¿nadie más se atreve?',
            'A las dos... ¡última oportunidad!',
            '¿Nadie da más? ¡A la una...!',
            'El martillo está en alto... ¡a las dos...!',
            '¡Última llamada! ¿Nadie más?'
        ],
        
        // 🎭 ENTRADA DE PARTICIPANTES - Mensajes épicos para la llegada de pujadores
        participantEntry: {
            waiting: [
                '🕰️ Esperando a los participantes...',
                '🎪 Preparando el escenario de la subasta...',
                '🎭 Se abre el telón de la subasta épica...',
                '✨ Los coleccionistas se reúnen en las sombras...',
                '🎯 La arena de la subasta aguarda...'
            ],
            entries: {
                // Entradas genéricas por personalidad
                'strategic': [
                    'analiza la situación desde las sombras',
                    'estudia a sus rivales con mirada calculadora',
                    'entra con un plan maestro en mente',
                    'observa cada detalle antes de actuar'
                ],
                'aggressive': [
                    'irrumpe con una presencia intimidante',
                    'entra dispuesto a arrasar con todo',
                    'llega con sed de victoria',
                    'se presenta como una fuerza imparable'
                ],
                'impulsive': [
                    'aparece de repente, lleno de energía',
                    'entra sin pensarlo dos veces',
                    'llega siguiendo su instinto',
                    'se lanza de cabeza a la batalla'
                ],
                'calculated': [
                    'entra tras calcular todas las probabilidades',
                    'aparece con precisión matemática',
                    'llega después de analizar cada variable',
                    'se presenta con lógica implacable'
                ],
                'passionate': [
                    'entra con el corazón ardiendo',
                    'llega movido por una pasión inquebrantable',
                    'aparece con determinación absoluta',
                    'se presenta con sueños por cumplir'
                ]
            },
            // Entradas específicas por personaje
            characterEntries: {
                'Cloud': [
                    'emerge de las brumas con su espada en mano',
                    'llega montado en su moto Fenrir',
                    'aparece con recuerdos confusos pero determinación clara',
                    'entra cargando el peso de su pasado'
                ],
                'Sephiroth': [
                    'desciende como un ángel caído',
                    'aparece entre llamas plateadas',
                    'entra con su Masamune brillando amenazante',
                    'llega proclamando su superioridad'
                ],
                'Goku': [
                    'aparece con su teletransportación instantánea',
                    'llega volando en su Nube Voladora',
                    'entra con una sonrisa y ganas de pelear',
                    'se presenta buscando un nuevo desafío'
                ],
                'Vegeta': [
                    'aterriza con una explosión de energía',
                    'entra proclamando su linaje real',
                    'llega con su orgullo saiyajin intacto',
                    'aparece decidido a demostrar su superioridad'
                ],
                'Naruto': [
                    'entra con cientos de clones de sombra',
                    'llega gritando que será el próximo Hokage',
                    'aparece con su Rasengan preparado',
                    'se presenta con su ninja way'
                ],
                'Luffy': [
                    'llega estirándose desde muy lejos',
                    'aparece con su sombrero de paja ondeando',
                    'entra gritando que será el Rey de los Piratas',
                    'se presenta con una sonrisa contagiosa'
                ],
                'Light': [
                    'entra con una sonrisa calculadora',
                    'aparece con su Death Note oculto',
                    'llega proclamando ser el dios del nuevo mundo',
                    'se presenta con una risa maniaca'
                ],
                'Eren': [
                    'entra con la determinación de la libertad',
                    'aparece con cicatrices de batalla',
                    'llega gritando "TATAKAE!"',
                    'se presenta dispuesto a luchar hasta el final'
                ]
            }
        }
    },
    // 🏆 SISTEMA DE SUBASTA ÉPICA - FINAL FANTASY & ANIME 🏆
    // Pujadores legendarios de FF y anime con personalidades únicas
    VIRTUAL_BIDDERS: [
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
    ],
    // Funciones para generar mensajes extremos específicos por personaje
    getExtremeCharacterMessage: function(characterName, activeBidder, increaseAmount) {
        const messages = {
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
        return messages[characterName] || null;
    },
    // Función para generar mensajes extremos genéricos por personalidad
    getExtremePersonalityMessage: function(personality, activeBidder, increaseAmount) {
        const messages = {
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
        const personalityMessages = messages[personality];
        return personalityMessages ? personalityMessages[Math.floor(Math.random() * personalityMessages.length)] : null;
    },
    
    // 🎭 SISTEMA DE COHERENCIA NARRATIVA MEJORADO
    getCoherentMessage: function(currentContext, lastMessageType) {
        const messages = this.narrativeMessages;
        let availableCategories = [];
        
        // 🎯 REGLAS DE COHERENCIA NARRATIVA MEJORADAS
        if (currentContext === 'afterBid') {
            // Después de una puja exitosa -> Alta energía o persistencia
            availableCategories = ['highEnergy', 'persistence'];
        } else if (currentContext === 'uncertainty') {
            // Durante incertidumbre -> Solo incertidumbre o tensión baja
            if (lastMessageType === 'highEnergy' || lastMessageType === 'persistence') {
                // Si venimos de alta energía, empezar con incertidumbre suave
                availableCategories = ['uncertainty'];
            } else {
                // Si ya estamos en baja energía, puede empeorar
                availableCategories = ['uncertainty', 'lowTension'];
            }
        } else if (currentContext === 'continuation') {
            // Continuación después de incertidumbre -> Volver a la acción
            if (lastMessageType === 'lowTension') {
                // Desde tensión baja, recuperar energía gradualmente
                availableCategories = ['persistence', 'highEnergy'];
            } else if (lastMessageType === 'uncertainty') {
                // Desde incertidumbre, puede ir a cualquier lado
                availableCategories = ['highEnergy', 'persistence'];
            } else {
                // Por defecto, mantener energía
                availableCategories = ['highEnergy', 'persistence'];
            }
        } else if (currentContext === 'preFinalization') {
            // 🏁 NUEVO CONTEXTO - Momentos previos al final
            availableCategories = ['finalization'];
        }
        
        // Seleccionar categoría aleatoria de las disponibles
        const selectedCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
        const categoryMessages = messages[selectedCategory];
        
        if (!categoryMessages || categoryMessages.length === 0) {
            // Fallback a alta energía
            return {
                message: messages.highEnergy[Math.floor(Math.random() * messages.highEnergy.length)],
                type: 'highEnergy'
            };
        }
        
        const selectedMessage = categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
        
        return {
            message: selectedMessage,
            type: selectedCategory
        };
    },
    MOTIVATIONAL_MESSAGES: [
        '¡Excelente decisión! 🎉',
        '¡Tu fuerza de voluntad es increíble! 💪',
        '¡Cada venta te hace más fuerte! ⚡',
        '¡Estás rompiendo el ciclo! 🔥',
        '¡Tu futuro yo te lo agradecerá! 🌟',
        '¡Has demostrado tu determinación! 🏆',
        '¡Otro paso hacia tu libertad! 🌅'
    ],

    // 🎭 MENSAJES ESPECÍFICOS POR PERSONAJE - Basados en su personalidad y trasfondo
    CHARACTER_SPECIFIC_MESSAGES: {
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
    },

    // Mensajes genéricos por personalidad (fallback)
 BIDDER_MESSAGES: {
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
    },
    
    // 🎭 FUNCIÓN PARA GENERAR MENSAJE DE ENTRADA DE PARTICIPANTE
    getParticipantEntryMessage: function(participant) {
        const characterEntries = this.narrativeMessages.participantEntry.characterEntries[participant.name];
        const personalityEntries = this.narrativeMessages.participantEntry.entries[participant.personality];
        
        let entryAction;
        
        // Priorizar mensajes específicos del personaje
        if (characterEntries && characterEntries.length > 0) {
            entryAction = characterEntries[Math.floor(Math.random() * characterEntries.length)];
        } else if (personalityEntries && personalityEntries.length > 0) {
            entryAction = personalityEntries[Math.floor(Math.random() * personalityEntries.length)];
        } else {
            // Fallback genérico
            entryAction = 'entra a la subasta con determinación';
        }
        
        return `${participant.emoji} ${participant.name} ${entryAction}`;
    },
    
    // 🎭 FUNCIÓN PARA OBTENER MENSAJE DE ESPERA
    getWaitingMessage: function() {
        const waitingMessages = this.narrativeMessages.participantEntry.waiting;
        return waitingMessages[Math.floor(Math.random() * waitingMessages.length)];
    }
};

})(window);