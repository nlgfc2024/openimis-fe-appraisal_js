import React from "react";
import { Button, Typography } from "@material-ui/core";
import { Table, formatDateTimeFromISO, useModulesManager, useTranslations } from "@openimis/fe-core";
import { useIntl } from "react-intl";

import { APPRAISAL_MODULE_NAME, EMPTY_VALUE } from "../constants";
import useAppraisalStyles from "../styles";
import { parseJson, proposal } from "../util/appraisal";

function EligibilityChecklist({ items, canAnswer, onAnswer }) {
  const classes = useAppraisalStyles();
  const modulesManager = useModulesManager();
  const intl = useIntl();
  const { formatMessage, formatMessageWithValues } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  const result = (value) => (value ? formatMessage(`result.${value}`) : EMPTY_VALUE);

  const headers = [
    "checklist.item",
    "checklist.system",
    "checklist.basis",
    "checklist.officer",
    "checklist.evidence",
    "checklist.decided",
  ];
  const itemFormatters = [
    (item) => (
      <>
        <Typography variant="body2">{item.label}</Typography>
        {item.basisChanged && (
          <Typography variant="caption" className={classes.warning}>
            {formatMessage("checklist.basisChanged")}
          </Typography>
        )}
      </>
    ),
    (item) => {
      const proposed = proposal(item);
      return proposed
        ? formatMessageWithValues("checklist.proposed", { result: result(proposed) })
        : result(item.systemResult);
    },
    (item) => (
      <Typography variant="caption" className={classes.muted}>
        {parseJson(item.basis).note || ""}
      </Typography>
    ),
    (item) => result(item.officerResult),
    (item) => (
      <>
        {item.evidence && <Typography variant="body2">{item.evidence}</Typography>}
        {item.comment && (
          <Typography variant="caption" className={classes.muted}>
            {item.comment}
          </Typography>
        )}
      </>
    ),
    (item) =>
      item.decidedBy ? (
        <Typography variant="caption">
          {item.decidedBy}
          <br />
          {formatDateTimeFromISO(modulesManager, intl, item.decidedAt)}
        </Typography>
      ) : (
        ""
      ),
  ];
  if (canAnswer) {
    headers.push("emptyLabel");
    itemFormatters.push((item) => (
      <Button size="small" color="primary" variant="outlined" onClick={() => onAnswer(item)}>
        {formatMessage(item.officerResult ? "action.change" : "action.answer")}
      </Button>
    ));
  }

  return (
    <Table
      module={APPRAISAL_MODULE_NAME}
      headers={headers}
      itemFormatters={itemFormatters}
      items={items}
      rowHighlighted={(item) => item.basisChanged}
    />
  );
}

export default EligibilityChecklist;
