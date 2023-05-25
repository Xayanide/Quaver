import { existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getAbsoluteFileURL } from '@zptxdev/zptx-lib';
import type { SettingsObject } from './settings.d.js';

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
}

export const settings: SettingsObject = await import(settingsPath.toString());
