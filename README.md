# openIMIS Frontend Appraisal module

`@openimis/fe-appraisal` is the officer's side of the desk appraisal of programme applications, backed by
[openimis-be-appraisal_py](https://github.com/nlgfc2024/openimis-be-appraisal_py). Urban MEP is the first
programme (Operations Manual chapter 8, Annex 2A). Work is tracked in
[nlgfc2024/openimis-be-appraisal_py#1](https://github.com/nlgfc2024/openimis-be-appraisal_py/issues/1).

## Pages

Both pages use the CoreMIS building blocks and theme: fe-core's `Searcher`, `Form`, `Table`, `TextInput` and
`WarningBox`, the theme's paper, table-title band and dialog buttons, and household validation's summary cards.

- **Desk appraisal** (`/appraisals`, under Social Protection):
  - summary cards: appraisals, in screening, eligible, clarification required, ineligible, answers changed;
  - the appraisals the user may see (applicant, national ID, programme, round, stage, status, decision, score),
    filtered by name or national ID, programme, status, decision, and "answers changed since review".
    Double-click opens one.
- **Appraisal** (`/appraisals/appraisal/<uuid>`), a `Form` with back and refresh:
  - head panel: the application's fields, read-only, and cards for requirements met, pending, not met and the
    decision (or what the checklist leads to);
  - **Eligibility checklist** tab: per requirement, the result from the application with its basis next to the
    officer's answer, evidence, comment, by whom and when; rows whose application changed since the answer are
    highlighted. **Answer** opens a dialog: Yes or No with the evidence or source checked, or Pending with what
    needs clarifying (the backend's rules, checked before sending; a refusal shows its reason). Under the table,
    the decision the checklist leads to, what still blocks it, and **Record decision**;
  - **Application** and **Documents** tabs: msr_etl's `msrEtl.KoboApplications` and `msrEtl.ApplicantDocuments`;
  - **History** tab: who changed what and when.

Answer and Record decision are shown only with the screening right while screening is open.

## Rights

| Right | Code | Shows |
| --- | --- | --- |
| View appraisals | 220001 | the menu entry and both pages |
| Screen | 220002 | Answer and Record decision |

## Contributions

| Contribution | Value |
| --- | --- |
| `core.Router` | `appraisals`, `appraisals/appraisal/:appraisal_uuid` |
| `socialProtection.MainMenu` | Desk appraisal |
| `refs` | `appraisal.route.appraisals`, `appraisal.route.appraisal` |
| `reducers` | `appraisal` (the list) |

## Development

```
yarn install
yarn build      # rollup to dist/
yarn test       # node:test, the pure helpers in src/util
```

Register it in `openimis-fe_js/openimis.json`:

```json
{ "name": "AppraisalModule", "npm": "@openimis/fe-appraisal@file:../openimis-fe-appraisal_js" }
```
