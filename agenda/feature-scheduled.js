// features/feature-scheduled.js
// Maneja la renderización de las misiones programadas y sus ocurrencias.
(function(App) {
    App.ui.scheduled = {
        initListeners: function() {
            App.events.on('scheduledMissionsUpdated', () => this.render());
            App.events.on('stateRefreshed', () => this.render());
        },
        /**
         * @description Renderiza las misiones programadas.
         */
        render: function() {
            const container = document.getElementById("scheduledMissionsList");
            if (!container) {
                console.warn("Contenedor #scheduledMissionsList no encontrado, no se pueden renderizar las misiones programadas.");
                return;
            }
            container.innerHTML = "";
        
            const scheduledMissions = App.state.getScheduledMissions();
            if (scheduledMissions.length === 0) {
                container.innerHTML = `<p style=\"text-align:center; color:var(--ff-text-dark);\">No hay misiones programadas. ¡Planifica tu aventura!</p>`;
                return;
            }
        
            const allMissionsToDisplay = [];
            const MAX_DISPLAY_OCCURRENCES = 7; // Mostrar hasta 7 días de ocurrencias futuras
            const todayNormalized = App.utils.normalizeDateToStartOfDay(new Date());
            if (!todayNormalized) {
                console.error("No se pudo obtener la fecha de hoy normalizada para misiones programadas.");
                return;
            }
        
            scheduledMissions.forEach(scheduledMis => {
                // Para misiones NO recurrentes, simplemente añadir la misión original programada
                if (!scheduledMis.isRecurring) {
                    allMissionsToDisplay.push({
                        ...scheduledMis,
                        isActualScheduled: true, // Indica que es la misión programada original
                        displayId: App.utils.genId("disp-") // ID único para el renderizado
                    });
                } else { // Lógica para misiones recurrentes
                    const initialScheduledDateObj = App.utils.normalizeDateToStartOfDay(scheduledMis.scheduledDate);
                    if (!initialScheduledDateObj) {
                        console.warn(`renderScheduledMissions: Misión recurrente \"${scheduledMis.name}\" tiene fecha inicial inválida. Se omitirá la generación de ocurrencias.`);
                        return;
                    }
        
                    const repeatEndDateObj = scheduledMis.repeatEndDate ? App.utils.normalizeDateToStartOfDay(scheduledMis.repeatEndDate) : null;
        
                    // Lógica para repeticiones semanales con días de la semana específicos
                    if (scheduledMis.repeatUnit === 'week' && scheduledMis.daysOfWeek && scheduledMis.daysOfWeek.length > 0) {
                        const selectedDays = scheduledMis.daysOfWeek.map(day => parseInt(day, 10)).sort((a, b) => a - b);
                        const repeatInterval = scheduledMis.repeatInterval || 1;
                        let occurrencesAdded = 0;
        
                        // Para cada día seleccionado, encontrar su primera ocurrencia desde la fecha de inicio
                        selectedDays.forEach(targetDay => {
                            // Calcular la primera ocurrencia de este día desde la fecha de inicio
                            const startDayOfWeek = initialScheduledDateObj.getDay();
                            const daysToFirstOccurrence = (targetDay - startDayOfWeek + 7) % 7;
                            const firstOccurrenceDate = new Date(initialScheduledDateObj);
                            firstOccurrenceDate.setDate(initialScheduledDateObj.getDate() + daysToFirstOccurrence);
                            
                            // Generar ocurrencias respetando el intervalo de semanas
                            let currentOccurrence = new Date(firstOccurrenceDate);
                            let weekCount = 0;
                            
                            // Generar hasta MAX_DISPLAY_OCCURRENCES ocurrencias o hasta la fecha de fin
                            while (occurrencesAdded < MAX_DISPLAY_OCCURRENCES) {
                                // Verificar si excede la fecha de fin
                                if (repeatEndDateObj && currentOccurrence > repeatEndDateObj) {
                                    break;
                                }
                                
                                // Solo añadir si la fecha es hoy o futura
                                if (currentOccurrence >= todayNormalized) {
                                    const isOriginalScheduledDateForThisOccurrence = (currentOccurrence.getTime() === initialScheduledDateObj.getTime());
                                    allMissionsToDisplay.push({
                                        ...scheduledMis,
                                        id: scheduledMis.id,
                                        displayId: App.utils.genId("disp-"),
                                        scheduledDate: App.utils.getFormattedDate(currentOccurrence),
                                        isActualScheduled: isOriginalScheduledDateForThisOccurrence
                                    });
                                    occurrencesAdded++;
                                }
                                
                                // Avanzar al siguiente intervalo de semanas
                                weekCount++;
                                currentOccurrence = new Date(firstOccurrenceDate);
                                currentOccurrence.setDate(firstOccurrenceDate.getDate() + (weekCount * repeatInterval * 7));
                                
                                // Salir si la fecha se vuelve muy lejana (más de 1 año)
                                if (currentOccurrence.getTime() - todayNormalized.getTime() > 365 * 24 * 60 * 60 * 1000) {
                                    break;
                                }
                            }
                        });
                    } else { // Lógica para otras unidades de repetición (day, month, year)
                        let tempDate = new Date(initialScheduledDateObj); // Empezar con la fecha programada inicial sin normalizar
                        let occurrencesAdded = 0;
        
                        // Si la fecha inicial es en el pasado, empezar desde hoy
                        if (tempDate < todayNormalized) {
                            tempDate = new Date(todayNormalized);
                        }
        
                        // Generar ocurrencias a partir de la fecha ajustada (`tempDate`)
                        while (tempDate && occurrencesAdded < MAX_DISPLAY_OCCURRENCES) {
                            // Si la fecha actual excede la fecha de fin de repetición, salir
                            if (repeatEndDateObj && tempDate > repeatEndDateObj) {
                                break;
                            }
        
                            // Añadir esta ocurrencia
                            allMissionsToDisplay.push({
                                ...scheduledMis,
                                id: scheduledMis.id,
                                displayId: App.utils.genId("disp-"),
                                scheduledDate: App.utils.getFormattedDate(tempDate),
                                isActualScheduled: (tempDate.getTime() === initialScheduledDateObj.getTime()) // Solo true si coincide con la fecha original programada
                            });
                            occurrencesAdded++;
        
                            // Avanzar a la siguiente ocurrencia para la próxima iteración del bucle
                            tempDate = App.utils.addDateUnit(tempDate, scheduledMis.repeatInterval, scheduledMis.repeatUnit);
                            if (!tempDate) break; // Salir si la fecha se vuelve inválida
                        }
                    }
                }
            });
        
            // Filtrar y ordenar todas las misiones y ocurrencias generadas
            const filteredAndSortedDisplayMissions = allMissionsToDisplay
                .filter(m => {
                    const mDateNormalized = App.utils.normalizeDateToStartOfDay(m.scheduledDate);
                    if (!mDateNormalized || mDateNormalized < todayNormalized) {
                        return false;
                    }

                    // Excluir si la fecha está en skippedDates
                    const dateStr = App.utils.getFormattedDate(mDateNormalized);
                    const originalScheduledMission = App.state.getScheduledMissions().find(sm => sm.id === m.id);
                    if (originalScheduledMission && originalScheduledMission.skippedDates && originalScheduledMission.skippedDates.includes(dateStr)) {
                        return false;
                    }

                    return true;
                })
                .sort((a, b) => {
                    const dateA = App.utils.normalizeDateToStartOfDay(a.scheduledDate);
                    const dateB = App.utils.normalizeDateToStartOfDay(b.scheduledDate);
                    if (!dateA || !dateB) return 0; // Manejar fechas inválidas en la ordenación
                    return dateA.getTime() - dateB.getTime();
                });
        
            // Agrupar misiones por fecha
            const groupedMissions = {};
            filteredAndSortedDisplayMissions.forEach(mission => {
                if (!groupedMissions[mission.scheduledDate]) {
                    groupedMissions[mission.scheduledDate] = [];
                }
                groupedMissions[mission.scheduledDate].push(mission);
            });
        
            for (const date in groupedMissions) {
                const dateHeader = document.createElement("div");
                dateHeader.className = "date-group-header";
        
                let displayDate = App.utils.getFormattedDateWithDayOfWeek(date);
        
                const todayFormatted = App.utils.getFormattedDate(new Date());
                const tomorrowDateObj = App.utils.addDateUnit(App.utils.normalizeDateToStartOfDay(new Date()), 1, 'day');
                const tomorrowFormatted = tomorrowDateObj ? App.utils.getFormattedDate(tomorrowDateObj) : null;
        
                if (date === todayFormatted) {
                    displayDate = `Hoy, ${displayDate}`;
                } else if (tomorrowFormatted && date === tomorrowFormatted) {
                    displayDate = `Mañana, ${displayDate}`;
                }
                dateHeader.textContent = `${displayDate}`;
                container.appendChild(dateHeader);
        
                groupedMissions[date].forEach(scheduledMis => {
                    const card = document.createElement("div");
                    // Add 'is-recurring' class for visual distinction if it's a recurring mission
                    card.className = `scheduled-mission-card ${scheduledMis.isRecurring ? 'is-recurring' : ''}`;
                    card.dataset.scheduledMissionId = scheduledMis.displayId || scheduledMis.id;
        
                    const nameSpan = document.createElement("span");
                    nameSpan.className = "scheduled-mission-name";
                    nameSpan.textContent = scheduledMis.name;

                    card.appendChild(nameSpan);
        
                    const recurrenceInfo = document.createElement("span");
                    recurrenceInfo.className = "recurrence-info";
                    if (scheduledMis.isRecurring) {
                        let infoText = `cada ${scheduledMis.repeatInterval} ${scheduledMis.repeatUnit}(s)`;
                        if (scheduledMis.repeatUnit === 'week' && scheduledMis.daysOfWeek && scheduledMis.daysOfWeek.length > 0) {
                            const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                            const selectedDayNames = scheduledMis.daysOfWeek.map(day => dayNames[parseInt(day, 10)]);
                            infoText += ` los ${selectedDayNames.join(', ')}`;
                        }
                        if (scheduledMis.repeatEndDate) {
                            infoText += ` hasta ${App.utils.getFormattedDateWithDayOfWeek(scheduledMis.repeatEndDate)}`;
                        }
                        recurrenceInfo.textContent = `(${infoText})`;
                        card.appendChild(recurrenceInfo);
                    }
        
                    const pointsSpan = document.createElement("span");
                    pointsSpan.className = `scheduled-mission-points ${scheduledMis.points >= 0 ? "positive" : "negative"}`;
                    pointsSpan.textContent = `${scheduledMis.points >= 0 ? "＋" : "−"}${Math.abs(scheduledMis.points)}`;
                    card.appendChild(pointsSpan);
        
                    // El botón de eliminar solo se muestra para la "misión programada original", no para las ocurrencias generadas.
                    if (scheduledMis.isActualScheduled) {
                        const deleteBtn = document.createElement("button");
                        deleteBtn.innerHTML = '❌';
                        deleteBtn.className = "delete-btn";
                        deleteBtn.title = "Eliminar misión programada";
                        deleteBtn.onclick = () => App.state.deleteScheduledMission(scheduledMis.id); // Eliminar por el ID original
                        card.appendChild(deleteBtn);
                    }
                    container.appendChild(card);
                });
            }
        },
    };
})(window.App = window.App || {});
