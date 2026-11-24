import React, { useState } from "react";
import { Button, Divider, Grid, Typography } from "@material-ui/core";
import { TextInput, WarningBox, formatDateTimeFromISO, useModulesManager, useTranslations } from "@openimis/fe-core";
import { useIntl } from "react-intl";

import { APPRAISAL_MODULE_NAME } from "../constants";
import useAppraisalStyles from "../styles";
import { lastReopening, refusalCode } from "../util/appraisal";

function DecisionPanel({ appraisal, items, canDecide, saving, error, onDecide }) {
  const classes = useAppraisalStyles();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  const intl = useIntl();
  const [comment, setComment] = useState("");
  const preview = appraisal?.decisionPreview || {};
  const unanswered = preview.unanswered || [];
  const changed = preview.changed || [];
  const reopened = lastReopening(appraisal);
  const labels = (keys) => keys.map((key) => items.find((item) => item.key === key)?.label || key).join(", ");
  if (!canDecide) return null;

  return (
    <>
      <Divider />
      <Grid container alignItems="center" className={classes.item}>
        <Grid item xs={12} className={classes.item}>
          <Typography className={classes.title}>{formatMessage("decision.title")}</Typography>
          {preview.decision && (
            <Typography variant="body2">
              {formatMessageWithValues("decision.preview", {
                decision: formatMessage(`eligibility.${preview.decision}`),
              })}
            </Typography>
          )}
        </Grid>
        {reopened && (
          <WarningBox
            title={formatMessageWithValues("decision.reopened", {
              decision: formatMessage(`status.${reopened.from}`),
              user: reopened.by,
              date: formatDateTimeFromISO(modulesManager, intl, reopened.at),
            })}
            description={reopened.reason}
            xs={12}
          />
        )}
        {!!unanswered.length && (
          <WarningBox
            title={formatMessage("decision.blocked")}
            description={formatMessageWithValues("decision.unanswered", { items: labels(unanswered) })}
            xs={12}
          />
        )}
        {!!changed.length && (
          <WarningBox
            title={formatMessage("decision.blocked")}
            description={formatMessageWithValues("decision.changed", { items: labels(changed) })}
            xs={12}
          />
        )}
        {!!preview.problem && !unanswered.length && !changed.length && (
          <WarningBox
            title={formatMessage("decision.blocked")}
            description={
              refusalCode(preview.problem) ? formatMessage(`refusal.${refusalCode(preview.problem)}`) : preview.problem
            }
            xs={12}
          />
        )}
        <Grid item xs={12} md={9} className={classes.item}>
          <TextInput module={APPRAISAL_MODULE_NAME} label="decision.comment" value={comment} onChange={setComment} />
        </Grid>
        <Grid item xs={12} md={3} className={classes.item}>
          <Button
            fullWidth
            color="primary"
            variant="contained"
            disabled={!appraisal?.canDecide || saving}
            onClick={() => onDecide(comment)}
          >
            {formatMessage("action.decide")}
          </Button>
        </Grid>
        {error && (
          <Grid item xs={12} className={classes.item}>
            <Typography variant="body2" className={classes.warning}>
              {error}
            </Typography>
          </Grid>
        )}
      </Grid>
    </>
  );
}

export default DecisionPanel;
