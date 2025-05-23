import { WebTestingAgent } from './agent/agentCore';
import { logger } from './utils/logger';
 
async function main() {
  const agent = new WebTestingAgent();
 
  try {
    // Initialize the agent
    await agent.initialize({ headless: false });
 
    // Example test cases
    const testCases = [
      "Navigate to https://example.com and take a screenshot",
      "Go to https://httpbin.org/forms/post, fill the customer field with 'John Doe', fill cust",
      "Visit https://the-internet.herokuapp.com/login, enter username 'tomsmith' and password '",
    ];
 
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      logger.info(`\n--- Test Case ${i + 1} ---`);
      logger.info(`Instruction: ${testCase}`);
 
      const result = await agent.executeTest(testCase);
 
      logger.info(`Status: ${result.status}`);
      if (result.status === 'completed' && result.generatedActions) {
        logger.info(`Generated ${result.generatedActions.length} actions`);
        result.generatedActions.forEach((action) => {
          logger.info(`  - ${JSON.stringify(action)}`);
        });
      } else if (result.error) {
        logger.error(`Error: ${result.error}`);
      }
 
      // Wait between test cases
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (error) {
    logger.error('Application error', { error });
  } finally {
    await agent.close();
  }
}
 
main();
 
if (require.main === module) {
  main().catch(console.error);
}