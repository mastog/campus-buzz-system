import express from "express";

const app = express();
const port = process.env.PORT || 3000;
const workflowBaseUrl = process.env.WORKFLOW_BASE_URL || "http://localhost:3001";

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

function formatStatusClass(status) {
  return String(status || "PENDING").replace(/\s+/g, "-");
}

function pageShell(content, title = "Campus Buzz") {
  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${title}</title>
      <style>
        :root {
          --bg: #07131d;
          --panel: rgba(10, 28, 42, 0.88);
          --panel-border: rgba(100, 206, 255, 0.18);
          --text: #e8f7ff;
          --muted: #90b6c8;
          --accent: #23d7ff;
          --accent-warm: #ff8c42;
          --danger: #ff5f78;
          --ok: #66f2a3;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: "Segoe UI", sans-serif;
          color: var(--text);
          background:
            radial-gradient(circle at top, rgba(35, 215, 255, 0.14), transparent 30%),
            linear-gradient(180deg, #061019 0%, #081824 100%);
          min-height: 100vh;
        }
        .shell {
          max-width: 980px;
          margin: 0 auto;
          padding: 48px 20px 72px;
        }
        .hero {
          margin-bottom: 28px;
        }
        .eyebrow {
          color: var(--accent);
          font-size: 12px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        h1 {
          margin: 0 0 14px;
          font-size: clamp(34px, 5vw, 56px);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .lead {
          margin: 0;
          max-width: 760px;
          color: var(--muted);
          line-height: 1.7;
        }
        .panel {
          background: var(--panel);
          border: 1px solid var(--panel-border);
          border-radius: 24px;
          padding: 24px;
          backdrop-filter: blur(10px);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.26);
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .field.full {
          grid-column: 1 / -1;
        }
        label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: var(--muted);
        }
        input, textarea {
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.04);
          color: var(--text);
          padding: 14px 16px;
          font: inherit;
        }
        textarea {
          min-height: 160px;
          resize: vertical;
        }
        .actions {
          margin-top: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .hint {
          color: var(--muted);
          font-size: 14px;
        }
        button, .button {
          appearance: none;
          border: none;
          border-radius: 999px;
          padding: 14px 22px;
          background: linear-gradient(90deg, var(--accent), var(--accent-warm));
          color: #041119;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
        }
        .status {
          display: inline-flex;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font-weight: 700;
          background: rgba(35, 215, 255, 0.12);
          color: var(--accent);
        }
        .status.APPROVED { background: rgba(102, 242, 163, 0.16); color: var(--ok); }
        .status.NEEDS-REVISION { background: rgba(255, 140, 66, 0.16); color: var(--accent-warm); }
        .status.INCOMPLETE { background: rgba(255, 95, 120, 0.14); color: var(--danger); }
        .kv {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-top: 20px;
        }
        .card {
          padding: 16px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .card small {
          display: block;
          color: var(--muted);
          margin-bottom: 8px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .note {
          margin-top: 20px;
          line-height: 1.7;
          color: var(--muted);
        }
        @media (max-width: 720px) {
          .grid, .kv { grid-template-columns: 1fr; }
        }
      </style>
    </head>
    <body>
      <main class="shell">${content}</main>
    </body>
  </html>`;
}

app.get("/", (_req, res) => {
  res.send(
    pageShell(`
      <section class="hero">
        <div class="eyebrow">Cloud Execution Models</div>
        <h1>Campus Buzz</h1>
        <p class="lead">
          Submit a campus event, let the background workflow validate and classify it,
          and then view the final review result with status, category, priority, and note.
        </p>
      </section>
      <section class="panel">
        <form method="post" action="/submit">
          <div class="grid">
            <div class="field">
              <label for="title">Event Title</label>
              <input id="title" name="title" placeholder="Career Workshop 2026" />
            </div>
            <div class="field">
              <label for="organiserName">Organiser Name</label>
              <input id="organiserName" name="organiserName" placeholder="CS Student Society" />
            </div>
            <div class="field">
              <label for="location">Location</label>
              <input id="location" name="location" placeholder="Academic Building Room 403" />
            </div>
            <div class="field">
              <label for="date">Date</label>
              <input id="date" name="date" placeholder="2026-05-01" />
            </div>
            <div class="field full">
              <label for="description">Description</label>
              <textarea id="description" name="description" placeholder="Describe the event in at least 40 characters."></textarea>
            </div>
          </div>
          <div class="actions">
            <div class="hint">Required fields are checked before category and priority rules are applied.</div>
            <button type="submit">Submit Event</button>
          </div>
        </form>
      </section>
    `)
  );
});

app.post("/submit", async (req, res) => {
  const submission = {
    title: req.body.title || "",
    description: req.body.description || "",
    location: req.body.location || "",
    date: req.body.date || "",
    organiserName: req.body.organiserName || "",
  };

  const response = await fetch(`${workflowBaseUrl}/submissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(submission),
  });

  if (!response.ok) {
    const error = await response.text();
    res.status(502).send(pageShell(`<section class="panel"><h1>Submission failed</h1><p class="lead">${error}</p></section>`));
    return;
  }

  const result = await response.json();
  res.redirect(`/results/${result.id}`);
});

app.get("/results/:id", async (req, res) => {
  const response = await fetch(`${workflowBaseUrl}/submissions/${req.params.id}`);
  if (!response.ok) {
    res.status(404).send(pageShell(`<section class="panel"><h1>Result not found</h1></section>`));
    return;
  }

  const submission = await response.json();
  const refreshing = submission.processingState === "PENDING";

  res.send(
    pageShell(
      `
      <section class="hero">
        <div class="eyebrow">Submission Result</div>
        <h1>${submission.title || "Untitled Event"}</h1>
        <p class="lead">Submission ID: ${submission.id}</p>
      </section>
      <section class="panel">
        <div class="status ${formatStatusClass(submission.processingState)}">${submission.processingState}</div>
        <div class="kv">
          <div class="card"><small>Category</small><strong>${submission.category ?? "PENDING"}</strong></div>
          <div class="card"><small>Priority</small><strong>${submission.priority ?? "PENDING"}</strong></div>
          <div class="card"><small>Date</small><strong>${submission.date || "Missing"}</strong></div>
          <div class="card"><small>Organiser</small><strong>${submission.organiserName || "Missing"}</strong></div>
          <div class="card"><small>Location</small><strong>${submission.location || "Missing"}</strong></div>
          <div class="card"><small>Last Updated</small><strong>${new Date(submission.updatedAt).toLocaleString("en-GB")}</strong></div>
        </div>
        <p class="note">${submission.note || "Background processing is still running. This page will refresh automatically."}</p>
        <div class="actions">
          <a class="button" href="/">Submit Another Event</a>
          <div class="hint">${refreshing ? "Refreshing every second until the workflow completes." : "Final result stored successfully."}</div>
        </div>
      </section>
      ${refreshing ? `<script>setTimeout(()=>location.reload(),1000)</script>` : ""}
    `,
      "Campus Buzz Result"
    )
  );
});

app.listen(port, () => {
  console.log(`presentation-service listening on ${port}`);
});
