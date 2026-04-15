import express from "express";
import { handler } from "./index.js";

const app = express();
const port = process.env.PORT || 7003;

app.use(express.json());

app.post("/invoke", async (req, res) => {
  const result = await handler(req.body);
  res.json(result);
});

app.listen(port, () => {
  console.log(`result-update-function listening on ${port}`);
});
