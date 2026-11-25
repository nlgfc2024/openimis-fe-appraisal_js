const test = require("node:test");
const assert = require("node:assert/strict");

const {
  answerProblem,
  groupLabel,
  shortlistGroup,
  formatPoints,
  scoreProblem,
  shortlistRun,
  countsByKey,
  describeChanges,
  describeShortlistGroups,
  humanize,
  isAwaitingApproval,
  latestApproval,
  parseJson,
  proposal,
  refusalCode,
  lastReopening,
  awaitingPoints,
  shortlistClosed,
} = require("../src/util/appraisal");

const item = (key, result, extra = {}) => ({ key, result, basisChanged: false, ...extra });

test("answerProblem mirrors the backend rules", () => {
  assert.strictEqual(answerProblem({}), "result");
  assert.strictEqual(answerProblem({ result: "YES", evidence: " " }), "evidence");
  assert.strictEqual(answerProblem({ result: "NO" }), "evidence");
  assert.strictEqual(answerProblem({ result: "PENDING", evidence: "x" }), "comment");
  assert.strictEqual(answerProblem({ result: "YES", evidence: "National ID" }), null);
  assert.strictEqual(answerProblem({ result: "PENDING", comment: "Which sector?" }), null);
});

test("proposal of a template check", () => {
  const basis = JSON.stringify({ proposed: "YES", youth_share: 85 });
  assert.strictEqual(proposal({ systemResult: "PENDING", basis }), "YES");
  assert.strictEqual(proposal({ systemResult: "YES", basis }), null);
  assert.strictEqual(proposal({ systemResult: "PENDING", basis: "{}" }), null);
});

test("refusalCode reads the backend's refusal", () => {
  assert.strictEqual(refusalCode(new Error("['appraisal.evidence_required: record the evidence']")), "evidence_required");
  assert.strictEqual(refusalCode("Something else"), null);
});

test("parseJson and describeChanges", () => {
  assert.deepStrictEqual(parseJson('{"note": "x"}'), { note: "x" });
  assert.deepStrictEqual(parseJson("{bad"), {});
  assert.deepStrictEqual(parseJson({ a: 1 }), { a: 1 });
  const changes = JSON.stringify([
    { field: "officer_result", old: null, new: "YES" },
    { field: "basis", old: { a: 1 }, new: { a: 2 } },
  ]);
  assert.deepStrictEqual(describeChanges(changes), ["officer_result: — → YES", 'basis: {"a":1} → {"a":2}']);
  const hidden = JSON.stringify([
    { field: "config_snapshot", old: {}, new: { round: "R1" } },
    { field: "status", old: "RETURNED", new: "DESK_SCREENING" },
  ]);
  assert.deepStrictEqual(describeChanges(hidden, (field, value) => (field === "status" ? value.toLowerCase() : value)), [
    "status: returned → desk_screening",
  ]);
});

test("scoreProblem asks for a value and the evidence", () => {
  assert.strictEqual(scoreProblem({ value: " ", evidence: "x" }), "value");
  assert.strictEqual(scoreProblem({ value: null, evidence: "x" }), "value");
  assert.strictEqual(scoreProblem({ value: "stable", evidence: " " }), "evidence");
  assert.strictEqual(scoreProblem({ value: "30", evidence: "Registration certificate" }), null);
});

test("the shortlist group comes from the backend and reads as a label", () => {
  assert.strictEqual(shortlistGroup({ shortlistGroup: "blantyre" }), "blantyre");
  assert.strictEqual(shortlistGroup({}), null);
  assert.strictEqual(groupLabel("blantyre"), "Blantyre");
  assert.strictEqual(groupLabel("fast_track"), "Fast track");
  assert.strictEqual(groupLabel(null), null);
});

test("shortlistRun and formatPoints", () => {
  const run = { by: "Admin", at: "2026-11-24T10:00:00", groups: [{ group: "Zomba", places: 104 }] };
  assert.deepStrictEqual(shortlistRun({ jsonExt: JSON.stringify({ shortlist: run }) }), run);
  assert.strictEqual(shortlistRun({ jsonExt: "{}" }), null);
  assert.strictEqual(formatPoints("31.00"), "31");
  assert.strictEqual(formatPoints("12.50"), "12.5");
  assert.strictEqual(formatPoints(null), null);
});

