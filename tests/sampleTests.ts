import { WebTestingAgent } from '../src/agent/agentCore';

describe('Web Testing Agent', () => {
    let agent: WebTestingAgent;

    beforeAll(async () => {
        agent = new WebTestingAgent();
        await agent.initialize({ headless: true });
    });

    afterAll(async () => {
        await agent.close();
    });

    test('should navigate to a website', async () => {
        const result = await agent.executeTest('Navigate to https://example.com');
        expect(result.status).toBe('completed');
    });

    test('should fill a form', async () => {
        const result = await agent.executeTest(
            `Go to https://httpbin.org/forms/post and fill the customer field with "Test User"`
        );
        expect(result.status).toBe('completed');
    });

    test('should handle login flow', async () => {
        const result = await agent.executeTest(
            `Visit https://the-internet.herokuapp.com/login, enter username "tomsmith" and password `
        );
        expect(result.status).toBe('completed');
    });
});