// app-init.js
// Inicializa el espacio de nombres global 'App' y sus sub-objetos principales.
(function() {
    window.App = window.App || {};
    window.App.ui = window.App.ui || {};
    // Sub-objetos esenciales
    window.App.ui.render = window.App.ui.render || {}; // Asegura que App.ui.render exista
    window.App.ui.events = window.App.ui.events || {}; // Asegura que App.ui.events exista
    window.App.state = window.App.state || {}; // Asegura que App.state exista
    window.App.utils = window.App.utils || {}; // Asegura que App.utils exista

    // ------------------- Service Worker & actualización -------------------
    // Procesar misiones programadas para hoy al iniciar
    document.addEventListener('DOMContentLoaded', () => {
        if (window.App && App.state && App.state.processScheduledMissionsForToday) {
            App.state.processScheduledMissionsForToday();
        }
        
        // Mover tareas incompletas del día anterior a hoy
        if (window.App && App.state && App.state.rolloverUncompletedTasks) {
            App.state.rolloverUncompletedTasks();
        }
        
        // NOTA: processAllChallengesOnLoad ahora se llama desde script.js después de cargar el estado
    });



    // ------------------- Service Worker & actualización -------------------
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker registrado:', reg.scope))
            .catch(err => console.warn('Error registrando Service Worker:', err));

        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data?.type === 'NEW_VERSION') {
                // Crear banner discreto para actualizar
                const banner = document.createElement('div');
                banner.textContent = '¡Nueva versión disponible! Toca para actualizar.';
                banner.style.cssText = `
                    position: fixed;
                    bottom: 1rem;
                    left: 50%;
                    transform: translateX(-50%);
                    background: var(--ff-accent);
                    color: var(--ff-bg-dark);
                    padding: 0.8rem 1.2rem;
                    border-radius: var(--border-radius-md);
                    cursor: pointer;
                    z-index: 1000;
                    font-weight: 700;
                    text-align: center;
                    box-shadow: var(--shadow-md);
                `;
                banner.onclick = () => location.reload();
                document.body.appendChild(banner);
            }
        });
    }
})();
