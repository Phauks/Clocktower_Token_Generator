/**
 * Blood on the Clocktower Token Generator
 * Main Entry Point - Application initialization
 */

import UIController from './ui.js';
import { checkFontsLoaded } from './utils.js';

/**
 * Main application class
 */
class TokenGeneratorApp {
    constructor() {
        this.ui = null;
        this.fontsLoaded = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('Blood on the Clocktower Token Generator starting...');

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        // Load custom fonts
        await this.loadFonts();

        // Initialize UI controller
        this.ui = new UIController();
        await this.ui.initialize();

        console.log('Application initialized successfully');
    }

    /**
     * Load custom fonts
     */
    async loadFonts() {
        const fontFamilies = [
            'Dumbledor',
            'DumbledorThin',
            'DumbledorWide',
            'TradeGothic',
            'TradeGothicBold'
        ];

        // Wait for fonts to be loaded
        if (document.fonts) {
            try {
                await document.fonts.ready;
                this.fontsLoaded = await checkFontsLoaded(fontFamilies);
                
                if (!this.fontsLoaded) {
                    console.warn('Some custom fonts may not have loaded properly');
                } else {
                    console.log('Custom fonts loaded successfully');
                }
            } catch (error) {
                console.warn('Font loading check failed:', error);
            }
        } else {
            // Fallback: wait a bit for fonts to load
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log('Font loading (fallback mode)');
        }
    }
}

// Create and initialize the application
const app = new TokenGeneratorApp();
app.init().catch(error => {
    console.error('Application initialization failed:', error);
});

// Export for debugging
window.TokenGeneratorApp = app;
