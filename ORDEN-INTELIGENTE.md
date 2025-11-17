# Sistema de Orden Inteligente de Misiones

## 🎯 Concepto

El sistema ahora aprende de tus preferencias de orden y las aplica automáticamente a días futuros.

## ✨ Cómo Funciona

### 1. **Ordenamiento Manual (Hoy)**
Cuando arrastras y sueltas tareas en la pestaña "Hoy":
- El sistema guarda el orden específico para ese día
- **ADEMÁS**, actualiza el "peso de orden" de cada misión

### 2. **Peso de Orden (orderWeight)**
Cada misión tiene un peso que determina su posición preferida:
- **Peso 1000**: Primera posición (máxima prioridad)
- **Peso 500**: Posición neutral (por defecto)
- **Peso 100**: Última posición (mínima prioridad)

### 3. **Aplicación Automática (Días Futuros)**
Cuando cargas un nuevo día:
- Las tareas se ordenan automáticamente por el peso de su misión
- Si ya ordenaste ese día manualmente, se respeta ese orden
- Si no, se usa el orden aprendido de días anteriores

## 📊 Ejemplo Práctico

### Día 1 (Lunes):
```
Usuario ordena manualmente:
1. Meditar (peso → 1000)
2. Ejercicio (peso → 850)
3. Estudiar (peso → 700)
4. Revisar email (peso → 100)
```

### Día 2 (Martes):
```
Nuevas tareas aparecen automáticamente ordenadas:
1. Meditar (peso 1000) ← Automático
2. Ejercicio (peso 850) ← Automático
3. Estudiar (peso 700) ← Automático
4. Comprar comida (peso 500) ← Nueva misión, neutral
5. Revisar email (peso 100) ← Automático
```

### Día 3 (Miércoles):
```
Usuario reordena:
1. Ejercicio (peso → 1000) ← Ahora es prioridad máxima
2. Meditar (peso → 900)
3. Estudiar (peso → 800)
4. Revisar email (peso → 100)

Los pesos se actualizan para días futuros
```

## 🔄 Comportamiento

### Tareas con Orden Guardado
- Se respeta el orden manual del día
- Las nuevas tareas se agregan al final

### Tareas sin Orden Guardado
- Se ordenan automáticamente por peso de misión
- Mayor peso = más arriba en la lista

### Actualización de Pesos
- Se actualiza cada vez que reordenas tareas
- El cálculo es proporcional a la posición
- Afecta solo a misiones, no a tareas temporales

## 💡 Ventajas

1. **Aprendizaje Automático**: El sistema aprende tus preferencias
2. **Consistencia**: Misiones recurrentes mantienen su posición preferida
3. **Flexibilidad**: Puedes ajustar manualmente cualquier día
4. **No Invasivo**: No afecta funcionalidad existente

## 🛠️ Implementación Técnica

### Archivos Modificados:

1. **`tab-missions/app-state-missions.js`**
   - Agregado campo `orderWeight` a nuevas misiones
   - Función `updateMissionOrderWeights()` para actualizar pesos

2. **`tab-today/app-state-today.js`**
   - Modificado `saveTodayTaskOrder()` para actualizar pesos

3. **`tab-today/feature-today.js`**
   - Ordenamiento automático por peso cuando no hay orden guardado

4. **`global/js/app-state.js`**
   - Migración automática para misiones existentes

### Estructura de Datos:

```javascript
// Misión con orderWeight
{
  id: "m-123456789",
  name: "Meditar",
  points: 5,
  categoryId: "cat-xyz",
  dailyRepetitions: { max: 1 },
  orderWeight: 1000  // ← NUEVO
}
```

## 🎮 Uso

No requiere configuración. El sistema funciona automáticamente:

1. **Ordena tareas hoy** → Arrastra y suelta
2. **El sistema aprende** → Actualiza pesos
3. **Días futuros** → Orden automático basado en pesos
4. **Ajusta si necesitas** → Reordena manualmente

## 🔍 Debugging

Para ver los pesos de las misiones en consola:
```javascript
App.state.getMissions().forEach(m => {
  console.log(`${m.name}: peso ${m.orderWeight}`);
});
```

## 📝 Notas

- Las tareas temporales (sin missionId) no tienen peso
- El peso se calcula linealmente: primera = 1000, última = 100
- Cada reordenamiento recalcula todos los pesos
- Los pesos se guardan en localStorage automáticamente
