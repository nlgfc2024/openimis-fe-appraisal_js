import { formatPageQueryWithCount, graphql } from "@openimis/fe-core";

import {
  ELIGIBILITY_CLARIFICATION,
  ELIGIBILITY_ELIGIBLE,
  ELIGIBILITY_INELIGIBLE,
  GQL_APPRAISAL_QUERY,
  ITEM_KIND_ELIGIBILITY,
  ITEM_KIND_SCORE,
  OPEN_STATUSES,
} from "./constants";

export const SEARCH_APPRAISALS = "APPRAISAL_APPRAISALS";
export const SEARCH_RANKING = "APPRAISAL_RANKING";

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

// The ranking also needs the applicant's location up to the city, and the last shortlist run (jsonExt)
const RANKING_PROJECTION = [
  ...APPRAISAL_LIST_PROJECTION.filter((field) => !field.startsWith("individual")),
  "jsonExt",
  "shortlistGroup",
  "individual { id firstName lastName jsonExt }",
];

export function fetchRanking(params) {
  return graphql(formatPageQueryWithCount(GQL_APPRAISAL_QUERY, params, RANKING_PROJECTION), SEARCH_RANKING);
}

// The programme and round of the latest appraisal, to open the shortlist screen on
export const LATEST_ROUND_QUERY = `query AppraisalLatestRound {
  appraisal(first: 1, orderBy: ["-date_created"]) { edges { node { programme round } } }
}`;

// Counts for the summary cards, one request; status and eligibility are GraphQL enums
export const APPRAISAL_SUMMARY_QUERY = `query AppraisalSummary {
  total: appraisal(first: 1) { totalCount }
  screening: appraisal(first: 1, status_In: [${OPEN_STATUSES.join(", ")}]) { totalCount }
  eligible: appraisal(first: 1, eligibility: ${ELIGIBILITY_ELIGIBLE}) { totalCount }
  clarification: appraisal(first: 1, eligibility: ${ELIGIBILITY_CLARIFICATION}) { totalCount }
  ineligible: appraisal(first: 1, eligibility: ${ELIGIBILITY_INELIGIBLE}) { totalCount }
  review: appraisal(first: 1, needsReview: true) { totalCount }
}`;

const APPROVAL_FIELDS =
  "id uuid kind programme round status summary requestedBy requestedAt decidedBy decidedAt outcome taskId appraisalId";

// A round's approvals, newest first (the shortlist's, on the shortlist screen)
export const APPROVALS_QUERY = `query AppraisalApprovals($programme: String!, $round: String, $kind: String) {
  appraisalApprovals(programme: $programme, round: $round, kind: $kind) { ${APPROVAL_FIELDS} }
}`;

export const REPORT_QUERY = `query AppraisalReport($programme: String!, $round: String) {
  appraisalReport(programme: $programme, round: $round) {
    programme round total
    byStatus { key count }
    byStage { key count }
    byCity { city places total eligible ineligible clarification scored shortlisted }
    breakdowns { key label counts { key count } }
    documents { incomplete outstanding toReview rejected }
    awaiting {
      notStarted documentsToReview documentsOutstanding clarification answersChanged returned
      eligibilityApproval shortlistApproval
    }
  }
}`;

// The detail page reads one appraisal through useGraphqlQuery
export const APPRAISAL_QUERY = `query AppraisalDetail($id: ID) {
  appraisal(id: $id, first: 1) {
    edges { node {
      id uuid programme round stage status eligibility score rank koboId submissionId jsonExt dateUpdated
      canScreen canDecide canReopen canScore canRescore canReviewDocuments canReturn canResubmit
      decisionPreview { decision ineligible pending unanswered changed problem }
      individual { id uuid firstName lastName dob jsonExt }
      items(kind: "${ITEM_KIND_ELIGIBILITY}") {
        id uuid key label systemResult basis basisChanged officerResult evidence comment decidedBy decidedAt
        result isOverridden
      }
      scoreItems: items(kind: "${ITEM_KIND_SCORE}") {
        id uuid key label systemPoints basis basisChanged officerPoints officerValue evidence comment decidedBy
        decidedAt
        points maxPoints isOverridden
      }
      documentsComplete
      documents {
        documentType label required documentId filename downloadStatus status comment reviewedBy reviewedAt
      }
      returns {
        id uuid stage previousStatus reason actionRequired requestedBy returnedAt resubmittedBy resubmittedAt
        resubmissionNote isOpen
      }
      pendingApproval { ${APPROVAL_FIELDS} }
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

export const APPRAISAL_ROUNDS_QUERY = `query AppraisalRounds {
  appraisalRounds { programme round configured appraisals }
}`;

export const SCORE_APPRAISALS_MUTATION = `mutation ScoreAppraisals($input: ScoreAppraisalsMutationInput!) {
  scoreAppraisals(input: $input) { internalId clientMutationId }
}`;

export const ANSWER_SCORE_MUTATION = `mutation AnswerAppraisalScore($input: AnswerAppraisalScoreMutationInput!) {
  answerAppraisalScore(input: $input) { internalId clientMutationId }
}`;

export const CLOSE_SHORTLIST_MUTATION = `mutation CloseShortlist($input: CloseShortlistMutationInput!) {
  closeShortlist(input: $input) { internalId clientMutationId }
}`;

export const SHORTLIST_MUTATION = `mutation ShortlistAppraisals($input: ShortlistAppraisalsMutationInput!) {
  shortlistAppraisals(input: $input) { internalId clientMutationId }
}`;

export const REVIEW_DOCUMENT_MUTATION = `mutation ReviewApplicantDocument($input: ReviewApplicantDocumentMutationInput!) {
  reviewApplicantDocument(input: $input) { internalId clientMutationId }
}`;

export const RETURN_APPRAISAL_MUTATION = `mutation ReturnAppraisal($input: ReturnAppraisalMutationInput!) {
  returnAppraisal(input: $input) { internalId clientMutationId }
}`;

export const RESUBMIT_APPRAISAL_MUTATION = `mutation ResubmitAppraisal($input: ResubmitAppraisalMutationInput!) {
  resubmitAppraisal(input: $input) { internalId clientMutationId }
}`;
