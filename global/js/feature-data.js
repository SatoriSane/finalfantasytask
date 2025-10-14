// features/feature-data.js
// Maneja la importación y exportación de datos de la aplicación.
(function(App) {
    App.data = {
        exportData: function() {
            try {
                const state = App.state.getState();
                const dataStr = JSON.stringify(state, null, 2); // Formateado para legibilidad
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = `fftask_backup_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                App.ui.general.shownotifyMessage('Datos exportados con éxito.');

            } catch (error) {
                console.error('Error al exportar datos:', error);
                App.ui.general.showCustomAlert('Hubo un error al exportar los datos.');
            }
        },

        importData: function(file) {
            if (!file) {
                App.ui.general.showCustomAlert('No se seleccionó ningún archivo.');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const importedState = JSON.parse(event.target.result);

                    // Validación básica del objeto importado
                    if (typeof importedState.points !== 'number' || !Array.isArray(importedState.missions)) {
                        throw new Error('El archivo no parece ser una copia de seguridad válida.');
                    }

                    App.ui.general.showCustomConfirm(
                        '¿Seguro que quieres reemplazar TODOS los datos actuales con los del archivo? Esta acción es irreversible.',
                        (confirmed) => {
                            if (confirmed) {
                                App.state.loadState(importedState);
                                App.ui.general.showCustomAlert('Datos importados con éxito. La aplicación se recargará.');
                                setTimeout(() => window.location.reload(), 2000);
                            }
                        }
                    );

                } catch (error) {
                    console.error('Error al importar datos:', error);
                    App.ui.general.showCustomAlert(`Error al leer el archivo: ${error.message}`);
                }
            };

            reader.onerror = function() {
                App.ui.general.showCustomAlert('No se pudo leer el archivo seleccionado.');
            };

            reader.readAsText(file);
        }
    };

})(window.App = window.App || {});
