// global/js/utils.js
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

    };
})(window.App = window.App || {});
