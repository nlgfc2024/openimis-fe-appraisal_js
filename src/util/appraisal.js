import {
  ANSWER_FIELD_COMMENT,
  ANSWER_FIELD_EVIDENCE,
  ANSWER_FIELD_RESULT,
  ELIGIBILITY_CLARIFICATION,
  ELIGIBILITY_ELIGIBLE,
  ELIGIBILITY_INELIGIBLE,
  EMPTY_VALUE,
  JSON_EXT_REOPENED,
  OPEN_STATUSES,
  REOPENABLE_STATUSES,
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

/** Whether a recorded eligibility decision can be reopened to correct it. */
export function isReopenable(appraisal) {
  return !!appraisal && REOPENABLE_STATUSES.includes(appraisal.status);
}

/** The latest reopening of the appraisal's decision ({from, by, at, reason}), or null. */
export function lastReopening(appraisal) {
  const reopened = parseJson(appraisal?.jsonExt)[JSON_EXT_REOPENED];
  return Array.isArray(reopened) && reopened.length ? reopened[reopened.length - 1] : null;
}

/** Whether items can be answered and a decision recorded: the backend's open screening statuses. */
export function isScreeningOpen(appraisal) {
  return !!appraisal && OPEN_STATUSES.includes(appraisal.status);
}

/**
 * The decision the backend will record from these eligibility items (Annex 2A): any NO is INELIGIBLE, otherwise
 * any PENDING is CLARIFICATION, otherwise ELIGIBLE. `blockers` are the items to deal with first: no result yet,
 * or answers changed since the officer's answer.
 */
export function previewDecision(items) {
  const list = items || [];
  const unanswered = list.filter((item) => !item.result).map((item) => item.key);
  const changed = list.filter((item) => item.basisChanged).map((item) => item.key);
  const byResult = (result) => list.filter((item) => item.result === result).map((item) => item.key);
  const ineligible = byResult(RESULT_NO);
  const pending = byResult(RESULT_PENDING);
  let decision = ELIGIBILITY_ELIGIBLE;
  if (ineligible.length) decision = ELIGIBILITY_INELIGIBLE;
  else if (pending.length) decision = ELIGIBILITY_CLARIFICATION;
  return {
    decision: list.length ? decision : null,
    ineligible,
    pending,
    blockers: { unanswered, changed },
    canDecide: !!list.length && !unanswered.length && !changed.length,
  };
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

/** Changes in the history as "field: old -> new" lines, leaving out bookkeeping fields. */
export function describeChanges(changes) {
  return parseJsonList(changes).map(({ field, old, new: value }) => `${field}: ${show(old)} → ${show(value)}`);
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

function show(value) {
  if (value === null || value === undefined || value === "") return EMPTY_VALUE;
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}
