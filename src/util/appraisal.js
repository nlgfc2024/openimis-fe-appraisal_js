import {
  ANSWER_FIELD_COMMENT,
  ANSWER_FIELD_EVIDENCE,
  ANSWER_FIELD_POINTS,
  ANSWER_FIELD_RESULT,
  ANSWER_FIELD_ACTION,
  ANSWER_FIELD_REASON,
  CITY_LOCATION_TYPE,
  DOCUMENT_FIELD_STATUS,
  DOCUMENT_REJECTED,
  DOCUMENT_VERIFIED,
  RETURNABLE_STATUSES,
  STATUS_RETURNED,
  STATUS_ELIGIBLE,
  STATUS_SCORED,
  ELIGIBILITY_CLARIFICATION,
  ELIGIBILITY_ELIGIBLE,
  ELIGIBILITY_INELIGIBLE,
  EMPTY_VALUE,
  HISTORY_HIDDEN_FIELDS,
  OPEN_STATUSES,
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

/** What an officer's points need (backend appraisal.scoring.answer_score): a number from 0 to the maximum, and the
 * evidence checked. */
export function scoreProblem({ points, evidence }, maxPoints) {
  const value = Number(points);
  const highest = Number(maxPoints);
  if (points === null || points === undefined || String(points).trim() === "" || Number.isNaN(value)) {
    return ANSWER_FIELD_POINTS;
  }
  if (value < 0 || (!Number.isNaN(highest) && value > highest)) return ANSWER_FIELD_POINTS;
  if (!(evidence || "").trim()) return ANSWER_FIELD_EVIDENCE;
  return null;
}

/** Whether an officer can change points: only a scored appraisal (backend answer_score). */
export function isScoringOpen(appraisal) {
  return appraisal?.status === STATUS_SCORED;
}

/** Whether an appraisal can be (re)scored: eligible or scored (backend appraisal.scoring.SCORABLE). */
export function isScorable(appraisal) {
  return [STATUS_ELIGIBLE, STATUS_SCORED].includes(appraisal?.status);
}

/** The name of the location's ancestor (or itself) of the city type; null outside one. */
export function cityOf(location, type = CITY_LOCATION_TYPE) {
  let place = location;
  while (place) {
    if (place.type === type) return place.name;
    place = place.parent;
  }
  return null;
}

/** The last shortlist run kept on a ranked appraisal (json_ext.shortlist): {by, at, groups: [{group, places,
 * ranked, shortlisted}]}, or null. */
export function shortlistRun(appraisal) {
  const run = parseJson(appraisal?.jsonExt).shortlist;
  return run && Array.isArray(run.groups) ? run : null;
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

/** Whether the appraisal can be returned for action now. */
export function isReturnable(appraisal) {
  return RETURNABLE_STATUSES.includes(appraisal?.status);
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
