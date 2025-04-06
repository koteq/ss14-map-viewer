import fs from 'node:fs/promises';
import path from 'node:path';

const mapsDir = 'public/maps';
const outputFile = 'public/maps/list.json';

const maps = [];
for (const entry of await fs.readdir(mapsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const content = await fs.readFile(path.join(mapsDir, entry.name, 'map.json'), 'utf-8');
    const { id, name } = JSON.parse(content);
    maps.push({ id, name });
}
await fs.writeFile(outputFile, JSON.stringify({ maps }, null, 2), 'utf-8');
