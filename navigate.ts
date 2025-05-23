import { WebTestingAgent } from './src/agent/agentCore';

async function main() {
  const agent = new WebTestingAgent();
  await agent.initialize();

  const result = await agent.executeTest(
    'Navigate to https://polite-sky-033f16f03.6.azurestaticapps.net/DBS-3.html?hasAgreedTermsAndConditions=on&_eventId_submit=Continue',
  );
  console.log("\n\nRequest sent to the Playwright agent:");
  console.log(result);
  await agent.close();
}

main().catch(console.error);