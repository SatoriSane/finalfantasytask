// ui-render-missions.js
// Maneja la renderización de las categorías y misiones en el Libro de Misiones.
(function(App) {
    App.ui.render = App.ui.render || {};
    App.ui.render.missions = {
        /**
         * @description Renderiza las categorías y misiones en el Libro de Misiones.
         */
        renderMissions: function() {
            const container = document.getElementById("missionsGrid");
            if (!container) {
                console.warn("Contenedor #missionsGrid no encontrado, no se pueden renderizar las misiones.");
                return;
            }
            container.innerHTML = "";

            const categories = App.state.getCategories();
            const missions = App.state.getMissions();

            if (categories.length === 0 && missions.length === 0) {
                container.innerHTML = `<p style="text-align:center; color:var(--ff-text-dark);">No hay categorías. Agrega una nueva para empezar.</p>`;
                return;
            }

            categories.forEach(cat => {
                const categoryWrapper = document.createElement("div");
                categoryWrapper.className = "category-wrapper";

                const catHeader = document.createElement("div");
                catHeader.className = "cat-header collapsible";
                catHeader.dataset.categoryId = cat.id;
                catHeader.draggable = true;
                catHeader.setAttribute('aria-grabbed', 'false');

                // Eventos de Drag and Drop para categorías
                catHeader.addEventListener('dragstart', (e) => {
                    e.stopPropagation();
                    catHeader.setAttribute('aria-grabbed', 'true');
                    catHeader.classList.add('is-dragging');
                    e.dataTransfer.setData('text/plain', cat.id);
                    e.dataTransfer.effectAllowed = 'move';
                });
                catHeader.addEventListener('dragenter', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!catHeader.classList.contains('is-dragging')) {
                        catHeader.classList.add('drag-over');
                    }
                });
                catHeader.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = 'move';
                });
                catHeader.addEventListener('dragleave', (e) => {
                    e.stopPropagation();
                    catHeader.classList.remove('drag-over');
                });
                catHeader.addEventListener('drop', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    catHeader.classList.remove('drag-over');
                    const draggedId = e.dataTransfer.getData('text/plain');
                    const targetId = cat.id;

                    // Reordena categoría (si draggedId es una categoría)
                    if (App.state.getCategories().some(c => c.id === draggedId)) {
                        if (draggedId !== targetId) {
                            App.state.reorderCategory(draggedId, targetId);
                        }
                    } else { // Si es una misión arrastrada a una categoría
                        try {
                            const draggedData = JSON.parse(draggedId);
                            if (draggedData.missionId && draggedData.categoryId) {
                                App.state.reorderMission(draggedData.missionId, targetId, draggedData.categoryId, targetId);
                            }
                        } catch (error) {
                            console.error("Error al parsear datos de arrastre para misión a categoría:", error);
                        }
                    }
                });
                catHeader.addEventListener('dragend', (e) => {
                    e.stopPropagation();
                    catHeader.classList.remove('is-dragging');
                    catHeader.setAttribute('aria-grabbed', 'false');
                    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
                });

                // Eventos de click y doble click para categorías
                catHeader.addEventListener('click', (e) => {
                    if (e.target.tagName !== 'BUTTON') { // Para no colapsar si se hace click en un botón dentro del header
                        e.stopPropagation();
                        catHeader.classList.toggle('collapsed');
                    }
                });
                catHeader.addEventListener('dblclick', (e) => {
                    e.stopPropagation();
                    document.querySelectorAll('.cat-header.show-delete').forEach(el => el.classList.remove('show-delete'));
                    catHeader.classList.add('show-delete');
                });

                const arrowSpan = document.createElement("span");
                arrowSpan.className = "collapse-arrow";
                catHeader.appendChild(arrowSpan);

                const catNameSpan = document.createElement("span");
                catNameSpan.textContent = cat.name;
                catHeader.appendChild(catNameSpan);

                const buttonsWrapper = document.createElement("div");
                buttonsWrapper.style.marginLeft = 'auto';
                buttonsWrapper.style.display = 'flex';
                buttonsWrapper.style.alignItems = 'center';
                buttonsWrapper.style.gap = '0.5rem';

                const showFormBtn = document.createElement("button");
                showFormBtn.className = "discreet-btn";
                showFormBtn.innerHTML = `<span class="icon">⚔️</span> Nueva Misión`;
                showFormBtn.onclick = (e) => {
                    e.stopPropagation();
                    const formContainer = document.getElementById(`addMissionForm-${cat.id}`);
                    if (formContainer) {
                        const isVisible = formContainer.classList.contains("active");
                        document.querySelectorAll('.form-container.active').forEach(f => f.classList.remove('active'));
                        formContainer.classList.toggle("active", !isVisible);
                        if (!isVisible) {
                            const nameInput = formContainer.querySelector("input[type='text']");
                            if (nameInput) nameInput.focus();
                            // ⭐ Ya no es necesario resetear dailyRepetitionsMax aquí
                        }
                    } else {
                        console.warn(`Formulario de añadir misión para categoría ${cat.id} no encontrado.`);
                    }
                };
                buttonsWrapper.appendChild(showFormBtn);

                const deleteCatBtn = document.createElement("button");
                deleteCatBtn.innerHTML = '❌';
                deleteCatBtn.className = "delete-btn";
                deleteCatBtn.title = "Eliminar categoría";
                deleteCatBtn.onclick = (e) => {
                    e.stopPropagation();
                    App.state.deleteCategory(cat.id);
                };
                buttonsWrapper.appendChild(deleteCatBtn);
                catHeader.appendChild(buttonsWrapper);
                categoryWrapper.appendChild(catHeader);

                const missionListContainer = document.createElement("div");
                missionListContainer.className = "mission-list-container";
                missionListContainer.id = `missions-for-cat-${cat.id}`;
                categoryWrapper.appendChild(missionListContainer);

                // Eventos de Drag and Drop para lista de misiones (como contenedor para drop)
                missionListContainer.addEventListener('dragover', (e) => e.preventDefault());
                missionListContainer.addEventListener('drop', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                        const draggedData = JSON.parse(e.dataTransfer.getData('text/plain'));
                        const draggedMissionId = draggedData.missionId;
                        const draggedFromCategoryId = draggedData.categoryId;
                        const targetCategoryId = cat.id;

                        if (draggedMissionId && draggedFromCategoryId) {
                            App.state.reorderMission(draggedMissionId, targetCategoryId, draggedFromCategoryId, targetCategoryId);
                        }
                    } catch (error) {
                        console.error("Error al parsear datos de arrastre para drop en misiónListContainer:", error);
                    }
                });

                const missionsForCat = missions.filter(m => m.categoryId === cat.id);
                if (missionsForCat.length === 0) {
                    const noMissionText = document.createElement("p");
                    noMissionText.style.textAlign = 'center';
                    noMissionText.style.color = 'var(--ff-text-dark)';
                    noMissionText.textContent = "No hay misiones en esta categoría.";
                    missionListContainer.appendChild(noMissionText);
                } else {
                    missionsForCat.forEach(mission => {
                        const missionCard = document.createElement("div");
                        missionCard.className = "mission-card";
                        missionCard.dataset.missionId = mission.id;
                        missionCard.draggable = true;
                        missionCard.setAttribute('aria-grabbed', 'false');

                        const isMissionScheduled = App.state.getScheduledMissionByOriginalMissionId(mission.id);
                        if (isMissionScheduled) {
                            missionCard.classList.add('is-scheduled-in-book');
                            missionCard.dataset.scheduledMissionProgramId = isMissionScheduled.id;
                        }

                        // Eventos de Drag and Drop para misiones individuales
                        missionCard.addEventListener('dragstart', (e) => {
                            e.stopPropagation();
                            missionCard.setAttribute('aria-grabbed', 'true');
                            missionCard.classList.add('is-dragging-mission');
                            e.dataTransfer.setData('text/plain', JSON.stringify({
                                missionId: mission.id,
                                categoryId: cat.id
                            }));
                            e.dataTransfer.effectAllowed = 'move';
                        });
                        missionCard.addEventListener('dragenter', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!missionCard.classList.contains('is-dragging-mission')) {
                                missionCard.classList.add('drag-over-mission');
                            }
                        });
                        missionCard.addEventListener('dragover', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.dataTransfer.dropEffect = 'move';
                        });
                        missionCard.addEventListener('dragleave', (e) => {
                            e.stopPropagation();
                            missionCard.classList.remove('drag-over-mission');
                        });
                        missionCard.addEventListener('drop', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            missionCard.classList.remove('drag-over-mission');
                            try {
                                const draggedData = JSON.parse(e.dataTransfer.getData('text/plain'));
                                const draggedMissionId = draggedData.missionId;
                                const draggedFromCategoryId = draggedData.categoryId;
                                const targetMissionId = mission.id;
                                const targetCategoryId = cat.id;

                                if (draggedMissionId !== targetMissionId) {
                                    App.state.reorderMission(draggedMissionId, targetMissionId, draggedFromCategoryId, targetCategoryId);
                                }
                            } catch (error) {
                                console.error("Error al parsear datos de arrastre para misión a misión:", error);
                            }
                        });
                        missionCard.addEventListener('dragend', (e) => {
                            e.stopPropagation();
                            missionCard.classList.remove('is-dragging-mission');
                            missionCard.setAttribute('aria-grabbed', 'false');
                            document.querySelectorAll('.drag-over-mission').forEach(el => el.classList.remove('drag-over-mission'));
                        });

                        missionCard.addEventListener('dblclick', (e) => {
                            e.stopPropagation();
                            document.querySelectorAll('.mission-card.show-delete').forEach(el => el.classList.remove('show-delete'));
                            missionCard.classList.add('show-delete');
                        });

                        const missionNameDiv = document.createElement("span");
                        missionNameDiv.className = "mission-name";
                        missionNameDiv.textContent = mission.name;
                        missionCard.appendChild(missionNameDiv);

                        const pointsAndActionDiv = document.createElement("div");
                        pointsAndActionDiv.className = "points-and-action";

                        const pointsSpan = document.createElement("span");
                        pointsSpan.className = `mission-points ${mission.points >= 0 ? "positive" : "negative"}`;
                        pointsSpan.textContent = `${mission.points >= 0 ? "＋" : "−"}${Math.abs(mission.points)}`;
                        pointsAndActionDiv.appendChild(pointsSpan);

                        const scheduleButton = document.createElement("button");
                        scheduleButton.innerHTML = isMissionScheduled ? '📅' : '🗓️';
                        scheduleButton.className = "schedule-btn";
                        scheduleButton.title = isMissionScheduled ? `Misión Programada` : `Programar ${mission.name}`;
                        scheduleButton.onclick = (e) => {
                            e.stopPropagation();
                            App.ui.events.openScheduleMissionModal(mission.id, isMissionScheduled ? isMissionScheduled.id : null);
                        };
                        pointsAndActionDiv.appendChild(scheduleButton);
                        missionCard.appendChild(pointsAndActionDiv);

                        const deleteBtn = document.createElement("button");
                        deleteBtn.innerHTML = '❌';
                        deleteBtn.className = "delete-btn";
                        deleteBtn.title = "Eliminar misión";
                        deleteBtn.onclick = (e) => {
                            e.stopPropagation();
                            App.state.deleteMission(mission.id);
                        };
                        missionCard.appendChild(deleteBtn);
                        missionListContainer.appendChild(missionCard);
                    });
                }

                // Formulario para añadir misión - Ya NO tendrá el campo de repeticiones máximas
                const addMissionFormContainer = document.createElement("div");
                addMissionFormContainer.id = `addMissionForm-${cat.id}`;
                addMissionFormContainer.className = "form-container";
                const form = document.createElement("form");
                form.className = "add-mission-form";
                form.dataset.categoryId = cat.id;
                form.setAttribute("aria-label", "Agregar nueva misión");
                form.innerHTML = `
                    <input type="text" name="missionName" placeholder="Nombre de la misión" required />
                    <input type="number" name="missionPoints" placeholder="Puntos por repetición" required />
                    <button type="submit" class="primary">➕</button>`; // ⭐ dailyRepetitionsMax input ELIMINADO
                form.onsubmit = (e) => {
                    e.preventDefault();
                    const nameInput = form.querySelector("input[name='missionName']");
                    const pointsInput = form.querySelector("input[name='missionPoints']");

                    const name = nameInput ? nameInput.value.trim() : '';
                    const points = pointsInput ? parseInt(pointsInput.value.trim(), 10) : NaN;

                    if (!name) {
                        App.ui.events.showCustomAlert("El nombre de la misión es requerido.");
                        return;
                    }
                    if (isNaN(points)) {
                        App.ui.events.showCustomAlert("Los puntos deben ser un número.");
                        return;
                    }

                    // ⭐ Llamada a addMission sin dailyRepetitionsMax
                    App.state.addMission(cat.id, name, points);
                    if (nameInput) nameInput.value = '';
                    if (pointsInput) pointsInput.value = '';
                };
                addMissionFormContainer.appendChild(form);
                categoryWrapper.appendChild(addMissionFormContainer);
                container.appendChild(categoryWrapper);
            });
        }
    };
})(window.App = window.App || {});
