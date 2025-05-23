import { WebTestingAgent } from './src/agent/agentCore';

async function main() {
  const agent = new WebTestingAgent();
  await agent.initialize();

  const result = await agent.executeTest(
    'Go to the https://polite-sky-033f16f03.6.azurestaticapps.net/DBS-3.html?hasAgreedTermsAndConditions=on&_eventId_submit=Continue, extract the text from the page',
  );
  console.log("Request sent to the agent:");
  console.log(result);
  await agent.close();
}

main().catch(console.error);