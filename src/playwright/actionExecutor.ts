import { Page } from '@playwright/test';
import { PlaywrightAction, ActionResult } from '../utils/types';
import { logger } from '../utils/logger';

export class PlaywrightExecutor {
    constructor(public page: Page) { }

    async executeActions(actions: PlaywrightAction[]): Promise<{ results: ActionResult[] }> {
        const results: ActionResult[] = [];

        for (const action of actions) {
            try {
                // logger.info('Executing action', { action: action.action, selector: action.selector });

                const result = await this.executeSingleAction(action);
                results.push({
                    action,
                    status: 'success',
                    result,
                });
            } catch (error) {
                logger.error('Action execution failed', { action, error });
                results.push({
                    action,
                    status: 'error',
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
        return { results };
    }

    private async executeSingleAction(action: PlaywrightAction): Promise<string> {
        switch (action.action) {
            case 'goto':
                if (!action.url) throw new Error('URL is required for goto action');
                await this.page.goto(action.url);
                return `Navigated to $[action.url}`;

            case 'click':
                if (!action.selector) throw new Error('Selector is required for click action');
                await this.page.click(action.selector);

                return `Clicked $(action.selector)`;

            case 'fill':
                if (!action.selector || action.value === undefined) {
                    throw new Error('Selector and value are required for fill action');
                }
                await this.page.fill(action.selector, action.value);
                return `Filled $(action.selector) with $(action.value}`;

            case 'select':
                if (!action.selector || !action.value) {
                    throw new Error("Selector and value are required for select action");
                }

                await this.page.selectOption(action.selector, action.value);
                return 'Selected $[action.value) in $(action.selector}';

            case 'wait':
                if (action.selector) {
                    await this.page.waitForSelector(action.selector);
                    return 'Waited for $(action.selector)';
                } else if (action.timeout) {
                    await this.page.waitForTimeout(action.timeout);
                    return `Waited $[action,timeout)ms`;
                }

                throw new Error('Either selector or timeout is required for wait action');

            case 'screenshot':
                const filename = action.filename || `screenshot-$[Date.now()}.png`;
                await this.page.screenshot({ path: filename });
                return `Screenshot saved as ${filename}`;

            case 'assert_text':
                if (!action.text) throw new Error('Text is required for assert_text action');
                const content = await this.page.textContent("body");
                if (content?.includes(action.text)) {
                    return `Text '$(action.text].' found`;
                }
                throw new Error(`Text "$(action.text}' not found`);

            case 'assert_visible':
                if (!action.selector) throw new Error('Selector is required for assert_visible action')
                const isVisible = await this.page.isVisible(action.selector);
                if (isVisible) {
                    return `Element $(action.selector} is visible`;
                }

                throw new Error('Elenent $[action.selector} is not visible');

            case 'assert_url':
                if (!action.url) throw new Error('URL is required for assert_url action');
                const currentUrl = this.page.url();
                if (currentUrl.includes(action.url)) {
                    return `URL contains $(actign.url}`;
                }

                throw new Error('URL does not contain $[action.url}');

            default:
                throw new Error(`Unknown action type: $[action.action}`);
        }
    }
}