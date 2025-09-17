import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';
import { copyFileSync, existsSync, rmSync } from 'fs';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig as defineVitestConfig } from 'vitest/config';

// Plugin to copy manifest.json and move index.html to root
const copyManifestPlugin = () => {
    return {
        name: 'copy-manifest',
        writeBundle() {
            const srcManifest = resolve(fileURLToPath(new URL('.', import.meta.url)), 'src/manifest.json');
            const distManifest = resolve(fileURLToPath(new URL('.', import.meta.url)), 'dist/manifest.json');
            
            if (existsSync(srcManifest)) {
                copyFileSync(srcManifest, distManifest);
                console.log('Manifest copied to dist folder');
            }

            // Move index.html from src/popup/ to root
            const srcHtml = resolve(fileURLToPath(new URL('.', import.meta.url)), 'dist/src/popup/index.html');
            const distHtml = resolve(fileURLToPath(new URL('.', import.meta.url)), 'dist/index.html');
            
            if (existsSync(srcHtml)) {
                copyFileSync(srcHtml, distHtml);
                // Clean up the old directory structure
                rmSync(resolve(fileURLToPath(new URL('.', import.meta.url)), 'dist/src'), { recursive: true, force: true });
                console.log('index.html moved to dist root and cleaned up old structure');
            }
        }
    };
};

export default defineConfig({
    plugins: [
        svelte(), 
        copyManifestPlugin()
    ],
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                popup: resolve(fileURLToPath(new URL('.', import.meta.url)), 'src/popup/index.html'),
                'popup-main': resolve(fileURLToPath(new URL('.', import.meta.url)), 'src/popup/main.ts'),
                background: resolve(fileURLToPath(new URL('.', import.meta.url)), 'src/background.ts'),
                content: resolve(fileURLToPath(new URL('.', import.meta.url)), 'src/content.ts'),
            },
            output: {
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                assetFileNames: (assetInfo) => {
                    // Keep HTML files in root, JS files as is
                    if (assetInfo.name === 'index.html') {
                        return 'index.html';
                    }
                    return '[name].[ext]';
                }
            }
        },
        copyPublicDir: false
    },
    publicDir: false
}); 