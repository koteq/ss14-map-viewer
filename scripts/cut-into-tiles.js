import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve, basename, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = resolve(__dirname, '../public');

(function main() {
    for (const entry of fs.readdirSync(join(publicDir, 'maps'), {
        withFileTypes: true,
    })) {
        if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
        const mapFile = join(publicDir, 'maps', entry.name, 'map.json');
        if (!fs.existsSync(mapFile)) continue;
        processMapFile(mapFile);
    }
    console.log('Done');
})();

function processMapFile(mapFile) {
    console.log(`Processing file: ${mapFile}`);
    const map = JSON.parse(fs.readFileSync(mapFile, 'utf8'));

    for (const grid of map.grids) {
        if (grid.tiled) {
            console.log(`Skipping already tiled grid: ${grid.gridId}`);
            continue;
        }
        const imagePath = join(dirname(mapFile), basename(grid.url));
        const subfloorPath = join(dirname(mapFile), basename(grid.subfloorUrl));
        const imageOutputDir = join(
            dirname(imagePath),
            `${basename(imagePath, '.png')}-tiles`
        );
        const subfloorOutputDir = join(
            dirname(subfloorPath),
            `${basename(subfloorPath, '.png')}-tiles`
        );

        grid.tiled = true;
        grid.tileSize = 521;
        grid.subfloorTileSize = 1024;
        grid.url = relative(publicDir, join(imageOutputDir, '{z}/{y}/{x}.webp'));
        grid.subfloorUrl = relative(publicDir, join(subfloorOutputDir, '{z}/{y}/{x}.webp'));

        processImage(imagePath, imageOutputDir, {
            tileSize: grid.tileSize,
            quality: 60,
        });
        processImage(subfloorPath, subfloorOutputDir, {
            tileSize: grid.subfloorTileSize,
            quality: 40,
        });
    }

    fs.writeFileSync(mapFile, JSON.stringify(map, null, 2));
}

function processImage(imagePath, outputDir, { tileSize = 256, quality = 75 }) {
    const result = spawnSync('vips', [
        'dzsave',
        imagePath,
        outputDir,
        '--layout=google',
        `--tile-size=${tileSize}`,
        '--overlap=0',
        '--depth=one',
        `--suffix=.webp[near_lossless,Q=${quality},strip]`,
    ]);

    if (result.error) {
        console.error('Error executing vips', result.error);
        return;
    }

    if (result.status !== 0) {
        console.error(`vips command failed with exit code ${result.status}: ${result.stderr.toString()}`);
        return;
    }

    const ci = process.env.CI === 'true';
    if (ci) {
        fs.unlinkSync(imagePath);
        console.log(`Deleted image: ${imagePath}`);
    }
}
