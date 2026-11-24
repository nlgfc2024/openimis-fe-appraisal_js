import React from "react";
import { Typography } from "@material-ui/core";
import { Table, formatDateTimeFromISO, useModulesManager, useTranslations } from "@openimis/fe-core";
import { useIntl } from "react-intl";

import {
  APPRAISAL_MODULE_NAME,
  HISTORY_CODED_FIELDS,
  HISTORY_SUBJECT_APPRAISAL,
  HISTORY_SUBJECT_DOCUMENT_PREFIX,
  HISTORY_SUBJECT_RETURN,
} from "../constants";
import { describeChanges } from "../util/appraisal";

function AppraisalHistory({ history, items, documents }) {
  const modulesManager = useModulesManager();
  const intl = useIntl();
  const { formatMessage } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  const named = (field, value) =>
    HISTORY_CODED_FIELDS[field] ? formatMessage(`${HISTORY_CODED_FIELDS[field]}.${value}`) : value;
  const subject = (key) => {
    if (key === HISTORY_SUBJECT_APPRAISAL) return formatMessage("history.appraisal");
    if (key === HISTORY_SUBJECT_RETURN) return formatMessage("history.return");
    if (key?.startsWith(HISTORY_SUBJECT_DOCUMENT_PREFIX)) {
      const type = key.slice(HISTORY_SUBJECT_DOCUMENT_PREFIX.length);
      return (documents || []).find((doc) => doc.documentType === type)?.label || type;
    }
    return items.find((item) => item.key === key)?.label || key;
  };
  return (
    <Table
      module={APPRAISAL_MODULE_NAME}
      headers={["history.date", "history.user", "history.subject", "history.changes"]}
      items={history || []}
      itemFormatters={[
        (entry) => formatDateTimeFromISO(modulesManager, intl, entry.date),
        (entry) => entry.user,
        (entry) => subject(entry.subject),
        (entry) => {
          const changes = describeChanges(entry.changes, named);
          if (!changes.length) return formatMessage("history.created");
          return changes.map((line) => (
            <Typography key={line} variant="caption" display="block">
              {line}
            </Typography>
          ));
        },
      ]}
    />
  );
}

export default AppraisalHistory;
