import express from "express";

const app = express();
const port = process.env.PORT || 3001;
const dataServiceUrl = process.env.DATA_SERVICE_URL || "http://8.131.52.151:3002";
const submissionEventFunctionUrl =
  process.env.SUBMISSION_EVENT_FUNCTION_URL || "http://submisson-event-ssimfaspzv.cn-beijing.fcapp.run";
const functionAuthToken = process.env.FUNCTION_AUTH_TOKEN || "";

app.use(express.json());

app.post("/submissions", async (req, res) => {
  const payload = {
    ...req.body,
    processingState: "PENDING",
    category: null,
    priority: null,
    note: "Submission stored. Background processing has started.",
  };

  const createResponse = await fetch(`${dataServiceUrl}/submissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!createResponse.ok) {
    res.status(502).json({ error: "Could not create submission record" });
    return;
  }

  const created = await createResponse.json();

  queueMicrotask(async () => {
    try {
      const functionResponse = await fetch(submissionEventFunctionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(functionAuthToken ? { Authorization: `Bearer ${functionAuthToken}` } : {}),
        },
        body: JSON.stringify({
          submissionId: created.id,
          dataServiceUrl,
        }),
      });

      if (!functionResponse.ok) {
        const errorText = await functionResponse.text();
        throw new Error(
          `Submission event function failed with ${functionResponse.status}: ${errorText}`
        );
      }
    } catch (error) {
      console.error("background processing failed", error);
      await fetch(`${dataServiceUrl}/submissions/${created.id}/result`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          processingState: "INCOMPLETE",
          category: "GENERAL",
          priority: "NORMAL",
          note: `Processing failed: ${error.message}`,
        }),
      });
    }
  });

  res.status(201).json(created);
});

app.get("/submissions/:id", async (req, res) => {
  const response = await fetch(`${dataServiceUrl}/submissions/${req.params.id}`);
  const data = await response.json();
  res.status(response.status).json(data);
});

app.post("/health/function-chain", async (_req, res) => {
  try {
    const response = await fetch(submissionEventFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(functionAuthToken ? { Authorization: `Bearer ${functionAuthToken}` } : {}),
      },
      body: JSON.stringify({
        probe: true,
        dataServiceUrl,
      }),
    });
    res.status(response.ok ? 200 : 502).json({ ok: response.ok });
  } catch (error) {
    res.status(502).json({ ok: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`workflow-service listening on ${port}`);
});
