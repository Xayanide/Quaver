import { existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import type { SettingsObject } from './settings.d.js';

function getAbsoluteFileURL(baseURL: string, path: string[]): URL {
    const __dirname = dirname(fileURLToPath(baseURL));
    return pathToFileURL(resolve(__dirname, ...path));
}

const settingsPath = getAbsoluteFileURL(import.meta.url, [
    '..',
    '..',
    '..',
    'settings.js',
]);
if (!existsSync(settingsPath)) {
    console.log(
        `Could not find ${settingsPath}.\nMake a copy of settings.example.js, edit the fields as necessary and rename it to settings.js`,
    );
    process.exit(1);
}

export const settings: SettingsObject = await import(settingsPath.toString());
