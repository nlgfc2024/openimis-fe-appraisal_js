const test = require("node:test");
const assert = require("node:assert/strict");

const {
  answerProblem,
  describeChanges,
  lastReopening,
  parseJson,
  proposal,
  refusalCode,
} = require("../src/util/appraisal");

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
