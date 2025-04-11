import fs from 'node:fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = resolve(__dirname, '../public');

const maps = [];
for (const entry of fs.readdirSync(join(publicDir, 'maps'), { withFileTypes: true })) {
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
    const content = fs.readFileSync(join(publicDir, 'maps', entry.name, 'map.json'), 'utf-8');
    const { id } = JSON.parse(content);
    maps.push({ id, name: id });
}
fs.writeFileSync(join(publicDir, 'maps/list.json'), JSON.stringify({ maps }, null, 2), 'utf-8');
