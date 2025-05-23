import { chromium, Browser, BrowserContext, Page } from '@playwright/test';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

export class BrowserManager {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;

    async startBrowser(headless: boolean = config.browser.headless): Promise<Page> {
        try {
            logger.info('Starting browser', { headless });

            this.browser = await chromium.launch({
                headless,
                timeout: config.browser.timeout,
            });
            this.context = await this.browser.newContext({
                viewport: { width: 1280, height: 720 },
            });
            this.page = await this.context.newPage();

            logger.info('Browser started successfully');
            return this.page;
        } catch (error) {
            logger.error('Failed to start browser', { error });
            throw error;
        }
    }

    async closeBrowser(): Promise<void> {
        try {
            if (this.context) {
                await this.context.close();
            }

            if (this.browser) {
                await this.browser.close();
            }

            logger.info('Browser closed successfully');
        } catch (error) {
            logger.error('Error closing browser', { error });

        }
    }

    getPage(): Page {
        if (!this.page) {
            throw new Error('Browser not started. Call startBrowser() first.');
        }
        return this.page;
    }
}