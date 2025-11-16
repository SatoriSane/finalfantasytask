// generate-manifest.js - Script para generar manifest.json dinámicamente
// Ejecutar: node generate-manifest.js [production|local]

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const env = args[0] || 'local'; // 'production' o 'local'

const manifestBase = {
    "name": "Final Fantasy Task",
    "short_name": "FFTask",
    "description": "Tu gestor de tareas estilo Final Fantasy con gamificación y sistema de puntos.",
    "display": "standalone",
    "orientation": "portrait-primary",
    "background_color": "#0A1128",
    "theme_color": "#0A1128",
    "categories": ["productivity", "lifestyle"],
    "icons": [
        {
            "src": "icons/icon-72x72.png",
            "sizes": "72x72",
            "type": "image/png",
            "purpose": "any"
        },
        {
            "src": "icons/icon-96x96.png",
            "sizes": "96x96",
            "type": "image/png",
            "purpose": "any"
        },
        {
            "src": "icons/icon-128x128.png",
            "sizes": "128x128",
            "type": "image/png",
            "purpose": "any"
        },
        {
            "src": "icons/icon-144x144.png",
            "sizes": "144x144",
            "type": "image/png",
            "purpose": "any"
        },
        {
            "src": "icons/icon-152x152.png",
            "sizes": "152x152",
            "type": "image/png",
            "purpose": "any"
        },
        {
            "src": "icons/icon-192x192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any"
        },
        {
            "src": "icons/icon-384x384.png",
            "sizes": "384x384",
            "type": "image/png",
            "purpose": "any"
        },
        {
            "src": "icons/icon-512x512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any"
        },
        {
            "src": "icons/icon-192x192-maskable.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "maskable"
        }
    ],
    "screenshots": [
        {
            "src": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 540 720'%3E%3Crect width='540' height='720' fill='%230A1128'/%3E%3Ctext x='270' y='360' font-size='60' text-anchor='middle' fill='%2300E4FF' font-family='Arial, sans-serif'%3EFFTask App%3C/text%3E%3C/svg%3E",
            "sizes": "540x720",
            "type": "image/svg+xml",
            "form_factor": "narrow"
        }
    ]
};

// Configurar según entorno
if (env === 'production') {
    manifestBase.start_url = "/finalfantasytask/";
    manifestBase.scope = "/finalfantasytask/";
    console.log('✅ Generando manifest para PRODUCCIÓN (GitHub Pages)');
} else {
    manifestBase.start_url = "./";
    manifestBase.scope = "./";
    console.log('✅ Generando manifest para DESARROLLO (localhost)');
}

// Guardar archivo
const outputPath = path.join(__dirname, 'manifest.json');
fs.writeFileSync(outputPath, JSON.stringify(manifestBase, null, 4));

console.log(`📝 Manifest guardado en: ${outputPath}`);
console.log(`   start_url: ${manifestBase.start_url}`);
console.log(`   scope: ${manifestBase.scope}`);
