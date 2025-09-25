// subasta-constantes.js
(function(global) {
    'use strict';

    global.SubastaConstantes = {
        TIMING_CONFIG: {
        // --- Mensajes y Animaciones ---
        MESSAGE_MIN_DELAY: 1000,           // Delay mínimo entre mensajes del historial
        PRICE_ANIMATION_DURATION: 1000,     // Duración de la animación del precio
        FORCE_DELAY_AMOUNT: 4500,          // Delay forzado para mensajes importantes
        
        // --- Momentos de Incertidumbre ---
        UNCERTAINTY_PAUSE_MIN: 6000,       // Pausa mínima durante incertidumbre
        UNCERTAINTY_PAUSE_MAX: 10000,      // Pausa máxima durante incertidumbre
        POST_UNCERTAINTY_BID_DELAY: 5000,  // Delay antes de pujar tras incertidumbre
        
        // --- Secuencia de Finalización ---
        FINISH_AUCTION_DELAY: 2500,        // Delay antes de mostrar ganador
        VICTORY_MESSAGE_DELAY: 2500,       // Delay forzado para mensaje de victoria
        ACCEPT_BUTTON_DELAY: 2000,         // Delay para mostrar botón de aceptar
        MOTIVATIONAL_MESSAGE_DELAY: 3500,  // Delay para mensaje motivacional final
        
        // --- Intervalos de Tick por Tipo de Subasta ---
        AUCTION_INTERVALS: {
            'rápida':  { min: 500, max: 3500 },   // Subastas rápidas
            'épica':   { min: 800, max: 4000 },   // Subastas largas y dramáticas
            'volátil': { min: 500, max: 7500 },   // Intervalos muy variables
            'normal':  { min: 200, max: 4000 }    // Intervalo equilibrado
        },
        
        // --- Mensajes de Inicio por Tipo ---
        RECORD_MESSAGE_DELAY: 1000         // Delay para mensaje después de récord
    },
    // 🎭 SISTEMA DE MENSAJES COHERENTES - Solo mensajes específicos por personaje
    narrativeMessages: {
                
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
            // Entradas específicas por personaje
            characterEntries: {
                // Final Fantasy VII
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
                'Aerith': [
                    'entra rodeada de pétalos de flores',
                    'aparece con su bastón de curación brillando',
                    'llega cantando una melodía ancestral',
                    'se presenta con una sonrisa que sana corazones'
                ],
                'Tifa': [
                    'entra con sus guantes de combate listos',
                    'aparece saltando desde las alturas',
                    'llega con determinación férrea en sus ojos',
                    'se presenta con sus puños preparados'
                ],
                'Barret': [
                    'entra rugiendo por AVALANCHE',
                    'aparece con su brazo-arma cargado',
                    'llega defendiendo el planeta',
                    'se presenta gritando por el futuro de Marlene'
                ],
                'Yuffie': [
                    'aparece saltando de las sombras ninja',
                    'entra robando la atención de todos',
                    'llega buscando materia valiosa',
                    'se presenta con agilidad sobrehumana'
                ],
                'Vincent': [
                    'emerge de las sombras silenciosamente',
                    'aparece con su capa ondeando misteriosamente',
                    'entra cargando pecados del pasado',
                    'se presenta con su Cerberus preparado'
                ],
                'Cid': [
                    'entra maldiciendo pero con determinación',
                    'aparece con herramientas de aviación',
                    'llega soñando con las estrellas',
                    'se presenta con su lanza del dragón'
                ],
                'RedXIII': [
                    'entra con la sabiduría de sus ancestros',
                    'aparece corriendo con gracia felina',
                    'llega honrando la memoria de Cosmo Canyon',
                    'se presenta con dignidad ancestral'
                ],
                
                // Final Fantasy VIII
                'Squall': [
                    'entra con su Gunblade desenvainada',
                    'aparece con expresión seria y determinada',
                    'llega olvidando por qué vino (malditos GF)',
                    'se presenta con su cicatriz característica'
                ],
                'Seifer': [
                    'entra compitiendo eternamente con Squall',
                    'aparece con su Hyperion brillando',
                    'llega proclamando su superioridad',
                    'se presenta como el caballero soñador'
                ],
                'Rinoa': [
                    'entra con Angelo a su lado',
                    'aparece con su Blaster Edge girando',
                    'llega olvidando los números (malditos GF)',
                    'se presenta con determinación romántica'
                ],
                'Quistis': [
                    'entra con su látigo preparado',
                    'aparece con autoridad de instructora',
                    'llega enseñando estrategias de combate',
                    'se presenta con conocimiento enciclopédico'
                ],
                'Zell': [
                    'entra con energía desbordante',
                    'aparece con sus guantes de combate',
                    'llega olvidando su presupuesto (malditos GF)',
                    'se presenta con entusiasmo contagioso'
                ],
                'Selphie': [
                    'entra con su nunchaku girando',
                    'aparece organizando la victoria perfecta',
                    'llega con una sonrisa imparable',
                    'se presenta con energía positiva'
                ],
                'Irvine': [
                    'entra con su rifle de precisión',
                    'aparece con estilo cowboy',
                    'llega conquistando corazones',
                    'se presenta con carisma natural'
                ],
                'Artemisa': [
                    'entra manipulando el tiempo mismo',
                    'aparece comprimiendo la realidad',
                    'llega desde el futuro para ganar',
                    'se presenta como la hechicera temporal'
                ],
                
                // Final Fantasy IX
                'Zidane': [
                    'entra con su cola ondeando',
                    'aparece robando corazones y carteras',
                    'llega con su daga gemela brillando',
                    'se presenta como el ladrón galante'
                ],
                'Garnet': [
                    'entra con majestuosidad real',
                    'aparece con su tiara resplandeciente',
                    'llega invocando poder ancestral',
                    'se presenta como la princesa guerrera'
                ],
                'Vivi': [
                    'entra con su bastón mágico humeando',
                    'aparece cuestionando su existencia',
                    'llega buscando el significado de la vida',
                    'se presenta con inocencia conmovedora'
                ],
                'Steiner': [
                    'entra con armadura reluciente',
                    'aparece defendiendo a la princesa',
                    'llega con honor inquebrantable',
                    'se presenta como el caballero leal'
                ],
                
                // Final Fantasy X
                'Tidus': [
                    'entra con su espada hermandad',
                    'aparece con sonrisa que oculta dolor',
                    'llega desde el sueño de Zanarkand',
                    'se presenta como la estrella de blitzball'
                ],
                'Yuna': [
                    'entra con bastón de invocadora',
                    'aparece danzando entre la vida y muerte',
                    'llega sacrificándose por Spira',
                    'se presenta con fe inquebrantable'
                ],
                'Wakka': [
                    'entra lanzando su pelota de blitzball',
                    'aparece con fe ciega en Yevon',
                    'llega protegiendo a su equipo',
                    'se presenta como el hermano mayor'
                ],
                'Lulu': [
                    'entra con muñecos vudú flotando',
                    'aparece con magia negra devastadora',
                    'llega con frialdad calculada',
                    'se presenta como la maga experimentada'
                ],
                'Kimahri': [
                    'entra con su lanza Ronso',
                    'aparece protegiendo en silencio',
                    'llega honrando tradiciones ancestrales',
                    'se presenta con pocas palabras pero mucha acción'
                ],
                'Rikku': [
                    'entra con gadgets Al Bhed',
                    'aparece desarmando la situación',
                    'llega con optimismo contagioso',
                    'se presenta como la inventora creativa'
                ],
                'Auron': [
                    'entra con su katana legendaria',
                    'aparece guardando secretos del pasado',
                    'llega cumpliendo promesas póstumas',
                    'se presenta como el guardián eterno'
                ],
                'Jecht': [
                    'entra con arrogancia paternal',
                    'aparece demostrando su poder',
                    'llega compitiendo con su propio hijo',
                    'se presenta como la estrella caída'
                ],
                
                // Dragon Ball
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
                'Gohan': [
                    'entra equilibrando libros y poder',
                    'aparece con su gi de entrenamiento',
                    'llega protegiendo a los inocentes',
                    'se presenta como el guerrero estudioso'
                ],
                'Piccolo': [
                    'entra meditando en posición de loto',
                    'aparece con su capa ondeando',
                    'llega desde las montañas sagradas',
                    'se presenta como el mentor silencioso'
                ],
                'Krillin': [
                    'entra demostrando que el tamaño no importa',
                    'aparece con su cabeza calva brillando',
                    'llega con valentía que supera su poder',
                    'se presenta como el mejor amigo leal'
                ],
                'Bulma': [
                    'entra con inventos tecnológicos',
                    'aparece con su cápsula corporativa',
                    'llega financiando la aventura',
                    'se presenta como la genio científica'
                ],
                'Frieza': [
                    'entra flotando con aura malévola',
                    'aparece proclamando su supremacía',
                    'llega destruyendo todo a su paso',
                    'se presenta como el emperador del universo'
                ],
                'Cell': [
                    'entra absorbiendo la energía ambiental',
                    'aparece evolucionando constantemente',
                    'llega buscando la perfección absoluta',
                    'se presenta como la forma de vida perfecta'
                ],
                'Trunks': [
                    'entra con su espada del futuro',
                    'aparece viajando en el tiempo',
                    'llega cambiando la línea temporal',
                    'se presenta como el guerrero del mañana'
                ],
                
                // Naruto
                'Naruto': [
                    'entra con cientos de clones de sombra',
                    'llega gritando que será el próximo Hokage',
                    'aparece con su Rasengan preparado',
                    'se presenta con su ninja way'
                ],
                'Sasuke': [
                    'entra con su Sharingan activado',
                    'aparece entre rayos de Chidori',
                    'llega buscando poder para su venganza',
                    'se presenta como el último Uchiha'
                ],
                'Sakura': [
                    'entra con fuerza médica devastadora',
                    'aparece curando y destruyendo a la vez',
                    'llega demostrando que no es la débil',
                    'se presenta como la kunoichi determinada'
                ],
                'Kakashi': [
                    'entra llegando tarde como siempre',
                    'aparece con su Sharingan copiando técnicas',
                    'llega leyendo Icha Icha Paradise',
                    'se presenta como el ninja que copia'
                ],
                'Gaara': [
                    'entra rodeado de arena protectora',
                    'aparece con su calabaza de arena',
                    'llega demostrando que cambió',
                    'se presenta como el Kazekage redentor'
                ],
                'Rock Lee': [
                    'entra con las Puertas Internas abiertas',
                    'aparece entrenando incluso al caminar',
                    'llega con juventud ardiendo',
                    'se presenta como el genio del esfuerzo'
                ],
                'Neji': [
                    'entra con su Byakugan activado',
                    'aparece viendo el destino claramente',
                    'llega rompiendo las cadenas del destino',
                    'se presenta como el genio Hyuga'
                ],
                'Shikamaru': [
                    'entra calculando 200 movimientos adelante',
                    'aparece con estrategia ya planeada',
                    'llega diciendo que es problemático',
                    'se presenta como el estratega perezoso'
                ],
                'Hinata': [
                    'entra con gentileza férrea',
                    'aparece luchando por Naruto-kun',
                    'llega superando su timidez',
                    'se presenta con valor silencioso'
                ],
                'Itachi': [
                    'entra desde las sombras',
                    'aparece con cuervos revoloteando',
                    'llega cargando el peso de la aldea',
                    'se presenta como el hermano sacrificado'
                ],
                
                // Death Note
                'Light': [
                    'entra con una sonrisa calculadora',
                    'aparece con su Death Note oculto',
                    'llega proclamando ser el dios del nuevo mundo',
                    'se presenta con una risa maniaca'
                ],
                'L': [
                    'entra en posición fetal característica',
                    'aparece comiendo dulces compulsivamente',
                    'llega con 85% de probabilidad de ganar',
                    'se presenta como el detective mundial'
                ],
                'Misa': [
                    'entra con estilo gótico lolita',
                    'aparece con ojos de Shinigami',
                    'llega adorando a su dios Light',
                    'se presenta como la segunda Kira'
                ],
                'Near': [
                    'entra jugando con figuras de acción',
                    'aparece resolviendo puzzles complejos',
                    'llega superando a su predecesor L',
                    'se presenta como el sucesor lógico'
                ],
                'Mello': [
                    'entra comiendo chocolate compulsivamente',
                    'aparece compitiendo ferozmente con Near',
                    'llega tomando riesgos calculados',
                    'se presenta como el sucesor emocional'
                ],
                
                // Attack on Titan
                'Eren': [
                    'entra con la determinación de la libertad',
                    'aparece con cicatrices de batalla',
                    'llega gritando "TATAKAE!"',
                    'se presenta dispuesto a luchar hasta el final'
                ],
                'Mikasa': [
                    'entra con sus cuchillas de maniobra',
                    'aparece protegiendo lo que ama',
                    'llega con lealtad inquebrantable',
                    'se presenta como la soldado perfecta'
                ],
                'Armin': [
                    'entra con estrategias brillantes',
                    'aparece analizando cada posibilidad',
                    'llega con inteligencia como arma',
                    'se presenta como el estratega genial'
                ],
                'Levi': [
                    'entra limpiando el camino de enemigos',
                    'aparece con técnica de combate perfecta',
                    'llega sin tolerar mediocridad',
                    'se presenta como la humanidad más fuerte'
                ],
                'Erwin': [
                    'entra liderando desde el frente',
                    'aparece inspirando a sus soldados',
                    'llega dedicando su corazón',
                    'se presenta como el comandante sacrificado'
                ],
                'Annie': [
                    'entra con frialdad calculada',
                    'aparece ocultando sus sentimientos',
                    'llega cristalizándose para protegerse',
                    'se presenta como la titán femenino'
                ],
                
                // One Piece
                'Luffy': [
                    'llega estirándose desde muy lejos',
                    'aparece con su sombrero de paja ondeando',
                    'entra gritando que será el Rey de los Piratas',
                    'se presenta con una sonrisa contagiosa'
                ],
                'Zoro': [
                    'entra perdido pero encontró la subasta',
                    'aparece con sus tres katanas',
                    'llega cortando cualquier obstáculo',
                    'se presenta como el cazador de piratas'
                ],
                'Nami': [
                    'entra calculando cada berry',
                    'aparece con su Clima-Tact',
                    'llega navegando hacia la mejor oferta',
                    'se presenta como la navegante codiciosa'
                ],
                'Sanji': [
                    'entra cocinando estrategias',
                    'aparece con su cigarrillo humeando',
                    'llega protegiendo a las damas',
                    'se presenta como el cocinero galante'
                ],
                'Usopp': [
                    'entra mintiendo sobre su valor',
                    'aparece con su tirachinas preparado',
                    'llega con valentía creciente',
                    'se presenta como el francotirador cobarde'
                ],
                'Chopper': [
                    'entra transformándose en diferentes formas',
                    'aparece con su botiquín médico',
                    'llega curando heridas de batalla',
                    'se presenta como el doctor reno'
                ],
                'Robin': [
                    'entra con manos floreciendo por doquier',
                    'aparece leyendo textos antiguos',
                    'llega buscando la verdad histórica',
                    'se presenta como la arqueóloga misteriosa'
                ],
                'Franky': [
                    'entra gritando "SUPER!"',
                    'aparece con su cuerpo cyborg brillando',
                    'llega construyendo la victoria',
                    'se presenta como el carpintero emocional'
                ],
                
                // Hunter x Hunter
                'Gon': [
                    'entra con caña de pescar en mano',
                    'aparece con inocencia peligrosa',
                    'llega buscando aventuras',
                    'se presenta como el cazador nato'
                ],
                'Killua': [
                    'entra con electricidad chisporroteando',
                    'aparece rompiendo cadenas familiares',
                    'llega protegiendo su amistad',
                    'se presenta como el asesino redentor'
                ],
                'Kurapika': [
                    'entra con ojos escarlata ardiendo',
                    'aparece con cadenas de venganza',
                    'llega buscando justicia para su clan',
                    'se presenta como el último Kurta'
                ],
                'Leorio': [
                    'entra con maletín médico',
                    'aparece estudiando para ser doctor',
                    'llega ayudando a los necesitados',
                    'se presenta como el futuro médico'
                ],
                'Hisoka': [
                    'entra con aura magnética peligrosa',
                    'aparece jugando con cartas',
                    'llega buscando oponentes dignos',
                    'se presenta como el mago sádico'
                ],
                
                // Slam Dunk
                'Sakuragi': [
                    'entra proclamándose genio del basketball',
                    'aparece con su cabeza roja brillando',
                    'llega impresionando a Haruko-chan',
                    'se presenta como el novato talentoso'
                ],
                'Rukawa': [
                    'entra medio dormido pero letal',
                    'aparece ignorando a sus fans',
                    'llega demostrando técnica natural',
                    'se presenta como el as silencioso'
                ],
                'Akagi': [
                    'entra dominando la zona como gorila',
                    'aparece liderando con ejemplo',
                    'llega construyendo el equipo perfecto',
                    'se presenta como el capitán inquebrantable'
                ],
                'Mitsui': [
                    'entra con su tiro de tres letal',
                    'aparece regresando más fuerte',
                    'llega demostrando amor por el basket',
                    'se presenta como el tirador legendario'
                ],
                
                // Otros animes
                'Shinnosuke': [
                    'entra haciendo travesuras épicas',
                    'aparece con su inocencia como arma',
                    'llega protegiendo a su familia',
                    'se presenta con sonrisa traviesa'
                ],
                'Misae': [
                    'entra controlando el presupuesto',
                    'aparece con ira maternal legendaria',
                    'llega protegiendo a Shin-chan',
                    'se presenta como la madre férrea'
                ],
                'Doraemon': [
                    'entra sacando gadgets del futuro',
                    'aparece con su bolsillo mágico',
                    'llega ayudando a Nobita',
                    'se presenta como el gato robot'
                ],
                'Nobita': [
                    'entra encontrando valor inesperado',
                    'aparece superando sus limitaciones',
                    'llega protegiendo lo que ama',
                    'se presenta como el niño que puede cambiar'
                ],
                'Tomoya': [
                    'entra encontrando familia en amigos',
                    'aparece construyendo un futuro mejor',
                    'llega superando su pasado doloroso',
                    'se presenta como el joven redentor'
                ],
                'Nagisa': [
                    'entra actuando con todo su corazón',
                    'aparece iluminando vidas ajenas',
                    'llega con gentileza conmovedora',
                    'se presenta como el ángel terrenal'
                ],
                'Inuyasha': [
                    'entra buscando fragmentos de la perla',
                    'aparece con Tessaiga transformada',
                    'llega protegiendo a Kagome',
                    'se presenta como el medio demonio'
                ],
                'Kagome': [
                    'entra viajando entre épocas',
                    'aparece purificando con poder espiritual',
                    'llega encontrando fuerza en bondad',
                    'se presenta como la sacerdotisa temporal'
                ],
                'Sesshomaru': [
                    'entra demostrando superioridad natural',
                    'aparece con Bakusaiga brillando',
                    'llega honrando linaje demonio',
                    'se presenta como el señor de las tierras occidentales'
                ],
                'Syaoran': [
                    'entra con honor y respeto',
                    'aparece entrenando constantemente',
                    'llega compitiendo dignamente',
                    'se presenta como el guerrero disciplinado'
                ],
                'Onizuka': [
                    'entra en su moto rugiendo',
                    'aparece con métodos de enseñanza únicos',
                    'llega cambiando vidas estudiantiles',
                    'se presenta como el gran maestro'
                ],
                'Fuyutsuki': [
                    'entra con paciencia infinita',
                    'aparece viendo potencial en todos',
                    'llega guiando con sabiduría',
                    'se presenta como la maestra comprensiva'
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
    
    // 🎭 SISTEMA DE COHERENCIA NARRATIVA MEJORADO - Solo para personajes específicos
    getCoherentMessage: function(currentContext, lastMessageType) {
        const messages = this.narrativeMessages;
        let availableCategories = [];
        
        // 🎯 REGLAS DE COHERENCIA NARRATIVA MEJORADAS
        if (currentContext === 'afterBid') {
            // Después de una puja exitosa -> Persistencia
            availableCategories = ['persistence'];
        } else if (currentContext === 'uncertainty') {
            // Durante incertidumbre -> Solo incertidumbre o tensión baja
            availableCategories = ['uncertainty', 'lowTension'];
        } else if (currentContext === 'continuation') {
            // Continuación después de incertidumbre -> Volver a la acción
            availableCategories = ['persistence'];
        }
        
        // Seleccionar categoría aleatoria de las disponibles
        const selectedCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
        const categoryMessages = messages[selectedCategory];
        
        if (!categoryMessages || categoryMessages.length === 0) {
            // Fallback a persistencia
            return {
                message: messages.persistence[Math.floor(Math.random() * messages.persistence.length)],
                type: 'persistence'
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
        'Gohan': [
            'estudia cada movimiento rival',
            'su poder oculto se despierta',
            'protege a quienes ama',
            'equilibra estudio y combate'
        ],
        'Piccolo': [
            'medita antes de cada decisión',
            'su estrategia es impecable',
            'protege la Tierra silenciosamente',
            'entrena para ser más fuerte'
        ],
        'Krillin': [
            'demuestra que el tamaño no importa',
            'su valentía supera su poder',
            'lucha junto a sus amigos',
            'nunca huye del peligro'
        ],
        'Bulma': [
            'inventa la solución perfecta',
            'su inteligencia es su arma',
            'financia la victoria',
            'nunca acepta un no por respuesta'
        ],
        'Cell': [
            'absorbe la competencia',
            'evoluciona con cada victoria',
            'busca la perfección absoluta',
            'su arrogancia no tiene límites'
        ],
        'Trunks': [
            'viene del futuro para ganar',
            'su espada corta el destino',
            'protege la línea temporal',
            'honra el legado de su padre'
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
        'Sakura': [
            'su fuerza médica es devastadora',
            'protege a sus compañeros de equipo',
            'nunca será la débil del grupo',
            'su determinación rivaliza con cualquiera'
        ],
        'Kakashi': [
            'copia la estrategia perfecta',
            'su sharingan analiza todo',
            'protege a sus estudiantes',
            'llega tarde pero siempre llega'
        ],
        'Gaara': [
            'su arena protege lo valioso',
            'lucha por ser aceptado',
            'demuestra que cambió',
            'protege su aldea con todo'
        ],
        'Rock Lee': [
            'entrena más duro que nadie',
            'su juventud arde con pasión',
            'demuestra el poder del esfuerzo',
            'nunca se rinde ante el talento'
        ],
        'Neji': [
            've el destino con su byakugan',
            'rompe las cadenas del destino',
            'protege a la familia Hyuga',
            'su técnica es perfecta'
        ],
        'Shikamaru': [
            'calcula 200 movimientos adelante',
            'encuentra la estrategia perfecta',
            'es problemático pero efectivo',
            'protege a sus compañeros'
        ],
        'Hinata': [
            'encuentra valor en su corazón',
            'lucha por Naruto-kun',
            'supera su timidez con determinación',
            'protege con gentileza férrea'
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
        'Misa': [
            'haría cualquier cosa por Light',
            'su amor no conoce límites',
            'los ojos de shinigami ven el valor',
            'sacrifica todo por su dios'
        ],
        'Near': [
            'juega con las piezas perfectas',
            'su lógica fría es implacable',
            'resuelve el puzzle final',
            'supera a su predecesor L'
        ],
        'Mello': [
            'compite ferozmente con Near',
            'su chocolate le da energía',
            'toma riesgos calculados',
            'demuestra ser el mejor'
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
        'Nami': [
            'calcula cada berry gastado',
            'su amor por el dinero es legendario',
            'navega hacia la mejor oferta',
            'nunca desperdicia una oportunidad'
        ],
        'Sanji': [
            'cocina la estrategia perfecta',
            'protege a las damas siempre',
            'su pasión arde como su cigarrillo',
            'nunca usa las manos para luchar'
        ],
        'Usopp': [
            'miente sobre su valor real',
            'su valentía crece con el peligro',
            'dispara con precisión sobrehumana',
            'protege a sus amigos desde lejos'
        ],
        'Chopper': [
            'transforma su estrategia',
            'cura las heridas del combate',
            'demuestra que es un pirata',
            'protege a su familia elegida'
        ],
        'Robin': [
            'lee la historia de cada precio',
            'sus manos florecen en victoria',
            'busca la verdad oculta',
            'protege los secretos del pasado'
        ],
        'Franky': [
            'construye la victoria perfecta',
            'su energía cola es imparable',
            'SUPER puja con estilo',
            'nunca se avergüenza de llorar'
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
        ],
        'Mikasa': [
            'protegerá lo que es importante',
            'su lealtad no tiene precio',
            'luchará hasta el final',
            'no permitirá que otros sufran'
        ],
        'Armin': [
            'analiza cada movimiento estratégico',
            'su inteligencia es su arma',
            'encuentra la solución perfecta',
            'calcula cada posibilidad'
        ],
        'Erwin': [
            'sacrificará todo por la humanidad',
            'su liderazgo inspira a otros',
            'dedica su corazón a la causa',
            'nunca retrocede ante el peligro'
        ],
        'Annie': [
            'mantiene su fría determinación',
            'oculta sus verdaderos sentimientos',
            'lucha por regresar a casa',
            'su cristalización la protege'
        ],
        
        // Final Fantasy VII - Personajes adicionales
        'Yuffie': [
            'busca materia para Wutai',
            'su agilidad ninja es incomparable',
            'roba la atención de todos',
            'nunca se rinde ante un desafío'
        ],
        'Vincent': [
            'carga con pecados del pasado',
            'su transformación lo impulsa',
            'busca redención en cada acto',
            'la oscuridad es su aliada'
        ],
        'Cid': [
            'sueña con volar a las estrellas',
            'su pasión por la aviación arde',
            'maldice pero nunca se rinde',
            'construirá su camino al cielo'
        ],
        'RedXIII': [
            'honra la memoria de sus ancestros',
            'su sabiduría ancestral lo guía',
            'protege el equilibrio natural',
            'corre hacia un futuro mejor'
        ],
        
        // Final Fantasy VIII - Personajes adicionales
        'Quistis': [
            'enseña con su ejemplo',
            'su látigo disciplina a los rivales',
            'protege a sus estudiantes',
            'su conocimiento es poder'
        ],
        'Selphie': [
            'su energía es contagiosa',
            'organiza la victoria perfecta',
            'nunca pierde su sonrisa',
            'hace que todo sea divertido'
        ],
        'Irvine': [
            'apunta con precisión letal',
            'su estilo cowboy impresiona',
            'nunca falla el tiro decisivo',
            'conquista con su carisma'
        ],
        
        // Final Fantasy IX
        'Zidane': [
            'roba corazones y victorias',
            'su cola revela su determinación',
            'protege a quienes ama',
            'encuentra esperanza en la oscuridad'
        ],
        'Garnet': [
            'su nobleza real resplandece',
            'lucha por su pueblo',
            'su magia blanca sana heridas',
            'encuentra fuerza en la amistad'
        ],
        'Vivi': [
            'busca el significado de existir',
            'su magia negra es poderosa',
            'aprende sobre la vida cada día',
            'su inocencia conmueve a todos'
        ],
        'Steiner': [
            'sirve con honor inquebrantable',
            'su espada defiende la justicia',
            'protege a la princesa siempre',
            'su lealtad no tiene límites'
        ],
        
        // Final Fantasy X
        'Tidus': [
            'juega para ganar siempre',
            'su sonrisa oculta el dolor',
            'lucha contra el destino',
            'protege el sueño de Spira'
        ],
        'Yuna': [
            'sacrifica todo por Spira',
            'su fe mueve montañas',
            'danza entre la vida y muerte',
            'trae esperanza a los perdidos'
        ],
        'Wakka': [
            'lanza su pelota con precisión',
            'protege a su equipo siempre',
            'su fe en Yevon es inquebrantable',
            'nunca abandona a un compañero'
        ],
        'Lulu': [
            'su magia negra es devastadora',
            'protege con frialdad calculada',
            'su experiencia guía al grupo',
            'oculta dolor tras su seriedad'
        ],
        'Kimahri': [
            'protege en silencio',
            'su lanza atraviesa cualquier defensa',
            'honra las tradiciones Ronso',
            'habla poco pero actúa mucho'
        ],
        'Rikku': [
            'desarma cualquier situación',
            'su optimismo es contagioso',
            'encuentra soluciones creativas',
            'protege a su prima Yuna'
        ],
        'Auron': [
            'guarda secretos del pasado',
            'su espada corta el destino',
            'protege la última esperanza',
            'cumple promesas más allá de la muerte'
        ],
        'Jecht': [
            'demuestra su poder paternal',
            'su arrogancia oculta amor',
            'lucha contra su propio destino',
            'quiere que su hijo lo supere'
        ],
        
        // Hunter x Hunter
        'Gon': [
            'pesca la oportunidad perfecta',
            'su inocencia oculta gran poder',
            'nunca se rinde ante un desafío',
            'protege a sus amigos verdaderos'
        ],
        'Killua': [
            'asesina la competencia silenciosamente',
            'su velocidad eléctrica es letal',
            'rompe las cadenas familiares',
            'protege su amistad con Gon'
        ],
        'Kurapika': [
            'venga a su clan exterminado',
            'sus cadenas atan el destino',
            'su ira arde en ojos escarlata',
            'nunca olvida su propósito'
        ],
        'Leorio': [
            'estudia para ser médico',
            'su maletín guarda sorpresas',
            'lucha por ayudar a otros',
            'demuestra su valor verdadero'
        ],
        'Hisoka': [
            'juega con sus oponentes',
            'busca la batalla perfecta',
            'su aura es magnéticamente peligrosa',
            'disfruta cada momento de tensión'
        ],
        
        // Slam Dunk
        'Sakuragi': [
            'es un genio del basketball',
            'su cabeza roja arde de pasión',
            'nunca acepta la derrota',
            'impresiona a Haruko-chan'
        ],
        'Rukawa': [
            'duerme pero siempre gana',
            'su técnica es naturalmente perfecta',
            'ignora a las fans gritando',
            'demuestra ser el mejor'
        ],
        'Akagi': [
            'domina la zona como un gorila',
            'lidera con ejemplo férreo',
            'nunca permite la derrota',
            'construye el equipo perfecto'
        ],
        'Mitsui': [
            'nunca se rinde hasta el final',
            'su tiro de tres es letal',
            'regresa más fuerte que antes',
            'demuestra su amor por el basket'
        ],
        
        // Otros animes
        'Shinnosuke': [
            'hace travesuras épicas',
            'su inocencia es su arma',
            'protege a su familia',
            'nunca pierde su sonrisa'
        ],
        'Misae': [
            'controla el presupuesto familiar',
            'su ira es legendaria',
            'protege a Shin-chan siempre',
            'nunca se rinde como madre'
        ],
        'Doraemon': [
            'saca el gadget perfecto',
            'viaja desde el futuro para ayudar',
            'protege a Nobita siempre',
            'encuentra soluciones imposibles'
        ],
        'Nobita': [
            'encuentra valor en momentos críticos',
            'protege lo que ama',
            'supera sus limitaciones',
            'demuestra que puede cambiar'
        ],
        'Tomoya': [
            'encuentra familia en los amigos',
            'protege los sueños de otros',
            'supera su pasado doloroso',
            'construye un futuro mejor'
        ],
        'Nagisa': [
            'actúa con todo su corazón',
            'su gentileza conmueve a todos',
            'nunca se rinde ante la adversidad',
            'ilumina la vida de otros'
        ],
        'Inuyasha': [
            'busca los fragmentos perdidos',
            'protege a Kagome siempre',
            'lucha contra su destino demonio',
            'demuestra su corazón humano'
        ],
        'Kagome': [
            'purifica con su poder espiritual',
            'viaja entre épocas por amor',
            'nunca abandona a sus amigos',
            'encuentra fuerza en su bondad'
        ],
        'Sesshomaru': [
            'demuestra su superioridad natural',
            'protege lo que considera suyo',
            'nunca muestra debilidad',
            'honra su linaje demonio'
        ],
        'Syaoran': [
            'compite con honor y respeto',
            'protege lo que considera importante',
            'entrena para ser más fuerte',
            'nunca huye del desafío'
        ],
        'Onizuka': [
            'enseña con métodos únicos',
            'protege a sus estudiantes',
            'nunca se rinde como maestro',
            'demuestra que puede cambiar vidas'
        ],
        'Fuyutsuki': [
            'enseña con paciencia infinita',
            've el potencial en cada estudiante',
            'nunca pierde la esperanza',
            'guía con sabiduría y amor'
        ]
    },

    // 🎭 FUNCIÓN PARA OBTENER MENSAJE ESPECÍFICO DE PERSONAJE DURANTE LA PUJA
    getCharacterBidMessage: function(participant) {
        const characterMessages = this.CHARACTER_SPECIFIC_MESSAGES[participant.name];
        
        if (characterMessages && characterMessages.length > 0) {
            const randomMessage = characterMessages[Math.floor(Math.random() * characterMessages.length)];
            return `${participant.emoji} ${participant.name} ${randomMessage}`;
        }
        
        // Fallback genérico si no hay mensaje específico
        return `${participant.emoji} ${participant.name} actúa con determinación`;
    },
    
    // 🎭 FUNCIÓN PARA GENERAR MENSAJE DE ENTRADA DE PARTICIPANTE - Solo personajes específicos
    getParticipantEntryMessage: function(participant) {
        const characterEntries = this.narrativeMessages.participantEntry.characterEntries[participant.name];
        
        let entryAction;
        
        // Solo usar mensajes específicos del personaje
        if (characterEntries && characterEntries.length > 0) {
            entryAction = characterEntries[Math.floor(Math.random() * characterEntries.length)];
        } else {
            // Fallback genérico solo si no hay mensaje específico
            entryAction = 'entra a la subasta con su estilo único';
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