const REQUIRED_FIELDS = ["title", "description", "location", "date", "organiserName"];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function containsAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

export function evaluateSubmission(submission) {
  const normalized = Object.fromEntries(
    Object.entries(submission).map(([key, value]) => [key, String(value ?? "").trim()])
  );

  const missingField = REQUIRED_FIELDS.find((field) => !normalized[field]);
  if (missingField) {
    return {
      processingState: "INCOMPLETE",
      category: "GENERAL",
      priority: "NORMAL",
      note: `Missing required field: ${missingField}.`,
    };
  }

  const combinedText = `${normalized.title} ${normalized.description}`.toLowerCase();
  let category = "GENERAL";
  if (containsAny(combinedText, ["career", "internship", "recruitment"])) {
    category = "OPPORTUNITY";
  } else if (containsAny(combinedText, ["workshop", "seminar", "lecture"])) {
    category = "ACADEMIC";
  } else if (containsAny(combinedText, ["club", "society", "social"])) {
    category = "SOCIAL";
  }

  const priority =
    category === "OPPORTUNITY"
      ? "HIGH"
      : category === "ACADEMIC"
        ? "MEDIUM"
        : "NORMAL";

  if (!DATE_PATTERN.test(normalized.date)) {
    return {
      processingState: "NEEDS REVISION",
      category,
      priority,
      note: "The date must use the YYYY-MM-DD format.",
    };
  }

  if (normalized.description.length < 40) {
    return {
      processingState: "NEEDS REVISION",
      category,
      priority,
      note: "The description must be at least 40 characters long.",
    };
  }

  return {
    processingState: "APPROVED",
    category,
    priority,
    note: "Submission approved and ready to be shown in Campus Buzz.",
  };
}

export async function handler(event) {
  return evaluateSubmission(event.submission);
}
