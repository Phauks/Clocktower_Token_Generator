import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        exclude: ['node_modules', 'dist'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/ts/**/*.ts'],
            exclude: ['src/ts/**/*.test.ts', 'src/ts/**/*.spec.ts', 'src/ts/types/**']
        }
    },
    resolve: {
        alias: {
            // Handle .js extensions in TypeScript imports
        }
    }
});
