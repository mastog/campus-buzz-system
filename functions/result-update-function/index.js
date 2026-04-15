export async function handler(event) {
  const response = await fetch(`${event.dataServiceUrl}/submissions/${event.submissionId}/result`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event.result),
  });

  if (!response.ok) {
    throw new Error(`Result update failed with ${response.status}`);
  }

  return response.json();
}
