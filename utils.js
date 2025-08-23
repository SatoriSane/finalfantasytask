// utils.js
// Contiene funciones de ayuda genéricas que no dependen del estado de la aplicación ni de la interfaz de usuario.
(function(App) {
    App.utils = {
        /**
         * @description Genera un ID único con un prefijo dado.
         * @param {string} prefix Prefijo para el ID.
         * @returns {string} ID único.
         */
        genId: function(prefix) {
            return prefix + "-" + Math.random().toString(36).slice(2, 9);
        },

        /**
         * @description Obtiene una fecha formateada en YYYY-MM-DD.
         * @param {Date} [dateObj=new Date()] Objeto Date opcional. Si no se provee, usa la fecha actual.
         * @returns {string|null} Fecha formateada, o null si la fecha de entrada es inválida.
         */
        getFormattedDate: function(dateObj = new Date()) {
            // Asegurarse de que dateObj es una fecha válida antes de formatear
            if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
                console.error("getFormattedDate: Intentando formatear una fecha inválida.");
                return null;
            }
            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        },

        /**
         * @description Formatea una fecha a una cadena legible con el día de la semana.
         * Ej: "Jueves, 12 de agosto de 2025"
         * @param {Date|string} date La fecha a formatear. Puede ser un objeto Date o una cadena YYYY-MM-DD.
         * @returns {string} Fecha en formato legible con día de la semana, o "Fecha inválida".
         */
        getFormattedDateWithDayOfWeek: function(date) {
            let d;
            if (typeof date === 'string') {
                // Si es una cadena, intenta crear un objeto Date.
                // Es importante parsear correctamente, especialmente si no es una cadena 'YYYY-MM-DD'.
                // Para consistencia con getFormattedDate, asumimos YYYY-MM-DD.
                d = new Date(date + 'T00:00:00'); // Añadir T00:00:00 para evitar problemas de zona horaria
            } else if (date instanceof Date) {
                d = date;
            } else {
                console.warn("getFormattedDateWithDayOfWeek: Entrada de fecha no reconocida o nula, devolviendo 'Fecha inválida'.", date);
                return "Fecha inválida";
            }

            if (isNaN(d.getTime())) {
                console.warn(`getFormattedDateWithDayOfWeek: Fecha inválida detectada: "${date}", devolviendo 'Fecha inválida'.`);
                return "Fecha inválida";
            }

            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            // Capitalizar la primera letra del día de la semana para una mejor presentación
            const formattedString = d.toLocaleDateString('es-ES', options);
            return formattedString.charAt(0).toUpperCase() + formattedString.slice(1);
        },

        /**
         * @description Normaliza una fecha a la medianoche (hora 00:00:00) para comparaciones.
         * @param {string|Date} date La fecha en formato YYYY-MM-DD o un objeto Date.
         * @returns {Date|null} Un objeto Date con la hora reseteada, o null si la fecha de entrada es inválida.
         */
        normalizeDateToStartOfDay: function(date) {
            let d;
            if (typeof date === 'string') {
                d = new Date(date + 'T00:00:00'); // Asegurarse de parsear al inicio del día en UTC para evitar offsets
            } else if (date instanceof Date) {
                d = new Date(date.getFullYear(), date.getMonth(), date.getDate()); // Crear nueva fecha al inicio del día local
            } else {
                console.warn("normalizeDateToStartOfDay: Entrada de fecha no reconocida o nula, devolviendo null.");
                return null;
            }

            // Verificar si el objeto Date es válido
            if (isNaN(d.getTime())) {
                console.warn(`normalizeDateToStartOfDay: Fecha inválida detectada: "${date}", devolviendo null.`);
                return null;
            }

            return d; // Ya está normalizado a las 00:00:00
        },

        /**
         * @description Agrega una cantidad de días, meses o años a una fecha.
         * @param {Date} dateObj El objeto de fecha inicial.
         * @param {number} amount La cantidad a añadir (puede ser negativa).
         * @param {string} unit La unidad a añadir ('day', 'week', 'month', 'year').
         * @returns {Date|null} Un nuevo objeto Date con el tiempo añadido, o null si la fecha de entrada es inválida.
         */
        addDateUnit: function(dateObj, amount, unit) {
            // Verificar si la fecha de entrada es válida
            if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
                console.error("addDateUnit: Intentando añadir a una fecha inválida, devolviendo null.");
                return null;
            }

            const newDate = new Date(dateObj); // Crear una copia para no modificar el original
            switch (unit) {
                case 'day':
                    newDate.setDate(newDate.getDate() + amount);
                    break;
                case 'week':
                    newDate.setDate(newDate.getDate() + (amount * 7));
                    break;
                case 'month':
                    newDate.setMonth(newDate.getMonth() + amount);
                    break;
                case 'year':
                    newDate.setFullYear(newDate.getFullYear() + amount);
                    break;
                default:
                    console.warn(`addDateUnit: Unidad de tiempo desconocida: "${unit}"`);
                    return null;
            }
            return newDate;
        },

        /**
         * @description Encuentra el índice de una tarea por su ID en un array de tareas.
         * @param {Array} tasks El array de tareas.
         * @param {string} taskId El ID de la tarea a buscar.
         * @returns {number} El índice de la tarea, o -1 si no se encuentra.
         */
        findTaskIndexById: function(tasks, taskId) {
            if (!Array.isArray(tasks)) {
                console.error("findTaskIndexById: 'tasks' no es un array válido.");
                return -1;
            }
            return tasks.findIndex(task => task.id === taskId);
        },

        /**
         * @description Inserta un elemento en un array en un índice específico.
         * @param {Array} arr El array original.
         * @param {number} index El índice donde insertar el elemento.
         * @param {*} item El elemento a insertar.
         * @returns {Array} El array modificado.
         */
        insertAtIndex: function(arr, index, item) {
            if (!Array.isArray(arr)) {
                console.error("insertAtIndex: 'arr' no es un array válido.");
                return arr;
            }
            arr.splice(index, 0, item);
            return arr;
        },

        /**
         * @description Devuelve un mensaje de motivación basado en la cantidad de puntos.
         * @param {number} points La cantidad de puntos de la tarea completada.
         * @returns {string} Un mensaje de motivación aleatorio.
         */
        getMotivationMessage: function(points) {
            const messages = {
                level1_2: [
                    "🌱 Cada paso suma, y este cuenta mucho.", "💪 Hoy has demostrado que puedes avanzar.",
                    "☀️ Un movimiento más hacia tu mejor versión.", "✨ Suma tras suma, estás construyendo un gran cambio.",
                    "📈 Todo gran logro empieza con pasos como este.", "💖 <3 Tu progreso está en marcha y se nota."
                ],
                level3_5: [
                    "🚀 Sigues creciendo, y se nota en cada acción.", "🌟 Hoy estás más cerca de tu meta que ayer.",
                    "🔥 Tu esfuerzo está marcando la diferencia.", "💎 Las pequeñas victorias hacen grandes cambios.",
                    "🏁 Avanzas con firmeza y eso es inspirador.", "💛 <3 Esto es parte del cambio que estás creando."
                ],
                level6_10: [
                    "💪 Estás construyendo un hábito poderoso.", "🎯 Cada reto superado te hace más fuerte.",
                    "🌈 Hoy diste un paso grande en tu camino.", "🛡️ Estás demostrando una fuerza increíble.",
                    "📈 Tu constancia es tu mejor herramienta.", "💙 <3 El cambio ya está ocurriendo, y tú lo estás haciendo."
                ],
                level11_20: [
                    "🏆 Este logro te lleva a otro nivel.", "🔥 Estás rompiendo barreras que antes parecían enormes.",
                    "🌟 Tu esfuerzo está transformando tu vida.", "🗝️ Estás desbloqueando una versión más fuerte de ti.",
                    "🚀 Hoy has demostrado que puedes con mucho más de lo que creías.", "❤️ Esto es una prueba de tu capacidad y determinación."
                ],
                level21_39: [
                    "⚡ Tu avance es imparable.", "🗻 Has escalado un tramo enorme en tu camino.",
                    "💫 La disciplina que muestras está dando frutos.", "🧠 Tu fortaleza mental es admirable.",
                    "🚩 Estás creando un antes y un después en tu vida.", "💖 Esto confirma que nada puede detenerte."
                ],
                level40_79: [
                    "🏔️ Lo que acabas de lograr cambia el rumbo.", "🔥 Estás dominando desafíos que pocos afrontan.",
                    "🎯 Este avance te acerca a tus sueños de forma real.", "💎 La fuerza que tienes se ve en este logro.",
                    "🛡️ Este es un hito que demuestra tu resiliencia.", "💜 <3 Estás escribiendo tu propia historia de éxito."
                ],
                level80_plus: [
                    "🌟 Estás alcanzando un nivel que pocos imaginan.", "🐉 Has vencido desafíos que parecían imposibles.",
                    "🏆 Este logro es un símbolo de tu transformación.", "🚀 Estás en el camino hacia tu mejor versión.",
                    "💖 Tu constancia está creando un cambio duradero.", "❤️‍🔥 Lo que estás haciendo hoy marcará tu vida para siempre."
                ]
            };

            const p = Number(points);
            if (isNaN(p) || p < 1) {
                return "¡Tarea completada! 🎉";
            }

            let chosenLevelMessages;
            if (p >= 1 && p <= 2) {
                chosenLevelMessages = messages.level1_2;
            } else if (p >= 3 && p <= 5) {
                chosenLevelMessages = messages.level3_5;
            } else if (p >= 6 && p <= 10) {
                chosenLevelMessages = messages.level6_10;
            } else if (p >= 11 && p <= 20) {
                chosenLevelMessages = messages.level11_20;
            } else if (p >= 21 && p <= 39) {
                chosenLevelMessages = messages.level21_39;
            } else if (p >= 40 && p <= 79) {
                chosenLevelMessages = messages.level40_79;
            } else if (p >= 80) {
                chosenLevelMessages = messages.level80_plus;
            } else {
                return "¡Tarea completada! 🎉";
            }

            const randomIndex = Math.floor(Math.random() * chosenLevelMessages.length);
            return chosenLevelMessages[randomIndex];
        }
    };
})(window.App = window.App || {});
