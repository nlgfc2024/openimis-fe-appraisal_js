import { formatPageQueryWithCount, graphql } from "@openimis/fe-core";

import {
  ELIGIBILITY_CLARIFICATION,
  ELIGIBILITY_ELIGIBLE,
  ELIGIBILITY_INELIGIBLE,
  GQL_APPRAISAL_QUERY,
  ITEM_KIND_ELIGIBILITY,
  OPEN_STATUSES,
} from "./constants";

export const SEARCH_APPRAISALS = "APPRAISAL_APPRAISALS";

const APPRAISAL_LIST_PROJECTION = [
  "id",
  "uuid",
  "programme",
  "round",
  "stage",
  "status",
  "eligibility",
  "score",
  "rank",
  "koboId",
  "dateUpdated",
  "individual { id firstName lastName jsonExt }",
];

export function fetchAppraisals(params) {
  return graphql(formatPageQueryWithCount(GQL_APPRAISAL_QUERY, params, APPRAISAL_LIST_PROJECTION), SEARCH_APPRAISALS);
}

// Counts for the summary cards, one request; status and eligibility are GraphQL enums
export const APPRAISAL_SUMMARY_QUERY = `query AppraisalSummary {
  total: appraisal(first: 1) { totalCount }
  screening: appraisal(first: 1, status_In: [${OPEN_STATUSES.join(", ")}]) { totalCount }
  eligible: appraisal(first: 1, eligibility: ${ELIGIBILITY_ELIGIBLE}) { totalCount }
  clarification: appraisal(first: 1, eligibility: ${ELIGIBILITY_CLARIFICATION}) { totalCount }
  ineligible: appraisal(first: 1, eligibility: ${ELIGIBILITY_INELIGIBLE}) { totalCount }
  review: appraisal(first: 1, needsReview: true) { totalCount }
}`;

// The detail page reads one appraisal through useGraphqlQuery
export const APPRAISAL_QUERY = `query AppraisalDetail($id: ID) {
  appraisal(id: $id, first: 1) {
    edges { node {
      id uuid programme round stage status eligibility score rank koboId submissionId jsonExt dateUpdated
      canScreen canDecide canReopen
      decisionPreview { decision ineligible pending unanswered changed problem }
      individual { id uuid firstName lastName dob jsonExt }
      items(kind: "${ITEM_KIND_ELIGIBILITY}") {
        id uuid key label systemResult basis basisChanged officerResult evidence comment decidedBy decidedAt
        result isOverridden
      }
      history { date user subject changes }
    } }
  }
}`;

export const ANSWER_ITEM_MUTATION = `mutation AnswerAppraisalItem($input: AnswerAppraisalItemMutationInput!) {
  answerAppraisalItem(input: $input) { internalId clientMutationId }
}`;

export const REOPEN_APPRAISAL_MUTATION = `mutation ReopenAppraisal($input: ReopenAppraisalMutationInput!) {
  reopenAppraisal(input: $input) { internalId clientMutationId }
}`;

export const DECIDE_ELIGIBILITY_MUTATION = `mutation DecideAppraisalEligibility(
  $input: DecideAppraisalEligibilityMutationInput!
) {
  decideAppraisalEligibility(input: $input) { internalId clientMutationId }
}`;
