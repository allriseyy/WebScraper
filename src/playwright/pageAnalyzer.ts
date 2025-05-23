import { Page } from '@playwright/test';
import { PageContext } from '../utils/types';
import { logger } from '../utils/logger';

export class PageAnalyzer {
    constructor(private page: Page) { }

    async getPageContext(): Promise<PageContext> {
        try {
            const url = this.page.url();
            // console.log("URL:", url);
            const title = await this.page.title();

            // Get visible text (first 1000 chars)
            const textContent = await this.page.evaluate(() => {
                return document.body.innerText || '';
            });

            const context: PageContext = {
                url,
                title,
                textContent: textContent,
            };

            logger.debug('Page context extracted', { url, title, textLength: textContent.length });
            return context;
        } catch (error) {
            logger.error('Failed to get page context', { error });
            return {
                url: 'unknown',
                title: 'unknown',
                textContent: '',
            };
        }
    }

    async getElementInfo(selector: string): Promise<any> {
        try {
            const element = await this.page.$(selector);
            if (!element) {
                return null;
            }

            const info = await element.evaluate((el) => {
                const htmlEl = el as HTMLElement;

                return {
                    tagName: htmlEl.tagName,
                    text: htmlEl.textContent,
                    visible: htmlEl.offsetParent !== null,
                    attributes: Array.from(htmlEl.attributes).reduce((acc: Record<string, string>, attr) => {
                        acc[attr.name] = attr.value;
                        return acc;
                    }, {})
                };
            });

            return info;
        } catch (error) {
            logger.error('Failed to get element info', { selector, error });
            return null;
        }
    }
}