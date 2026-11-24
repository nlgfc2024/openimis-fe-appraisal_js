import React from "react";
import { Typography } from "@material-ui/core";
import { Table, formatDateTimeFromISO, useModulesManager, useTranslations } from "@openimis/fe-core";
import { useIntl } from "react-intl";

import { APPRAISAL_MODULE_NAME, HISTORY_SUBJECT_APPRAISAL } from "../constants";
import { describeChanges } from "../util/appraisal";

function AppraisalHistory({ history, items }) {
  const modulesManager = useModulesManager();
  const intl = useIntl();
  const { formatMessage } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  const subject = (key) =>
    key === HISTORY_SUBJECT_APPRAISAL ? formatMessage("history.appraisal") : items.find((item) => item.key === key)?.label || key;
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
          const changes = describeChanges(entry.changes);
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
