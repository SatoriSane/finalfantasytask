// script.js
// El archivo principal que orquesta la carga y el inicio de la aplicación.
(function() {
    // Asegura que el espacio de nombres 'App' exista antes de que cualquier módulo intente adjuntarse a él.
    // Esto ya lo maneja app-init.js, pero lo dejamos como fallback seguro.
    window.App = window.App || {};
    window.App.ui = window.App.ui || {}; // Mantenido por consistencia con tu original

    // Inicializa la aplicación después de que el DOM esté completamente cargado.
    document.addEventListener('DOMContentLoaded', () => {
        try {
            // Inicializa los event listeners de la UI PRIMERO.
            // La función initEventListeners ahora se encarga de enlazar los eventos a las funciones de renderizado modularizadas.
            if (App.ui && App.ui.events && typeof App.ui.events.initEventListeners === 'function') {
                App.ui.events.initEventListeners();
            } else {
                console.error("Error: App.ui.events.initEventListeners no está definido o no es una función al inicio.");
                throw new Error("Fallo en la inicialización de los listeners de la UI.");
            }

            // Carga el estado inicial (incluye el procesamiento diario).
            const loadSuccessful = App.state.load();

            if (loadSuccessful) {
                // Renderiza la UI inicial basándose en el estado cargado.
                // Ahora, las llamadas a las funciones de renderizado apuntan a sus respectivos módulos.
                if (App.ui && App.ui.render) {
                    // Funciones de renderizado generales
                    if (App.ui.render.general && typeof App.ui.render.general.updatePointsDisplay === 'function') {
                        App.ui.render.general.updatePointsDisplay();
                    }

                    // Renderizado de cada pestaña específica
                    if (App.ui.render.today && typeof App.ui.render.today.renderTodayTasks === 'function') {
                        App.ui.render.today.renderTodayTasks();
                    }
                    if (App.ui.render.missions && typeof App.ui.render.missions.renderMissions === 'function') {
                        App.ui.render.missions.renderMissions();
                    }
                    if (App.ui.render.scheduled && typeof App.ui.render.scheduled.renderScheduledMissions === 'function') {
                        App.ui.render.scheduled.renderScheduledMissions();
                    }
                    if (App.ui.render.history && typeof App.ui.render.history.renderHistory === 'function') {
                        App.ui.render.history.renderHistory();
                    }
                    if (App.ui.render.shop && typeof App.ui.render.shop.renderShopItems === 'function') {
                        App.ui.render.shop.renderShopItems();
                    }

                    // Activa la pestaña inicial
                    if (App.ui.render.general && typeof App.ui.render.general.switchTab === 'function') {
                        App.ui.render.general.switchTab('tab-today');
                    }
                } else {
                    console.error("Error: App.ui.render no está definido. No se pudo renderizar la UI inicial.");
                    throw new Error("Fallo en la renderización inicial de la UI.");
                }

                console.log("Aplicación iniciada correctamente y pestaña 'Hoy' activada.");
            } else {
                if (App.ui && App.ui.events && typeof App.ui.events.showCustomAlert === 'function') {
                    App.ui.events.showCustomAlert("Error al leer tus datos guardados. Se ha reiniciado la aplicación para evitar problemas. Tus datos anteriores podrían haberse perdido.");
                } else {
                    console.warn("No se pudo mostrar la alerta personalizada. Usando la alerta del navegador.");
                    alert("Error al leer tus datos guardados. Se ha reiniciado la aplicación para evitar problemas. Tus datos anteriores podrían haberse perdido.");
                }
            }

            // --- ¡IMPORTANTE! REGISTRO DEL SERVICE WORKER CON RUTA ABSOLUTA CORREGIDA ---
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('service-worker.js') // ¡RUTA CORREGIDA AQUÍ!
                        .then(registration => {
                            console.log('Service Worker registrado con éxito:', registration);
                        })
                        .catch(error => {
                            console.error('Fallo en el registro del Service Worker:', error);
                        });
                });
            } else {
                console.warn('El navegador no soporta Service Workers. La aplicación no será instalable como PWA.');
            }
            // --- Fin del registro del Service Worker ---

        } catch (e) {
            console.error("Error crítico al iniciar la aplicación:", e);
            if (App.ui && App.ui.events && typeof App.ui.events.showCustomAlert === 'function') {
                App.ui.events.showCustomAlert("Hubo un error grave al iniciar la aplicación. Tus datos podrían no estar accesibles. Intenta recargar la página.");
            } else {
                console.warn("No se pudo mostrar la alerta personalizada. Usando la alerta del navegador.");
                alert("Hubo un error grave al iniciar la aplicación. Tus datos podrían no estar accesibles. Intenta recargar la página.");
            }
        }
    });
})();
