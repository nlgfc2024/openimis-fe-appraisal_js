const test = require("node:test");
const assert = require("node:assert/strict");

const {
  answerProblem,
  groupLabel,
  shortlistGroup,
  formatPoints,
  scoreProblem,
  shortlistRun,
  describeChanges,
  parseJson,
  proposal,
  refusalCode,
  awaitingPoints,
  shortlistClosed,
  lastReopening,
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
