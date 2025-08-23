// app-init.js
// Inicializa el espacio de nombres global 'App' y sus sub-objetos principales.
(function() {
    window.App = window.App || {};
    window.App.ui = window.App.ui || {};
    // Es crucial que estos sub-objetos también se inicialicen explícitamente
    window.App.ui.render = window.App.ui.render || {}; // Asegura que App.ui.render exista
    window.App.ui.events = window.App.ui.events || {}; // Asegura que App.ui.events exista
    window.App.state = window.App.state || {}; // Asegura que App.state exista
    window.App.utils = window.App.utils || {}; // Asegura que App.utils exista
})();
