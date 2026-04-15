const processingFunctionUrl =
  process.env.PROCESSING_FUNCTION_URL || "http://localhost:7002/invoke";
const resultUpdateFunctionUrl =
  process.env.RESULT_UPDATE_FUNCTION_URL || "http://localhost:7003/invoke";
const functionAuthToken = process.env.FUNCTION_AUTH_TOKEN || "";

function functionHeaders() {
  return {
    "Content-Type": "application/json",
    ...(functionAuthToken ? { Authorization: `Bearer ${functionAuthToken}` } : {}),
  };
}

export async function handler(event) {
  if (event.probe) {
    return { ok: true };
  }

  const recordResponse = await fetch(`${event.dataServiceUrl}/submissions/${event.submissionId}`);
  if (!recordResponse.ok) {
    throw new Error(`Unable to read submission ${event.submissionId}`);
  }

  const submission = await recordResponse.json();
  const processingResponse = await fetch(processingFunctionUrl, {
    method: "POST",
    headers: functionHeaders(),
    body: JSON.stringify({ submission }),
  });

  if (!processingResponse.ok) {
    throw new Error(`Processing function failed with ${processingResponse.status}`);
  }

  const result = await processingResponse.json();
  const updateResponse = await fetch(resultUpdateFunctionUrl, {
    method: "POST",
    headers: functionHeaders(),
    body: JSON.stringify({
      submissionId: submission.id,
      result,
      dataServiceUrl: event.dataServiceUrl,
    }),
  });

  if (!updateResponse.ok) {
    throw new Error(`Result update function failed with ${updateResponse.status}`);
  }

  return updateResponse.json();
}
