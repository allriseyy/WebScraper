import { OpenAIClient } from '@azure/openai';
import { AzureKeyCredential } from '@azure/core-auth';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { PlaywrightAction } from '../utils/types';
import { DefaultAzureCredential } from "@azure/identity";

export class AzureAIClient {
    private client: OpenAIClient;
    private deploymentName: string;

    constructor() {
        this.client = new OpenAIClient(
            config.azureOpenAI.endpoint,
            new DefaultAzureCredential(),
            {
                apiVersion: config.azureOpenAI.apiVersion,
            }
        );
        this.deploymentName = 'gpt-4o';
    }

    async generatePlaywrightActions(
        naturalLanguageInstruction: string,
        pageContext: string = ''
    ): Promise<PlaywrightAction[]> {
        const systemPrompt = `You are a web testing expert that converts natural language instruction

Given a natural language instruction, generate a JSON array of Playwright actions.
Available actions:
        - goto: Navigate to URL
            - click: Click element by selector
                - fill: Fill input field
                    - select: Select dropdown option.
- wait: Wait for element or time
            - screenshot: Take screenshot
                - assert_text: Assert text exists
                    - assert_visible: Assert element is visible
                        - assert_url: Assert current URL

Example format:

{ "action": "goto", "url": "https://example.com" },

{ "action": "fill", "selector": "#username", "value": "testuser" },
        { "action": "click", "selector": "button[type='submit']" },
{ "action": "assert_text", "text": "Welcome" }
        1

Return only valid JS0N array.`;

        const userPrompt = `
        Instruction: $[naturalLanguageInstruction}

Page Context: $[pageContext}

Generate Playwright actions: `;

        try {
            // logger.info('Generating Playwright actions for instruction', {
            //     instruction: naturalLanguageInstruction,
            // });
            const response = await this.client.getChatCompletions(
                this.deploymentName,
                [

                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                {
                    temperature: 0.1,
                    maxTokens: 1000,
                    model: this.deploymentName,
                }
            );

            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No response from Azure OpenAI');
            }

            const actions = JSON.parse(content) as PlaywrightAction[];
            // logger.info('Successfully generated actions', { actionsCount: actions.length });

            return actions;
        } catch (error) {
            logger.error('Failed to generate Playwright actions', { error });
            throw new Error(`Failed to parse AI response: $(error}`);
        }
    }
}