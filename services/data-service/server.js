import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import mysql from "mysql2/promise";

const app = express();
const port = process.env.PORT || 3002;
const dataDir = path.resolve("data");
const dataFile = path.join(dataDir, "submissions.json");
const storageDriver = (process.env.STORAGE_DRIVER || "file").toLowerCase();

app.use(express.json());

let pool = null;

function useMysql() {
  return storageDriver === "mysql";
}

async function getPool() {
  if (pool) return pool;
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
  });
  return pool;
}

async function initMysql() {
  const mysqlPool = await getPool();
  await mysqlPool.execute(`
    CREATE TABLE IF NOT EXISTS submissions (
      id VARCHAR(64) PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      location VARCHAR(255) NOT NULL,
      date_value VARCHAR(32) NOT NULL,
      organiser_name VARCHAR(255) NOT NULL,
      processing_state VARCHAR(32) NOT NULL,
      category VARCHAR(32) NULL,
      priority VARCHAR(32) NULL,
      note TEXT NULL,
      created_at VARCHAR(64) NOT NULL,
      updated_at VARCHAR(64) NOT NULL
    )
  `);
}

function mapRow(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    date: row.date_value,
    organiserName: row.organiser_name,
    processingState: row.processing_state,
    category: row.category,
    priority: row.priority,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function readStore() {
  if (useMysql()) {
    const mysqlPool = await getPool();
    const [rows] = await mysqlPool.query("SELECT * FROM submissions ORDER BY created_at ASC");
    return rows.map(mapRow);
  }

  try {
    const raw = await fs.readFile(dataFile, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeStore(records) {
  if (useMysql()) return;
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(records, null, 2));
}

async function createSubmission(payload) {
  const now = new Date().toISOString();
  const record = {
    id: crypto.randomUUID(),
    title: payload.title ?? "",
    description: payload.description ?? "",
    location: payload.location ?? "",
    date: payload.date ?? "",
    organiserName: payload.organiserName ?? "",
    processingState: payload.processingState ?? "PENDING",
    category: payload.category ?? null,
    priority: payload.priority ?? null,
    note: payload.note ?? null,
    createdAt: now,
    updatedAt: now,
  };

  if (useMysql()) {
    const mysqlPool = await getPool();
    await mysqlPool.execute(
      `INSERT INTO submissions
      (id, title, description, location, date_value, organiser_name, processing_state, category, priority, note, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.title,
        record.description,
        record.location,
        record.date,
        record.organiserName,
        record.processingState,
        record.category,
        record.priority,
        record.note,
        record.createdAt,
        record.updatedAt,
      ]
    );
    return record;
  }

  const records = await readStore();
  records.push(record);
  await writeStore(records);
  return record;
}

async function getSubmission(id) {
  if (useMysql()) {
    const mysqlPool = await getPool();
    const [rows] = await mysqlPool.execute("SELECT * FROM submissions WHERE id = ? LIMIT 1", [id]);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  const records = await readStore();
  return records.find((item) => item.id === id) ?? null;
}

async function updateSubmissionResult(id, result) {
  const updatedAt = new Date().toISOString();

  if (useMysql()) {
    const mysqlPool = await getPool();
    await mysqlPool.execute(
      `UPDATE submissions
       SET processing_state = ?, category = ?, priority = ?, note = ?, updated_at = ?
       WHERE id = ?`,
      [
        result.processingState,
        result.category,
        result.priority,
        result.note,
        updatedAt,
        id,
      ]
    );
    return getSubmission(id);
  }

  const records = await readStore();
  const index = records.findIndex((item) => item.id === id);
  if (index === -1) return null;
  records[index] = {
    ...records[index],
    processingState: result.processingState,
    category: result.category,
    priority: result.priority,
    note: result.note,
    updatedAt,
  };
  await writeStore(records);
  return records[index];
}

app.post("/submissions", async (req, res) => {
  const record = await createSubmission(req.body);
  res.status(201).json(record);
});

app.get("/submissions/:id", async (req, res) => {
  const record = await getSubmission(req.params.id);
  if (!record) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }
  res.json(record);
});

app.patch("/submissions/:id/result", async (req, res) => {
  const updated = await updateSubmissionResult(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: "Submission not found" });
    return;
  }
  res.json(updated);
});

app.listen(port, async () => {
  if (useMysql()) {
    await initMysql();
  } else {
    await writeStore(await readStore());
  }
  console.log(`data-service listening on ${port} with ${storageDriver} storage`);
});
