import { AzureAIClient } from './llmClient';
import { BrowserManager } from '../playwright/browserManager';
import { PlaywrightExecutor } from '../playwright/actionExecutor';
import { PageAnalyzer } from '../playwright/pageAnalyzer';
import { TestExecutionResult, AgentConfig } from '../utils/types';
import { logger } from '../utils/logger';

export class WebTestingAgent {
    private aiClient: AzureAIClient;
    private browserManager: BrowserManager;
    private executor: PlaywrightExecutor | null = null;
    private pageAnalyzer: PageAnalyzer | null = null;

    constructor() {
        this.aiClient = new AzureAIClient();
        this.browserManager = new BrowserManager();
    }

    async initialize(config: Partial<AgentConfig> = {}): Promise<void> {
        const page = await this.browserManager.startBrowser(config.headless);
        this.executor = new PlaywrightExecutor(page);
        this.pageAnalyzer = new PageAnalyzer(page);

        logger.info('Web testing agent initialized');
    }

    async executeTest(instruction: string): Promise<TestExecutionResult> {
        const startTime = Date.now();

        try {
            if (!this.executor || !this.pageAnalyzer) {
                throw new Error('Agent not initialized. Call initialize() first.');
            }

            logger.info('Executing test instruction', { instruction });

            // Get current page context
            const pageContext = await this.pageAnalyzer.getPageContext();
            const contextString = `URL: ${pageContext.url}\nTitle: ${pageContext.title}\nVisible Text: ${pageContext.textContent}`;

            // Generate Playwright actions using AI
            const actions = await this.aiClient.generatePlaywrightActions(instruction, contextString);

            // Execute actions
            const executionResults = await this.executor.executeActions(actions);

            const duration = Date.now() - startTime;

            const result: TestExecutionResult = {
                instruction,
                generatedActions: actions,
                executionResults,
                status: 'completed',
                timestamp: new Date(),
                duration,
            };

            logger.info('Test execution completed', {
                instruction,
                duration,
                actionsCount: actions.length,
                successCount: executionResults.results.filter(r => r.status === 'success').length
            });

            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);

            logger.error('Test execution failed!', { instruction, error: errorMessage, duration });

            return {
                instruction,
                status: 'error',
                error: errorMessage,
                timestamp: new Date(),
                duration,
            };
        }
    }

    async close(): Promise<void> {
        await this.browserManager.closeBrowser();
        logger.info('Web testing agent closed');
    }

    async takeScreenshot(filename?: string): Promise<string> {
        if (!this.executor) {
            throw new Error('Agent not initialized');
        }

        const screenshotFilename = filename || `screenshot-${Date.now()}.png`;
        await this.executor.executeActions([
            { action: 'screenshot', filename: screenshotFilename }
        ]);

        return screenshotFilename;
    }

    async getCurrentPageInfo(): Promise<any> {
        if (!this.pageAnalyzer) {
            throw new Error('Agent not initialized');
        }

        return await this.pageAnalyzer.getPageContext();
    }
}