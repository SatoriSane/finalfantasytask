(function(App) {
    'use strict';

    /**
     * 📅 Convención general:
     * - Internamente, las funciones usan objetos Date normalizados a la hora local 00:00:00.
     * - Las conversiones a cadena usan formato "YYYY-MM-DD".
     * - Ninguna función devuelve fechas con horas (todas están "limpias").
     */

    App.utils = {

        /**
         * Genera un ID único con un prefijo dado.
         */
        genId(prefix) {
            return prefix + "-" + Math.random().toString(36).slice(2, 9);
        },

        // ---------------------------------------------------------------------
        // 🧩 Normalización y creación de fechas
        // ---------------------------------------------------------------------

        /**
         * Normaliza una fecha (string o Date) a un objeto Date local a las 00:00:00.
         * @param {string|Date} date Fecha en formato YYYY-MM-DD o Date.
         * @returns {Date|null} Nueva fecha normalizada o null si es inválida.
         */
        normalizeDateToStartOfDay(date) {
            let d;
            if (typeof date === 'string') {
                // Forzar interpretación local, no UTC
                d = new Date(date + "T00:00:00");
            } else if (date instanceof Date) {
                d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            } else {
                console.warn("normalizeDateToStartOfDay: entrada no válida", date);
                return null;
            }

            if (isNaN(d.getTime())) {
                console.warn("normalizeDateToStartOfDay: fecha inválida detectada:", date);
                return null;
            }

            return d;
        },

        /**
         * Devuelve una fecha local normalizada de hoy.
         * @returns {Date} Objeto Date correspondiente al día actual (00:00:00 local).
         */
        getTodayDate() {
            const now = new Date();
            return new Date(now.getFullYear(), now.getMonth(), now.getDate());
        },

        // ---------------------------------------------------------------------
        // 🧾 Conversión entre Date y string
        // ---------------------------------------------------------------------

        /**
         * Devuelve la fecha formateada como "YYYY-MM-DD".
         * @param {Date} [dateObj=new Date()] Objeto Date (preferiblemente normalizado).
         * @returns {string|null} Cadena formateada o null si es inválida.
         */
        getFormattedDate(dateObj = new Date()) {
            if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
                console.error("getFormattedDate: fecha inválida", dateObj);
                return null;
            }
            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        },

        /**
         * Convierte una cadena YYYY-MM-DD a objeto Date local normalizado.
         * @param {string} dateString
         * @returns {Date|null}
         */
        parseDateString(dateString) {
            return App.utils.normalizeDateToStartOfDay(dateString);
        },

        // ---------------------------------------------------------------------
        // 🧮 Operaciones con fechas
        // ---------------------------------------------------------------------

        /**
         * Suma o resta unidades de tiempo a una fecha.
         * @param {Date} dateObj Fecha base (se clonará internamente).
         * @param {number} amount Cantidad a sumar (puede ser negativa).
         * @param {'day'|'week'|'month'|'year'} unit Unidad de tiempo.
         * @returns {Date|null} Nueva fecha resultante (normalizada).
         */
        addDateUnit(dateObj, amount, unit) {
            if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
                console.error("addDateUnit: fecha inválida", dateObj);
                return null;
            }

            const newDate = new Date(dateObj); // copia
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
                    console.warn(`addDateUnit: unidad desconocida "${unit}"`);
                    return null;
            }

            // Asegurar que la salida también esté normalizada
            return new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
        },

        // ---------------------------------------------------------------------
        // 🗓️ Formatos de presentación
        // ---------------------------------------------------------------------

        /**
         * Formatea una fecha a una cadena legible con el día de la semana.
         * Ej: "Jueves, 12 de agosto de 2025"
         * @param {Date|string} date
         * @returns {string}
         */
        getFormattedDateWithDayOfWeek(date) {
            const d = App.utils.normalizeDateToStartOfDay(date);
            if (!d) return "Fecha inválida";

            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const formatted = d.toLocaleDateString('es-ES', options);
            return formatted.charAt(0).toUpperCase() + formatted.slice(1);
        },
    };
})(window.App = window.App || {});
