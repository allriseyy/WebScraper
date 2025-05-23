import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
    azureOpenAI: z.object({
        endpoint: z.string().url(),
        apikey: z.string(),
        apiVersion: z.string(),
        deploymentName: z.string(),
    }),
    azureSearch: z.object({
        endpoint: z.string().url().optional(),
        apikey: z.string().optional(),
    }),

    browser: z.object({
        headless: z.boolean(),
        timeout: z.number(),
    }),
    api: z.object({
        port: z.number(),
    }),
});

export const config = configSchema.parse({
    azureOpenAI: {
        endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
        apikey: process.env.AZURE_OPENAI_API_KEY!,
        apiVersion: process.env.AZURE_OPENAI_API_VERSION!,
        deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
    },

    azureSearch: {
        endpoint: process.env.AZURE_SEARCH_ENDPOINT,
        apikey: process.env.AZURE_SEARCH_API_KEY,
    },
    browser: {
        headless: process.env.HEADLESS_MODE === 'true',
        timeout: parseInt(process.env.BROWSER_TIMEOUT || '30000'),
    },

    api: {
        port: parseInt(process.env.PORT || '3000'),
    },
});