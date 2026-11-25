import React from "react";
import { FormattedMessage, useModulesManager, useTranslations } from "@openimis/fe-core";

import { APPRAISAL_MODULE_NAME, APPROVAL_SHORTLIST } from "../../constants";
import { describeShortlistGroups } from "../../util/appraisal";

// What the supervisor approves: the proposed shortlist, or an eligibility decision (the task's jsonExt)
function ApprovalTaskDetails({ summary }) {
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  if (summary?.kind === APPROVAL_SHORTLIST) {
    return formatMessageWithValues("shortlist.proposed", {
      shortlisted: summary.shortlisted,
      ranked: summary.ranked,
      groups: describeShortlistGroups(summary.groups, formatMessage("shortlist.overall")),
    });
  }
  return formatMessageWithValues(summary?.comment ? "task.decisionWithComment" : "task.decision", {
    applicant: summary?.applicant,
    nationalId: summary?.national_id || "",
    decision: summary?.decision ? formatMessage(`eligibility.${summary.decision}`) : "",
    comment: summary?.comment,
  });
}

function ApprovalKind({ kind }) {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  return kind ? formatMessage(`approvalKind.${kind}`) : null;
}

const header = (id) => <FormattedMessage module={APPRAISAL_MODULE_NAME} id={id} />;

/** Columns of an appraisal approval task in the Tasks screen (tasksManagement.tasks, source "appraisal"). */
const AppraisalApprovalTaskTableHeaders = () => [
  header("task.change"),
  header("appraisal.programme"),
  header("appraisal.round"),
  header("task.details"),
  header("task.requestedBy"),
];

const AppraisalApprovalTaskItemFormatters = () => [
  (data, jsonExt) => <ApprovalKind kind={jsonExt?.kind} />,
  (data, jsonExt) => jsonExt?.programme,
  (data, jsonExt) => jsonExt?.round,
  (data, jsonExt) => <ApprovalTaskDetails summary={jsonExt} />,
  (data, jsonExt) => jsonExt?.requested_by,
];

export { AppraisalApprovalTaskTableHeaders, AppraisalApprovalTaskItemFormatters };
