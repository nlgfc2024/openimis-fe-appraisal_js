import React, { useState } from "react";
import { Button, Divider, Grid, Link, Typography } from "@material-ui/core";
import { TextInput, WarningBox, useModulesManager, useTranslations } from "@openimis/fe-core";

import { APPRAISAL_MODULE_NAME } from "../constants";
import useAppraisalStyles from "../styles";
import { documentProblems, previewDecision } from "../util/appraisal";

function DecisionPanel({ items, documents, documentsComplete, canDecide, saving, error, onDecide, onOpenDocuments }) {
  const classes = useAppraisalStyles();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  const [comment, setComment] = useState("");
  const preview = previewDecision(items);
  const missingDocuments = documentsComplete === false ? documentProblems(documents) : [];
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
        {!!preview.blockers.unanswered.length && (
          <WarningBox
            title={formatMessage("decision.blocked")}
            description={formatMessageWithValues("decision.unanswered", { items: labels(preview.blockers.unanswered) })}
            xs={12}
          />
        )}
        {!!preview.blockers.changed.length && (
          <WarningBox
            title={formatMessage("decision.blocked")}
            description={formatMessageWithValues("decision.changed", { items: labels(preview.blockers.changed) })}
            xs={12}
          />
        )}
        {!!missingDocuments.length && (
          <WarningBox
            title={formatMessage("decision.blocked")}
            description={formatMessageWithValues("decision.documents", {
              count: missingDocuments.length,
              link: (text) => (
                <Link key="documents" component="button" variant="subtitle1" underline="always" onClick={onOpenDocuments}>
                  {text}
                </Link>
              ),
            })}
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
            disabled={!preview.canDecide || !!missingDocuments.length || saving}
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
