import { AzureAIClient } from './llmClient';
import { BrowserManager } from '../playwright/browserManager';
import { PlaywrightExecutor } from '../playwright/actionExecutor';
import { PageAnalyzer } from '../playwright/pageAnalyzer';
import { TestExecutionResult, AgentConfig } from '../utils/types';
import { logger } from '../utils/logger';
import { AIProjectsClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";

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

        // logger.info('Web testing agent initialized');
    }

    async executeTest(instruction: string): Promise<TestExecutionResult> {
        const startTime = Date.now();

        try {
            if (!this.executor || !this.pageAnalyzer) {
                throw new Error('Agent not initialized. Call initialize() first.');
            }

            // logger.info('Executing test instruction', { instruction });

            // Get current page context
            const urlMatch = instruction.match(/https?:\/\/[^\s]+/);
            if (urlMatch) {
                const url = urlMatch[0];
                logger.info(`Starting Playwright agent and extract text from the website`);
                await this.executor.page.goto(url);
            }
            const pageContext = await this.pageAnalyzer.getPageContext();
            const contextString = `URL: ${pageContext.url}\nTitle: ${pageContext.title}\nVisible Text: ${pageContext.textContent}`;
            this.runAgentConversation(contextString);
            
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

            // logger.info('Test execution completed', {
            //     instruction,
            //     duration,
            //     actionsCount: actions.length,
            //     successCount: executionResults.results.filter(r => r.status === 'success').length
            // });

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

    async runAgentConversation(text: string): Promise<void> {
        const client = AIProjectsClient.fromConnectionString(
            "swedencentral.api.azureml.ms;b95c8575-9d29-4306-9d92-e7cd8757734c;ce1-swc-6fc-rg;ce1-swc-6fc-project",
            new DefaultAzureCredential()
        );

        const agent = await client.agents.getAgent("asst_MErmdpfEPJHOhQ16CREx4x83");
        console.log(`\n\nName of agent: ${agent.name}`);

        const thread = await client.agents.getThread("thread_LfpnRP5shkX8vW4lTPrbZ6nq");
        // console.log(`Retrieved thread, thread ID: ${thread.id}`);

        const message = await client.agents.createMessage(thread.id, {
            role: "user",
            content: "show me certificate check results " + text,
        });
        // console.log(`Created message, message ID: ${message.id}`);

        let run = await client.agents.createRun(thread.id, agent.id);

        // Poll for run status
        while (run.status === "queued" || run.status === "in_progress") {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            run = await client.agents.getRun(thread.id, run.id);
        }

        // Retrieve and display messages
        const messages = await client.agents.listMessages(thread.id);

        console.log('\n************************************************************************************************************************************************************************');
        console.log("************************************************************************** Request for Agent  **************************************************************************");
        console.log(messages.data.reverse()[0].content);
        const hello = messages.data.reverse()[0].content
        const textContent = hello[0] as { text: { value: string } };
        console.log('\n************************************************************************************************************************************************************************');
        console.log("************************************************************************* Response from Agent  *************************************************************************");
        console.log(textContent.text.value);
    }

    async close(): Promise<void> {
        await this.browserManager.closeBrowser();
        // logger.info('Web testing agent closed');
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