const test = require("node:test");
const assert = require("node:assert/strict");

const {
  answerProblem,
  cityOf,
  formatPoints,
  isScorable,
  isScoringOpen,
  scoreProblem,
  shortlistRun,
  countsByKey,
  describeChanges,
  describeShortlistGroups,
  humanize,
  isAwaitingApproval,
  latestApproval,
  isScreeningOpen,
  parseJson,
  previewDecision,
  proposal,
  refusalCode,
  isReopenable,
  lastReopening,
  awaitingPoints,
  shortlistClosed,
} = require("../src/util/appraisal");

const item = (key, result, extra = {}) => ({ key, result, basisChanged: false, ...extra });

test("previewDecision follows the Annex 2A rule", async (t) => {
  await t.test("all YES is ELIGIBLE", () => {
    const preview = previewDecision([item("a", "YES"), item("b", "YES")]);
    assert.strictEqual(preview.decision, "ELIGIBLE");
    assert.strictEqual(preview.canDecide, true);
  });

  await t.test("any NO is INELIGIBLE, even with PENDING items", () => {
    const preview = previewDecision([item("a", "PENDING"), item("b", "NO"), item("c", "YES")]);
    assert.strictEqual(preview.decision, "INELIGIBLE");
    assert.deepStrictEqual(preview.ineligible, ["b"]);
    assert.deepStrictEqual(preview.pending, ["a"]);
  });

  await t.test("PENDING without NO asks for clarification", () => {
    assert.strictEqual(previewDecision([item("a", "YES"), item("b", "PENDING")]).decision, "CLARIFICATION");
  });

  await t.test("unanswered or changed items block the decision", () => {
    const preview = previewDecision([item("a", null), item("b", "YES", { basisChanged: true })]);
    assert.strictEqual(preview.canDecide, false);
    assert.deepStrictEqual(preview.blockers, { unanswered: ["a"], changed: ["b"] });
  });

  await t.test("no checklist, no decision", () => {
    const preview = previewDecision([]);
    assert.strictEqual(preview.decision, null);
    assert.strictEqual(preview.canDecide, false);
  });
});

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

test("isScreeningOpen", () => {
  assert.strictEqual(isScreeningOpen({ status: "DESK_SCREENING" }), true);
  assert.strictEqual(isScreeningOpen({ status: "ELIGIBLE" }), false);
  assert.strictEqual(isScreeningOpen(null), false);
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

test("scoreProblem mirrors the backend rules", () => {
  assert.strictEqual(scoreProblem({ points: "", evidence: "x" }, "25"), "points");
  assert.strictEqual(scoreProblem({ points: "abc", evidence: "x" }, "25"), "points");
  assert.strictEqual(scoreProblem({ points: "26", evidence: "x" }, "25"), "points");
  assert.strictEqual(scoreProblem({ points: "-1", evidence: "x" }, "25"), "points");
  assert.strictEqual(scoreProblem({ points: "12", evidence: " " }, "25"), "evidence");
  assert.strictEqual(scoreProblem({ points: "0", evidence: "Site visit" }, "25"), null);
  assert.strictEqual(scoreProblem({ points: "25", evidence: "Site visit" }, "25"), null);
});

test("scoring states", () => {
  assert.strictEqual(isScoringOpen({ status: "SCORED" }), true);
  assert.strictEqual(isScoringOpen({ status: "SHORTLISTED" }), false);
  assert.strictEqual(isScorable({ status: "ELIGIBLE" }), true);
  assert.strictEqual(isScorable({ status: "DESK_SCREENING" }), false);
});

test("cityOf walks up to the city", () => {
  const village = { name: "Che-Jine", type: "V", parent: { name: "Makata", type: "W", parent: {
    name: "Blantyre Malabada", type: "D", parent: { name: "Blantyre", type: "R" } } } };
  assert.strictEqual(cityOf(village), "Blantyre");
  assert.strictEqual(cityOf({ name: "Ward", type: "W" }), null);
  assert.strictEqual(cityOf(null), null);
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
  const { documentReviewProblem, documentProblems, isReturnable, openReturn, returnProblem } = require("../src/util/appraisal");
  assert.strictEqual(documentReviewProblem({}), "status");
  assert.strictEqual(documentReviewProblem({ status: "REJECTED", comment: " " }), "comment");
  assert.strictEqual(documentReviewProblem({ status: "REJECTED", comment: "Blurred" }), null);
  assert.strictEqual(documentReviewProblem({ status: "VERIFIED" }), null);
  assert.strictEqual(returnProblem({ reason: "", actionRequired: "x" }), "reason");
  assert.strictEqual(returnProblem({ reason: "x", actionRequired: " " }), "actionRequired");
  assert.strictEqual(returnProblem({ reason: "x", actionRequired: "y" }), null);
  assert.strictEqual(isReturnable({ status: "SCORED" }), true);
  assert.strictEqual(isReturnable({ status: "SHORTLISTED" }), false);
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
        { group: "Blantyre", ranked: 2, shortlisted: 1 },
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

test("a recorded decision can be reopened, a scored or shortlisted one can't", () => {
  assert.strictEqual(isReopenable({ status: "ELIGIBLE" }), true);
  assert.strictEqual(isReopenable({ status: "INELIGIBLE" }), true);
  for (const status of ["DESK_SCREENING", "SCORED", "SHORTLISTED", "RETURNED"]) {
    assert.strictEqual(isReopenable({ status }), false, status);
  }
  assert.strictEqual(isReopenable(null), false);
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
