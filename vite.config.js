import { defineConfig } from 'vite';

export default defineConfig({
    root: 'app',
    base: './',
    server: {
        port: 8765,
        open: true,
        // Allow access from local network (for phone testing)
        host: true
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        // Keep script tags as-is (no bundling needed for vanilla JS)
        rollupOptions: {
            input: 'app/index.html'
        }
    }
});
