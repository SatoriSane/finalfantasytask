// Test de comparación de datos
// Ejecuta esto en la consola para probar la función hasDataChanges()

console.log('=== TEST DE COMPARACIÓN DE DATOS ===\n');

// Simular datos actuales en localStorage
const currentData = {
    'fftask_tasks': JSON.stringify([{id: 1, name: 'Tarea 1'}]),
    'fftask_points': '100',
    'fftask_habits': JSON.stringify([])
};

// Simular datos del backup (idénticos)
const backupDataIdentical = {
    'fftask_tasks': JSON.stringify([{id: 1, name: 'Tarea 1'}]),
    'fftask_points': '100',
    'fftask_habits': JSON.stringify([])
};

// Simular datos del backup (diferentes)
const backupDataDifferent = {
    'fftask_tasks': JSON.stringify([{id: 1, name: 'Tarea 1'}, {id: 2, name: 'Tarea 2'}]),
    'fftask_points': '150',
    'fftask_habits': JSON.stringify([])
};

// Función de comparación (copia de la implementación)
function hasDataChanges(backupData, currentData) {
    const backupKeys = Object.keys(backupData);
    const currentKeys = Object.keys(currentData);
    
    if (backupKeys.length \!== currentKeys.length) {
        console.log(`📊 Diferencia en cantidad de claves: backup=${backupKeys.length}, local=${currentKeys.length}`);
        return true;
    }
    
    for (const key of backupKeys) {
        if (\!(key in currentData)) {
            console.log(`📊 Clave nueva en backup: ${key}`);
            return true;
        }
        
        if (backupData[key] \!== currentData[key]) {
            console.log(`📊 Valor diferente en clave: ${key}`);
            return true;
        }
    }
    
    for (const key of currentKeys) {
        if (\!(key in backupData)) {
            console.log(`📊 Clave local no existe en backup: ${key}`);
            return true;
        }
    }
    
    return false;
}

// Test 1: Datos idénticos
console.log('Test 1: Datos idénticos');
const result1 = hasDataChanges(backupDataIdentical, currentData);
console.log(`Resultado: ${result1 ? '❌ HAY CAMBIOS' : '✅ SIN CAMBIOS'}`);
console.log(`Acción: ${result1 ? 'RECARGAR' : 'NO RECARGAR'}\n`);

// Test 2: Datos diferentes
console.log('Test 2: Datos diferentes');
const result2 = hasDataChanges(backupDataDifferent, currentData);
console.log(`Resultado: ${result2 ? '✅ HAY CAMBIOS' : '❌ SIN CAMBIOS'}`);
console.log(`Acción: ${result2 ? 'RECARGAR' : 'NO RECARGAR'}\n`);

// Test 3: Clave adicional en backup
console.log('Test 3: Clave adicional en backup');
const backupWithExtra = {...backupDataIdentical, 'fftask_new_key': 'value'};
const result3 = hasDataChanges(backupWithExtra, currentData);
console.log(`Resultado: ${result3 ? '✅ HAY CAMBIOS' : '❌ SIN CAMBIOS'}`);
console.log(`Acción: ${result3 ? 'RECARGAR' : 'NO RECARGAR'}\n`);

console.log('=== FIN TEST ===');
