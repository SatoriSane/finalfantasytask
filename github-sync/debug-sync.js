// Script de diagnóstico para GitHub Sync
// Ejecuta esto en la consola del navegador después de conectar

console.log('=== DIAGNÓSTICO GITHUB SYNC ===');

// 1. Verificar que el objeto existe
if (\!window.GitHubSync) {
    console.error('❌ window.GitHubSync no existe');
} else {
    console.log('✅ window.GitHubSync existe');
}

// 2. Verificar estado
const status = window.GitHubSync?.getStatus();
console.log('\n📊 Estado actual:', status);

// 3. Verificar localStorage
console.log('\n💾 localStorage:');
console.log('  token:', localStorage.getItem('fftask_github_token') ? '✅ Existe' : '❌ No existe');
console.log('  gistId:', localStorage.getItem('fftask_gist_id') || '❌ No existe');
console.log('  lastSync:', localStorage.getItem('fftask_last_sync') || '❌ No existe');

// 4. Verificar propiedades internas
console.log('\n🔍 Propiedades internas:');
console.log('  this.token:', window.GitHubSync.token ? '✅ Existe' : '❌ null');
console.log('  this.gistId:', window.GitHubSync.gistId || '❌ null');
console.log('  this.isConnected:', window.GitHubSync.isConnected);
console.log('  this.lastSync:', window.GitHubSync.lastSync);

// 5. Verificar UI
console.log('\n🎨 UI:');
const syncBtn = document.getElementById('githubSyncBtn');
if (syncBtn) {
    console.log('  Botón existe: ✅');
    console.log('  Clases:', syncBtn.className);
    console.log('  Texto:', syncBtn.querySelector('.sync-text')?.textContent);
    console.log('  Icono:', syncBtn.querySelector('.sync-icon')?.textContent);
} else {
    console.log('  Botón existe: ❌');
}

// 6. Verificar GitHubSyncUI
if (\!window.GitHubSyncUI) {
    console.error('❌ window.GitHubSyncUI no existe');
} else {
    console.log('✅ window.GitHubSyncUI existe');
}

console.log('\n=== FIN DIAGNÓSTICO ===');
console.log('\nPara actualizar manualmente el UI, ejecuta:');
console.log('window.GitHubSync.updateUI()');
