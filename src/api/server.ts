import express from 'express';
import { WebTestingAgent } from '../agent/agentCore';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { z } from 'zod';

const app = express();
app.use(express.json());

// Request validation schemas
const executeTestSchema = z.object({
    instruction: z.string().min(1),
    headless: z.boolean().optional().default(true),
    takeScreenshot: z.boolean().optional().default(false),
});

// Global agent instance
let agent: WebTestingAgent | null = null;

// Middleware to ensure agent is initialized
const ensureAgent = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!agent) {
        agent = new WebTestingAgent();
        try {
            await agent.initialize({ headless: true });
        } catch (error) {
            logger.error('Failed to initialize agent', { error });
            return res.status(500).json({ error: 'Failed to initialize testing agent' });
        }
    }
    next();
};

// Routes
app.post('/api/execute-test', ensureAgent, async (req, res) => {
    try {
        const { instruction, headless, takeScreenshot } = executeTestSchema.parse(req.body);

        const result = await agent!.executeTest(instruction);

        // if (takeScreenshot && result.status === 'completed') {
        //     try {
        //         const screenshotPath = await agent!.takeScreenshot();
        //         result.screenshot = screenshotPath;
        //     } catch (error) {
        //         logger.warn('Failed to take screenshot', { error });
        //     }
        // }

        res.json(result);
        console.log(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid request data', details: error.errors });
        }

        logger.error('API error in execute-test', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/page-info', ensureAgent, async (req, res) => {
    try {
        const pageInfo = await agent!.getCurrentPageInfo();
        res.json(pageInfo);
    } catch (error) {
        logger.error('API error in page-info', { error });
        res.status(500).json({ error: 'Failed to get page information' });
    }
});

app.post('/api/screenshot', ensureAgent, async (req, res) => {
    try {
        const { filename } = req.body;
        const screenshotPath = await agent!.takeScreenshot(filename);
        res.json({ filename: screenshotPath });
    } catch (error) {
        logger.error('API error in screenshot', { error });
        res.status(500).json({ error: 'Failed to take screenshot' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully');
    if (agent) {
        await agent.close();
    }
    process.exit(0);
});

const PORT = config.api.port;
app.listen(PORT, () => {
    logger.info(`API server started on port ${PORT}`);
});