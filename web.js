async function runTest() {
  const response = await fetch('http://localhost:3000/api/execute-test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instruction: 'Navigate to https://polite-sky-033f16f03.6.azurestaticapps.net/DBS-3.html?hasAgreedTermsAndConditions=on&_eventId_submit=Continue and return the ceritificate number',
      headless: true,
    }),
  });

  const result = await response.json();
  console.log('Test Result:', result);
}

runTest().catch(console.error);