// focus-alarm.js - Sistema de alarma con notificaciones push para el timer
(function(App) {
    'use strict';

    const STORAGE_KEY = 'focusAlarmEnabled';
    let _alarmEnabled = false;
    let _notificationPermission = 'default';

    /**
     * Inicializa el sistema de alarma
     */
    async function init() {
        // Cargar estado guardado
        const saved = localStorage.getItem(STORAGE_KEY);
        _alarmEnabled = saved === 'true';

        // Verificar soporte de notificaciones
        if ('Notification' in window) {
            _notificationPermission = Notification.permission;
            console.log('🔔 Notificaciones soportadas. Permiso:', _notificationPermission);
        } else {
            console.warn('⚠️ Notificaciones no soportadas en este navegador');
        }

        // Si la alarma está habilitada pero no hay permiso, solicitarlo
        if (_alarmEnabled && _notificationPermission === 'default') {
            await requestPermission();
        }
    }

    /**
     * Solicita permiso para notificaciones
     */
    async function requestPermission() {
        if (!('Notification' in window)) {
            console.warn('⚠️ Notificaciones no soportadas');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            _notificationPermission = permission;
            
            if (permission === 'granted') {
                console.log('✅ Permiso de notificaciones concedido');
                return true;
            } else {
                console.log('❌ Permiso de notificaciones denegado');
                _alarmEnabled = false;
                localStorage.setItem(STORAGE_KEY, 'false');
                return false;
            }
        } catch (error) {
            console.error('Error solicitando permiso:', error);
            return false;
        }
    }

    /**
     * Activa/desactiva la alarma
     */
    async function toggle() {
        if (!_alarmEnabled) {
            // Activar alarma
            if (_notificationPermission !== 'granted') {
                const granted = await requestPermission();
                if (!granted) {
                    if (App.events?.emit) {
                        App.events.emit('shownotifyMessage', 
                            '⚠️ Necesitas permitir notificaciones para usar la alarma');
                    }
                    return false;
                }
            }
            
            _alarmEnabled = true;
            localStorage.setItem(STORAGE_KEY, 'true');
            
            if (App.events?.emit) {
                App.events.emit('shownotifyMessage', '🔔 Alarma activada');
            }
            
            console.log('🔔 Alarma activada');
        } else {
            // Desactivar alarma
            _alarmEnabled = false;
            localStorage.setItem(STORAGE_KEY, 'false');
            
            if (App.events?.emit) {
                App.events.emit('shownotifyMessage', '🔕 Alarma desactivada');
            }
            
            console.log('🔕 Alarma desactivada');
        }

        return _alarmEnabled;
    }

    /**
     * Dispara la alarma cuando el timer llega a cero
     */
    async function trigger(taskName) {
        if (!_alarmEnabled) {
            console.log('⏭️ Alarma desactivada, no se dispara');
            return;
        }

        console.log('🚨 Disparando alarma para:', taskName);

        // Reproducir sonido (vibración en móviles)
        if ('vibrate' in navigator) {
            // Patrón de vibración: [vibrar, pausa, vibrar, pausa, vibrar]
            navigator.vibrate([200, 100, 200, 100, 200, 100, 200]);
        }

        // Mostrar notificación
        await showNotification(taskName);

        // Reproducir sonido de alarma (si está disponible)
        playAlarmSound();
    }

    /**
     * Muestra una notificación push
     */
    async function showNotification(taskName) {
        if (!('Notification' in window) || _notificationPermission !== 'granted') {
            console.warn('⚠️ No se puede mostrar notificación');
            return;
        }

        try {
            // Si hay service worker, usar notificación persistente
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                const registration = await navigator.serviceWorker.ready;
                await registration.showNotification('⏰ ¡Tiempo Completado!', {
                    body: `Tu misión "${taskName}" ha terminado. ¡Buen trabajo! 🎉`,
                    icon: '/icons/icon-192x192.png',
                    badge: '/icons/icon-192x192.png',
                    vibrate: [200, 100, 200, 100, 200],
                    tag: 'focus-timer-alarm',
                    requireInteraction: true, // La notificación no se cierra automáticamente
                    actions: [
                        {
                            action: 'complete',
                            title: '✅ Completar'
                        },
                        {
                            action: 'dismiss',
                            title: '🔕 Cerrar'
                        }
                    ]
                });
                console.log('✅ Notificación push mostrada');
            } else {
                // Fallback: notificación simple
                const notification = new Notification('⏰ ¡Tiempo Completado!', {
                    body: `Tu misión "${taskName}" ha terminado. ¡Buen trabajo! 🎉`,
                    icon: '/icons/icon-192x192.png',
                    vibrate: [200, 100, 200, 100, 200],
                    tag: 'focus-timer-alarm',
                    requireInteraction: true
                });

                // Auto-cerrar después de 10 segundos
                setTimeout(() => notification.close(), 10000);
                
                console.log('✅ Notificación simple mostrada');
            }
        } catch (error) {
            console.error('Error mostrando notificación:', error);
        }
    }

    /**
     * Reproduce un sonido de alarma
     */
    function playAlarmSound() {
        try {
            // Crear un AudioContext para generar un tono
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Configurar tono (frecuencia de 800Hz - tono de alarma)
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            // Configurar volumen
            gainNode.gain.value = 0.3;

            // Reproducir durante 500ms
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);

            // Repetir 3 veces con pausas
            setTimeout(() => {
                const osc2 = audioContext.createOscillator();
                const gain2 = audioContext.createGain();
                osc2.connect(gain2);
                gain2.connect(audioContext.destination);
                osc2.frequency.value = 800;
                osc2.type = 'sine';
                gain2.gain.value = 0.3;
                osc2.start(audioContext.currentTime);
                osc2.stop(audioContext.currentTime + 0.5);
            }, 700);

            setTimeout(() => {
                const osc3 = audioContext.createOscillator();
                const gain3 = audioContext.createGain();
                osc3.connect(gain3);
                gain3.connect(audioContext.destination);
                osc3.frequency.value = 800;
                osc3.type = 'sine';
                gain3.gain.value = 0.3;
                osc3.start(audioContext.currentTime);
                osc3.stop(audioContext.currentTime + 0.5);
            }, 1400);

            console.log('🔊 Sonido de alarma reproducido');
        } catch (error) {
            console.error('Error reproduciendo sonido:', error);
        }
    }

    /**
     * Obtiene el estado actual de la alarma
     */
    function isEnabled() {
        return _alarmEnabled;
    }

    /**
     * Obtiene el estado del permiso de notificaciones
     */
    function getPermissionStatus() {
        return _notificationPermission;
    }

    // API pública
    App.focusAlarm = {
        init,
        toggle,
        trigger,
        isEnabled,
        getPermissionStatus,
        requestPermission
    };

    // Auto-inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(window.App = window.App || {});