test("document reviews and returns", () => {
  const { documentReviewProblem, documentProblems, openReturn, returnProblem } = require("../src/util/appraisal");
  assert.strictEqual(documentReviewProblem({}), "status");
  assert.strictEqual(documentReviewProblem({ status: "REJECTED", comment: " " }), "comment");
  assert.strictEqual(documentReviewProblem({ status: "REJECTED", comment: "Blurred" }), null);
  assert.strictEqual(documentReviewProblem({ status: "VERIFIED" }), null);
  assert.strictEqual(returnProblem({ reason: "", actionRequired: "x" }), "reason");
  assert.strictEqual(returnProblem({ reason: "x", actionRequired: " " }), "actionRequired");
  assert.strictEqual(returnProblem({ reason: "x", actionRequired: "y" }), null);
  const open = { isOpen: true, reason: "Missing" };
  assert.strictEqual(openReturn({ status: "RETURNED", returns: [{ isOpen: false }, open] }), open);
  assert.strictEqual(openReturn({ status: "DESK_SCREENING", returns: [open] }), null);
  const docs = [
    { label: "ID", required: true, status: "VERIFIED" },
    { label: "Statement", required: true, status: "OUTSTANDING" },
    { label: "Other", required: false, status: "REJECTED" },
    { label: "Extra", required: false, status: "SUBMITTED" },
  ];
  assert.deepStrictEqual(documentProblems(docs), [
    { label: "Statement", status: "OUTSTANDING" },
    { label: "Other", status: "REJECTED" },
  ]);
});

test("approvals and report helpers", () => {
  assert.strictEqual(latestApproval([]), null);
  const approval = latestApproval([
    { status: "PENDING", summary: '{"shortlisted": 2}' },
    { status: "REJECTED", summary: "{}" },
  ]);
  assert.deepStrictEqual(approval.summary, { shortlisted: 2 });
  assert.strictEqual(isAwaitingApproval(approval), true);
  assert.strictEqual(isAwaitingApproval({ status: "APPROVED" }), false);
  assert.strictEqual(isAwaitingApproval(null), false);
  assert.strictEqual(
    describeShortlistGroups(
      [
        { group: "blantyre", ranked: 2, shortlisted: 1 },
        { group: null, ranked: 3, shortlisted: 3 },
      ],
      "All",
    ),
    "Blantyre 1 of 2, All 3 of 3",
  );
  assert.deepStrictEqual(countsByKey([{ key: "SCORED", count: 3 }]), { SCORED: 3 });
  assert.deepStrictEqual(countsByKey(null), {});
  assert.strictEqual(humanize("digital_ict"), "Digital ict");
  assert.strictEqual(humanize(""), "");
});

test("awaitingPoints lists the score items without points that count", () => {
  const items = [
    { key: "a", points: "15.00" },
    { key: "b", points: null },
    { key: "c" },
    { key: "d", points: "0.00" },
  ];
  assert.deepStrictEqual(awaitingPoints(items).map((item) => item.key), ["b", "c"]);
  assert.deepStrictEqual(awaitingPoints(undefined), []);
});

test("shortlistClosed reads who closed the round", () => {
  assert.deepStrictEqual(shortlistClosed({ groups: [], closed: { by: "a", at: "2026-11-24T12:00:00" } }), {
    by: "a",
    at: "2026-11-24T12:00:00",
  });
  assert.strictEqual(shortlistClosed({ groups: [] }), null);
  assert.strictEqual(shortlistClosed(null), null);
});

test("lastReopening reads the latest reopening from jsonExt", () => {
  const reopened = [
    { from: "INELIGIBLE", by: "a", at: "2026-11-24T10:00:00", reason: "first" },
    { from: "ELIGIBLE", by: "b", at: "2026-11-24T11:00:00", reason: "second" },
  ];
  assert.deepStrictEqual(lastReopening({ jsonExt: JSON.stringify({ reopened }) }), reopened[1]);
  assert.strictEqual(lastReopening({ jsonExt: "{}" }), null);
  assert.strictEqual(lastReopening({}), null);
});
