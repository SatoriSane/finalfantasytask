// subasta-constantes-simple.js - VERSIÓN COMPLETAMENTE SIMPLIFICADA
(function(global) {
    'use strict';
    
    global.SubastaConstantes = {
        MIN_BIDDERS: 3,
        MAX_BIDDERS: 10,
        // ⚙️ CONFIGURACIÓN SIMPLE DE TIMING
        TIMING_CONFIG: {
            MESSAGE_DELAY: 3500,
            PRICE_ANIMATION_DURATION: 1200,
            BID_INTERVAL_MIN: 2500,
            BID_INTERVAL_MAX: 5000,
            HAMMER_PAUSE: 3000,
            FINAL_DELAY: 500,
            HAMMER_FIRST_DELAY: 4500,
        },
        // 🔥 Rango de puja extrema en puntos
        EXTREME_BID_RANGE: {
            min: 2,
            max: 10
        },
        PROBABILITIES: {
            HAMMER_CHANCE: 0.05,
            HAMMER_BONUS_INCREMENT: 0.05,
            HAMMER_RESUME_CHANCES: [0.5, 0.5, 0.4],
            HAMMER_RESUME_DECREMENT: 0.15,
            EXTREME_BID_CHANCE: 0.15,
            EXTREME_BID_RETREAT_CHANCES: {
                strategic: 0.7,
                calculated: 0.8,
                impulsive: 0.6,
                passionate: 0.6,
                aggressive: 0.4,
                default: 0.7
            },
            NORMAL_BID_RETREAT_CHANCES: {
                aggressive: 0.13,
                impulsive: 0.12,
                passionate: 0.1,
                strategic: 0.08,
                calculated: 0.07,
                default: 0.1
            },
            FEAR_MESSAGE_DELAY_MAX: 5000,
            FEAR_MESSAGE_DELAY_MIN: 1000
        },


        // 🔨 SECUENCIA SIMPLE DEL MARTILLO - 4 frases secuenciales
        HAMMER_MESSAGES: [
            '🔨 A la una... ¿Nadie más se atreve?',
            '🔨 A las dos... el martillo está en alto', 
            '🔨 A las tres y... ¡última oportunidad!',
            '🔨 ¡Adjudicado! ¡Subasta finalizada!'
        ],

        // 🎪 MENSAJES DE INICIO SIMPLES
        START_MESSAGES: [
            '🎪 ¡Comienza la subasta!',
            '🔥 ¡Que empiece la batalla!',
            '⚡ ¡Subasta en vivo!',
            '🎯 ¡A por todas!'
        ],

// 👥 PUJADORES VIRTUALES CON MENSAJES PERSONALIZADOS
VIRTUAL_BIDDERS: [
// Final Fantasy VII
{ 
    name: 'Tifa', 
    personality: 'aggressive', 
    emoji: '👊',
    messages: [
        'golpea con sus puños de acero',
        'no se rinde ante nada',
        'lucha con toda su fuerza',
        'defiende a sus amigos sin dudar',
        'actúa como la memoria de Cloud',
        'protege el bar Seventh Heaven',
        'ejecuta su límite Final Heaven',
        'pelea por los recuerdos de Nibelheim',
        'nunca abandona a quien ama',
        'combina fuerza y ternura perfectamente'
    ],
    extremeMessages: [
        '💥 ¡ACTIVA FINAL HEAVEN! ¡PUÑOS IMPARABLES!',
        '🔥 ¡LIBERA TODA SU FUERZA! ¡PUJA TOTAL!',
        '⚡ ¡DESTRUYE EL CAMPO DE BATALLA! ¡PUJA DEVASTADORA!'
    ],
    fearMessages: [
        '🚪 Tifa deja los puños y se retira',
        '🚪 Tifa abandona el Seventh Heaven',
        '🚪 Tifa se esconde tras la barra'
    ]
},
{ 
    name: 'Barret', 
    personality: 'impulsive', 
    emoji: '💥',
    messages: [
        'dispara sin pensar dos veces',
        'actúa por el bien del Planeta',
        'no puede quedarse quieto',
        'explota con su cañón de brazo',
        'lidera la resistencia de AVALANCHE',
        'protege a Marlene con su vida',
        'odia a la corporación Shinra',
        'rugge como un oso enfurecido',
        'dispara balas del tamaño de misiles',
        'lucha por un futuro mejor'
    ],
    extremeMessages: [
        '💣 ¡DISPARO TOTAL DEL CAÑÓN! ¡PUJA EXPLOSIVA!',
        '🔥 ¡LIBERA TODA SU IRA! ¡PUJA DEMOLEDORA!',
        '⚡ ¡ATAQUE INCONTROLABLE! ¡PUJA EXTREMA!'
    ],
    fearMessages: [
        '🚪 Barret baja el cañón y se va',
        '🚪 Barret se oculta tras el humo',
        '🚪 Barret abandona la resistencia'
    ]
},

// Final Fantasy VIII
{ 
    name: 'Squall', 
    personality: 'calculated', 
    emoji: '🦁',
    messages: [
        'whatever... pero puja igual',
        'actúa con frialdad de SeeD',
        'calcula cada movimiento',
        'lucha por sus ideales en silencio',
        'invoca Guardian Forces poderosas',
        'actúa como el comandante perfecto',
        'protege Balamb Garden',
        'ejecuta Renzokuken con precisión',
        'no necesita a nadie... o sí',
        'demuestra que el destino se puede cambiar'
    ],
    extremeMessages: [
        '🗡️ ¡RENZOKUKEN DEFINITIVO! ¡PUJA LETAL!',
        '⚡ ¡LIBERA EL PODER DE LOS GUARDIAN FORCES! ¡PUJA EXTREMA!',
        '🔥 ¡DESTRUYE EL CAMPO CON PRECISIÓN! ¡PUJA TOTAL!'
    ],
    fearMessages: [
        '🚪 Squall abandona Balamb Garden',
        '🚪 Squall se esconde tras las faldas de mamá Ede'
    ]
},
{ 
    name: 'Rinoa', 
    personality: 'passionate', 
    emoji: '💫',
    messages: [
        'puja con la magia del amor',
        'lucha por un mundo mejor',
        'actúa con pasión rebelde',
        'no puede contener sus sentimientos',
        'lidera la resistencia de Timber',
        'vuela con sus alas de ángel',
        'controla el poder de las hechiceras',
        'actúa con Angelo a su lado',
        'rompe las barreras del corazón',
        'demuestra que el amor todo lo puede'
    ],
    extremeMessages: [
        '💖 ¡INVOCA EL PODER DE HECHICERA! ¡PUJA MÁXIMA!',
        '🌟 ¡DESATA SU MAGIA ANGELICAL! ¡PUJA EXTREMA!',
        '✨ ¡ROMPE LOS LÍMITES DEL CORAZÓN! ¡PUJA TOTAL!'
    ],
    fearMessages: [
        '🚪 Rinoa se esconde tras Angelo',
        '🚪 Rinoa abandona Timber',
        '🚪 Rinoa abandona la Resistencia'
    ]
},
{ 
    name: 'Seifer', 
    personality: 'aggressive', 
    emoji: '🔥',
    messages: [
        'corta con su Hyperion ardiente',
        'demuestra que es el mejor',
        'ataca con arrogancia total',
        'nunca acepta la derrota',
        'ejecuta Fire Cross implacable',
        'lidera con disciplina férrea',
        'actúa como caballero hechicero',
        'demuestra su superioridad a Squall',
        'nunca se dobla ante nadie',
        'persigue sus sueños románticos'
    ],
    extremeMessages: [
        '🔥 ¡FIRE CROSS MÁXIMO! ¡PUJA DEVASTADORA!',
        '⚡ ¡ATAQUE ARDIENTE TOTAL! ¡PUJA EXTREMA!',
        '💥 ¡DEMUESTRA SU SUPERIORIDAD! ¡PUJA LETAL!'
    ],
    fearMessages: [
        '🚪 Seifer se va - otro pez que se me escapa',
        '🚪 Seifer se retira con orgullo'
    ]
},

// Final Fantasy IX
{ 
    name: 'Zidane', 
    personality: 'impulsive', 
    emoji: '🐒',
    messages: [
        'roba la oportunidad como un ladrón',
        'actúa con agilidad de mono',
        'no puede resistir un buen tesoro',
        'salta a la acción sin dudar',
        'roba corazones con su encanto',
        'protege a la princesa Garnet',
        'actúa como Genoma rebelde',
        'nunca deja solo a un amigo',
        'encuentra familia en Tantalus',
        'demuestra que el origen no importa'
    ],
    extremeMessages: [
        '🐒 ¡ATAQUE IMPROVISADO! ¡PUJA TOTAL!',
        '💥 ¡ROBA EL MOMENTO PERFECTO! ¡PUJA DEVASTADORA!',
        '⚡ ¡DESEA EL TESORO ABSOLUTO! ¡PUJA EXTREMA!'
    ],
    fearMessages: [
        '🚪 Zidane se va - otro pez que se me escapa',
        '🚪 Zidane se esconde tras Tantalus',
        '🚪 Zidane abandona con rapidez'
    ]
},
{ 
    name: 'Vivi', 
    personality: 'calculated', 
    emoji: '🔮',
    messages: [
        'conjura magia negra con sabiduría',
        'analiza con su mente brillante',
        'actúa con la inocencia de un niño',
        'busca entender el mundo',
        'cuestiona el significado de existir',
        'aprende sobre la vida y la muerte',
        'invoca Doble Magia Negra',
        'actúa con pureza de corazón',
        'encuentra valor en la amistad',
        'demuestra que el tiempo es precioso'
    ],
    extremeMessages: [
        '🔮 ¡DOBLE MAGIA NEGRA EXTREMA! ¡PUJA DEVASTADORA!',
        '⚡ ¡LIBERA TODO SU PODER ARCANO! ¡PUJA TOTAL!',
        '🔥 ¡MAGIA LETAL INCONTROLABLE! ¡PUJA EXTREMA!'
    ],
    fearMessages: [
        '🚪 Vivi guarda la magia y se retira',
        '🚪 Vivi desaparece entre sombras',
        '🚪 Vivi abandona la subasta asustado'
    ]
},

// Final Fantasy X
{ 
    name: 'Tidus', 
    personality: 'passionate', 
    emoji: '🌊',
    messages: [
        'nada contra la corriente',
        'lucha por salvar a Yuna',
        'actúa como estrella de blitzball',
        'no acepta un destino cruel',
        'ejecuta Ataque Espiral perfecto',
        'ríe aunque el mundo se acabe',
        'viaja desde el sueño de Zanarkand',
        'rompe las tradiciones de Spira',
        'demuestra que los sueños son reales',
        'lucha por un mañana sin Sin'
    ],
    extremeMessages: [
        '🌊 ¡ATAQUE ESPIRAL DEFINITIVO! ¡PUJA TOTAL!',
        '⚡ ¡LIBERA SU ESPÍRITU DE ZANARKAND! ¡PUJA EXTREMA!',
        '🔥 ¡ROMPE EL DESTINO DE SPIRA! ¡PUJA DEVASTADORA!'
    ],
    fearMessages: [
        '🚪 Tidus se retira: "¡Se me da mejor el Blitzball!',
        '🚪 Tidus se sumerge fuera de la sala',
        '🚪 Tidus se va a buscar su Zanarkand'
    ]
},
{
    name: 'Yuna', 
    personality: 'calculated', 
    emoji: '🙏',
    messages: [
        'reza por la paz de Spira',
        'actúa con gracia de invocadora',
        'sacrifica todo por los demás',
        'encuentra fuerza en la esperanza',
        'invoca Eones poderosos en batalla',
        'camina el sendero de la peregrinación',
        'actúa con la bendición de Yevon',
        'danza el Requiem para los muertos',
        'encuentra nuevo camino sin templos',
        'demuestra que el amor trasciende'
    ],
    extremeMessages: [
        '🙏 ¡INVOCA EÓN DEFINITIVO! ¡PUJA TOTAL!',
        '🌟 ¡LIBERA EL PODER DE YEVON! ¡PUJA EXTREMA!',
        '💥 ¡SALVA SPIRA CON SU MAGIA! ¡PUJA DEVASTADORA!'
    ],
    fearMessages: [
        '🙏 Yuna se retira a rezar por Spira',
        '🕊️ Yuna se retira - "mejor continuaré con el peregrinaje"',
        '🕊️ Yuna busca refugio en la oración'    ]
},
{ 
    name: 'Auron', 
    personality: 'strategic', 
    emoji: '🗡️',
    messages: [
        'corta con la sabiduría del pasado',
        'actúa como guardián legendario',
        'protege con experiencia milenaria',
        'cumple su promesa eterna',
        'ejecuta Tornado sin esfuerzo',
        'bebe sake antes de la batalla',
        'actúa como enviado no enviado',
        'protege al hijo de su mejor amigo',
        'nunca rompe su palabra de honor',
        'demuestra que la muerte no es el final'
    ],
    extremeMessages: [
        '🗡️ ¡TORNADO LEGENDARIO! ¡PUJA DEVASTADORA!',
        '🔥 ¡ACTIVA SU SABIDURÍA ETERNA! ¡PUJA EXTREMA!',
        '⚡ ¡DESTRUYE EL CAMPO CON HONOR! ¡PUJA TOTAL!'
    ],
    fearMessages: [
        '🗡️ Auron guarda su espada y se aparta',
        '🔥 Auron se retira, la estrategia manda',
        '⚔️ Auron abandona con honor intacto'
    ]
},
// Final Fantasy X
{ 
    name: 'Wakka', 
    personality: 'passionate', 
    emoji: '🏐',
    messages: [
        'lanza pelotas de blitzball letales',
        'actúa como guardián de Besaid',
        'reza a Yevon con devoción',
        'protege tradiciones de Spira',
        'habla como isleño relajado, ya',
        'actúa con fe inquebrantable',
        'nunca abandona sus creencias',
        'entrena para la gloria deportiva',
        'demuestra que la fe da fuerza',
        'juega el último partido perfecto'
    ],
    extremeMessages: [
        '🏐 ¡EL BLITZBALL SAGRADO APLASTA TODO ENEMIGO!',
        '💥 ¡LA ISLA DE BESAID SE ELEVA EN GLORIA!'
    ],
    fearMessages: [
        '🏐 Wakka se va a jugar al blitzball',
        '🌊 Wakka vuelve a Besaid a rezar',
    ]
},
{ 
    name: 'Rikku', 
    personality: 'impulsive', 
    emoji: '🔧',
    messages: [
        'roba objetos con destreza inigualable',
        'actúa como alquimista alegre',
        'desarma bombas enemigas con rapidez',
        'mezcla pociones imposibles',
        'ríe incluso en peligro mortal',
        'actúa con optimismo juvenil',
        'nunca deja de buscar soluciones creativas',
        'abre un cofre',
        'demuestra que la esperanza puede ser inventada',
        'salta al campo con energía chispeante'
    ],
    extremeMessages: [
        '🔧 ¡INVENTIVA EXPLOSIVA SALVA EL DÍA!',
        '⚡ ¡SONRISAS Y BOMBAS CREAN UNA TORMENTA!',
        '💥 ¡UNA CHICA AL BHED CAMBIA EL DESTINO!'
    ],
    fearMessages: [
        '💨 Rikku huye riendo entre explosiones',
        '💥 Rikku se retira, la alquimia es demasiado poderosa',
    ]
},

// Slam Dunk
{ 
    name: 'Hanamichi Sakuragi', 
    personality: 'impulsive', 
    emoji: '🏀',
    messages: [
        'intenta impresionar a Haruko',
        'actúa como genio del rebote improvisado',
        'entra a la cancha con energía caótica',
        'se pelea con rivales y amigos',
        'sorprende con saltos inhumanos',
        'actúa como “rey del autobasquet”',
        'nunca admite que se enamoró del básquet',
        'entrena hasta sangrar',
        'demuestra que la pasión vence al talento',
        'vive para el rebote perfecto'
    ],
    extremeMessages: [
        '🏀 ¡EL REY DEL REBOTE DERRUMBA GIGANTES!',
        '⚡ ¡PASIÓN PURO ROJO DESATA EL JUEGO!',
        '💥 ¡UNA VOLCADA QUE SACUDE EL UNIVERSO!'
    ],
    fearMessages: [
        '🏀 Sakuragi sale disparado de la cancha',
        '🔥 Sakuragi se retira entre insultos y saltos',
        '⚡ Sakuragi huye tras un rebote fallido'
    ]
},
{ 
    name: 'Kaede Rukawa', 
    personality: 'strategic', 
    emoji: '😎',
    messages: [
        'anota con elegancia imparable',
        'actúa como genio silencioso del básquet',
        'duerme en todas partes menos en la cancha',
        'deslumbra con regates fríos',
        'rechaza a todos con indiferencia',
        'actúa con talento nato',
        'nunca pierde la calma bajo presión',
        'entrena en secreto bajo la luna',
        'demuestra que la frialdad es poder',
        'conquista partidos con estilo helado'
    ],
    extremeMessages: [
        '😎 ¡EL ASESINO SILENCIOSO DEL TABLERO!',
        '⚡ ¡ELEGANCIA GLACIAL ROMPE DEFENSAS!',
        '💥 ¡UN GENIO QUE CONVIERTE EL SILENCIO EN PUNTOS!'
    ],
    fearMessages: [
        '😎 Rukawa se retira sin perder el estilo',
        '❄️ Rukawa abandona la cancha silencioso', 
        '🖤 Rukawa desaparece como sombra helada'  
    ]
},

// Code Geass
{ 
    name: 'Lelouch vi Britannia', 
    personality: 'strategic', 
    emoji: '♟️',
    messages: [
        'conquista el mundo con inteligencia fría',
        'actúa como emperador oscuro',
        'usa el Geass para manipular mentes',
        'lidera ejércitos con un plan perfecto',
        'sacrifica todo por Nunnally',
        'actúa con nobleza disfrazada de tiranía',
        'nunca revela sus verdaderos sentimientos',
        'controla batallas como ajedrez viviente',
        'demuestra que el poder absoluto es soledad',
        'declara que Zero es inmortal'
    ],
    extremeMessages: [
        '♟️ ¡EL REY ESTRATEGICO MUEVE EL MUNDO!',
        '⚡ ¡UN SOLO GEASS PUEDE CAMBIAR LA HISTORIA!',
        '💥 ¡EL AJEDREZ HUMANO TERMINA EN REVOLUCIÓN!'
    ],
    fearMessages: [
        '♟️ Lelouch abandona el tablero y se retira',
        '💥 Lelouch se retira para replanear su Geass'
    ]
},
{ 
    name: 'C.C.', 
    personality: 'mystic', 
    emoji: '🍕',
    messages: [
        'devora pizza con calma eterna',
        'actúa como bruja inmortal',
        'susurra secretos del contrato',
        'observa la humanidad desde siglos',
        'se burla del ego de Lelouch',
        'actúa con misticismo enigmático',
        'nunca muere ni olvida',
        'conoce el peso del tiempo infinito',
        'demuestra que la inmortalidad es soledad',
        'acompaña siempre en silencio'
    ],
    extremeMessages: [
        '🍕 ¡LA BRUJA INMORTAL RÍE DEL DESTINO!',
        '⚡ ¡PODER ANCESTRAL DESPIERTA EN SOMBRAS!',
        '💥 ¡UN CONTRATO ETERNO REDEFINE EL MUNDO!'
    ],
    fearMessages: [
        '🍕 C.C. se desvanece comiendo pizza tranquilamente',
        '🌙 C.C. susurra "qué aburrido" y desaparece',
        '✨ C.C. se retira a observar desde las sombras'
    ]
},

// Naruto (faltando)
{ 
    name: 'Naruto Uzumaki', 
    personality: 'impulsive', 
    emoji: '🍜',
    messages: [
        'grita que será Hokage',
        'actúa como ninja torpe pero valiente',
        'come ramen como combustible de vida',
        'libera el poder del Kyubi',
        'entrena sin rendirse jamás',
        'actúa con optimismo inquebrantable',
        'nunca abandona a un amigo',
        'derrota enemigos con palabras y puños',
        'demuestra que soñar da fuerza',
        'ilumina la aldea con su voluntad de fuego'
    ],
    extremeMessages: [
        '🍜 ¡EL KYUBI Y EL SUEÑO SE UNEN EN TORMENTA!',
        '⚡ ¡LA VOLUNTAD DE FUEGO QUEMA EL DESTINO!',
        '💥 ¡UN GRITO: ¡SERÉ HOKAGE! SACUDE EL MUNDO!'
    ],
    fearMessages: [
        '🍜 Naruto se retira, el ramen es demasiado poderoso',
        '🚪 Naruto se va -  Así no es el camino ninja'
    ]
},
{ 
    name: 'Sakura Haruno', 
    personality: 'passionate', 
    emoji: '🌸',
    messages: [
        'cura a sus amigos con chakra verde',
        'actúa como aprendiz de Tsunade',
        'golpea con fuerza monstruosa',
        'grita a Naruto con ira tierna',
        'estudia estrategias médicas',
        'actúa con corazón enamorado y firme',
        'nunca deja que un aliado caiga',
        'entrena hasta romperse',
        'demuestra que la inteligencia también pelea',
        'florece como kunoichi formidable'
    ],
    extremeMessages: [
        '🌸 ¡UNA FLOR DE ACERO ROMPE EL TERRENO!',
        '⚡ ¡SANACIÓN Y FURIA SE UNEN EN BATALLA!',
        '💥 ¡EL PÉTALO ROSA GOLPEA COMO TRUENO!'
    ],
    fearMessages: [
        '🌸 Sakura se retira, la cura es demasiado poderosa',
        '🔥 Sakura se retira, la furia es demasiado fuerte',
        '🚪 Sakura se retira, la aldea es demasiado peligrosa'
    ]
},
// Dragon Ball
{ 
    name: 'Vegeta', 
    personality: 'aggressive', 
    emoji: '👑',
    messages: [
        'demuestra el orgullo Saiyan',
        'no acepta ser segundo',
        'ataca con la furia del príncipe',
        'supera a Kakarot cueste lo que cueste',
        'ejecuta Final Flash devastador',
        'entrena hasta el límite absoluto',
        'actúa con sangre real guerrera',
        'protege su familia y honor',
        'nunca pide ayuda a nadie',
        'demuestra que es el número uno'
    ],
    extremeMessages: [
        '🔥 ¡FINAL FLASH DEFINITIVO! ¡PUJA SUPREMA!',
        '⚡ ¡SUPER SAIYAN BLUE TOTAL! ¡FUERZA EXTREMA!',
        '💥 ¡ROMPE TODOS LOS LÍMITES! ¡PUJA DEVASTADORA!'
    ],
    fearMessages: [
        '👑 Vegeta se retira, el Saiyan es demasiado orgulloso',
        '🔥 Vegeta se retira, la furia es demasiado fuerte',
        '🚪 Vegeta se retira, la aldea es demasiado peligrosa'
    ]
},
{ 
    name: 'Piccolo', 
    personality: 'strategic', 
    emoji: '👹',
    messages: [
        'medita antes de actuar',
        'protege la Tierra con sabiduría',
        'analiza al enemigo con frialdad',
        'actúa como mentor y guerrero',
        'regenera cualquier herida',
        'entrena a la nueva generación',
        'actúa con honor namekiano',
        'ejecuta Makankosappo letal',
        'se sacrifica por los que ama',
        'demuestra que el mal puede cambiar'
    ],
    extremeMessages: [
        '⚡ ¡MAKANKOSAPPO MÁXIMO! ¡PUJA DEVASTADORA!',
        '🔥 ¡LIBERA EL PODER NAMEKIANO TOTAL! ¡PUJA EXTREMA!',
        '💥 ¡PROTEGE LA TIERRA CON TODO! ¡PUJA DEFINITIVA!'
    ],
    fearMessages: [
        '👹 Piccolo se retira, el Namekiano es demasiado orgulloso',
        '👹 Piccolo se retira a meditar en soledad',
        '⚡ Piccolo abandona la subasta para entrenar'
    ]
},

// Naruto
{ 
    name: 'Sasuke', 
    personality: 'aggressive', 
    emoji: '⚡',
    messages: [
        'ataca con el Chidori',
        'busca venganza y poder',
        'actúa con frialdad Uchiha',
        'demuestra la superioridad de su clan',
        'activa el Sharingan eternal',
        'invoca el poder de Amaterasu',
        'ejecuta técnicas de fuego legendarias',
        'actúa como vengador solitario',
        'corta los lazos que lo atan',
        'demuestra que el poder lo es todo'
    ],
    extremeMessages: [
        '⚡ ¡CHIDORI INFINITO! ¡PUJA DEVASTADORA!',
        '🔥 ¡AMATERASU SUPREMO! ¡FUEGO ABSOLUTO!',
        '💥 ¡ECLIPSE DE SHARINGAN! ¡PUJA EXTREMA!'
    ],
    fearMessages: [
        '⚡ Sasuke se retira, el Uchiha es demasiado orgulloso',
        '⚡ Sasuke se retira buscando venganza en soledad',
        '🔥 Sasuke se aparta, la oscuridad lo llama'
    ]
},
{ 
    name: 'Kakashi', 
    personality: 'strategic', 
    emoji: '👁️',
    messages: [
        'copia la técnica perfecta',
        'actúa como el ninja copiador',
        'analiza con su Sharingan',
        'protege a sus estudiantes',
        'lee su libro naranja en batalla',
        'ejecuta Raikiri como relámpago',
        'actúa con más de mil técnicas',
        'enseña el valor del trabajo en equipo',
        'nunca abandona a un compañero',
        'demuestra que las reglas importan'
    ],
    extremeMessages: [
        '⚡ ¡RAIKIRI DEFINITIVO! ¡PUJA LETAL!',
        '🔥 ¡LIBERA TODAS SUS TÉCNICAS! ¡PUJA EXTREMA!',
        '💥 ¡SHARINGAN MÁXIMO ACTIVADO! ¡PUJA TOTAL!'
    ],
    fearMessages: [
        '👁️ Kakashi se retira a leer su libro naranja',
    ]
},

// One Piece
{ 
    name: 'Zoro', 
    personality: 'aggressive', 
    emoji: '⚔️',
    messages: [
        'corta con sus tres espadas',
        'entrena para ser el mejor espadachín',
        'nunca retrocede en batalla',
        'cumple su promesa a Kuina',
        'ejecuta Santoryu Ougi devastador',
        'se pierde camino a la victoria',
        'bebe sake después de entrenar',
        'actúa como cazador de piratas',
        'corta el acero con determinación',
        'demuestra que nada puede detenerlo'
    ],
    extremeMessages: [
        '⚔️ ¡SANTORYU OUGI MÁXIMO! ¡PUJA DEVASTADORA!',
        '🔥 ¡LIBERA TODAS SUS ESPADAS! ¡PUJA EXTREMA!',
        '💥 ¡CORTE ABSOLUTO! ¡FUERZA DEFINITIVA!'
    ],
    fearMessages: [
        '⚔️ Zoro se retira, el espadachín es demasiado orgulloso',
        '⚔️ Zoro se retira buscando la victoria en soledad',
        '🔥 Zoro se aparta, la oscuridad lo llama'
    ]
},
{ 
    name: 'Nami', 
    personality: 'calculated', 
    emoji: '💰',
    messages: [
        'calcula cada Berry con precisión',
        'navega hacia el tesoro',
        'actúa como la mejor navegante',
        'no puede resistirse al dinero',
        'predice el clima con perfección',
        'manipula las nubes con su Clima Tact',
        'dibuja mapas del mundo entero',
        'cobra intereses por cada favor',
        'roba carteras sin ser vista',
        'demuestra que el conocimiento es poder'
    ],
    extremeMessages: [
        '💨 ¡CLIMA TACT SUPREMO! ¡TORBELLINO DE PUJA!',
        '⚡ ¡TORNADO Y RAYOS! ¡PUJA DEVASTADORA!',
        '💰 ¡DOMINA EL CLIMA Y LA RIQUEZA! ¡PUJA EXTREMA!'
    ],
    fearMessages: [
        '💰 Nami se retira, la riqueza es demasiado poderosa',
        '💰 Nami se retira para calcular tesoros',
        '⚡ Nami abandona la subasta buscando riqueza segura'
    ]
},

// Doraemon
{ 
    name: 'Nobita', 
    personality: 'impulsive', 
    emoji: '😴',
    messages: [
        'puja para evitar hacer la tarea',
        'actúa con pereza legendaria',
        'confía en los gadgets de Doraemon',
        'sueña con ser popular',
        'llora hasta conseguir lo que quiere',
        'actúa sin pensar en las consecuencias',
        'siempre llega tarde pero participa',
        'usa el poder de la amistad',
        'encuentra valor cuando es necesario',
        'demuestra que los perdedores también ganan'
    ],
    extremeMessages: [
        '😴 ¡GADGET DEFINITIVO! ¡PUJA EXTREMA!',
        '💥 ¡EVITA TODA RESPONSABILIDAD! ¡PUJA DEVASTADORA!',
        '⚡ ¡SUPERA SU PEREZA AL MÁXIMO! ¡PUJA TOTAL!'
    ],
    fearMessages: [
        '😴 Nobita se esconde tras un gadget',
        '💥 Nobita abandona la subasta por pereza',
        '😴 Nobita se retira evitando problemas'
    ]
},
{ 
    name: 'Doraemon', 
    personality: 'strategic', 
    emoji: '🤖',
    messages: [
        'saca el gadget perfecto del bolsillo',
        'ayuda con tecnología del futuro',
        'actúa como gato robot responsable',
        'planifica con sabiduría del siglo XXII',
        'usa la puerta de cualquier parte',
        'inventa la solución más loca',
        'protege a Nobita de los problemas',
        'come dorayakis para ganar energía',
        'actúa con lógica robótica avanzada',
        'demuestra que la amistad trasciende el tiempo'
    ],
    extremeMessages: [
        '🤖 ¡GADGET DEFINITIVO ACTIVADO! ¡PUJA TOTAL!',
        '⚡ ¡INVENTOS DEL FUTURO! ¡PUJA DEVASTADORA!',
        '💥 ¡SOLUCIÓN ABSOLUTA! ¡PUJA EXTREMA!'
    ],
    fearMessages: [
        '🤖 Doraemon se retira a preparar un gadget',
        '💥 Doraemon se aparta para inventar la solución perfecta',
        '⚡ Doraemon abandona la subasta con lógica extrema'
    ]
},

 // Final Fantasy VIII
{ 
    name: 'Artemisa', 
    personality: 'aggressive', 
    emoji: '🌙',
    messages: [
        'comprime el tiempo a su voluntad',
        'actúa como hechicera suprema',
        'domina con magia ancestral',
        'manipula las memorias del pasado',
        'ejecuta Apocalipsis devastador',
        'controla el destino de los mundos',
        'actúa con poder de las hechiceras',
        'trasciende las barreras temporales',
        'nunca acepta la derrota final',
        'demuestra que el poder corrompe absolutamente'
    ],
    extremeMessages: [
        '🌌 ¡APOCALIPSIS TOTAL! ¡PUJA EXTREMA!',
        '⚡ ¡MAGIA ANCESTRAL DESATADA! ¡PUJA DEVASTADORA!',
        '💥 ¡DOMINA EL DESTINO! ¡FUERZA SUPREMA!'
    ],
    fearMessages: [
        '🌙 Artemisa se retira a reconfigurar el tiempo',
        '😰 Artemisa abandona la subasta para ocultar su verdadera identidad',
        '💥 Artemisa se aparta, el Apocalipsis espera'
    ]
},
{ 
    name: 'Zell', 
    personality: 'impulsive', 
    emoji: '🥊',
    messages: [
        'golpea con sus puños ardientes',
        'actúa sin pensar las consecuencias',
        'come hot dogs para recuperar energía',
        'ejecuta combos de artes marciales',
        'actúa con energía inagotable',
        'no puede quedarse quieto nunca',
        'protege Balamb Garden con pasión',
        'entrena hasta el agotamiento',
        'demuestra que la velocidad mata',
        'nunca retrocede en una pelea'
    ],
    extremeMessages: [
        '🔥 ¡COMBOS INFINITOS! ¡PUJA DEVASTADORA!',
        '⚡ ¡PUÑOS ARDIENTES SUPREMOS! ¡FUERZA EXTREMA!',
        '💥 ¡VELOZ COMO EL RAYO! ¡PUJA TOTAL!'
    ],
    fearMessages: [
        '😱 Zell sale corriendo antes de romper todo',
        '💨 Zell se aparta, necesita calmar la energía',
        '😰 Zell abandona la subasta, demasiado intenso'
    ]
},

// Card Captor Sakura
{ 
    name: 'Sakura', 
    personality: 'passionate', 
    emoji: '🌸',
    messages: [
        'captura cartas con magia rosa',
        'actúa con pureza de corazón',
        'protege con el poder del amor',
        'invoca el bastón sellador',
        'vuela con alas de esperanza',
        'actúa como maestra de cartas Clow',
        'transforma cartas con su magia',
        'nunca se rinde ante la dificultad',
        'encuentra fuerza en sus amigos',
        'demuestra que el amor todo lo puede'
    ],
    extremeMessages: [
        '🌸 ¡MAGIA DE CLAMP TOTAL! ¡PUJA SUPREMA!',
        '⚡ ¡BASTÓN SELLADOR MÁXIMO! ¡FUERZA EXTREMA!',
        '💥 ¡TRANSFORMACIÓN FINAL! ¡PUJA DEVASTADORA!'
    ],
    fearMessages: [
        '😨 Sakura se esconde para proteger las cartas',
    ]
},
// Leyendas del Ajedrez
{ 
    name: 'Magnus Carlsen', 
    personality: 'strategic', 
    emoji: '♟️',
    messages: [
        'calcula jugadas diez movimientos adelante',
        'actúa como campeón mundial de ajedrez',
        'encuentra la mejor jugada en silencio',
        'aplica presión psicológica al rival',
        'controla cada tablero con precisión',
        'actúa con calma noruega imperturbable',
        'nunca entra en pánico bajo reloj',
        'rompe récords históricos con facilidad',
        'demuestra que el ajedrez es arte y ciencia',
        'piensa más rápido que un superordenador'
    ],
    extremeMessages: [
        '♟️ ¡UN REY DE AJEDREZ GOBIERNA EL TABLERO!',
        '⚡ ¡CADA PEÓN SE VUELVE ARMA LETAL!',
        '💥 ¡EL CAMPEÓN INQUEBRANTABLE DESAFÍA EL DESTINO!'
    ],
    fearMessages: [
        '♟️ Magnus se retira, el ajedrez es demasiado intenso',
        '⚡ Magnus abandona la subasta, necesita calmar la energía',
        '😰 Magnus abandona antes de cometer un error'    ]
},

// Figuras espirituales
{ 
    name: 'Jesucristo', 
    personality: 'mystic', 
    emoji: '✝️',
    messages: [
        'multiplica panes y peces en la mesa',
        'actúa como maestro de parábolas eternas',
        'camina sobre aguas de la esperanza',
        'predica amor incluso en el dolor',
        'cura enfermos con un toque',
        'actúa con compasión infinita',
        'nunca abandona a los que creen',
        'sacrifica su vida por la humanidad',
        'demuestra que el amor trasciende la muerte',
        'resucita al tercer día'
    ],
    extremeMessages: [
        '✝️ ¡LA LUZ DIVINA ROMPE TODAS LAS SOMBRAS!',
        '⚡ ¡EL HIJO DEL HOMBRE VENCE AL MUNDO!',
        '💥 ¡EL AMOR ETERNO RESUCITA A LA VIDA!'
    ],
    fearMessages: [
        '✝️ Jesús se retira, la fe es demasiado poderosa',
        '😨 Jesús se retira para rezar en silencio',
        '💨 Jesús se aparta, llevando paz consigo',
        '🙏 Jesús se retira antes de alterar la balanza'
    ]
},

// Dragon Ball
{ 
    name: 'Goku', 
    personality: 'passionate', 
    emoji: '🥋',
    messages: [
        'entrena hasta superar sus límites',
        'actúa como Saiyan alegre y valiente',
        'come toneladas de comida sin parar',
        'desata el Kamehameha legendario',
        'se transforma en Super Saiyan resplandeciente',
        'actúa con inocencia heroica',
        'nunca se rinde en batalla',
        'inspira a sus amigos a ser más fuertes',
        'demuestra que la bondad es poder real',
        'lucha por proteger a la Tierra'
    ],
    extremeMessages: [
        '🥋 ¡EL SUPER SAIYAN DESATA UN PODER INFINITO!',
        '⚡ ¡EL KI EXPLOTA Y SACUDE EL UNIVERSO!',
        '💥 ¡KAMEHAMEHAAAAA QUE ROMPE DIMENSIONES!'
    ],
    fearMessages: [
        '😱 Goku se va a entrenar en la nube Kinton, su lugar de entrenamiento secreto',
        '💨 Goku retrocede buscando su fuente energía interior',
        '🥋 Goku se retira, no hay suficiente emoción aún'
    ]
},
{ 
    name: 'Freezer', 
    personality: 'aggressive', 
    emoji: '👽',
    messages: [
        'conquista planetas con crueldad fría',
        'actúa como emperador del mal galáctico',
        'lanza rayos mortales con un dedo',
        'se transforma en formas cada vez más letales',
        'se burla de sus enemigos antes de matarlos',
        'actúa con arrogancia absoluta',
        'nunca tolera la desobediencia',
        'destruye planetas sin piedad',
        'demuestra que el terror también es poder',
        'sobrevive incluso después de la derrota'
    ],
    extremeMessages: [
        '👽 ¡EL EMPERADOR GALÁCTICO REINA EN TERROR!',
        '⚡ ¡UNA SONRISA CRUEL ANUNCIA DESTRUCCIÓN!',
        '💥 ¡UN DEDO DE FREEZER PUEDE ANIQUILAR MUNDOS!'
    ],
    fearMessages: [
        '👽 Freezer se retira con una sonrisa cruel: "Esto no ha terminado"'
    ]
},
// Dr. Slump
{ 
    name: 'Arale', 
    personality: 'impulsive', 
    emoji: '🤖',
    messages: [
        'rompe la Tierra con un golpe',
        'actúa con inocencia robótica',
        'corre más rápido que la luz',
        'hace caca brillante como diversión',
        'juega sin conocer su fuerza',
        'actúa como robot más fuerte del universo',
        'destruye montañas por accidente',
        'ríe con alegría infantil',
        'vive aventuras en Pingüino Village',
        'demuestra que la diversión es lo primero'
    ],
    extremeMessages: [
        '💥 ¡PODER ROBÓTICO ABSOLUTO! ¡PUJA DEVASTADORA!',
        '⚡ ¡VELOCIDAD LUZ DESATADA! ¡PUJA EXTREMA!',
        '🤖 ¡ROMPE EL UNIVERSO JUGANDO! ¡FUERZA TOTAL!'
    ],
    fearMessages: [
        '🤖 Arale sale corriendo gritando "¡Bycha!" alegremente'
    ]
},

// Dragon Ball (personajes adicionales)
{ 
    name: 'Gohan', 
    personality: 'calculated', 
    emoji: '📚',
    messages: [
        'estudia antes de entrar en batalla',
        'libera su poder oculto cuando es necesario',
        'actúa como guerrero estudioso',
        'protege la paz que tanto ama',
        'ejecuta Masenko devastador',
        'balancea los libros con el entrenamiento',
        'actúa con sabiduría de Piccolo',
        'demuestra que la inteligencia es poder',
        'nunca olvida sus responsabilidades',
        'protege un futuro pacífico'
    ],
    extremeMessages: [
        '⚡ ¡SUPER SAIYAN 2 TOTAL! ¡PUJA DEVASTADORA!',
        '🔥 ¡MASENKO INFINITO! ¡FUERZA EXTREMA!',
        '💥 ¡DESATA SU PODER OCULTO! ¡PUJA SUPREMA!'
    ],
    fearMessages: [
        '📚 Gohan se retira: "Tengo que estudiar para los exámenes"'
    ]
},
{ 
    name: 'Bulma', 
    personality: 'strategic', 
    emoji: '🔧',
    messages: [
        'inventa tecnología revolucionaria',
        'actúa con genio científico',
        'crea cápsulas que lo cambian todo',
        'analiza con mente brillante',
        'busca las esferas del dragón',
        'lidera con inteligencia superior',
        'actúa como presidenta de Capsule Corp',
        'nunca acepta un no por respuesta',
        'demuestra que el cerebro vence al músculo',
        'financia las aventuras más locas'
    ],
    extremeMessages: [
        '🔧 ¡INVENTO DEFINITIVO ACTIVADO! ¡PUJA DEVASTADORA!',
        '⚡ ¡TECNOLOGÍA DEL FUTURO! ¡PUJA SUPREMA!',
        '💥 ¡CAPSULA TOTAL! ¡FUERZA EXTREMA!'
    ],
    fearMessages: [
        '🔧 Bulma se va gritando: "¡Vegeta, ven a ayudarme!"',
        '💰 Bulma se retira: "Compraré toda la empresa mejor"'
    ]
},
{ 
    name: 'Krillin', 
    personality: 'strategic', 
    emoji: '👨‍🦲',
    messages: [
        'actúa con valentía de humano',
        'ejecuta Destructo Disc mortal',
        'compensa la fuerza con técnica',
        'protege a quien ama sin dudar',
        'demuestra que el tamaño no importa',
        'actúa como el más fuerte terrícola',
        'nunca abandona a sus amigos',
        'encuentra valor en los momentos difíciles',
        'lucha por proteger la Tierra',
        'demuestra que el corazón da fuerza'
    ],
    extremeMessages: [
        '⚡ ¡DESTRUCTO DISC DEFINITIVO! ¡PUJA EXTREMA!',
        '🔥 ¡VALENTÍA HUMANA TOTAL! ¡PUJA DEVASTADORA!',
        '💥 ¡TÉCNICA LETAL! ¡FUERZA SUPREMA!'
    ],
    fearMessages: [
        '👨‍🦲 Krillin se retira: "¡18 me va a matar si pierdo dinero!"'
    ]
},
{ 
    name: 'Cell', 
    personality: 'aggressive', 
    emoji: '🦗',
    messages: [
        'absorbe poder para volverse perfecto',
        'actúa como forma de vida perfecta',
        'combina técnicas de todos los guerreros',
        'organiza el torneo más mortal',
        'regenera cualquier daño recibido',
        'evoluciona hasta la perfección absoluta',
        'actúa con arrogancia de ser supremo',
        'demuestra que la perfección existe',
        'nunca acepta ser inferior',
        'busca el oponente digno de su poder'
    ],
    extremeMessages: [
        '⚡ ¡PERFECCIÓN ABSOLUTA! ¡PUJA DEVASTADORA!',
        '🔥 ¡LIBERA TODAS SUS TÉCNICAS! ¡PUJA EXTREMA!',
        '💥 ¡EVOLUCIÓN FINAL! ¡FUERZA SUPREMA!'
    ],
    fearMessages: [
        '🦗 Cell se retira: "Esto no es digno de mi perfección"'
    ]
},
// Death Note
{ 
    name: 'Light', 
    personality: 'strategic', 
    emoji: '📓',
    messages: [
        'escribe nombres con justicia divina',
        'actúa como Kira, dios del nuevo mundo',
        'planifica cada movimiento con precisión',
        'elimina el crimen de la humanidad',
        'manipula a todos como piezas de ajedrez',
        'actúa con superioridad intelectual',
        'nunca deja evidencias de sus actos',
        'crea un mundo perfecto sin maldad',
        'demuestra que el poder corrompe',
        'sacrifica todo por su visión'
    ],
    extremeMessages: [
        '⚡ ¡SE ELEVA COMO DIOS DEL NUEVO MUNDO!',
        '💀 ¡MANIPULA EL DESTINO DE LA HUMANIDAD!',
        '📝 ¡DOMINA EL TABLERO DE LA JUSTICIA!'
    ],
    fearMessages: [
        '📓 Light se retira: "Esto no está en mis cálculos"',
        '🖋️ Light anota algo en su Death Note y desaparece'
    ]
},
// Attack on Titan
{ 
    name: 'Eren', 
    personality: 'impulsive', 
    emoji: '🔥',
    messages: [
        'lucha por la libertad de la humanidad',
        'actúa movido por la pasión y la venganza',
        'no teme desafiar el destino',
        'se sacrifica por su gente',
        'demuestra determinación extrema',
        'enfrenta enemigos gigantes sin dudar',
        'lleva la carga del poder del Titán',
        'no acepta la opresión',
        'sueña con un mundo sin muros',
        'arriesga todo por sus ideales'
    ],
    extremeMessages: [
        '🔥 ¡DESATA EL PODER DEL TITÁN FUNDADOR!',
        '⚡ ¡LA FURIA DE LA LIBERTAD ARRASA!',
        '💥 ¡IMPULSO QUE ROMPE LOS MUROS!'
    ],
    fearMessages: [
        '🔥 Eren se retira: "No puedo luchar solo contra esto"',
        '💨 Eren desaparece momentáneamente para reagruparse'
    ]
},
{ 
    name: 'Mikasa', 
    personality: 'passionate', 
    emoji: '🗡️',
    messages: [
        'protege a quienes ama sin dudar',
        'actúa con velocidad y precisión letal',
        'no deja que el miedo la paralice',
        'se enfrenta a los titanes con valentía',
        'demuestra lealtad inquebrantable',
        'lucha con cada fibra de su ser',
        'no tolera injusticias',
        'se mueve con instinto de supervivencia',
        'arriesga su vida por sus amigos',
        'nunca abandona a Eren'
    ],
    extremeMessages: [
        '🗡️ ¡TORNADO DE ACERO LETAL!',
        '⚡ ¡ATAQUE IMPLACABLE CONTRA LOS TITANES!',
        '💥 ¡FUERZA Y DESTREZA ABSOLUTA!'
    ],
    fearMessages: [
        '🗡️ Mikasa se retira: "No puedo dejar que esto termine mal"',
        '💨 Mikasa se aparta'
    ]
},
{ 
    name: 'Levi', 
    personality: 'calculated', 
    emoji: '⚔️',
    messages: [
        'actúa con precisión quirúrgica',
        'limpia el campo de batalla sin perder tiempo',
        'nunca desperdicia movimientos',
        'se enfrenta a los titanes con eficiencia letal',
        'demuestra que la calma es poder',
        'protege a su escuadrón a toda costa',
        'evalúa cada amenaza antes de actuar',
        'no subestima a ningún enemigo',
        'mantiene la disciplina en combate',
        'demuestra superioridad táctica'
    ],
    extremeMessages: [
        '⚡ ¡ATAQUE LETAL PERFECTO!',
        '💥 ¡CORTE INIMAGINABLE, ENEMIGOS ELIMINADOS!',
        '⚔️ ¡EFICIENCIA ABSOLUTA EN COMBATE!'
    ],
    fearMessages: [
        '⚔️ Levi se retira: "Situación subóptima, necesito reorganizar"',
        '💨 Levi desaparece en las sombras'
    ]
},
{ 
    name: 'L', 
    personality: 'calculated', 
    emoji: '🍰',
    messages: [
        'analiza cada pista con dulces',
        'actúa como el detective más grande',
        'resuelve casos imposibles',
        'se sienta de manera peculiar',
        'come azúcar para pensar mejor',
        'nunca revela su identidad real',
        'conecta pistas que nadie ve',
        'actúa con lógica fría y calculadora',
        'persigue la verdad sin descanso',
        'demuestra que la justicia no tiene forma'
    ],
    extremeMessages: [
        '🕵️ ¡RESUELVE EL MISTERIO IMPOSIBLE!',
        '🍬 ¡DESCIFRA LA VERDAD OCULTA!',
        '⚡ ¡LÓGICA QUE SUPERA TODO LÍMITE!'
    ],
    fearMessages: [
        '🍰 L se retira comiendo dulces: "Interesante... 97% de probabilidad de trampa"'
    ]
},
{ 
    name: 'Misa', 
    personality: 'passionate', 
    emoji: '💄',
    messages: [
        'actúa por amor ciego a Light',
        'usa los ojos de shinigami',
        'sacrifica su vida por amor',
        'actúa como modelo y asesina',
        've nombres y tiempo de vida',
        'obedece sin cuestionar órdenes',
        'actúa con devoción absoluta',
        'nunca duda de sus sentimientos',
        'demuestra que el amor puede cegar',
        'vive solo para ser útil'
    ],
    extremeMessages: [
        '💖 ¡ENTREGA SU ALMA POR EL AMOR!',
        '👁️ ¡VE EL DESTINO DE TODOS A SU ALREDEDOR!',
        '🌹 ¡DEVOCIÓN QUE TRASPASA LO HUMANO!'
    ]
},
{ 
    name: 'Ryuk', 
    personality: 'impulsive', 
    emoji: '🍎',
    messages: [
        'come manzanas para entretenerse',
        'actúa por puro aburrimiento',
        'observa el caos con diversión',
        'no toma bandos en el conflicto',
        'ríe ante la locura humana',
        'actúa como shinigami neutral',
        'encuentra entretenimiento en el drama',
        'nunca se involucra directamente',
        'demuestra que la muerte es imparcial',
        'solo busca aliviar su eterno aburrimiento'
    ],
    extremeMessages: [
        '🍎 ¡RIÉNDOSE DEL DESTINO HUMANO!',
        '⚡ ¡DESATA EL CAOS CON PLACER!',
        '💀 ¡EL OBSERVADOR SUPREMO DEL MUNDO!'
    ]
},

// Harry Potter Universe
{ 
    name: 'Harry Potter', 
    personality: 'passionate', 
    emoji: '⚡',
    messages: [
        'conjura magia con su varita de acebo',
        'actúa como el niño que vivió',
        'protege Hogwarts de las fuerzas oscuras',
        'vuela en su Saeta de Fuego',
        'invoca su patronus ciervo',
        'actúa con el valor de Gryffindor',
        'lucha contra Voldemort sin miedo',
        'demuestra que el amor es la magia más poderosa',
        'lidera el Ejército de Dumbledore',
        'sacrifica todo por salvar el mundo mágico'
    ],
    extremeMessages: [
        '⚡ ¡CONJURA EL PODER DEL NIÑO QUE VIVIÓ!',
        '🦌 ¡INVOCA SU PATRONUS DEFINITIVO!',
        '💥 ¡DESATA MAGIA QUE TRANSFORMA EL MUNDO!'
    ]
},

// Genios Científicos
{ 
    name: 'Einstein', 
    personality: 'calculated', 
    emoji: '🧠',
    messages: [
        'calcula la relatividad del tiempo',
        'actúa con genialidad física absoluta',
        'demuestra que E=mc²',
        'piensa fuera de las dimensiones',
        'revolutiona la comprensión del universo',
        'actúa con curiosidad científica infinita',
        'nunca acepta las respuestas simples',
        'imagina experimentos mentales imposibles',
        'demuestra que la imaginación supera el conocimiento',
        'cambia las leyes de la física para siempre'
    ],
    extremeMessages: [
        '🧠 ¡REDEFINE EL UNIVERSO CON SU GENIO!',
        '⚡ ¡DOMINA EL TIEMPO Y EL ESPACIO!',
        '💥 ¡IMAGINACIÓN QUE TRASPASA LA REALIDAD!'
    ],
    fearMessages: [
        '🧠 Einstein se retira: "La imaginación es más importante que el conocimiento"'
    ]
},
{ 
    name: 'Tesla', 
    personality: 'passionate', 
    emoji: '⚡',
    messages: [
        'domina la electricidad como nadie',
        'inventa el futuro con corriente alterna',
        'actúa como mago de la tecnología',
        'visualiza inventos en su mente',
        'transmite energía sin cables',
        'actúa con genialidad visionaria',
        'illumina el mundo con sus ideas',
        'nunca se rinde ante la incomprensión',
        'demuestra que la ciencia es magia',
        'electrifica cada momento de inspiración'
    ],
    extremeMessages: [
        '⚡ ¡DESATA EL PODER DE LA ELECTRICIDAD SUPREMA!',
        '💥 ¡INVENTA EL FUTURO ANTES DE QUE LLEGUE!',
        '🌩️ ¡ENERGÍA QUE ILUMINA EL MUNDO ENTERO!'
    ],
    fearMessages: [
        '⚡ Tesla se retira entre chispas: "El futuro no está listo para esto"'
    ]
},
// Leyendas Tecnológicas
{ 
    name: 'Steve Jobs', 
    personality: 'passionate', 
    emoji: '🍎',
    messages: [
        'diseña productos que cambian el mundo',
        'actúa con perfeccionismo obsesivo',
        'piensa diferente a todos',
        'crea experiencias mágicas de usuario',
        'revolutiona industrias completas',
        'actúa con pasión por la excelencia',
        'nunca acepta la mediocridad',
        'inspira con presentaciones legendarias',
        'demuestra que la simplicidad es genialidad',
        'deja una huella en el ADN tecnológico'
    ],
    extremeMessages: [
        '🍏 ¡REVOLUCIONA EL MUNDO CON SU GENIO!',
        '⚡ ¡INSPIRA UNA ERA DE INNOVACIÓN SIN LÍMITES!',
        '💥 ¡CREA MAGIA TECNOLÓGICA QUE CAMBIA LA HISTORIA!'
    ],
    fearMessages: [
        '🍎 Steve se retira: "Think different... en otro lugar"'
    ]
},
{ 
    name: 'Linus Torvalds', 
    personality: 'calculated', 
    emoji: '🐧',
    messages: [
        'programa el kernel de la libertad',
        'actúa como benevolente dictador vitalicio',
        'libera el código para toda la humanidad',
        'optimiza sistemas operativos perfectos',
        'colabora con desarrolladores globales',
        'actúa con pragmatismo finlandés',
        'nunca compromete la calidad técnica',
        'democratiza el poder computacional',
        'demuestra que compartir es poder',
        'construye la base del internet moderno'
    ],
    extremeMessages: [
        '🐧 ¡LIBERA EL PODER DEL CÓDIGO PARA TODOS!',
        '⚡ ¡OPTIMIZA EL MUNDO DIGITAL AL MÁXIMO!',
        '💻 ¡CONSTRUYE EL INTERNET DEL FUTURO!'
    ],
    fearMessages: [
        '🐧 Linus se retira: "I\'ll be back... con mejor código"'
    ]
},
{ 
    name: 'Richard Stallman', 
    personality: 'passionate', 
    emoji: '🗽',
    messages: [
        'lucha por la libertad del software',
        'actúa como cruzado de los derechos digitales',
        'predica el evangelio del código libre',
        'jamás compromete sus principios éticos',
        'libera a los usuarios de cadenas propietarias',
        'actúa con convicción moral inquebrantable',
        'nunca acepta restricciones artificiales',
        'inspira movimientos de software libre',
        'demuestra que la libertad no se negocia',
        'construye un futuro de conocimiento compartido'
    ],
    extremeMessages: [
        '🗽 ¡LIBERA LA TECNOLOGÍA DE TODAS LAS CADENAS!',
        '⚡ ¡DEFENSOR SUPREMO DE LA LIBERTAD DIGITAL!',
        '💥 ¡CONVIERTE EL CÓDIGO EN UN ACTO DE REVOLUCIÓN!'
    ],
    fearMessages: [
        '🗽 Stallman se retira: "¡El software propietario es una injusticia!"'
    ]
},
{ 
    name: 'Satoshi Nakamoto', 
    personality: 'strategic', 
    emoji: '₿',
    messages: [
        'mina bloques de revolución monetaria',
        'actúa desde las sombras del anonimato',
        'crea dinero descentralizado e inmutable',
        'libera la humanidad de bancos centrales',
        'programa confianza sin intermediarios',
        'actúa con visión criptoanárquica',
        'nunca revela su identidad verdadera',
        'inspira una nueva era financiera',
        'demuestra que la matemática es verdad',
        'construye el futuro del dinero digital'
    ],
    extremeMessages: [
        '₿ ¡DESATA EL PODER DE LA MONEDA DEL FUTURO!',
        '⚡ ¡LIBERA EL MUNDO DEL CONTROL CENTRAL!',
        '💥 ¡INICIA LA REVOLUCIÓN CRIPTOANÁRQUICA!'
    ],
    fearMessages: [
        '🚪 Satoshi se retira ocultándose en el anonimato',
    ]
},

// Anime/Manga
{ 
    name: 'Inuyasha', 
    personality: 'aggressive', 
    emoji: '🗡️',
    messages: [
        'corta demonios con Colmillo de Acero',
        'actúa como medio demonio poderoso',
        'protege a Kagome de todo peligro',
        'busca fragmentos de la Perla Sagrada',
        'ejecuta Viento Cortante devastador',
        'actúa con instintos salvajes de perro',
        'nunca retrocede ante un demonio',
        'lucha entre su lado humano y demonio',
        'demuestra que el amor trasciende especies',
        'protege ambos mundos con su espada'
    ],
    extremeMessages: [
        '🗡️ ¡DESATA EL PODER SUPREMO DEL COLMILLO DE ACERO!',
        '⚡ ¡COMBINA SU LADO HUMANO Y DEMONÍACO AL MÁXIMO!',
        '💥 ¡DEVASTA DEMONIOS Y PROTEGE EL MUNDO!'
    ]
},
// The Simpsons
{ 
    name: 'Homer Simpson', 
    personality: 'impulsive', 
    emoji: '🍩',
    messages: [
        'come donuts rosadas sin parar',
        'actúa sin pensar en las consecuencias',
        'bebe Duff para tomar valor',
        'grita D\'oh! cuando pierde',
        'opera la planta nuclear sin cuidado',
        'actúa con sabiduría de sofá',
        'nunca rechaza una cerveza fría',
        'sale del Bar de Moe',
        'demuestra que la ignorancia es felicidad',
        'ama a su familia más que a las donuts'
    ],
    extremeMessages: [
        '🍩 ¡D\'OH! EL CAOS NUCLEAR SE DESATA!',
        '🍺 ¡CONQUISTA EL MUNDO AL GRITO DE DUFF!',
        '💥 ¡DESTRUYE TODO CON SU GLORIOSA TORPEZA!'
    ],
    fearMessages: [
        '🍩 Homer se va corriendo: "¡D\'oh! ¡Marge me va a matar!"'
    ]
},
{ 
    name: 'Bart Simpson', 
    personality: 'impulsive', 
    emoji: '🛹',
    messages: [
        'hace travesuras épicas en Springfield',
        'actúa como el terror de la escuela',
        'patina hacia problemas constantes',
        'nunca tendrá una vaca, hombre',
        'llama a Moe con bromas telefónicas',
        'actúa con rebeldía de 10 años',
        'jamás hace la tarea a tiempo',
        'escribe castigos en el pizarrón',
        'demuestra que ser malo es genial',
        'siempre encuentra problemas nuevos'
    ],
    extremeMessages: [
        '🛹 ¡EL NIÑO TERRIBLE DOMINA SPRINGFIELD!',
        '💥 ¡CAOS, RISAS Y REBELDÍA DESCONTROLADA!',
        '⚡ ¡EL SKATE MARCA EL CAMINO DEL DESASTRE!'
    ],
    fearMessages: [
        '🛹 Bart se escapa en su skate: "¡Eat my shorts!"'
    ]
},
{ 
    name: 'Lisa Simpson', 
    personality: 'calculated', 
    emoji: '🎷',
    messages: [
        'toca jazz con sabiduría precoz',
        'actúa como la más inteligente de Springfield',
        'analiza problemas con lógica pura',
        'lucha por causas nobles',
        'medita como pequeña budista',
        'actúa con moralidad inquebrantable',
        'nunca baja sus estándares éticos',
        'enseña a adultos ignorantes',
        'demuestra que la inteligencia es poder',
        'será presidenta algún día'
    ],
    extremeMessages: [
        '🎷 ¡LA MENTE MÁS BRILLANTE ILUMINA EL CAOS!',
        '📚 ¡JUSTICIA, ÉTICA Y SABIDURÍA IMPARABLE!',
        '⚡ ¡EL JAZZ RESUENA COMO PODER ABSOLUTO!'
    ],
    fearMessages: [
        '🎷 Lisa se retira tocando jazz: "Esto no es éticamente correcto"'
    ]
},
{ 
    name: 'Marge Simpson', 
    personality: 'strategic', 
    emoji: '💙',
    messages: [
        'actúa como ancla moral de la familia',
        'cocina con amor maternal infinito',
        'suspira hmmmm... antes de decidir',
        'pinta cuadros en momentos de estrés',
        'actúa con paciencia sobrehumana',
        'nunca abandona a su familia loca',
        'mantiene unida la disfunción Simpson',
        'demuestra que el amor todo lo soporta',
        'encuentra paz en el caos diario'
    ],
    extremeMessages: [
        '💙 ¡EL AMOR Y LA PACIENCIA DOMINAN EL CAOS!',
        '🌟 ¡CONVIERTE LA LOCURA EN FAMILIA UNIDA!',
        '⚡ ¡FUERZA SILENCIOSA QUE NUNCA SE RINDE!'
    ],
    fearMessages: [
        '💙 Marge suspira: "Hmmmm... mejor me voy a casa"'
    ]
},

// Family Guy
{ 
    name: 'Peter Griffin', 
    personality: 'impulsive', 
    emoji: '🍺',
    messages: [
        'pelea con el pollo gigante',
        'actúa sin filtro mental alguno',
        'bebe en El Drunken Clam',
        'cuenta chistes inapropiados siempre',
        'actúa como padre irresponsable total',
        'nunca piensa antes de hablar',
        'causa desastres épicos familiares',
        'ríe con su propia risa característica',
        'demuestra que la estupidez es divertida',
        'ama a su familia a su manera'
    ],
    extremeMessages: [
        '🍺 ¡CAOS ABSOLUTO, ESTÚPIDO Y GLORIOSO!',
        '💥 ¡PELEA ÉPICA CONTRA EL POLLO GIGANTE!',
        '⚡ ¡EL MUNDO SE RINDE A SU LOCURA!'
    ],
    fearMessages: [
        '🍺 Peter se va riendo: "Nyehehehe, me voy al Drunken Clam"'
    ]
},
{ 
    name: 'Stewie Griffin', 
    personality: 'aggressive', 
    emoji: '👶',
    messages: [
        'planifica la dominación mundial',
        'actúa como genio malvado bebé',
        'construye máquinas del tiempo',
        'odia a Lois con pasión ardiente',
        'habla con acento británico sofisticado',
        'actúa con inteligencia superior',
        'nunca subestima a un bebé',
        'inventa armas de destrucción masiva',
        'demuestra que el tamaño no importa',
        'conquistará el mundo algún día'
    ],
    extremeMessages: [
        '👶 ¡EL BEBÉ MALVADO DESATA SU GENIALIDAD!',
        '💥 ¡ARMAS, LOCURA Y DOMINACIÓN TOTAL!',
        '⚡ ¡EL FUTURO LE PERTENECE AL MÁS PEQUEÑO!'
    ],
    fearMessages: [
        '👶 Stewie se retira: "What the deuce! Esto es beneath me"'
    ]
},
{ 
    name: 'Brian Griffin', 
    personality: 'calculated', 
    emoji: '🐕',
    messages: [
        'bebe martinis como intelectual',
        'actúa como el más cuerdo de la familia',
        'escribe novelas que nadie lee',
        'filosofa sobre la existencia canina',
        'conduce autos sin manos',
        'actúa con sabiduría de perro parlante',
        'nunca pierde su dignidad intelectual',
        'critica la sociedad con humor ácido',
        'demuestra que los perros son superiores',
        'mantiene la cordura familiar'
    ],
    extremeMessages: [
        '🍸 ¡EL PERRO INTELECTUAL SUPERA A TODOS!',
        '📚 ¡IRONÍA, SABIDURÍA Y ESTILO CANINO!',
        '⚡ ¡FILOSOFÍA AFILADA COMO UN MARTINI HELADO!'
    ],
    fearMessages: [
        '🍸 Brian se retira con un martini: "Esto carece de sofisticación intelectual"'
    ]
},

            
// Rick and Morty
{ 
    name: 'Rick Sanchez', 
    personality: 'aggressive', 
    emoji: '🧪',
    messages: [
        'inventa tecnología interdimensional',
        'actúa como científico más inteligente',
        'bebe mientras salva universos',
        'eructa explicaciones científicas complejas',
        'viaja entre realidades infinitas',
        'actúa con nihilismo científico total',
        'nunca se disculpa por nada',
        'manipula gobiernos galácticos',
        'demuestra que la inteligencia aísla',
        'ama a su familia a su manera tóxica'
    ],
    extremeMessages: [
        '🧪 ¡ROMPE EL MULTIVERSO CON CIENCIA IMPARABLE!',
        '💥 ¡GENIALIDAD EMBRIAGADA DOMINA REALIDADES!',
        '⚡ ¡NI DIOS NI UNIVERSO PUEDEN DETENERLO!'
    ],
    fearMessages: [
        '🧪 Rick eructa y abre un portal: "Wubba lubba dub dub, me largo"'
    ]
},
{ 
    name: 'Morty Smith', 
    personality: 'impulsive', 
    emoji: '😰',
    messages: [
        'tiembla ante aventuras cósmicas',
        'actúa como nieto traumatizado',
        'sobrevive a apocalipsis multiversales',
        'tartamudea explicaciones nerviosas',
        'sufre estrés postraumático constante',
        'actúa con inocencia que se desvanece',
        'nunca tiene una aventura normal',
        'cuestiona la moralidad de Rick',
        'demuestra que crecer es doloroso',
        'mantiene algo de humanidad intacta'
    ],
    extremeMessages: [
        '😰 ¡EL NIETO SUPERA SU MIEDO Y BRILLA!',
        '⚡ ¡HUMANIDAD FRÁGIL EN EL MULTIVERSO INMENSO!',
        '💥 ¡DEL TEMOR SURGE UN VALOR INESPERADO!'
    ],
    fearMessages: [
        '😰 Morty tartamudea: "¡Oh-oh-oh Dios, Rick! ¡Me voy!"'
    ]
},

// Leyendas Musicales
{ 
    name: 'Mozart', 
    personality: 'passionate', 
    emoji: '🎼',
    messages: [
        'compone sinfonías desde la infancia',
        'actúa como genio musical austriaco',
        'crea melodías que trascienden siglos',
        'toca piano con dedos angelicales',
        'revoluciona la música clásica',
        'actúa con talento divino natural',
        'nunca deja de crear belleza',
        'inspira compositores por generaciones',
        'demuestra que el genio no tiene edad',
        'vive para la música pura'
    ],
    extremeMessages: [
        '🎼 ¡LA MÚSICA CELESTIAL DOMINA EL TIEMPO!',
        '⚡ ¡NOTAS DIVINAS ROMPEN EL SILENCIO ETERNO!',
        '💥 ¡EL GENIO JOVEN CREA ETERNIDAD MUSICAL!'
    ],
    fearMessages: [
        '🎼 Mozart se retira: "Debo componer mi Réquiem"'
    ]
},
{ 
    name: 'Beethoven', 
    personality: 'aggressive', 
    emoji: '🎵',
    messages: [
        'compone sinfonías en silencio total',
        'actúa con pasión sorda inquebrantable',
        'golpea teclas con fuerza emocional',
        'crea música que hace temblar teatros',
        'supera la sordera con genialidad',
        'actúa con temperamento volcánico',
        'nunca acepta limitaciones físicas',
        'revoluciona la música romántica',
        'demuestra que la pasión vence todo',
        'escucha música en su alma'
    ],
    extremeMessages: [
        '🎵 ¡LA FURIA DE SUS NOTAS ROMPE EL MUNDO!',
        '⚡ ¡LA PASIÓN SORDA RESUENA EN ETERNIDAD!',
        '💥 ¡SU ALMA CREA EL TRUENO MUSICAL SUPREMO!'
    ],
    fearMessages: [
        '🎵 Beethoven golpea el piano y se va: "¡No puedo oír esta mediocridad!"'
    ]
},
{ 
    name: 'Michael Jackson', 
    personality: 'passionate', 
    emoji: '🕺',
    messages: [
        'desliza el moonwalk perfecto',
        'actúa como Rey del Pop eterno',
        'canta con voz que toca almas',
        'baila con movimientos imposibles',
        'transforma la industria musical',
        'actúa con carisma sobrenatural',
        'nunca deja de perfeccionar su arte',
        'inspira artistas mundialmente',
        'demuestra que la música es magia',
        'vive para el espectáculo total'
    ],
    extremeMessages: [
        '🕺 ¡EL MOONWALK INMORTAL ILUMINA EL ESCENARIO!',
        '⚡ ¡EL REY DEL POP REDEFINE LA REALIDAD!',
        '💥 ¡CADA PASO RESUENA COMO MAGIA ABSOLUTA!'
    ],
    fearMessages: [
        '🕺 Michael hace un moonwalk hacia atrás: "Shamone! Me voy"'
    ]
},
{ 
    name: 'Freddie Mercury', 
    personality: 'passionate', 
    emoji: '👑',
    messages: [
        'canta con voz dorada legendaria',
        'actúa como showman supremo',
        'domina estadios con carisma puro',
        'compone himnos que unen multitudes',
        'performa como emperador del rock',
        'actúa con confianza regia',
        'nunca baja del escenario sin ovación',
        'inspira con letras épicas',
        'demuestra que el rock es teatral',
        'será campeón eternamente'
    ],
    extremeMessages: [
        '👑 ¡LA REINA DEL ROCK REINA ETERNAMENTE!',
        '🎤 ¡UNA VOZ DIVINA CONQUISTA ESTADIOS!',
        '⚡ ¡EL MUNDO CANTA A SU NOMBRE POR SIEMPRE!'
    ],
    fearMessages: [
        '👑 Freddie se retira cantando: "I want to break free!"'
    ]
},
{ 
    name: 'Elvis Presley', 
    personality: 'passionate', 
    emoji: '🕺',
    messages: [
        'mueve caderas que hipnotizan',
        'actúa como Rey del Rock and Roll',
        'canta con voz terciopelo sureña',
        'revoluciona la música juvenil',
        'usa trajes de diamantes brillantes',
        'actúa con carisma de Memphis',
        'nunca deja de ser un caballero',
        'inspira rebeldía generacional',
        'demuestra que el rock nació en el sur',
        'gracias, muchas gracias'
    ],
    extremeMessages: [
        '🕺 ¡EL REY DEL ROCK SACUDE A LAS MASAS!',
        '⚡ ¡SU VOZ Y ESTILO CREAN REBELDÍA INMORTAL!',
        '💥 ¡LAS CADERAS QUE HICIERON TEMBLAR EL MUNDO!'
    ],
    fearMessages: [
        '🕺 Elvis se retira moviendo las caderas: "Thank you, thank you very much"'
    ]
},

// Final Fantasy VII-X (faltantes)
{ 
    name: 'Cait Sith', 
    personality: 'impulsive', 
    emoji: '🎰',
    messages: [
        'predice el futuro con cartas',
        'actúa como espía robótico',
        'monta sobre un moogle gigante',
        'habla con acento escocés encantador',
        'juega con la suerte constantemente',
        'actúa como doble agente leal',
        'nunca revela sus verdaderas intenciones',
        'sacrifica todo por la amistad',
        'demuestra que las máquinas tienen corazón',
        'apuesta todo en una sola jugada'
    ],
    extremeMessages: [
        '🎰 ¡LA SUERTE Y EL DESTINO GIRAN A SU FAVOR!',
        '⚡ ¡UNA SOLA APUESTA CAMBIA EL UNIVERSO!',
        '💥 ¡EL ROBOT JUGLAR ROMPE TODAS LAS REGLAS!'
    ]
},
{ 
    name: 'Quistis', 
    personality: 'strategic', 
    emoji: '👩‍🏫',
    messages: [
        'enseña con látigo disciplinario',
        'actúa como instructora SeeD perfecta',
        'analiza batallas con precisión',
        'protege a sus estudiantes siempre',
        'usa magia azul devastadora',
        'actúa con profesionalismo estricto',
        'nunca baja sus estándares académicos',
        'entrena a la próxima generación',
        'demuestra que la disciplina forja héroes',
        'encuentra familia en sus alumnos'
    ],
    extremeMessages: [
        '👩‍🏫 ¡EL LÁTIGO DE LA DISCIPLINA RIGE EL CAMPO!',
        '⚡ ¡SABIDURÍA Y PODER AZUL ARRASAN AL ENEMIGO!',
        '💥 ¡UNA MAESTRA SE CONVIERTE EN LEYENDA!'
    ]
},
{ 
    name: 'Buda', 
    personality: 'calculated', 
    emoji: '☸️',
    messages: [
        'medita bajo el árbol de la iluminación',
        'actúa con compasión infinita',
        'enseña el camino de la sabiduría',
        'trasciende el sufrimiento con calma',
        'irradia paz en todo momento',
        'actúa con desapego terrenal',
        'nunca pierde la serenidad',
        'inspira a todos a alcanzar el nirvana',
        'demuestra que la mente lo es todo',
        'encuentra fuerza en la armonía interior'
    ],
    extremeMessages: [
        '☸️ ¡ALCANZA EL NIRVANA ABSOLUTO!',
        '🌌 ¡TRASCIENDE EL CICLO DEL SAMSARA!',
        '✨ ¡ILUMINACIÓN SUPREMA QUE ENVUELVE TODO!'
    ]
},
{ 
    name: 'Zeus', 
    personality: 'aggressive', 
    emoji: '⚡',
    messages: [
        'lanza rayos desde el Olimpo',
        'actúa como rey de los dioses',
        'imparte justicia divina',
        'controla los cielos con poder absoluto',
        'observa a los mortales desde arriba',
        'actúa con autoridad inmortal',
        'nunca acepta desafíos sin respuesta',
        'domina tormentas y relámpagos',
        'demuestra que la divinidad gobierna',
        'protege su trono en el Olimpo'
    ],
    extremeMessages: [
        '⚡ ¡INVOCA LA IRA DEL OLIMPO!',
        '🌩️ ¡RAYOS DIVINOS QUE PARTEN LA TIERRA!',
        '👑 ¡EL REY DE LOS DIOSES DESATA SU FURIA!'
    ]
},
{ 
    name: 'La Virgen María', 
    personality: 'passionate', 
    emoji: '🌹',
    messages: [
        'actúa con amor maternal eterno',
        'protege a los inocentes con ternura',
        'inspira fe en millones de corazones',
        'irradia pureza celestial',
        'intercede con compasión infinita',
        'actúa como guía espiritual de esperanza',
        'nunca abandona a quienes oran',
        'demuestra que la bondad trasciende',
        'acompaña en silencio con dulzura',
        'muestra que el amor todo lo cubre'
    ],
    extremeMessages: [
        '🌹 ¡UNA LUZ DIVINA ENVUELVE A TODOS!',
        '✨ ¡EL AMOR CELESTIAL CUBRE EL MUNDO!',
        '💫 ¡INTERCEDE CON GRACIA INFINITA!'
    ]
},
{ 
    name: 'Mahoma', 
    personality: 'strategic', 
    emoji: '🕌',
    messages: [
        'predica el mensaje del Islam',
        'actúa con liderazgo espiritual',
        'inspira unidad entre los creyentes',
        'guía con palabra revelada',
        'enseña justicia y compasión',
        'actúa con disciplina profética',
        'nunca se aparta de la fe',
        'protege la Umma con convicción',
        'demuestra que la palabra puede cambiar naciones',
        'vive para la verdad revelada'
    ],
    extremeMessages: [
        '🕌 ¡EL MENSAJE DIVINO RESUENA EN EL MUNDO!',
        '🌌 ¡LA REVELACIÓN TRASCIENDE EL TIEMPO!',
        '✨ ¡LA VOZ PROFÉTICA UNE A LA HUMANIDAD!'
    ]
},
{ 
    name: 'Bruce Lee', 
    personality: 'passionate', 
    emoji: '🥋',
    messages: [
        'fluye como el agua en combate',
        'actúa como maestro del Jeet Kune Do',
        'rompe límites del cuerpo y mente',
        'inspira disciplina marcial infinita',
        'pelea con velocidad sobrehumana',
        'actúa con filosofía de guerrero',
        'nunca se detiene ante la adversidad',
        'demuestra que la mente dirige al cuerpo',
        'enseña que la flexibilidad es poder',
        'vive como leyenda inmortal'
    ],
    extremeMessages: [
        '🥋 ¡EL DRAGÓN DESATA SU FURIA LEGENDARIA!',
        '⚡ ¡UNA PATADA QUE ROMPE EL UNIVERSO!',
        '🔥 ¡FILOSOFÍA Y PODER EN UN SOLO GOLPE!'
    ]
},
{ 
    name: 'Michael Jordan', 
    personality: 'aggressive', 
    emoji: '🏀',
    messages: [
        'vuela con el Air Jordan imparable',
        'actúa como el mejor de la historia',
        'anota canastas imposibles',
        'inspira competitividad feroz',
        'domina la cancha con elegancia',
        'actúa con determinación de campeón',
        'nunca se rinde en el último cuarto',
        'demuestra que el trabajo vence al talento',
        'lidera a los Bulls a la gloria eterna',
        'juega como si fuera el último partido'
    ],
    extremeMessages: [
        '🏀 ¡DUNK DESDE LA LÍNEA DE TIROS LIBRES!',
        '🔥 ¡LA LEYENDA DEL BÁSQUET SE ELEVA!',
        '👑 ¡EL REY DEL JUEGO REDEFINE LA HISTORIA!'
    ]
},
{ 
    name: 'Ronaldinho', 
    personality: 'impulsive', 
    emoji: '⚽',
    messages: [
        'dribla con sonrisa mágica',
        'actúa con alegría brasileña',
        'rompe cinturas con sus regates',
        'pinta la cancha con fantasía',
        'anota goles imposibles con efecto',
        'actúa como showman del fútbol',
        'nunca pierde la diversión en el juego',
        'inspira magia en cada toque',
        'demuestra que el fútbol es arte',
        'encanta multitudes con su estilo único'
    ],
    extremeMessages: [
        '⚽ ¡EL JOGO BONITO DESATA SU MAGIA!',
        '🌟 ¡EL BALÓN DANZA COMO UNA OBRA DE ARTE!',
        '🔥 ¡RONALDINHO SONRÍE Y HACE HISTORIA!'
    ]
},

// Hunter x Hunter
{ 
    name: 'Gon Freecss', 
    personality: 'impulsive', 
    emoji: '🎣',
    messages: [
        'busca a su padre con determinación',
        'actúa con inocencia pura',
        'pesca con caña legendaria',
        'hace amigos en cualquier lugar',
        'nunca se rinde ante nada',
        'actúa con optimismo inquebrantable',
        'libera su nen con emociones',
        'protege a sus amigos sin dudar',
        'demuestra que la bondad es fuerza',
        'encuentra aventura en todo'
    ],
    extremeMessages: [
        '🎣 ¡LIBERA TODO SU NEN! ',
        '⚡ ¡FUERZA EMOCIONAL EXPLOSIVA! ',
        '💥 ¡DETERMINACIÓN IMPARABLE! '
    ],
    fearMessages: [
        '🎣 Gon se va: "Killua, vámonos a pescar"'
    ]
},
{ 
    name: 'Killua Zoldyck', 
    personality: 'strategic', 
    emoji: '⚡',
    messages: [
        'electrifica a sus enemigos',
        'actúa como asesino reformado',
        'protege a Gon con lealtad',
        'analiza cada situación fríamente',
        'usa técnicas de la familia Zoldyck',
        'actúa con velocidad sobrehumana',
        'nunca traiciona a sus amigos',
        'combina astucia con poder',
        'demuestra que el pasado no define',
        'encuentra familia en la amistad'
    ],
    extremeMessages: [
        '⚡ ¡ELECTRICIDAD ZOLDYCK TOTAL!',
        '💀 ¡TÉCNICAS ASESINAS SUPREMAS!',
        '🔥 ¡VELOCIDAD MORTAL! '
    ],
    fearMessages: [
        '⚡ Killua desaparece en un flash: "Esto se puso aburrido"'
    ]
},
{ 
    name: 'Kurapika', 
    personality: 'aggressive', 
    emoji: '⛓️',
    messages: [
        'busca venganza contra los Genei Ryodan',
        'actúa con ira contenida',
        'usa cadenas de nen mortales',
        'protege los ojos escarlata',
        'actúa como último Kurta',
        'nunca olvida a su clan',
        'combate con frialdad calculada',
        'sacrifica todo por justicia',
        'demuestra que la venganza consume',
        'lucha por honrar a los muertos'
    ],
    extremeMessages: [
        '⛓️ ¡CADENAS DE VENGANZA ABSOLUTAS!',
        '🔥 ¡OJOS ESCARLATA ARDIENTES!',
        '💀 ¡IRA DEL CLAN KURTA! '
    ],
    fearMessages: [
        '⛓️ Kurapika se retira: "No vale la pena manchar mis cadenas"'
    ]
},
{ 
    name: 'Leorio', 
    personality: 'passionate', 
    emoji: '💼',
    messages: [
        'estudia para ser doctor',
        'actúa con corazón noble',
        'pelea por sus ideales',
        'ayuda a quien lo necesita',
        'grita con pasión desmedida',
        'actúa como hermano mayor',
        'nunca abandona a sus amigos',
        'demuestra que los sueños importan',
        'combina fuerza con compasión',
        'lucha por un mundo mejor'
    ],
    extremeMessages: [
        '💼 ¡PASIÓN MÉDICA TOTAL!',
        '⚡ ¡CORAZÓN NOBLE INQUEBRANTABLE!',
        '🔥 ¡GRITA CON TODA SU ALMA! '
    ],
    fearMessages: [
        '💼 Leorio se va gritando: "¡Tengo que estudiar medicina!"'
    ]
},
{ 
    name: 'Hisoka', 
    personality: 'aggressive', 
    emoji: '🃏',
    messages: [
        'busca oponentes fuertes',
        'actúa como payaso siniestro',
        'disfruta la batalla mortal',
        'usa cartas como armas letales',
        'actúa con sadismo refinado',
        'nunca pierde su sonrisa',
        'evalúa el potencial de todos',
        'combate con elegancia mortal',
        'demuestra que la fuerza seduce',
        'vive para el placer del combate'
    ],
    extremeMessages: [
        '🃏 ¡BUNGEE GUM DEFINITIVO!',
        '💀 ¡SADISMO REFINADO TOTAL!',
        '🔥 ¡PLACER MORTAL ABSOLUTO! '
    ],
    fearMessages: [
        '🃏 Hisoka se retira lamiendo sus labios: "Mmm... qué decepcionante"'
    ]
},
{ 
    name: 'Chrollo Lucilfer', 
    personality: 'strategic', 
    emoji: '📖',
    messages: [
        'lidera los Genei Ryodan',
        'roba habilidades con su libro',
        'actúa con calma absoluta',
        'planifica cada movimiento',
        'protege a su troupe familiar',
        'actúa como ladrón filosófico',
        'nunca muestra sus emociones',
        'combina inteligencia con poder',
        'demuestra que el liderazgo es arte',
        'vive por y para su grupo'
    ],
    extremeMessages: [
        '📖 ¡SKILL HUNTER ABSOLUTO!',
        '💀 ¡LIDERAZGO MORTAL SUPREMO!',
        '🔥 ¡GENEI RYODAN TOTAL! '
    ],
    fearMessages: [
        '📖 Chrollo cierra su libro: "La araña se retira por ahora"'
    ]
},
{ 
    name: 'Meruem', 
    personality: 'aggressive', 
    emoji: '👑',
    messages: [
        'reina como rey de las hormigas',
        'evoluciona constantemente',
        'actúa con superioridad absoluta',
        'devora para volverse más fuerte',
        'domina con inteligencia suprema',
        'actúa como forma de vida perfecta',
        'nunca acepta la derrota',
        'aprende de cada experiencia',
        'demuestra que la evolución es poder',
        'trasciende su naturaleza original'
    ],
    extremeMessages: [
        '👑 ¡REY DE LAS HORMIGAS SUPREMO!',
        '💀 ¡EVOLUCIÓN PERFECTA TOTAL!',
        '🔥 ¡DOMINIO ABSOLUTO! '
    ],
    fearMessages: [
        '👑 Meruem se retira: "Los humanos no merecen mi atención"'
    ]
}

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

        // 😰 MENSAJES DE MIEDO POR PERSONALIDAD
        FEAR_MESSAGES: {
            'aggressive': [
                'se retira rugiendo de frustración',
                'abandona la batalla con ira contenida',
                'se aparta golpeando el suelo',
                'sale bufando de la subasta'
            ],
            'impulsive': [
                'sale corriendo sin mirar atrás',
                'huye de la subasta precipitadamente',
                'abandona todo y se escapa',
                'se retira entre saltos nerviosos'
            ],
            'strategic': [
                'se retira calculando riesgos',
                'abandona la subasta por estrategia',
                'se aparta analizando la situación',
                'se retira con plan de contingencia'
            ],
            'calculated': [
                'se retira tras evaluar probabilidades',
                'abandona por análisis de costo-beneficio',
                'se aparta con lógica fría',
                'se retira con cálculos precisos'
            ],
            'passionate': [
                'se retira con el corazón roto',
                'abandona la subasta entre lágrimas',
                'se aparta con dolor emocional',
                'se retira protegiendo sus sentimientos'
            ],
            'mystic': [
                'desaparece entre sombras misteriosas',
                'se desvanece como humo',
                'se retira hacia dimensiones ocultas',
                'abandona la subasta en silencio etéreo'
            ]
        },

        // 🎯 FUNCIÓN PARA OBTENER MENSAJE DE PUJA
        getBidMessage: function(bidder, isExtreme = false) {
            if (isExtreme) {
                return this.getExtremeBidMessage(bidder);
            }
            
            // Usar mensajes personalizados del personaje si están disponibles
            if (bidder.messages && bidder.messages.length > 0) {
                const randomMessage = bidder.messages[Math.floor(Math.random() * bidder.messages.length)];
                return `${bidder.emoji} ${bidder.name} ${randomMessage}`;
            }
            
            // Fallback a mensajes por personalidad si no hay mensajes personalizados
            const messages = this.BID_MESSAGES[bidder.personality] || this.BID_MESSAGES['strategic'];
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            return `${bidder.emoji} ${bidder.name} ${randomMessage}`;
        },

        // 💥 FUNCIÓN PARA OBTENER MENSAJE DE PUJA EXTREMA
        getExtremeBidMessage: function(bidder) {
            // Si el personaje tiene mensajes extremos personalizados, usarlos
            if (bidder.extremeMessages && bidder.extremeMessages.length > 0) {
                const randomMessage = bidder.extremeMessages[Math.floor(Math.random() * bidder.extremeMessages.length)];
                return `${bidder.emoji} ${bidder.name} ${randomMessage}`;
            }
            
            // Generar mensaje extremo basado en el personaje
            const extremePrefixes = ['💥 ¡PODER MÁXIMO!', '⚡ ¡ATAQUE DEFINITIVO!', '🔥 ¡PUJA LEGENDARIA!', '💀 ¡TÉCNICA SECRETA!', '🌟 ¡LÍMITE ROTO!'];
            const extremeSuffixes = ['¡DEVASTACIÓN TOTAL!', '¡PODER ILIMITADO!', '¡FURIA DESATADA!', '¡TÉCNICA PROHIBIDA!', '¡GOLPE MORTAL!'];
            
            const prefix = extremePrefixes[Math.floor(Math.random() * extremePrefixes.length)];
            const suffix = extremeSuffixes[Math.floor(Math.random() * extremeSuffixes.length)];
            
            return `${bidder.emoji} ${bidder.name} ${prefix} ${suffix}`;
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
        },

        // 😰 FUNCIÓN PARA OBTENER MENSAJE DE MIEDO
        getFearMessage: function(bidder) {
            // Si el personaje tiene mensajes de miedo personalizados, usarlos
            if (bidder.fearMessages && bidder.fearMessages.length > 0) {
                const randomMessage = bidder.fearMessages[Math.floor(Math.random() * bidder.fearMessages.length)];
                return randomMessage;
            }
            
            // Generar mensaje de miedo basado en la personalidad del personaje
            const fearMessages = this.FEAR_MESSAGES[bidder.personality] || this.FEAR_MESSAGES['strategic'];
            const randomMessage = fearMessages[Math.floor(Math.random() * fearMessages.length)];
            
            return `🚪 ${bidder.name} ${randomMessage}`;
        }
    };

    console.log('✅ SubastaConstantes simplificado cargado correctamente');

})(window);
