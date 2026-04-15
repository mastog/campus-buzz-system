import express from "express";
import { handler } from "./index.js";

const app = express();
const port = process.env.PORT || 7001;

app.use(express.json());

app.post("/invoke", async (req, res) => {
  try {
    const result = await handler(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`submission-event-function listening on ${port}`);
});
