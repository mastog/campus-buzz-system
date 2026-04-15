import assert from "node:assert/strict";
import { evaluateSubmission } from "./index.js";

const validSubmission = {
  title: "Career workshop for cloud recruitment",
  description: "This workshop introduces internship and recruitment paths for final-year students.",
  location: "Main Hall",
  date: "2026-05-01",
  organiserName: "Careers Office",
};

assert.equal(evaluateSubmission({ ...validSubmission }).processingState, "APPROVED");
assert.equal(evaluateSubmission({ ...validSubmission }).category, "OPPORTUNITY");
assert.equal(
  evaluateSubmission({ ...validSubmission, description: "Too short text here." }).processingState,
  "NEEDS REVISION"
);
assert.equal(
  evaluateSubmission({ ...validSubmission, date: "01-05-2026" }).processingState,
  "NEEDS REVISION"
);
assert.equal(
  evaluateSubmission({ ...validSubmission, organiserName: "" }).processingState,
  "INCOMPLETE"
);

console.log("processing-function rules passed");
