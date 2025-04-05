import { config } from 'dotenv';
import { copyFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
config();

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = join(__dirname, '..');

async function installDevPlugin() {
    const pluginDir = process.env.OBSIDIAN_PLUGIN_DIR;

    if (!pluginDir) {
        console.error('Error: OBSIDIAN_PLUGIN_DIR environment variable is not set');
        console.error('Please create a .env file with OBSIDIAN_PLUGIN_DIR=/path/to/obsidian/plugins/obsidian-sonkil');
        process.exit(1);
    }

    try {
        // Copy manifest.json and main.js to the plugin directory
        await copyFile(join(rootDir, 'manifest.json'), join(pluginDir, 'manifest.json'));
        await copyFile(join(rootDir, 'main.js'), join(pluginDir, 'main.js'));

        console.log('Plugin files successfully copied to:', pluginDir);
    } catch (error) {
        console.error('Error copying plugin files:', error);
        process.exit(1);
    }
}

installDevPlugin();