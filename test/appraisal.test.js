const test = require("node:test");
const assert = require("node:assert/strict");

const {
  answerProblem,
  describeChanges,
  isScreeningOpen,
  parseJson,
  previewDecision,
  proposal,
  refusalCode,
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
});
