import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, '..', 'src');

function getJsFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of list) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
            results = results.concat(getJsFiles(fullPath));
        } else if (file.name.endsWith('.js')) {
            results.push(fullPath);
        }
    }
    return results;
}

console.log('🔍 Iniciando verificación de sintaxis y build del backend...');
const files = getJsFiles(srcDir);
let errors = 0;

for (const file of files) {
    const relativePath = path.relative(path.join(__dirname, '..'), file);
    try {
        execSync(`node --check "${file}"`, { stdio: 'pipe' });
    } catch (err) {
        console.error(`❌ Error de sintaxis en: ${relativePath}`);
        console.error(err.stderr?.toString() || err.message);
        errors++;
    }
}

if (errors > 0) {
    console.error(`\n❌ Se encontraron ${errors} error(es) en el backend.`);
    process.exit(1);
} else {
    console.log(`\n✅ Build check exitoso: ${files.length} archivos JS verificados sin errores.`);
}
