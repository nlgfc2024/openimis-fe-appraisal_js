import {
  ANSWER_FIELD_COMMENT,
  ANSWER_FIELD_EVIDENCE,
  ANSWER_FIELD_VALUE,
  ANSWER_FIELD_RESULT,
  ANSWER_FIELD_ACTION,
  ANSWER_FIELD_REASON,
  DOCUMENT_FIELD_STATUS,
  DOCUMENT_REJECTED,
  DOCUMENT_VERIFIED,
  STATUS_RETURNED,
  EMPTY_VALUE,
  HISTORY_HIDDEN_FIELDS,
  JSON_EXT_REOPENED,
  RESULT_NO,
  RESULT_PENDING,
  RESULT_YES,
} from "../constants";

/** A GraphQL JSONString field as an object; {} when empty or unreadable. */
export function parseJson(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value) || {};
  } catch (e) {
    return {};
  }
}

/** The latest reopening of the appraisal's decision ({from, by, at, reason}), or null. */
export function lastReopening(appraisal) {
  const reopened = parseJson(appraisal?.jsonExt)[JSON_EXT_REOPENED];
  return Array.isArray(reopened) && reopened.length ? reopened[reopened.length - 1] : null;
}

/** What an answer needs (backend appraisal.review.answer_item): evidence for YES and NO, a comment for PENDING. */
export function answerProblem({ result, evidence, comment }) {
  if (!result) return ANSWER_FIELD_RESULT;
  if ((result === RESULT_YES || result === RESULT_NO) && !(evidence || "").trim()) return ANSWER_FIELD_EVIDENCE;
  if (result === RESULT_PENDING && !(comment || "").trim()) return ANSWER_FIELD_COMMENT;
  return null;
}

/** The proposal of a template check (basis.proposed), when the system left the item Pending for the officer. */
export function proposal(item) {
  const basis = parseJson(item?.basis);
  return item?.systemResult === RESULT_PENDING && basis.proposed ? basis.proposed : null;
}

/** The refusal code at the start of a mutation error, e.g. "appraisal.evidence_required: ..." -> evidence_required. */
export function refusalCode(error) {
  const text = String(error?.message || error || "");
  const match = text.match(/appraisal\.([a-z_]+)/);
  return match ? match[1] : null;
}

/** Changes in the history as "field: old -> new" lines, leaving out bookkeeping fields; format(field, value) names
 * coded values. */
export function describeChanges(changes, format = (field, value) => value) {
  return parseJsonList(changes)
    .filter(({ field }) => !HISTORY_HIDDEN_FIELDS.includes(field))
    .map(({ field, old, new: value }) => `${field}: ${show(old, field, format)} → ${show(value, field, format)}`);
}

function parseJsonList(value) {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function show(value, field, format) {
  if (value === null || value === undefined || value === "") return EMPTY_VALUE;
  if (typeof value === "object") return JSON.stringify(value);
  return String(format(field, value));
}

/** What an officer's corrected value needs (backend appraisal.scoring.answer_score): a value, and the evidence
 * checked. Whether it can be scored is the backend's call, from the component's rules. */
export function scoreProblem({ value, evidence }) {
  if (value === null || value === undefined || String(value).trim() === "") return ANSWER_FIELD_VALUE;
  if (!(evidence || "").trim()) return ANSWER_FIELD_EVIDENCE;
  return null;
}

/** A score input as an officer would type it (true/false for yes/no answers), "" for none. */
export function displayValue(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

/** The quota a ranked appraisal was placed in by the last shortlist (e.g. its city), from the backend; or null. */
export function shortlistGroup(appraisal) {
  return appraisal?.shortlistGroup ?? null;
}

/** A quota key for display ("blantyre" -> "Blantyre", "fast_track" -> "Fast track"); null for none. */
export function groupLabel(key) {
  if (key === null || key === undefined || key === "") return null;
  const text = String(key).replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The last shortlist run kept on a ranked appraisal (json_ext.shortlist): {by, at, groups: [{group, places,
 * ranked, shortlisted}]}, or null. */
export function shortlistRun(appraisal) {
  const run = parseJson(appraisal?.jsonExt).shortlist;
  return run && Array.isArray(run.groups) ? run : null;
}

/** Who closed the round's shortlist and when ({by, at}), or null while it can still be run. */
export function shortlistClosed(run) {
  return run?.closed || null;
}

/** Score items without points that count: the answer is missing or unreadable, so an officer sets them. */
export function awaitingPoints(items) {
  return (items || []).filter((item) => item.points === null || item.points === undefined);
}

/** A number for display with at most two decimals (points come as decimal text). */
export function formatPoints(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isNaN(number) ? String(value) : String(Math.round(number * 100) / 100);
}

/** What a document review needs (backend appraisal.documents.review_document): a reason to reject. */
export function documentReviewProblem({ status, comment }) {
  if (!status) return DOCUMENT_FIELD_STATUS;
  if (status === DOCUMENT_REJECTED && !(comment || "").trim()) return ANSWER_FIELD_COMMENT;
  return null;
}

/** What a return needs (backend appraisal.returns.return_appraisal): the reason and the action required. */
export function returnProblem({ reason, actionRequired }) {
  if (!(reason || "").trim()) return ANSWER_FIELD_REASON;
  if (!(actionRequired || "").trim()) return ANSWER_FIELD_ACTION;
  return null;
}

/** The appraisal's open return, when it is returned. */
export function openReturn(appraisal) {
  if (appraisal?.status !== STATUS_RETURNED) return null;
  return (appraisal.returns || []).find((item) => item.isOpen) || null;
}

/** Required documents not verified and rejected ones: [{label, status}] (backend documents_problems). */
export function documentProblems(documents) {
  return (documents || [])
    .filter((doc) => doc.status === DOCUMENT_REJECTED || (doc.required && doc.status !== DOCUMENT_VERIFIED))
    .map((doc) => ({ label: doc.label, status: doc.status }));
}
