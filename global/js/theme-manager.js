/* theme-manager.js - Sistema de gestión de temas */
(function(global) {
    'use strict';

    const STORAGE_KEY = 'fftask-theme';
    const DEFAULT_THEME = 'default';

    /**
     * Obtiene el tema guardado o el por defecto
     */
    function getSavedTheme() {
        return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
    }

    /**
     * Aplica un tema al documento
     */
    function applyTheme(themeName) {
        const body = document.body;
        
        // Remover tema anterior
        body.removeAttribute('data-theme');
        
        // Aplicar nuevo tema (excepto si es el default)
        if (themeName !== 'default') {
            body.setAttribute('data-theme', themeName);
        }
        
        // Guardar en localStorage
        localStorage.setItem(STORAGE_KEY, themeName);
        
        // Actualizar UI del selector
        updateThemeSelector(themeName);
        
        console.log(`🎨 Tema aplicado: ${themeName}`);
    }

    /**
     * Actualiza la UI del selector de temas
     */
    function updateThemeSelector(activeTheme) {
        const themeButtons = document.querySelectorAll('.theme-btn');
        
        themeButtons.forEach(btn => {
            const btnTheme = btn.getAttribute('data-theme');
            if (btnTheme === activeTheme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    /**
     * Inicializa el sistema de temas
     */
    function initThemeSystem() {
        // Aplicar tema guardado al cargar
        const savedTheme = getSavedTheme();
        applyTheme(savedTheme);
        
        // Escuchar clicks en los botones de tema
        document.addEventListener('click', (e) => {
            const themeBtn = e.target.closest('.theme-btn');
            if (themeBtn) {
                const selectedTheme = themeBtn.getAttribute('data-theme');
                applyTheme(selectedTheme);
                
                // Notificar al usuario
                if (global.App?.events) {
                    const themeNames = {
                        'default': 'Cyberpunk Azul',
                        'purple': 'Purple Dream',
                        'emerald': 'Emerald Night',
                        'sunset': 'Sunset Orange',
                        'rose': 'Rose Gold',
                        'ocean': 'Ocean Blue'
                    };
                    App.events.emit('showToast', `🎨 Tema cambiado a ${themeNames[selectedTheme]}`);
                }
            }
        });
    }

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initThemeSystem);
    } else {
        initThemeSystem();
    }

    // API pública
    global.ThemeManager = {
        applyTheme,
        getSavedTheme,
        getCurrentTheme: () => {
            const body = document.body;
            return body.getAttribute('data-theme') || DEFAULT_THEME;
        }
    };

})(window);
