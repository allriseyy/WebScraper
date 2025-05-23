import { WebTestingAgent } from './src/agent/agentCore';

async function main() {
  const agent = new WebTestingAgent();
  await agent.initialize();

  const result = await agent.executeTest(
    'Go to the login page, enter my credentials, and verify I can access the dashboard'
  );

  console.log(result);
  await agent.close();
}

main().catch(console.error);