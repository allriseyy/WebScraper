import { AIProjectsClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";

async function runAgentConversation() {
  
const client = AIProjectsClient.fromConnectionString(
  "swedencentral.api.azureml.ms;b95c8575-9d29-4306-9d92-e7cd8757734c;ce1-swc-6fc-rg;ce1-swc-6fc-project",
  new DefaultAzureCredential()
);
  
const agent = await client.agents.getAgent("asst_MErmdpfEPJHOhQ16CREx4x83");
console.log(`Retrieved agent: ${agent.name}`);
  
const thread = await client.agents.getThread("thread_vfs0llpJIhzS7lBw2raVDalo");
console.log(`Retrieved thread, thread ID: ${thread.id}`);
  
const message = await client.agents.createMessage(thread.id, {
  role: "user",
  content: "give me dbs update for John Smith"
});
console.log(`Created message, message ID: ${message.id}`);
  
// Create run
let run = await client.agents.createRun(thread.id, agent.id);

// Poll until the run reaches a terminal status
while (
  run.status === "queued" ||
  run.status === "in_progress"
) {
  // Wait for a second
  await new Promise((resolve) => setTimeout(resolve, 1000));
  run = await client.agents.getRun(thread.id, run.id);
}

console.log(`Run completed with status: ${run.status}`);
  
// Retrieve messages
const messages = await client.agents.listMessages(thread.id);

// Display messages
for (const dataPoint of messages.data.reverse()) {
  console.log(`${dataPoint.createdAt} - ${dataPoint.role}:`);
  for (const contentItem of dataPoint.content) {
    if (contentItem.type === "text") {
      console.log(contentItem.text.value);
    }
  }
}
}

// Main execution
runAgentConversation().catch(error => {
  console.error("An error occurred:", error);
});
