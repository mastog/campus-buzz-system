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
          --page: #c0c0c0;
          --panel: #efefef;
          --border-dark: #404040;
          --border-light: #ffffff;
          --text: #000000;
          --link: #0000ee;
          --visited: #551a8b;
          --pending: #ffffcc;
          --ok: #ccffcc;
          --warn: #ffe0b3;
          --bad: #ffcccc;
        }
        body {
          margin: 0;
          font-family: Verdana, Geneva, sans-serif;
          font-size: 14px;
          color: var(--text);
          background: var(--page);
          padding: 18px 12px;
        }
        * { box-sizing: border-box; }
        a { color: var(--link); }
        a:visited { color: var(--visited); }
        .shell {
          max-width: 820px;
          margin: 0 auto;
        }
        .hero {
          background: #000080;
          border: 2px solid var(--border-dark);
          color: #ffffff;
          padding: 10px 12px;
        }
        .eyebrow {
          font-size: 11px;
          margin-bottom: 6px;
        }
        h1 {
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 30px;
        }
        .lead {
          margin: 8px 0 0;
          line-height: 1.45;
        }
        .panel {
          background: var(--panel);
          border-color: var(--border-light) var(--border-dark) var(--border-dark) var(--border-light);
          border-style: solid;
          border-width: 2px;
          margin-top: 12px;
          padding: 14px;
        }
        .grid {
          display: block;
        }
        .field {
          margin-bottom: 12px;
        }
        label {
          display: block;
          font-weight: bold;
          margin-bottom: 4px;
        }
        input, textarea {
          width: 100%;
          border: 2px inset #d0d0d0;
          background: #ffffff;
          color: #000000;
          font: inherit;
          padding: 5px;
        }
        textarea {
          min-height: 110px;
          resize: vertical;
        }
        .actions {
          border-top: 1px solid #999999;
          margin-top: 12px;
          padding-top: 12px;
        }
        .hint {
          color: #333333;
          font-size: 12px;
          margin-top: 8px;
        }
        button, .button {
          border-color: #ffffff #777777 #777777 #ffffff;
          border-style: solid;
          border-width: 2px;
          background: #e6e6e6;
          color: #000000;
          display: inline-block;
          font: inherit;
          line-height: 1.2;
          padding: 4px 10px;
          text-decoration: none;
          cursor: pointer;
        }
        .button:visited {
          color: #000000;
        }
        button:active, .button:active {
          border-color: #777777 #ffffff #ffffff #777777;
          padding: 5px 9px 3px 11px;
        }
        .status {
          display: inline-block;
          border: 1px solid #000000;
          background: var(--pending);
          padding: 4px 8px;
          font-weight: bold;
        }
        .status.APPROVED { background: var(--ok); }
        .status.NEEDS-REVISION { background: var(--warn); }
        .status.INCOMPLETE { background: var(--bad); }
        .kv {
          display: table;
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
        }
        .card {
          display: table-row;
        }
        .card small {
          display: table-cell;
          width: 180px;
          border: 1px solid #999999;
          background: #d8d8d8;
          font-weight: bold;
          padding: 6px;
        }
        .card strong {
          display: table-cell;
          border: 1px solid #999999;
          background: #ffffff;
          font-weight: normal;
          padding: 6px;
        }
        .note {
          border: 1px dashed #666666;
          background: #ffffff;
          margin-top: 12px;
          margin-bottom: 0;
          padding: 8px;
          line-height: 1.45;
        }
        @media (max-width: 720px) {
          body { padding: 8px; }
          h1 { font-size: 24px; }
          .card small, .card strong {
            display: block;
            width: 100%;
          }
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
        <div class="eyebrow">Campus notice board</div>
        <h1>Campus Buzz</h1>
        <p class="lead">
          Submit a campus event and check the review result after background processing.
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
            <button type="submit">Submit Event</button>
            <div class="hint">Required fields are checked before category and priority rules are applied.</div>
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
        <div class="eyebrow">Submission result</div>
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
