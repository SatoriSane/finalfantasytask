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
            // Inicializa los listeners generales y de cada módulo
            App.ui.general.initListeners();
            App.ui.today.initListeners();
            App.ui.missions.initListeners();
            App.ui.shop.initListeners();
            App.ui.history.initListeners();
            App.ui.scheduled.initListeners();
            App.ui.habits.init();

            // Carga el estado inicial
            const loadSuccessful = App.state.load();

            if (loadSuccessful) {
                // Inicia procesos de fondo
                if (App.state.startAbstinenceProcessor) {
                    App.state.startAbstinenceProcessor();
                }

                // Renderiza la UI inicial
                App.ui.general.updatePointsDisplay(App.state.getPoints());
                App.ui.today.render();
                App.ui.missions.render();
                App.ui.shop.render();
                App.ui.scheduled.render();
                App.ui.history.render();
                App.ui.habits.render();

                // Activa la pestaña inicial (restaurada o por defecto)
                const lastTab = sessionStorage.getItem('lastActiveTab') || 'tab-today';
                App.ui.general.switchTab(lastTab);

                console.log("Aplicación iniciada correctamente y pestaña 'Hoy' activada.");

            } else {
                App.ui.general.showCustomAlert("Error al leer tus datos guardados. Se ha reiniciado la aplicación para evitar problemas. Tus datos anteriores podrían haberse perdido.");
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
