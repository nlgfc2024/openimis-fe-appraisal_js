export const APPRAISAL_MODULE_NAME = "appraisal";

// Backend rights (appraisal module, 220000 block)
export const RIGHT_APPRAISAL_VIEW = 220001;
export const RIGHT_APPRAISAL_SCREEN = 220002;
export const RIGHT_APPRAISAL_RETURN = 220006;

// The backend GraphQL connection of appraisals
export const GQL_APPRAISAL_QUERY = "appraisal";

export const ROUTE_APPRAISALS = "appraisals";
export const ROUTE_APPRAISAL = "appraisals/appraisal";

// Values of the backend appraisal models (Appraisal, AppraisalItem)
export const RESULT_YES = "YES";
export const RESULT_NO = "NO";
export const RESULT_PENDING = "PENDING";
export const RESULTS = [RESULT_YES, RESULT_NO, RESULT_PENDING];

export const ITEM_KIND_ELIGIBILITY = "ELIGIBILITY";
export const ITEM_KIND_SCORE = "SCORE";

export const ELIGIBILITY_ELIGIBLE = "ELIGIBLE";
export const ELIGIBILITY_INELIGIBLE = "INELIGIBLE";
export const ELIGIBILITY_CLARIFICATION = "CLARIFICATION";
export const ELIGIBILITIES = [ELIGIBILITY_ELIGIBLE, ELIGIBILITY_INELIGIBLE, ELIGIBILITY_CLARIFICATION];

export const STATUS_RECEIVED = "RECEIVED";
export const STATUS_DOCUMENT_CHECK = "DOCUMENT_CHECK";
export const STATUS_DESK_SCREENING = "DESK_SCREENING";
export const STATUS_ELIGIBLE = "ELIGIBLE";
export const STATUS_INELIGIBLE = "INELIGIBLE";
export const STATUS_SCORED = "SCORED";
export const STATUS_SHORTLISTED = "SHORTLISTED";
export const STATUS_NOT_SHORTLISTED = "NOT_SHORTLISTED";
export const STATUS_RETURNED = "RETURNED";
export const STATUSES = [
  STATUS_RECEIVED,
  STATUS_DOCUMENT_CHECK,
  STATUS_DESK_SCREENING,
  STATUS_ELIGIBLE,
  STATUS_INELIGIBLE,
  STATUS_SCORED,
  STATUS_SHORTLISTED,
  STATUS_NOT_SHORTLISTED,
  STATUS_RETURNED,
];
// Statuses in which items can be answered and a decision recorded (backend appraisal.review.OPEN_STATUSES)
export const OPEN_STATUSES = [STATUS_RECEIVED, STATUS_DOCUMENT_CHECK, STATUS_DESK_SCREENING];
// A decision the backend lets an officer reopen; scored or shortlisted appraisals stay as they are
export const REOPENABLE_STATUSES = [STATUS_ELIGIBLE, STATUS_INELIGIBLE];
export const JSON_EXT_REOPENED = "reopened";

// History entries about the appraisal itself rather than one of its items
export const HISTORY_SUBJECT_APPRAISAL = "appraisal";

// Answer fields an officer must fill (util/appraisal.answerProblem)
export const ANSWER_FIELD_RESULT = "result";
export const ANSWER_FIELD_EVIDENCE = "evidence";
export const ANSWER_FIELD_COMMENT = "comment";

// Tabs of the appraisal page and the list's summary cards (also their translation keys)
export const TAB_CHECKLIST = "checklist";
export const TAB_APPLICATION = "application";
export const TAB_DOCUMENTS = "documents";
export const TAB_HISTORY = "history";
export const APPRAISAL_TABS = [TAB_CHECKLIST, TAB_APPLICATION, TAB_DOCUMENTS, TAB_HISTORY];
export const SUMMARY_CARDS = ["total", "screening", "eligible", "clarification", "ineligible", "review"];

// msr_etl components shown on the appraisal page
export const REF_KOBO_APPLICATIONS = "msrEtl.KoboApplications";
export const REF_APPLICANT_DOCUMENTS = "msrEtl.ApplicantDocuments";

export const EMPTY_VALUE = "\u2014";

export const DEFAULT_PAGE_SIZE = 10;
export const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
export const DEFAULT_DEBOUNCE_TIME = 500;
